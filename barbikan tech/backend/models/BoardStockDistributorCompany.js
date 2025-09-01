// models/DistributorCompany.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const DistributorCompany = sequelize.define("DistributorCompany", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  matter: {
    type: DataTypes.STRING,
    allowNull: false,
    // Remove unique: true from here
  },
  printingSize: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  plate: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  extraColor: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  contactDetails: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  printingDetails: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  company_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'companies',
      key: 'id'
    },
    onUpdate: 'CASCADE',     
    onDelete: 'CASCADE'   
  },
}, 
{
  tableName: 'distributor_companies',
  timestamps: true,
  paranoid: true,
  indexes: [ // Add this new property for composite unique key
    {
      unique: true,
      fields: ['matter', 'company_id']
    }
  ]
});

export default DistributorCompany;