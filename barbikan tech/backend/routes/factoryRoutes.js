import { Router } from "express";
import {
  createFactory,
  deleteFactory,
  getAllFactories,
  getFactoryById,
  updateFactory,
} from "../controllers/factoryController.js";

const router = Router();

router.route("/").get(getAllFactories).post(createFactory);

router
  .route("/:factoryId")
  .get(getFactoryById)
  .patch(updateFactory)
  .delete(deleteFactory);

export default router;
