import React, { useState, useEffect, useCallback } from 'react';
import { productAPI, uploadAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import logger from '../../utils/logger';
import './ProductReviews.css';

const ProductReviews = ({ productId, reviews: initialReviews = [] }) => {
    const [reviews, setReviews] = useState(initialReviews);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
    const [loading, setLoading] = useState(false);
    const [mediaFiles, setMediaFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
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

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + mediaFiles.length > 5) {
            toast.error('You can upload a maximum of 5 media files');
            return;
        }
        setMediaFiles([...mediaFiles, ...files]);
    };

    const removeFile = (index) => {
        const updatedFiles = [...mediaFiles];
        updatedFiles.splice(index, 1);
        setMediaFiles(updatedFiles);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            toast.error('Please login to submit a review');
            return;
        }

        try {
            setLoading(true);
            let uploadedMedia = [];

            if (mediaFiles.length > 0) {
                setUploading(true);
                const formData = new FormData();
                mediaFiles.forEach((file) => {
                    formData.append('images', file);
                });

                const uploadRes = await uploadAPI.uploadImages(formData);
                uploadedMedia = uploadRes.data.files;
                setUploading(false);
            }

            const reviewData = {
                ...newReview,
                media: uploadedMedia,
            };

            await productAPI.createReview(productId, reviewData);
            setNewReview({ rating: 5, comment: '' });
            setMediaFiles([]);
            fetchReviews();
            toast.success('Review submitted successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error submitting review');
            setUploading(false);
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
                            <div
                                className="review-stars"
                                role="group"
                                aria-label="Select star rating"
                            >
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
                            <label className="form-label" htmlFor="review-comment">
                                Comment
                            </label>
                            <textarea
                                id="review-comment"
                                className="form-input"
                                rows="3"
                                value={newReview.comment}
                                onChange={(e) =>
                                    setNewReview({ ...newReview, comment: e.target.value })
                                }
                                required
                                placeholder="Share your thoughts about this product..."
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="review-media">
                                Attach Images/Videos (Max 5)
                            </label>
                            <input
                                type="file"
                                id="review-media"
                                multiple
                                accept="image/*,video/*"
                                onChange={handleFileChange}
                                className="form-input"
                            />
                            {mediaFiles.length > 0 && (
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '10px',
                                        flexWrap: 'wrap',
                                        marginTop: '10px',
                                    }}
                                >
                                    {mediaFiles.map((file, index) => (
                                        <div
                                            key={index}
                                            style={{
                                                position: 'relative',
                                                width: '60px',
                                                height: '60px',
                                            }}
                                        >
                                            {file.type.startsWith('video/') ? (
                                                <video
                                                    src={URL.createObjectURL(file)}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        borderRadius: '4px',
                                                    }}
                                                />
                                            ) : (
                                                <img
                                                    src={URL.createObjectURL(file)}
                                                    alt={`preview ${index}`}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        borderRadius: '4px',
                                                    }}
                                                />
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeFile(index)}
                                                style={{
                                                    position: 'absolute',
                                                    top: '-5px',
                                                    right: '-5px',
                                                    background: 'red',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '50%',
                                                    width: '20px',
                                                    height: '20px',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || uploading}
                        >
                            {loading
                                ? uploading
                                    ? 'Uploading Media...'
                                    : 'Submitting...'
                                : 'Submit Review'}
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
                                    <div
                                        className="review-author"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                        }}
                                    >
                                        {review.user?.name || 'Anonymous'}
                                        {review.isVerifiedPurchase && (
                                            <span
                                                style={{
                                                    fontSize: '0.75rem',
                                                    color: 'var(--success-color)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '2px',
                                                    background: 'rgba(40, 167, 69, 0.1)',
                                                    padding: '2px 6px',
                                                    borderRadius: '12px',
                                                }}
                                            >
                                                <svg
                                                    width="12"
                                                    height="12"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                >
                                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                                </svg>
                                                Verified Purchase
                                            </span>
                                        )}
                                    </div>
                                    <div
                                        className="review-rating"
                                        aria-label={`Rating: ${review.rating} out of 5 stars`}
                                    >
                                        <span className="review-stars-filled" aria-hidden="true">
                                            {'★'.repeat(review.rating)}
                                        </span>
                                        <span className="review-stars-empty" aria-hidden="true">
                                            {'★'.repeat(5 - review.rating)}
                                        </span>
                                    </div>
                                </div>
                                <time className="review-date" dateTime={review.createdAt}>
                                    {new Date(review.createdAt).toLocaleDateString()}
                                </time>
                            </div>
                            <p className="review-comment">{review.comment}</p>

                            {review.media && review.media.length > 0 && (
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '10px',
                                        flexWrap: 'wrap',
                                        marginTop: '10px',
                                    }}
                                >
                                    {review.media.map((item, index) =>
                                        item.type === 'video' ? (
                                            <video
                                                key={index}
                                                src={item.url}
                                                controls
                                                style={{
                                                    width: '100px',
                                                    height: '100px',
                                                    objectFit: 'cover',
                                                    borderRadius: '4px',
                                                }}
                                            />
                                        ) : (
                                            <img
                                                key={index}
                                                src={item.url}
                                                alt="Review media"
                                                style={{
                                                    width: '100px',
                                                    height: '100px',
                                                    objectFit: 'cover',
                                                    borderRadius: '4px',
                                                }}
                                            />
                                        )
                                    )}
                                </div>
                            )}
                        </article>
                    ))
                )}
            </div>
        </div>
    );
};

export default ProductReviews;
