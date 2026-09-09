import mongoose from "mongoose";
import dotenv from "dotenv";
import Property from "./models/Property.js";

dotenv.config();

const properties = [
    // 1. Prime Elite (DHA, Gulberg, Lake View City)
    {
        title: "1 Kanal Luxury House in DHA Phase 6",
        city: "lahore",
        location: "DHA Phase 6",
        type: "House",
        price: 65000000,
        bedrooms: 5,
        bathrooms: 6,
        area: 20, // 1 Kanal
        lat: 31.4720, lng: 74.4250,
        image: "https://images.unsplash.com/photo-1600596542815-4054b4205f8c?auto=format&fit=crop&w=800&q=80",
    },
    {
        title: "10 Marla Brand New House in Gulberg III",
        city: "lahore",
        location: "Gulberg III",
        type: "House",
        price: 45000000,
        bedrooms: 4,
        bathrooms: 5,
        area: 10,
        lat: 31.5100, lng: 74.3450,
        image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
    },
    {
        title: "1 Kanal Designer House in DHA Phase 8",
        city: "lahore",
        location: "DHA Phase 8",
        type: "House", // Changed from Plot
        price: 75000000,
        bedrooms: 5,
        bathrooms: 6,
        area: 20,
        lat: 31.4900, lng: 74.4500,
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    },
    {
        title: "2 Kanal Farmhouse Style in Lake View City",
        city: "lahore",
        location: "Lake View City",
        type: "House",
        price: 120000000,
        bedrooms: 6,
        bathrooms: 7,
        area: 40,
        lat: 31.4550, lng: 74.3800,
        image: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=800&q=80",
    },

    // 2. Luxury (Bahria Town, Johar Town, Lake City)
    {
        title: "10 Marla Modern House in Bahria Town Sector C",
        city: "lahore",
        location: "Bahria Town",
        type: "House",
        price: 32000000,
        bedrooms: 4,
        bathrooms: 4,
        area: 10,
        lat: 31.3700, lng: 74.1900,
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
    },
    {
        title: "5 Marla House in Johar Town Block J",
        city: "lahore",
        location: "Johar Town",
        type: "House",
        price: 22000000,
        bedrooms: 3,
        bathrooms: 3,
        area: 5,
        lat: 31.4650, lng: 74.2950,
        image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
    },
    {
        title: "1 Kanal Spanish Villa in Lake City M-1",
        city: "lahore",
        location: "Lake City",
        type: "House", // Changed from Plot
        price: 55000000,
        bedrooms: 5,
        bathrooms: 6,
        area: 20,
        lat: 31.3580, lng: 74.2250,
        image: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=800&q=80",
    },
    {
        title: "10 Marla Grey Structure in Bahria Town",
        city: "lahore",
        location: "Bahria Town",
        type: "House",
        price: 18000000,
        bedrooms: 4,
        bathrooms: 4,
        area: 10,
        lat: 31.3650, lng: 74.1850,
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    },

    // 3. Mid-Tier (Paragon City, Al-Kabir Town)
    {
        title: "5 Marla House in Paragon City",
        city: "lahore",
        location: "Paragon City",
        type: "House",
        price: 18000000,
        bedrooms: 3,
        bathrooms: 3,
        area: 5,
        lat: 31.5450, lng: 74.4500, // Near airport
        image: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=800&q=80",
    },
    {
        title: "10 Marla Modern House in Al-Kabir Town",
        city: "lahore",
        location: "Al-Kabir Town",
        type: "House", // Changed from Plot
        price: 25000000,
        bedrooms: 4,
        bathrooms: 4,
        area: 10,
        lat: 31.3900, lng: 74.2050,
        image: "https://images.unsplash.com/photo-1576941081606-1851927800e2?auto=format&fit=crop&w=800&q=80",
    },
    {
        title: "5 Marla House Double Story in Shabbir Town",
        city: "lahore",
        location: "Shabbir Town",
        type: "House",
        price: 15000000,
        bedrooms: 3,
        bathrooms: 3,
        area: 5,
        lat: 31.4200, lng: 74.2800,
        image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80",
    },
    {
        title: "1 Kanal House near Park in DHA Rahbar",
        city: "lahore",
        location: "DHA Rahbar",
        type: "House", // Changed from Plot
        price: 35000000,
        bedrooms: 5,
        bathrooms: 5,
        area: 20,
        lat: 31.4100, lng: 74.2500,
        image: "https://images.unsplash.com/photo-1510627489930-0c1b0dc58e85?auto=format&fit=crop&w=800&q=80",
    },

    // 4. Budget / Entry-Level (New Lahore City, Motorway City)
    {
        title: "3 Marla House in New Lahore City",
        city: "lahore",
        location: "New Lahore City",
        type: "House",
        price: 8500000, // 85 Lakh
        bedrooms: 2,
        bathrooms: 2,
        area: 3,
        lat: 31.3400, lng: 74.1200,
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    },
    {
        title: "5 Marla Affordable House in Lahore Motorway City",
        city: "lahore",
        location: "Lahore Motorway City",
        type: "House", // Changed from Plot
        price: 9500000, // 95 Lakh
        bedrooms: 3,
        bathrooms: 2,
        area: 5,
        lat: 31.6000, lng: 74.0500,
        image: "https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?auto=format&fit=crop&w=800&q=80",
    },
    {
        title: "5 Marla Single Story in Shadman Enclave",
        city: "lahore",
        location: "Shadman Enclave",
        type: "House", // Changed from Plot
        price: 8000000, // 80 Lakh
        bedrooms: 2,
        bathrooms: 2,
        area: 5,
        lat: 31.3200, lng: 74.1500,
        image: "https://images.unsplash.com/photo-1558235282-159c99689843?auto=format&fit=crop&w=800&q=80",
    },
    {
        title: "Low Cost 3 Marla House in Peripheral Scheme",
        city: "lahore",
        location: "Bahria Education & Medical City",
        type: "House",
        price: 7500000, // 75 Lakh
        bedrooms: 2,
        bathrooms: 2,
        area: 3,
        lat: 31.2800, lng: 74.2000,
        image: "https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=800&q=80",
    },
];

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected");

        console.log("Clearing existing Lahore properties...");
        await Property.deleteMany({ city: "lahore" });

        console.log("Inserting new properties...");
        await Property.insertMany(properties);

        console.log("Data Seeded Successfully!");
        process.exit();
    } catch (err) {
        console.error("Error seeding data:", err);
        process.exit(1);
    }
};

seedData();
