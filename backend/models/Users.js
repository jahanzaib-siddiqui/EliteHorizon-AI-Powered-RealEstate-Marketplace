import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
        },
        monthlyIncome: {
            type: Number,
            default: 0,
        },
        bankBalance: {
            type: Number,
            default: 0,
        },
        avatar: {
            type: String,
            default: "/avatar_male_1_1772875227901.png", // Default avatar
        },
        role: {
            type: String,
            enum: ["buyer", "seller"],
            default: "buyer",
        },
        cnic: {
            type: String,
            required: false,   // enforced in route, not model (allows old users without CNIC)
            unique: true,
            sparse: true,      // allows multiple null values with unique index
            trim: true,
            match: [/^\d{5}-\d{7}-\d{1}$/, "CNIC must be in format XXXXX-XXXXXXX-X"],
        },
        accountStatus: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
        rejectionReason: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", userSchema);

export default User;
