import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import LocationPicker from "../components/LocationPicker";
import "./ListProperty.css";

const AMENITIES = {
    Home: [
        "Servant Quarters", "Drawing Room", "Dining Room", "Kitchen",
        "Study Room", "Prayer Room", "Powder Room", "Gym", "Store Room",
        "Steam Room", "Lounge or Sitting Room", "Laundry Room",
        "Central Air Conditioning", "Backup Generator", "CCTV Cameras",
        "Swimming Pool", "Rooftop Terrace", "Parking Space",
    ],
    Commercial: [
        "Lift / Elevator", "Central Air Conditioning", "Backup Generator",
        "CCTV Cameras", "24/7 Security", "Fire Suppression System",
        "Parking Space", "Loading / Unloading Bay", "Basement Storage",
        "Reception Area", "Conference Room", "Broadband / Fiber Internet",
        "Washrooms", "Cafeteria / Pantry", "Disabled Access / Ramp",
    ],
    Plots: [
        "Corner Plot", "Facing Park", "Main Boulevard", "Near Mosque",
        "Near School", "Near Hospital", "Near Commercial Area",
        "Boundary Wall", "Gate / Entrance", "Utilities Available",
        "Sewerage Connected", "Gas Connection Available",
    ],
};

const IMAGE_SLOT_COUNT = 14;

const SUB_CATEGORIES = {
    Home: ["House", "Flat", "Upper Portion", "Lower Portion", "Farm House", "Room", "Penthouse"],
    Plots: ["Residential Plot", "Commercial Plot", "Agricultural Land", "Industrial Land"],
    Commercial: ["Office", "Shop", "Warehouse", "Factory", "Building"],
};

const ListProperty = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));
    const fileInputRefs = useRef([]);

    const [purpose, setPurpose] = useState("Sell");
    const [category, setCategory] = useState("Home");
    const [subCategory, setSubCategory] = useState("House");
    const [imageFiles, setImageFiles] = useState(Array(IMAGE_SLOT_COUNT).fill(null));
    const [imagePreviews, setImagePreviews] = useState(Array(IMAGE_SLOT_COUNT).fill(null));
    const [furnished, setFurnished] = useState("Unfurnished");
    const [bedrooms, setBedrooms] = useState("");
    const [bathrooms, setBathrooms] = useState("");
    const [constructionState, setConstructionState] = useState("Finished");
    const [amenities, setAmenities] = useState([]);
    const [areaUnit, setAreaUnit] = useState("Marla");
    const [area, setArea] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [locationCity, setLocationCity] = useState("Lahore");
    const [locationAddress, setLocationAddress] = useState("");
    const [locationLat, setLocationLat] = useState(31.5204);
    const [locationLng, setLocationLng] = useState(74.3587);
    const [price, setPrice] = useState("");
    const [contactName, setContactName] = useState(user?.name || "");
    const [contactMobile, setContactMobile] = useState("");
    const [showPhone, setShowPhone] = useState(true);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleImageChange = (index, e) => {
        const file = e.target.files[0];
        if (!file) return;
        const newFiles = [...imageFiles];
        const newPreviews = [...imagePreviews];
        newFiles[index] = file;
        newPreviews[index] = URL.createObjectURL(file);
        setImageFiles(newFiles);
        setImagePreviews(newPreviews);
    };

    const toggleAmenity = (item) => {
        setAmenities(prev =>
            prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]
        );
    };

    const uploadedCount = imageFiles.filter(Boolean).length;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        const fd = new FormData();
        fd.append("sellerId", user?.id || "");
        fd.append("purpose", purpose);
        fd.append("propCategory", category);
        fd.append("propSubCategory", subCategory);
        fd.append("areaValue", area);
        fd.append("areaUnit", areaUnit);
        fd.append("priceValue", price);
        fd.append("furnished", furnished);
        fd.append("bedrooms", bedrooms);
        fd.append("bathrooms", bathrooms);
        fd.append("constructionState", constructionState);
        amenities.forEach(a => fd.append("amenities", a));
        fd.append("adTitle", title);
        fd.append("adDescription", description);
        fd.append("locationAddress", locationAddress);
        fd.append("locationCity", locationCity);
        fd.append("locationLat", locationLat);
        fd.append("locationLng", locationLng);
        fd.append("contactName", contactName);
        fd.append("contactMobile", contactMobile);
        fd.append("contactShowPhone", showPhone);
        fd.append("contactEmail", user?.email || "");
        imageFiles.forEach(file => { if (file) fd.append("images", file); });

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/seller/list`, {
                method: "POST",
                body: fd,
            });
            const data = await response.json();
            if (response.ok) {
                setMessage("✅ Property listed successfully!");
                setTimeout(() => navigate("/"), 2000);
            } else {
                setMessage(data.message || "Something went wrong.");
            }
        } catch {
            setMessage("❌ Error connecting to server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="lp-container">
            {/* Page Header */}
            <div className="lp-header">
                <h1 className="lp-page-title">List Your Property</h1>
                <p className="lp-page-sub">Reach millions of buyers in a few simple steps</p>
            </div>

            {/* Info Strip */}
            <div style={{ maxWidth: 920, margin: "0 auto 16px" }}>
                <div className="lp-info-strip">
                    <div className="lp-info-item"><span className="lp-info-icon">📋</span> Complete listing information</div>
                    <div className="lp-info-item"><span className="lp-info-icon">💰</span> Set the right price</div>
                    <div className="lp-info-item"><span className="lp-info-icon">🏡</span> Add quality property images</div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="lp-form">

                {/* ── CATEGORY ── */}
                <div className="lp-card">
                    <div className="lp-section-badge">📂 Category</div>
                    <div className="lp-card-row">
                        <div className="lp-category-left">
                            <div className="lp-category-preview">
                                <img src="https://cdn-icons-png.flaticon.com/512/619/619153.png" alt="home" width="44" />
                                <div>
                                    <strong>Property for {purpose === "Sell" ? "Sale" : "Rent"}</strong>
                                    <p>{subCategory}s</p>
                                </div>
                            </div>
                        </div>
                        <div className="lp-purpose-selector">
                            <div style={{ marginBottom: "10px" }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Purpose</div>
                                <div className="lp-tab-group">
                                    {["Sell", "Rent"].map(p => (
                                        <button key={p} type="button"
                                            className={`lp-tab ${purpose === p ? "lp-tab-active" : ""}`}
                                            onClick={() => setPurpose(p)}>{p}</button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ marginBottom: "10px" }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Property Category</div>
                                <div className="lp-tab-group">
                                    {Object.keys(SUB_CATEGORIES).map(cat => (
                                        <button key={cat} type="button"
                                            className={`lp-tab ${category === cat ? "lp-tab-active" : ""}`}
                                            onClick={() => { setCategory(cat); setSubCategory(SUB_CATEGORIES[cat][0]); setAmenities([]); }}>{cat}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Property Type</div>
                                <div className="lp-sub-tags">
                                    {(SUB_CATEGORIES[category] || []).map(sub => (
                                        <button key={sub} type="button"
                                            className={`lp-tag ${subCategory === sub ? "lp-tag-active" : ""}`}
                                            onClick={() => setSubCategory(sub)}>{sub}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── UPLOAD IMAGES ── */}
                <div className="lp-card">
                    <div className="lp-image-section-label">
                        <div className="lp-section-badge">📷 Property Images</div>
                        <span className="lp-image-count">{uploadedCount} / {IMAGE_SLOT_COUNT} uploaded</span>
                    </div>
                    <div className="lp-image-grid">
                        {Array.from({ length: IMAGE_SLOT_COUNT }).map((_, idx) => (
                            <div key={idx}
                                className={`lp-image-slot ${idx === 0 ? "lp-image-slot-main" : ""} ${imagePreviews[idx] ? "lp-img-has" : ""}`}
                                onClick={() => fileInputRefs.current[idx]?.click()}
                                title={idx === 0 ? "Cover photo" : `Photo ${idx + 1}`}
                            >
                                <input ref={el => fileInputRefs.current[idx] = el}
                                    type="file" accept="image/*" style={{ display: "none" }}
                                    onChange={e => handleImageChange(idx, e)} />
                                {imagePreviews[idx]
                                    ? <img src={imagePreviews[idx]} alt="preview" className="lp-img-preview" />
                                    : <span className="lp-camera-icon">{idx === 0 ? "➕" : "📷"}</span>
                                }
                            </div>
                        ))}
                    </div>
                    <p className="lp-hint">✨ Add at least 5 photos. For the cover picture, landscape mode is recommended.</p>
                </div>

                {/* ── PROPERTY DETAILS ── hide entirely for Plots, hide bedrooms for Commercial */}
                {category !== "Plots" && (
                <div className="lp-card">
                    <div className="lp-section-badge">🏷️ Property Details</div>
                    <div className="lp-grid-2">
                        <div className="lp-field">
                            <label>Furnished*</label>
                            <div className="lp-toggle-group">
                                {["Unfurnished", "Furnished"].map(f => (
                                    <button key={f} type="button"
                                        className={`lp-toggle-btn ${furnished === f ? "lp-toggle-active" : ""}`}
                                        onClick={() => setFurnished(f)}>{f}</button>
                                ))}
                            </div>
                        </div>

                        {category === "Home" && (
                        <div className="lp-field">
                            <label>Bedrooms*</label>
                            <select value={bedrooms} onChange={e => setBedrooms(e.target.value)} required className="lp-select">
                                <option value="">Select bedrooms</option>
                                {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                                <option value="10+">10+</option>
                            </select>
                        </div>
                        )}

                        <div className="lp-field">
                            <label>Bathrooms*</label>
                            <select value={bathrooms} onChange={e => setBathrooms(e.target.value)} required className="lp-select">
                                <option value="">Select bathrooms</option>
                                {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)}
                                <option value="8+">8+</option>
                            </select>
                        </div>

                        <div className="lp-field">
                            <label>Construction State*</label>
                            <div className="lp-toggle-group">
                                {["Grey Structure", "Finished"].map(s => (
                                    <button key={s} type="button"
                                        className={`lp-toggle-btn ${constructionState === s ? "lp-toggle-active" : ""}`}
                                        onClick={() => setConstructionState(s)}>{s}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                )}

                {/* ── FEATURES & AREA ── */}
                <div className="lp-card">
                    <div className="lp-section-badge">✨ Features & Area</div>
                    <div className="lp-field" style={{ marginBottom: 20 }}>
                        <label>Select Features
                            <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 500, color: "#16a34a", background: "#f0fdf4", padding: "2px 8px", borderRadius: 20, border: "1px solid #bbf7d0" }}>
                                {category}
                            </span>
                        </label>
                        <div className="lp-amenities-wrap">
                            {(AMENITIES[category] || AMENITIES.Home).map(item => (
                                <button key={item} type="button"
                                    className={`lp-amenity-chip ${amenities.includes(item) ? "lp-chip-active" : ""}`}
                                    onClick={() => toggleAmenity(item)}>{item}</button>
                            ))}
                        </div>
                    </div>
                    <div className="lp-divider" />
                    <div className="lp-grid-2">
                        <div className="lp-field">
                            <label>Area Unit*</label>
                            <select value={areaUnit} onChange={e => setAreaUnit(e.target.value)} className="lp-select">
                                <option value="Marla">Marla</option>
                                <option value="Kanal">Kanal</option>
                                <option value="Sq. Ft.">Sq. Ft.</option>
                                <option value="Sq. M.">Sq. M.</option>
                                <option value="Sq. Yd.">Sq. Yd.</option>
                            </select>
                        </div>
                        <div className="lp-field">
                            <label>Area*</label>
                            <input type="number" placeholder="Enter area" value={area} onChange={e => setArea(e.target.value)} required className="lp-input" />
                        </div>
                    </div>
                </div>

                {/* ── AD INFO ── */}
                <div className="lp-card">
                    <div className="lp-section-badge">📝 Ad Information</div>
                    <div className="lp-field">
                        <label>Ad Title*</label>
                        <input type="text" placeholder="e.g. Beautiful 3-Bed House in DHA Phase 5" maxLength={70}
                            value={title} onChange={e => setTitle(e.target.value)} required className="lp-input" />
                        <div className="lp-char-count">{title.length}/70</div>
                    </div>
                    <div className="lp-field" style={{ marginTop: 18 }}>
                        <label>Description*</label>
                        <textarea placeholder="Describe your property — include key features, condition, nearby areas, and reason for selling..."
                            rows={5} maxLength={4096} value={description}
                            onChange={e => setDescription(e.target.value)} required
                            className="lp-input lp-textarea" />
                        <div className="lp-char-count">{description.length}/4096</div>
                    </div>
                </div>

                {/* ── LOCATION ── */}
                <div className="lp-card">
                    <div className="lp-section-badge">📍 Location</div>
                    <div className="lp-field">
                        <label>Select City</label>
                        <div className="lp-city-btns">
                            {["Lahore", "Islamabad", "Karachi", "Multan", "Peshawar", "Sialkot", "Faisalabad"].map(c => (
                                <button key={c} type="button"
                                    className={`lp-city-btn ${locationCity === c ? "lp-city-active" : ""}`}
                                    onClick={() => setLocationCity(c)}>{c}</button>
                            ))}
                        </div>
                        <input type="text" placeholder="Enter locality / area name (e.g. DHA Phase 6)" value={locationAddress}
                            onChange={e => setLocationAddress(e.target.value)} required className="lp-input" />
                        <LocationPicker city={locationCity}
                            onLocationSelect={(lat, lng) => { setLocationLat(lat); setLocationLng(lng); }} />
                    </div>
                </div>

                {/* ── PRICE ── */}
                <div className="lp-card">
                    <div className="lp-section-badge">💰 Price</div>
                    <div className="lp-field">
                        <label>Asking Price (PKR)*</label>
                        <div className="lp-price-row">
                            <span className="lp-price-prefix">Rs</span>
                            <input type="number" placeholder="Enter your asking price" value={price}
                                onChange={e => setPrice(e.target.value)} required className="lp-input lp-price-input" />
                        </div>
                    </div>
                </div>

                {/* ── CONTACT ── */}
                <div className="lp-card">
                    <div className="lp-section-badge">📞 Contact Information</div>
                    <div className="lp-field">
                        <label>Your Name*</label>
                        <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} required className="lp-input" />
                    </div>
                    <div className="lp-field" style={{ marginTop: 16 }}>
                        <label>Mobile Phone Number*</label>
                        <div className="lp-price-row">
                            <span className="lp-price-prefix">+92</span>
                            <input type="text" placeholder="3XX XXXXXXX" value={contactMobile}
                                onChange={e => setContactMobile(e.target.value)} required className="lp-input lp-price-input" />
                        </div>
                    </div>
                    <div className="lp-toggle-field">
                        <span>Show my phone number in ads</span>
                        <label className="lp-switch">
                            <input type="checkbox" checked={showPhone} onChange={e => setShowPhone(e.target.checked)} />
                            <span className="lp-slider"></span>
                        </label>
                    </div>
                </div>

                {/* ── FOOTER ── */}
                <div className="lp-footer">
                    {message && <p className={`lp-msg ${message.startsWith("✅") ? "lp-success" : "lp-error"}`}>{message}</p>}
                    <button type="submit" className="lp-submit-btn" disabled={loading}>
                        {loading ? "Posting your listing..." : "Post now 🚀"}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default ListProperty;
