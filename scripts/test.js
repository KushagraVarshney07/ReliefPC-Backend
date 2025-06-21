const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

console.log("�� Testing with exact connection string...");

if (!process.env.MONGO_URI) {
  console.log("❌ MONGO_URI not found in .env file");
  process.exit(1);
}

console.log("✅ MONGO_URI found");
console.log("🔗 Connection string format:", process.env.MONGO_URI.substring(0, 50) + "...");
console.log("Raw MONGO_URI from .env:", process.env.MONGO_URI);

mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 30000,
  })
  .then(() => {
    console.log("✅ Successfully connected to MongoDB Atlas!");
    console.log("📊 Database:", mongoose.connection.name);
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Connection failed:", err.message);
    console.log("💡 Check your username, password, and cluster URL");
    process.exit(1);
  });