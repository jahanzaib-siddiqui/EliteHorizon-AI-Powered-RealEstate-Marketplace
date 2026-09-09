function PropertyCard({ title, location, price, rentPrice, purpose, type, image, page_url, style }) {
  const handleClick = () => {
    if (page_url) {
      window.open(page_url, "_blank", "noopener,noreferrer");
    }
  };

  const typeColors = {
    House:      { bg: "#e8f5e9", color: "#2e7d32", dot: "#43a047" },
    Commercial: { bg: "#e3f2fd", color: "#1565c0", dot: "#1e88e5" },
    Plot:       { bg: "#fff8e1", color: "#f57f17", dot: "#fdd835" },
  };
  const badge = typeColors[type] || { bg: "#f3f4f6", color: "#555", dot: "#aaa" };

  // Show the correct price — for rent properties use rentPrice
  const isRent = purpose === "Rent" || (!price && rentPrice > 0);
  const displayPrice = isRent ? (rentPrice || 0) : (price || 0);

  const fmtPrice = (v) => {
    if (!v || v <= 0) return "—";
    if (v >= 10000000) return `${(v / 10000000).toFixed(2)} Cr`;
    if (v >= 100000)   return `${(v / 100000).toFixed(1)} Lac`;
    return v.toLocaleString();
  };

  return (
    <div
      onClick={handleClick}
      style={{
        border: "1px solid #e8ecf0",
        borderRadius: "14px",
        overflow: "hidden",
        backgroundColor: "#fff",
        cursor: page_url ? "pointer" : "default",
        transition: "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 32px rgba(15,52,96,0.14)";
        e.currentTarget.style.borderColor = "#c7d8f0";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)";
        e.currentTarget.style.borderColor = "#e8ecf0";
      }}
    >
      {/* Image */}
      <div style={{ position: "relative", overflow: "hidden" }}>
        <img
          src={image}
          alt={title}
          style={{
            width: "100%",
            height: "155px",
            objectFit: "cover",
            display: "block",
            transition: "transform 0.35s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.04)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        />
        {/* Type badge on image */}
        <span style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          background: badge.bg,
          color: badge.color,
          border: `1px solid ${badge.color}22`,
          padding: "3px 10px",
          borderRadius: "20px",
          fontSize: "11px",
          fontWeight: "700",
          display: "flex",
          alignItems: "center",
          gap: "5px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
        }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: badge.dot, display: "inline-block" }} />
          {type}
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: "14px 16px" }}>
        <h3 style={{
          fontSize: "13.5px",
          fontWeight: "700",
          margin: "0 0 5px",
          color: "#1a1a2e",
          lineHeight: "1.35",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {title}
        </h3>

        <p style={{
          color: "#718096",
          fontSize: "12px",
          marginBottom: "10px",
          margin: "0 0 10px",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <span style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}>
            {location}
          </span>
        </p>

          <div style={{
            borderTop: "1px solid #f0f4f8", paddingTop: "10px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: "15px", fontWeight: "800", color: "#0f3460", letterSpacing: "-0.3px" }}>
              PKR {fmtPrice(displayPrice)}
              {isRent && <span style={{ fontSize: "11px", fontWeight: 500, color: "#64748b", marginLeft: "3px" }}>/mo</span>}
            </span>
            {page_url && (
              <span style={{
                fontSize: "11px", color: "#0f3460", fontWeight: "600",
                background: "#e8f0fe", padding: "3px 9px", borderRadius: "8px",
              }}>
                View →
              </span>
            )}
          </div>
      </div>
    </div>
  );
}

export default PropertyCard;
