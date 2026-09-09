import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import { FaSearch, FaCheck, FaTimes, FaTrashAlt, FaPlus, FaBalanceScale } from "react-icons/fa";
import "./PropertyComparison.css";

const API = import.meta.env.VITE_API_URL;

function PropertyComparison() {
  const navigate = useNavigate();
  const [allProperties, setAllProperties] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProps, setSelectedProps] = useState([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  // Fetch a batch of verified properties to allow searching
  useEffect(() => {
    fetch(`${API}/api/seller/listings?limit=100`)
      .then((res) => res.json())
      .then((data) => {
        setAllProperties(data.listings || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch properties:", err);
        setLoading(false);
      });
  }, []);

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtering properties
  const filteredProps = allProperties.filter((p) => {
    const title = p.adInfo?.title?.toLowerCase() || "";
    const loc = p.location?.address?.toLowerCase() || "";
    const city = p.location?.city?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    return (title.includes(query) || loc.includes(query) || city.includes(query)) &&
      !selectedProps.find((sp) => sp._id === p._id);
  });

  const handleSelectProperty = (property) => {
    if (selectedProps.length >= 4) {
      alert("You can compare up to 4 properties at a time.");
      return;
    }
    setSelectedProps([...selectedProps, property]);
    setSearchQuery("");
    setShowDropdown(false);
  };

  const handleRemoveProperty = (id) => {
    setSelectedProps(selectedProps.filter((p) => p._id !== id));
  };

  const fmtPrice = (v) => {
    if (!v) return "N/A";
    if (v >= 10000000) return `PKR ${(v / 10000000).toFixed(2)} Crore`;
    if (v >= 100000) return `PKR ${(v / 100000).toFixed(1)} Lac`;
    return `PKR ${v.toLocaleString()}`;
  };

  // Compile unique list of amenities present in at least ONE of the selected properties
  const allAmenities = Array.from(
    new Set(
      selectedProps.flatMap((p) => p.features?.amenities || [])
    )
  ).sort();

  return (
    <>
      <div className="pc-container warp-layout">
        
        {/* Header Section */}
        <div className="pc-header-section">
          <div className="pc-badge"><FaBalanceScale /> Property Comparison</div>
          <h1 className="pc-main-title">Compare Properties</h1>
          <p className="pc-sub-title">
            Analyze pricing, features, and amenities side-by-side to find the perfect match for you.
          </p>

          {/* Search Bar */}
          <div className="pc-search-wrapper" ref={dropdownRef}>
            <div className="pc-search-input-box">
              <FaSearch className="pc-search-icon" />
              <input
                type="text"
                placeholder={selectedProps.length >= 4 ? "Comparison limit reached (4/4)" : "Search by title, location, or city..."}
                value={searchQuery}
                disabled={selectedProps.length >= 4}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
              />
            </div>
            
            {showDropdown && searchQuery.length > 0 && (
              <div className="pc-dropdown">
                {filteredProps.length > 0 ? (
                  filteredProps.slice(0, 6).map((p) => (
                    <div
                      key={p._id}
                      className="pc-dropdown-item"
                      onClick={() => handleSelectProperty(p)}
                    >
                      <div className="pc-di-img">
                        {p.media?.images?.[0] ? (
                          <img src={`${API}${p.media.images[0]}`} alt="" />
                        ) : (
                          <div className="pc-di-placeholder">No Img</div>
                        )}
                      </div>
                      <div className="pc-di-info">
                        <h4>{p.adInfo?.title}</h4>
                        <p>{p.location?.city} • {fmtPrice(p.price?.value)}</p>
                      </div>
                      <div className="pc-di-add"><FaPlus /> Add</div>
                    </div>
                  ))
                ) : (
                  <div className="pc-dropdown-empty">No properties found.</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Comparison Table */}
        <div className="pc-content">
          {loading ? (
            <div className="pc-loading">
              <div className="pc-spinner"></div>
              <p>Loading properties data...</p>
            </div>
          ) : selectedProps.length === 0 ? (
            <div className="pc-empty-state">
              <div className="pc-empty-icon"><FaBalanceScale size={50} color="#cbd5e1"/></div>
              <h3>No Properties Selected</h3>
              <p>Use the search bar above to add properties and start comparing features.</p>
            </div>
          ) : (
            <div className="pc-table-wrapper">
              <table className="pc-table">
                <tbody>
                  
                  {/* Row 1: Images & Actions */}
                  <tr>
                    <th className="pc-row-heading">Property</th>
                    {selectedProps.map((p) => (
                      <td key={p._id} className="pc-td-header">
                        <button className="pc-remove-btn" onClick={() => handleRemoveProperty(p._id)}>
                          <FaTimes />
                        </button>
                        <div 
                           className="pc-prop-img" 
                           onClick={() => navigate(`/properties/${p._id}`)}
                           title="Click to view details"
                        >
                          {p.media?.images?.[0] ? (
                            <img src={`${API}${p.media.images[0]}`} alt="" />
                          ) : (
                            <div className="pc-img-fallback">No Image</div>
                          )}
                          <span className={`pc-purpose-badge ${p.purpose === "Sell" ? "bg-sale" : "bg-rent"}`}>
                            {p.purpose === "Sell" ? "For Sale" : "For Rent"}
                          </span>
                        </div>
                        <h3 className="pc-prop-title" onClick={() => navigate(`/properties/${p._id}`)}>
                          {p.adInfo?.title}
                        </h3>
                      </td>
                    ))}
                    {/* Fill empty slots visually */}
                    {[...Array(4 - selectedProps.length)].map((_, i) => (
                      <td key={`empty-hdr-${i}`} className="pc-td-empty">
                        <div className="pc-empty-slot">
                          <FaPlus color="#94a3b8" size={24}/>
                          <span>Add Property</span>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Pricing */}
                  <tr>
                    <th className="pc-row-heading">Price</th>
                    {selectedProps.map((p) => (
                      <td key={`price-${p._id}`} className="pc-td-price">
                        {fmtPrice(p.price?.value)}
                      </td>
                    ))}
                     {[...Array(4 - selectedProps.length)].map((_, i) => <td key={`emp-price-${i}`}></td>)}
                  </tr>

                  {/* Location */}
                  <tr>
                    <th className="pc-row-heading">Location</th>
                    {selectedProps.map((p) => (
                      <td key={`loc-${p._id}`} className="pc-td-val">
                        <span className="pc-val-bold">{p.location?.city}</span>
                        <div className="pc-val-sub">{p.location?.address}</div>
                      </td>
                    ))}
                     {[...Array(4 - selectedProps.length)].map((_, i) => <td key={`emp-loc-${i}`}></td>)}
                  </tr>

                  {/* Type */}
                  <tr>
                    <th className="pc-row-heading">Type</th>
                    {selectedProps.map((p) => (
                      <td key={`type-${p._id}`} className="pc-td-val">
                        {p.propertyType?.subCategory} 
                        <div className="pc-val-sub">{p.propertyType?.category}</div>
                      </td>
                    ))}
                     {[...Array(4 - selectedProps.length)].map((_, i) => <td key={`emp-type-${i}`}></td>)}
                  </tr>

                  {/* Area */}
                  <tr>
                    <th className="pc-row-heading">Area Size</th>
                    {selectedProps.map((p) => (
                      <td key={`area-${p._id}`} className="pc-td-val">
                        <span className="pc-val-highlight">{p.areaSize?.value} {p.areaSize?.unit}</span>
                      </td>
                    ))}
                     {[...Array(4 - selectedProps.length)].map((_, i) => <td key={`emp-area-${i}`}></td>)}
                  </tr>

                  {/* Bedrooms */}
                  <tr>
                    <th className="pc-row-heading">Bedrooms</th>
                    {selectedProps.map((p) => (
                      <td key={`bed-${p._id}`} className="pc-td-val center">
                        {p.features?.bedrooms || "—"}
                      </td>
                    ))}
                     {[...Array(4 - selectedProps.length)].map((_, i) => <td key={`emp-bed-${i}`}></td>)}
                  </tr>

                  {/* Bathrooms */}
                  <tr>
                    <th className="pc-row-heading">Bathrooms</th>
                    {selectedProps.map((p) => (
                      <td key={`bath-${p._id}`} className="pc-td-val center">
                        {p.features?.bathrooms || "—"}
                      </td>
                    ))}
                     {[...Array(4 - selectedProps.length)].map((_, i) => <td key={`emp-bath-${i}`}></td>)}
                  </tr>

                  {/* Construction State */}
                  <tr>
                    <th className="pc-row-heading">Construction</th>
                    {selectedProps.map((p) => (
                      <td key={`const-${p._id}`} className="pc-td-val center">
                        {p.features?.constructionState || "—"}
                      </td>
                    ))}
                     {[...Array(4 - selectedProps.length)].map((_, i) => <td key={`emp-const-${i}`}></td>)}
                  </tr>

                  {/* Furnished */}
                  <tr>
                    <th className="pc-row-heading">Furnished</th>
                    {selectedProps.map((p) => (
                      <td key={`furn-${p._id}`} className="pc-td-val center">
                        {p.features?.furnished || "—"}
                      </td>
                    ))}
                     {[...Array(4 - selectedProps.length)].map((_, i) => <td key={`emp-furn-${i}`}></td>)}
                  </tr>

                  {/* Amenities Header */}
                  {allAmenities.length > 0 && (
                    <tr className="pc-divider-row">
                      <td colSpan={5}>Amenities Comparison</td>
                    </tr>
                  )}

                  {/* Dynamic Amenities Rows */}
                  {allAmenities.map((amenity) => (
                    <tr key={`amenity-${amenity}`}>
                      <th className="pc-row-heading pc-amenity-heading">{amenity}</th>
                      {selectedProps.map((p) => {
                        const hasIt = p.features?.amenities?.includes(amenity);
                        return (
                          <td key={`am-${p._id}-${amenity}`} className="pc-td-val center">
                            {hasIt ? (
                              <FaCheck color="#16a34a" size={18} />
                            ) : (
                              <FaTimes color="#cbd5e1" size={18} />
                            )}
                          </td>
                        );
                      })}
                       {[...Array(4 - selectedProps.length)].map((_, i) => <td key={`emp-am-${amenity}-${i}`}></td>)}
                    </tr>
                  ))}

                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default PropertyComparison;
