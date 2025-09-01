import express from "express";
import { 
  createReelPurchaseEntry,
  deleteReelPurchaseEntry,
  getAllReelPurchaseEntries,
  getReelPurchaseEntryById,
  updateReelPurchaseEntry,
  getReelProductStocksByFactory
} from "../controllers/reelStock/reelPurchaseController.js";

const router = express.Router();

// Main reel purchase routes
router.route("/")
  .get(getAllReelPurchaseEntries)
  .post(createReelPurchaseEntry);

router.route("/:id")
  .get(getReelPurchaseEntryById)
  .patch(updateReelPurchaseEntry)
  .delete(deleteReelPurchaseEntry);

// Additional route for getting reel product stocks by factory
router.route("/stocks/by-factory")
  .get(getReelProductStocksByFactory);

export default router;