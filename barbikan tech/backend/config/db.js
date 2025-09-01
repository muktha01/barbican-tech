import { Sequelize } from "sequelize";

const sequelize = new Sequelize("packaging", "root", "Venky123", {
  host: "localhost",
  port: 3306,
  dialect: "mysql",
  logging: false,
});

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("✅ Connection has been established successfully.");
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
  }
}

testConnection();

export default sequelize;
