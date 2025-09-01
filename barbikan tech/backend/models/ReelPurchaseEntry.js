import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import ReelSupplier from "./ReelSupplier.js";
import ReelProduct from "./ReelProduct.js";
import Factory from "./Factory.js";

const ReelPurchaseEntry = sequelize.define(
  "ReelPurchaseEntry",
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
    supplier_id: {
      type: DataTypes.UUID,
      references: { model: ReelSupplier, key: "id" },
      allowNull: false,
    },
    product_id: {
      type: DataTypes.UUID,
      references: { model: ReelProduct, key: "id" },
      allowNull: false,
    },
    factory_id: {
      type: DataTypes.UUID,
      references: { model: Factory, key: "id" },
      allowNull: false,
    },
  },
  {
    timestamps: true,
    paranoid: true,
    deletedAt: "deletedAt",
  }
);

// ✅ Associations
ReelPurchaseEntry.belongsTo(ReelSupplier, {
  foreignKey: "supplier_id",
  as: "supplier",
});

ReelPurchaseEntry.belongsTo(ReelProduct, {
  foreignKey: "product_id",
  as: "product",
});

ReelPurchaseEntry.belongsTo(Factory, {
  foreignKey: "factory_id",
  as: "factory",
});

export default ReelPurchaseEntry;
