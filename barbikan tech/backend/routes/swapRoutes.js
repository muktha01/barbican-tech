// routes/swapRoutes.js
import express from 'express';
import { createSwap, deleteSwap, getAllSwaps, getFactoriesByProduct, getProductsByType, getSwapById, updateSwap } from '../controllers/swapController.js';

const router = express.Router();

// Create a new swap
router.post('/', createSwap);

// Get all swaps
router.get('/', getAllSwaps);

// Get products by type with stock information
router.get('/products-by-type/:type', getProductsByType);

// Get factories by product (excluding specified factory)
router.get('/factories-by-product', getFactoriesByProduct);

// Get swap by ID
router.get('/:swapId', getSwapById);

// Update swap by ID
router.put('/:swapId', updateSwap);

// Delete swap by ID
router.delete('/:swapId', deleteSwap);

export default router;