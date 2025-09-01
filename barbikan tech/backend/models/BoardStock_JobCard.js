// models/JobCard.js
import {DataTypes} from 'sequelize'
import sequelize from "../config/db.js";


const JobCard = sequelize.define('JobCard', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  company_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'companies',
      key: 'id',
    },
  },
  matter_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'distributor_companies',
      key: 'id',
    },
  },
  stock_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stocks',
      key: 'id',
    },
  },
  company: {
    type: DataTypes.STRING,
  },
  printingSize: {
    type: DataTypes.STRING,
  },
  currentStock: {
    type: DataTypes.INTEGER,
  },
  quantity: {
   type: DataTypes.INTEGER,
  },
  unit: {
    type: DataTypes.STRING,
  },
  plate: {
    type: DataTypes.STRING,
  },
  color: {
    type: DataTypes.STRING,
  },
  extraColor: {
    type: DataTypes.STRING,
  },
  contactDetails: {
    type: DataTypes.TEXT,
  },
  printingDetails: {
    type: DataTypes.TEXT,
  },
  date: {
    type: DataTypes.STRING,
    defaultValue: () => new Date().toLocaleDateString(),
  },
}, {
  tableName: 'job_cards',
  timestamps: true
});

export default JobCard;