import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Product from "./Product.js";
import Factory from "./Factory.js";

const Usage = sequelize.define(
  "Usage",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM("gum", "ink"),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
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

export default Usage;
