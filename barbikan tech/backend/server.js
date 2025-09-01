import app from "./app.js";
import sequelize from "./config/db.js";

const PORT = 8000;

async function startServer() {
  try {
    // Await the connection to ensure it's successful before proceeding
    await sequelize.authenticate();
    console.log("✅ Connection has been established successfully.");
    
    // Sync the database models
    await sequelize.sync(); // CHANGED: Removed { alter: true }
    console.log("✅ Database synced successfully");
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
  }
}

startServer();