import express from "express";
import { 
  createReelProductForMultipleFactories,
  updateReelProduct,
  deleteReelProduct,
  deleteReelProductStock,
  getAllReelProductsWithStocks,
  getReelProductWithStocks
} from "../controllers/reelStock/reelProductController.js";

const router = express.Router();

// Main reel product routes
router.route("/")
  .post(createReelProductForMultipleFactories)  // Updated function name
  .get(getAllReelProductsWithStocks);           // Updated function name

router.route("/:productId")
  .get(getReelProductWithStocks)                // Updated function name
  .patch(updateReelProduct)
  .delete(deleteReelProduct);

// Route for deleting specific stock records
router.route("/stock/:stockId")
  .delete(deleteReelProductStock);

export default router;