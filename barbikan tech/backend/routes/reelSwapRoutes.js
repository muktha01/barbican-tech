import express from "express";
import {
  createReelSwap,
  deleteReelSwap,
  getAllReelSwaps,
  getReelSwapById,
  updateReelSwap,
  getReelProductsWithStock,
  getFactoriesByReelProduct,
  getProductsByType
} from "../controllers/reelStock/reelSwapController.js";

const router = express.Router();

// Base route for creating and getting all reel swaps
router.route("/").get(getAllReelSwaps).post(createReelSwap);

// Additional utility routes
router.route("/products-with-stock").get(getReelProductsWithStock);
router.route("/factories-by-product").get(getFactoriesByReelProduct);
router.route("/products-by-type/:type").get(getProductsByType);

// Routes with reelSwapId parameter (matching controller parameter)
router
  .route("/:reelSwapId")
  .get(getReelSwapById)
  .put(updateReelSwap) // Changed from patch to put to match controller
  .delete(deleteReelSwap);

export default router;