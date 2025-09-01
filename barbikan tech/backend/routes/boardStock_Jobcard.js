import express from "express"
import { createJobCard, deleteJobCard, getAllJobCards, updateJobCard } from "../controllers/boardStock_JobCard.js";

const router = express.Router();

router.route("/").get(getAllJobCards)
  .post(createJobCard);

  router.route("/:id").delete(deleteJobCard)
  .put(updateJobCard)

export default router;
