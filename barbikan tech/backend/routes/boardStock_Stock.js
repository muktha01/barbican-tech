import express from "express"
import { createStock, deleteStockDataById, getAllStocks, getDistributedCompanyByID,  updateStockById,
  getStockById, } from "../controllers/boardStock_Stock.js";

const router = express.Router();

router.route("/")
  .get(getAllStocks)
  .post(createStock);


  router.route("/:id").delete(deleteStockDataById).get(getDistributedCompanyByID); // NEW route for DELETE
  
  router.put('/boardstock_stock/:id', updateStockById)
  router.get('/boardstock_stock/single/:id', getStockById);

 

export default router;
