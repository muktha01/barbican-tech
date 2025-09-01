import { DataTypes } from "sequelize";
import Product from "./Product.js";
import Factory from "./Factory.js";
import sequelize from "../config/db.js";
import ReelProduct from "./ReelProduct.js";

const ReelSwap = sequelize.define(
  "ReelSwap",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // Remove type field as it's not used in the controller
    quantity: {
      type: DataTypes.DECIMAL(10, 2), // Changed to DECIMAL to match controller usage
      allowNull: false,
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: ReelProduct, key: "id" },
    },
    from_factory_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: Factory, key: "id" },
    },
    to_factory_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: Factory, key: "id" },
    },
  },
  {
    timestamps: true,
    paranoid: true,
    deletedAt: "deletedAt",
    tableName: "reel_swaps", // Explicit table name
  }
);

export default ReelSwap;