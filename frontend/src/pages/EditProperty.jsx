import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LocationPicker from "../components/LocationPicker";
import "./ListProperty.css";
import "./EditProperty.css";

const AMENITIES = [
    "Servant Quarters", "Drawing Room", "Dining Room", "Kitchen",
    "Study Room", "Prayer Room", "Powder Room", "Gym", "Store Room",
    "Steam Room", "Lounge or Sitting Room", "Laundry Room",
];

const SUB_CATEGORIES = {
    Home: ["House", "Flat", "Upper Portion", "Lower Portion", "Farm House", "Room", "Penthouse"],
    Plots: ["Residential Plot", "Commercial Plot", "Agricultural Land", "Industrial Land"],
    Commercial: ["Office", "Shop", "Warehouse", "Factory", "Building"],
};

const API = import.meta.env.VITE_API_URL;

const EditProperty = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    // Form state - populated after fetch
    const [purpose, setPurpose] = useState("Sell");
    const [category, setCategory] = useState("Home");
    const [subCategory, setSubCategory] = useState("House");
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
    const [contactName, setContactName] = useState("");
    const [contactMobile, setContactMobile] = useState("");
    const [showPhone, setShowPhone] = useState(true);

    useEffect(() => {
        fetchProperty();
    }, [id]);

    const fetchProperty = async () => {
        try {
            const res = await fetch(`${API}/api/seller/property/${id}`);
            const data = await res.json();
            if (!res.ok) { setMessage("Failed to load property."); return; }

            // Populate all fields from DB
            setPurpose(data.purpose || "Sell");
            setCategory(data.propertyType?.category || "Home");
            setSubCategory(data.propertyType?.subCategory || "House");
            setFurnished(data.features?.furnished || "Unfurnished");
            setBedrooms(data.features?.bedrooms || "");
            setBathrooms(data.features?.bathrooms || "");
            setConstructionState(data.features?.constructionState || "Finished");
            setAmenities(data.features?.amenities || []);
            setAreaUnit(data.areaSize?.unit || "Marla");
            setArea(data.areaSize?.value?.toString() || "");
            setTitle(data.adInfo?.title || "");
            setDescription(data.adInfo?.description || "");
            setLocationCity(data.location?.city || "Lahore");
            setLocationAddress(data.location?.address || "");
            setLocationLat(data.location?.lat || 31.5204);
            setLocationLng(data.location?.lng || 74.3587);
            setPrice(data.price?.value?.toString() || "");
            setContactName(data.contactInfo?.name || "");
            setContactMobile(data.contactInfo?.mobile || "");
            setShowPhone(data.contactInfo?.showPhone ?? true);
        } catch {
            setMessage("Error loading property.");
        } finally {
            setLoading(false);
        }
    };

    const toggleAmenity = (item) =>
        setAmenities(prev => prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage("");

        const body = {
            purpose, propCategory: category, propSubCategory: subCategory,
            furnished, bedrooms, bathrooms, constructionState, amenities,
            areaValue: area, areaUnit, priceValue: price,
            adTitle: title, adDescription: description,
            locationAddress, locationCity, locationLat, locationLng,
            contactName, contactMobile, contactShowPhone: showPhone,
        };

        try {
            const res = await fetch(`${API}/api/seller/update/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (res.ok) {
                setMessage("✅ Property updated successfully!");
                setTimeout(() => navigate("/seller-dashboard"), 1800);
            } else {
                setMessage(data.message || "Update failed.");
            }
        } catch {
            setMessage("❌ Network error.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="ep-loading">
                <div className="ep-spinner"></div>
                <p>Loading property details...</p>
            </div>
        );
    }

    return (
        <div className="lp-container">
            {/* Header */}
            <div className="lp-header">
                <div className="ep-breadcrumb">
                    <button className="ep-back-btn" onClick={() => navigate("/seller-dashboard")}>← Dashboard</button>
                </div>
                <h1 className="lp-page-title">✏️ Edit Property</h1>
                <p className="lp-page-sub">Update your listing details below</p>
            </div>

            <form onSubmit={handleSubmit} className="lp-form">

                {/* Category */}
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
                                <div className="ep-field-label">Purpose</div>
                                <div className="lp-tab-group">
                                    {["Sell", "Rent"].map(p => (
                                        <button key={p} type="button" className={`lp-tab ${purpose === p ? "lp-tab-active" : ""}`} onClick={() => setPurpose(p)}>{p}</button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ marginBottom: "10px" }}>
                                <div className="ep-field-label">Property Category</div>
                                <div className="lp-tab-group">
                                    {Object.keys(SUB_CATEGORIES).map(cat => (
                                        <button key={cat} type="button" className={`lp-tab ${category === cat ? "lp-tab-active" : ""}`}
                                            onClick={() => { setCategory(cat); setSubCategory(SUB_CATEGORIES[cat][0]); }}>{cat}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div className="ep-field-label">Property Type</div>
                                <div className="lp-sub-tags">
                                    {(SUB_CATEGORIES[category] || []).map(sub => (
                                        <button key={sub} type="button" className={`lp-tag ${subCategory === sub ? "lp-tag-active" : ""}`}
                                            onClick={() => setSubCategory(sub)}>{sub}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Property Details */}
                <div className="lp-card">
                    <div className="lp-section-badge">🏷️ Property Details</div>
                    <div className="lp-grid-2">
                        <div className="lp-field">
                            <label>Furnished*</label>
                            <div className="lp-toggle-group">
                                {["Unfurnished", "Furnished"].map(f => (
                                    <button key={f} type="button" className={`lp-toggle-btn ${furnished === f ? "lp-toggle-active" : ""}`}
                                        onClick={() => setFurnished(f)}>{f}</button>
                                ))}
                            </div>
                        </div>
                        <div className="lp-field">
                            <label>Bedrooms*</label>
                            <select value={bedrooms} onChange={e => setBedrooms(e.target.value)} className="lp-select">
                                <option value="">Select</option>
                                {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                                <option value="10+">10+</option>
                            </select>
                        </div>
                        <div className="lp-field">
                            <label>Bathrooms*</label>
                            <select value={bathrooms} onChange={e => setBathrooms(e.target.value)} className="lp-select">
                                <option value="">Select</option>
                                {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)}
                                <option value="8+">8+</option>
                            </select>
                        </div>
                        <div className="lp-field">
                            <label>Construction State*</label>
                            <div className="lp-toggle-group">
                                {["Grey Structure", "Finished"].map(s => (
                                    <button key={s} type="button" className={`lp-toggle-btn ${constructionState === s ? "lp-toggle-active" : ""}`}
                                        onClick={() => setConstructionState(s)}>{s}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features & Area */}
                <div className="lp-card">
                    <div className="lp-section-badge">✨ Features & Area</div>
                    <div className="lp-field" style={{ marginBottom: 20 }}>
                        <label>Select Features</label>
                        <div className="lp-amenities-wrap">
                            {AMENITIES.map(item => (
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
                                {["Marla", "Kanal", "Sq. Ft.", "Sq. M.", "Sq. Yd."].map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                        <div className="lp-field">
                            <label>Area*</label>
                            <input type="number" value={area} onChange={e => setArea(e.target.value)} required className="lp-input" />
                        </div>
                    </div>
                </div>

                {/* Ad Info */}
                <div className="lp-card">
                    <div className="lp-section-badge">📝 Ad Information</div>
                    <div className="lp-field">
                        <label>Ad Title*</label>
                        <input type="text" maxLength={70} value={title} onChange={e => setTitle(e.target.value)} required className="lp-input" />
                        <div className="lp-char-count">{title.length}/70</div>
                    </div>
                    <div className="lp-field" style={{ marginTop: 18 }}>
                        <label>Description*</label>
                        <textarea rows={5} maxLength={4096} value={description} onChange={e => setDescription(e.target.value)}
                            required className="lp-input lp-textarea" />
                        <div className="lp-char-count">{description.length}/4096</div>
                    </div>
                </div>

                {/* Location */}
                <div className="lp-card">
                    <div className="lp-section-badge">📍 Location</div>
                    <div className="lp-field">
                        <label>Select City</label>
                        <div className="lp-city-btns">
                            {["Lahore", "Islamabad", "Karachi", "Multan"].map(c => (
                                <button key={c} type="button"
                                    className={`lp-city-btn ${locationCity === c ? "lp-city-active" : ""}`}
                                    onClick={() => setLocationCity(c)}>{c}</button>
                            ))}
                        </div>
                        <input type="text" placeholder="Locality / area name" value={locationAddress}
                            onChange={e => setLocationAddress(e.target.value)} required className="lp-input" />
                        <LocationPicker city={locationCity}
                            onLocationSelect={(lat, lng) => { setLocationLat(lat); setLocationLng(lng); }} />
                    </div>
                </div>

                {/* Price */}
                <div className="lp-card">
                    <div className="lp-section-badge">💰 Price</div>
                    <div className="lp-field">
                        <label>Asking Price (PKR)*</label>
                        <div className="lp-price-row">
                            <span className="lp-price-prefix">Rs</span>
                            <input type="number" value={price} onChange={e => setPrice(e.target.value)} required className="lp-input lp-price-input" />
                        </div>
                    </div>
                </div>

                {/* Contact */}
                <div className="lp-card">
                    <div className="lp-section-badge">📞 Contact Information</div>
                    <div className="lp-field">
                        <label>Your Name*</label>
                        <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} required className="lp-input" />
                    </div>
                    <div className="lp-field" style={{ marginTop: 16 }}>
                        <label>Mobile Phone*</label>
                        <div className="lp-price-row">
                            <span className="lp-price-prefix">+92</span>
                            <input type="text" value={contactMobile} onChange={e => setContactMobile(e.target.value)} required className="lp-input lp-price-input" />
                        </div>
                    </div>
                    <div className="lp-toggle-field">
                        <span>Show phone in ads</span>
                        <label className="lp-switch">
                            <input type="checkbox" checked={showPhone} onChange={e => setShowPhone(e.target.checked)} />
                            <span className="lp-slider"></span>
                        </label>
                    </div>
                </div>

                {/* Footer */}
                <div className="lp-footer">
                    {message && (
                        <p className={`lp-msg ${message.startsWith("✅") ? "lp-success" : "lp-error"}`}>{message}</p>
                    )}
                    <div className="ep-footer-btns">
                        <button type="button" className="ep-cancel-btn" onClick={() => navigate("/seller-dashboard")}>
                            Cancel
                        </button>
                        <button type="submit" className="lp-submit-btn" disabled={saving}>
                            {saving ? "Saving changes..." : "💾 Save Changes"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default EditProperty;
