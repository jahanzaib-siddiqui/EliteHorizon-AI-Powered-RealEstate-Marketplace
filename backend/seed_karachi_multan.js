/**
 * seed_karachi_multan.js
 *
 * Seeds real Zameen.com data (Karachi + Multan) from the dataset/ folder
 * into MongoDB.  After running this script:
 *  - /city/karachi  and  /city/multan  show real property tiles + map markers
 *  - /category/house, /category/commercial, /category/plot  include Karachi & Multan
 *  - Clicking a tile / map-marker popup opens the actual Zameen.com listing URL
 *
 * Usage (from project root):
 *   cd backend && node seed_karachi_multan.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Property from "./models/Property.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Path to the dataset folder (one level up from backend/) ──────────────────
const DATASET_DIR = path.resolve(__dirname, "../dataset");

// ── Fallback placeholder images per type ─────────────────────────────────────
const FALLBACK_IMAGES = {
  House:      "https://images.unsplash.com/photo-1600596542815-4054b4205f8c?auto=format&fit=crop&w=800&q=80",
  Commercial: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
  Plot:       "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
};

// ── Map raw property_type string → our Property model enum ───────────────────
const mapType = (rawType = "", searchCategory = "") => {
  const t = rawType.toLowerCase();
  const sc = searchCategory.toLowerCase();

  // Plots / land
  if (
    t.includes("plot") || t.includes("land") ||
    t === "agricultural land" || t === "industrial land" ||
    sc.includes("plot")
  ) return "Plot";

  // Commercial
  if (
    t.includes("building") || t.includes("shop") || t.includes("office") ||
    t.includes("warehouse") || t.includes("factory") || t.includes("gym") ||
    t.includes("hotel") || t.includes("clinic") || t.includes("showroom") ||
    t.includes("hall") || t === "studio" || sc.includes("commercial")
  ) return "Commercial";

  // Default → House (covers house, flat, upper portion, lower portion, penthouse, etc.)
  return "House";
};

// ── Map raw purpose string → "Buy" | "Rent" ──────────────────────────────────
const mapPurpose = (rawPurpose = "") => {
  const p = rawPurpose.toLowerCase();
  return p.includes("rent") ? "Rent" : "Buy";
};

// ── Normalize area to a numeric marla-equivalent where possible ───────────────
const normalizeArea = (area, unit = "") => {
  if (!area) return null;
  const u = unit.toLowerCase();
  const num = parseFloat(area);
  if (isNaN(num)) return area; // keep raw string if not parseable

  if (u === "marla") return num;
  if (u === "kanal") return num * 20;          // 1 kanal = 20 marla
  if (u === "sqft") return Math.round(num / 225); // 1 marla ≈ 225 sqft
  if (u === "sqyd") return Math.round(num / 30);  // 1 marla ≈ 30 sqyd
  if (u === "sqm")  return Math.round(num / 21);  // 1 marla ≈ 21 sqm
  return num; // unknown unit — keep raw number
};

// ── Convert one JSON record → Property document ───────────────────────────────
const mapRecord = (rec) => {
  const type    = mapType(rec.property_type, rec.search_category || "");
  const purpose = mapPurpose(rec.purpose);

  // For rent listings the "price" field IS the monthly rent
  const isRent  = purpose === "Rent";
  const price   = isRent ? 0 : (rec.price || 0);
  const rentPrice = isRent ? (rec.price || 0) : 0;

  // Image: prefer cover_photo_url, fall back to first photo, then placeholder
  const image =
    rec.cover_photo_url ||
    (Array.isArray(rec.photos) && rec.photos.length > 0 ? rec.photos[0] : null) ||
    FALLBACK_IMAGES[type];

  return {
    title:       rec.title || "Untitled Property",
    city:        (rec.city || "").toLowerCase(),   // stored lowercase to match existing convention
    location:    rec.location || "Unknown",
    type,
    purpose,
    price,
    rentPrice,
    bedrooms:    rec.bedrooms ?? 0,
    bathrooms:   rec.bathrooms ?? 0,
    area:        String(normalizeArea(rec.area, rec.area_unit) ?? rec.area ?? ""),
    lat:         rec.latitude  || null,
    lng:         rec.longitude || null,
    image,
    page_url:    rec.url || null,          // clicking opens the real Zameen.com listing
    description: rec.description || "",
    phone_number: rec.phone_number || "",
    agency_name: rec.agency_name || "",
    isAvailable: true,
  };
};

// ── Load a JSON file, map all records, skip any missing lat/lng ───────────────
const loadFile = (filename) => {
  const fullPath = path.join(DATASET_DIR, filename);
  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️  File not found, skipping: ${filename}`);
    return [];
  }
  try {
    const raw = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
    if (!Array.isArray(raw)) {
      console.warn(`⚠️  Expected array in ${filename}, skipping.`);
      return [];
    }
    const mapped = raw.map(mapRecord).filter(
      (p) => p.lat && p.lng // only keep records with valid coordinates for map
    );
    console.log(`   ✓ ${filename}: ${raw.length} records → ${mapped.length} with coordinates`);
    return mapped;
  } catch (e) {
    console.error(`❌ Error parsing ${filename}:`, e.message);
    return [];
  }
};

// ── Files to seed ─────────────────────────────────────────────────────────────
const FILES = [
  // Karachi
  "Karachi_Homes_buy.json",
  "Karchi_Homes_rent.json",       // note: typo in original filename kept intentionally
  "Karachi_Commercial_buy.json",
  "Karachi_plots_buy.json",
  // Multan
  "Multan_Homes_buy.json",
  "Multan_Homes_rent.json",
  "Multan_Commercial_buy.json",
  "Multan_plots_buy.json",
];

// ── Main seeder ───────────────────────────────────────────────────────────────
const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/elite-horizon";
    console.log(`\n🔗 Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB connected\n");

    // Collect all records
    console.log("📂 Reading dataset files…");
    let allRecords = [];
    for (const file of FILES) {
      allRecords = allRecords.concat(loadFile(file));
    }
    console.log(`\n📊 Total records to insert: ${allRecords.length}`);

    // Remove existing Karachi & Multan properties (keep Lahore / Islamabad intact)
    console.log("\n🗑️  Removing old Karachi & Multan properties from DB…");
    const deleteResult = await Property.deleteMany({
      city: { $in: ["karachi", "multan"] },
    });
    console.log(`   Deleted ${deleteResult.deletedCount} existing records`);

    // Batch insert (MongoDB handles large arrays fine)
    console.log("\n💾 Inserting new records…");
    const BATCH_SIZE = 500;
    let inserted = 0;
    for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
      const batch = allRecords.slice(i, i + BATCH_SIZE);
      await Property.insertMany(batch, { ordered: false }); // ordered:false → continue on dup errors
      inserted += batch.length;
      process.stdout.write(`   Progress: ${inserted}/${allRecords.length}\r`);
    }
    console.log(`\n\n✅ Successfully inserted ${inserted} properties!`);

    // Summary breakdown
    const karCount     = await Property.countDocuments({ city: "karachi" });
    const mulCount     = await Property.countDocuments({ city: "multan" });
    const karHouses    = await Property.countDocuments({ city: "karachi", type: "House" });
    const karCommercial= await Property.countDocuments({ city: "karachi", type: "Commercial" });
    const karPlots     = await Property.countDocuments({ city: "karachi", type: "Plot" });
    const mulHouses    = await Property.countDocuments({ city: "multan",  type: "House" });
    const mulCommercial= await Property.countDocuments({ city: "multan",  type: "Commercial" });
    const mulPlots     = await Property.countDocuments({ city: "multan",  type: "Plot" });

    console.log("\n📈 Database Summary:");
    console.log(`   Karachi → ${karCount} total  (Houses: ${karHouses}, Commercial: ${karCommercial}, Plots: ${karPlots})`);
    console.log(`   Multan  → ${mulCount} total  (Houses: ${mulHouses},  Commercial: ${mulCommercial}, Plots: ${mulPlots})`);
    console.log("\n🎉 Done! Visit /city/karachi and /city/multan to see real properties.\n");

    process.exit(0);
  } catch (err) {
    console.error("\n❌ Seeding failed:", err);
    process.exit(1);
  }
};

seedData();
