import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { orderAPI } from '../../services/api';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import ImageWithFallback from '../../components/Common/ImageWithFallback';
import { DEFAULT_PRODUCT_IMAGE } from '../../constants/images';
import './Dashboard.css';
import logger from '../../utils/logger';
import ChatBox from '../../components/Chat/ChatBox';

const CustomerOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [chatState, setChatState] = useState({ isOpen: false, peerId: null, peerName: '' });

    useDocumentTitle('My Orders');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await orderAPI.getMyOrders();
            setOrders(response.data.orders || []);
        } catch (error) {
            logger.error('Error fetching orders:', error);
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = (orderId) => {
        setSelectedOrderId(orderId);
        setShowCancelModal(true);
    };

    const confirmCancelOrder = async () => {
        if (!selectedOrderId) return;

        try {
            const response = await orderAPI.cancelOrder(selectedOrderId);
            if (response.data.success) {
                toast.success('Order cancelled successfully');
                // Update local state
                setOrders(
                    orders.map((order) =>
                        order._id === selectedOrderId ? { ...order, status: 'cancelled' } : order
                    )
                );
            }
        } catch (error) {
            logger.error('Error cancelling order:', error);
            toast.error(error.response?.data?.message || 'Failed to cancel order');
        } finally {
            setShowCancelModal(false);
            setSelectedOrderId(null);
        }
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
        <div className="page-container">
            <div className="container">
                <h1 className="page-title">My Orders</h1>
                <p style={{ marginBottom: 'var(--spacing-xl)' }}>View and track all your orders</p>

                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                />
                            </svg>
                        </div>
                        <h3>No Orders Yet</h3>
                        <p>You haven't placed any orders</p>
                        <Link
                            to="/products"
                            className="btn btn-primary"
                            style={{ marginTop: '1rem' }}
                        >
                            Browse Products
                        </Link>
                    </div>
                ) : (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--spacing-lg)',
                        }}
                    >
                        {orders.map((order) => (
                            <div key={order._id} className="card">
                                <div
                                    className="card-header"
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                        gap: '1rem',
                                    }}
                                >
                                    <div>
                                        <h3 style={{ margin: 0, marginBottom: '4px' }}>
                                            Order #
                                            {order.orderNumber || order._id.slice(-6).toUpperCase()}
                                        </h3>
                                        <span
                                            style={{
                                                color: 'var(--text-secondary)',
                                                fontSize: '0.9rem',
                                            }}
                                        >
                                            Placed on{' '}
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                        }}
                                    >
                                        <span
                                            className={`badge badge-${getStatusColor(order.status)}`}
                                        >
                                            {order.status}
                                        </span>
                                        {(order.status === 'pending' ||
                                            order.status === 'processing') && (
                                            <button
                                                className="btn btn-outline-danger"
                                                onClick={() => handleCancelOrder(order._id)}
                                                style={{
                                                    padding: '0.4rem 1rem',
                                                    fontSize: '0.9rem',
                                                    border: '1px solid #dc3545',
                                                    color: '#dc3545',
                                                    background: 'transparent',
                                                    borderRadius: '4px',
                                                    transition: 'all 0.2s',
                                                }}
                                                onMouseOver={(e) => {
                                                    e.target.style.background = '#dc3545';
                                                    e.target.style.color = 'white';
                                                }}
                                                onMouseOut={(e) => {
                                                    e.target.style.background = 'transparent';
                                                    e.target.style.color = '#dc3545';
                                                }}
                                            >
                                                Cancel Order
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="card-body">
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
                                                }}
                                            >
                                                <ImageWithFallback
                                                    src={item.product?.images?.[0] || item.image}
                                                    fallbackSrc={DEFAULT_PRODUCT_IMAGE}
                                                    alt={item.name}
                                                    style={{
                                                        width: '80px',
                                                        height: '80px',
                                                        objectFit: 'cover',
                                                        borderRadius: 'var(--border-radius)',
                                                    }}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ margin: 0, marginBottom: '4px' }}>
                                                        {item.name}
                                                    </h4>
                                                    <p
                                                        style={{
                                                            margin: 0,
                                                            color: 'var(--text-secondary)',
                                                            fontSize: '0.9rem',
                                                        }}
                                                    >
                                                        Qty: {item.quantity} × ₹{item.price}
                                                    </p>
                                                    {item.product?.seller && (
                                                        <button
                                                            className="btn btn-primary btn-sm"
                                                            style={{
                                                                marginTop: '8px',
                                                                fontSize: '0.9rem',
                                                                padding: '8px 16px',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                            }}
                                                            onClick={() =>
                                                                setChatState({
                                                                    isOpen: true,
                                                                    peerId: item.product.seller._id,
                                                                    peerName:
                                                                        item.store?.name ||
                                                                        item.product.seller.name ||
                                                                        'Seller',
                                                                })
                                                            }
                                                        >
                                                            💬 Chat with Seller
                                                        </button>
                                                    )}
                                                </div>
                                                <div
                                                    style={{
                                                        fontWeight: '700',
                                                        fontSize: '1.125rem',
                                                        color: 'var(--primary-color)',
                                                    }}
                                                >
                                                    ₹{(item.price * item.quantity).toFixed(2)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div
                                    className="card-footer"
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <div>
                                        <strong>Total:</strong> ₹{order.totalPrice?.toFixed(2)}
                                    </div>
                                    <div>
                                        <strong>Payment:</strong>{' '}
                                        {order.paymentMethod?.toUpperCase()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Cancel Order Confirmation Modal */}
            {showCancelModal && (
                <div className="modal-backdrop" onClick={() => setShowCancelModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Cancel Order</h3>
                        </div>
                        <div className="modal-body">
                            <p>
                                Are you sure you want to cancel this order? This action cannot be
                                undone.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-ghost"
                                onClick={() => setShowCancelModal(false)}
                            >
                                No, Keep Order
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={confirmCancelOrder}
                                style={{ background: '#dc3545', color: 'white' }}
                            >
                                Yes, Cancel Order
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

export default CustomerOrders;
