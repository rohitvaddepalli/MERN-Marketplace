import React from 'react';
import './Skeleton.css';

export const SkeletonCard = () => (
    <div className="skeleton-card">
        <div className="skeleton skeleton-image"></div>
        <div className="skeleton-card-content">
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton skeleton-text"></div>
            <div className="skeleton skeleton-text short"></div>
        </div>
    </div>
);

export const SkeletonProductCard = () => (
    <div className="skeleton-product-card">
        <div className="skeleton skeleton-product-image"></div>
        <div className="skeleton-product-info">
            <div className="skeleton skeleton-product-name"></div>
            <div className="skeleton skeleton-product-store"></div>
            <div className="skeleton-product-footer">
                <div className="skeleton skeleton-price"></div>
                <div className="skeleton skeleton-rating"></div>
            </div>
        </div>
    </div>
);

export const SkeletonStoreCard = () => (
    <div className="skeleton-store-card">
        <div className="skeleton skeleton-store-banner"></div>
        <div className="skeleton-store-content">
            <div className="skeleton skeleton-store-logo"></div>
            <div className="skeleton skeleton-store-name"></div>
            <div className="skeleton skeleton-store-category"></div>
            <div className="skeleton skeleton-store-stats"></div>
        </div>
    </div>
);

export const SkeletonTable = ({ rows = 5, columns = 4 }) => (
    <div className="skeleton-table">
        <div className="skeleton-table-header">
            {Array.from({ length: columns }).map((_, i) => (
                <div key={i} className="skeleton skeleton-table-header-cell"></div>
            ))}
        </div>
        {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="skeleton-table-row">
                {Array.from({ length: columns }).map((_, colIndex) => (
                    <div key={colIndex} className="skeleton skeleton-table-cell"></div>
                ))}
            </div>
        ))}
    </div>
);

export const SkeletonText = ({ lines = 3, width = '100%' }) => (
    <div className="skeleton-text-block" style={{ width }}>
        {Array.from({ length: lines }).map((_, i) => (
            <div
                key={i}
                className="skeleton skeleton-text-line"
                style={{ width: i === lines - 1 ? '70%' : '100%' }}
            ></div>
        ))}
    </div>
);

export const SkeletonAvatar = ({ size = 'medium' }) => (
    <div className={`skeleton skeleton-avatar skeleton-avatar-${size}`}></div>
);

export const SkeletonButton = ({ width = '120px' }) => (
    <div className="skeleton skeleton-button" style={{ width }}></div>
);

export const SkeletonGrid = ({ items = 8, type = 'product' }) => {
    const SkeletonComponent = type === 'product' ? SkeletonProductCard : SkeletonStoreCard;

    return (
        <div className={`skeleton-grid skeleton-grid-${type}`}>
            {Array.from({ length: items }).map((_, i) => (
                <SkeletonComponent key={i} />
            ))}
        </div>
    );
};

export default {
    Card: SkeletonCard,
    ProductCard: SkeletonProductCard,
    StoreCard: SkeletonStoreCard,
    Table: SkeletonTable,
    Text: SkeletonText,
    Avatar: SkeletonAvatar,
    Button: SkeletonButton,
    Grid: SkeletonGrid
};
