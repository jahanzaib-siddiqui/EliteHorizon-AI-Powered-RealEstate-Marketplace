import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/Users.js";
import SellerProperty from "../models/SellerProperty.js";
import Property from "../models/Property.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { spawn, exec } from 'child_process';
import { existsSync, statSync, readdirSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const ADMIN_SECRET = process.env.JWT_SECRET || "elite_horizon_secret_key";
const ADMIN_EMAIL = "admin@elitehorizon.com";
const ADMIN_PASSWORD = "Admin@123";

// ── POST /api/admin/login ──
router.post("/login", (req, res) => {
    const { email, password } = req.body;
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
        return res.status(401).json({ message: "Invalid admin credentials." });
    }
    const token = jwt.sign({ role: "admin", email }, ADMIN_SECRET, { expiresIn: "8h" });
    res.json({ token, admin: { email, name: "Admin" } });
});

// ── middleware ──
function adminAuth(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) return res.status(401).json({ message: "Unauthorized" });
    try {
        const decoded = jwt.verify(auth.split(" ")[1], ADMIN_SECRET);
        if (decoded.role !== "admin") return res.status(403).json({ message: "Forbidden" });
        next();
    } catch {
        res.status(401).json({ message: "Invalid or expired token" });
    }
}

// ── GET /api/admin/stats ──
router.get("/stats", adminAuth, async (req, res) => {
    try {
        const [totalUsers, totalSellers, totalBuyers, totalListings, totalProperties, pendingListings] =
            await Promise.all([
                User.countDocuments(),
                User.countDocuments({ role: "seller" }),
                User.countDocuments({ role: "buyer" }),
                SellerProperty.countDocuments(),
                Property.countDocuments(),
                SellerProperty.countDocuments({ status: "pending" }),
            ]);

        const recentListings = await SellerProperty.find()
            .sort({ createdAt: -1 }).limit(5)
            .select("adInfo.title location.city price.value purpose status createdAt");

        const recentUsers = await User.find()
            .sort({ createdAt: -1 }).limit(5)
            .select("name email role createdAt");

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);

        const monthlySignups = await User.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, count: { $sum: 1 } } },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        const listingsByCity = await SellerProperty.aggregate([
            { $group: { _id: "$location.city", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const listingsByPurpose = await SellerProperty.aggregate([
            { $group: { _id: "$purpose", count: { $sum: 1 } } }
        ]);

        res.json({
            totalUsers, totalSellers, totalBuyers, totalListings, totalProperties,
            pendingListings, recentListings, recentUsers, monthlySignups,
            listingsByCity, listingsByPurpose
        });
    } catch (error) {
        console.error("Admin stats error:", error);
        res.status(500).json({ message: "Error fetching stats." });
    }
});

// ── GET /api/admin/users ──
router.get("/users", adminAuth, async (req, res) => {
    try {
        const page   = parseInt(req.query.page)  || 1;
        const limit  = parseInt(req.query.limit) || 15;
        const search = req.query.search || "";
        const filter = search
            ? { $or: [{ name: new RegExp(search, "i") }, { email: new RegExp(search, "i") }] }
            : {};
        const [users, total] = await Promise.all([
            User.find(filter).select("-password").sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit),
            User.countDocuments(filter)
        ]);
        res.json({ users, total, pages: Math.ceil(total / limit) });
    } catch { res.status(500).json({ message: "Error fetching users." }); }
});

// ── DELETE /api/admin/users/:id ──
router.delete("/users/:id", adminAuth, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "User deleted." });
    } catch { res.status(500).json({ message: "Error deleting user." }); }
});

// ── GET /api/admin/listings ── (filter by status supported)
router.get("/listings", adminAuth, async (req, res) => {
    try {
        const page   = parseInt(req.query.page)  || 1;
        const limit  = parseInt(req.query.limit) || 12;
        const search = req.query.search || "";
        const status = req.query.status || "";
        const filter = {};
        if (search) filter["adInfo.title"] = new RegExp(search, "i");
        if (status) filter.status = status;
        const [listings, total] = await Promise.all([
            SellerProperty.find(filter).sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit),
            SellerProperty.countDocuments(filter)
        ]);
        res.json({ listings, total, pages: Math.ceil(total / limit) });
    } catch { res.status(500).json({ message: "Error fetching listings." }); }
});

// ── DELETE /api/admin/listings/:id ──
router.delete("/listings/:id", adminAuth, async (req, res) => {
    try {
        await SellerProperty.findByIdAndDelete(req.params.id);
        res.json({ message: "Listing deleted." });
    } catch { res.status(500).json({ message: "Error deleting listing." }); }
});

// ── GET /api/admin/pending ── all listings awaiting review
router.get("/pending", adminAuth, async (req, res) => {
    try {
        const listings = await SellerProperty.find({ status: "pending" }).sort({ createdAt: -1 });
        res.json({ listings, total: listings.length });
    } catch { res.status(500).json({ message: "Error fetching pending listings." }); }
});

// ── POST /api/admin/approve/:id ──
router.post("/approve/:id", adminAuth, async (req, res) => {
    try {
        const updated = await SellerProperty.findByIdAndUpdate(
            req.params.id,
            { $set: { status: "approved", rejectionReason: "" } },
            { new: true }
        );
        if (!updated) return res.status(404).json({ message: "Listing not found." });
        res.json({ message: "Property approved and is now live!", property: updated });
    } catch { res.status(500).json({ message: "Error approving listing." }); }
});

// ── POST /api/admin/reject/:id ──
router.post("/reject/:id", adminAuth, async (req, res) => {
    try {
        const { reason } = req.body;
        if (!reason?.trim()) return res.status(400).json({ message: "Rejection reason is required." });
        const updated = await SellerProperty.findByIdAndUpdate(
            req.params.id,
            { $set: { status: "rejected", rejectionReason: reason.trim() } },
            { new: true }
        );
        if (!updated) return res.status(404).json({ message: "Listing not found." });
        res.json({ message: "Property rejected.", property: updated });
    } catch { res.status(500).json({ message: "Error rejecting listing." }); }
});

// ── GET /api/admin/properties ──
router.get("/properties", adminAuth, async (req, res) => {
    try {
        const byCity = await Property.aggregate([
            { $group: { _id: "$city", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        const total = await Property.countDocuments();
        res.json({ total, byCity });
    } catch { res.status(500).json({ message: "Error fetching properties." }); }
});

// ── GET /api/admin/chats ──
router.get("/chats", adminAuth, async (req, res) => {
    try {
        const page   = parseInt(req.query.page)  || 1;
        const limit  = parseInt(req.query.limit) || 20;

        const [conversations, total] = await Promise.all([
            Conversation.find()
                .populate("buyerId", "name email")
                .populate("sellerId", "name email")
                .populate({
                    path: "propertyId",
                    select: "adInfo location price propertyType media purpose"
                })
                .sort({ updatedAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            Conversation.countDocuments()
        ]);

        res.json({ conversations, total, pages: Math.ceil(total / limit) });
    } catch (error) {
        console.error("Error fetching admin chats:", error);
        res.status(500).json({ message: "Error fetching chats." });
    }
});

// ── GET /api/admin/chats/:conversationId/messages ──
router.get("/chats/:conversationId/messages", adminAuth, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const messages = await Message.find({ conversationId })
            .populate("senderId", "name role")
            .sort({ createdAt: 1 });
            
        res.json({ messages });
    } catch (error) {
        console.error("Error fetching admin messages:", error);
        res.status(500).json({ message: "Error fetching messages." });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// AI MODEL TRAINING ENDPOINTS
// Uses Node child_process to spawn python3 train.py
// ─────────────────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const AI_MODELS_DIR  = path.resolve(__dirname, '../../ai-models');
const TRAIN_SCRIPT   = path.join(AI_MODELS_DIR, 'train.py');
const MODELS_DIR     = path.join(AI_MODELS_DIR, 'models');
const META_FILE      = path.join(MODELS_DIR, 'all_models_meta.json');

// In-memory training state
const trainingState = {
  status:    'idle',   // 'idle' | 'running' | 'done' | 'error'
  startedAt: null,
  finishedAt: null,
  logs:      [],
  process:   null,
};

// ── GET /api/admin/train/status ──────────────────────────────────────────────
router.get('/train/status', adminAuth, (req, res) => {
  // Read model meta for R2/sample info
  let modelsMeta = {};
  try {
    if (existsSync(META_FILE)) {
      modelsMeta = JSON.parse(readFileSync(META_FILE, 'utf8'));
    }
  } catch (_) {}

  // List .pkl files with their modification times
  let modelFiles = [];
  try {
    if (existsSync(MODELS_DIR)) {
      modelFiles = readdirSync(MODELS_DIR)
        .filter(f => f.endsWith('.pkl'))
        .map(f => {
          const fullPath = path.join(MODELS_DIR, f);
          const stat = statSync(fullPath);
          const key = f.replace('_model.pkl', '').replace('.pkl', '');
          const meta = modelsMeta[key] || {};
          return {
            filename:    f,
            key,
            sizeKB:      Math.round(stat.size / 1024),
            lastModified: stat.mtime,
            r2:           meta.r2           || null,
            mae:          meta.mae          || null,
            trainSamples: meta.train_samples|| null,
            algorithm:    meta.algorithm    || null,
          };
        })
        .sort((a, b) => b.lastModified - a.lastModified);
    }
  } catch (_) {}

  res.json({
    status:     trainingState.status,
    startedAt:  trainingState.startedAt,
    finishedAt: trainingState.finishedAt,
    modelFiles,
  });
});

// ── GET /api/admin/train/logs ────────────────────────────────────────────────
router.get('/train/logs', adminAuth, (req, res) => {
  res.json({ logs: trainingState.logs });
});

// ── POST /api/admin/train/start ──────────────────────────────────────────────
router.post('/train/start', adminAuth, (req, res) => {
  if (trainingState.status === 'running') {
    return res.status(409).json({ message: 'Training is already in progress.' });
  }

  if (!existsSync(TRAIN_SCRIPT)) {
    return res.status(404).json({ message: `train.py not found at ${TRAIN_SCRIPT}` });
  }

  // Reset state
  trainingState.status    = 'running';
  trainingState.startedAt = new Date();
  trainingState.finishedAt = null;
  trainingState.logs      = [`[${new Date().toLocaleTimeString()}] 🚀 Training started...\n`];

  const proc = spawn('python3', [TRAIN_SCRIPT], {
    cwd: AI_MODELS_DIR,
    env: { ...process.env, PYTHONUNBUFFERED: '1' },
  });
  trainingState.process = proc;

  const appendLog = (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) trainingState.logs.push(line);
    });
    // Keep last 500 lines
    if (trainingState.logs.length > 500) {
      trainingState.logs = trainingState.logs.slice(-500);
    }
  };

  proc.stdout.on('data', appendLog);
  proc.stderr.on('data', appendLog);

  proc.on('close', (code) => {
    trainingState.status    = code === 0 ? 'done' : 'error';
    trainingState.finishedAt = new Date();
    trainingState.process   = null;
    const msg = code === 0
      ? `[${new Date().toLocaleTimeString()}] ✅ Training completed successfully!`
      : `[${new Date().toLocaleTimeString()}] ❌ Training failed with exit code ${code}`;
    trainingState.logs.push(msg);
    console.log(msg);
  });

  proc.on('error', (err) => {
    trainingState.status    = 'error';
    trainingState.finishedAt = new Date();
    trainingState.process   = null;
    trainingState.logs.push(`[${new Date().toLocaleTimeString()}] ❌ Process error: ${err.message}`);
  });

  res.json({ message: 'Training started.', startedAt: trainingState.startedAt });
});

// ── POST /api/admin/train/stop ───────────────────────────────────────────────
router.post('/train/stop', adminAuth, (req, res) => {
  if (trainingState.status !== 'running' || !trainingState.process) {
    return res.status(400).json({ message: 'No training process is running.' });
  }
  trainingState.process.kill('SIGTERM');
  trainingState.status = 'idle';
  trainingState.logs.push(`[${new Date().toLocaleTimeString()}] ⚠️ Training stopped by admin.`);
  res.json({ message: 'Training stopped.' });
});

// ── POST /api/admin/train/reload ─────────────────────────────────────────────
// Restarts the Flask predict API so new .pkl models are loaded
router.post('/train/reload', adminAuth, (req, res) => {
  exec('pkill -f predict_api.py; sleep 1; cd ' + AI_MODELS_DIR + ' && nohup python3 predict_api.py > /tmp/predict_api.log 2>&1 &',
    (err) => {
      if (err) {
        return res.json({ message: 'Reload attempted. Check if predict_api.py is running manually.', warning: err.message });
      }
      res.json({ message: '✅ AI Models reloaded. Flask API restarted.' });
    }
  );
});

export default router;
