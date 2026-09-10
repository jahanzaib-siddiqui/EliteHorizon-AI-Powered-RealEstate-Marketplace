import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import ChatBox from "../components/ChatBox";
import "./PropertyDetail.css";

const API = import.meta.env.VITE_API_URL;
const imgSrc = (url) => url?.startsWith('http') ? url : `${API}${url}`;

/* ─── Inline SVG icons ─── */
const Icon = ({ name, size = 18, color = "currentColor", strokeWidth = 1.75 }) => {
    const s = { width: size, height: size, display: "block", flexShrink: 0 };
    const p = { fill: "none", stroke: color, strokeWidth, strokeLinecap: "round", strokeLinejoin: "round" };
    const icons = {
        pin:       <svg style={s} viewBox="0 0 24 24" {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
        bed:       <svg style={s} viewBox="0 0 24 24" {...p}><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>,
        bath:      <svg style={s} viewBox="0 0 24 24" {...p}><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><line x1="10" y1="5" x2="8" y2="7"/><line x1="2" y1="12" x2="22" y2="12"/></svg>,
        area:      <svg style={s} viewBox="0 0 24 24" {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>,
        building:  <svg style={s} viewBox="0 0 24 24" {...p}><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="22" x2="9" y2="2"/><line x1="15" y1="22" x2="15" y2="2"/><line x1="4" y1="7" x2="9" y2="7"/><line x1="4" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="20" y2="12"/><line x1="15" y1="7" x2="20" y2="7"/></svg>,
        phone:     <svg style={s} viewBox="0 0 24 24" {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.37 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 6.29 6.29l.48-.48a2 2 0 0 1 2.09-.41 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
        mail:      <svg style={s} viewBox="0 0 24 24" {...p}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
        user:      <svg style={s} viewBox="0 0 24 24" {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
        image:     <svg style={s} viewBox="0 0 24 24" {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
        chevLeft:  <svg style={s} viewBox="0 0 24 24" {...p}><polyline points="15 18 9 12 15 6"/></svg>,
        chevRight: <svg style={s} viewBox="0 0 24 24" {...p}><polyline points="9 18 15 12 9 6"/></svg>,
        arrowLeft: <svg style={s} viewBox="0 0 24 24" {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
        check:     <svg style={s} viewBox="0 0 24 24" {...p} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
        share:     <svg style={s} viewBox="0 0 24 24" {...p}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
        star:      <svg style={s} viewBox="0 0 24 24" {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
        calendar:  <svg style={s} viewBox="0 0 24 24" {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
        map:       <svg style={s} viewBox="0 0 24 24" {...p}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
        key:       <svg style={s} viewBox="0 0 24 24" {...p}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
        info:      <svg style={s} viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
        tag:       <svg style={s} viewBox="0 0 24 24" {...p}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
        parking:   <svg style={s} viewBox="0 0 24 24" {...p}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M9 12h4a2 2 0 0 0 0-4H9v8"/></svg>,
        x:         <svg style={s} viewBox="0 0 24 24" {...p} strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    };
    return icons[name] || null;
};

const fmt = (v) => {
    if (!v) return "N/A";
    if (v >= 10000000) return `PKR ${(v / 10000000).toFixed(2)} Crore`;
    if (v >= 100000)   return `PKR ${(v / 100000).toFixed(1)} Lac`;
    return `PKR ${v?.toLocaleString()}`;
};

const fmtDate = (d) => new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "long", year: "numeric" });

/* ─── Lightbox ─── */
const Lightbox = ({ images, startIdx, onClose }) => {
    const [idx, setIdx] = useState(startIdx);
    useEffect(() => {
        const handler = (e) => {
            if (e.key === "ArrowLeft")  setIdx(i => (i - 1 + images.length) % images.length);
            if (e.key === "ArrowRight") setIdx(i => (i + 1) % images.length);
            if (e.key === "Escape")     onClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [images.length, onClose]);

    return (
        <div className="pd-lightbox" onClick={onClose}>
            <button className="pd-lb-close" onClick={onClose}><Icon name="x" size={22} color="white" /></button>
            <button className="pd-lb-prev" onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length); }}>
                <Icon name="chevLeft" size={26} color="white" />
            </button>
            <img className="pd-lb-img" src={imgSrc(images[idx])} alt="" onClick={e => e.stopPropagation()} />
            <button className="pd-lb-next" onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % images.length); }}>
                <Icon name="chevRight" size={26} color="white" />
            </button>
            <div className="pd-lb-count">{idx + 1} / {images.length}</div>
            {/* Thumbnails */}
            <div className="pd-lb-thumbs" onClick={e => e.stopPropagation()}>
                {images.map((img, i) => (
                    <img key={i} src={`${API}${img}`} alt=""
                        className={`pd-lb-thumb ${i === idx ? "pd-lb-thumb-active" : ""}`}
                        onClick={() => setIdx(i)} />
                ))}
            </div>
        </div>
    );
};

/* ─── Contact Sidebar ─── */
const ContactSidebar = ({ prop }) => {
    const { contactInfo, price, adInfo } = prop;
    const [form, setForm] = useState({
        name: "", email: "", phone: "", message: `I would like to inquire about your property "${adInfo?.title}". Please contact me at your earliest convenience.`,
        role: "buyer", keepInformed: true,
    });
    const [sent, setSent] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [chatId, setChatId] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));
    }, []);

    const handleChat = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Please sign in to chat with the seller.");
            return;
        }

        try {
            const res = await fetch(`${API}/api/chat/start`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ propertyId: prop._id })
            });
            const data = await res.json();
            if (res.ok && data.conversation) {
                setChatId(data.conversation._id);
                setShowChat(true);
            } else {
                alert(data.message || "Failed to start chat. Please try again later.");
            }
        } catch (err) {
            console.error("Error starting chat:", err);
            alert("An error occurred while connecting to the chat service.");
        }
    };

    const handleSend = (e) => {
        e.preventDefault();
        const mailto = `mailto:${contactInfo?.email}?subject=Property Inquiry: ${adInfo?.title}&body=${encodeURIComponent(
            `Name: ${form.name}\nPhone: ${form.phone}\n\n${form.message}`
        )}`;
        window.open(mailto, "_blank");
        setSent(true);
        setTimeout(() => setSent(false), 4000);
    };

    return (
        <div className="pd-sidebar">
            <div className="pd-sidebar-price">{fmt(price?.value)}</div>
            
            <button className="pd-chat-seller-btn prominent-chat" onClick={handleChat}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                Chat with Seller
            </button>

            {/* Action buttons */}
            <div className="pd-sidebar-actions">
                {contactInfo?.mobile && (
                    <>
                        <a href={`https://wa.me/92${contactInfo.mobile.replace(/^0/, "")}`}
                            target="_blank" rel="noreferrer" className="pd-whatsapp-btn">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51h-.57c-.199 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                            WhatsApp
                        </a>
                        <a href={`tel:${contactInfo.mobile}`} className="pd-call-btn">
                            <Icon name="phone" size={17} color="white" />
                            Call
                        </a>
                    </>
                )}
            </div>

            {/* Contact form */}
            <form className="pd-contact-form" onSubmit={handleSend}>
                <div className="pd-form-group">
                    <label>NAME *</label>
                    <input placeholder="Your full name" value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="pd-form-group">
                    <label>EMAIL *</label>
                    <input type="email" placeholder="your@email.com" value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                </div>
                <div className="pd-form-group">
                    <label>PHONE *</label>
                    <input placeholder="+92 300 0000000" value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
                </div>
                <div className="pd-form-group">
                    <label>MESSAGE *</label>
                    <textarea rows={3} value={form.message}
                        onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required />
                </div>
                <div className="pd-form-role">
                    <span>I am a:</span>
                    {["buyer", "tenant", "other"].map(r => (
                        <label key={r} className="pd-radio-label">
                            <input type="radio" name="role" value={r}
                                checked={form.role === r}
                                onChange={() => setForm(f => ({ ...f, role: r }))} />
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                        </label>
                    ))}
                </div>
                <label className="pd-checkbox-label">
                    <input type="checkbox" checked={form.keepInformed}
                        onChange={e => setForm(f => ({ ...f, keepInformed: e.target.checked }))} />
                    Keep me informed about similar properties.
                </label>
                <button type="submit" className="pd-send-btn">
                    <Icon name="mail" size={16} color="white" />
                    {sent ? "Message Sent!" : "Send Email"}
                </button>
            </form>

            {showChat && chatId && user && (
                <ChatBox
                    conversationId={chatId}
                    currentUser={user}
                    onClose={() => setShowChat(false)}
                />
            )}

            {/* Owner card */}
            <div className="pd-owner-card">
                <div className="pd-owner-av">{contactInfo?.name?.charAt(0)?.toUpperCase() || "O"}</div>
                <div>
                    <div className="pd-owner-name">{contactInfo?.name || "Property Owner"}</div>
                    <div className="pd-owner-role">Property Owner</div>
                </div>
            </div>
        </div>
    );
};

/* ─── Map embed (OpenStreetMap) ─── */
const PropertyMap = ({ lat, lng, city }) => {
    if (lat && lng) {
        const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`;
        return (
            <div className="pd-map-wrap">
                <iframe title="Property Location" src={src} className="pd-map-iframe" />
            </div>
        );
    }
    return (
        <div className="pd-map-placeholder">
            <Icon name="map" size={40} color="#d1d5db" />
            <p>Exact location in <strong>{city || "city"}</strong><br /><span>Map pin available after viewing contact details</span></p>
        </div>
    );
};

/* ─── Main Page ─── */
const PropertyDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [prop, setProp] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lightbox, setLightbox] = useState(null); // null or startIdx
    const [mainImg, setMainImg] = useState(0);
    const [activeTab, setActiveTab] = useState("overview");
    const [descExpanded, setDescExpanded] = useState(false);
    const overviewRef = useRef();
    const amenitiesRef = useRef();
    const locationRef = useRef();

    useEffect(() => {
        fetch(`${API}/api/seller/property/${id}`)
            .then(r => r.json())
            .then(data => { setProp(data); setLoading(false); })
            .catch(() => setLoading(false));
        window.scrollTo(0, 0);
    }, [id]);

    if (loading) return (
        <div className="pd-loading">
            <div className="pd-spinner"></div>
            <p>Loading property details…</p>
        </div>
    );
    if (!prop) return (
        <div className="pd-loading">
            <p>Property not found.</p>
            <button onClick={() => navigate("/properties")} className="pd-back-btn">Back to Listings</button>
        </div>
    );

    const imgs = prop.media?.images || [];
    const amenityIcons = {
        "Parking":        "parking", "Gym":            "star", "Swimming Pool":   "area",
        "Security":       "check",   "Generator":      "info", "Servant Quarters":"building",
        "Electricity Backup": "info","Gas":            "check", "Sui Gas":        "check",
        "Air Conditioning": "star",  "Internet":       "info", "CCTV":            "info",
        "Water Supply":   "check",   "Gated Community":"check",
    };

    const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    const tabs = [
        { key: "overview",  label: "Overview",        ref: overviewRef },
        { key: "amenities", label: "Amenities",       ref: amenitiesRef },
        { key: "location",  label: "Location & Map",  ref: locationRef },
    ];

    return (
        <div className="pd-page">
            {lightbox !== null && <Lightbox images={imgs} startIdx={lightbox} onClose={() => setLightbox(null)} />}

            {/* ── BreadCrumb ── */}
            <div className="pd-breadcrumb">
                <button onClick={() => navigate("/properties")} className="pd-back-inline">
                    <Icon name="arrowLeft" size={15} color="#16a34a" />
                    Back to Listings
                </button>
                <span className="pd-bc-sep">/</span>
                <span>{prop.location?.city}</span>
                <span className="pd-bc-sep">/</span>
                <span>{prop.propertyType?.subCategory}</span>
                <span className="pd-bc-sep">/</span>
                <span className="pd-bc-current">{prop.adInfo?.title}</span>
            </div>

            {/* ── Title Bar ── */}
            <div className="pd-title-bar">
                <div>
                    <h1 className="pd-title">{prop.adInfo?.title}</h1>
                    <div className="pd-subtitle">
                        <Icon name="pin" size={14} color="#6b7280" />
                        {prop.location?.address || prop.location?.city}
                    </div>
                </div>
                <button className="pd-share-btn" onClick={() => { navigator.clipboard.writeText(window.location.href); }}>
                    <Icon name="share" size={16} color="#374151" />
                    Share
                </button>
            </div>

            {/* ── Image Gallery ── */}
            <div className="pd-gallery">
                {/* Main image */}
                <div className="pd-gallery-main" onClick={() => setLightbox(mainImg)}>
                    {imgs.length > 0 ? (
                        <>
                            {/* Blurred background layer — fills letterbox gaps with the same image */}
                            <div
                                className="pd-gallery-blur-bg"
                                style={{ backgroundImage: `url(${API}${imgs[mainImg]})` }}
                            />
                            {/* Main sharp image on top */}
                            <img src={`${API}${imgs[mainImg]}`} alt={prop.adInfo?.title} />
                        </>
                    ) : (
                        <div className="pd-no-img"><Icon name="image" size={60} color="#d1d5db" /></div>
                    )}
                    {imgs.length > 1 && (
                        <>
                            <button className="pd-g-prev" onClick={e => { e.stopPropagation(); setMainImg(i => (i - 1 + imgs.length) % imgs.length); }}>
                                <Icon name="chevLeft" size={18} color="white" />
                            </button>
                            <button className="pd-g-next" onClick={e => { e.stopPropagation(); setMainImg(i => (i + 1) % imgs.length); }}>
                                <Icon name="chevRight" size={18} color="white" />
                            </button>
                        </>
                    )}
                    <div className="pd-gallery-overlay">
                        <span className="pd-photo-count">
                            <Icon name="image" size={14} color="white" />
                            {imgs.length} Photos
                        </span>
                        <span className={`pd-purpose-tag ${prop.purpose === "Sell" ? "pd-tag-sale" : "pd-tag-rent"}`}>
                            {prop.purpose === "Sell" ? "For Sale" : "For Rent"}
                        </span>
                    </div>
                </div>

                {/* Side thumbnails */}
                {imgs.length > 1 && (
                    <div className="pd-gallery-thumbs">
                        {imgs.slice(0, 4).map((img, i) => (
                            <div key={i}
                                className={`pd-thumb-wrap ${i === mainImg ? "pd-thumb-active" : ""}`}
                                onClick={() => setMainImg(i)}>
                                <img src={`${API}${img}`} alt="" />
                                {i === 3 && imgs.length > 4 && (
                                    <div className="pd-more-overlay" onClick={() => setLightbox(0)}>
                                        +{imgs.length - 4} more
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Thumbnail strip ── */}
            {imgs.length > 1 && (
                <div className="pd-strip">
                    {imgs.map((img, i) => (
                        <img key={i} src={`${API}${img}`} alt=""
                            className={`pd-strip-img ${i === mainImg ? "pd-strip-active" : ""}`}
                            onClick={() => setMainImg(i)} />
                    ))}
                </div>
            )}

            {/* ── Quick stats bar ── */}
            <div className="pd-stats-bar">
                {prop.features?.bedrooms && (
                    <div className="pd-stat-item">
                        <Icon name="bed" size={22} color="#16a34a" />
                        <span className="pd-stat-val">{prop.features.bedrooms}</span>
                        <span className="pd-stat-label">Beds</span>
                    </div>
                )}
                {prop.features?.bathrooms && (
                    <div className="pd-stat-item">
                        <Icon name="bath" size={22} color="#16a34a" />
                        <span className="pd-stat-val">{prop.features.bathrooms}</span>
                        <span className="pd-stat-label">Baths</span>
                    </div>
                )}
                <div className="pd-stat-item">
                    <Icon name="area" size={22} color="#16a34a" />
                    <span className="pd-stat-val">{prop.areaSize?.value}</span>
                    <span className="pd-stat-label">{prop.areaSize?.unit}</span>
                </div>
                <div className="pd-stat-item">
                    <Icon name="building" size={22} color="#16a34a" />
                    <span className="pd-stat-val">{prop.propertyType?.subCategory}</span>
                    <span className="pd-stat-label">Type</span>
                </div>
            </div>

            {/* ── Sticky nav tabs ── */}
            <div className="pd-tabs-bar">
                {tabs.map(t => (
                    <button key={t.key}
                        className={`pd-tab-item ${activeTab === t.key ? "pd-tab-active" : ""}`}
                        onClick={() => { setActiveTab(t.key); scrollTo(t.ref); }}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── Main + Sidebar layout ── */}
            <div className="pd-layout">
                <div className="pd-main">

                    {/* Overview */}
                    <section ref={overviewRef} className="pd-section">
                        <h2 className="pd-section-title">Overview</h2>
                        <h3 className="pd-details-heading">Details</h3>
                        <div className="pd-details-grid">
                            {[
                                { label: "Type",      val: prop.propertyType?.subCategory },
                                { label: "Purpose",   val: prop.purpose === "Sell" ? "For Sale" : "For Rent" },
                                { label: "Price",     val: fmt(prop.price?.value) },
                                { label: "Bedroom(s)",val: prop.features?.bedrooms || "—" },
                                { label: "Bath(s)",   val: prop.features?.bathrooms || "—" },
                                { label: "Added",     val: fmtDate(prop.createdAt) },
                                { label: "Area",      val: `${prop.areaSize?.value} ${prop.areaSize?.unit}` },
                                { label: "Location",  val: prop.location?.address || prop.location?.city },
                                { label: "Furnished", val: prop.features?.furnished || "—" },
                                { label: "City",      val: prop.location?.city },
                                { label: "Category",  val: prop.propertyType?.category },
                                { label: "Construction", val: prop.features?.constructionState || "—" },
                            ].map(r => (
                                <div key={r.label} className="pd-detail-row">
                                    <span className="pd-detail-label">{r.label}</span>
                                    <span className="pd-detail-val">{r.val}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Description */}
                    {prop.adInfo?.description && (
                        <section className="pd-section">
                            <h2 className="pd-section-title">Description</h2>
                            <p className={`pd-desc-text ${descExpanded ? "pd-desc-expanded" : ""}`}>
                                {prop.adInfo.description}
                            </p>
                            {prop.adInfo.description.length > 300 && (
                                <button className="pd-read-more" onClick={() => setDescExpanded(d => !d)}>
                                    {descExpanded ? "Show Less ▲" : "Read More ▼"}
                                </button>
                            )}
                        </section>
                    )}

                    {/* Amenities */}
                    {prop.features?.amenities?.length > 0 && (
                        <section ref={amenitiesRef} className="pd-section">
                            <h2 className="pd-section-title">Amenities</h2>
                            <div className="pd-amenities-grid">
                                {prop.features.amenities.map(a => (
                                    <div key={a} className="pd-amenity-item">
                                        <div className="pd-amenity-icon-wrap">
                                            <Icon name={amenityIcons[a] || "check"} size={16} color="#16a34a" />
                                        </div>
                                        <span>{a}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Location & Map */}
                    <section ref={locationRef} className="pd-section">
                        <h2 className="pd-section-title">Location &amp; Map</h2>
                        <div className="pd-location-detail">
                            <Icon name="pin" size={16} color="#16a34a" />
                            <span>{prop.location?.address || prop.location?.city}</span>
                        </div>
                        <PropertyMap lat={prop.location?.lat} lng={prop.location?.lng} city={prop.location?.city} />
                    </section>

                    {/* Owner contact info */}
                    <section className="pd-section">
                        <h2 className="pd-section-title">Contact Information</h2>
                        <div className="pd-owner-info-card">
                            <div className="pd-owner-big-av">{prop.contactInfo?.name?.charAt(0)?.toUpperCase() || "O"}</div>
                            <div className="pd-owner-big-info">
                                <div className="pd-owner-big-name">{prop.contactInfo?.name || "Property Owner"}</div>
                                <div className="pd-owner-big-role">Property Owner · {prop.location?.city}</div>
                                <div className="pd-owner-contacts">
                                    {prop.contactInfo?.mobile && (
                                        <div className="pd-owner-contact-row">
                                            <Icon name="phone" size={14} color="#16a34a" />
                                            {prop.contactInfo.showPhone ? prop.contactInfo.mobile : "Contact via form below"}
                                        </div>
                                    )}
                                    {prop.contactInfo?.email && (
                                        <div className="pd-owner-contact-row">
                                            <Icon name="mail" size={14} color="#16a34a" />
                                            {prop.contactInfo.email}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* ── Sticky Sidebar ── */}
                <div className="pd-sidebar-wrap">
                    <ContactSidebar prop={prop} />
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default PropertyDetail;
