import React, { useState, useEffect } from 'react';
import { orderAPI } from '../../services/api';
import Sidebar from '../../components/Sidebar/Sidebar';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import toast from 'react-hot-toast';
import logger from '../../utils/logger';
import ChatBox from '../../components/Chat/ChatBox';

const OrderManagement = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrders, setExpandedOrders] = useState(new Set());
    const [chatState, setChatState] = useState({ isOpen: false, peerId: null, peerName: '' });
    useDocumentTitle('Order Management');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await orderAPI.getSellerOrders();
            setOrders(response.data.orders || []);
        } catch (error) {
            logger.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await orderAPI.updateOrderStatus(orderId, { status: newStatus });
            toast.success(`Order status updated to ${newStatus}`);
            fetchOrders();
        } catch (error) {
            logger.error('Error updating order status:', error);
            toast.error(error.response?.data?.message || 'Failed to update order status');
        }
    };

    const toggleOrder = (orderId) => {
        const newExpanded = new Set(expandedOrders);
        if (newExpanded.has(orderId)) {
            newExpanded.delete(orderId);
        } else {
            newExpanded.add(orderId);
        }
        setExpandedOrders(newExpanded);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'delivered':
                return 'success';
            case 'shipped':
                return 'info';
            case 'processing':
                return 'warning';
            case 'cancelled':
                return 'danger';
            default:
                return 'primary';
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
            <Sidebar />
            <div style={{ flex: 1, marginLeft: '260px', padding: 'var(--spacing-xl)' }}>
                <div className="container" style={{ padding: 0 }}>
                    <h1 className="page-title">Order Management</h1>
                    <p style={{ marginBottom: 'var(--spacing-xl)' }}>
                        Manage and fulfill customer orders
                    </p>

                    {loading ? (
                        <div className="loading-container">
                            <div className="spinner"></div>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                                    <path
                                        d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    />
                                </svg>
                            </div>
                            <h3>No Orders Yet</h3>
                            <p>Orders from your products will appear here</p>
                        </div>
                    ) : (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 'var(--spacing-md)',
                            }}
                        >
                            {orders.map((order) => (
                                <div
                                    key={order._id}
                                    className="card"
                                    style={{ padding: 0, overflow: 'hidden' }}
                                >
                                    <div
                                        className="card-header"
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: 'var(--spacing-md)',
                                            cursor: 'pointer',
                                            background: expandedOrders.has(order._id)
                                                ? 'var(--bg-secondary)'
                                                : 'var(--bg-card)',
                                            borderBottom: expandedOrders.has(order._id)
                                                ? '1px solid var(--border-color)'
                                                : 'none',
                                        }}
                                        onClick={() => toggleOrder(order._id)}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--spacing-md)',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    transform: expandedOrders.has(order._id)
                                                        ? 'rotate(180deg)'
                                                        : 'rotate(0deg)',
                                                    transition: 'transform 0.2s ease',
                                                }}
                                            >
                                                <svg
                                                    width="20"
                                                    height="20"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <polyline points="6 9 12 15 18 9"></polyline>
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '1rem' }}>
                                                    Order #{order.orderNumber}
                                                </h3>
                                                <span
                                                    style={{
                                                        color: 'var(--text-secondary)',
                                                        fontSize: '0.85rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                    }}
                                                >
                                                    {new Date(order.createdAt).toLocaleDateString()}{' '}
                                                    • {order.customer?.name || 'Customer'}
                                                    {order.customer && (
                                                        <button
                                                            className="btn btn-primary btn-sm"
                                                            style={{
                                                                fontSize: '0.9rem',
                                                                padding: '8px 16px',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                            }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setChatState({
                                                                    isOpen: true,
                                                                    peerId: order.customer._id,
                                                                    peerName: order.customer.name,
                                                                });
                                                            }}
                                                        >
                                                            💬 Chat with Customer
                                                        </button>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--spacing-md)',
                                            }}
                                        >
                                            <span style={{ fontWeight: '600' }}>
                                                ₹{order.totalPrice?.toFixed(2)}
                                            </span>
                                            <span
                                                className={`badge badge-${getStatusColor(order.status)}`}
                                            >
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>

                                    {expandedOrders.has(order._id) && (
                                        <div
                                            className="card-body"
                                            style={{
                                                padding: 'var(--spacing-md)',
                                                borderTop: '1px solid var(--border-color)',
                                            }}
                                        >
                                            <h4 style={{ marginBottom: 'var(--spacing-md)' }}>
                                                Order Items
                                            </h4>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 'var(--spacing-md)',
                                                }}
                                            >
                                                {order.items?.map((item, index) => (
                                                    <div
                                                        key={index}
                                                        style={{
                                                            display: 'flex',
                                                            gap: 'var(--spacing-md)',
                                                            alignItems: 'center',
                                                            padding: 'var(--spacing-sm)',
                                                            background: 'var(--bg-secondary)',
                                                            borderRadius: 'var(--border-radius)',
                                                        }}
                                                    >
                                                        <img
                                                            src={
                                                                item.image ||
                                                                'https://via.placeholder.com/60'
                                                            }
                                                            alt={item.name}
                                                            style={{
                                                                width: '60px',
                                                                height: '60px',
                                                                objectFit: 'cover',
                                                                borderRadius:
                                                                    'var(--border-radius-sm)',
                                                            }}
                                                            onError={(e) =>
                                                                (e.target.src =
                                                                    'https://via.placeholder.com/60')
                                                            }
                                                        />
                                                        <div style={{ flex: 1 }}>
                                                            <h4
                                                                style={{
                                                                    margin: 0,
                                                                    fontSize: '0.95rem',
                                                                }}
                                                            >
                                                                {item.name}
                                                            </h4>
                                                            <p
                                                                style={{
                                                                    margin: 0,
                                                                    color: 'var(--text-secondary)',
                                                                    fontSize: '0.85rem',
                                                                }}
                                                            >
                                                                Qty: {item.quantity} × ₹{item.price}
                                                            </p>
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontWeight: '600',
                                                                color: 'var(--primary-color)',
                                                            }}
                                                        >
                                                            ₹
                                                            {(item.price * item.quantity).toFixed(
                                                                2
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div
                                                style={{
                                                    marginTop: 'var(--spacing-lg)',
                                                    display: 'grid',
                                                    gridTemplateColumns: '1fr 1fr',
                                                    gap: 'var(--spacing-lg)',
                                                }}
                                            >
                                                <div>
                                                    <h4
                                                        style={{
                                                            marginBottom: 'var(--spacing-sm)',
                                                        }}
                                                    >
                                                        Shipping Details
                                                    </h4>
                                                    {order.shippingAddress && (
                                                        <p
                                                            style={{
                                                                margin: 0,
                                                                lineHeight: 1.6,
                                                                color: 'var(--text-secondary)',
                                                                fontSize: '0.9rem',
                                                            }}
                                                        >
                                                            {order.shippingAddress.name}
                                                            <br />
                                                            {order.shippingAddress.street}
                                                            <br />
                                                            {order.shippingAddress.city},{' '}
                                                            {order.shippingAddress.state}{' '}
                                                            {order.shippingAddress.zipCode}
                                                            <br />
                                                            {order.shippingAddress.country}
                                                            <br />
                                                            Phone: {order.shippingAddress.phone}
                                                        </p>
                                                    )}
                                                </div>

                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'flex-end',
                                                        justifyContent: 'flex-end',
                                                    }}
                                                >
                                                    {order.status !== 'delivered' &&
                                                        order.status !== 'cancelled' && (
                                                            <div
                                                                style={{
                                                                    display: 'flex',
                                                                    gap: 'var(--spacing-sm)',
                                                                }}
                                                            >
                                                                {order.status === 'pending' && (
                                                                    <button
                                                                        onClick={() =>
                                                                            handleStatusUpdate(
                                                                                order._id,
                                                                                'processing'
                                                                            )
                                                                        }
                                                                        className="btn btn-secondary btn-sm"
                                                                    >
                                                                        Mark Processing
                                                                    </button>
                                                                )}
                                                                {order.status === 'processing' && (
                                                                    <button
                                                                        onClick={() =>
                                                                            handleStatusUpdate(
                                                                                order._id,
                                                                                'shipped'
                                                                            )
                                                                        }
                                                                        className="btn btn-primary btn-sm"
                                                                    >
                                                                        Mark Shipped
                                                                    </button>
                                                                )}
                                                                {order.status === 'shipped' && (
                                                                    <button
                                                                        onClick={() =>
                                                                            handleStatusUpdate(
                                                                                order._id,
                                                                                'delivered'
                                                                            )
                                                                        }
                                                                        className="btn btn-primary btn-sm"
                                                                    >
                                                                        Mark Delivered
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {chatState.isOpen && (
                <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
                    <ChatBox
                        peerId={chatState.peerId}
                        peerName={chatState.peerName}
                        onClose={() => setChatState({ isOpen: false, peerId: null, peerName: '' })}
                    />
                </div>
            )}
        </div>
    );
};

export default OrderManagement;
