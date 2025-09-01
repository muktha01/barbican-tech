import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Supplier from "./Supplier.js";
import Factory from "./Factory.js";
import Product from "./Product.js";

const PurchaseEntry = sequelize.define(
  "PurchaseEntry",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    purchase_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    bill_no: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("gum", "ink"),
      allowNull: false,
    },
    supplier_id: {
      type: DataTypes.UUID,
      references: { model: Supplier, key: "id" },
    },
    product_id: {
      type: DataTypes.UUID,
      references: { model: Product, key: "id" },
    },
    factory_id: {
      type: DataTypes.UUID,
      references: { model: Factory, key: "id" },
    },
  },
  {
    timestamps: true,
    paranoid: true,
    deletedAt: "deletedAt",
  }
);

// ✅ Add associations here:
PurchaseEntry.belongsTo(Supplier, {
  foreignKey: "supplier_id",
  as: "supplier",
});

PurchaseEntry.belongsTo(Product, {
  foreignKey: "product_id",
  as: "product",
});

PurchaseEntry.belongsTo(Factory, {
  foreignKey: "factory_id",
  as: "factory",
});

export default PurchaseEntry;
