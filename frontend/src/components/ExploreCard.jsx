import tilesImg from "../assets/tiles.jpg";

function ExploreCard({ title, description, icon, onClick }) {
  return (
    /*
      Two-layer fix for hover clipping:
      - Outer wrapper: handles the translateY lift — NO overflow:hidden here
        so the card never gets clipped by its own bounding box when it moves.
      - Inner container: has overflow:hidden to clip the background image
        to the rounded corners cleanly.
    */
    <div
      style={{
        flex: "1 1 220px",
        cursor: "pointer",
        transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s ease",
        borderRadius: "16px",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-8px)";
        e.currentTarget.style.boxShadow = "0 18px 36px rgba(15,124,92,0.18)";
        const bg = e.currentTarget.querySelector(".explore-bg");
        if (bg) bg.style.opacity = "0.8";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
        const bg = e.currentTarget.querySelector(".explore-bg");
        if (bg) bg.style.opacity = "0.6";
      }}
      onClick={onClick}
    >
      {/* Inner container: clips background image, never transforms itself */}
      <div
        className="explore-card"
        style={{
          padding: "30px",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          textAlign: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
          border: "1px solid #e6e6e6",
          position: "relative",
          overflow: "hidden",   /* safely clips the bg image without clipping the lift */
        }}
      >
        {/* Background image at 60% opacity */}
        <div
          className="explore-bg"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${tilesImg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.6,
            transition: "opacity 0.35s ease",
            zIndex: 0,
          }}
        />

        {/* Content sits above the background */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: "42px", marginBottom: "16px", color: "#0f7c5c" }}>
            {icon}
          </div>

          <h3 style={{ color: "#222", marginBottom: "10px", fontSize: "18px", fontWeight: 700 }}>
            {title}
          </h3>

          {description && (
            <p
              style={{
                color: "#555",
                fontSize: "14px",
                lineHeight: "1.5",
                marginBottom: "18px",
              }}
            >
              {description}
            </p>
          )}

          <button
            style={{
              backgroundColor: "#0f7c5c",
              color: "#ffffff",
              border: "none",
              padding: "10px 22px",
              borderRadius: "20px",
              fontSize: "14px",
              cursor: "pointer",
              fontWeight: 600,
              transition: "background-color 0.3s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#0c634a")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#0f7c5c")
            }
          >
            Open Tool
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExploreCard;
