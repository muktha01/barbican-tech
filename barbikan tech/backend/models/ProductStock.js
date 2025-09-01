import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Product from "./Product.js";
import Factory from "./Factory.js";

const ProductStock = sequelize.define(
  "ProductStock",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: Product, key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    factory_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: Factory, key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    opening_stock: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    current_stock: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    paranoid: true,
    deletedAt: "deletedAt",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['product_id', 'factory_id'],
        name: 'unique_product_factory_combination'
      }
    ]
  }
);

export default ProductStock;