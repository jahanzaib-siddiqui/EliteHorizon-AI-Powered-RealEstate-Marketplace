/**
 * seed_new_cities.js
 *
 * Seeds real Zameen.com data for Peshawar, Sialkot & Faisalabad
 * from the dataset/ folder into MongoDB.
 *
 * Usage (from backend/ directory):
 *   node seed_new_cities.js
 *
 * This script does NOT touch Lahore, Islamabad, Karachi or Multan data.
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

// ── Fallback images per type ───────────────────────────────────────────────────
const FALLBACK = {
  House:      "https://images.unsplash.com/photo-1600596542815-4054b4205f8c?auto=format&fit=crop&w=800&q=80",
  Commercial: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
  Plot:       "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
};

// ── Map raw property_type → enum ───────────────────────────────────────────────
const mapType = (rawType = "", searchCategory = "") => {
  const t  = rawType.toLowerCase();
  const sc = searchCategory.toLowerCase();
  if (t.includes("plot") || t.includes("land") || t === "agricultural land" || t === "industrial land" || sc.includes("plot"))
    return "Plot";
  if (t.includes("building") || t.includes("shop") || t.includes("office") || t.includes("warehouse") ||
      t.includes("factory") || t.includes("gym") || t.includes("hotel") || t.includes("clinic") ||
      t.includes("showroom") || t.includes("hall") || t === "studio" || sc.includes("commercial"))
    return "Commercial";
  return "House";
};

const mapPurpose = (raw = "") => raw.toLowerCase().includes("rent") ? "Rent" : "Buy";

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
  const type    = mapType(rec.property_type, rec.search_category || "");
  const purpose = mapPurpose(rec.purpose);
  const isRent  = purpose === "Rent";
  const image   =
    rec.cover_photo_url ||
    (Array.isArray(rec.photos) && rec.photos.length > 0 ? rec.photos[0] : null) ||
    FALLBACK[type];

  return {
    title:        rec.title || "Untitled Property",
    city:         (rec.city || "").toLowerCase(),
    location:     rec.location || "Unknown",
    type,
    purpose,
    price:        isRent ? 0 : (rec.price || 0),
    rentPrice:    isRent ? (rec.price || 0) : 0,
    bedrooms:     rec.bedrooms ?? 0,
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
  if (!fs.existsSync(fullPath)) { console.warn(`⚠️  Not found, skipping: ${filename}`); return []; }
  try {
    const raw = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
    if (!Array.isArray(raw)) { console.warn(`⚠️  Not an array: ${filename}`); return []; }
    const mapped = raw.map(mapRecord).filter(p => p.lat && p.lng);
    console.log(`   ✓ ${filename}: ${raw.length} records → ${mapped.length} with coordinates`);
    return mapped;
  } catch (e) {
    console.error(`❌ Error parsing ${filename}:`, e.message);
    return [];
  }
};

const FILES = [
  // Peshawar
  "Peshawar_home_buy.json",
  "Peshawar_home_rent.json",
  "Peshawar_commercial_buy.json",
  "Peshawar_plots_buy.json",
  // Sialkot
  "Sialkot_homes_buy.json",
  "Sialkot_home_rent.json",
  "Sialkot_commercial_buy.json",
  "Sialkot_plots_buy.json",
  // Faisalabad
  "Faisalabad_home_buy.json",
  "Faisalabad_home_rent.json",
  "Faisalabad_commercial_buy.json",
  "Faisalabad_plots_buy.json",
];

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

    console.log("\n🗑️  Removing old Peshawar / Sialkot / Faisalabad records…");
    const del = await Property.deleteMany({ city: { $in: ["peshawar", "sialkot", "faisalabad"] } });
    console.log(`   Deleted ${del.deletedCount} existing records`);

    console.log("\n💾 Inserting new records…");
    const BATCH = 500;
    let inserted = 0;
    for (let i = 0; i < all.length; i += BATCH) {
      await Property.insertMany(all.slice(i, i + BATCH), { ordered: false });
      inserted += Math.min(BATCH, all.length - i);
      process.stdout.write(`   Progress: ${inserted}/${all.length}\r`);
    }

    console.log(`\n\n✅ Inserted ${inserted} properties!\n`);

    // Summary
    const cities = ["peshawar", "sialkot", "faisalabad"];
    for (const c of cities) {
      const total = await Property.countDocuments({ city: c });
      const h = await Property.countDocuments({ city: c, type: "House" });
      const com = await Property.countDocuments({ city: c, type: "Commercial" });
      const p = await Property.countDocuments({ city: c, type: "Plot" });
      console.log(`   ${c.charAt(0).toUpperCase() + c.slice(1)} → ${total} total  (Houses: ${h}, Commercial: ${com}, Plots: ${p})`);
    }
    console.log("\n🎉 Done! Peshawar, Sialkot & Faisalabad are live.\n");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Seeding failed:", err);
    process.exit(1);
  }
};

seedData();
