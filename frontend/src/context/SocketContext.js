import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const useSocket = () => {
    const ctx = useContext(SocketContext);
    if (!ctx) throw new Error('useSocket must be used within a SocketProvider');
    return ctx;
};

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const socketRef = useRef(null);
    const [connected, setConnected] = useState(false);
    // Notifications accumulated during the session
    const [notifications, setNotifications] = useState([]);

    const pushNotification = useCallback((notif) => {
        setNotifications(prev => [notif, ...prev].slice(0, 50)); // keep last 50
    }, []);

    useEffect(() => {
        if (!isAuthenticated) {
            // Disconnect if user logs out
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setConnected(false);
            }
            return;
        }

        // Create socket — cookies are sent automatically (withCredentials)
        const socket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        socketRef.current = socket;

        socket.on('connect', () => setConnected(true));
        socket.on('disconnect', () => setConnected(false));

        // Order status changes — show toast and store notification
        socket.on('order:status', (payload) => {
            const msg = `Order #${payload.orderNumber} is now ${payload.status}`;
            toast.success(msg, { duration: 6000, icon: '📦' });
            pushNotification({ type: 'order:status', message: msg, ...payload, readAt: null, createdAt: payload.updatedAt });
        });

        // New order alert (sellers)
        socket.on('order:new', (payload) => {
            const msg = `New order #${payload.orderNumber} — ₹${payload.totalPrice}`;
            toast.success(msg, { duration: 8000, icon: '🛒' });
            pushNotification({ type: 'order:new', message: msg, ...payload, readAt: null, createdAt: new Date().toISOString() });
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
            setConnected(false);
        };
    }, [isAuthenticated, pushNotification]);

    // ── Helpers exposed to consumers ───────────────────────────────────────────

    /** Join a specific order room to track its status in real time */
    const joinOrderRoom = useCallback((orderId) => {
        socketRef.current?.emit('join:order', orderId);
    }, []);

    const leaveOrderRoom = useCallback((orderId) => {
        socketRef.current?.emit('leave:order', orderId);
    }, []);

    /** Join a chat conversation room */
    const joinChat = useCallback((roomId) => {
        socketRef.current?.emit('join:chat', roomId);
    }, []);

    /** Send a chat message to a room */
    const sendMessage = useCallback((roomId, text) => {
        socketRef.current?.emit('chat:message', { roomId, text });
    }, []);

    /** Subscribe to incoming chat messages. Returns unsubscribe fn. */
    const onMessage = useCallback((handler) => {
        const socket = socketRef.current;
        if (!socket) return () => {};
        socket.on('chat:message', handler);
        return () => socket.off('chat:message', handler);
    }, []);

    const markAllRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, readAt: new Date().toISOString() })));
    }, []);

    const unreadCount = notifications.filter(n => !n.readAt).length;

    return (
        <SocketContext.Provider value={{
            socket: socketRef.current,
            connected,
            notifications,
            unreadCount,
            markAllRead,
            joinOrderRoom,
            leaveOrderRoom,
            joinChat,
            sendMessage,
            onMessage
        }}>
            {children}
        </SocketContext.Provider>
    );
};
