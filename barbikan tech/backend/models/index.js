import Factory from "./Factory.js";
import User from "./User.js";
import Supplier from "./Supplier.js";
import Product from "./Product.js";
import Swap from "./Swap.js";
import PurchaseEntry from "./PurchaseEntry.js";
import Usage from "./Usage.js";
import Company from "./BoardStockCompany.js";
import DistributorCompany from "./BoardStockDistributorCompany.js";
import BoardStock_Stock from "./BoardStock_Stock.js";
import JobCard from "./BoardStock_JobCard.js";
import ReelProduct from "./ReelProduct.js";
import ReelPurchaseEntry from "./ReelPurchaseEntry.js";
import ReelSupplier from "./ReelSupplier.js";
import ReelUsage from "./ReelUsage.js";
import ReelSwap from "./ReelSwap.js";
import ProductStock from "./ProductStock.js";
import ReelProductStock from "./ReelProductStock.js";

// 1️⃣ Factory has many Products
// Factory.hasMany(Product, { foreignKey: "factory_id" });
// Product.belongsTo(Factory, { foreignKey: "factory_id" });

// 2️⃣ Factory has many PurchaseEntries
Factory.hasMany(PurchaseEntry, { foreignKey: "factory_id" });
PurchaseEntry.belongsTo(Factory, { foreignKey: "factory_id" });

// 3️⃣ Product has many PurchaseEntries
Product.hasMany(PurchaseEntry, { foreignKey: "product_id" });
PurchaseEntry.belongsTo(Product, { foreignKey: "product_id" });

// 4️⃣ Supplier has many PurchaseEntries
Supplier.hasMany(PurchaseEntry, { foreignKey: "supplier_id" });
PurchaseEntry.belongsTo(Supplier, { foreignKey: "supplier_id" });

// 5️⃣ Factory has many Usage
Factory.hasMany(Usage, { foreignKey: "factory_id" });
Usage.belongsTo(Factory, { foreignKey: "factory_id" });

// 6️⃣ Product has many Usage
Product.hasMany(Usage, { foreignKey: "product_id" });
Usage.belongsTo(Product, { foreignKey: "product_id" });

// 7️⃣ Factory has many Swaps (From and To)
Factory.hasMany(Swap, { foreignKey: "from_factory_id", as: "swapsFrom" });
Factory.hasMany(Swap, { foreignKey: "to_factory_id", as: "swapsTo" });
Swap.belongsTo(Product, { foreignKey: 'product_id' });
Swap.belongsTo(Factory, { foreignKey: 'from_factory_id', as: 'fromFactory' });
Swap.belongsTo(Factory, { foreignKey: 'to_factory_id', as: 'toFactory' });

Product.hasMany(ProductStock, { 
  foreignKey: 'product_id', 
  as: 'stocks' 
});
ProductStock.belongsTo(Product, { 
  foreignKey: 'product_id', 
  as: 'product' 
});

// Factory to ProductStock (One-to-Many)
Factory.hasMany(ProductStock, { 
  foreignKey: 'factory_id', 
  as: 'productStocks' 
});
ProductStock.belongsTo(Factory, { 
  foreignKey: 'factory_id', 
  as: 'factory' 
});

// Many-to-Many through ProductStock
Product.belongsToMany(Factory, {
  through: ProductStock,
  foreignKey: 'product_id',
  otherKey: 'factory_id',
  as: 'factories'
});

Factory.belongsToMany(Product, {
  through: ProductStock,
  foreignKey: 'factory_id',
  otherKey: 'product_id',
  as: 'products'  // Regular products
});

// ================= Company and Distributor =================

// Company - DistributorCompany (1:N)
Company.hasMany(DistributorCompany, { foreignKey: 'company_id' });
DistributorCompany.belongsTo(Company, { foreignKey: 'company_id' });

// Company - BoardStock_Stock (1:N)
Company.hasMany(BoardStock_Stock, { foreignKey: 'company_id' });
BoardStock_Stock.belongsTo(Company, { foreignKey: 'company_id' });

// Company - JobCard (1:N)
Company.hasMany(JobCard, { foreignKey: 'company_id' });
JobCard.belongsTo(Company, { foreignKey: 'company_id' });

// DistributorCompany - JobCard (1:N)
DistributorCompany.hasMany(JobCard, { foreignKey: 'matter_id' });
JobCard.belongsTo(DistributorCompany, { foreignKey: 'matter_id' });

// ================= FIXED: BoardStock_Stock - JobCard Relationship =================
// Main relationship: JobCard belongs to a Stock (the stock used for the job)
BoardStock_Stock.hasMany(JobCard, { foreignKey: 'stock_id', as: 'jobCards' });
JobCard.belongsTo(BoardStock_Stock, { foreignKey: 'stock_id', as: 'stock' });

// REMOVED the duplicate relationship that was causing the conflict:
// JobCard.hasMany(BoardStock_Stock, { foreignKey: 'jobcard_id', as: 'stocks' });
// BoardStock_Stock.belongsTo(JobCard, { foreignKey: 'jobcard_id', as: 'jobCard' });

// ================= Reel Models =================

// Factory - ReelProduct (1:N)
Factory.hasMany(ReelProduct, { foreignKey: "factory_id" });
ReelProduct.belongsTo(Factory, { foreignKey: "factory_id" });

// Factory - ReelPurchaseEntry (1:N)
Factory.hasMany(ReelPurchaseEntry, { foreignKey: "factory_id" });
ReelPurchaseEntry.belongsTo(Factory, { foreignKey: "factory_id" });

// ReelProduct - ReelPurchaseEntry (1:N)
ReelProduct.hasMany(ReelPurchaseEntry, { foreignKey: "product_id" });
ReelPurchaseEntry.belongsTo(ReelProduct, { foreignKey: "product_id" });

// ReelSupplier - ReelPurchaseEntry (1:N)
ReelSupplier.hasMany(ReelPurchaseEntry, { foreignKey: "supplier_id" });
ReelPurchaseEntry.belongsTo(ReelSupplier, { foreignKey: "supplier_id" });

// Factory - ReelUsage (1:N)
Factory.hasMany(ReelUsage, { foreignKey: "factory_id" });
ReelUsage.belongsTo(Factory, { foreignKey: "factory_id" });

// ReelProduct - ReelUsage (1:N)
ReelProduct.hasMany(ReelUsage, { foreignKey: "product_id" });
ReelUsage.belongsTo(ReelProduct, { foreignKey: "product_id" });

// Factory - ReelSwap (1:N, from and to relations with aliases)
Factory.hasMany(ReelSwap, { foreignKey: "from_factory_id", as: "reelSwapsFrom" });
Factory.hasMany(ReelSwap, { foreignKey: "to_factory_id", as: "reelSwapsTo" });
ReelSwap.belongsTo(Factory, { foreignKey: "from_factory_id", as: "fromFactory" });
ReelSwap.belongsTo(Factory, { foreignKey: "to_factory_id", as: "toFactory" });

// ReelProduct - ReelSwap (1:N) - FIXED: Added alias to match query expectation
ReelProduct.hasMany(ReelSwap, { foreignKey: "product_id" });
ReelSwap.belongsTo(ReelProduct, { foreignKey: 'product_id', as: 'Product' });

ReelProduct.belongsTo(Factory, { foreignKey: "factory_id" });
Factory.hasMany(ReelProduct, { foreignKey: "factory_id" });

ReelProduct.hasMany(ReelProductStock, { 
  foreignKey: 'product_id', 
  as: 'stocks' 
});
ReelProductStock.belongsTo(ReelProduct, { 
  foreignKey: 'product_id', 
  as: 'reelProduct' 
});

// Factory to ReelProductStock (One-to-Many) - FIXED: was referencing ReelProduct instead of ReelProductStock
Factory.hasMany(ReelProductStock, { 
  foreignKey: 'factory_id', 
  as: 'reelProductStocks' 
});
ReelProductStock.belongsTo(Factory, { 
  foreignKey: 'factory_id', 
  as: 'factory' 
});

// Many-to-Many through ReelProductStock
ReelProduct.belongsToMany(Factory, {
  through: ReelProductStock,
  foreignKey: 'product_id',
  otherKey: 'factory_id',
  as: 'factories'
});

Factory.belongsToMany(ReelProduct, {
  through: ReelProductStock,
  foreignKey: 'factory_id',
  otherKey: 'product_id',
  as: 'reelProducts'  // FIXED: Changed from 'products' to 'reelProducts'
});

export {
  Factory,
  User,
  Supplier,
  Usage,
  Product,
  Swap,
  PurchaseEntry,
  Company,
  DistributorCompany,
  BoardStock_Stock,
  JobCard,
  ReelProduct,
  ReelPurchaseEntry,
  ReelSupplier,
  ReelUsage,
  ReelSwap,
};