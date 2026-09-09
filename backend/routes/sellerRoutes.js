import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import SellerProperty from "../models/SellerProperty.js";

const router = express.Router();

// ── Cloudinary config ────────────────────────────────────────────────────────
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Multer memory storage (no disk, no multer-storage-cloudinary needed) ──────
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) return cb(new Error("Only images allowed"), false);
        cb(null, true);
    },
});

// ── Helper: upload a single buffer to Cloudinary ─────────────────────────────
function uploadToCloudinary(buffer, mimetype) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: "elite-horizon/properties", resource_type: "image" },
            (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
            }
        );
        stream.end(buffer);
    });
}


// ── GET /api/seller/listings/featured  (top 8 approved — public)
router.get("/listings/featured", async (req, res) => {
    try {
        const listings = await SellerProperty.find({ status: "approved" })
            .sort({ createdAt: -1 })
            .limit(8);
        res.json({ listings });
    } catch (err) {
        res.status(500).json({ message: "Server error", detail: err.message });
    }
});

// ── GET /api/seller/listings  (all approved — public, paginated)
router.get("/listings", async (req, res) => {
    try {
        const { purpose, page = 1, limit = 12, city, minPrice, maxPrice, propertyType, minArea, maxArea } = req.query;
        const filter = { status: "approved" };

        if (purpose && purpose !== "All") filter.purpose = purpose;
        if (city) filter["location.city"] = { $regex: city, $options: "i" };
        if (propertyType && propertyType !== "All") {
            filter["propertyType.category"] = { $regex: `^${propertyType}$`, $options: "i" };
        }
        if (minPrice || maxPrice) {
            filter["price.value"] = {};
            if (minPrice) filter["price.value"].$gte = Number(minPrice);
            if (maxPrice) filter["price.value"].$lte = Number(maxPrice);
        }
        if (minArea || maxArea) {
            filter["areaSize.value"] = {};
            if (minArea) filter["areaSize.value"].$gte = Number(minArea);
            if (maxArea) filter["areaSize.value"].$lte = Number(maxArea);
        }

        const total = await SellerProperty.countDocuments(filter);
        const listings = await SellerProperty.find(filter)
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));
        res.json({ listings, total, pages: Math.ceil(total / Number(limit)), page: Number(page) });
    } catch (err) {
        res.status(500).json({ message: "Server error", detail: err.message });
    }
});

// POST /api/seller/list
router.post("/list", upload.array("images", 14), async (req, res) => {

    try {
        const b = req.body;

        // Log all received keys for debugging
        console.log("📦 Body keys:", Object.keys(b));
        console.log("📦 sellerId:", b.sellerId, "| adTitle:", b.adTitle);

        if (!b.sellerId || !b.adTitle) {
            return res.status(400).json({
                message: `Missing required fields: ${!b.sellerId ? "sellerId " : ""}${!b.adTitle ? "adTitle" : ""}`.trim()
            });
        }

        const imagePaths = await Promise.all(
            (req.files || []).map(f => uploadToCloudinary(f.buffer, f.mimetype))
        );

        // amenities may be a single string or an array
        const rawAmenities = b.amenities;
        const amenities = !rawAmenities ? [] : Array.isArray(rawAmenities) ? rawAmenities : [rawAmenities];

        const propertyData = {
            sellerId: b.sellerId,
            purpose: b.purpose || "Sell",
            propertyType: {
                category: b.propCategory || "Home",
                subCategory: b.propSubCategory || "House",
            },
            areaSize: {
                value: Number(b.areaValue) || 0,
                unit: b.areaUnit || "Marla",
            },
            price: {
                value: Number(b.priceValue) || 0,
                currency: "PKR",
            },
            features: {
                furnished: b.furnished || "Unfurnished",
                bedrooms: b.bedrooms || "",
                bathrooms: b.bathrooms || "",
                constructionState: b.constructionState || "Finished",
                amenities,
            },
            adInfo: {
                title: b.adTitle,
                description: b.adDescription || "",
            },
            location: {
                address: b.locationAddress || "",
                city: b.locationCity || "Lahore",
                lat: Number(b.locationLat) || null,
                lng: Number(b.locationLng) || null,
            },
            media: { images: imagePaths, videos: [] },
            contactInfo: {
                name: b.contactName || "",
                email: b.contactEmail || "",
                mobile: b.contactMobile || "",
                showPhone: b.contactShowPhone === "true",
            },
        };

        const newProperty = new SellerProperty(propertyData);
        await newProperty.save();

        res.status(201).json({ message: "Property listed successfully!", property: newProperty });
    } catch (error) {
        console.error("❌ Listing error:", error);
        res.status(500).json({ message: "Server error.", detail: error.message });
    }
});

// GET /api/seller/my-properties/:sellerId
router.get("/my-properties/:sellerId", async (req, res) => {
    try {
        const { sellerId } = req.params;
        const properties = await SellerProperty.find({ sellerId }).sort({ createdAt: -1 });
        res.status(200).json(properties);
    } catch (error) {
        console.error("❌ Fetch properties error:", error);
        res.status(500).json({ message: "Server error while fetching properties." });
    }
});

// GET /api/seller/property/:id — fetch single property for editing
router.get("/property/:id", async (req, res) => {
    try {
        const property = await SellerProperty.findById(req.params.id);
        if (!property) return res.status(404).json({ message: "Property not found." });
        res.status(200).json(property);
    } catch (error) {
        res.status(500).json({ message: "Error fetching property." });
    }
});

// PUT /api/seller/update/:id — update a property (JSON body, no file re-upload)
router.put("/update/:id", async (req, res) => {
    try {
        const b = req.body;
        const updateData = {
            purpose: b.purpose,
            "propertyType.category": b.propCategory,
            "propertyType.subCategory": b.propSubCategory,
            "areaSize.value": Number(b.areaValue) || 0,
            "areaSize.unit": b.areaUnit,
            "price.value": Number(b.priceValue) || 0,
            "features.furnished": b.furnished,
            "features.bedrooms": b.bedrooms,
            "features.bathrooms": b.bathrooms,
            "features.constructionState": b.constructionState,
            "features.amenities": Array.isArray(b.amenities) ? b.amenities : b.amenities ? [b.amenities] : [],
            "adInfo.title": b.adTitle,
            "adInfo.description": b.adDescription,
            "location.address": b.locationAddress,
            "location.city": b.locationCity,
            "location.lat": Number(b.locationLat) || null,
            "location.lng": Number(b.locationLng) || null,
            "price.currency": "PKR",
            "contactInfo.name": b.contactName,
            "contactInfo.mobile": b.contactMobile,
            "contactInfo.showPhone": b.contactShowPhone === "true" || b.contactShowPhone === true,
        };

        const updated = await SellerProperty.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: false }
        );

        if (!updated) return res.status(404).json({ message: "Property not found." });
        res.status(200).json({ message: "Property updated successfully!", property: updated });
    } catch (error) {
        console.error("❌ Update error:", error);
        res.status(500).json({ message: "Server error during update.", detail: error.message });
    }
});

// DELETE /api/seller/delete/:id
router.delete("/delete/:id", async (req, res) => {
    try {
        const deleted = await SellerProperty.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Property not found." });
        res.status(200).json({ message: "Property deleted successfully." });
    } catch (error) {
        console.error("❌ Delete error:", error);
        res.status(500).json({ message: "Server error during deletion." });
    }
});

// GET /api/seller/stats/:sellerId  — dashboard stats
router.get("/stats/:sellerId", async (req, res) => {
    try {
        const { sellerId } = req.params;
        const properties = await SellerProperty.find({ sellerId });
        const total = properties.length;
        const forSale = properties.filter(p => p.purpose === "Sell").length;
        const forRent = properties.filter(p => p.purpose === "Rent").length;
        const cities = [...new Set(properties.map(p => p.location?.city).filter(Boolean))];
        res.status(200).json({ total, forSale, forRent, cities, properties });
    } catch (error) {
        res.status(500).json({ message: "Error fetching stats." });
    }
});

export default router;

