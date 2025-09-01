import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Factory from "./Factory.js";
import ReelProduct from "./ReelProduct.js";

const ReelUsage = sequelize.define(
  "ReelUsage",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.UUID,
      references: { model: ReelProduct, key: "id" },
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

export default ReelUsage;
