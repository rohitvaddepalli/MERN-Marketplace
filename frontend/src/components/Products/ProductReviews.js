import React, { useState, useEffect, useCallback } from 'react';
import { productAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import logger from '../../utils/logger';
import './ProductReviews.css';

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
            fetchReviews();
            toast.success('Review submitted successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error submitting review');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="product-reviews">
            <h2>Customer Reviews</h2>

            {/* Review Form */}
            {isAuthenticated && (
                <div className="review-form">
                    <h3>Write a Review</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Rating</label>
                            <div className="review-stars" role="group" aria-label="Select star rating">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setNewReview({ ...newReview, rating: star })}
                                        className={`review-star-btn ${star <= newReview.rating ? 'active' : ''}`}
                                        aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                                        aria-pressed={star === newReview.rating}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="review-comment">Comment</label>
                            <textarea
                                id="review-comment"
                                className="form-input"
                                rows="3"
                                value={newReview.comment}
                                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                required
                                placeholder="Share your thoughts about this product..."
                            />
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
                    <p className="reviews-empty">No reviews yet. Be the first to review!</p>
                ) : (
                    reviews.map((review) => (
                        <article key={review._id} className="review-item">
                            <div className="review-header">
                                <div className="review-avatar" aria-hidden="true">
                                    {review.user?.avatar ? (
                                        <img src={review.user.avatar} alt={review.user.name} />
                                    ) : (
                                        <span className="review-avatar-initial">
                                            {review.user?.name?.charAt(0) || 'U'}
                                        </span>
                                    )}
                                </div>
                                <div className="review-meta">
                                    <div className="review-author">{review.user?.name || 'Anonymous'}</div>
                                    <div className="review-rating" aria-label={`Rating: ${review.rating} out of 5 stars`}>
                                        <span className="review-stars-filled" aria-hidden="true">{'★'.repeat(review.rating)}</span>
                                        <span className="review-stars-empty" aria-hidden="true">{'★'.repeat(5 - review.rating)}</span>
                                    </div>
                                </div>
                                <time className="review-date" dateTime={review.createdAt}>
                                    {new Date(review.createdAt).toLocaleDateString()}
                                </time>
                            </div>
                            <p className="review-comment">{review.comment}</p>
                        </article>
                    ))
                )}
            </div>
        </div>
    );
};

export default ProductReviews;
