import express from "express";
import { 
  createReelUsage, 
  deleteReelUsage, 
  getAllReelUsages, 
  getReelUsageById, 
  updateReelUsage 
} from "../controllers/reelStock/reelUsageController.js";

const router = express.Router();

// Base route for creating and getting all reel usages
router.route("/").post(createReelUsage).get(getAllReelUsages);

// Routes with usageId parameter (matching controller parameter)
router
  .route("/:usageId")
  .get(getReelUsageById)
  .patch(updateReelUsage)
  .delete(deleteReelUsage);

export default router;