import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import propertyRoutes from "./routes/propertyRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import sellerRoutes from "./routes/sellerRoutes.js";
import buyerRoutes from "./routes/buyerRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use("/uploads", express.static("uploads")); // Serve uploaded images
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// ── Cached MongoDB connection for Vercel serverless ──────────────────────────
// Vercel spins up a new function instance per request. Without caching,
// every request opens a new connection and times out before it finishes.
let isConnected = false;

async function connectDB() {
  if (isConnected) return;                        // reuse existing connection
  if (mongoose.connection.readyState >= 1) {      // already connecting/connected
    isConnected = true;
    return;
  }
  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,              // fail fast if Atlas unreachable
    socketTimeoutMS: 45000,
  });
  isConnected = true;
  console.log("MongoDB connected");
}

// Middleware: ensure DB is connected before every request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    res.status(500).json({ message: "Database connection failed" });
  }
});

// Routes
app.use("/api/properties", propertyRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/buyer", buyerRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("Elite Horizon Backend is running!");
});

// Use PORT from environment (Vercel sets this automatically) or fallback to 5001
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Export for Vercel serverless
export default app;
