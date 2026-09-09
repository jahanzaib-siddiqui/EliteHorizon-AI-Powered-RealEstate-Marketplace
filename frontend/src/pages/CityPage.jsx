import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import PropertyCard from "../components/PropertyCard";
import CityMap from "../components/CityMap";
import { getCityProperties } from "../services/api";

const CITY_COORDINATES = {
  lahore:     [31.5204, 74.3587],
  karachi:    [24.8607, 67.0011],
  islamabad:  [33.6844, 73.0479],
  multan:     [30.1575, 71.5249],
  peshawar:   [34.0151, 71.5249],
  quetta:     [30.1798, 66.9750],
  faisalabad: [31.4504, 73.1350],
  sialkot:    [32.4945, 74.5229],
};

const CITY_TAGLINES = {
  lahore:     "The Heart of Punjab",
  islamabad:  "The Capital of Pakistan",
  karachi:    "The City of Lights",
  multan:     "The City of Saints",
  peshawar:   "The City of Flowers",
  quetta:     "The Fruit Garden of Pakistan",
  faisalabad: "The Manchester of Pakistan",
  sialkot:    "The City of Sports",
};

// ── Brand color palette (Elite Horizon green) ──────────────
const BRAND = {
  primary:    "#2c8a68",   // main green
  primaryDk:  "#1a7f4b",   // dark green (navbar CTA)
  primaryLt:  "#10b981",   // light emerald (badges)
  heroBg:     "linear-gradient(135deg, #0d2b1f 0%, #123d2c 50%, #1a5c40 100%)",
  accent:     "#d4edda",
  accentText: "#155724",
};

// ── Inline SVG icons (no emoji, no external library needed) ──
const Icons = {
  Map: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
    </svg>
  ),
  Grid: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  House: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Building: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/><line x1="9" y1="14" x2="9" y2="14.01"/><line x1="15" y1="14" x2="15" y2="14.01"/>
    </svg>
  ),
  Plot: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
    </svg>
  ),
  Pin: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Layers: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
  ChevLeft: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  ChevRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  Tag: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
  Search: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Listings: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  ),
};

const ITEMS_PER_PAGE = 100;

function CityPage() {
  const { city } = useParams();
  const cityKey = city.toLowerCase();
  const cityLabel = cityKey.charAt(0).toUpperCase() + cityKey.slice(1);

  const [properties, setProperties]       = useState([]);
  const [currentPage, setCurrentPage]     = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSize, setSelectedSize]   = useState("All");
  const [selectedType, setSelectedType]   = useState("All");
  const [selectedPurpose, setSelectedPurpose]   = useState("Buy");

  const rightPanelRef = useRef(null);

  const validProperty = properties.find((p) => p.lat && p.lng);
  const center = validProperty
    ? [validProperty.lat, validProperty.lng]
    : CITY_COORDINATES[cityKey] || [31.5204, 74.3587];

  useEffect(() => {
    const filters = {};
    if (selectedPurpose && selectedPurpose !== "All") filters.purpose = selectedPurpose;
    if (selectedType && selectedType !== "All") filters.type = selectedType;
    getCityProperties(cityKey, filters)
      .then((res) => { setProperties(res.data || []); setCurrentPage(1); })
      .catch((err) => console.log(err));
  }, [cityKey, selectedPurpose, selectedType]);

  // ── Filters config ────────────────────────────────────────
  const CATEGORIES = [
    { name: "All",    label: "All",       activeBg: BRAND.primary,  activeColor: "#fff" },
    { name: "Prime",  label: "Prime",     activeBg: "#c0392b",      activeColor: "#fff" },
    { name: "Luxury", label: "Luxury",    activeBg: "#2471a3",      activeColor: "#fff" },
    { name: "Mid",    label: "Mid-Tier",  activeBg: "#1e8449",      activeColor: "#fff" },
    { name: "Budget", label: "Budget",    activeBg: "#b7950b",      activeColor: "#fff" },
  ];

  const SIZE_OPTIONS = [
    { name: "All",     label: "Any Size",  value: null  },
    { name: "5 Marla", label: "5 Marla",   value: 5    },
    { name: "10 Marla",label: "10 Marla",  value: 10   },
    { name: "1 Kanal", label: "1 Kanal",   value: 20   },
  ];

  const TYPE_OPTIONS = [
    { name: "All",        label: "All Types",  Icon: Icons.Grid     },
    { name: "House",      label: "Houses",     Icon: Icons.House    },
    { name: "Commercial", label: "Commercial", Icon: Icons.Building },
    { name: "Plot",       label: "Plots",      Icon: Icons.Plot     },
  ];

  // ── Category detection ────────────────────────────────────
  const getCategory = (location) => {
    const loc = location.toLowerCase();
    if (cityKey === "lahore") {
      if (loc.includes("dha") || loc.includes("model town") || loc.includes("cantt")) return "Prime";
      if (loc.includes("bahria") || loc.includes("johar") || loc.includes("valencia") || loc.includes("lake city") || loc.includes("wapda") || loc.includes("askari")) return "Luxury";
      if (loc.includes("paragon") || loc.includes("state life") || loc.includes("eden") || loc.includes("allama")) return "Mid";
      if (loc.includes("township") || loc.includes("green cap") || loc.includes("samanabad")) return "Budget";
    }
    if (cityKey === "karachi") {
      if (loc.includes("clifton") || loc.includes("dha")) return "Prime";
      if (loc.includes("bahria") || loc.includes("pechs")) return "Luxury";
      if (loc.includes("gulshan") || loc.includes("nazimabad") || loc.includes("malir") || loc.includes("garden")) return "Mid";
      if (loc.includes("korangi") || loc.includes("orangi") || loc.includes("surjani")) return "Budget";
    }
    if (cityKey === "islamabad") {
      if (loc.includes("f-6") || loc.includes("f-7") || loc.includes("e-7") || loc.includes("blue area")) return "Prime";
      if (loc.includes("f-10") || loc.includes("dha") || loc.includes("bahria")) return "Luxury";
      if (loc.includes("g-10") || loc.includes("i-8") || loc.includes("gulberg")) return "Mid";
      if (loc.includes("i-10") || loc.includes("soan") || loc.includes("khanna")) return "Budget";
    }
    if (cityKey === "multan") {
      if (loc.includes("dha") || loc.includes("royal orchard") || loc.includes("cantt")) return "Prime";
      if (loc.includes("gulgasht") || loc.includes("wapda") || loc.includes("bosan")) return "Luxury";
      if (loc.includes("new multan") || loc.includes("model")) return "Mid";
      if (loc.includes("mumtazabad") || loc.includes("shah rukn")) return "Budget";
    }
    if (cityKey === "peshawar") {
      if (loc.includes("hayatabad") || loc.includes("cantt") || loc.includes("askari")) return "Prime";
      if (loc.includes("university town") || loc.includes("bahria") || loc.includes("ring road")) return "Luxury";
      if (loc.includes("gulbahar") || loc.includes("dalazak") || loc.includes("regi")) return "Mid";
      if (loc.includes("kohat road") || loc.includes("pajagi") || loc.includes("chamkani")) return "Budget";
    }
    if (cityKey === "sialkot") {
      if (loc.includes("cantt") || loc.includes("gulshan") || loc.includes("iqbal town")) return "Prime";
      if (loc.includes("satellite") || loc.includes("green town") || loc.includes("paris road")) return "Luxury";
      if (loc.includes("sanda") || loc.includes("wazirabad road") || loc.includes("uggoki")) return "Mid";
    }
    if (cityKey === "faisalabad") {
      if (loc.includes("gulberg") || loc.includes("canal road") || loc.includes("dha")) return "Prime";
      if (loc.includes("madina town") || loc.includes("peoples colony") || loc.includes("jinnah")) return "Luxury";
      if (loc.includes("susan road") || loc.includes("millat road") || loc.includes("d ground")) return "Mid";
      if (loc.includes("ghulam muhammadabad") || loc.includes("nazimabad") || loc.includes("mansoorabad")) return "Budget";
    }
    return "Budget";
  };

  // ── Filtering & pagination ────────────────────────────────
  const filteredProperties = properties.filter((p) => {
    const propPurpose = typeof p.purpose === "string" ? p.purpose.toLowerCase() : "buy";
    if (propPurpose !== selectedPurpose.toLowerCase()) return false;
    if (selectedCategory !== "All" && getCategory(p.location) !== selectedCategory) return false;
    if (selectedSize !== "All" && String(p.area) !== String(selectedSize)) return false;
    if (selectedType !== "All" && String(p.type).toLowerCase() !== String(selectedType).toLowerCase()) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProperties.length / ITEMS_PER_PAGE));
  const paginatedProperties = filteredProperties.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleFilterChange = (setter, value) => { setter(value); setCurrentPage(1); };

  const scrollTopAndGo = (page) => {
    setCurrentPage(page);
    if (rightPanelRef.current) rightPanelRef.current.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [];
    const left = Math.max(2, currentPage - 2);
    const right = Math.min(totalPages - 1, currentPage + 2);
    pages.push(1);
    if (left > 2) pages.push("...");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  const catCount = (name) =>
    name === "All"
      ? filteredProperties.length
      : filteredProperties.filter((p) => getCategory(p.location) === name).length;

  // ── Reusable style builders ───────────────────────────────
  const filterBtn = (active, activeBg = BRAND.primary) => ({
    display: "flex", alignItems: "center", gap: "6px",
    padding: "7px 14px", borderRadius: "9px",
    border: `1.5px solid ${active ? activeBg : "#e2e8f0"}`,
    background: active ? activeBg : "#fff",
    color: active ? "#fff" : "#4a5568",
    fontWeight: active ? "700" : "500",
    fontSize: "13px", cursor: "pointer",
    transition: "all 0.2s ease",
    fontFamily: "'Inter','Segoe UI',sans-serif",
  });

  const pageBtnStyle = (active) => ({
    padding: "7px 14px", borderRadius: "8px",
    border: `1.5px solid ${active ? BRAND.primary : "#e2e8f0"}`,
    background: active ? BRAND.primary : "#fff",
    color: active ? "#fff" : "#4a5568",
    fontWeight: active ? "700" : "400",
    cursor: "pointer", fontSize: "14px",
    transition: "all 0.18s ease", minWidth: "38px",
    fontFamily: "'Inter','Segoe UI',sans-serif",
  });

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", background: "#f5f6fa", minHeight: "100vh" }}>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div style={{
        background: BRAND.heroBg,
        padding: "28px 48px 24px",
        display: "flex", alignItems: "center",
        justifyContent: "space-between", flexWrap: "wrap", gap: "16px",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{
            fontSize: "11px", color: "#86efac", textTransform: "uppercase",
            letterSpacing: "2.5px", display: "flex", alignItems: "center", gap: "6px",
          }}>
            <Icons.Pin /> Elite Horizon
          </span>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#fff", margin: 0, lineHeight: 1.2 }}>
            {cityLabel} Properties
          </h1>
          <p style={{ fontSize: "14px", color: "#86efac", marginTop: "4px" }}>
            {CITY_TAGLINES[cityKey] || cityLabel}
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "16px" }}>
          {[
            { num: properties.length.toLocaleString(),          label: "Total Listings",  Icon: Icons.Listings },
            { num: filteredProperties.length.toLocaleString(),  label: "Matching",        Icon: Icons.Search   },
            { num: paginatedProperties.filter(p => p.lat && p.lng).length, label: "On Map", Icon: Icons.Map    },
          ].map(({ num, label, Icon }) => (
            <div key={label} style={{
              background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "12px", padding: "10px 20px", textAlign: "center",
              backdropFilter: "blur(10px)",
            }}>
              <span style={{ fontSize: "20px", fontWeight: "800", color: "#fff", display: "block" }}>{num}</span>
              <span style={{
                fontSize: "11px", color: "#86efac", textTransform: "uppercase",
                letterSpacing: "1px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", marginTop: "3px",
              }}>
                <Icon /> {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── STICKY FILTER BAR ─────────────────────────────────── */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #e8ecf0",
        padding: "12px 48px", display: "flex", alignItems: "center",
        gap: "16px", flexWrap: "wrap",
        boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
        position: "sticky", top: 0, zIndex: 200,
      }}>

        {/* Buy / Rent Pill */}
        <div style={{ display: "flex", background: "#f0f4f8", borderRadius: "10px", padding: "3px", gap: "2px" }}>
          {["Buy", "Rent"].map(opt => (
            <button
              key={opt}
              onClick={() => handleFilterChange(setSelectedPurpose, opt)}
              style={{
                ...filterBtn(selectedPurpose === opt, BRAND.primaryDk),
                border: "none", borderRadius: "8px", padding: "6px 22px",
                boxShadow: selectedPurpose === opt ? `0 2px 8px ${BRAND.primaryDk}55` : "none",
              }}
            >
              {opt}
            </button>
          ))}
        </div>

        <div style={{ width: "1px", height: "28px", background: "#e2e8f0" }} />

        {/* Type Buttons */}
        <div style={{ display: "flex", gap: "6px" }}>
          {TYPE_OPTIONS.map(({ name, label, Icon }) => (
            <button key={name} onClick={() => handleFilterChange(setSelectedType, name)}
              style={filterBtn(selectedType === name, BRAND.primary)}>
              <Icon /> {label}
            </button>
          ))}
        </div>

        <div style={{ width: "1px", height: "28px", background: "#e2e8f0" }} />

        {/* Category Chips */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "11px", fontWeight: "600", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px", marginRight: "2px" }}>
            <Icons.Tag /> Category
          </span>
          {CATEGORIES.map((cat) => (
            <button key={cat.name} onClick={() => handleFilterChange(setSelectedCategory, cat.name)}
              style={{ ...filterBtn(selectedCategory === cat.name, cat.activeBg), padding: "5px 12px", fontSize: "12px" }}>
              {cat.label}
              <span style={{
                background: selectedCategory === cat.name ? "rgba(255,255,255,0.22)" : "#f0f4f8",
                color: selectedCategory === cat.name ? "#fff" : "#888",
                borderRadius: "20px", padding: "1px 7px", fontSize: "11px", fontWeight: "700", marginLeft: "2px",
              }}>
                {catCount(cat.name)}
              </span>
            </button>
          ))}
        </div>

        <div style={{ width: "1px", height: "28px", background: "#e2e8f0" }} />

        {/* Size Selector */}
        <div style={{ display: "flex", gap: "6px" }}>
          <span style={{ fontSize: "11px", fontWeight: "600", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px", display: "flex", alignItems: "center", gap: "4px" }}>
            <Icons.Layers /> Size
          </span>
          {SIZE_OPTIONS.map(({ name, label, value }) => (
            <button key={name} onClick={() => handleFilterChange(setSelectedSize, value || "All")}
              style={{ ...filterBtn(selectedSize === (value || "All"), BRAND.primary), padding: "5px 12px", fontSize: "12px" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── SPLIT LAYOUT ──────────────────────────────────────── */}
      <div style={{ display: "flex", height: "calc(100vh - 176px)", overflow: "hidden" }}>

        {/* LEFT: Sticky Map ───────────────────────────── */}
        <div style={{ width: "45%", flexShrink: 0, position: "relative", height: "100%", background: "#dce6dc" }}>
          {/* Map badge */}
          <div style={{
            position: "absolute", top: "14px", left: "14px", zIndex: 500,
            background: "rgba(26,127,75,0.90)", backdropFilter: "blur(8px)",
            color: "#fff", padding: "6px 14px", borderRadius: "20px",
            fontSize: "12px", fontWeight: "600", letterSpacing: "0.4px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.25)", pointerEvents: "none",
            display: "flex", alignItems: "center", gap: "6px",
          }}>
            <Icons.Map />
            {paginatedProperties.filter(p => p.lat && p.lng).length} properties on map
          </div>
          <CityMap
            properties={paginatedProperties.map(p => ({ ...p, category: getCategory(p.location) }))}
            center={center}
            style={{ height: "100%", width: "100%", borderRadius: 0 }}
          />
        </div>

        {/* RIGHT: Scrollable Results ──────────────────── */}
        <div
          ref={rightPanelRef}
          style={{ flex: 1, overflowY: "auto", padding: "24px 28px 40px", background: "#f5f6fa" }}
        >
          {/* Results Header */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: "20px", paddingBottom: "16px",
            borderBottom: `2px solid ${BRAND.primary}22`,
          }}>
            <div>
              <span style={{ fontSize: "18px", fontWeight: "700", color: "#1a3326" }}>
                {filteredProperties.length.toLocaleString()} Properties
              </span>
              <span style={{ fontSize: "13px", color: "#718096", marginLeft: "8px" }}>
                for {selectedPurpose.toLowerCase()} in {cityLabel}
              </span>
            </div>
            {totalPages > 1 && (
              <span style={{
                background: BRAND.accent, color: BRAND.accentText,
                borderRadius: "20px", padding: "4px 14px",
                fontSize: "12px", fontWeight: "700",
              }}>
                Page {currentPage} / {totalPages}
              </span>
            )}
          </div>

          {/* Property Grid */}
          {paginatedProperties.length > 0 ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "18px" }}>
                {paginatedProperties.map((p) => (
                  <PropertyCard
                    key={p._id}
                    title={p.title}
                    location={`${p.location}, ${p.city}`}
                    price={selectedPurpose.toLowerCase() === "rent"
                      ? `${p.rentPrice || p.price || 0} / Month`
                      : p.price}
                    type={p.type}
                    image={p.image}
                    page_url={p.page_url}
                    style={{ width: "100%", minWidth: "0" }}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "6px", marginTop: "40px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => scrollTopAndGo(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{
                      ...pageBtnStyle(false), display: "flex", alignItems: "center", gap: "4px",
                      opacity: currentPage === 1 ? 0.4 : 1,
                      cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    }}
                  >
                    <Icons.ChevLeft /> Prev
                  </button>

                  {getPageNumbers().map((page, idx) =>
                    page === "..." ? (
                      <span key={`e-${idx}`} style={{ padding: "6px 4px", color: "#aaa" }}>…</span>
                    ) : (
                      <button key={page} onClick={() => scrollTopAndGo(page)} style={pageBtnStyle(currentPage === page)}>
                        {page}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => scrollTopAndGo(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={{
                      ...pageBtnStyle(false), display: "flex", alignItems: "center", gap: "4px",
                      opacity: currentPage === totalPages ? 0.4 : 1,
                      cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                    }}
                  >
                    Next <Icons.ChevRight />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", height: "300px", color: "#a0aec0", gap: "12px",
            }}>
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke={BRAND.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4">
                <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
              </svg>
              <p style={{ fontSize: "16px", fontWeight: "600", margin: 0, color: "#4a5568" }}>No properties found</p>
              <p style={{ fontSize: "13px", margin: 0 }}>Try adjusting your filters above</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CityPage;
