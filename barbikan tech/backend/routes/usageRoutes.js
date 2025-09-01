import express from "express";
import {
  createUsage,
  getAllUsages,
  getUsageById,
  updateUsage,
  deleteUsage,
} from "../controllers/usageController.js";

const router = express.Router();

router.route("/").post(createUsage).get(getAllUsages);

router
  .route("/:usageId")
  .get(getUsageById)
  .patch(updateUsage)
  .delete(deleteUsage);

export default router;
