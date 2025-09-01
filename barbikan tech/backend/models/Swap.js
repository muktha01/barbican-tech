import { DataTypes } from "sequelize";
import Product from"./Product.js";
import Factory from "./Factory.js";
import sequelize from "../config/db.js";

const Swap = sequelize.define(
  "Swap",
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
      allowNull: false,
      references: { model: Product, key: "id" },
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
  }
);

export default Swap;
