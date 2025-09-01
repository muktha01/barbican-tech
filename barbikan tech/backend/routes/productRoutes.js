import express from "express";
import {
  createProductForMultipleFactories,
  getAllProductsWithStocks,
  getProductWithStocks,
  updateProduct,
  deleteProduct,
  deleteProductStock
} from "../controllers/productController.js";

const router = express.Router();

// Main routes
router.route("/")
  .post(createProductForMultipleFactories)
  .get(getAllProductsWithStocks);

// Product-specific routes
router.route("/:productId")
  .get(getProductWithStocks)
  .put(updateProduct)
  .delete(deleteProduct);

// Stock-specific routes
router.route("/stock/:stockId")
  .delete(deleteProductStock);

export default router;