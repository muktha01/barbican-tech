import express from "express";
import {
  createSupplier,
  getAllSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} from "../controllers/supplierController.js";

const router = express.Router();

router.route("/").get(getAllSuppliers).post(createSupplier);

router
  .route("/:supplierId")
  .get(getSupplierById)
  .patch(updateSupplier)
  .delete(deleteSupplier);

export default router;
