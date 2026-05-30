import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { chatAPI } from '../../services/api';
import './ChatBox.css';

/**
 * ChatBox — buyer ↔ seller real-time messaging with persistent history.
 *
 * Props:
 *   peerId   {string}  MongoDB _id of the other participant
 *   peerName {string}  Display name of the other participant
 *   onClose  {fn}      Called when user closes the chat
 *
 * Performance improvements:
 *   - Timestamps are formatted once when a message enters state (not on every render).
 *   - Deduplication uses a Set in a useRef for O(1) lookups instead of Array.some O(n²).
 *   - Messages are capped at MAX_MESSAGES to avoid unbounded growth.
 *   - Auto-scroll only fires when the user is already near the bottom of the container.
 */

const MAX_MESSAGES = 200;
const SCROLL_THRESHOLD = 100; // px from bottom to consider "near bottom"

/** Format a timestamp string once; returns a human-readable HH:MM string. */
function formatTime(isoString) {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });
}

/** Enrich a raw message object with a precomputed formatted timestamp. */
function enrichMessage(msg) {
    return { ...msg, _formattedTime: formatTime(msg.createdAt) };
}

const ChatBox = ({ peerId, peerName, onClose }) => {
    const { user } = useAuth();
    const { socket, connected } = useSocket();
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState('');
    const [loadingHistory, setLoadingHistory] = useState(true);
    const endRef = useRef(null);
    const scrollContainerRef = useRef(null);

    // O(1) deduplication: tracks seen message _id values
    const seenIdsRef = useRef(new Set());

    // Deterministic room ID from the two sorted user IDs
    // Guard: if peerId is missing (product/seller not populated), bail out
    const roomId = peerId ? [user._id, peerId].sort().join('_') : null;

    // Load history once on first mount
    useEffect(() => {
        if (!roomId) return;
        let active = true;
        const init = async () => {
            try {
                const res = await chatAPI.getMessages(roomId);
                if (active) {
                    const enriched = (res.data.messages || []).map(enrichMessage);
                    // Seed the seen-ids set from history
                    enriched.forEach((m) => m._id && seenIdsRef.current.add(String(m._id)));
                    setMessages(enriched);
                }
            } catch {
                // no history yet — fine
            } finally {
                if (active) setLoadingHistory(false);
            }
        };
        init();
        return () => {
            active = false;
        };
    }, [roomId]);

    // Join the chat room AND subscribe to incoming messages.
    useEffect(() => {
        if (!socket || !roomId) return;

        socket.emit('join:chat', roomId);

        const handler = (msg) => {
            if (msg.roomId !== roomId) return;
            const idStr = String(msg._id);
            // O(1) dedup check via Set
            if (seenIdsRef.current.has(idStr)) return;
            seenIdsRef.current.add(idStr);

            const enriched = enrichMessage(msg);
            setMessages((prev) => {
                const next = [...prev, enriched];
                // Cap total messages to avoid unbounded memory growth
                return next.length > MAX_MESSAGES ? next.slice(next.length - MAX_MESSAGES) : next;
            });
        };

        socket.on('chat:message', handler);
        return () => socket.off('chat:message', handler);
    }, [socket, roomId]);

    // Auto-scroll to bottom — only when the user is already near the bottom.
    // This avoids forcing scroll and causing jank when the user has scrolled up.
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const distanceFromBottom =
            container.scrollHeight - container.scrollTop - container.clientHeight;
        if (distanceFromBottom <= SCROLL_THRESHOLD) {
            endRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSend = useCallback(
        (e) => {
            e.preventDefault();
            const text = draft.trim();
            if (!text || !connected || !socket) return;
            socket.emit('chat:message', { roomId, text });
            setDraft('');
        },
        [draft, connected, socket, roomId]
    );

    // If peerId is not available, show a friendly message instead of crashing
    // This must be placed after all hooks to obey Rules of Hooks
    if (!peerId) {
        return (
            <div className="chatbox" role="dialog" aria-label="Chat unavailable">
                <div className="chatbox-header">
                    <strong>{peerName || 'Chat'}</strong>
                    <button className="chatbox-close" onClick={onClose} aria-label="Close chat">
                        ✕
                    </button>
                </div>
                <p className="chatbox-empty" style={{ padding: '1rem' }}>
                    Chat is unavailable for this order. The seller information hasn't loaded yet —
                    please refresh the page and try again.
                </p>
            </div>
        );
    }

    return (
        <div className="chatbox" role="dialog" aria-label={`Chat with ${peerName}`}>
            <div className="chatbox-header">
                <div className="chatbox-peer">
                    <span
                        className={`chatbox-status ${connected ? 'online' : 'offline'}`}
                        aria-hidden="true"
                    />
                    <strong>{peerName}</strong>
                </div>
                <button className="chatbox-close" onClick={onClose} aria-label="Close chat">
                    ✕
                </button>
            </div>

            <div
                ref={scrollContainerRef}
                className="chatbox-messages"
                aria-live="polite"
                aria-label="Message history"
            >
                {loadingHistory && <p className="chatbox-empty">Loading messages…</p>}
                {!loadingHistory && messages.length === 0 && (
                    <p className="chatbox-empty">No messages yet. Say hello! 👋</p>
                )}
                {messages.map((msg, i) => {
                    const senderId = msg.sender?._id ?? msg.sender;
                    const isMine = String(senderId) === String(user._id);
                    return (
                        <div
                            key={msg._id || i}
                            className={`chatbox-msg ${isMine ? 'mine' : 'theirs'}`}
                        >
                            {!isMine && (
                                <span className="chatbox-msg-author">{msg.sender?.name}</span>
                            )}
                            <p className="chatbox-msg-text">{msg.text}</p>
                            {/* Use precomputed time — no Date parsing on every render */}
                            <time className="chatbox-msg-time" dateTime={msg.createdAt}>
                                {msg._formattedTime}
                            </time>
                        </div>
                    );
                })}
                <div ref={endRef} />
            </div>

            <form className="chatbox-form" onSubmit={handleSend}>
                <label htmlFor="chat-input" className="sr-only">
                    Message
                </label>
                <input
                    id="chat-input"
                    className="chatbox-input"
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={connected ? 'Type a message…' : 'Connecting…'}
                    disabled={!connected}
                    maxLength={500}
                    autoComplete="off"
                />
                <button
                    type="submit"
                    className="chatbox-send btn btn-primary"
                    disabled={!draft.trim() || !connected}
                    aria-label="Send message"
                >
                    Send
                </button>
            </form>
        </div>
    );
};

export default ChatBox;
