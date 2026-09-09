import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ChatBox from "../components/ChatBox";
import "./MyChats.css";

const API = import.meta.env.VITE_API_URL;

const MyChats = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            navigate("/signin");
        }
    }, [navigate]);

    const fetchConversations = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API}/api/chat/conversations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setConversations(data.conversations || []);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching conversations:", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchConversations();
    }, [user]);

    if (loading) return <div className="chats-page-loading">Loading conversations...</div>;

    const getImageUrl = (imagePath) => {
        if (!imagePath) return "";
        if (imagePath.startsWith("http")) return imagePath;
        // If it's an uploaded file on the backend, prefix with API
        return `${API}/${imagePath.replace(/^\//, "")}`;
    };

    const handleDeleteConversation = async (conversationId) => {
        if (!window.confirm("Are you sure you want to delete this entire conversation?")) return;
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API}/api/chat/conversation/${conversationId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setConversations(conversations.filter(c => c._id !== conversationId));
                if (selectedChat?._id === conversationId) setSelectedChat(null);
            }
        } catch (err) {
            console.error("Error deleting conversation:", err);
        }
    };

    return (
        <div className="my-chats-container">
            <div className="chats-sidebar">
                <div className="chats-sidebar-header">
                    <h2>My Inquiries</h2>
                </div>
                <div className="chats-list">
                    {conversations.length === 0 ? (
                        <div className="no-chats">No conversations found.</div>
                    ) : (
                        conversations.map((conv) => {
                            const otherUser = conv.buyerId._id === user.id ? conv.sellerId : conv.buyerId;
                            return (
                                <div
                                    key={conv._id}
                                    className={`chat-item ${selectedChat?._id === conv._id ? "active" : ""}`}
                                    onClick={() => setSelectedChat(conv)}
                                >
                                    <div className="chat-item-avatar">
                                        {otherUser.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="chat-item-info">
                                        <div className="chat-item-top">
                                            <span className="chat-item-name">{otherUser.name}</span>
                                            <span className="chat-item-time">
                                                {new Date(conv.lastMessageAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="chat-item-property">{conv.propertyId.adInfo.title}</div>
                                        <div className="chat-item-last-msg">{conv.lastMessage}</div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            <div className={`chat-main-view ${selectedChat ? "active" : ""}`}>
                {selectedChat ? (
                    <div className="chat-full-view">
                        <div className="chat-view-header enriched-header">
                            <div className="chat-header-left">
                                {selectedChat.propertyId.media?.images?.[0] && (
                                    <img 
                                        src={getImageUrl(selectedChat.propertyId.media.images[0])} 
                                        alt="Property" 
                                        className="header-property-image" 
                                        onError={(e) => { e.target.src = "https://via.placeholder.com/64?text=No+Image"; }}
                                    />
                                )}
                                <div className="chat-header-info">
                                    <h3>{selectedChat.propertyId.adInfo.title}</h3>
                                    <div className="property-details-row">
                                        <span className="property-price">PKR {selectedChat.propertyId.price?.value.toLocaleString()}</span>
                                        <span className="property-location">📍 {selectedChat.propertyId.location?.city}</span>
                                    </div>
                                    <p className="conversation-with">
                                        Conversation with {selectedChat.buyerId._id === user.id ? selectedChat.sellerId.name : selectedChat.buyerId.name}
                                    </p>
                                </div>
                            </div>
                            <div className="header-actions">
                                <button className="view-property-btn" onClick={() => navigate(`/properties/${selectedChat.propertyId._id}`)}>
                                    View Property
                                </button>
                                <button className="delete-chat-btn" onClick={() => handleDeleteConversation(selectedChat._id)}>
                                    Delete Chat
                                </button>
                            </div>
                        </div>
                        <ChatBox
                            conversationId={selectedChat._id}
                            currentUser={user}
                            onClose={() => setSelectedChat(null)}
                        />
                    </div>
                ) : (
                    <div className="chat-placeholder">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <p>Select a conversation to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyChats;
