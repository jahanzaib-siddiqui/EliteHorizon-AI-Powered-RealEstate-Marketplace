import { useState, useEffect, useRef } from "react";
import { FaSearch, FaTimes, FaMapMarkerAlt } from "react-icons/fa";

// ── All 7 cities with curated location lists ──────────────────────────────────
const CITY_LOCATIONS = {
  lahore: [
    "DHA Phase 1", "DHA Phase 2", "DHA Phase 3", "DHA Phase 4",
    "DHA Phase 5", "DHA Phase 6", "DHA Phase 7", "DHA Phase 8",
    "Gulberg I", "Gulberg II", "Gulberg III", "Gulberg IV",
    "Bahria Town", "Bahria Orchard", "Model Town", "Johar Town",
    "Garden Town", "Cantt", "Valencia", "Faisal Town", "Iqbal Town",
    "Wapda Town", "Askari X", "Askari XI", "Township", "Raiwind Road",
    "Bedian Road", "Barki Road", "Main Boulevard", "Liberty Market",
  ],
  islamabad: [
    "F-6", "F-7", "F-8", "F-10", "F-11",
    "E-7", "E-11", "G-9", "G-10", "G-11", "G-13",
    "I-8", "I-10", "I-14",
    "Blue Area", "DHA Phase 1", "DHA Phase 2", "DHA Phase 3",
    "Bahria Enclave", "Bahria Town Phase 7", "Bahria Town Phase 8",
    "Park View City", "Capital Smart City", "Top City",
    "Diplomatic Enclave", "Margalla Hills", "Bani Gala",
  ],
  karachi: [
    "Clifton", "Clifton Block 1", "Clifton Block 2", "Clifton Block 4",
    "DHA Phase 1", "DHA Phase 2", "DHA Phase 4", "DHA Phase 5", "DHA Phase 6", "DHA Phase 8",
    "PECHS", "Gulshan-e-Iqbal", "North Nazimabad", "Bahria Town",
    "North Karachi", "Federal B Area", "Korangi", "Scheme 33",
    "Malir", "Gulistan-e-Jauhar", "Landhi", "SITE", "Saddar",
    "Defence View", "Askari IV", "Askari V",
  ],
  multan: [
    "DHA Multan", "DHA Phase 1", "DHA Phase 2",
    "Cantt", "Cantt Area", "Cantt Bosan Road",
    "Gulgasht Colony", "Wapda Town", "New Multan",
    "Royal Orchard", "Bosan Road", "Mumtazabad",
    "Shah Rukn-e-Alam Colony", "Model Town", "Khayaban-e-Sir Syed",
    "Bahria Town", "Khayaban Colony", "Nawabpur Road",
  ],
  peshawar: [
    "Hayatabad Phase 1", "Hayatabad Phase 2", "Hayatabad Phase 3",
    "Hayatabad Phase 4", "Hayatabad Phase 5", "Hayatabad Phase 6",
    "Cantt", "University Town",
    "Bahria Town Phase 4", "Bahria Town Phase 7",
    "Askari", "Askari III", "Ring Road",
    "Gulbahar", "Dalazak Road", "Regi", "Kohat Road",
    "Phase 1 New City", "Chamkani",
  ],
  sialkot: [
    "Cantt", "Cantt Area",
    "Iqbal Town", "Gulshan Colony", "Gulshan-e-Ravi",
    "Satellite Town", "Green Town", "Paris Road",
    "Wazirabad Road", "Uggoki", "Sambrial Road",
    "Daska Road", "Kotli Road",
  ],
  faisalabad: [
    "Gulberg", "Gulberg I", "Gulberg II", "Gulberg III",
    "Canal Road", "DHA Faisalabad Phase 1", "DHA Faisalabad Phase 2",
    "Madina Town", "Peoples Colony", "Jinnah Town",
    "Susan Road", "Millat Road", "D Ground",
    "Ghulam Muhammadabad", "Nazimabad", "Mansoorabad",
    "Sargodha Road", "Sheikhupura Road", "Jaranwala Road",
  ],
};

const ALL_CITIES = [
  { key: "lahore",     label: "Lahore" },
  { key: "islamabad",  label: "Islamabad" },
  { key: "karachi",    label: "Karachi" },
  { key: "multan",     label: "Multan" },
  { key: "peshawar",   label: "Peshawar" },
  { key: "sialkot",    label: "Sialkot" },
  { key: "faisalabad", label: "Faisalabad" },
];

const statBadges = [
  { label: "7K+",  sub: "Properties" },
  { label: "7",    sub: "Cities" },
  { label: "AI",   sub: "Powered" },
];

function AdvancedSearch({ onSearch }) {
  const [city,     setCity]     = useState("");
  const [location, setLocation] = useState("");
  const [type,     setType]     = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [purpose,  setPurpose]  = useState("Buy");

  // Location autocomplete state
  const [locQuery, setLocQuery] = useState("");
  const [locOpen,  setLocOpen]  = useState(false);
  const locRef    = useRef(null);
  const inputRef  = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (locRef.current && !locRef.current.contains(e.target)) setLocOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleCityChange = (e) => {
    setCity(e.target.value);
    setLocation("");
    setLocQuery("");
    setLocOpen(false);
  };

  // Filtered location suggestions
  const locationOptions = city
    ? (CITY_LOCATIONS[city] || []).filter(l =>
        l.toLowerCase().includes(locQuery.toLowerCase())
      )
    : [];

  const selectLocation = (loc) => {
    setLocation(loc);
    setLocQuery(loc);
    setLocOpen(false);
  };

  const clearSearch = () => {
    setCity(""); setLocation(""); setType("");
    setMinPrice(""); setMaxPrice(""); setLocQuery("");
    setLocOpen(false);
    onSearch({ reset: true });
  };

  const handleSearch = () => {
    onSearch({ city, location, type, minPrice, maxPrice, purpose });
  };

  const hasFilter = city || location || type || minPrice || maxPrice;

  return (
    <div style={{
      position: "relative",
      backgroundImage: "url('https://images.wallpapersden.com/image/download/city-buildings-skyscraper-view_am5oa2eUmZqaraWkpJRoaWllrWZpaWU.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundAttachment: "fixed",
      minHeight: "480px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      {/* Dark gradient overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(5,46,22,0.72) 0%, rgba(10,31,22,0.82) 100%)",
        zIndex: 0,
      }} />

      <div style={{
        position: "relative", zIndex: 1,
        maxWidth: "1100px", width: "100%",
        margin: "0 auto", padding: "60px 20px", textAlign: "center",
      }}>
        {/* Hero Text */}
        <h1 style={{
          fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 800, color: "#fff",
          marginBottom: "12px", letterSpacing: "-0.02em", lineHeight: 1.15,
          animation: "fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both",
        }}>
          Find Your Dream Property
          <br />
          <span style={{
            background: "linear-gradient(135deg, #4ade80, #22c55e, #16a34a)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>in Pakistan</span>
        </h1>
        <p style={{
          color: "rgba(255,255,255,0.75)", fontSize: "clamp(14px, 2vw, 17px)",
          marginBottom: "32px", fontWeight: 400,
          animation: "fadeUp 0.7s 0.15s cubic-bezier(0.22,1,0.36,1) both",
        }}>
          Explore 7,000+ real properties across 7 cities with AI-powered insights
        </p>

        {/* Buy / Rent Toggle */}
        <div style={{
          display: "flex", gap: "8px", justifyContent: "center", marginBottom: "18px",
          animation: "fadeUp 0.7s 0.25s cubic-bezier(0.22,1,0.36,1) both",
        }}>
          {["Buy", "Rent"].map(p => (
            <button key={p} onClick={() => setPurpose(p)} style={{
              padding: "10px 32px",
              border: purpose === p ? "none" : "2px solid rgba(255,255,255,0.3)",
              borderRadius: "50px", cursor: "pointer", fontWeight: 700,
              fontSize: "14px", letterSpacing: "0.03em", transition: "all 0.25s ease",
              background: purpose === p
                ? "linear-gradient(135deg, #16a34a, #15803d)"
                : "rgba(255,255,255,0.08)",
              color: purpose === p ? "white" : "rgba(255,255,255,0.85)",
              boxShadow: purpose === p ? "0 4px 18px rgba(22,163,74,0.4)" : "none",
            }}>
              {p}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div style={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
          borderRadius: "16px", display: "flex", gap: "10px", flexWrap: "wrap",
          padding: "18px 22px", border: "1px solid rgba(255,255,255,0.4)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          animation: "fadeUp 0.7s 0.35s cubic-bezier(0.22,1,0.36,1) both",
          alignItems: "center",
        }}>

          {/* City */}
          <select style={inputStyle} value={city} onChange={handleCityChange}>
            <option value="">Select City</option>
            {ALL_CITIES.map(c => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>

          {/* Location — autocomplete */}
          <div ref={locRef} style={{ flex: 1, minWidth: "160px", position: "relative" }}>
            <div style={{ position: "relative" }}>
              <FaMapMarkerAlt style={{
                position: "absolute", left: "12px", top: "50%",
                transform: "translateY(-50%)", color: "#94a3b8", fontSize: "13px", pointerEvents: "none",
              }} />
              <input
                ref={inputRef}
                type="text"
                placeholder={city ? "Search location..." : "Select city first"}
                style={{
                  ...inputStyle,
                  width: "100%",
                  boxSizing: "border-box",
                  paddingLeft: "32px",
                  paddingRight: locQuery ? "30px" : "14px",
                  background: !city ? "#f8fafc" : "#fff",
                  cursor: !city ? "not-allowed" : "text",
                }}
                value={locQuery}
                disabled={!city}
                onChange={e => { setLocQuery(e.target.value); setLocation(""); setLocOpen(true); }}
                onFocus={() => city && setLocOpen(true)}
              />
              {locQuery && (
                <FaTimes
                  onClick={() => { setLocQuery(""); setLocation(""); inputRef.current?.focus(); }}
                  style={{
                    position: "absolute", right: "10px", top: "50%",
                    transform: "translateY(-50%)", color: "#94a3b8",
                    cursor: "pointer", fontSize: "11px",
                  }}
                />
              )}
            </div>

            {/* Dropdown */}
            {locOpen && locationOptions.length > 0 && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
                background: "#fff", borderRadius: "10px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.14)", border: "1px solid #e2e8f0",
                maxHeight: "240px", overflowY: "auto", zIndex: 9999, textAlign: "left",
                scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 #f1f5f9",
              }}>
                {locationOptions.map(loc => (
                  <div
                    key={loc}
                    onMouseDown={(e) => { e.preventDefault(); selectLocation(loc); }}
                    style={{
                      padding: "9px 14px 9px 36px", fontSize: "13.5px", cursor: "pointer",
                      color: "#334155", borderBottom: "1px solid #f1f5f9",
                      position: "relative", transition: "background 0.12s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f0fdf4"}
                    onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                  >
                    <FaMapMarkerAlt style={{
                      position: "absolute", left: "13px", top: "50%",
                      transform: "translateY(-50%)", color: "#16a34a", fontSize: "11px",
                    }} />
                    {loc}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Property Type */}
          <select style={inputStyle} value={type} onChange={e => setType(e.target.value)}>
            <option value="">Property Type</option>
            <option value="House">House</option>
            <option value="Commercial">Commercial</option>
            <option value="Plot">Plot</option>
          </select>

          {/* Price range */}
          <input
            type="number"
            placeholder={purpose === "Rent" ? "Min Rent (PKR)" : "Min Price (PKR)"}
            style={{ ...inputStyle, minWidth: "120px" }}
            value={minPrice}
            onChange={e => setMinPrice(e.target.value)}
          />
          <input
            type="number"
            placeholder={purpose === "Rent" ? "Max Rent (PKR)" : "Max Price (PKR)"}
            style={{ ...inputStyle, minWidth: "120px" }}
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
          />

          {/* Clear */}
          {hasFilter && (
            <button
              style={{ ...buttonStyle, background: "#f1f5f9", color: "#64748b", boxShadow: "none", border: "1.5px solid #e2e8f0" }}
              onClick={clearSearch}
            >
              <FaTimes style={{ marginRight: "5px", fontSize: "11px" }} />
              Clear
            </button>
          )}

          {/* Search */}
          <button style={buttonStyle} onClick={handleSearch}>
            <FaSearch style={{ marginRight: "6px", fontSize: "13px" }} />
            Search
          </button>
        </div>

        {/* Stat Badges */}
        <div style={{
          display: "flex", gap: "24px", justifyContent: "center", marginTop: "28px",
          animation: "fadeUp 0.7s 0.5s cubic-bezier(0.22,1,0.36,1) both",
        }}>
          {statBadges.map((s, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.15)", borderRadius: "12px",
              padding: "12px 22px", textAlign: "center", minWidth: "100px",
            }}>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#4ade80", lineHeight: 1.1 }}>{s.label}</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)", fontWeight: 500, marginTop: "2px" }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: "12px 14px",
  flex: "1",
  minWidth: "130px",
  borderRadius: "10px",
  border: "1.5px solid #e2e8f0",
  fontSize: "14px",
  fontFamily: "inherit",
  color: "#334155",
  background: "#fff",
  transition: "border-color 0.2s, box-shadow 0.2s",
  outline: "none",
};

const buttonStyle = {
  background: "linear-gradient(135deg, #16a34a, #15803d)",
  color: "white",
  border: "none",
  padding: "12px 24px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "14.5px",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  boxShadow: "0 4px 16px rgba(22,163,74,0.35)",
  transition: "all 0.2s",
  whiteSpace: "nowrap",
};

export default AdvancedSearch;
