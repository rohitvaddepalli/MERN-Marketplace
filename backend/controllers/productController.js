import Product from '../models/Product.js';
import Store from '../models/Store.js';
import { sanitizeSearchInput } from '../utils/securityUtils.js';

// SECURITY: Whitelist of fields allowed for product updates
// Prevents mass assignment attacks that could modify seller, store, rating, reviewCount, etc.
const ALLOWED_PRODUCT_UPDATE_FIELDS = [
    'name', 'description', 'price', 'compareAtPrice', 'stock', 'lowStockThreshold',
    'category', 'subcategory', 'brand', 'images', 'specifications', 'variants',
    'tags', 'isActive', 'sku', 'weight', 'dimensions'
];

// SECURITY: Whitelist of fields allowed for product creation
const ALLOWED_PRODUCT_CREATE_FIELDS = [
    'name', 'description', 'price', 'compareAtPrice', 'stock', 'lowStockThreshold',
    'category', 'subcategory', 'brand', 'images', 'specifications', 'variants',
    'tags', 'isActive', 'sku', 'weight', 'dimensions'
];

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
                message: 'You need to create a store first'
            });
        }

        // SECURITY: Only allow whitelisted fields
        const allowedData = pickAllowedFields(req.body, ALLOWED_PRODUCT_CREATE_FIELDS);

        const product = await Product.create({
            ...allowedData,
            store: store._id,
            seller: req.user._id
        });

        res.status(201).json({
            success: true,
            product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
    try {
        const { category, subcategory, minPrice, maxPrice, search, store, sort, brand, color, size } = req.query;
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
                { 'variants': { $elemMatch: { name: 'Color', options: { $in: [new RegExp(safeColor, 'i')] } } } },
                { 'specifications.Color': { $regex: safeColor, $options: 'i' } }
            ];
        }

        // SECURITY: Sanitize size filter to prevent ReDoS
        const safeSize = sanitizeSearchInput(size);
        if (safeSize) {
            query.$or = [
                { 'variants': { $elemMatch: { name: 'Size', options: { $in: [new RegExp(safeSize, 'i')] } } } },
                { 'specifications.Size': { $regex: safeSize, $options: 'i' } }
            ];
        }

        // SECURITY: Sanitize search input to prevent ReDoS
        const safeSearch = sanitizeSearchInput(search);
        if (safeSearch) {
            query.$or = [
                { name: { $regex: safeSearch, $options: 'i' } },
                { description: { $regex: safeSearch, $options: 'i' } },
                { brand: { $regex: safeSearch, $options: 'i' } }
            ];
        }

        let sortOption = '-createdAt';
        if (sort === 'price-asc') sortOption = 'price';
        if (sort === 'price-desc') sortOption = '-price';
        if (sort === 'rating') sortOption = '-rating';

        // Pagination setup
        const page = parseInt(req.query.page, 10) || 1;
        // Default limit of 50 to bound the query while providing enough items for typical display
        const limit = parseInt(req.query.limit, 10) || 50;
        const skip = (page - 1) * limit;

        const [products, total] = await Promise.all([
            Product.find(query)
                .populate('store', 'name logo')
                .populate('seller', 'name')
                .sort(sortOption)
                .skip(skip)
                .limit(limit),
            Product.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            count: products.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
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
                message: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
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
                message: 'Product not found'
            });
        }

        // Make sure user is product owner
        if (product.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this product'
            });
        }

        // SECURITY: Only allow whitelisted fields to be updated
        const updates = pickAllowedFields(req.body, ALLOWED_PRODUCT_UPDATE_FIELDS);

        product = await Product.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
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
                message: 'Product not found'
            });
        }

        // Make sure user is product owner
        if (product.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this product'
            });
        }

        await product.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
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
            products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
export const getFeaturedProducts = async (req, res) => {
    try {
        const products = await Product.find({ isActive: true })
            .populate('store', 'name logo')
            .sort('-rating')
            .limit(8);

        res.status(200).json({
            success: true,
            products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
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
            $expr: { $lte: ['$stock', { $ifNull: ['$lowStockThreshold', 10] }] }
        })
            .populate('store', 'name')
            .sort('stock');

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
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
                message: 'You need to create a store first'
            });
        }

        // Add store and seller to each product
        const productsWithStore = products.map(product => ({
            ...product,
            store: store._id,
            seller: req.user._id
        }));

        const createdProducts = await Product.insertMany(productsWithStore);

        res.status(201).json({
            success: true,
            count: createdProducts.length,
            products: createdProducts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
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
            products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
