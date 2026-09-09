import mongoose from "mongoose";

const sellerPropertySchema = new mongoose.Schema(
    {
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        purpose: {
            type: String,
            enum: ["Sell", "Rent"],
            required: true,
        },
        propertyType: {
            category: { type: String, enum: ["Home", "Plots", "Commercial"], required: true },
            subCategory: { type: String, required: true },
        },

        areaSize: {
            value: { type: Number, required: true },
            unit: { type: String, required: true }, // Marla, Sqft, etc.
        },
        price: {
            value: { type: Number, required: true },
            currency: { type: String, default: "PKR" },
        },
        features: {
            furnished: { type: String, enum: ["Unfurnished", "Furnished"] },
            bedrooms: { type: String },
            bathrooms: { type: String },
            constructionState: { type: String, enum: ["Grey Structure", "Finished"] },
            amenities: [{ type: String }],
        },
        adInfo: {
            title: { type: String, required: true },
            description: { type: String, required: true },
        },
        location: {
            address: { type: String, required: true },
            city: { type: String, required: true },
            lat: { type: Number },
            lng: { type: Number },
        },
        media: {
            images: [{ type: String }],
            videos: [{ type: String }],
        },
        contactInfo: {
            name: { type: String },
            email: { type: String, required: true },
            mobile: { type: String, required: true },
            landline: { type: String },
            showPhone: { type: Boolean, default: true },
        },
        platform: { type: String, default: "Elite Horizon" },
        // Approval workflow
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
            index: true,
        },
        rejectionReason: { type: String, default: "" },
    },
    {
        timestamps: true,
    }
);

const SellerProperty = mongoose.model("SellerProperty", sellerPropertySchema);

export default SellerProperty;
