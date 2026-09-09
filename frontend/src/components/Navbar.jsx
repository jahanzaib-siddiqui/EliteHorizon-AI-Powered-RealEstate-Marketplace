import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ProfileDropdown from "./ProfileDropdown";

/* ─── SVG Icon set ──────────────────────────────────────────── */
const Icons = {
  AIPrediction: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
    </svg>
  ),
  InvestmentScore: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  Heatmap: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>
    </svg>
  ),
  Trends: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
    </svg>
  ),
  EliteProperties: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  Houses: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Commercial: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
    </svg>
  ),
  Plots: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
    </svg>
  ),
  Affordability: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  PlotFinder: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Compare: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3M12 8v8M9 11l3-3 3 3"/>
    </svg>
  ),
  Installment: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
};

/* ─── Dropdown config ───────────────────────────────────────── */
const DROPDOWN_MENUS = {
  "AI Tools": [
    { label: "AI Price Prediction",  desc: "XGBoost-powered estimates",   path: "/ai-price-prediction",  Icon: Icons.AIPrediction },
    { label: "Investment Score",      desc: "ROI & city scoring",           path: "/investment-score",     Icon: Icons.InvestmentScore },
    { label: "Area Heatmap",          desc: "Price density across cities",  path: "/area-heatmap",         Icon: Icons.Heatmap },
    { label: "Property Trends",       desc: "Market activity insights",     path: "/property-trends",      Icon: Icons.Trends },
  ],
  "Listings": [
    { label: "Elite Properties",  desc: "Handpicked premium listings",   path: "/properties",          Icon: Icons.EliteProperties },
    { label: "Houses",            desc: "Homes across 7 cities",         path: "/category/house",      Icon: Icons.Houses },
    { label: "Commercial",        desc: "Offices, shops & buildings",    path: "/category/commercial", Icon: Icons.Commercial },
    { label: "Plots",             desc: "Residential & commercial land", path: "/category/plot",       Icon: Icons.Plots },
  ],
  "Smart Tools": [
    { label: "Affordability Calc", desc: "Plan your budget smartly",      path: "/smart-affordability-calculator", Icon: Icons.Affordability },
    { label: "Plot Finder",        desc: "Locate the right plot",         path: "/plot-finder",                    Icon: Icons.PlotFinder },
    { label: "Compare Properties", desc: "Side-by-side analysis",        path: "/property-comparison",            Icon: Icons.Compare },
    { label: "Installment Calc",   desc: "Monthly payment planner",      path: "/installment-calculator",         Icon: Icons.Installment },
  ],
};

const NAV_ITEMS = ["Home", "AI Tools", "Listings", "Smart Tools", "News", "Blogs", "About"];

/* ─── Dropdown panel ────────────────────────────────────────── */
function NavDropdown({ label, items, navigate }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <li ref={ref} style={{ position: "relative", listStyle: "none" }}>
      {/* Trigger */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: "4px",
          cursor: "pointer", padding: "5px 2px",
          color: open ? "#16a34a" : "#374151",
          fontWeight: 500, fontSize: "14.5px",
          transition: "color 0.18s",
          userSelect: "none",
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.color = "#16a34a"; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.color = "#374151"; }}
      >
        {label}
        <span style={{ display: "flex", alignItems: "center", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.22s ease", color: open ? "#16a34a" : "#9ca3af" }}>
          <Icons.ChevronDown />
        </span>
      </div>

      {/* Panel */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 16px)", left: "50%",
          transform: "translateX(-50%)",
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.10), 0 4px 16px rgba(22,163,74,0.06)",
          border: "1px solid rgba(0,0,0,0.06)",
          padding: "10px",
          minWidth: "260px",
          zIndex: 999,
          animation: "navFadeIn 0.18s ease forwards",
        }}>
          {/* top caret */}
          <span style={{
            position: "absolute", top: "-7px", left: "50%", transform: "translateX(-50%) rotate(45deg)",
            width: "13px", height: "13px",
            background: "#fff",
            borderTop: "1px solid rgba(0,0,0,0.06)",
            borderLeft: "1px solid rgba(0,0,0,0.06)",
            borderRadius: "2px 0 0 0",
          }} />

          {items.map((item, i) => (
            <div
              key={item.path}
              onClick={() => { navigate(item.path); setOpen(false); setHovered(null); }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "10px 12px",
                borderRadius: "10px",
                cursor: "pointer",
                background: hovered === i ? "#f0fdf4" : "transparent",
                transition: "background 0.14s",
              }}
            >
              {/* Icon box */}
              <div style={{
                width: "34px", height: "34px", borderRadius: "9px", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: hovered === i ? "linear-gradient(135deg, #16a34a, #15803d)" : "#f8fafc",
                color: hovered === i ? "#fff" : "#16a34a",
                transition: "all 0.18s",
              }}>
                <item.Icon />
              </div>
              {/* Text */}
              <div>
                <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#0f172a", lineHeight: 1.3 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: "11.5px", color: "#94a3b8", marginTop: "1px", lineHeight: 1.3 }}>
                  {item.desc}
                </div>
              </div>
              {/* Arrow on hover */}
              {hovered === i && (
                <div style={{ marginLeft: "auto", color: "#16a34a", display: "flex" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </li>
  );
}

/* ─── Main Navbar ───────────────────────────────────────────── */
function Navbar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const token     = localStorage.getItem("token");
  const user      = JSON.parse(localStorage.getItem("user"));
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
    window.location.reload();
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const plainClick = (label) => {
    const sectionMap = {
      "News":  "news-section",
      "Blogs": "blogs-section",
      "About": "about-section",
    };

    if (label === "Home") {
      if (location.pathname === "/") {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate("/");
        window.scrollTo(0, 0);
      }
      return;
    }

    const sectionId = sectionMap[label];
    if (!sectionId) return;

    if (location.pathname === "/") {
      // Already on home — just scroll
      scrollToSection(sectionId);
    } else {
      // Navigate home, then scroll after page renders
      navigate("/");
      setTimeout(() => scrollToSection(sectionId), 350);
    }
  };

  const isActive = (label) => {
    if (label === "Home") return location.pathname === "/";
    return false;
  };

  return (
    <>
      <style>{`
        @keyframes navFadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0);    }
        }
      `}</style>

      <nav style={{
        position: "sticky", top: 0, zIndex: 1000,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: scrolled ? "10px 48px" : "14px 48px",
        background: scrolled ? "rgba(255,255,255,0.92)" : "#ffffff",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: "1px solid #f1f5f9",
        boxShadow: scrolled ? "0 2px 24px rgba(0,0,0,0.06)" : "none",
        transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
      }}>

        {/* ── Brand ── */}
        <h2
          onClick={() => {
            if (location.pathname === "/") {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              navigate("/");
              window.scrollTo(0, 0);
            }
          }}
          style={{
            cursor: "pointer", margin: 0, fontSize: "1.45rem", fontWeight: 800,
            letterSpacing: "-0.03em",
            background: "linear-gradient(135deg, #16a34a 0%, #4ade80 50%, #15803d 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            display: "flex", alignItems: "center", gap: "8px",
          }}
        >
          <span style={{
            width: "9px", height: "9px",
            background: "linear-gradient(135deg, #16a34a, #4ade80)",
            borderRadius: "2px", transform: "rotate(45deg)",
            display: "inline-block", flexShrink: 0,
          }} />
          Elite Horizon
        </h2>

        {/* ── Nav Links ── */}
        <ul style={{
          display: "flex", listStyle: "none", gap: "4px",
          margin: 0, padding: 0, alignItems: "center",
        }}>
          {NAV_ITEMS.map(label => {
            if (DROPDOWN_MENUS[label]) {
              return (
                <NavDropdown
                  key={label}
                  label={label}
                  items={DROPDOWN_MENUS[label]}
                  navigate={navigate}
                />
              );
            }
            const active = isActive(label);
            return (
              <li
                key={label}
                onClick={() => plainClick(label)}
                style={{
                  cursor: "pointer",
                  padding: "5px 10px",
                  borderRadius: "8px",
                  fontSize: "14.5px", fontWeight: active ? 600 : 500,
                  color: active ? "#16a34a" : "#374151",
                  background: active ? "#f0fdf4" : "transparent",
                  transition: "all 0.18s",
                  listStyle: "none",
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.color = "#16a34a";
                    e.currentTarget.style.background = "#f8fffe";
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.color = "#374151";
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                {label}
              </li>
            );
          })}

          {/* Inbox */}
          {user && (
            <li
              onClick={() => {
                if (user.role === "buyer") navigate("/buyer-dashboard?tab=inquiries");
                else if (user.role === "seller") navigate("/seller-dashboard?tab=messages");
                else navigate("/my-chats");
              }}
              style={{
                cursor: "pointer", display: "flex", alignItems: "center", gap: "5px",
                padding: "5px 10px", borderRadius: "8px",
                color: "#16a34a", fontWeight: 600, fontSize: "14px",
                transition: "background 0.18s", listStyle: "none", marginLeft: "4px",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#f0fdf4"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              Inbox
            </li>
          )}

          {/* List Property */}
          {user && user.role === "seller" && (
            <li
              onClick={() => navigate("/list-property")}
              style={{
                cursor: "pointer", marginLeft: "8px", listStyle: "none",
                background: "linear-gradient(135deg, #16a34a, #15803d)",
                color: "white", padding: "8px 18px", borderRadius: "9px",
                fontWeight: 700, fontSize: "13.5px", letterSpacing: "0.02em",
                boxShadow: "0 2px 12px rgba(22,163,74,0.28)",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(22,163,74,0.38)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 12px rgba(22,163,74,0.28)";
              }}
            >
              + List Property
            </li>
          )}
        </ul>

        {/* ── Auth ── */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {token ? (
            <ProfileDropdown user={user} handleLogout={handleLogout} />
          ) : (
            <>
              <button
                onClick={() => navigate("/signin")}
                style={{
                  background: "transparent", color: "#374151",
                  border: "1.5px solid #e2e8f0", padding: "8px 20px",
                  borderRadius: "9px", cursor: "pointer",
                  fontWeight: 600, fontSize: "14px",
                  transition: "all 0.18s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "#16a34a";
                  e.currentTarget.style.color = "#16a34a";
                  e.currentTarget.style.background = "#f0fdf4";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.color = "#374151";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Sign In
              </button>
              <button
                onClick={() => navigate("/signup")}
                style={{
                  background: "linear-gradient(135deg, #16a34a, #15803d)",
                  color: "white", border: "none", padding: "9px 22px",
                  borderRadius: "9px", cursor: "pointer", fontWeight: 700,
                  fontSize: "14px", letterSpacing: "0.01em",
                  boxShadow: "0 3px 14px rgba(22,163,74,0.32)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(22,163,74,0.42)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 3px 14px rgba(22,163,74,0.32)";
                }}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </nav>
    </>
  );
}

export default Navbar;
