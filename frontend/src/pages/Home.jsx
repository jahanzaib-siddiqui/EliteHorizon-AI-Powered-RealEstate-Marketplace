import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdvancedSearch from "../components/AdvancedSearch";
import ExploreCard from "../components/ExploreCard";
import PropertySlider from "../components/PropertySlider";
import Footer from "../components/Footer";
import newsData from "../data/newsData";
import NewsCard from "../components/NewsCard";
import blogData from "../data/blogData";
import BlogCard from "../components/BlogCard";
import { getTrendingProperties, searchProperties } from "../services/api";
import { useRevealAll } from "../utils/useReveal";

import {
  FaCalculator,
  FaMapMarkerAlt,
  FaChartLine,
  FaBalanceScale,
  FaMapMarkedAlt,
  FaTachometerAlt,
  FaRobot,
  FaBuilding,
  FaCity,
  FaBrain,
  FaUsers,
} from "react-icons/fa";
import "./Home.css";

const API = import.meta.env.VITE_API_URL;

const fmtPrice = (v) => {
  if (!v) return "N/A";
  if (v >= 10000000) return `Rs ${(v / 10000000).toFixed(1)} Cr`;
  if (v >= 100000)   return `Rs ${(v / 100000).toFixed(1)} Lac`;
  return `Rs ${v.toLocaleString()}`;
};




/* ================= CITY DATA ================= */
const cities = [
  { name: "lahore",     display: "Lahore",     image: "https://img.freepik.com/premium-vector/xi39an-map-city-poster-white-grey-horizontal-background-vector-map-municipality-area-street-map-widescreen-skyline-panorama_228947-576.jpg" },
  { name: "islamabad", display: "Islamabad", image: "https://img.freepik.com/premium-vector/changchun-map-city-poster-province-white-grey-horizontal-background-vector-map-municipality-area-road-map-widescreen-skyline-panorama_228947-534.jpg" },
  { name: "karachi",   display: "Karachi",   image: "https://img.freepik.com/premium-vector/xi39an-map-city-poster-white-grey-horizontal-background-vector-map-municipality-area-street-map-widescreen-skyline-panorama_228947-576.jpg" },
  { name: "multan",    display: "Multan",    image: "https://img.freepik.com/premium-vector/changchun-map-city-poster-province-white-grey-horizontal-background-vector-map-municipality-area-road-map-widescreen-skyline-panorama_228947-534.jpg" },
  { name: "peshawar",  display: "Peshawar",  image: "https://img.freepik.com/premium-vector/xi39an-map-city-poster-white-grey-horizontal-background-vector-map-municipality-area-street-map-widescreen-skyline-panorama_228947-576.jpg" },
  { name: "sialkot",   display: "Sialkot",   image: "https://img.freepik.com/premium-vector/changchun-map-city-poster-province-white-grey-horizontal-background-vector-map-municipality-area-road-map-widescreen-skyline-panorama_228947-534.jpg" },
  { name: "faisalabad",display: "Faisalabad",image: "https://img.freepik.com/premium-vector/changchun-map-city-poster-province-white-grey-horizontal-background-vector-map-municipality-area-road-map-widescreen-skyline-panorama_228947-534.jpg" },
];

/* ================= CATEGORY DATA ================= */
const categories = [
  {
    name: "Homes",
    slug: "house",
    image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be",
  },
  {
    name: "Commercial",
    slug: "commercial",
    image: "https://w0.peakpx.com/wallpaper/733/923/HD-wallpaper-architecture-design-of-commercial-buildings.jpg",
  },
  {
    name: "Plots",
    slug: "plot",
    image: "https://t3.ftcdn.net/jpg/03/63/40/62/360_F_363406290_5HRe2PxnvoKtlHlZNTvhsRzUwnWOFPXA.jpg",
  },
];

function Home() {
  const [properties, setProperties] = useState([]);
  const [activeCityDot, setActiveCityDot] = useState(0);
  const citySliderRef = useRef(null);
  const navigate = useNavigate();

  // Activate scroll-triggered animations
  useRevealAll();

  const NUM_DOTS = 4;

  const scrollToCity = (dotIndex) => {
    const slider = citySliderRef.current;
    if (!slider) return;
    const maxScroll = slider.scrollWidth - slider.clientWidth;
    const targetScroll = dotIndex === NUM_DOTS - 1
      ? maxScroll
      : (dotIndex / (NUM_DOTS - 1)) * maxScroll;
    slider.scrollTo({ left: targetScroll, behavior: 'smooth' });
    setActiveCityDot(dotIndex);
  };

  const handleCityScroll = () => {
    const slider = citySliderRef.current;
    if (!slider) return;
    const { scrollLeft, scrollWidth, clientWidth } = slider;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 0) { setActiveCityDot(0); return; }
    // Use percentage-based dot so last dot = fully scrolled right
    const dotIndex = Math.round((scrollLeft / maxScroll) * (NUM_DOTS - 1));
    setActiveCityDot(Math.min(dotIndex, NUM_DOTS - 1));
  };

  /* ================= CORE FEATURES DATA ================= */
  const coreFeatures = [
    {
      id: "heatmap",
      title: "AREA HEATMAP",
      icon: <FaMapMarkedAlt />,
      description: "Instantly visualize neighborhood trends, amenities, and growth potential.",
      image: "/heatmap_light.png",
      route: "/area-heatmap"
    },
    {
      id: "invest-score",
      title: "INVESTMENT SCORE",
      icon: <FaTachometerAlt />,
      description: "Analyze properties with our comprehensive data-driven ROI rating based on market trends and risk assessment.",
      image: "/investment_light.png",
      route: "/investment-score"
    },
    {
      id: "afford-calculator",
      title: "SMART AFFORDABILITY CALCULATOR",
      icon: <FaCalculator />,
      description: "Determine your maximum property budget based on expenses, and preferred mortgage terms.",
      image: "/afford_light.png",
      route: "/smart-affordability-calculator"
    },
    {
      id: "ai-predict",
      title: "AI PRICE PREDICTION",
      icon: <FaRobot />,
      description: "Get data-driven forecasts for future property values using predictive AI models.",
      image: "/ai_predict_light.png",
      route: "/ai-price-prediction"
    }
  ];

  /* ================= FETCH TRENDING ================= */
  useEffect(() => {
    getTrendingProperties()
      .then((res) => setProperties(res.data))
      .catch((err) => console.log(err));
  }, []);

  /* ================= FETCH FEATURED SELLER LISTINGS ================= */
  const [featuredListings, setFeaturedListings] = useState([]);
  useEffect(() => {
    fetch(`${API}/api/seller/listings/featured`)
      .then(r => r.json())
      .then(d => setFeaturedListings(d.listings || []))
      .catch(() => {});
  }, []);

  const [isSearched, setIsSearched] = useState(false);

  const handleSearch = (filters) => {
    if (filters.reset) {
      // User clicked Clear — reload trending
      setIsSearched(false);
      getTrendingProperties()
        .then((res) => setProperties(res.data))
        .catch((err) => console.log(err));
      return;
    }
    setIsSearched(true);
    searchProperties(filters)
      .then((res) => setProperties(res.data))
      .catch((err) => console.log(err));
  };

  /* ================= TILE STYLES ================= */
  const tileStyle = {
    cursor: "pointer",
    width: "300px",
    height: "110px",
    borderRadius: "10px",
    overflow: "hidden",
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "22px",
    border: "1px solid #ddd",
    transition: "transform 0.3s, color 0.3s",
  };

  const handleHoverEnter = (e, image) => {
    e.currentTarget.style.backgroundImage = `
      linear-gradient(to right, rgba(44,138,104,0.65), rgba(2,94,174,0.55)),
      url(${image})
    `;
    e.currentTarget.style.color = "#fff";
    e.currentTarget.style.transform = "scale(1.05)";
  };

  const handleHoverLeave = (e, image) => {
    e.currentTarget.style.backgroundImage = `url(${image})`;
    e.currentTarget.style.color = "#555";
    e.currentTarget.style.transform = "scale(1)";
  };

  return (
    <>
      <AdvancedSearch onSearch={handleSearch} />

      {/* ================= TRENDING / RESULTS ================= */}
      <div style={{ padding: "50px 40px", background: "linear-gradient(135deg, #fafffe 0%, #f0fdf4 50%, #ffffff 100%)" }}>
        <h2 className="section-heading reveal" style={{ fontSize: "2rem", fontWeight: 800, color: "#0f172a" }}>
          {isSearched
            ? `Search Results ${properties.length > 0 ? `(${properties.length})` : ""}`
            : "Trending Properties"}
        </h2>
        {properties.length > 0 ? (
          <PropertySlider properties={properties} />
        ) : (
          <p style={{ color: "#64748b", padding: "20px 0" }}>
            {isSearched ? "No properties match your filters. Try adjusting your search." : "Loading trending properties…"}
          </p>
        )}
      </div>

      {/* ================= CORE FEATURES (ESTATEPRO THEME) ================= */}
      <section className="core-features-section dot-pattern">
        <h4 className="core-features-subtitle reveal">DISCOVER YOUR PERFECT PROPERTY WITH SMART TOOLS</h4>
        <h2 className="core-features-title section-heading reveal">OUR KEY FEATURES</h2>

      <div className="features-grid stagger">
          {coreFeatures.map(feature => (
            <div
              className="feature-card reveal"
              key={feature.id}
              onClick={feature.route ? () => navigate(feature.route) : undefined}
              style={{ cursor: feature.route ? 'pointer' : 'default' }}
            >
              <div className="feature-header">
                <div className="feature-icon">
                  {feature.icon}
                </div>
                <h3>
                  {feature.title}
                  {feature.route && (
                    <span style={{
                      display: 'inline-block',
                      marginLeft: '6px',
                      fontSize: '0.7rem',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '20px',
                      fontWeight: '700',
                      verticalAlign: 'middle',
                      letterSpacing: '0.03em'
                    }}>LIVE ↗</span>
                  )}
                </h3>
              </div>

              {/* Graphic Mock window */}
              <div className="feature-graphic-container">
                <img src={feature.image} alt={feature.title} />
              </div>

              <p>{feature.description}</p>

              {feature.route && (
                <div style={{
                  marginTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  color: '#086e4c'
                }}>
                  Try it now
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ================= FEATURED SELLER LISTINGS ================= */}
      <section className="home-fl-section">
        <div className="home-fl-header reveal">
          <div>
            <div className="home-fl-eyebrow">VERIFIED OWNER LISTINGS</div>
            <h2 className="home-fl-title section-heading">Properties For Sale &amp; Rent</h2>
            <p className="home-fl-sub">Directly from property owners — admin-verified for authenticity</p>
          </div>
          <button className="home-fl-see-all eh-btn" onClick={() => navigate("/properties")}>
            See All Properties
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
        </div>

        {featuredListings.length === 0 ? (
          <div className="home-fl-empty">
            <p>No listings yet — be the first to <span onClick={() => navigate("/list-property")} className="home-fl-link">list a property</span>.</p>
          </div>
        ) : (
          <div className="home-fl-grid stagger">
            {featuredListings.map(p => (
              <div key={p._id} className="home-fl-card eh-card" onClick={() => navigate(`/properties?purpose=${p.purpose}`)}>  
                {/* Image */}
                <div className="home-fl-img">
                  {p.media?.images?.[0]
                    ? <img src={`${API}${p.media.images[0]}`} alt={p.adInfo?.title} />
                    : <div className="home-fl-no-img">No Image</div>}
                  <span className={`home-fl-badge ${p.purpose === "Sell" ? "home-fl-sale" : "home-fl-rent"}`}>
                    {p.purpose === "Sell" ? "For Sale" : "For Rent"}
                  </span>
                </div>
                {/* Body */}
                <div className="home-fl-body">
                  <div className="home-fl-price">{fmtPrice(p.price?.value)}</div>
                  <div className="home-fl-prop-title">{p.adInfo?.title}</div>
                  <div className="home-fl-loc">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {p.location?.city}
                  </div>
                  <div className="home-fl-meta">
                    {p.features?.bedrooms && <span>{p.features.bedrooms} Bed</span>}
                    {p.features?.bathrooms && <span>{p.features.bathrooms} Bath</span>}
                    <span>{p.areaSize?.value} {p.areaSize?.unit}</span>
                  </div>
                  <div className="home-fl-owner">
                    <div className="home-fl-av">{p.contactInfo?.name?.charAt(0)?.toUpperCase() || "O"}</div>
                    <span>{p.contactInfo?.name || "Owner"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="home-fl-bottom">
          <button className="home-fl-btn-full eh-btn" onClick={() => navigate("/properties")}>
            View All Listed Properties
          </button>
        </div>
      </section>

      {/* ================= BROWSE BY CITY ================= */}
      <div style={{ padding: "70px 70px 50px 70px", background: "linear-gradient(135deg, #f0fdf4, #f8fefb, #ffffff)" }}>
        <h2 className="section-heading reveal" style={{ margin: "0 0 24px 0", color: "#000000", fontSize: "2rem", fontWeight: 800 }}>Browse by City</h2>

        {/* Slider track */}
        <div
          ref={citySliderRef}
          onScroll={handleCityScroll}
          style={{
            display: "flex",
            gap: "24px",
            overflowX: "auto",
            scrollBehavior: "smooth",
            paddingBottom: "4px",
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          <style>{`
            [data-city-slider]::-webkit-scrollbar { display: none; }
            .city-dot {
              width: 8px; height: 8px;
              border-radius: 50%;
              background: rgba(12, 11, 11, 0.25);
              border: none;
              cursor: pointer;
              padding: 0;
              transition: background 0.25s, transform 0.2s;
              flex-shrink: 0;
            }
            .city-dot.active {
              background: #08983d;
              transform: scale(1.35);
            }
            .city-dot:hover:not(.active) { background: rgba(255,255,255,0.5); }
          `}</style>

          {cities.map((city) => (
            <div
              key={city.name}
              onClick={() => navigate(`/city/${city.name}`)}
              style={{ ...tileStyle, flexShrink: 0, backgroundImage: `url(${city.image})` }}
              onMouseEnter={(e) => handleHoverEnter(e, city.image)}
              onMouseLeave={(e) => handleHoverLeave(e, city.image)}
            >
              {city.display}
            </div>
          ))}
        </div>

        {/* 4-dot progress indicators */}
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "20px" }}>
          {Array.from({ length: NUM_DOTS }, (_, i) => (
            <button
              key={i}
              className={`city-dot${activeCityDot === i ? ' active' : ''}`}
              onClick={() => scrollToCity(i)}
              title={`Page ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ================= BROWSE BY CATEGORY ================= */}
      <div style={{ padding: "70px 40px", background: "linear-gradient(180deg, #f6fbf9, #ffffff)" }}>
        <h2 className="section-heading reveal" style={{ marginBottom: "12px", fontSize: "2rem", fontWeight: 800, color: "#0f172a" }}>Browse Properties by Category</h2>
        <p className="reveal" style={{ color: "#64748b", fontSize: "15.5px", marginBottom: "36px" }}>Explore our curated collections across all property types</p>

        <div
          className="stagger"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "30px",
          }}
        >
          {categories.map((cat) => (
            <div
              key={cat.slug}
              className="reveal eh-card"
              onClick={() => navigate(`/category/${cat.slug}`)}
              style={{
                position: "relative",
                height: "260px",
                borderRadius: "14px",
                overflow: "hidden",
                cursor: "pointer",
                boxShadow: "0 15px 35px rgba(0,0,0,0.15)",
              }}
            >
              <img
                src={cat.image}
                alt={cat.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transition: "transform 0.6s ease",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0.2))",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  bottom: "20px",
                  left: "20px",
                  color: "#fff",
                }}
              >
                <h3 style={{ fontSize: "24px", margin: 0, color: "#fff" }}>{cat.name}</h3>
                <p style={{ margin: "5px 0 0", fontSize: "14px", color: "#fff" }}>
                  Explore {cat.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= EXPLORE ================= */}
      <div style={{ padding: "70px 50px", background: "linear-gradient(180deg, #f0fdf4, #f8fefb, #ffffff)" }}>
        <h2 className="section-heading reveal" style={{ fontSize: "2rem", fontWeight: 800, color: "#0f172a" }}>Explore More</h2>
        <p className="reveal" style={{ color: "#64748b", marginBottom: "28px", fontSize: "15.5px" }}>Powerful tools to help you make smarter property decisions</p>
        <div className="stagger" style={{ display: "flex", gap: "25px", flexWrap: "wrap" }}>
          <ExploreCard
            title="Installment Calculator"
            icon={<FaCalculator />}
            onClick={() => navigate('/installment-calculator')}
          />
          <ExploreCard
            title="Plot Finder"
            icon={<FaMapMarkerAlt />}
            onClick={() => navigate('/plot-finder')}
          />
          <ExploreCard
            title="Property Trends"
            icon={<FaChartLine />}
            onClick={() => navigate('/property-trends')}
          />
          <ExploreCard
            title="Property Comparison"
            icon={<FaBalanceScale />}
            onClick={() => navigate('/property-comparison')}
          />
        </div>
      </div>

      {/* ================= LATEST NEWS ================= */}
      <div
        id="news-section"
        style={{
          padding: "70px 40px",
          background: "#ffffff",
        }}
      >
        <h2
          className="section-heading reveal"
          style={{
            textAlign: "center",
            marginBottom: "15px",
            fontSize: "2.2rem",
            fontWeight: 800,
            color: "#0f172a",
          }}
        >
          Latest Property News & Insights
        </h2>

        <p
          style={{
            textAlign: "center",
            maxWidth: "700px",
            margin: "0 auto 50px",
            color: "#6b7280",
            fontSize: "16px",
          }}
        >
          Stay updated with real estate market trends, government policies, and
          smart investment tips across Pakistan.
        </p>

        <div
          className="stagger"
          style={{
            display: "flex",
            gap: "30px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {newsData.slice(0, 3).map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>

        {/* VIEW ALL NEWS */}
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <button
            className="eh-btn"
            onClick={() => navigate("/news")}
            style={{
              padding: "13px 32px",
              background: "linear-gradient(135deg, #16a34a, #15803d)",
              color: "#fff",
              border: "none",
              borderRadius: "50px",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: 700,
              boxShadow: "0 4px 16px rgba(22,163,74,0.3)",
            }}
          >
            View All News
          </button>
        </div>
      </div>

      {/* ================= BLOGS TILES ================= */}
      <div id="blogs-section" style={{ padding: "90px 40px", background: "linear-gradient(180deg, #f0fdf4, #f8fefb, #ffffff)" }}>
        <h2 className="section-heading reveal" style={{ textAlign: "center", fontSize: "2.2rem", fontWeight: 800, color: "#000000", marginBottom: "15px" }}>
          Latest Blog Posts
        </h2>
        <p style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto 50px", color: "rgba(5, 5, 5, 0.6)", fontSize: "16px" }}>
          Get valuable insights, tips, and trends from our real estate experts.
        </p>

        <div
          style={{
            display: "flex",
            overflowX: "auto",
            gap: "20px",
            paddingBottom: "10px",
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {blogData.map(blog => (
            <div
              key={blog.id}
              style={{
                flex: "0 0 300px",
                scrollSnapAlign: "start",
                background: "#fff",
                borderRadius: "12px",
                boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                cursor: "pointer",
                transition: "transform 0.3s, box-shadow 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 6px 18px rgba(228, 219, 219, 0.08)";
              }}
            >
              <div style={{ position: "relative" }}>
                <img
                  src={blog.image}
                  alt={blog.title}
                  style={{
                    width: "100%",
                    height: "180px",
                    objectFit: "cover",
                    borderTopLeftRadius: "12px",
                    borderTopRightRadius: "12px",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    top: "10px",
                    left: "10px",
                    background: "#10b981",
                    color: "#fff",
                    fontSize: "12px",
                    fontWeight: "600",
                    padding: "3px 8px",
                    borderRadius: "6px",
                  }}
                >
                  {blog.category}
                </span>
              </div>
              <div style={{ padding: "15px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#111827", marginBottom: "8px" }}>
                  {blog.title}
                </h3>
                <p style={{ fontSize: "14px", color: "#6b7280" }}>{blog.excerpt}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <button
            className="eh-btn"
            onClick={() => navigate("/blogs")}
            style={{
              padding: "13px 32px",
              background: "linear-gradient(135deg, #37b866, #13833c)",
              color: "#e8edea",
              border: "none",
              borderRadius: "50px",
              fontSize: "15px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(74,222,128,0.3)",
            }}
          >
            View All Blogs
          </button>
        </div>
      </div>

      {/* ================= ABOUT US ================= */}
      <div
        id="about-section"
        style={{
          padding: "100px 40px",
          background: "linear-gradient(135deg, #f8fefb, #f0fdf4, #ffffff)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h2
            className="section-heading reveal"
            style={{
              textAlign: "center",
              marginBottom: "20px",
              fontSize: "2.2rem",
              fontWeight: 800,
              color: "#0f172a",
            }}
          >
            About Elite Horizon
          </h2>
          <p className="reveal" style={{ textAlign: "center", color: "#64748b", fontSize: "16px", marginBottom: "60px", maxWidth: "600px", marginLeft: "auto", marginRight: "auto" }}>
            Pakistan's next-generation real estate platform
          </p>

          {/* Stat Counters */}
          <div className="stagger" style={{ display: "flex", justifyContent: "center", gap: "32px", marginBottom: "60px", flexWrap: "wrap" }}>
            {[
              { num: "50K+", label: "Properties Listed", icon: <FaBuilding /> },
              { num: "8+",   label: "Cities Covered",    icon: <FaCity /> },
              { num: "AI",   label: "Powered Insights",  icon: <FaBrain /> },
              { num: "500+", label: "Active Users",      icon: <FaUsers /> },
            ].map((stat, i) => (
              <div key={i} className="reveal eh-card" style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "28px 32px",
                textAlign: "center",
                minWidth: "160px",
                border: "1px solid rgba(22,163,74,0.1)",
                boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
              }}>
                <div style={{ fontSize: "28px", marginBottom: "8px", color: "#16a34a" }}>{stat.icon}</div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#282828", lineHeight: 1 }}>{stat.num}</div>
                <div style={{ fontSize: "13px", color: "#64748b", fontWeight: 500, marginTop: "6px" }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "60px",
              flexWrap: "wrap",
            }}
          >
            {/* IMAGE */}
            <div className="reveal-left" style={{ flex: "0.8" }}>
              <img
                src="https://static.vecteezy.com/system/resources/thumbnails/056/866/633/small/a-modern-house-with-solar-panels-on-the-roof-photo.jpg"
                alt="Elite Horizon Real Estate"
                style={{
                  width: "100%",
                  maxWidth: "420px",
                  borderRadius: "18px",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
                  border: "3px solid rgba(22,163,74,0.15)",
                  transition: "transform 0.4s ease",
                }}
                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
              />
            </div>

            {/* CONTENT */}
            <div className="reveal" style={{ flex: "1.2" }}>
              <h3
                style={{
                  fontSize: "26px",
                  marginBottom: "15px",
                  fontWeight: 800,
                  color: "#16a34a",
                }}
              >
                A Smarter Way to Find Property in Pakistan
              </h3>

              <p
                style={{
                  fontSize: "16px",
                  lineHeight: "1.8",
                  color: "#64748b",
                  marginBottom: "25px",
                }}
              >
                Elite Horizon is a next-generation real estate platform built to
                simplify property discovery across Pakistan. Whether you're buying,
                selling, or researching, we combine data, maps, and insights into one
                seamless experience.
              </p>

              <div style={{ display: "grid", gap: "14px" }}>
                {[
                  "Verified property listings with accurate locations",
                  "City-wise & category-based smart filtering",
                  "Interactive maps for real-time visualization",
                  "Market trends to help you make informed decisions",
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "15px", color: "#334155" }}>
                    <span style={{
                      width: "22px", height: "22px", borderRadius: "50%",
                      background: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "11px", color: "#16a34a", fontWeight: 800, flexShrink: 0,
                    }}>✓</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>



      <Footer />
    </>
  );
}

export default Home;
