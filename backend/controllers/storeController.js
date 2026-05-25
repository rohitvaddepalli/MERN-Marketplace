import Store from '../models/Store.js';
import Product from '../models/Product.js';
import { BaseController } from './BaseController.js';
import { sanitizeSearchInput } from '../utils/sanitize.js';

// SECURITY: Whitelist of fields allowed for store update
// Prevents mass assignment attacks that could modify owner, isActive, etc.
const ALLOWED_STORE_UPDATE_FIELDS = [
    'name',
    'description',
    'category',
    'address',
    'contact',
    'logo',
    'banner',
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

class StoreController extends BaseController {
    // @desc    Create store
    // @route   POST /api/stores
    // @access  Private/Seller
    createStore = async (req, res) => {
        const { name, description, category, address, contact, logo, banner } = req.body;

        // Check if seller already has a store
        const existingStore = await Store.findOne({ owner: req.user._id });
        if (existingStore) {
            return res.status(400).json({
                success: false,
                message: 'You already have a store. Each seller can only have one store.',
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
            owner: req.user._id,
        });

        this.handleSuccess(res, { store }, 201);
    };

    // @desc    Get all stores
    // @route   GET /api/stores
    // @access  Public
    getStores = async (req, res) => {
        const { category, search } = req.query;
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
        const skip = (page - 1) * limit;

        const query = { isActive: true };

        if (category) {
            query.category = category;
        }

        const safeSearch = sanitizeSearchInput(search);
        if (safeSearch) {
            query.name = { $regex: safeSearch, $options: 'i' };
        }

        const [stores, total] = await Promise.all([
            Store.find(query)
                .populate('owner', 'name email')
                .sort('-createdAt')
                .skip(skip)
                .limit(limit),
            Store.countDocuments(query),
        ]);

        this.handleSuccess(res, {
            count: stores.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            stores,
        }, 200);
    };

    // @desc    Get single store
    // @route   GET /api/stores/:id
    // @access  Public
    getStore = async (req, res) => {
        // PERF: Fetch store and its first 20 products in parallel
        const [store, products] = await Promise.all([
            Store.findById(req.params.id).populate('owner', 'name email'),
            Product.find({ store: req.params.id, isActive: true }).limit(20),
        ]);

        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Store not found',
            });
        }

        this.handleSuccess(res, {
            store,
            products,
        }, 200);
    };

    // @desc    Update store
    // @route   PUT /api/stores/:id
    // @access  Private/Seller
    updateStore = async (req, res) => {
        let store = await Store.findById(req.params.id);

        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Store not found',
            });
        }

        // Make sure user is store owner
        if (store.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this store',
            });
        }

        // SECURITY: Only allow whitelisted fields to be updated
        const updates = pickAllowedFields(req.body, ALLOWED_STORE_UPDATE_FIELDS);

        store = await Store.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true,
        });

        this.handleSuccess(res, { store }, 200);
    };

    // @desc    Delete store
    // @route   DELETE /api/stores/:id
    // @access  Private/Seller
    deleteStore = async (req, res) => {
        const store = await Store.findById(req.params.id);

        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Store not found',
            });
        }

        // Make sure user is store owner
        if (store.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this store',
            });
        }

        await store.deleteOne();

        this.handleSuccess(res, { message: 'Store deleted successfully' }, 200);
    };

    // @desc    Get seller's store
    // @route   GET /api/stores/my/store
    // @access  Private/Seller
    getMyStore = async (req, res) => {
        const store = await Store.findOne({ owner: req.user._id });

        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'You do not have a store yet',
            });
        }

        // Get products count
        const productsCount = await Product.countDocuments({ store: store._id });

        this.handleSuccess(res, {
            store,
            productsCount,
        }, 200);
    };
}

export default new StoreController();
