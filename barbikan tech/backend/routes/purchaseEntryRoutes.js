import express from "express";

import {
  createPurchaseEntry,
  getAllPurchaseEntries,
  getPurchaseEntryById,
  updatePurchaseEntry,
  deletePurchaseEntry,
} from "../controllers/purchaseEntryController.js";

const router = express.Router();

router.route("/").get(getAllPurchaseEntries).post(createPurchaseEntry);

router
  .route("/:id")
  .get(getPurchaseEntryById)
  .patch(updatePurchaseEntry)
  .delete(deletePurchaseEntry);

export default router;
