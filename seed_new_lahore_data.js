const mongoose = require("mongoose");
const fs = require("fs");
const csv = require("csv-parser");
const dotenv = require("dotenv");

dotenv.config({ path: "./backend/.env" });

const MONGO_URI = "mongodb://127.0.0.1:27017/elite-horizon";

// Define schema directly to avoid import/export conflicts with ES modules
const propertySchema = new mongoose.Schema({
    title: { type: String, required: true },
    city: { type: String, required: true },
    location: { type: String, required: true },
    type: { type: String, enum: ["House", "Plot", "Commercial"], required: true },
    price: { type: Number, required: true },
    bedrooms: { type: Number },
    bathrooms: { type: Number },
    area: { type: String }, // Actually stores numbers as string if needed, or string.
    lat: { type: Number },
    lng: { type: Number },
    image: { type: String },
    page_url: { type: String },
    purpose: { type: String, enum: ["Buy", "Rent"], default: "Buy" },
    rentPrice: { type: Number }
});
const Property = mongoose.model("Property", propertySchema);

mongoose
    .connect(MONGO_URI, { family: 4 })
    .then(() => console.log("✅ MongoDB Connected (IPv4)"))
    .catch((err) => {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1);
    });

const seedProperties = async () => {
    try {
        console.log("🗑️  Clearing old dataset to make way for new image-rich data...");
        await Property.deleteMany({});
        console.log("✅ Old dataset wiped.");

        const properties = [];
        const filesToSeed = [
            "./dataset/Lahore_homes_buy.csv",
            "./dataset/Lahore_homes_rent.csv",
            "./dataset/Lahore_commercial_buy.csv",
            "./dataset/Lahore_commercial_rent.csv",
            "./dataset/Lahore_plots_buy.csv",
            "./dataset/Islamabad_homes_buy.csv",
            "./dataset/Islamabad_homes_rent.csv",
            "./dataset/Islamabad_commercial_buy.csv",
            "./dataset/Islamabad_commercial_rent.csv",
            "./dataset/Islamabad_plots_buy.csv"
        ];

        for (const file of filesToSeed) {
            console.log(`📖 Reading ${file}...`);
            const stream = fs.createReadStream(file).pipe(csv());

            for await (const row of stream) {
                // Map purpose (sale -> Buy, rent -> Rent)
                const rawPurpose = (row.purpose || "sale").toLowerCase();
                const purpose = rawPurpose === "rent" ? "Rent" : "Buy";

                // Map property type 
                const rawType = (row.property_type || "house").toLowerCase();
                let pType = "House";
                if (rawType.includes("plot") || rawType.includes("file") || rawType.includes("land") || rawType.includes("form")) {
                    pType = "Plot";
                } else if (
                    ["commercial", "shop", "building", "office", "factory", "warehouse", "other"].some(t => rawType.includes(t)) ||
                    file.toLowerCase().includes("commercial")
                ) {
                    pType = "Commercial";
                }

                let priceNum = parseInt(row.price) || 0;

                // Attempt to pick the best photo (sometimes photos/0 is empty but photos/1 exists)
                let selectedImage = "https://media.zameen.com/thumbnails/20474298-800x600.webp"; // fallback
                for (let i = 0; i <= 10; i++) {
                    if (row[`photos/${i}`] && row[`photos/${i}`].includes("http")) {
                        selectedImage = row[`photos/${i}`];
                        break;
                    }
                }

                // Convert area unit properly so that "p.area === 5" logic works on Frontend
                let areaVal = parseFloat(row.area) || 0;
                const areaUnit = (row.area_unit || "Marla").toLowerCase();

                if (areaUnit.includes("kanal")) {
                    areaVal = areaVal * 20;
                } else if (areaUnit.includes("sqft") || areaUnit.includes("sq. ft.")) {
                    areaVal = Math.round(areaVal / 225); // Approximate 225 sqft = 1 Marla in Lahore/Islamabad
                }

                const currentCity = row.city || (file.toLowerCase().includes("islamabad") ? "Islamabad" : "Lahore");

                const newProp = {
                    title: row.title || `Beautiful Property in ${currentCity}`,
                    city: currentCity,
                    location: row.location || currentCity,
                    type: pType,
                    purpose: purpose,
                    price: priceNum,
                    bedrooms: parseInt(row.bedrooms) || 0,
                    bathrooms: parseInt(row.bathrooms) || 0,
                    area: areaVal.toString(),
                    image: selectedImage,
                    lat: parseFloat(row.latitude) || (currentCity === "Islamabad" ? 33.6844 : 31.5204),
                    lng: parseFloat(row.longitude) || (currentCity === "Islamabad" ? 73.0479 : 74.3587),
                    page_url: row.url || "",
                };

                if (purpose === "Rent") {
                    newProp.rentPrice = priceNum;
                }

                properties.push(newProp);
            }
        }

        console.log(`⏳ Inserting ${properties.length} updated properties...`);
        await Property.insertMany(properties);

        console.log("🎉 Seeding complete!");
        process.exit();
    } catch (error) {
        console.error("❌ Error seeding properties:", error);
        process.exit(1);
    }
};

seedProperties();
