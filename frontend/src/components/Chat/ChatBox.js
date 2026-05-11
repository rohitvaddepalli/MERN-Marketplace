import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import './ChatBox.css';

/**
 * ChatBox — buyer ↔ seller real-time messaging.
 *
 * Props:
 *   peerId   {string}  MongoDB _id of the other participant
 *   peerName {string}  Display name of the other participant
 *   onClose  {fn}      Called when user closes the chat
 */
const ChatBox = ({ peerId, peerName, onClose }) => {
    const { user } = useAuth();
    const { joinChat, sendMessage, onMessage, connected } = useSocket();
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState('');
    const endRef = useRef(null);

    // Deterministic room ID from the two sorted user IDs
    const roomId = [user._id, peerId].sort().join('_');

    useEffect(() => {
        joinChat(roomId);
        const unsub = onMessage((msg) => {
            if (msg.roomId === roomId) {
                setMessages(prev => [...prev, msg]);
            }
        });
        return unsub;
    }, [roomId, joinChat, onMessage]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = useCallback((e) => {
        e.preventDefault();
        const text = draft.trim();
        if (!text || !connected) return;
        sendMessage(roomId, text);
        setDraft('');
    }, [draft, connected, roomId, sendMessage]);

    return (
        <div className="chatbox" role="dialog" aria-label={`Chat with ${peerName}`}>
            <div className="chatbox-header">
                <div className="chatbox-peer">
                    <span className={`chatbox-status ${connected ? 'online' : 'offline'}`} aria-hidden="true" />
                    <strong>{peerName}</strong>
                </div>
                <button
                    className="chatbox-close"
                    onClick={onClose}
                    aria-label="Close chat"
                >✕</button>
            </div>

            <div className="chatbox-messages" aria-live="polite" aria-label="Message history">
                {messages.length === 0 && (
                    <p className="chatbox-empty">No messages yet. Say hello! 👋</p>
                )}
                {messages.map((msg, i) => {
                    const isMine = msg.sender?._id === user._id;
                    return (
                        <div key={i} className={`chatbox-msg ${isMine ? 'mine' : 'theirs'}`}>
                            {!isMine && (
                                <span className="chatbox-msg-author">{msg.sender?.name}</span>
                            )}
                            <p className="chatbox-msg-text">{msg.text}</p>
                            <time className="chatbox-msg-time" dateTime={msg.createdAt}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </time>
                        </div>
                    );
                })}
                <div ref={endRef} />
            </div>

            <form className="chatbox-form" onSubmit={handleSend}>
                <label htmlFor="chat-input" className="sr-only">Message</label>
                <input
                    id="chat-input"
                    className="chatbox-input"
                    type="text"
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
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
                >Send</button>
            </form>
        </div>
    );
};

export default ChatBox;
