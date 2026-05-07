import React, { useState, useEffect, useCallback } from 'react';
import { productAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import logger from '../../utils/logger';

const ProductReviews = ({ productId, reviews: initialReviews = [] }) => {
    const [reviews, setReviews] = useState(initialReviews);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
    const [loading, setLoading] = useState(false);
    const { isAuthenticated } = useAuth();

    const fetchReviews = useCallback(async () => {
        try {
            const response = await productAPI.getReviews(productId);
            setReviews(response.data.reviews);
        } catch (error) {
            logger.error('Error fetching reviews:', error);
        }
    }, [productId]);

    useEffect(() => {
        if (productId) {
            fetchReviews();
        }
    }, [productId, fetchReviews]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            toast.error('Please login to submit a review');
            return;
        }

        try {
            setLoading(true);
            await productAPI.createReview(productId, newReview);
            setNewReview({ rating: 5, comment: '' });
            fetchReviews(); // Refresh reviews
            toast.success('Review submitted successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error submitting review');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="product-reviews" style={{ marginTop: 'var(--spacing-2xl)' }}>
            <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Customer Reviews</h2>

            {/* Review Form */}
            {isAuthenticated && (
                <div className="review-form" style={{
                    marginBottom: 'var(--spacing-xl)',
                    padding: 'var(--spacing-lg)',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: 'var(--border-radius-lg)'
                }}>
                    <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Write a Review</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Rating</label>
                            <div style={{ display: 'flex', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-sm)' }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setNewReview({ ...newReview, rating: star })}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            fontSize: '1.5rem',
                                            color: star <= newReview.rating ? '#fbbf24' : '#e5e7eb',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Comment</label>
                            <textarea
                                className="form-input"
                                rows="3"
                                value={newReview.comment}
                                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                required
                                placeholder="Share your thoughts about this product..."
                            ></textarea>
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </form>
                </div>
            )}

            {/* Reviews List */}
            <div className="reviews-list">
                {reviews.length === 0 ? (
                    <p style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>No reviews yet. Be the first to review!</p>
                ) : (
                    reviews.map((review) => (
                        <div key={review._id} className="review-item" style={{
                            borderBottom: '1px solid var(--border-color)',
                            padding: 'var(--spacing-lg) 0'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--primary-light)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: 'var(--spacing-md)',
                                    overflow: 'hidden'
                                }}>
                                    {review.user?.avatar ? (
                                        <img src={review.user.avatar} alt={review.user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
                                            {review.user?.name?.charAt(0) || 'U'}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <div style={{ fontWeight: '600' }}>{review.user?.name || 'Anonymous'}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                                        <span style={{ color: '#fbbf24' }}>{'★'.repeat(review.rating)}</span>
                                        <span style={{ color: '#e5e7eb' }}>{'★'.repeat(5 - review.rating)}</span>
                                    </div>
                                </div>
                                <div style={{ marginLeft: 'auto', color: 'var(--text-light)', fontSize: '0.9rem' }}>
                                    {new Date(review.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                            <p style={{ lineHeight: '1.6' }}>{review.comment}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ProductReviews;
