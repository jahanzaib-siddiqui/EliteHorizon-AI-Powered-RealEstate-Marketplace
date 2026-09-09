import express from "express";
import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/Users.js";
import SellerProperty from "../models/SellerProperty.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Middleware to verify token
const verifyToken = (req, res, next) => {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Access denied. No token provided." });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "elite_horizon_secret_key");
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: "Invalid token." });
    }
};

// ── GET /api/chat/conversations  (List all conversations for user)
router.get("/conversations", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const conversations = await Conversation.find({
            $or: [{ buyerId: userId }, { sellerId: userId }],
        })
            .populate("buyerId", "name avatar email")
            .populate("sellerId", "name avatar email")
            .populate("propertyId", "adInfo location media price features propertyType")
            .sort({ updatedAt: -1 });

        res.json({ conversations });
    } catch (err) {
        res.status(500).json({ message: "Server error", detail: err.message });
    }
});

// ── GET /api/chat/messages/:conversationId  (Fetch messages for conversation)
router.get("/messages/:conversationId", verifyToken, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const messages = await Message.find({ conversationId })
            .sort({ createdAt: 1 });

        // Mark as read if the recipient is the current user
        await Message.updateMany(
            { conversationId, receiverId: req.user.id, read: false },
            { $set: { read: true } }
        );

        res.json({ messages });
    } catch (err) {
        res.status(500).json({ message: "Server error", detail: err.message });
    }
});

// ── POST /api/chat/start  (Initialize conversation)
router.post("/start", verifyToken, async (req, res) => {
    try {
        const { propertyId, initialMessage } = req.body;
        const buyerId = req.user.id;

        const property = await SellerProperty.findById(propertyId);
        if (!property) return res.status(404).json({ message: "Property not found" });

        const sellerId = property.sellerId;

        // Check if conversation already exists
        let conversation = await Conversation.findOne({ buyerId, sellerId, propertyId });

        if (!conversation) {
            conversation = new Conversation({
                buyerId,
                sellerId,
                propertyId,
                lastMessage: initialMessage || "Hello, I am interested in this property.",
                lastMessageAt: Date.now(),
            });
            await conversation.save();

            // Save initial message if provided
            const msg = new Message({
                conversationId: conversation._id,
                senderId: buyerId,
                receiverId: sellerId,
                content: initialMessage || "Hello, I am interested in this property.",
            });
            await msg.save();
        }

        res.json({ conversation });
    } catch (err) {
        res.status(500).json({ message: "Server error", detail: err.message });
    }
});

// ── POST /api/chat/send  (Send a message)
router.post("/send", verifyToken, async (req, res) => {
    try {
        const { conversationId, content } = req.body;
        const senderId = req.user.id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return res.status(404).json({ message: "Conversation not found" });

        const receiverId = conversation.buyerId.toString() === senderId ? conversation.sellerId : conversation.buyerId;

        const message = new Message({
            conversationId,
            senderId,
            receiverId,
            content,
        });
        await message.save();

        // Update conversation's last message
        conversation.lastMessage = content;
        conversation.lastMessageAt = Date.now();
        await conversation.save();

        res.json({ message, conversation });
    } catch (err) {
        res.status(500).json({ message: "Server error", detail: err.message });
    }
});

// ── PUT /api/chat/message/:messageId  (Update a message)
router.put("/message/:messageId", verifyToken, async (req, res) => {
    try {
        const { messageId } = req.params;
        const { content } = req.body;
        const senderId = req.user.id;

        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ message: "Message not found" });

        if (message.senderId.toString() !== senderId) {
            return res.status(403).json({ message: "Not authorized to edit this message" });
        }

        message.content = content;
        await message.save();

        // Also update conversation last message if it's the last message
        const conversation = await Conversation.findById(message.conversationId);
        const lastMessage = await Message.findOne({ conversationId: message.conversationId }).sort({ createdAt: -1 });
        if (lastMessage && lastMessage._id.toString() === messageId) {
            conversation.lastMessage = content;
            await conversation.save();
        }

        res.json({ message });
    } catch (err) {
        res.status(500).json({ message: "Server error", detail: err.message });
    }
});

// ── DELETE /api/chat/message/:messageId  (Delete a message)
router.delete("/message/:messageId", verifyToken, async (req, res) => {
    try {
        const { messageId } = req.params;
        const senderId = req.user.id;

        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ message: "Message not found" });

        if (message.senderId.toString() !== senderId) {
            return res.status(403).json({ message: "Not authorized to delete this message" });
        }

        const conversationId = message.conversationId;
        await Message.findByIdAndDelete(messageId);

        // Update conversation last message if needed
        const conversation = await Conversation.findById(conversationId);
        const lastMessage = await Message.findOne({ conversationId }).sort({ createdAt: -1 });
        if (lastMessage) {
            conversation.lastMessage = lastMessage.content;
            conversation.lastMessageAt = lastMessage.createdAt;
        } else {
            conversation.lastMessage = "";
        }
        await conversation.save();

        res.json({ message: "Message deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error", detail: err.message });
    }
});

// ── DELETE /api/chat/conversation/:conversationId  (Delete a conversation)
router.delete("/conversation/:conversationId", verifyToken, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return res.status(404).json({ message: "Conversation not found" });

        if (conversation.buyerId.toString() !== userId && conversation.sellerId.toString() !== userId) {
            return res.status(403).json({ message: "Not authorized to delete this conversation" });
        }

        // Delete all messages in the conversation
        await Message.deleteMany({ conversationId });
        await Conversation.findByIdAndDelete(conversationId);

        res.json({ message: "Conversation deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error", detail: err.message });
    }
});

export default router;
