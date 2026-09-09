import mongoose from "mongoose";
import dotenv from "dotenv";
import Property from "./models/Property.js";

dotenv.config({ path: "./backend/.env" });

/**
 * Helper to generate random coordinates near a center point
 */
const jitter = (center, amount = 0.05) => {
    return center + (Math.random() - 0.5) * amount;
};

// CONFIRMED TIER LIST FOR STRICT PRICING
const TIERS = {
    Prime: { multiplier: 4.5, areas: ["DHA", "Cantt", "Model Town", "F-6", "F-7", "E-7", "Blue Area", "Clifton", "Royal Orchard"] },
    Luxury: { multiplier: 3.0, areas: ["Bahria Town", "Johar Town", "Lake City", "Valencia", "Wapda Town", "Askari", "F-8", "F-10", "F-11", "PECHS", "Navy", "Gulgasht", "Bosan"] },
    Mid: { multiplier: 1.8, areas: ["Paragon City", "State Life", "Eden City", "Allama Iqbal Town", "Gulberg Greens", "G-10", "I-8", "Gulshan-e-Iqbal", "Nazimabad", "Garden", "New Multan"] },
    Budget: { multiplier: 0.9, areas: ["Green Cap", "Township", "Samanabad", "I-10", "Soan Garden", "Khanna", "Korangi", "Orangi Town", "Surjani Town", "Malir", "Shah Rukn-e-Alam", "Mumtazabad"] }
};

// Base data configurations with explicit Tiers
const CITIES = {
    lahore: {
        lat: 31.5204, lng: 74.3587,
        areas: [
            { name: "DHA Phase 6", tier: "Prime", lat: 31.4790, lng: 74.4087 },
            { name: "Model Town", tier: "Prime", lat: 31.4826, lng: 74.3263 },
            { name: "Bahria Town", tier: "Luxury", lat: 31.3697, lng: 74.1777 },
            { name: "Johar Town", tier: "Luxury", lat: 31.4697, lng: 74.2728 },
            { name: "Valencia", tier: "Luxury", lat: 31.4239, lng: 74.2464 },
            { name: "Paragon City", tier: "Mid", lat: 31.5452, lng: 74.4375 },
            { name: "State Life", tier: "Mid", lat: 31.4650, lng: 74.3980 },
            { name: "Township", tier: "Budget", lat: 31.4449, lng: 74.3168 },
            { name: "Green Cap", tier: "Budget", lat: 31.4390, lng: 74.3050 }
        ]
    },
    karachi: {
        lat: 24.8607, lng: 67.0011,
        areas: [
            { name: "Clifton", tier: "Prime", lat: 24.8270, lng: 67.0251 },
            { name: "DHA Phase 8", tier: "Prime", lat: 24.8023, lng: 67.0543 },
            { name: "Bahria Town", tier: "Luxury", lat: 25.0485, lng: 67.3197 },
            { name: "PECHS", tier: "Luxury", lat: 24.8687, lng: 67.0601 },
            { name: "Gulshan-e-Iqbal", tier: "Mid", lat: 24.9255, lng: 67.0940 },
            { name: "North Nazimabad", tier: "Mid", lat: 24.9392, lng: 67.0345 },
            { name: "Korangi", tier: "Budget", lat: 24.8465, lng: 67.1287 },
            { name: "Orangi Town", tier: "Budget", lat: 24.9450, lng: 67.0000 },
            { name: "Surjani Town", tier: "Budget", lat: 25.0330, lng: 67.0500 }
        ]
    },
    islamabad: {
        lat: 33.6844, lng: 73.0479,
        areas: [
            { name: "F-6", tier: "Prime", lat: 33.7296, lng: 73.0728 },
            { name: "Blue Area", tier: "Prime", lat: 33.7077, lng: 73.0573 },
            { name: "F-10", tier: "Luxury", lat: 33.6900, lng: 73.0100 },
            { name: "DHA Phase 2", tier: "Luxury", lat: 33.5651, lng: 73.1256 },
            { name: "G-10", tier: "Mid", lat: 33.6744, lng: 73.0135 },
            { name: "I-8", tier: "Mid", lat: 33.6672, lng: 73.0747 },
            { name: "I-10", tier: "Budget", lat: 33.6450, lng: 73.0350 },
            { name: "Soan Garden", tier: "Budget", lat: 33.5680, lng: 73.1550 }
        ]
    },
    multan: {
        lat: 30.1575, lng: 71.5249,
        areas: [
            { name: "DHA Multan", tier: "Prime", lat: 30.2229, lng: 71.5249 },
            { name: "Cantt", tier: "Prime", lat: 30.1803, lng: 71.4586 },
            { name: "Gulgasht", tier: "Luxury", lat: 30.2173, lng: 71.4880 },
            { name: "Wapda Town", tier: "Luxury", lat: 30.2520, lng: 71.4429 },
            { name: "New Multan", tier: "Mid", lat: 30.1833, lng: 71.4833 },
            { name: "Mumtazabad", tier: "Budget", lat: 30.1750, lng: 71.4350 }
        ]
    }
};

const IMAGES = {
    House: [
        "https://images.unsplash.com/photo-1600596542815-4054b4205f8c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
    ],
    Commercial: [
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
    ],
    Plot: [
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1464296458354-9b392d4b7c6d?auto=format&fit=crop&w=800&q=80"
    ]
};

const generateProperties = () => {
    const properties = [];

    Object.entries(CITIES).forEach(([cityKey, cityData]) => {
        cityData.areas.forEach(area => {
            const multiplier = TIERS[area.tier].multiplier;

            // --- PLOTS (BUY ONLY) ---
            for (let i = 0; i < 5; i++) {
                const size = [5, 10, 20][Math.floor(Math.random() * 3)];
                const basePrice = (1000000 * multiplier * size);
                const noise = Math.random() * 500000;

                properties.push({
                    title: `${size === 20 ? '1 Kanal' : size + ' Marla'} Plot in ${area.name}`,
                    city: cityKey,
                    location: area.name,
                    type: "Plot",
                    purpose: "Buy",
                    price: Math.floor(basePrice + noise),
                    rentPrice: 0,
                    bedrooms: 0,
                    bathrooms: 0,
                    area: size,
                    lat: jitter(area.lat, 0.005),
                    lng: jitter(area.lng, 0.005),
                    image: IMAGES.Plot[Math.floor(Math.random() * IMAGES.Plot.length)]
                });
            }

            // --- HOUSES (BUY) ---
            for (let i = 0; i < 4; i++) {
                const size = [5, 10, 20][Math.floor(Math.random() * 3)];
                const price = (2200000 * multiplier * size);

                properties.push({
                    title: `${size === 20 ? '1 Kanal' : size + ' Marla'} House`,
                    city: cityKey,
                    location: area.name,
                    type: "House",
                    purpose: "Buy",
                    price: Math.floor(price),
                    rentPrice: 0,
                    bedrooms: size >= 10 ? 5 : 3,
                    bathrooms: size >= 10 ? 6 : 4,
                    area: size,
                    lat: jitter(area.lat, 0.005),
                    lng: jitter(area.lng, 0.005),
                    image: IMAGES.House[Math.floor(Math.random() * IMAGES.House.length)]
                });
            }

            // --- HOUSES (RENT) - INCREASED COUNT ---
            for (let i = 0; i < 8; i++) {
                const size = [5, 10, 20][Math.floor(Math.random() * 3)];
                const buyPrice = (2200000 * multiplier * size);
                // Rent rule of thumb: 0.4% - 0.6% of property value per month
                const monthlyRent = buyPrice * 0.005;

                properties.push({
                    title: `${size === 20 ? '1 Kanal' : size + ' Marla'} House for Rent`,
                    city: cityKey,
                    location: area.name,
                    type: "House",
                    purpose: "Rent",
                    price: 0,
                    rentPrice: Math.floor(monthlyRent),
                    bedrooms: size >= 10 ? 5 : 3,
                    bathrooms: size >= 10 ? 6 : 4,
                    area: size,
                    lat: jitter(area.lat, 0.005),
                    lng: jitter(area.lng, 0.005),
                    image: IMAGES.House[Math.floor(Math.random() * IMAGES.House.length)]
                });
            }

            // --- COMMERCIAL (RENT & BUY) ---
            for (let i = 0; i < 5; i++) {
                const size = [4, 8][Math.floor(Math.random() * 2)];
                const buyPrice = (5000000 * multiplier * size);
                // Ensure good mix: 60% Rent, 40% Buy
                const isRent = Math.random() > 0.4;
                const monthlyRent = buyPrice * 0.008; // Commercial rent usually higher yield

                properties.push({
                    title: `${size} Marla Commercial`,
                    city: cityKey,
                    location: area.name,
                    type: "Commercial",
                    purpose: isRent ? "Rent" : "Buy",
                    price: isRent ? 0 : Math.floor(buyPrice),
                    rentPrice: isRent ? Math.floor(monthlyRent) : 0,
                    bedrooms: 0,
                    bathrooms: 1,
                    area: size,
                    lat: jitter(area.lat, 0.005),
                    lng: jitter(area.lng, 0.005),
                    image: IMAGES.Commercial[Math.floor(Math.random() * IMAGES.Commercial.length)]
                });
            }
        });
    });

    return properties;
};

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected");

        console.log("Clearing all existing properties...");
        await Property.deleteMany({});

        const newProperties = generateProperties();
        console.log(`Inserting ${newProperties.length} new properties (Buy & Rent)...`);

        await Property.insertMany(newProperties);

        console.log("Data Seeded Successfully!");
        process.exit();
    } catch (err) {
        console.error("Error seeding data:", err);
        process.exit(1);
    }
};

seedData();
