import Product from '../models/Product.js';
import Store from '../models/Store.js';
import cache from '../utils/cache.js';

const PRODUCT_LIST_TTL = 60; // 60 seconds for filtered listings
const FEATURED_TTL = 5 * 60; // 5 minutes for featured (rarely changes)

// SECURITY: Whitelist of fields allowed for product updates
// Prevents mass assignment attacks that could modify seller, store, rating, reviewCount, etc.
const ALLOWED_PRODUCT_UPDATE_FIELDS = [
    'name',
    'description',
    'price',
    'compareAtPrice',
    'stock',
    'lowStockThreshold',
    'category',
    'subcategory',
    'brand',
    'images',
    'specifications',
    'variants',
    'tags',
    'isActive',
    'sku',
    'weight',
    'dimensions',
];

// SECURITY: Whitelist of fields allowed for product creation
const ALLOWED_PRODUCT_CREATE_FIELDS = [
    'name',
    'description',
    'price',
    'compareAtPrice',
    'stock',
    'lowStockThreshold',
    'category',
    'subcategory',
    'brand',
    'images',
    'specifications',
    'variants',
    'tags',
    'isActive',
    'sku',
    'weight',
    'dimensions',
];

// Maximum length for search/filter inputs to prevent abuse
const MAX_SEARCH_LENGTH = 100;

/**
 * Escapes special regex characters in a string to prevent ReDoS attacks
 * @param {string} str - Input string
 * @returns {string} - Escaped string safe for use in RegExp
 */
const escapeRegex = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Sanitizes and limits search input
 * @param {string} input - User input
 * @returns {string|null} - Sanitized input or null if invalid
 */
const sanitizeSearchInput = (input) => {
    if (!input || typeof input !== 'string') return null;
    // Trim and limit length
    const trimmed = input.trim().slice(0, MAX_SEARCH_LENGTH);
    // Escape regex special characters
    return escapeRegex(trimmed);
};

/**
 * Helper to pick only allowed fields from an object
 * @param {Object} source - Source object
 * @param {string[]} allowedFields - Array of allowed field names
 * @returns {Object} - Object with only allowed fields
 */
const pickAllowedFields = (source, allowedFields) => {
    const result = {};
    for (const field of allowedFields) {
        if (source[field] !== undefined) {
            result[field] = source[field];
        }
    }
    return result;
};

// @desc    Create product
// @route   POST /api/products
// @access  Private/Seller
export const createProduct = async (req, res) => {
    try {
        // Get seller's store
        const store = await Store.findOne({ owner: req.user._id });

        if (!store) {
            return res.status(400).json({
                success: false,
                message: 'You need to create a store first',
            });
        }

        // SECURITY: Only allow whitelisted fields
        const allowedData = pickAllowedFields(req.body, ALLOWED_PRODUCT_CREATE_FIELDS);

        const product = await Product.create({
            ...allowedData,
            store: store._id,
            seller: req.user._id,
        });

        // Invalidate product listing caches
        await cache.delPattern('products:list:*');
        await cache.del('products:featured');

        res.status(201).json({
            success: true,
            product,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
    try {
        const {
            category,
            subcategory,
            minPrice,
            maxPrice,
            search,
            store,
            sort,
            brand,
            color,
            size,
        } = req.query;
        const query = { isActive: true };

        if (category) query.category = category;
        if (subcategory) query.subcategory = subcategory;
        if (store) query.store = store;
        if (brand) query.brand = brand;

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        // SECURITY: Sanitize color filter to prevent ReDoS
        const safeColor = sanitizeSearchInput(color);
        if (safeColor) {
            query.$or = [
                {
                    variants: {
                        $elemMatch: {
                            name: 'Color',
                            options: { $in: [new RegExp(safeColor, 'i')] },
                        },
                    },
                },
                { 'specifications.Color': { $regex: safeColor, $options: 'i' } },
            ];
        }

        // SECURITY: Sanitize size filter to prevent ReDoS
        const safeSize = sanitizeSearchInput(size);
        if (safeSize) {
            query.$or = [
                {
                    variants: {
                        $elemMatch: { name: 'Size', options: { $in: [new RegExp(safeSize, 'i')] } },
                    },
                },
                { 'specifications.Size': { $regex: safeSize, $options: 'i' } },
            ];
        }

        // SECURITY: Sanitize search input to prevent ReDoS
        const safeSearch = sanitizeSearchInput(search);
        if (safeSearch) {
            query.$text = { $search: safeSearch };
        }

        let sortOption = '-createdAt';
        if (sort === 'price-asc') sortOption = 'price';
        if (sort === 'price-desc') sortOption = '-price';
        if (sort === 'rating') sortOption = '-rating';

        // Pagination setup - supports both cursor-based and page/limit
        const limit = parseInt(req.query.limit, 10) || 50;
        const cursor = req.query.cursor;
        const page = parseInt(req.query.page, 10) || 1;

        // Cache only simple, un-filtered, first-page requests
        const isSimpleRequest = !search && !cursor && page === 1 && !color && !size;
        const cacheKey = isSimpleRequest
            ? `products:list:cat=${category || ''}&sub=${subcategory || ''}&brand=${brand || ''}&sort=${sort || ''}&limit=${limit}&minP=${minPrice || ''}&maxP=${maxPrice || ''}&store=${store || ''}`
            : null;

        if (cacheKey) {
            const hit = await cache.get(cacheKey);
            if (hit) return res.status(200).json({ success: true, ...hit });
        }

        let products, total;

        if (cursor) {
            const cursorDoc = await Product.findById(cursor).select('_id');
            if (!cursorDoc) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid cursor',
                });
            }

            [products, total] = await Promise.all([
                Product.find({ ...query, _id: { $gt: cursorDoc._id } })
                    .populate('store', 'name logo')
                    .populate('seller', 'name')
                    .sort(sortOption)
                    .limit(limit),
                Product.countDocuments(query),
            ]);
        } else {
            const skip = (page - 1) * limit;

            [products, total] = await Promise.all([
                Product.find(query)
                    .populate('store', 'name logo')
                    .populate('seller', 'name')
                    .sort(sortOption)
                    .skip(skip)
                    .limit(limit),
                Product.countDocuments(query),
            ]);
        }

        const nextCursor =
            products.length === limit && cursor ? products[products.length - 1]._id : null;

        const payload = {
            count: products.length,
            total,
            page: cursor ? null : page,
            pages: cursor ? null : Math.ceil(total / limit),
            nextCursor,
            products,
        };

        if (cacheKey) await cache.set(cacheKey, payload, PRODUCT_LIST_TTL);

        res.status(200).json({ success: true, ...payload });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
export const getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('store', 'name logo description contact')
            .populate('seller', 'name email');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        res.status(200).json({
            success: true,
            product,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Seller
export const updateProduct = async (req, res) => {
    try {
        let product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        // Make sure user is product owner
        if (product.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this product',
            });
        }

        // SECURITY: Only allow whitelisted fields to be updated
        const updates = pickAllowedFields(req.body, ALLOWED_PRODUCT_UPDATE_FIELDS);

        product = await Product.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true,
        });

        // Invalidate listing caches
        await cache.delPattern('products:list:*');

        res.status(200).json({
            success: true,
            product,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Seller
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        // Make sure user is product owner
        if (product.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this product',
            });
        }

        await product.deleteOne();

        // Invalidate listing caches
        await cache.delPattern('products:list:*');
        await cache.del('products:featured');

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get seller's products
// @route   GET /api/products/my/products
// @access  Private/Seller
export const getMyProducts = async (req, res) => {
    try {
        const products = await Product.find({ seller: req.user._id })
            .populate('store', 'name')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: products.length,
            products,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
export const getFeaturedProducts = async (req, res) => {
    try {
        const cacheKey = 'products:featured';
        const hit = await cache.get(cacheKey);
        if (hit) return res.status(200).json({ success: true, products: hit });

        const products = await Product.find({ isActive: true })
            .populate('store', 'name logo')
            .sort('-rating')
            .limit(8);

        await cache.set(cacheKey, products, FEATURED_TTL);

        res.status(200).json({
            success: true,
            products,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get low stock products
// @route   GET /api/products/low-stock
// @access  Private/Seller
export const getLowStockProducts = async (req, res) => {
    try {
        const products = await Product.find({
            seller: req.user._id,
            $expr: { $lte: ['$stock', { $ifNull: ['$lowStockThreshold', 10] }] },
        })
            .populate('store', 'name')
            .sort('stock');

        res.status(200).json({
            success: true,
            count: products.length,
            products,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Bulk import products
// @route   POST /api/products/bulk-import
// @access  Private/Seller
export const bulkImportProducts = async (req, res) => {
    try {
        const { products } = req.body;

        // Get seller's store
        const store = await Store.findOne({ owner: req.user._id });

        if (!store) {
            return res.status(400).json({
                success: false,
                message: 'You need to create a store first',
            });
        }

        // Add store and seller to each product
        const productsWithStore = products.map((product) => ({
            ...product,
            store: store._id,
            seller: req.user._id,
        }));

        const createdProducts = await Product.insertMany(productsWithStore);

        res.status(201).json({
            success: true,
            count: createdProducts.length,
            products: createdProducts,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Export products to CSV
// @route   GET /api/products/export
// @access  Private/Seller
export const exportProducts = async (req, res) => {
    try {
        const products = await Product.find({ seller: req.user._id })
            .populate('store', 'name')
            .lean();

        res.status(200).json({
            success: true,
            products,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
