/**
 * seed_commercial_rent.js
 *
 * Seeds real Zameen.com commercial RENT data for:
 *   Karachi, Multan, Peshawar, Sialkot, Faisalabad
 *
 * This ONLY adds the missing commercial-rent records —
 * it does NOT touch any existing data.
 *
 * Usage (from backend/ directory):
 *   node seed_commercial_rent.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Property from "./models/Property.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const DATASET_DIR = path.resolve(__dirname, "../dataset");

// ── Fallback images ────────────────────────────────────────────────────────────
const FALLBACK_COMMERCIAL =
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80";

// ── Map raw property_type → enum ───────────────────────────────────────────────
const mapType = (rawType = "") => {
  const t = rawType.toLowerCase();
  if (t.includes("plot") || t.includes("land")) return "Plot";
  if (
    t.includes("house") || t.includes("flat") || t.includes("portion") ||
    t.includes("penthouse") || t.includes("farm")
  ) return "House";
  return "Commercial"; // office, shop, building, warehouse, factory …
};

const normalizeArea = (area, unit = "") => {
  const u = unit.toLowerCase();
  const n = parseFloat(area);
  if (isNaN(n)) return area;
  if (u === "marla") return n;
  if (u === "kanal") return n * 20;
  if (u === "sqft")  return Math.round(n / 225);
  if (u === "sqyd")  return Math.round(n / 30);
  if (u === "sqm")   return Math.round(n / 21);
  return n;
};

const mapRecord = (rec) => {
  const type  = mapType(rec.property_type || "");
  const image =
    rec.cover_photo_url ||
    (Array.isArray(rec.photos) && rec.photos.length > 0 ? rec.photos[0] : null) ||
    FALLBACK_COMMERCIAL;

  return {
    title:        rec.title || "Untitled Commercial Property",
    city:         (rec.city || "").toLowerCase(),
    location:     rec.location || "Unknown",
    type,
    purpose:      "Rent",           // all records in these files are rent
    price:        0,
    rentPrice:    rec.price || 0,
    bedrooms:     rec.bedrooms  ?? 0,
    bathrooms:    rec.bathrooms ?? 0,
    area:         String(normalizeArea(rec.area, rec.area_unit) ?? rec.area ?? ""),
    lat:          rec.latitude  || null,
    lng:          rec.longitude || null,
    image,
    page_url:     rec.url || null,
    description:  rec.description  || "",
    phone_number: rec.phone_number || "",
    agency_name:  rec.agency_name  || "",
    isAvailable:  true,
  };
};

const loadFile = (filename) => {
  const fullPath = path.join(DATASET_DIR, filename);
  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️  Not found, skipping: ${filename}`);
    return [];
  }
  try {
    const raw    = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
    if (!Array.isArray(raw)) { console.warn(`⚠️  Not an array: ${filename}`); return []; }
    const mapped = raw.map(mapRecord).filter(p => p.lat && p.lng);
    console.log(`   ✓ ${filename}: ${raw.length} records → ${mapped.length} with coordinates`);
    return mapped;
  } catch (e) {
    console.error(`❌ Error parsing ${filename}:`, e.message);
    return [];
  }
};

// NOTE: Multan/Peshawar/Sialkot filenames have typo "commerical" (one 'm' missing)
const FILES = [
  "Karachi_commercial_rent.json",
  "Multan_commerical_rent.json",
  "Peshawar_commerical_rent.json",
  "Sialkot_commerical_rent.json",
  "Faisalabad_commercial_rent.json",
];

const CITIES = ["karachi", "multan", "peshawar", "sialkot", "faisalabad"];

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/elite-horizon";
    console.log(`\n🔗 Connecting to: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB connected\n");

    console.log("📂 Reading dataset files…");
    let all = [];
    for (const file of FILES) all = all.concat(loadFile(file));
    console.log(`\n📊 Total records to insert: ${all.length}`);

    // Only remove the commercial-rent records for these cities — preserve buy records
    console.log("\n🗑️  Removing old Commercial-Rent records for these cities…");
    const del = await Property.deleteMany({
      city:    { $in: CITIES },
      type:    "Commercial",
      purpose: "Rent",
    });
    console.log(`   Deleted ${del.deletedCount} existing Commercial-Rent records`);

    console.log("\n💾 Inserting new records…");
    const BATCH = 500;
    let inserted = 0;
    for (let i = 0; i < all.length; i += BATCH) {
      await Property.insertMany(all.slice(i, i + BATCH), { ordered: false });
      inserted += Math.min(BATCH, all.length - i);
      process.stdout.write(`   Progress: ${inserted}/${all.length}\r`);
    }
    console.log(`\n\n✅ Inserted ${inserted} commercial-rent properties!\n`);

    // Summary per city
    for (const c of CITIES) {
      const total = await Property.countDocuments({ city: c, type: "Commercial", purpose: "Rent" });
      console.log(`   ${c.charAt(0).toUpperCase() + c.slice(1)} → ${total} Commercial-Rent records`);
    }

    console.log("\n🎉 Done! Commercial-Rent properties are now live.\n");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Seeding failed:", err);
    process.exit(1);
  }
};

seedData();
