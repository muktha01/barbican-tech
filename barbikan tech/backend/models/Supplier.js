import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Supplier = sequelize.define(
  "Supplier",
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
    type: {
      type: DataTypes.ENUM("gum", "ink"),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Type is required and must be either 'gum' or 'ink'",
        },
        isIn: {
          args: [["gum", "ink"]],
          msg: "Type must be either 'gum' or 'ink'",
        },
      },
    },
  },
  {
    timestamps: true,
    paranoid: true,
    deletedAt: "deletedAt",
  }
);

export default Supplier;
