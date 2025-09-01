import express from "express"
import {
  createCompany,
  getAllCompanies,
  deleteCompanyById,
  updateCompany
  
} from "../controllers/boardStockCompany.js";

const router = express.Router();

router.route("/")
  .get(getAllCompanies)
  .post(createCompany)

router.route("/:id")
  .delete(deleteCompanyById).post(updateCompany) // NEW route for DELETE


export default router;
