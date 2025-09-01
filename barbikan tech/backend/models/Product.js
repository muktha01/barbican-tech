// // Product.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";


const Product = sequelize.define(
  "Product",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    product_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("gum", "ink"),
      allowNull: false,
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    paranoid: true,
    deletedAt: "deletedAt",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["product_name", "deletedAt"],
        name: "unique_product_name_if_not_deleted",
      },
    ],
  }
);

export default Product;
