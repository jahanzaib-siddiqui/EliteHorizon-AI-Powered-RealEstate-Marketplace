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
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", userSchema);

export default User;
