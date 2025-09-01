import { DataTypes } from "sequelize";
import sequelize from "../config/db.js"; // ← FIXED

const ReelProduct = sequelize.define(
  "ReelProduct",
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

export default ReelProduct;
