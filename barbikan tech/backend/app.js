import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import factoryRoutes from "./routes/factoryRoutes.js";
import swapRoutes from "./routes/swapRoutes.js";
import purchaseEntryRoutes from "./routes/purchaseEntryRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import usageRoutes from "./routes/usageRoutes.js";
import boardStockRoutes from "./routes/boardStockCompany.js"
import boardStockDistributors from './routes/boardStockDistributorCompany.js'
import boardStockStock from './routes/boardStock_Stock.js'
import boardStockJobCards from './routes/boardStock_Jobcard.js'
import { errorHandler } from "./middleware/errorMiddleware.js";

import reelProudcts from "./routes/reelProductRoutes.js";
import reelPurchase from "./routes/reelPurchaseEntryRoutes.js";
import reelSupplier from "./routes/reelSupplierRoutes.js";
import reelUsage from "./routes/reelUsageRoutes.js";    
import reelSwap from "./routes/reelSwapRoutes.js"; 
const app = express();

app.use(
  cors({
    origin: "http://localhost:5174",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/api/auth", userRoutes);
app.use("/api/factories", factoryRoutes);
app.use("/api/swaps", swapRoutes);
app.use("/api/purchase-entries", purchaseEntryRoutes);
app.use("/api/suppliers", supplierRoutes);

app.use("/api/products", productRoutes);
app.use("/api/usages", usageRoutes);
app.use("/api/boardstock",boardStockRoutes);
app.use("/api/distributorCompany",boardStockDistributors);
app.use("/api/boardstock_stock",boardStockStock);
app.use("/api/jobcard",boardStockJobCards)

app.use("/api/reelProducts", reelProudcts);
app.use("/api/reelPurchase", reelPurchase);
app.use("/api/reelSupplier", reelSupplier);
app.use("/api/reelUsage", reelUsage);
app.use("/api/reelSwap", reelSwap);

// Add other routes as needed

// Invalid route handler
app.use((req, res, next) => {
  res.status(404).json({
    message: `Route not found: ${req.originalUrl}`,
  });
});

app.use(errorHandler);

export default app;