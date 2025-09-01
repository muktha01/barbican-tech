import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import bcrypt from "bcrypt"; // You'll need this for password hashing

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mobile_number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("admin", "staff"),
      allowNull: false,
      defaultValue: "staff",
    },
  },
  {
    timestamps: true,
    hooks: {
      afterSync: async () => {
        try {
          // Check if any admin user exists
          const adminExists = await User.findOne({ where: { role: "admin" } });
          
          if (!adminExists) {
            // Hash the default password
            const hashedPassword = await bcrypt.hash("admin123", 10);
            
            // Create default admin user
            await User.create({
              username: "admin",
              mobile_number: "9989898999",
              password: hashedPassword,
              role: "admin",
            });
            
            console.log("Default admin user created successfully!");
          }
        } catch (error) {
          console.error("Error creating default admin user:", error);
        }
      },
    },
  }
);

export default User;