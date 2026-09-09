import express from "express";
import { getTrendingProperties, searchProperties, addProperty, getPropertyTrends } from "../controllers/propertyController.js";

const router = express.Router();

// Property trends data (aggregated by location)
router.get("/trends", getPropertyTrends);

// Trending properties
router.get("/trending", getTrendingProperties);

// Search properties
router.get("/search", searchProperties);

// Add new property (optional admin endpoint)
router.post("/", addProperty);

export default router;
