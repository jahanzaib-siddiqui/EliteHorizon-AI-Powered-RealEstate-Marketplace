import fs from "fs";
import csv from "csv-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Property from "./models/Property.js";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "backend", ".env") });

const BATCH_SIZE = 50;

const defaultImages = [
    "https://images.unsplash.com/photo-1600596542815-4054b4205f8c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=800&q=80"
];

const plotImages = [
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80"
];

function getRandomImage(type) {
    if (type === "Plot") {
        return plotImages[Math.floor(Math.random() * plotImages.length)];
    }
    return defaultImages[Math.floor(Math.random() * defaultImages.length)];
}

const seedRealData = async () => {
    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/elite-horizon", {
            serverSelectionTimeoutMS: 5000,
        });
        console.log("MongoDB Connected", mongoose.connection.readyState);

        console.log("Database cleared manually, beginning stream...");

        let propertiesBatch = [];
        let totalInserted = 0;

        const stream = fs.createReadStream('../dataset/Property.csv')
            .pipe(csv({ separator: ';' }));

        stream.on('data', async (row) => {
            // Ensure valid lat/lng before adding
            const lat = parseFloat(row.latitude);
            const lng = parseFloat(row.longitude);

            if (isNaN(lat) || isNaN(lng) || !row.price) return;

            // Restrict to Lahore only
            if (!row.city || row.city.toLowerCase() !== "lahore") return;

            // Format the type
            let type = "House";
            if (row.property_type && row.property_type.toLowerCase().includes("plot")) type = "Plot";
            if (row.property_type && row.property_type.toLowerCase().includes("commercial")) type = "Commercial";

            const purpose = row.purpose === "For Rent" ? "Rent" : "Buy";

            // Construct a meaningful title
            const title = `${row.area || ''} ${type} in ${row.location || ''}, ${row.city || ''}`.trim();

            const property = {
                title: title,
                city: row.city ? row.city.toLowerCase() : "unknown",
                location: row.location || "Unknown Location",
                type: type,
                price: parseInt(row.price) || 0,
                bedrooms: parseInt(row.bedrooms) || 0,
                bathrooms: parseInt(row.baths) || 0,
                area: row.area || "",
                lat: lat,
                lng: lng,
                image: getRandomImage(type),
                purpose: purpose,
                page_url: row.page_url || "",
            };

            // If it is rent, copy price to rentPrice for consistency based on backend logic
            if (purpose === "Rent") {
                property.rentPrice = property.price;
            }

            propertiesBatch.push(property);

            if (propertiesBatch.length >= BATCH_SIZE) {
                stream.pause();
                try {
                    const batchToInsert = [...propertiesBatch];
                    propertiesBatch = []; // clear quickly
                    await Property.insertMany(batchToInsert);
                    totalInserted += batchToInsert.length;
                    console.log(`Inserted ${totalInserted} properties...`);
                    stream.resume();
                } catch (err) {
                    console.error("Insert error", err);
                    stream.resume();
                }
            }
        })
            .on('end', async () => {
                // Insert any remaining items
                if (propertiesBatch.length > 0) {
                    await Property.insertMany(propertiesBatch);
                    totalInserted += propertiesBatch.length;
                    console.log(`Inserted final batch. Total: ${totalInserted}`);
                }
                console.log("CSV processing complete.");
                process.exit();
            })
            .on('error', (err) => {
                console.error("Error parsing CSV:", err);
            });

    } catch (err) {
        console.error("Database Error:", err);
        process.exit(1);
    }
};

seedRealData();
