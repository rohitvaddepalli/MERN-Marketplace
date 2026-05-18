import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productAPI } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import './Products.css';
import SkeletonProduct from '../../components/Products/SkeletonProduct';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import toast from 'react-hot-toast';
import logger from '../../utils/logger';
import { DEFAULT_PRODUCT_IMAGE } from '../../constants/images';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        category: '',
        search: '',
        sort: '-createdAt',
        brand: '',
        color: '',
        size: '',
    });

    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { isSeller, isAdmin } = useAuth();
    useDocumentTitle('Browse Products');

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const response = await productAPI.getProducts(filters);
            setProducts(response.data.products || []);
        } catch (error) {
            logger.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchProducts();
    }, [filters, fetchProducts]);

    const handleFilterChange = (name, value) => {
        setFilters({ ...filters, [name]: value });
    };

    const handleAddToCart = (e, product) => {
        e.preventDefault();
        addToCart(product, 1);
        toast.success('Product added to cart!');
    };

    const handleBuyNow = (e, product) => {
        e.preventDefault();
        addToCart(product, 1);
        navigate('/checkout');
    };

    return (
        <div className="page-container">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">All Products</h1>
                    <p>Discover amazing products from our sellers</p>
                </div>

                <div className="products-page-content">
                    {/* Filters Sidebar */}
                    <aside className="filters-sidebar">
                        <div className="filter-section">
                            <h3 id="search-heading">Search</h3>
                            <input
                                aria-labelledby="search-heading"
                                id="search-input"
                                type="text"
                                className="form-input"
                                placeholder="Search products..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                            />
                        </div>

                        <div className="filter-section">
                            <h3 id="sort-heading">Sort By</h3>
                            <select
                                aria-labelledby="sort-heading"
                                id="sort-select"
                                className="form-select"
                                value={filters.sort}
                                onChange={(e) => handleFilterChange('sort', e.target.value)}
                            >
                                <option value="-createdAt">Newest</option>
                                <option value="price-asc">Price: Low to High</option>
                                <option value="price-desc">Price: High to Low</option>
                                <option value="rating">Top Rated</option>
                            </select>
                        </div>

                        <div className="filter-section">
                            <h3 id="category-heading">Category</h3>
                            <select
                                aria-labelledby="category-heading"
                                id="category-select"
                                className="form-select"
                                value={filters.category}
                                onChange={(e) => handleFilterChange('category', e.target.value)}
                            >
                                <option value="">All Categories</option>
                                <option value="Electronics">Electronics</option>
                                <option value="Fashion">Fashion</option>
                                <option value="Home & Garden">Home & Garden</option>
                                <option value="Sports">Sports</option>
                                <option value="Books">Books</option>
                                <option value="Toys">Toys</option>
                            </select>
                        </div>

                        <div className="filter-section">
                            <h3 id="brand-heading">Brand</h3>
                            <input
                                aria-labelledby="brand-heading"
                                id="brand-input"
                                type="text"
                                className="form-input"
                                placeholder="Filter by Brand"
                                value={filters.brand}
                                onChange={(e) => handleFilterChange('brand', e.target.value)}
                            />
                        </div>

                        <div className="filter-section">
                            <h3 id="color-heading">Color</h3>
                            <input
                                aria-labelledby="color-heading"
                                id="color-input"
                                type="text"
                                className="form-input"
                                placeholder="Filter by Color"
                                value={filters.color}
                                onChange={(e) => handleFilterChange('color', e.target.value)}
                            />
                        </div>

                        <div className="filter-section">
                            <h3 id="size-heading">Size</h3>
                            <input
                                aria-labelledby="size-heading"
                                id="size-input"
                                type="text"
                                className="form-input"
                                placeholder="Filter by Size"
                                value={filters.size}
                                onChange={(e) => handleFilterChange('size', e.target.value)}
                            />
                        </div>
                    </aside>

                    {/* Products Grid */}
                    <div className="products-main">
                        {loading ? (
                            <div className="products-grid">
                                {[...Array(8)].map((_, i) => (
                                    <SkeletonProduct key={i} />
                                ))}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">
                                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M20 7H4m16 0v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7m16 0l-1-4H5L4 7"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        />
                                    </svg>
                                </div>
                                <h3>No Products Found</h3>
                                <p>Try adjusting your filters</p>
                            </div>
                        ) : (
                            <div className="products-grid">
                                {products.map((product) => (
                                    <div key={product._id} className="product-card">
                                        <Link
                                            to={`/products/${product._id}`}
                                            className="product-link-wrapper"
                                        >
                                            <div className="product-image">
                                                <img
                                                    src={
                                                        product.images?.[0] || DEFAULT_PRODUCT_IMAGE
                                                    }
                                                    alt={product.name}
                                                    loading="lazy"
                                                    onError={(e) =>
                                                        (e.target.src = DEFAULT_PRODUCT_IMAGE)
                                                    }
                                                />
                                                {product.compareAtPrice && (
                                                    <div className="product-badge">Sale</div>
                                                )}
                                            </div>
                                            <div className="product-info">
                                                <h3 className="product-name">{product.name}</h3>
                                                <p className="product-store">
                                                    {product.store?.name}
                                                </p>
                                                <div className="product-footer">
                                                    <div className="product-price">
                                                        <span className="current-price">
                                                            ₹{product.price}
                                                        </span>
                                                        {product.compareAtPrice && (
                                                            <span className="old-price">
                                                                ₹{product.compareAtPrice}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="product-rating">
                                                        {product.rating !== null &&
                                                        isFinite(product.rating) ? (
                                                            <>
                                                                <svg
                                                                    width="16"
                                                                    height="16"
                                                                    viewBox="0 0 20 20"
                                                                    fill="currentColor"
                                                                    aria-hidden="true"
                                                                >
                                                                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                                                </svg>
                                                                <span>{product.rating}</span>
                                                            </>
                                                        ) : (
                                                            <span>—</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                        {!isSeller && !isAdmin && product.stock > 0 && (
                                            <div className="product-actions-inline">
                                                <button
                                                    onClick={(e) => handleAddToCart(e, product)}
                                                    className="btn btn-outline"
                                                    aria-label={`Add ${product.name} to cart`}
                                                >
                                                    Add
                                                </button>
                                                <button
                                                    onClick={(e) => handleBuyNow(e, product)}
                                                    className="btn btn-primary"
                                                    aria-label={`Buy ${product.name} now`}
                                                >
                                                    Buy
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Products;
