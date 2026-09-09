import mongoose from "mongoose";

/**
 * NewListing — stores every property listed by sellers on the website.
 * MongoDB collection name: NewListings
 */
const newListingSchema = new mongoose.Schema(
    {
        sellerId: {
            type: String,   // stored as string for flexibility (ObjectId ref)
            required: true,
        },
        purpose: {
            type: String,
            enum: ["Sell", "Rent"],
            required: true,
        },
        propertyType: {
            category:    { type: String, enum: ["Home", "Plots", "Commercial"], required: true },
            subCategory: { type: String, required: true },
        },
        areaSize: {
            value: { type: Number, default: 0 },
            unit:  { type: String, default: "Marla" },
        },
        price: {
            value:    { type: Number, default: 0 },
            currency: { type: String, default: "PKR" },
        },
        features: {
            furnished:         { type: String },
            bedrooms:          { type: String },
            bathrooms:         { type: String },
            constructionState: { type: String },
            amenities:         [{ type: String }],
        },
        adInfo: {
            title:       { type: String, required: true },
            description: { type: String, default: "" },
        },
        location: {
            address: { type: String, default: "" },
            city:    { type: String, default: "Lahore" },
            lat:     { type: Number, default: null },
            lng:     { type: Number, default: null },
        },
        media: {
            images: [{ type: String }],
            videos: [{ type: String }],
        },
        contactInfo: {
            name:      { type: String, default: "" },
            email:     { type: String, default: "" },
            mobile:    { type: String, default: "" },
            showPhone: { type: Boolean, default: true },
        },
        platform: { type: String, default: "Elite Horizon" },
        status:   { type: String, enum: ["active", "sold", "rented", "withdrawn"], default: "active" },
    },
    {
        timestamps: true,
        collection: "NewListings",   // ← explicit MongoDB collection name
    }
);

const NewListing = mongoose.model("NewListing", newListingSchema);

export default NewListing;
