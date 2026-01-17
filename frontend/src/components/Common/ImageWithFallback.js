import React, { useState, useEffect } from 'react';
import { DEFAULT_PRODUCT_IMAGE } from '../../constants/images';

const ImageWithFallback = ({
    src,
    alt,
    fallbackSrc = DEFAULT_PRODUCT_IMAGE,
    className,
    style,
    ...props
}) => {
    const [imgSrc, setImgSrc] = useState(src || fallbackSrc);

    useEffect(() => {
        setImgSrc(src || fallbackSrc);
    }, [src, fallbackSrc]);

    const handleError = () => {
        if (imgSrc !== fallbackSrc) {
            setImgSrc(fallbackSrc);
        }
    };

    return (
        <img
            src={imgSrc}
            alt={alt}
            className={className}
            style={style}
            onError={handleError}
            {...props}
        />
    );
};

export default ImageWithFallback;
