// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

console.log("Testing MongoDB connection...");
console.log("MONGO_URI:", process.env.MONGO_URI ? "Set" : "Not set");

// Log every incoming request
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});
  
// API Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/patients", require("./routes/patientRoutes"));

// Root URL Route
app.get("/", (req, res) => {
    res.send("API is working ✅");
});

// --- Error Handlers (should be last) ---

// Global error handler for synchronous errors
app.use((err, req, res, next) => {
  console.error("💥 An unhandled error occurred:", err);
  res.status(500).send('Something broke!');
});

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});

// --- Server Startup ---

const PORT = process.env.PORT || 5057;

console.log("Attempting to connect to MongoDB...");
mongoose
  .connect(process.env.MONGO_URI) // Deprecated options are no longer needed
  .then(() => {
    console.log("✅ MongoDB Connection Successful!");
    // Only start listening for requests after the DB is connected
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Failed:", err.message);
    // If the DB doesn't connect, the app can't run, so we exit.
    process.exit(1);
  });
