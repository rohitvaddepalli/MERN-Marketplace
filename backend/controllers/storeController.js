import Store from '../models/Store.js';
import Product from '../models/Product.js';

// @desc    Create store
// @route   POST /api/stores
// @access  Private/Seller
export const createStore = async (req, res) => {
    try {
        const { name, description, category, address, contact, logo, banner } = req.body;

        // Check if seller already has a store
        const existingStore = await Store.findOne({ owner: req.user._id });
        if (existingStore) {
            return res.status(400).json({
                success: false,
                message: 'You already have a store. Each seller can only have one store.'
            });
        }

        const store = await Store.create({
            name,
            description,
            category,
            address,
            contact,
            logo,
            banner,
            owner: req.user._id
        });

        res.status(201).json({
            success: true,
            store
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all stores
// @route   GET /api/stores
// @access  Public
export const getStores = async (req, res) => {
    try {
        const { category, search } = req.query;
        const query = { isActive: true };

        if (category) {
            query.category = category;
        }

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const stores = await Store.find(query)
            .populate('owner', 'name email')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: stores.length,
            stores
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get single store
// @route   GET /api/stores/:id
// @access  Public
export const getStore = async (req, res) => {
    try {
        const store = await Store.findById(req.params.id).populate('owner', 'name email');

        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }

        // Get products for this store
        const products = await Product.find({ store: store._id, isActive: true });

        res.status(200).json({
            success: true,
            store,
            products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// SECURITY: Whitelist of fields allowed for store update
// Prevents mass assignment attacks that could modify owner, isActive, etc.
const ALLOWED_STORE_UPDATE_FIELDS = ['name', 'description', 'category', 'address', 'contact', 'logo', 'banner'];

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

// @desc    Update store
// @route   PUT /api/stores/:id
// @access  Private/Seller
export const updateStore = async (req, res) => {
    try {
        let store = await Store.findById(req.params.id);

        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }

        // Make sure user is store owner
        if (store.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this store'
            });
        }

        // SECURITY: Only allow whitelisted fields to be updated
        const updates = pickAllowedFields(req.body, ALLOWED_STORE_UPDATE_FIELDS);

        store = await Store.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            store
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete store
// @route   DELETE /api/stores/:id
// @access  Private/Seller
export const deleteStore = async (req, res) => {
    try {
        const store = await Store.findById(req.params.id);

        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }

        // Make sure user is store owner
        if (store.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this store'
            });
        }

        await store.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Store deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get seller's store
// @route   GET /api/stores/my/store
// @access  Private/Seller
export const getMyStore = async (req, res) => {
    try {
        const store = await Store.findOne({ owner: req.user._id });

        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'You do not have a store yet'
            });
        }

        // Get products count
        const productsCount = await Product.countDocuments({ store: store._id });

        res.status(200).json({
            success: true,
            store,
            productsCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
