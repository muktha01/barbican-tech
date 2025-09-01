// models/BoardStock_Stock.js
import {DataTypes} from 'sequelize'
import sequelize from "../config/db.js";

const BoardStock_Stock = sequelize.define('Stock', {
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
      key: 'id'
    }
  },
  stock_name:{
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: "Stock name cannot be empty",
      },
    },
  },
  unit: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: "Unit cannot be empty",
      },
    },
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: "Quantity cannot be empty",
      },
      min: {
        args: [0], // Assuming quantity can be zero or positive. Use [1] if it must be strictly positive.
        msg: "Quantity must be a positive number",
      },
    },
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'stocks',
  timestamps: false,
  paranoid: true,
  deletedAt: "deletedAt",
});

export default BoardStock_Stock;