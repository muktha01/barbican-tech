import express from "express";  
import { createReelSupplier, deleteReelSupplier, getAllReelSuppliers, getReelSupplierById, updateReelSupplier } from "../controllers/reelStock/reelSupplierController.js";
const router = express.Router();

router.route("/").get(getAllReelSuppliers).post(createReelSupplier);

router
  .route("/:supplierId")
  .get(getReelSupplierById)
  .patch(updateReelSupplier)
  .delete(deleteReelSupplier);

export default router;
