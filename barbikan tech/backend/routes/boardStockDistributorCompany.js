import express from "express"
import { createDistributorCompany, deleteDistributorCompanyById, getAllDistributorCompanies, getDistributedCompanyByID, updateDistributorCompanyById } from "../controllers/boardStockDistributorCompany.js";


const router = express.Router();

router.route("/")
  .get(getAllDistributorCompanies)
  .post(createDistributorCompany);

  router.route("/:id").get(getDistributedCompanyByID)
    .delete(deleteDistributorCompanyById)
    .put(updateDistributorCompanyById)

export default router;