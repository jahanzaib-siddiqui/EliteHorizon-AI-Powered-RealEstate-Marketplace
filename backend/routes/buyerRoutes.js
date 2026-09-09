import express from "express";
import Conversation from "../models/Conversation.js";
import User from "../models/Users.js";

const router = express.Router();

// GET /api/buyer/stats/:userId
router.get("/stats/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        // Fetch total unique properties inquired about
        const conversations = await Conversation.find({ buyerId: userId })
            .populate("propertyId", "adInfo location price propertyType")
            .sort({ updatedAt: -1 });

        const totalInquiries = conversations.length;

        // Get user info for affordability context
        const user = await User.findById(userId);

        res.status(200).json({
            totalInquiries,
            recentActivity: conversations.slice(0, 5), // last 5 for activity feed
            user: {
                monthlyIncome: user?.monthlyIncome || 0,
                bankBalance: user?.bankBalance || 0,
            }
        });

    } catch (error) {
        console.error("Error fetching buyer stats:", error);
        res.status(500).json({ message: "Server error fetching buyer stats." });
    }
});

export default router;
