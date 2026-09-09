import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ChatBox from "../components/ChatBox";
import "./BuyerDashboard.css";

const API = import.meta.env.VITE_API_URL;

const Icon = ({ name, size = 18, color = "currentColor", strokeWidth = 1.75 }) => {
    const s = { width: size, height: size, display: "block", flexShrink: 0 };
    const p = { fill: "none", stroke: color, strokeWidth, strokeLinecap: "round", strokeLinejoin: "round" };
    const icons = {
        grid:     <svg style={s} viewBox="0 0 24 24" {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
        message:  <svg style={s} viewBox="0 0 24 24" {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
        user:     <svg style={s} viewBox="0 0 24 24" {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
        heart:    <svg style={s} viewBox="0 0 24 24" {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
        wallet:   <svg style={s} viewBox="0 0 24 24" {...p}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>,
        trend:    <svg style={s} viewBox="0 0 24 24" {...p}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
        pin:      <svg style={s} viewBox="0 0 24 24" {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
        edit:     <svg style={s} viewBox="0 0 24 24" {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
        trash:    <svg style={s} viewBox="0 0 24 24" {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
        eye:      <svg style={s} viewBox="0 0 24 24" {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    };
    return icons[name] || null;
};

const BuyerDashboard = () => {
    const navigate = useNavigate();
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const [user, setUser] = useState(storedUser);
    
    const location = useLocation();
    
    const [stats, setStats] = useState({ totalInquiries: 0, recentActivity: [] });
    const [loading, setLoading] = useState(true);
    
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get("tab");
        if (tab) setActiveTab(tab);
    }, [location.search]);

    // Chats state
    const [conversations, setConversations] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);

    // Profile Edit State
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || "",
        monthlyIncome: user?.monthlyIncome || 0,
        bankBalance: user?.bankBalance || 0,
        avatar: user?.avatar || "/avatar_male_1_1772875227901.png"
    });
    const avatars = [
        "/avatar_male_1_new_1772877387882.png",
        "/avatar_male_2_new_1772877402690.png",
        "/avatar_female_1_new_1772877416477.png",
        "/avatar_female_2_new_1772877431449.png"
    ];

    useEffect(() => {
        if (!user || user.role !== "buyer") {
            navigate("/");
            return;
        }
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem("token");
            const [statsRes, chatRes] = await Promise.all([
                fetch(`${API}/api/buyer/stats/${user.id}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API}/api/chat/conversations`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            
            const statsData = await statsRes.json();
            const chatData = await chatRes.json();

            setStats(statsData);
            setConversations(chatData.conversations || []);
            
            // Sync user state in case it updated externally
            if (statsData.user) {
                setFormData(prev => ({
                    ...prev,
                    monthlyIncome: statsData.user.monthlyIncome,
                    bankBalance: statsData.user.bankBalance
                }));
            }
        } catch (err) {
            console.error("Dashboard error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteConversation = async (conversationId) => {
        if (!window.confirm("Delete this conversation?")) return;
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API}/api/chat/conversation/${conversationId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setConversations(conversations.filter(c => c._id !== conversationId));
                if (selectedChat?._id === conversationId) setSelectedChat(null);
                fetchDashboardData(); // refresh stats
            }
        } catch (err) {
            console.error("Error deleting conversation:", err);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const response = await fetch(`${API}/api/auth/update`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: user.id, ...formData }),
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem("user", JSON.stringify(data.user));
                setUser(data.user);
                alert("Profile saved successfully!");
                fetchDashboardData();
            } else {
                alert(data.message || "Failed to update profile");
            }
        } catch (err) {
            alert("An error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    const formatCurr = (v) => {
        if (!v) return "PKR 0";
        if (v >= 10000000) return `PKR ${(v / 10000000).toFixed(1)} Cr`;
        if (v >= 100000)   return `PKR ${(v / 100000).toFixed(1)} Lac`;
        return `PKR ${v.toLocaleString()}`;
    };

    if (loading) {
        return (
            <div className="bd-loading">
                <div className="bd-spinner"></div>
                <p>Loading Dashboard...</p>
            </div>
        );
    }

    const navItems = [
        { key: "overview",  icon: "grid",    label: "Overview" },
        { key: "inquiries", icon: "message", label: "My Inquiries" },
        { key: "profile",   icon: "user",    label: "Financial Profile" },
    ];

    return (
        <div className="bd-container">
            {/* ── Sidebar ── */}
            <aside className="bd-sidebar">
                <div className="bd-profile-box">
                    <img src={user.avatar || avatars[0]} alt="Avatar" className="bd-avatar" />
                    <div>
                        <div className="bd-name">{user.name}</div>
                        <div className="bd-role-badge">Buyer Account</div>
                    </div>
                </div>

                <nav className="bd-nav">
                    {navItems.map(item => (
                        <button key={item.key}
                            className={`bd-nav-item ${activeTab === item.key ? "bd-nav-active" : ""}`}
                            onClick={() => setActiveTab(item.key)}>
                            <span className="bd-nav-icon"><Icon name={item.icon} size={17} /></span>
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="bd-sidebar-bottom">
                    <button className="bd-explore-btn" onClick={() => navigate("/properties")}>
                        <Icon name="eye" size={16} /> Explore Properties
                    </button>
                </div>
            </aside>

            {/* ── Main ── */}
            <main className="bd-main">
                <div className="bd-topbar">
                    <div>
                        <h1 className="bd-topbar-title">
                            {activeTab === "overview" && "Dashboard Overview"}
                            {activeTab === "inquiries" && "My Property Inquiries"}
                            {activeTab === "profile" && "Profile & Affordability"}
                        </h1>
                        <p className="bd-topbar-sub">Ready to find your dream home, {user.name.split(" ")[0]}?</p>
                    </div>
                </div>

                {/* ── Overview Tab ── */}
                {activeTab === "overview" && (
                    <div className="bd-overview">
                        <div className="bd-stats-grid">
                            <div className="bd-stat-card bd-stat-blue">
                                <div className="bd-stat-icon-wrap"><Icon name="message" size={20} /></div>
                                <div className="bd-stat-value">{stats.totalInquiries}</div>
                                <div className="bd-stat-label">Active Inquiries</div>
                            </div>
                            <div className="bd-stat-card bd-stat-green">
                                <div className="bd-stat-icon-wrap"><Icon name="wallet" size={20} /></div>
                                <div className="bd-stat-value">{formatCurr(user.bankBalance)}</div>
                                <div className="bd-stat-label">Bank Balance</div>
                            </div>
                            <div className="bd-stat-card bd-stat-orange">
                                <div className="bd-stat-icon-wrap"><Icon name="trend" size={20} /></div>
                                <div className="bd-stat-value">{formatCurr(user.monthlyIncome)}</div>
                                <div className="bd-stat-label">Monthly Income</div>
                            </div>
                        </div>

                        <div className="bd-recent-card">
                            <div className="bd-recent-header">
                                <h3>Recent Inquiries</h3>
                                <button className="bd-link-btn" onClick={() => setActiveTab("inquiries")}>View All</button>
                            </div>
                            {stats.recentActivity.length === 0 ? (
                                <div className="bd-empty-state">
                                    <Icon name="message" size={32} color="#d1d5db" />
                                    <p>You haven't contacted any sellers yet.</p>
                                    <button className="bd-explore-btn-sm" onClick={() => navigate("/properties")}>Explore Now</button>
                                </div>
                            ) : (
                                <div className="bd-recent-list">
                                    {stats.recentActivity.map(conv => (
                                        <div key={conv._id} className="bd-recent-row">
                                            <div className="bd-recent-icon"><Icon name="home" size={18} color="#16a34a" /></div>
                                            <div className="bd-recent-info">
                                                <div className="bd-recent-title">{conv.propertyId?.adInfo?.title}</div>
                                                <div className="bd-recent-meta">
                                                    <Icon name="pin" size={12} /> {conv.propertyId?.location?.city}
                                                </div>
                                            </div>
                                            <div className="bd-recent-right">
                                                <div className="bd-recent-price">PKR {conv.propertyId?.price?.value?.toLocaleString()}</div>
                                                <button className="bd-action-btn" title="Message" onClick={() => { setActiveTab("inquiries"); setSelectedChat(conv); }}>
                                                    <Icon name="message" size={14} color="#16a34a" /> 
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── My Inquiries (Messages) Tab ── */}
                {activeTab === "inquiries" && (
                    <div className="bd-messages">
                        <div className="bd-conversations-list">
                            {conversations.length === 0 ? (
                                <div className="bd-empty-chat">No active inquiries.</div>
                            ) : (
                                conversations.map(conv => {
                                    const seller = conv.sellerId;
                                    return (
                                        <div key={conv._id} 
                                            className={`bd-conv-item ${selectedChat?._id === conv._id ? "active" : ""}`}
                                            onClick={() => setSelectedChat(conv)}>
                                            <div className="bd-conv-avatar">{seller.name.charAt(0).toUpperCase()}</div>
                                            <div className="bd-conv-details">
                                                <div className="bd-conv-top">
                                                    <span className="bd-conv-name">{seller.name}</span>
                                                    <span className="bd-conv-time">{new Date(conv.lastMessageAt).toLocaleDateString()}</span>
                                                </div>
                                                <div className="bd-conv-prop">{conv.propertyId.adInfo.title}</div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        <div className="bd-chat-window">
                            {selectedChat ? (
                                <div className="bd-chat-inner">
                                    <div className="bd-chat-header">
                                        <div className="bd-chat-header-info">
                                            <h3 onClick={() => window.open(`/properties/${selectedChat.propertyId._id}`, '_blank')} className="bd-clickable-title">
                                                {selectedChat.propertyId.adInfo.title} <Icon name="eye" size={12} />
                                            </h3>
                                            <p>Chatting with Seller: <strong>{selectedChat.sellerId.name}</strong></p>
                                        </div>
                                        <button className="bd-del-chat-btn" onClick={() => handleDeleteConversation(selectedChat._id)}>
                                            <Icon name="trash" size={14} /> Delete Chat
                                        </button>
                                    </div>
                                    <div className="bd-chatbox-wrapper">
                                        <ChatBox 
                                            conversationId={selectedChat._id} 
                                            currentUser={user}
                                            onClose={() => setSelectedChat(null)}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="bd-chat-placeholder">
                                    <Icon name="message" size={48} color="#e5e7eb" />
                                    <p>Select a property inquiry to reply</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Profile Tab ── */}
                {activeTab === "profile" && (
                    <div className="bd-profile">
                        <div className="bd-profile-card">
                            <h3>Financial Readiness & Profile</h3>
                            <p className="bd-profile-desc">Update your affordability profile so we can help estimate which properties match your budget range.</p>
                            
                            <form className="bd-profile-form" onSubmit={handleProfileUpdate}>
                                <div className="bd-form-group">
                                    <label>Display Name</label>
                                    <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                                </div>
                                <div className="bd-form-row">
                                    <div className="bd-form-group">
                                        <label>Monthly Income (PKR)</label>
                                        <input type="number" value={formData.monthlyIncome} onChange={(e) => setFormData({...formData, monthlyIncome: e.target.value})} />
                                    </div>
                                    <div className="bd-form-group">
                                        <label>Bank Balance (PKR)</label>
                                        <input type="number" value={formData.bankBalance} onChange={(e) => setFormData({...formData, bankBalance: e.target.value})} />
                                    </div>
                                </div>
                                
                                <div className="bd-form-group">
                                    <label>Select Avatar</label>
                                    <div className="bd-avatar-grid">
                                        {avatars.map((img, idx) => (
                                            <img key={idx} src={img} alt="Avatar option" 
                                                className={`bd-avatar-option ${formData.avatar === img ? 'selected' : ''}`}
                                                onClick={() => setFormData({...formData, avatar: img})} />
                                        ))}
                                    </div>
                                </div>

                                <div className="bd-form-actions">
                                    <button type="submit" className="bd-save-btn" disabled={isSaving}>
                                        {isSaving ? "Saving..." : "Save Profile"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default BuyerDashboard;
