import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Footer from "../components/Footer";
import "./ListedProperties.css";

const API = import.meta.env.VITE_API_URL;
const imgSrc = (url) => url?.startsWith('http') ? url : `${API}${url}`;

/* ─── Inline SVG icons ─── */
const Icon = ({ name, size = 16, color = "currentColor" }) => {
    const s = { width: size, height: size, display: "block", flexShrink: 0 };
    const p = { fill: "none", stroke: color, strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round" };
    const icons = {
        pin:      <svg style={s} viewBox="0 0 24 24" {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
        bed:      <svg style={s} viewBox="0 0 24 24" {...p}><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>,
        bath:     <svg style={s} viewBox="0 0 24 24" {...p}><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><line x1="10" y1="5" x2="8" y2="7"/><line x1="2" y1="12" x2="22" y2="12"/></svg>,
        area:     <svg style={s} viewBox="0 0 24 24" {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>,
        building: <svg style={s} viewBox="0 0 24 24" {...p}><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="22" x2="9" y2="2"/><line x1="15" y1="22" x2="15" y2="2"/><line x1="4" y1="7" x2="9" y2="7"/><line x1="4" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="20" y2="12"/><line x1="15" y1="7" x2="20" y2="7"/></svg>,
        phone:    <svg style={s} viewBox="0 0 24 24" {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.37 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 6.29 6.29l.48-.48a2 2 0 0 1 2.09-.41 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
        mail:     <svg style={s} viewBox="0 0 24 24" {...p}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
        user:     <svg style={s} viewBox="0 0 24 24" {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
        image:    <svg style={s} viewBox="0 0 24 24" {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
        search:   <svg style={s} viewBox="0 0 24 24" {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
        chevLeft: <svg style={s} viewBox="0 0 24 24" {...p}><polyline points="15 18 9 12 15 6"/></svg>,
        chevRight:<svg style={s} viewBox="0 0 24 24" {...p}><polyline points="9 18 15 12 9 6"/></svg>,
        check:    <svg style={s} viewBox="0 0 24 24" {...p} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
        x:        <svg style={s} viewBox="0 0 24 24" {...p} strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
        heart:    <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
        eye:      <svg style={s} viewBox="0 0 24 24" {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
        home:     <svg style={s} viewBox="0 0 24 24" {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
        office:   <svg style={s} viewBox="0 0 24 24" {...p}><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="2" y1="15" x2="22" y2="15"/><line x1="8" y1="9" x2="8" y2="21"/><line x1="16" y1="9" x2="16" y2="21"/></svg>,
        land:     <svg style={s} viewBox="0 0 24 24" {...p}><path d="M2 20h20"/><path d="M5 20V8l7-5 7 5v12"/><path d="M9 20v-6h6v6"/></svg>,
        location: <svg style={s} viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="3"/><path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"/></svg>,
        filter:   <svg style={s} viewBox="0 0 24 24" {...p}><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>,
    };
    return icons[name] || null;
};

const fmt = (v) => {
    if (!v) return "N/A";
    if (v >= 10000000) return `Rs ${(v / 10000000).toFixed(1)} Cr`;
    if (v >= 100000)   return `Rs ${(v / 100000).toFixed(1)} Lac`;
    return `Rs ${v.toLocaleString()}`;
};

const CITIES = ["All Cities", "Islamabad", "Lahore", "Karachi", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta"];
const AREA_RANGES = [
    { label: "Any Size",       value: "" },
    { label: "1–3 Marla",      value: "0-3" },
    { label: "3–5 Marla",      value: "3-5" },
    { label: "5–10 Marla",     value: "5-10" },
    { label: "10 Marla–1 Kanal", value: "10-20" },
    { label: "1–2 Kanal",      value: "20-40" },
    { label: "2+ Kanal",       value: "40-9999" },
];

const CATEGORIES = [
    { key: "All",        label: "All Types",  icon: "filter"  },
    { key: "Home",       label: "Houses",     icon: "home"    },
    { key: "Commercial", label: "Commercial", icon: "office"  },
    { key: "Plots",      label: "Plots",      icon: "land"    },
];

/* ─── Property Card ─── */
const PropCard = ({ p }) => {
    const navigate = useNavigate();
    const [imgIdx, setImgIdx] = useState(0);
    const [liked, setLiked] = useState(false);
    const imgs = p.media?.images || [];

    const goToDetail = () => navigate(`/properties/${p._id}`);
    const purposeBg = p.purpose === "Sell"
        ? "linear-gradient(135deg,#16a34a,#22c55e)"
        : "linear-gradient(135deg,#1d4ed8,#3b82f6)";
    const purposeLabel = p.purpose === "Sell" ? "For Sale" : "For Rent";

    return (
        <div className="lp-card" onClick={goToDetail}>
            {/* ── Image ── */}
            <div className="lp-card-img">
                {imgs.length > 0
                    ? <img src={imgSrc(imgs[imgIdx])} alt={p.adInfo?.title} />
                    : <div className="lp-card-no-img"><Icon name="image" size={44} color="#d1d5db" /><span>No Photo</span></div>
                }
                {imgs.length > 1 && (
                    <>
                        <button className="lp-img-arr lp-arr-left" onClick={e => { e.stopPropagation(); setImgIdx(i => (i - 1 + imgs.length) % imgs.length); }}>
                            <Icon name="chevLeft" size={14} color="white" />
                        </button>
                        <button className="lp-img-arr lp-arr-right" onClick={e => { e.stopPropagation(); setImgIdx(i => (i + 1) % imgs.length); }}>
                            <Icon name="chevRight" size={14} color="white" />
                        </button>
                        <div className="lp-img-dots">
                            {imgs.slice(0, 5).map((_, i) => (
                                <span key={i} className={`lp-dot ${i === imgIdx ? "lp-dot-active" : ""}`}
                                    onClick={e => { e.stopPropagation(); setImgIdx(i); }} />
                            ))}
                        </div>
                        <div className="lp-img-counter">{imgIdx + 1} / {Math.min(imgs.length, 5)}</div>
                    </>
                )}

                {/* Top overlay row */}
                <div className="lp-card-top-row">
                    <span className="lp-purpose-badge" style={{ background: purposeBg }}>{purposeLabel}</span>
                </div>

                {/* Price overlay */}
                <div className="lp-img-price-overlay">
                    <span className="lp-overlay-price">{fmt(p.price?.value)}</span>
                    {p.areaSize?.value && (
                        <span className="lp-overlay-area">{p.areaSize.value} {p.areaSize.unit}</span>
                    )}
                </div>
            </div>

            {/* ── Body ── */}
            <div className="lp-card-body">
                <h3 className="lp-card-title">{p.adInfo?.title}</h3>
                <div className="lp-card-loc">
                    <Icon name="pin" size={13} color="#16a34a" />
                    <span>{[p.location?.address, p.location?.city].filter(Boolean).join(", ") || "Location not specified"}</span>
                </div>

                <div className="lp-card-divider" />

                {/* Stats */}
                <div className="lp-card-stats">
                    {p.features?.bedrooms > 0 && (
                        <div className="lp-stat-item">
                            <Icon name="bed" size={14} color="#16a34a" />
                            <div><div className="lp-stat-val">{p.features.bedrooms}</div><div className="lp-stat-lbl">Beds</div></div>
                        </div>
                    )}
                    {p.features?.bathrooms > 0 && (
                        <div className="lp-stat-item">
                            <Icon name="bath" size={14} color="#16a34a" />
                            <div><div className="lp-stat-val">{p.features.bathrooms}</div><div className="lp-stat-lbl">Baths</div></div>
                        </div>
                    )}
                    {p.areaSize?.value && (
                        <div className="lp-stat-item">
                            <Icon name="area" size={14} color="#16a34a" />
                            <div><div className="lp-stat-val">{p.areaSize.value}</div><div className="lp-stat-lbl">{p.areaSize.unit || "Sqft"}</div></div>
                        </div>
                    )}
                    <div className="lp-stat-item">
                        <Icon name="building" size={14} color="#16a34a" />
                        <div><div className="lp-stat-val lp-type-val">{p.propertyType?.subCategory || "N/A"}</div><div className="lp-stat-lbl">Type</div></div>
                    </div>
                </div>

                {/* Amenities */}
                {p.features?.amenities?.length > 0 && (
                    <div className="lp-amenities">
                        {p.features.amenities.slice(0, 3).map(a => (
                            <span key={a} className="lp-amenity-chip">
                                <Icon name="check" size={10} color="#16a34a" />{a}
                            </span>
                        ))}
                        {p.features.amenities.length > 3 && (
                            <span className="lp-amenity-more">+{p.features.amenities.length - 3} more</span>
                        )}
                    </div>
                )}

                {/* Description */}
                {p.adInfo?.description && (
                    <p className="lp-card-desc">{p.adInfo.description.slice(0, 90)}…</p>
                )}

                {/* Owner strip */}
                <div className="lp-owner-strip">
                    <div className="lp-owner-av">{p.contactInfo?.name?.charAt(0)?.toUpperCase() || "O"}</div>
                    <div className="lp-owner-info">
                        <div className="lp-owner-name">{p.contactInfo?.name || "Property Owner"}</div>
                        <div className="lp-owner-city">{p.location?.city || "Pakistan"}</div>
                    </div>
                    <button className="lp-contact-btn" onClick={e => { e.stopPropagation(); goToDetail(); }}>
                        <Icon name="eye" size={13} color="white" />
                        View Details
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ─── Main Page ─── */
const ListedProperties = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const [listings, setListings]   = useState([]);
    const [total, setTotal]         = useState(0);
    const [pages, setPages]         = useState(1);
    const [loading, setLoading]     = useState(true);

    const purpose    = searchParams.get("purpose")  || "All";
    const category   = searchParams.get("category") || "All";
    const cityFilter = searchParams.get("city")     || "";
    const areaRange  = searchParams.get("area")     || "";
    const page       = Number(searchParams.get("page") || 1);
    const search     = searchParams.get("search")   || "";
    const location   = searchParams.get("location") || "";

    const [searchInput,   setSearchInput]   = useState(search);
    const [locationInput, setLocationInput] = useState(location);

    const fetchListings = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 12 });
            if (purpose  !== "All") params.set("purpose",  purpose);
            if (category !== "All") params.set("propertyType", category);
            if (cityFilter && cityFilter !== "All Cities") params.set("city", cityFilter);
            else if (search) params.set("city", search);
            if (location) params.set("location", location);
            if (areaRange) {
                const [min, max] = areaRange.split("-");
                if (min) params.set("minArea", min);
                if (max && max !== "99999") params.set("maxArea", max);
            }
            const res  = await fetch(`${API}/api/seller/listings?${params}`);
            const data = await res.json();
            setListings(data.listings || []);
            setTotal(data.total || 0);
            setPages(data.pages || 1);
        } catch { /* ignore */ } finally { setLoading(false); }
    }, [purpose, category, cityFilter, areaRange, location, page, search]);

    useEffect(() => { fetchListings(); }, [fetchListings]);

    const setFilter = (key, val) => {
        const p = new URLSearchParams(searchParams);
        p.set(key, val);
        p.set("page", "1");
        setSearchParams(p);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const p = new URLSearchParams(searchParams);
        p.set("search", searchInput);
        p.set("location", locationInput);
        p.set("page", "1");
        setSearchParams(p);
    };

    const clearAllFilters = () => {
        setSearchInput("");
        setLocationInput("");
        setSearchParams(new URLSearchParams({ page: "1" }));
    };

    const activeFilterCount = [
        purpose !== "All",
        category !== "All",
        cityFilter && cityFilter !== "All Cities",
        areaRange !== "",
        search !== "",
        location !== "",
    ].filter(Boolean).length;

    return (
        <div className="lp-page">
            {/* ── Hero ── */}
            <div className="lp-hero">
                <div className="lp-hero-inner">
                    <div className="lp-hero-badge">🏡 Pakistan's #1 Property Marketplace</div>
                    <h1 className="lp-hero-title">Find Your Dream Property</h1>
                    <p className="lp-hero-sub">Verified listings from real owners — browse, compare, and connect directly</p>
                    <form className="lp-search-bar" onSubmit={handleSearchSubmit}>
                        <span className="lp-search-icon"><Icon name="search" size={18} color="#9ca3af" /></span>
                        <input className="lp-search-input"
                            placeholder="Search by city (e.g. Lahore, Islamabad)..."
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)} />
                        <div className="lp-search-divider" />
                        <span className="lp-search-icon"><Icon name="location" size={18} color="#9ca3af" /></span>
                        <input className="lp-search-input"
                            placeholder="Area / Location..."
                            value={locationInput}
                            onChange={e => setLocationInput(e.target.value)} />
                        <button type="submit" className="lp-search-btn">
                            <Icon name="search" size={15} color="white" />
                            Search
                        </button>
                    </form>
                    <div className="lp-hero-stats">
                        <div className="lp-hero-stat"><span className="lp-stat-num">10K+</span><span className="lp-stat-text">Listings</span></div>
                        <div className="lp-hero-stat-divider" />
                        <div className="lp-hero-stat"><span className="lp-stat-num">50+</span><span className="lp-stat-text">Cities</span></div>
                        <div className="lp-hero-stat-divider" />
                        <div className="lp-hero-stat"><span className="lp-stat-num">100%</span><span className="lp-stat-text">Verified</span></div>
                    </div>
                </div>
            </div>

            {/* ── Filter Bar ── */}
            <div className="lp-filter-bar">
                <div className="lp-filter-inner">
                    {/* Purpose */}
                    <div className="lp-filter-section">
                        <span className="lp-filter-label">Purpose</span>
                        <div className="lp-pill-group">
                            {[{ key: "All", label: "All" }, { key: "Sell", label: "Buy" }, { key: "Rent", label: "Rent" }].map(t => (
                                <button key={t.key}
                                    className={`lp-pill ${purpose === t.key ? "lp-pill-active" : ""}`}
                                    onClick={() => setFilter("purpose", t.key)}>{t.label}</button>
                            ))}
                        </div>
                    </div>

                    <div className="lp-filter-sep" />

                    {/* Category */}
                    <div className="lp-filter-section">
                        <span className="lp-filter-label">Category</span>
                        <div className="lp-pill-group">
                            {CATEGORIES.map(c => (
                                <button key={c.key}
                                    className={`lp-pill lp-cat-pill ${category === c.key ? "lp-pill-active" : ""}`}
                                    onClick={() => setFilter("category", c.key)}>
                                    <Icon name={c.icon} size={13} color={category === c.key ? "white" : "#374151"} />
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="lp-filter-sep" />

                    {/* City */}
                    <div className="lp-filter-section">
                        <span className="lp-filter-label">City</span>
                        <select className="lp-select"
                            value={cityFilter || "All Cities"}
                            onChange={e => setFilter("city", e.target.value === "All Cities" ? "" : e.target.value)}>
                            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="lp-filter-sep" />

                    {/* Area */}
                    <div className="lp-filter-section">
                        <span className="lp-filter-label">Size (Marla/Kanal)</span>
                        <select className="lp-select"
                            value={areaRange}
                            onChange={e => setFilter("area", e.target.value)}>
                            {AREA_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                    </div>

                    {activeFilterCount > 0 && (
                        <button className="lp-clear-btn" onClick={clearAllFilters}>
                            <Icon name="x" size={13} color="#dc2626" />
                            Clear ({activeFilterCount})
                        </button>
                    )}
                </div>
            </div>

            {/* ── Content ── */}
            <div className="lp-content">
                <div className="lp-results-row">
                    <div>
                        <h2 className="lp-results-title">
                            {loading ? "Loading…" : `${total} Propert${total !== 1 ? "ies" : "y"} Found`}
                        </h2>
                        {!loading && activeFilterCount > 0 && (
                            <div className="lp-active-filters">
                                {purpose !== "All" && <span className="lp-filter-tag">{purpose === "Sell" ? "For Sale" : "For Rent"}</span>}
                                {category !== "All" && <span className="lp-filter-tag">{category}</span>}
                                {cityFilter && cityFilter !== "All Cities" && <span className="lp-filter-tag">{cityFilter}</span>}
                                {areaRange && <span className="lp-filter-tag">{AREA_RANGES.find(r => r.value === areaRange)?.label}</span>}
                                {search && <span className="lp-filter-tag">🔍 {search}</span>}
                                {location && <span className="lp-filter-tag">📍 {location}</span>}
                            </div>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="lp-loading">
                        <div className="lp-spinner" />
                        <p>Fetching listings…</p>
                    </div>
                ) : listings.length === 0 ? (
                    <div className="lp-empty">
                        <div className="lp-empty-icon"><Icon name="building" size={44} color="#d1d5db" /></div>
                        <h3>No listings found</h3>
                        <p>Try changing filters or search for another city.</p>
                        <button className="lp-empty-reset" onClick={clearAllFilters}>Reset All Filters</button>
                    </div>
                ) : (
                    <div className="lp-grid">
                        {listings.map(p => <PropCard key={p._id} p={p} />)}
                    </div>
                )}

                {pages > 1 && (
                    <div className="lp-pagination">
                        <button disabled={page <= 1} onClick={() => setFilter("page", page - 1)} className="lp-pg-btn">
                            <Icon name="chevLeft" size={15} />
                        </button>
                        {Array.from({ length: pages }, (_, i) => i + 1).map(n => (
                            <button key={n}
                                className={`lp-pg-num ${n === page ? "lp-pg-active" : ""}`}
                                onClick={() => setFilter("page", n)}>{n}</button>
                        ))}
                        <button disabled={page >= pages} onClick={() => setFilter("page", page + 1)} className="lp-pg-btn">
                            <Icon name="chevRight" size={15} />
                        </button>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default ListedProperties;
