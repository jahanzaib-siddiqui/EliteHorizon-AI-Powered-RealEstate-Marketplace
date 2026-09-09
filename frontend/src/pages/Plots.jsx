import React, { useState, useEffect } from "react";
import { searchProperties } from "../services/api";
import PropertyCard from "../components/PropertyCard";
import CityMap from "../components/CityMap";
import "./filters.css"; // We will add specific classes here or in a separate file

function Plots() {
  // ---- State Data ----
  const [allProperties, setAllProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  // ---- Filter States (Global) ----
  const [purpose, setPurpose] = useState("BUY"); // BUY vs RENT
  const [category, setCategory] = useState("ALL PROPERTIES");
  const [size, setSize] = useState("ALL SIZES");

  // ---- Pagination State per City ----
  const [pageState, setPageState] = useState({
    "Lahore": 0,
    "Islamabad": 0,
    "Karachi": 0,
    "Multan": 0,
    "Peshawar": 0,
    "Sialkot": 0,
    "Faisalabad": 0
  });

  // Target Cities list for rendering
  const targetCities = ["Lahore", "Islamabad", "Karachi", "Multan", "Peshawar", "Sialkot", "Faisalabad"];

  // City Coordinates for map bounding
  const cityCoordinates = {
    "Lahore":     [31.5204, 74.3587],
    "Islamabad":  [33.6844, 73.0479],
    "Karachi":    [24.8607, 67.0011],
    "Multan":     [30.1575, 71.5249],
    "Peshawar":   [34.0151, 71.5249],
    "Sialkot":    [32.4945, 74.5229],
    "Faisalabad": [31.4504, 73.1350]
  };

  // ---- Constants ----
  const purposes = ["BUY"]; // Plots are primarily for sale
  const categories = ["ALL PROPERTIES", "RESIDENTIAL PLOTS", "COMMERCIAL PLOTS", "AGRICULTURAL LAND", "INDUSTRIAL LAND"];
  const sizes = ["ALL SIZES", "5 MARLA", "10 MARLA", "1 KANAL"];

  // Fetch properties whenever purpose changes
  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        // Fetch a targeted payload for plots matching purpose
        // Increasing limit to 3000 to ensure we get properties for multiple cities
        const { data } = await searchProperties({ type: "Plot", purpose: purpose, limit: 3000 });
        setAllProperties(data);
        applyFilters(data, purpose, category, size);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch properties:", err);
        setLoading(false);
      }
    };
    fetchProperties();
  }, [purpose]);

  // Re-run filtering whenever a global filter state changes (reset pagination when filter changes)
  useEffect(() => {
    if (allProperties.length > 0) {
      applyFilters(allProperties, purpose, category, size);

      // Reset all paginations to 0 when filters change so users don't get stuck on empty pages
      setPageState({
        "Lahore": 0,
        "Islamabad": 0,
        "Karachi": 0,
        "Multan": 0
      });
    }
  }, [purpose, category, size]);

  // ---- Filtering Logic ----
  const applyFilters = (data, currPurpose, currCategory, currSize) => {
    let result = [...data];

    // 1. Purpose
    if (currPurpose && currPurpose !== "ALL") {
      result = result.filter(p => typeof p.purpose === "string" && p.purpose.toLowerCase() === currPurpose.toLowerCase());
    }

    // DB structural filter to strictly ensure only Plot properties are shown
    result = result.filter(p => p.type === "Plot");

    // 4. Size Filter (DB stores as integers representing Marlas, e.g., 5, 10, 20)
    if (currSize !== "ALL SIZES") {
      const sizeMapping = {
        "5 MARLA": 5,
        "10 MARLA": 10,
        "1 KANAL": 20 // 1 Kanal = 20 Marla
      };
      result = result.filter(p => String(p.area) === String(sizeMapping[currSize]));
    }

    // 5. Category (Plot Types) 
    // Since the database primarily stores them as generically "Plot", 
    // we use a deterministic assignment based on their ID length/characters to simulate 
    // these subtypes for demonstration, OR checking the title/description if it actually exists.
    if (currCategory !== "ALL PROPERTIES") {
      result = result.filter(p => {
        // Look for explicit matches in the title first
        if (p.title?.toUpperCase().includes(currCategory)) return true;

        // Fallback: Deterministic mock category assignment based on string ID for seeded data
        const cats = ["RESIDENTIAL PLOTS", "COMMERCIAL PLOTS", "AGRICULTURAL LAND", "INDUSTRIAL LAND"];
        const idStr = p._id ? p._id.toString() : "";
        let hash = 0;
        for (let i = 0; i < idStr.length; i++) {
          hash += idStr.charCodeAt(i);
        }
        const mockCategory = cats[hash % cats.length];

        return mockCategory === currCategory;
      });
    }

    setFilteredProperties(result);
  };

  // Helper function to paginate the arrays per city
  const paginate = (array, page_size, page_number) => {
    return array.slice(page_number * page_size, (page_number + 1) * page_size);
  };

  const handleNextPage = (cityName, totalPages) => {
    setPageState(prev => {
      if (prev[cityName] < totalPages - 1) {
        return { ...prev, [cityName]: prev[cityName] + 1 };
      }
      return prev;
    });
  };

  const handlePrevPage = (cityName) => {
    setPageState(prev => {
      if (prev[cityName] > 0) {
        return { ...prev, [cityName]: prev[cityName] - 1 };
      }
      return prev;
    });
  };

  // Color mapping logic natively embedded in CityMap now

  return (
    <div className="commercial-page-wrapper houses-page-wrapper plots-page-wrapper">
      {/* ---- Top Filter Header ---- */}
      <div className="filter-header-section">

        {/* Buy / Rent Switch */}
        <div className="pill-group large-pill center-pill">
          {purposes.map(p => (
            <button
              key={p}
              className={`pill-btn ${purpose === p ? "active" : ""}`}
              onClick={() => setPurpose(p)}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Row: Category & Size */}
        <div className="filter-row" style={{ marginTop: '20px' }}>
          <div className="filter-block">
            <span className="filter-label">Category:</span>
            <div className="pill-group">
              {categories.map(c => (
                <button
                  key={c}
                  className={`pill-btn text-xs ${category === c ? "active" : ""}`}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-block">
            <span className="filter-label">Size:</span>
            <div className="pill-group">
              {sizes.map(s => (
                <button
                  key={s}
                  className={`pill-btn text-xs ${size === s ? "active" : ""}`}
                  onClick={() => setSize(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ---- Main Content Areas (Mapped Over Cities) ---- */}
      <div className="properties-display-container">
        {loading ? (
          <div className="loading-spinner">Loading properties...</div>
        ) : (
          targetCities.map((cityName) => {
            // Filter global array to just this city
            const cityProperties = filteredProperties.filter(
              p => p.city?.toLowerCase() === cityName.toLowerCase()
            );

            // Pagination calculation for 12 items per slice
            const itemsPerPage = 12;
            const totalPages = Math.ceil(cityProperties.length / itemsPerPage);
            const currentPage = pageState[cityName] || 0;

            // Extract the slice of 12 for the current page
            const paginatedHouseSlice = paginate(cityProperties, itemsPerPage, currentPage);

            // Enrich properties with precision Category tags matching CityMap.jsx logic
            const enrichedCityProperties = cityProperties.map(p => {
              // We need to resolve what category it actually belongs to for the Marker color
              const cats = ["RESIDENTIAL PLOTS", "COMMERCIAL PLOTS", "AGRICULTURAL LAND", "INDUSTRIAL LAND"];
              const idStr = p._id ? p._id.toString() : "";
              let hash = 0;
              for (let i = 0; i < idStr.length; i++) {
                hash += idStr.charCodeAt(i);
              }
              const mockCategory = cats[hash % cats.length];

              // Map Plot types to generic map color categories (to reuse CityMap logic)
              let mapCat = "Budget"; // Default Yellow (Agricultural)
              if (mockCategory === "INDUSTRIAL LAND") mapCat = "Prime"; // Red
              else if (mockCategory === "COMMERCIAL PLOTS") mapCat = "Luxury"; // Blue
              else if (mockCategory === "RESIDENTIAL PLOTS") mapCat = "Mid"; // Green

              return { ...p, category: mapCat, plotType: mockCategory };
            });

            // Fetch coordinates for the city map container
            const centerCoordinates = cityCoordinates[cityName] || [31.5204, 74.3587]; // fallback Lahore

            return (
              <div key={cityName} className="city-portal-section">

                {/* City Heading */}
                <div className="city-header-box">
                  <h2 className="city-portal-title">{cityName}</h2>
                  <span className="city-meta-data">{cityProperties.length} Plots Available</span>
                </div>

                {/* City Map Implementation */}
                <div className="city-map-container">
                  <CityMap
                    properties={enrichedCityProperties}
                    center={centerCoordinates}
                    style={{ height: '350px', width: '100%', borderRadius: '12px', zIndex: 1 }}
                  />
                </div>

                {/* Grid View & Pagination Controls */}
                <div className="grid-pagination-wrapper">
                  {cityProperties.length > 0 ? (
                    <>
                      <div className="responsive-property-grid">
                        {paginatedHouseSlice.map(property => (
                          <PropertyCard
                            key={property._id}
                            title={property.title}
                            location={property.location + ", " + property.city}
                            price={property.purpose === "Rent"
                              ? (property.rentPrice || property.price || 0)
                              : property.price}
                            type={property.type}
                            image={property.image}
                            page_url={property.page_url}
                            style={{ width: "100%", minWidth: "auto", margin: 0 }}
                          />
                        ))}
                      </div>

                      {/* Pagination Arrows */}
                      {totalPages > 1 && (
                        <div className="city-pagination-controls">
                          <button
                            className="page-nav-btn"
                            onClick={() => handlePrevPage(cityName)}
                            disabled={currentPage === 0}
                          >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                          </button>

                          <span className="page-indicator">
                            Page {currentPage + 1} of {totalPages}
                          </span>

                          <button
                            className="page-nav-btn"
                            onClick={() => handleNextPage(cityName, totalPages)}
                            disabled={currentPage === totalPages - 1}
                          >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="no-results-box" style={{ padding: '40px', marginTop: '20px' }}>
                      <h3>No properties match your filter in {cityName}</h3>
                    </div>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Plots;
