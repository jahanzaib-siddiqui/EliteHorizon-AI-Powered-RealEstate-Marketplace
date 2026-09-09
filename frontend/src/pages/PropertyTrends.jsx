import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, BarChart, Bar, Legend,
} from 'recharts';
import { FaChevronDown, FaChevronUp, FaMapMarkerAlt, FaSearch, FaBuilding, FaHome, FaLayerGroup, FaCity } from 'react-icons/fa';
import './PropertyTrends.css';

const ALL_CITIES = [
  'Lahore', 'Islamabad', 'Karachi', 'Multan', 'Peshawar', 'Sialkot', 'Faisalabad',
];

const faqs = [
  { q: "What are real estate trends in Pakistan?", a: "Real estate trends indicate the direction of property prices, demand, and supply in various cities and societies across the country." },
  { q: "How can Elite Trends help me stay up-to-date on real estate trends?", a: "Elite Trends provides real-time data, location-level breakdowns, and historical price graphs to inform your investment decisions." },
  { q: "What types of properties does Elite Trends cover?", a: "We cover Houses, Commercial properties, and Plots across all 7 major Pakistani cities." },
  { q: "Can I access Elite Trends for free?", a: "Yes, all data and analytical tools provided in the Elite Trends dashboard are completely free for our users." },
  { q: "How frequently is the data updated?", a: "Our metrics are derived from live property data in our database and reflect the current market composition." },
  { q: "Which city is best for property investment in Pakistan?", a: "Lahore and Islamabad show consistent high-yield growth. Karachi offers strong commercial potential. Faisalabad and Sialkot are emerging markets with competitive pricing." },
];

const FAQItem = ({ faq, isOpen, onClick }) => (
  <div className={`faq-item ${isOpen ? 'open' : ''}`}>
    <div className="faq-question" onClick={onClick}>
      <span>{faq.q}</span>
      {isOpen ? <FaChevronUp className="faq-icon" /> : <FaChevronDown className="faq-icon" />}
    </div>
    {isOpen && <div className="faq-answer"><br />{faq.a}</div>}
  </div>
);

// ── Custom Tooltip for area chart ─────────────────────────────────────────────
const PriceTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  const fmt = v >= 10000000 ? `${(v / 10000000).toFixed(2)} Cr`
    : v >= 100000 ? `${(v / 100000).toFixed(1)} Lac`
    : v?.toLocaleString();
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px',
      padding: '10px 16px', boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
    }}>
      <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>PKR {fmt}</p>
      <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>{label}</p>
    </div>
  );
};

// ── Stat card at top ──────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color }) => (
  <div style={{
    background: '#fff', borderRadius: '14px', padding: '20px 24px',
    border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '160px',
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: '12px',
      background: color + '18', display: 'flex', alignItems: 'center',
      justifyContent: 'center', color, fontSize: '18px', flexShrink: 0,
    }}>{icon}</div>
    <div>
      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>{label}</div>
    </div>
  </div>
);

function PropertyTrends() {
  const [city,     setCity]     = useState('Lahore');
  const [propType, setPropType] = useState('House');
  const [areaSize, setAreaSize] = useState('5 Marla');
  const [period,   setPeriod]   = useState('1 Year');

  const [openFaqIndex,      setOpenFaqIndex]      = useState(null);
  const [selectedLocation,  setSelectedLocation]  = useState(null);
  const [trendingLocations, setTrendingLocations] = useState([]);
  const [searchedHouses,    setSearchedHouses]    = useState([]);
  const [searchedComm,      setSearchedComm]      = useState([]);
  const [searchedPlots,     setSearchedPlots]     = useState([]);
  const [isLoading,         setIsLoading]         = useState(true);
  const [cityStats,         setCityStats]         = useState({ houses: 0, commercial: 0, plots: 0, total: 0 });

  // Fetch real trends data from backend
  const fetchTrends = useCallback(async () => {
    setIsLoading(true);
    try {
      const [trendsRes, statsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/properties/trends?city=${city}`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/properties/search?city=${city.toLowerCase()}&limit=1000`),
      ]);

      const data = trendsRes.data;
      setTrendingLocations(data.trendingLocations || []);
      setSearchedHouses(data.searchedHouses || []);
      setSearchedComm(data.searchedCommercialProps || []);
      setSearchedPlots(data.searchedResPlots || []);

      // Compute live city stats from search endpoint
      const props = statsRes.data || [];
      setCityStats({
        houses:     props.filter(p => p.type === 'House').length,
        commercial: props.filter(p => p.type === 'Commercial').length,
        plots:      props.filter(p => p.type === 'Plot').length,
        total:      props.length,
      });
    } catch (err) {
      console.error("Error fetching property trends:", err);
    } finally {
      setIsLoading(false);
    }
  }, [city]);

  useEffect(() => { fetchTrends(); }, [fetchTrends]);

  const formatPrice = (v) => {
    if (!v) return '0';
    if (v >= 10000000) return `${(v / 10000000).toFixed(1)} Cr`;
    if (v >= 100000)   return `${(v / 100000).toFixed(0)} Lac`;
    return v.toLocaleString();
  };

  // Build a city-comparison bar chart dataset from trendingLocations
  const cityCompareData = trendingLocations.slice(0, 8).map(loc => ({
    name: loc.name.length > 15 ? loc.name.slice(0, 14) + '…' : loc.name,
    count: loc.searchPct,
  }));

  // Table section renderer
  const renderTable = (data, key) => (
    <div className="search-table">
      <div className="search-table-header">
        <div>Rank</div>
        <div>Location</div>
        <div>Trend</div>
        <div>Activity</div>
      </div>
      {data.length === 0 && (
        <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
          No data for {city} — try another city.
        </div>
      )}
      {data.map(loc => {
        const sparkColor = '#0f7c5c';
        const maxCount   = Math.max(...data.map(l => l.searchPct), 1);
        return (
          <div
            className={`search-table-row rank-${loc.rank}`}
            key={`${key}-${loc.id}`}
            onClick={() => setSelectedLocation(loc)}
          >
            <div className="rank-col">
              <div className="rank-number">{loc.rank}</div>
            </div>
            <div className="location-col">
              <span className="loc-title">{loc.name}</span>
              <span className="loc-city">{loc.city}</span>
            </div>
            <div className="trend-col">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={loc.sparklineData}>
                  <Line type="monotone" dataKey="value" stroke={sparkColor} strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="search-pct-col">
              <span className="pct-text">{loc.searchPct} listings</span>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${Math.min((loc.searchPct / maxCount) * 100, 100)}%` }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="trends-container">
      {/* Header */}
      <div className="trends-header">
        <h1>Elite Trends</h1>
        <p>Discover real estate insights and property search popularity across Pakistan.</p>
      </div>

      {/* ── FILTER BAR ── */}
      <div className="filter-bar">
        <div className="filter-group">
          <label>City</label>
          <select className="filter-select" value={city} onChange={e => setCity(e.target.value)}>
            {ALL_CITIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Property Type</label>
          <select className="filter-select" value={propType} onChange={e => setPropType(e.target.value)}>
            <option>House</option>
            <option>Plot</option>
            <option>Commercial</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Area Size</label>
          <select className="filter-select" value={areaSize} onChange={e => setAreaSize(e.target.value)}>
            <option>3 Marla</option>
            <option>5 Marla</option>
            <option>10 Marla</option>
            <option>1 Kanal</option>
            <option>2 Kanal</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Time Period</label>
          <select className="filter-select" value={period} onChange={e => setPeriod(e.target.value)}>
            <option>6 Months</option>
            <option>1 Year</option>
            <option>3 Years</option>
            <option>5 Years</option>
          </select>
        </div>
        <div className="filter-group" style={{ justifyContent: 'flex-end' }}>
          <label style={{ opacity: 0 }}>.</label>
          <button
            onClick={fetchTrends}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              color: '#fff', border: 'none', borderRadius: '10px',
              padding: '12px 22px', fontWeight: 700, fontSize: '14px',
              cursor: 'pointer', boxShadow: '0 4px 14px rgba(22,163,74,0.35)',
            }}
          >
            <FaSearch />
            Update
          </button>
        </div>
      </div>

      {/* ── LIVE CITY STAT CARDS ── */}
      {!isLoading && (
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '30px' }}>
          <StatCard icon={<FaCity />}      label={`Total Properties in ${city}`} value={cityStats.total.toLocaleString()}      color="#6366f1" />
          <StatCard icon={<FaHome />}      label="Houses"      value={cityStats.houses.toLocaleString()}     color="#0f7c5c" />
          <StatCard icon={<FaBuilding />}  label="Commercial"  value={cityStats.commercial.toLocaleString()} color="#0ea5e9" />
          <StatCard icon={<FaLayerGroup />} label="Plots"      value={cityStats.plots.toLocaleString()}      color="#f59e0b" />
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>Loading trends…</div>
        </div>
      ) : (
        <>
          {/* ── TOP TRENDING LOCATIONS (CAROUSEL) ── */}
          <div className="top-trending-section">
            <div className="trending-section-header">
              <h2>Top Trending Locations in {city}</h2>
            </div>

            {trendingLocations.length === 0 ? (
              <p style={{ color: '#94a3b8', padding: '20px 0' }}>No data available for {city}.</p>
            ) : (
              <div className="carousel-container">
                {trendingLocations.map(loc => (
                  <div
                    className={`trending-card rank-${loc.rank}`}
                    key={`trending-${loc.id}`}
                    onClick={() => setSelectedLocation(loc)}
                  >
                    <div className="card-header">
                      <div className="card-rank">{loc.rank}</div>
                      <div className="card-title">
                        <span className="card-name">{loc.name}</span>
                        <span className="card-city">in {loc.city}</span>
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="card-stats">
                        <span className="card-pct">{loc.searchPct}</span>
                        <span className="card-pct-label">listings</span>
                      </div>
                      <div className="card-sparkline">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={loc.sparklineData}>
                            <Line type="monotone" dataKey="value" stroke="#0f7c5c" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── LOCATION ACTIVITY BAR CHART (horizontal — labels on Y-axis, no overlap) ── */}
          {cityCompareData.length > 0 && (
            <div style={{
              background: '#fff', borderRadius: '16px', padding: '28px 28px 24px',
              border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              marginBottom: '30px',
            }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', marginBottom: '24px' }}>
                Location Activity in {city}
              </h2>
              <ResponsiveContainer width="100%" height={cityCompareData.length * 48 + 20}>
                <BarChart
                  layout="vertical"
                  data={cityCompareData}
                  margin={{ top: 4, right: 60, left: 0, bottom: 4 }}
                  barCategoryGap="30%"
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis
                    type="number"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={185}
                    tick={{ fill: '#334155', fontSize: 12.5, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => v.length > 24 ? v.slice(0, 23) + '…' : v}
                  />
                  <RechartsTooltip
                    cursor={{ fill: '#f0fdf4' }}
                    contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    formatter={(v, _n, p) => [v + ' listings', p.payload.name]}
                  />
                  <Bar
                    dataKey="count"
                    fill="#16a34a"
                    radius={[0, 6, 6, 0]}
                    maxBarSize={26}
                    label={{ position: 'right', fill: '#64748b', fontSize: 12, formatter: v => v }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── MOST SEARCHED HOUSES ── */}
          <div className="most-searched-section">
            <h3>Most Active Locations — Houses</h3>
            {renderTable(searchedHouses, 'house')}
          </div>

          {/* ── MOST SEARCHED COMMERCIAL ── */}
          <div className="most-searched-section">
            <h3>Most Active Locations — Commercial</h3>
            {renderTable(searchedComm, 'comm')}
          </div>

          {/* ── MOST SEARCHED PLOTS ── */}
          <div className="most-searched-section">
            <h3>Most Active Locations — Plots</h3>
            {renderTable(searchedPlots, 'plot')}
          </div>
        </>
      )}

      {/* ── ABOUT & FAQ ── */}
      <div className="about-trends-section">
        <h2>About Elite Trends</h2>
        <p className="about-text">
          Discover the latest real estate insights and trends in Pakistan's property market with Elite Trends.
          Our comprehensive platform offers in-depth analysis and data on the popularity of properties in
          different cities and societies across the country, including buying trends for houses, plots, and
          commercial properties. With Elite Trends, you can stay up-to-date with market activity,
          making it an essential tool for anyone looking to invest in Pakistan's thriving real estate market.
        </p>
        <h2>Frequently Asked Questions (FAQs)</h2>
        <div className="faq-container">
          {faqs.map((faq, i) => (
            <FAQItem key={i} faq={faq} isOpen={openFaqIndex === i} onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)} />
          ))}
        </div>
      </div>

      {/* ── MODAL OVERLAY ── */}
      {selectedLocation && (
        <div className="trend-modal-overlay" onClick={() => setSelectedLocation(null)}>
          <div className="trend-modal-content" onClick={e => e.stopPropagation()}>
            <button className="trend-modal-close" onClick={() => setSelectedLocation(null)}>&times;</button>
            <div className="trend-modal-header">
              <h3>
                <FaMapMarkerAlt style={{ marginRight: '8px', color: '#16a34a' }} />
                {selectedLocation.name}
                <span> in {selectedLocation.city}</span>
              </h3>
              <div className="trend-modal-stats">
                <span className="modal-pct">{selectedLocation.searchPct} <small>listings</small></span>
                <span className="modal-status positive">Active Market</span>
              </div>
            </div>

            <div className="trend-modal-graph">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={selectedLocation.fullGraphData}
                  margin={{ top: 20, right: 30, left: 40, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="modalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="month"
                    stroke="#a0aec0"
                    tick={{ fill: '#718096', fontSize: 12 }}
                    tickMargin={10} axisLine={false} tickLine={false}
                  />
                  <YAxis
                    tickFormatter={formatPrice}
                    stroke="#a0aec0"
                    tick={{ fill: '#718096', fontSize: 12 }}
                    axisLine={false} tickLine={false}
                    width={70}
                  />
                  <RechartsTooltip content={<PriceTooltip />} />
                  <Area
                    type="monotone" dataKey="price"
                    stroke="#16a34a" strokeWidth={3}
                    fillOpacity={1} fill="url(#modalGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="trend-modal-footer">
              <p>
                Price trend for <strong>{selectedLocation.name}</strong> in {selectedLocation.city} based on live property data in our database.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PropertyTrends;
