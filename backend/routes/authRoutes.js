import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/Users.js";

const router = express.Router();

// Helper to validate password
const isPasswordValid = (password) => {
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};

// Sign up
router.post("/signup", async (req, res) => {
    try {
        const { name, email, password, monthlyIncome, bankBalance, avatar, role } = req.body;

        // Basic validation
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email, and password are required." });
        }

        if (!isPasswordValid(password)) {
            return res.status(400).json({
                message:
                    "Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, and a special character.",
            });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists with this email." });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            monthlyIncome: monthlyIncome || 0,
            bankBalance: bankBalance || 0,
            avatar: avatar || "/avatar_male_1_1772875227901.png", // fallback in case
            role: role || "buyer",
        });

        await newUser.save();

        // Generate JWT
        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET || "elite_horizon_secret_key", {
            expiresIn: "7d",
        });

        res.status(201).json({
            message: "User created successfully",
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                monthlyIncome: newUser.monthlyIncome,
                bankBalance: newUser.bankBalance,
                avatar: newUser.avatar,
                role: newUser.role,
            },
        });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ message: "Server error during registration." });
    }
});

// Sign in
router.post("/signin", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials." });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials." });
        }

        // Generate JWT
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "elite_horizon_secret_key", {
            expiresIn: "7d",
        });

        res.status(200).json({
            message: "Signin successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                monthlyIncome: user.monthlyIncome,
                bankBalance: user.bankBalance,
                avatar: user.avatar,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Signin error:", error);
        res.status(500).json({ message: "Server error during signin." });
    }
});

// Update Profile
// Normally this would be protected by auth middleware, but added here directly for simplicity
router.put("/update", async (req, res) => {
    try {
        const { id, name, monthlyIncome, bankBalance, avatar } = req.body;

        if (!id) {
            return res.status(400).json({ message: "User ID is required." });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (name) user.name = name;
        if (monthlyIncome !== undefined) user.monthlyIncome = monthlyIncome;
        if (bankBalance !== undefined) user.bankBalance = bankBalance;
        if (avatar) user.avatar = avatar;

        await user.save();

        res.status(200).json({
            message: "Profile updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                monthlyIncome: user.monthlyIncome,
                bankBalance: user.bankBalance,
                avatar: user.avatar,
            },
        });
    } catch (error) {
        console.error("Update error:", error);
        res.status(500).json({ message: "Server error during profile update." });
    }
});

export default router;
