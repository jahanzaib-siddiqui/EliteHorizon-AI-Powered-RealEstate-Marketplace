import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ChatBox from "../components/ChatBox";
import "./SellerDashboard.css";

const API = import.meta.env.VITE_API_URL;
const imgSrc = (url) => url?.startsWith('http') ? url : `${API}${url}`;

/* ─── Inline SVG icon library ─── */
const Icon = ({ name, size = 18, color = "currentColor", strokeWidth = 1.75 }) => {
    const s = { width: size, height: size, display: "block", flexShrink: 0 };
    const p = { fill: "none", stroke: color, strokeWidth, strokeLinecap: "round", strokeLinejoin: "round" };
    const icons = {
        grid:     <svg style={s} viewBox="0 0 24 24" {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
        home:     <svg style={s} viewBox="0 0 24 24" {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
        activity: <svg style={s} viewBox="0 0 24 24" {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
        plus:     <svg style={s} viewBox="0 0 24 24" {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
        edit:     <svg style={s} viewBox="0 0 24 24" {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
        trash:    <svg style={s} viewBox="0 0 24 24" {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
        tag:      <svg style={s} viewBox="0 0 24 24" {...p}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
        key:      <svg style={s} viewBox="0 0 24 24" {...p}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
        pin:      <svg style={s} viewBox="0 0 24 24" {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
        bed:      <svg style={s} viewBox="0 0 24 24" {...p}><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>,
        bath:     <svg style={s} viewBox="0 0 24 24" {...p}><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><line x1="10" y1="5" x2="8" y2="7"/><line x1="2" y1="12" x2="22" y2="12"/></svg>,
        area:     <svg style={s} viewBox="0 0 24 24" {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>,
        calendar: <svg style={s} viewBox="0 0 24 24" {...p}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
        building: <svg style={s} viewBox="0 0 24 24" {...p}><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="22" x2="9" y2="2"/><line x1="15" y1="22" x2="15" y2="2"/><line x1="4" y1="7" x2="9" y2="7"/><line x1="4" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="20" y2="12"/><line x1="15" y1="7" x2="20" y2="7"/></svg>,
        image:    <svg style={s} viewBox="0 0 24 24" {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
        check:    <svg style={s} viewBox="0 0 24 24" {...p} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
        x:        <svg style={s} viewBox="0 0 24 24" {...p} strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
        clock:    <svg style={s} viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
        info:     <svg style={s} viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
        alert:    <svg style={s} viewBox="0 0 24 24" {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
        lightbulb:<svg style={s} viewBox="0 0 24 24" {...p}><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>,
        camera:   <svg style={s} viewBox="0 0 24 24" {...p}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
        star:     <svg style={s} viewBox="0 0 24 24" {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
        user:     <svg style={s} viewBox="0 0 24 24" {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
        arrowRight:<svg style={s} viewBox="0 0 24 24" {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
        chartBar: <svg style={s} viewBox="0 0 24 24" {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
        message:  <svg style={s} viewBox="0 0 24 24" {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
        eye:      <svg style={s} viewBox="0 0 24 24" {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    };
    return icons[name] || null;
};

/* ─── Status chip using SVG ─── */
const StatusChip = ({ status }) => {
    const cfg = {
        pending:  { label: "Pending Review", cls: "sd-status-pending",  iconName: "clock" },
        approved: { label: "Live",           cls: "sd-status-approved", iconName: "check" },
        rejected: { label: "Rejected",       cls: "sd-status-rejected", iconName: "x" },
    };
    const c = cfg[status] || cfg.pending;
    const iconColor = status === "approved" ? "#166534" : status === "rejected" ? "#dc2626" : "#c2410c";
    return (
        <span className={`sd-status-chip ${c.cls}`}>
            <Icon name={c.iconName} size={11} color={iconColor} strokeWidth={2.5} />
            {c.label}
        </span>
    );
};

const SellerDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem("user"));
    const [properties, setProperties] = useState([]);
    const [stats, setStats] = useState({ total: 0, forSale: 0, forRent: 0, cities: [] });
    const [conversations, setConversations] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get("tab");
        if (tab) setActiveTab(tab);
    }, [location.search]);

    useEffect(() => {
        if (!user || user.role !== "seller") { navigate("/"); return; }
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, propsRes] = await Promise.all([
                fetch(`${API}/api/seller/stats/${user.id}`),
                fetch(`${API}/api/seller/my-properties/${user.id}`),
            ]);
            setStats(await statsRes.json());
            const propsData = await propsRes.json();
            setProperties(Array.isArray(propsData) ? propsData : []);
        } catch (e) {
            console.error("Dashboard fetch error:", e);
        } finally {
            setLoading(false);
        }
    };

    const fetchConversations = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API}/api/chat/conversations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setConversations(data.conversations || []);
        } catch (e) {
            console.error("Chat fetch error:", e);
        }
    };

    useEffect(() => {
        if (activeTab === "messages") fetchConversations();
    }, [activeTab]);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const res = await fetch(`${API}/api/seller/delete/${deleteTarget.id}`, { method: "DELETE" });
            if (res.ok) {
                setProperties(prev => prev.filter(p => p._id !== deleteTarget.id));
                setDeleteTarget(null);
            }
        } catch (e) {
            console.error("Delete error:", e);
        } finally {
            setDeleting(false);
        }
    };

    const formatPrice = (val) => {
        if (!val) return "N/A";
        if (val >= 10000000) return `Rs ${(val / 10000000).toFixed(1)} Cr`;
        if (val >= 100000)   return `Rs ${(val / 100000).toFixed(1)} Lac`;
        return `Rs ${val.toLocaleString()}`;
    };

    const formatDate = (d) =>
        new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });

    if (loading) {
        return (
            <div className="sd-loading">
                <div className="sd-spinner"></div>
                <p>Loading your dashboard...</p>
            </div>
        );
    }

    const navItems = [
        { key: "overview",  iconName: "grid",     label: "Overview" },
        { key: "listings",  iconName: "home",      label: "My Listings" },
        { key: "messages",  iconName: "message",   label: "Messages" },
        { key: "activity",  iconName: "activity",  label: "Activity" },
    ];

    const statCards = [
        { iconName: "home",    label: "Total Listings", value: stats.total,    cls: "sd-stat-primary" },
        { iconName: "tag",     label: "For Sale",        value: stats.forSale,  cls: "sd-stat-green" },
        { iconName: "key",     label: "For Rent",        value: stats.forRent,  cls: "sd-stat-blue" },
        { iconName: "pin",     label: "Cities",          value: stats.cities?.length || 0, cls: "sd-stat-orange" },
    ];

    const tips = [
        { iconName: "camera",    text: "Add at least 5 high-quality photos to get 3× more views" },
        { iconName: "edit",      text: "Write a detailed description with nearby landmarks" },
        { iconName: "tag",       text: "Price your property competitively with market rates" },
        { iconName: "pin",       text: "Pin the exact location on the map for more enquiries" },
    ];

    return (
        <div className="sd-container">

            {/* ── Delete Confirmation Modal ── */}
            {deleteTarget && (
                <div className="sd-modal-overlay">
                    <div className="sd-modal">
                        <div className="sd-modal-icon-wrap">
                            <Icon name="trash" size={24} color="#dc2626" />
                        </div>
                        <h3 className="sd-modal-title">Delete Property?</h3>
                        <p className="sd-modal-desc">
                            Are you sure you want to delete <strong>"{deleteTarget.title}"</strong>?
                            This action cannot be undone.
                        </p>
                        <div className="sd-modal-btns">
                            <button className="sd-modal-cancel" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                                Cancel
                            </button>
                            <button className="sd-modal-confirm" onClick={handleDelete} disabled={deleting}>
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Sidebar ── */}
            <aside className="sd-sidebar">
                <div className="sd-seller-profile">
                    <div className="sd-avatar">{user?.name?.charAt(0).toUpperCase() || "S"}</div>
                    <div>
                        <div className="sd-seller-name">{user?.name || "Seller"}</div>
                        <div className="sd-seller-badge">Seller Account</div>
                    </div>
                </div>

                <nav className="sd-nav">
                    {navItems.map(item => (
                        <button key={item.key}
                            className={`sd-nav-item ${activeTab === item.key ? "sd-nav-active" : ""}`}
                            onClick={() => setActiveTab(item.key)}>
                            <span className="sd-nav-icon">
                                <Icon name={item.iconName} size={17} color="currentColor" />
                            </span>
                            {item.label}
                        </button>
                    ))}
                </nav>

                <button className="sd-list-btn" onClick={() => navigate("/list-property")}>
                    <Icon name="plus" size={16} color="white" />
                    List New Property
                </button>
            </aside>

            {/* ── Main ── */}
            <main className="sd-main">
                <div className="sd-topbar">
                    <div>
                        <h1 className="sd-topbar-title">
                            {activeTab === "overview" && "Dashboard Overview"}
                            {activeTab === "listings" && "My Property Listings"}
                            {activeTab === "activity" && "Recent Activity"}
                        </h1>
                        <p className="sd-topbar-sub">Welcome back, {user?.name?.split(" ")[0]}</p>
                    </div>
                    <div className="sd-topbar-right">
                        <span className="sd-dot-live"></span>
                        <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>Live</span>
                    </div>
                </div>

                {/* ─── OVERVIEW ─── */}
                {activeTab === "overview" && (
                    <div className="sd-overview">
                        {/* Stat cards */}
                        <div className="sd-stats-grid">
                            {statCards.map(c => (
                                <div key={c.label} className={`sd-stat-card ${c.cls}`}>
                                    <div className="sd-stat-icon-wrap">
                                        <Icon name={c.iconName} size={20} color="rgba(255,255,255,0.9)" strokeWidth={1.6} />
                                    </div>
                                    <div className="sd-stat-value">{c.value}</div>
                                    <div className="sd-stat-label">{c.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Pending notice */}
                        {properties.some(p => p.status === "pending") && (
                            <div className="sd-pending-notice">
                                <Icon name="clock" size={17} color="#c2410c" />
                                <span>
                                    <strong>{properties.filter(p => p.status === "pending").length} listing{properties.filter(p => p.status === "pending").length > 1 ? "s" : ""} pending admin approval.</strong>
                                    {" "}Properties go live once approved. Status is shown on each card.
                                </span>
                            </div>
                        )}

                        {/* Tips */}
                        <div className="sd-tips-card">
                            <div className="sd-tips-header">
                                <Icon name="lightbulb" size={15} color="#166534" />
                                <span>Tips to Boost Your Listing</span>
                            </div>
                            <div className="sd-tips-items">
                                {tips.map(t => (
                                    <div key={t.text} className="sd-tip">
                                        <span className="sd-tip-icon">
                                            <Icon name={t.iconName} size={15} color="#16a34a" />
                                        </span>
                                        <span>{t.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent listings */}
                        {properties.length > 0 ? (
                            <div className="sd-recent">
                                <div className="sd-recent-header">
                                    <h3>Recent Listings</h3>
                                    <button className="sd-link-btn" onClick={() => setActiveTab("listings")}>
                                        View All
                                        <Icon name="arrowRight" size={14} color="#16a34a" />
                                    </button>
                                </div>
                                <div className="sd-prop-list">
                                    {properties.slice(0, 3).map(p => (
                                        <div key={p._id} className="sd-prop-row">
                                            <div className="sd-prop-thumb">
                                                {p.media?.images?.[0]
                                                    ? <img src={imgSrc(p.media.images[0])} alt="" />
                                                    : <Icon name="image" size={24} color="#d1d5db" />}
                                            </div>
                                            <div className="sd-prop-info">
                                                <div className="sd-prop-title">{p.adInfo?.title}</div>
                                                <div className="sd-prop-meta">
                                                    <Icon name="pin" size={12} color="#9ca3af" />
                                                    {p.location?.city}
                                                    <span className="sd-prop-meta-dot">·</span>
                                                    {p.propertyType?.subCategory}
                                                    <span className="sd-prop-meta-dot">·</span>
                                                    {p.areaSize?.value} {p.areaSize?.unit}
                                                </div>
                                            </div>
                                            <div className="sd-prop-right">
                                                <div className="sd-prop-price">{formatPrice(p.price?.value)}</div>
                                                <StatusChip status={p.status} />
                                            </div>
                                            <div className="sd-prop-actions-inline">
                                                <button className="sd-action-view-sm" title="View"
                                                    onClick={() => window.open(`${window.location.origin}/properties/${p._id}`, "_blank")}>
                                                    <Icon name="eye" size={14} color="#2563eb" />
                                                </button>
                                                <button className="sd-action-edit-sm" title="Edit"
                                                    onClick={() => navigate(`/edit-property/${p._id}`)}>
                                                    <Icon name="edit" size={14} color="#16a34a" />
                                                </button>
                                                <button className="sd-action-del-sm" title="Delete"
                                                    onClick={() => setDeleteTarget({ id: p._id, title: p.adInfo?.title })}>
                                                    <Icon name="trash" size={14} color="#dc2626" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="sd-empty-state">
                                <div className="sd-empty-icon-wrap">
                                    <Icon name="home" size={36} color="#d1d5db" strokeWidth={1.4} />
                                </div>
                                <h3>No listings yet</h3>
                                <p>Start by listing your first property.</p>
                                <button className="sd-list-btn sd-list-btn-center" onClick={() => navigate("/list-property")}>
                                    <Icon name="plus" size={15} color="white" />
                                    List Your First Property
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── LISTINGS ─── */}
                {activeTab === "listings" && (
                    <div className="sd-listings">
                        {properties.length === 0 ? (
                            <div className="sd-empty-state">
                                <div className="sd-empty-icon-wrap">
                                    <Icon name="building" size={36} color="#d1d5db" strokeWidth={1.4} />
                                </div>
                                <h3>No properties listed yet</h3>
                                <button className="sd-list-btn sd-list-btn-center" onClick={() => navigate("/list-property")}>
                                    <Icon name="plus" size={15} color="white" />
                                    List a Property
                                </button>
                            </div>
                        ) : (
                            <div className="sd-listing-cards">
                                {properties.map(p => (
                                    <div key={p._id} className="sd-listing-card">
                                        {/* Image */}
                                        <div className="sd-listing-img">
                                            {p.media?.images?.[0]
                                                ? <img src={imgSrc(p.media.images[0])} alt={p.adInfo?.title} />
                                                : <div className="sd-listing-no-img">
                                                    <Icon name="image" size={36} color="#d1d5db" />
                                                  </div>}
                                            <span className={`sd-listing-badge ${p.purpose === "Sell" ? "sd-badge-green" : "sd-badge-blue"}`}>
                                                {p.purpose === "Sell" ? "For Sale" : "For Rent"}
                                            </span>
                                        </div>

                                        {/* Body */}
                                        <div className="sd-listing-body">
                                            <h4 className="sd-listing-title">{p.adInfo?.title}</h4>
                                            <div className="sd-listing-location">
                                                <Icon name="pin" size={13} color="#9ca3af" />
                                                <span>{p.location?.address || p.location?.city}</span>
                                            </div>
                                            <div className="sd-listing-details">
                                                {p.features?.bedrooms && (
                                                    <span className="sd-listing-meta-item">
                                                        <Icon name="bed" size={13} color="#6b7280" />
                                                        {p.features.bedrooms}
                                                    </span>
                                                )}
                                                {p.features?.bathrooms && (
                                                    <span className="sd-listing-meta-item">
                                                        <Icon name="bath" size={13} color="#6b7280" />
                                                        {p.features.bathrooms}
                                                    </span>
                                                )}
                                                <span className="sd-listing-meta-item">
                                                    <Icon name="area" size={13} color="#6b7280" />
                                                    {p.areaSize?.value} {p.areaSize?.unit}
                                                </span>
                                            </div>
                                            <div className="sd-listing-footer">
                                                <div className="sd-listing-price">{formatPrice(p.price?.value)}</div>
                                                <StatusChip status={p.status} />
                                            </div>

                                            {/* Rejection reason */}
                                            {p.status === "rejected" && p.rejectionReason && (
                                                <div className="sd-rejection-banner">
                                                    <Icon name="alert" size={13} color="#dc2626" />
                                                    <div>
                                                        <strong>Admin Objection:</strong>
                                                        <span> {p.rejectionReason}</span>
                                                    </div>
                                                </div>
                                            )}
                                            {p.status === "pending" && (
                                                <div className="sd-pending-banner">
                                                    <Icon name="clock" size={13} color="#c2410c" />
                                                    Waiting for admin approval before going live.
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="sd-card-actions">
                                                <button className="sd-action-view"
                                                    onClick={() => window.open(`${window.location.origin}/properties/${p._id}`, "_blank")}>
                                                    <Icon name="eye" size={14} color="#2563eb" />
                                                    View
                                                </button>
                                                <button className="sd-action-edit"
                                                    onClick={() => navigate(`/edit-property/${p._id}`)}>
                                                    <Icon name="edit" size={14} color="#16a34a" />
                                                    Edit
                                                </button>
                                                <button className="sd-action-delete"
                                                    onClick={() => setDeleteTarget({ id: p._id, title: p.adInfo?.title })}>
                                                    <Icon name="trash" size={14} color="#dc2626" />
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ─── ACTIVITY ─── */}
                {activeTab === "activity" && (
                    <div className="sd-activity">
                        <div className="sd-activity-header">
                            <h3>Recent Activity</h3>
                            <p className="sd-activity-sub">Track all interactions with your listings</p>
                        </div>
                        {properties.length === 0 ? (
                            <div className="sd-empty-state">
                                <div className="sd-empty-icon-wrap">
                                    <Icon name="activity" size={36} color="#d1d5db" strokeWidth={1.4} />
                                </div>
                                <h3>No activity yet</h3>
                                <p>List a property to start seeing engagement data.</p>
                            </div>
                        ) : (
                            <div className="sd-activity-feed">
                                {properties.map(p => (
                                    <div key={p._id} className="sd-activity-item">
                                        <div className="sd-activity-dot-wrap">
                                            <div className="sd-activity-dot sd-dot-green"></div>
                                        </div>
                                        <div className="sd-activity-content">
                                            <strong>Property Listed</strong>
                                            <p className="sd-activity-desc">"{p.adInfo?.title}" in {p.location?.city}</p>
                                            <div className="sd-activity-foot">
                                                <span className="sd-activity-time">
                                                    <Icon name="calendar" size={12} color="#9ca3af" />
                                                    {formatDate(p.createdAt)}
                                                </span>
                                                <StatusChip status={p.status} />
                                            </div>
                                        </div>
                                        <div className="sd-activity-chip">{p.propertyType?.subCategory}</div>
                                        <div className="sd-prop-actions-inline">
                                            <button className="sd-action-view-sm" title="View"
                                                onClick={() => window.open(`${window.location.origin}/properties/${p._id}`, "_blank")}>
                                                <Icon name="eye" size={14} color="#2563eb" />
                                            </button>
                                            <button className="sd-action-edit-sm" title="Edit"
                                                onClick={() => navigate(`/edit-property/${p._id}`)}>
                                                <Icon name="edit" size={14} color="#16a34a" />
                                            </button>
                                            <button className="sd-action-del-sm" title="Delete"
                                                onClick={() => setDeleteTarget({ id: p._id, title: p.adInfo?.title })}>
                                                <Icon name="trash" size={14} color="#dc2626" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <div className="sd-activity-item">
                                    <div className="sd-activity-dot-wrap">
                                        <div className="sd-activity-dot sd-dot-blue"></div>
                                    </div>
                                    <div className="sd-activity-content">
                                        <strong>Account Created</strong>
                                        <p className="sd-activity-desc">Seller account activated — Elite Horizon</p>
                                        <span className="sd-activity-time">
                                            <Icon name="star" size={12} color="#9ca3af" />
                                            Welcome aboard
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── MESSAGES ─── */}
                {activeTab === "messages" && (
                    <div className="sd-messages">
                        <div className="sd-messages-layout">
                            <div className="sd-conversations-list">
                                {conversations.length === 0 ? (
                                    <div className="sd-empty-state-sm">
                                        <Icon name="message" size={32} color="#d1d5db" />
                                        <p>No messages yet.</p>
                                    </div>
                                ) : (
                                    conversations.map(conv => (
                                        <div key={conv._id} 
                                            className={`sd-conv-item ${selectedChat?._id === conv._id ? "active" : ""}`}
                                            onClick={() => setSelectedChat(conv)}>
                                            <div className="sd-conv-avatar">
                                                {conv.buyerId?.name?.charAt(0).toUpperCase() || "B"}
                                            </div>
                                            <div className="sd-conv-info">
                                                <div className="sd-conv-top">
                                                    <span className="sd-conv-name">{conv.buyerId?.name}</span>
                                                    <span className="sd-conv-time">{new Date(conv.lastMessageAt).toLocaleDateString()}</span>
                                                </div>
                                                <div className="sd-conv-prop">{conv.propertyId?.adInfo?.title}</div>
                                                <div className="sd-conv-last">{conv.lastMessage}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="sd-chat-window">
                                {selectedChat ? (
                                    <div className="sd-chat-inner">
                                        <div className="sd-chat-header">
                                            <div>
                                                <h4>{selectedChat.buyerId?.name}</h4>
                                                <p>Inquiry for: {selectedChat.propertyId?.adInfo?.title}</p>
                                            </div>
                                        </div>
                                        {/* Reusing ChatBox component */}
                                        <ChatBox 
                                            conversationId={selectedChat._id} 
                                            currentUser={user}
                                            onClose={() => setSelectedChat(null)}
                                        />
                                    </div>
                                ) : (
                                    <div className="sd-chat-placeholder">
                                        <Icon name="message" size={48} color="#e5e7eb" />
                                        <p>Select a conversation to reply</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default SellerDashboard;
