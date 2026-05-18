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
 */
const ChatBox = ({ peerId, peerName, onClose }) => {
    const { user } = useAuth();
    const { socket, connected } = useSocket();
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState('');
    const [loadingHistory, setLoadingHistory] = useState(true);
    const endRef = useRef(null);

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
                if (active) setMessages(res.data.messages || []);
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
    // This runs again whenever `socket` changes (e.g. socket connects after mount).
    useEffect(() => {
        if (!socket || !roomId) return;

        // (Re-)join the room every time we get a socket instance
        socket.emit('join:chat', roomId);

        const handler = (msg) => {
            if (msg.roomId === roomId) {
                setMessages((prev) => {
                    // Deduplicate by _id
                    if (prev.some((m) => String(m._id) === String(msg._id))) return prev;
                    return [...prev, msg];
                });
            }
        };

        socket.on('chat:message', handler);
        return () => socket.off('chat:message', handler);
    }, [socket, roomId]);

    // Auto-scroll to bottom whenever messages change
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
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

            <div className="chatbox-messages" aria-live="polite" aria-label="Message history">
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
                            <time className="chatbox-msg-time" dateTime={msg.createdAt}>
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
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
