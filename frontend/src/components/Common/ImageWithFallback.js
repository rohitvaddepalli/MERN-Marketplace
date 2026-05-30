import React, { useState } from 'react';
import { DEFAULT_PRODUCT_IMAGE } from '../../constants/images';

/**
 * ImageWithFallback — performance-optimised image with graceful fallback.
 *
 * Improvements over the original:
 * - Derives imgSrc directly from props (no useState/useEffect round-trip).
 * - Defaults loading="lazy" and decoding="async" for below-fold images.
 * - Callers can override with loading="eager" for LCP/hero images.
 */
const ImageWithFallback = ({
    src,
    alt,
    fallbackSrc = DEFAULT_PRODUCT_IMAGE,
    className,
    style,
    loading = 'lazy',
    decoding = 'async',
    ...props
}) => {
    // Track whether we need to show the fallback (only needed when src fails).
    // We do NOT store the src itself in state — it's derived from props directly.
    const [useFallback, setUseFallback] = useState(false);

    const imgSrc = useFallback ? fallbackSrc : (src || fallbackSrc);

    const handleError = () => {
        if (!useFallback) {
            setUseFallback(true);
        }
    };

    return (
        <img
            src={imgSrc}
            alt={alt}
            className={className}
            style={style}
            loading={loading}
            decoding={decoding}
            onError={handleError}
            {...props}
        />
    );
};

export default ImageWithFallback;
