import React from 'react';
import './SkeletonProduct.css';

const SkeletonProduct = () => {
    return (
        <div className="skeleton-card">
            <div className="skeleton-image"></div>
            <div className="skeleton-content">
                <div className="skeleton-line title"></div>
                <div className="skeleton-line store"></div>
                <div className="skeleton-line price"></div>
            </div>
        </div>
    );
};

export default SkeletonProduct;
