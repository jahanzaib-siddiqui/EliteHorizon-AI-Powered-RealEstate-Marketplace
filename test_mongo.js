import mongoose from "mongoose";
import Property from "./backend/models/Property.js";

async function run() {
    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/elite-horizon", {
            serverSelectionTimeoutMS: 5000,
            family: 4
        });
        console.log("Connected. Inserting 1 doc...");
        await Property.create({
            title: "Test",
            city: "lahore",
            location: "Test Loc",
            type: "House",
            price: 100
        });
        console.log("Inserted!");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
