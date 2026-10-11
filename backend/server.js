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
// On Vercel, module scope is shared within one function instance.
// We use mongoose.connection.readyState as the single source of truth.
let connectionPromise = null;

async function connectDB() {
  const state = mongoose.connection.readyState;
  if (state === 1) return;          // 1 = connected  ✅
  if (state === 2) {                // 2 = connecting — wait for it
    await connectionPromise;
    return;
  }
  // state 0 (disconnected) or 3 (disconnecting) — reconnect
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI environment variable is not set");
  }
  connectionPromise = mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    bufferCommands: false,          // fail fast instead of queuing when disconnected
  });
  await connectionPromise;
  console.log("MongoDB connected (readyState:", mongoose.connection.readyState, ")");
}

// Middleware: ensure DB is connected before every request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    res.status(500).json({ message: "Database connection failed", detail: err.message });
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
