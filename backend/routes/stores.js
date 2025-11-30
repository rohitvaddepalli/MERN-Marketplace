import express from 'express';
import {
    createStore,
    getStores,
    getStore,
    updateStore,
    deleteStore,
    getMyStore
} from '../controllers/storeController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
    .get(getStores)
    .post(protect, authorize('seller'), createStore);

router.get('/my/store', protect, authorize('seller'), getMyStore);

router.route('/:id')
    .get(getStore)
    .put(protect, authorize('seller'), updateStore)
    .delete(protect, authorize('seller'), deleteStore);

export default router;
