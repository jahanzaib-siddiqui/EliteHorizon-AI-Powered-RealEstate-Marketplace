/**
 * check_availability.js  v2
 *
 * Re-runs the check on properties currently marked isAvailable: true
 * to catch those whose "This property is no longer available" signal
 * appears deep in the HTML (was missed in v1 due to 30KB read limit).
 *
 * Detection:
 *   HTTP 410  → permanently removed
 *   HTTP 200 + "This property is no longer available" anywhere in HTML → sold/expired
 *
 * Usage:  node check_availability.js
 */

import mongoose from "mongoose";
import https from "https";
import http from "http";
import { URL } from "url";
import dotenv from "dotenv";

dotenv.config();

const propertySchema = new mongoose.Schema({
  title: String, city: String, location: String, type: String,
  price: Number, bedrooms: Number, bathrooms: Number, area: String,
  lat: Number, lng: Number, image: String, page_url: String,
  purpose: String, rentPrice: Number,
  isAvailable: { type: Boolean, default: true }
}, { timestamps: true });

const Property = mongoose.model("Property", propertySchema);

const CONCURRENCY   = 5;     // keep lower — full HTML pages are large
const TIMEOUT_MS    = 20000; // 20s — larger pages need more time
const REQUEST_DELAY = 400;

const SOLD_SIGNAL = "This property is no longer available";

function fetchPage(rawUrl) {
  return new Promise((resolve) => {
    if (!rawUrl || !rawUrl.startsWith("http")) {
      return resolve({ ok: false, status: 0, reason: "invalid_url", body: "" });
    }

    const makeRequest = (urlStr, redirectCount = 0) => {
      if (redirectCount > 5) return resolve({ ok: false, status: 0, reason: "too_many_redirects", body: "" });

      let parsedUrl;
      try { parsedUrl = new URL(urlStr); }
      catch { return resolve({ ok: false, status: 0, reason: "parse_error", body: "" }); }

      const lib = parsedUrl.protocol === "https:" ? https : http;

      const req = lib.get(urlStr, {
        timeout: TIMEOUT_MS,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
        }
      }, (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          let nextUrl = res.headers.location;
          if (nextUrl.startsWith("/")) nextUrl = `${parsedUrl.protocol}//${parsedUrl.host}${nextUrl}`;
          res.resume();
          return makeRequest(nextUrl, redirectCount + 1);
        }

        if (res.statusCode === 410) {
          res.resume();
          return resolve({ ok: true, status: 410, body: "" });
        }

        // Read full body — signal can appear at ~686KB into the page
        let body = "";
        let found = false;
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
          // Early exit once we find the signal — no need to read more
          if (!found && body.includes(SOLD_SIGNAL)) {
            found = true;
            res.destroy();
          }
          // Hard cap at 900KB to avoid runaway memory
          if (body.length > 900000) res.destroy();
        });
        res.on("close", () => resolve({ ok: true, status: res.statusCode, body, found }));
      });

      req.on("timeout", () => { req.destroy(); resolve({ ok: false, status: 0, reason: "timeout", body: "" }); });
      req.on("error", (e) => resolve({ ok: false, status: 0, reason: e.message, body: "" }));
    };

    makeRequest(rawUrl);
  });
}

async function checkUrl(page_url) {
  const result = await fetchPage(page_url);

  if (!result.ok) {
    return { available: true, reason: `network_error: ${result.reason}` };
  }

  if (result.status === 410) {
    return { available: false, reason: "HTTP 410 Gone" };
  }

  if (result.found || result.body.includes(SOLD_SIGNAL)) {
    return { available: false, reason: "HTML: property no longer available" };
  }

  return { available: true, reason: "ok" };
}

async function processBatch(batch, stats) {
  await Promise.all(batch.map(async (property) => {
    const { available, reason } = await checkUrl(property.page_url);

    if (!available) {
      await Property.updateOne({ _id: property._id }, { $set: { isAvailable: false } });
      stats.newlyMarked++;
      console.log(`\n  ❌ [${stats.checked}/${stats.total}] ${(property.title || "").slice(0, 55)}`);
      console.log(`     → ${reason}`);
    } else {
      stats.confirmed++;
    }
    stats.checked++;
    process.stdout.write(`\r  ✅ Confirmed: ${stats.confirmed}  🆕 Newly removed: ${stats.newlyMarked}  [${stats.checked}/${stats.total}]    `);
  }));
}

async function main() {
  console.log("\n🔌 Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected:", process.env.MONGO_URI);

  // Only re-check properties currently marked as available
  const total = await Property.countDocuments({ isAvailable: true });
  console.log(`\n📊 Re-checking ${total} currently-available properties for missed signals...\n`);
  console.log("─".repeat(65));

  const stats = { confirmed: 0, newlyMarked: 0, checked: 0, total };

  const properties = await Property.find(
    { isAvailable: true, page_url: { $exists: true, $ne: null, $ne: "" } },
    "_id title page_url"
  ).lean();

  const startTime = Date.now();

  for (let i = 0; i < properties.length; i += CONCURRENCY) {
    const batch = properties.slice(i, i + CONCURRENCY);
    await processBatch(batch, stats);
    await new Promise(r => setTimeout(r, REQUEST_DELAY));
  }

  const elapsed = Math.round((Date.now() - startTime) / 1000);

  console.log("\n\n" + "─".repeat(65));
  console.log("🏁 DONE!\n");
  console.log(`📊 Results:`);
  console.log(`   ✅ Still valid                  : ${stats.confirmed}`);
  console.log(`   🆕 Newly marked unavailable     : ${stats.newlyMarked}`);
  console.log(`   ⏱️  Time taken                  : ${Math.floor(elapsed/60)}m ${elapsed%60}s`);

  const remaining = await Property.countDocuments({ isAvailable: true });
  console.log(`\n🎉 Website now shows only ${remaining} truly valid properties.\n`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
