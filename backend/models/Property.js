import mongoose from "mongoose";

const propertySchema = new mongoose.Schema({
  title:       { type: String, required: true },
  city:        { type: String, required: true },
  location:    { type: String, required: true },
  type:        { type: String, enum: ["House", "Plot", "Commercial"], required: true },
  price:       { type: Number, required: true },
  bedrooms:    { type: Number },
  bathrooms:   { type: Number },
  area:        { type: String },          // normalized marla value (or raw string)
  lat:         { type: Number },
  lng:         { type: Number },
  image:       { type: String },
  page_url:    { type: String },          // Zameen.com listing URL — opens on click
  purpose:     { type: String, enum: ["Buy", "Rent"], default: "Buy" },
  rentPrice:   { type: Number },
  // ── Extra fields from real JSON data ──────────────────────────────────────
  description:  { type: String, default: "" },
  phone_number: { type: String, default: "" },
  agency_name:  { type: String, default: "" },
  // ──────────────────────────────────────────────────────────────────────────
  isAvailable: { type: Boolean, default: true, index: true }
}, { timestamps: true });

export default mongoose.model("Property", propertySchema);
