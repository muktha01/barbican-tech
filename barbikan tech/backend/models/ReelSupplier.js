import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const ReelSupplier = sequelize.define(
  "ReelSupplier",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    supplier_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Supplier name cannot be empty",
        },
      },
    },
    company_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Company name cannot be empty",
        },
      },
    },
    gst_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    mobile_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    paranoid: true,
    deletedAt: "deletedAt",
  }
);

export default ReelSupplier;
