import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getCityProperties } from '../services/api';
import {
  FaSearch, FaFilter, FaMapMarkerAlt, FaRulerCombined, FaMoneyBillWave,
  FaCity, FaTimes, FaSortAmountDown, FaBuilding, FaLayerGroup, FaChevronDown,
  FaHome, FaBolt, FaTree, FaRegBookmark, FaBookmark, FaExternalLinkAlt
} from 'react-icons/fa';
import { MdSort } from 'react-icons/md';
import Footer from '../components/Footer';
import './PlotFinder.css';

// ── Constants ────────────────────────────────────────────────────────────────

const CITIES = [
  { name: 'Lahore',      value: 'lahore',      center: [31.5204, 74.3587], zoom: 11 },
  { name: 'Islamabad',   value: 'islamabad',   center: [33.6844, 73.0479], zoom: 11 },
  { name: 'Karachi',     value: 'karachi',     center: [24.8607, 67.0011], zoom: 11 },
  { name: 'Multan',      value: 'multan',      center: [30.1575, 71.5249], zoom: 11 },
  { name: 'Peshawar',    value: 'peshawar',    center: [34.0151, 71.5249], zoom: 11 },
  { name: 'Sialkot',     value: 'sialkot',     center: [32.4945, 74.5229], zoom: 11 },
  { name: 'Faisalabad',  value: 'faisalabad',  center: [31.4504, 73.1350], zoom: 11 },
];

const PLOT_TYPES = ['All', 'Plot', 'Residential Plot', 'Commercial Plot'];

const SIZE_RANGES = [
  { label: 'Any Size',    min: 0,    max: Infinity },
  { label: '≤ 5 Marla',  min: 0,    max: 5   },
  { label: '5 – 10 Marla', min: 5,  max: 10  },
  { label: '10 – 20 Marla', min: 10, max: 20  },
  { label: '1 Kanal+',   min: 20,   max: Infinity },
];

const SORT_OPTIONS = [
  { label: 'Price: Low → High',  key: 'price_asc'  },
  { label: 'Price: High → Low',  key: 'price_desc' },
  { label: 'Size: Small → Large',key: 'area_asc'   },
  { label: 'Size: Large → Small',key: 'area_desc'  },
  { label: 'Newest First',       key: 'default'    },
];

const CATEGORY_CONFIG = {
  Prime:  { color: '#ef4444', bg: '#fef2f2', label: 'Prime' },
  Luxury: { color: '#6366f1', bg: '#eef2ff', label: 'Luxury' },
  Mid:    { color: '#10b981', bg: '#f0fdf4', label: 'Mid-Tier' },
  Budget: { color: '#f59e0b', bg: '#fffbeb', label: 'Budget' },
};

// ── Helper functions ─────────────────────────────────────────────────────────

const fmtPKR = (v) => {
  if (!v || v <= 0) return 'N/A';
  if (v >= 10_000_000) return `Rs ${(v / 10_000_000).toFixed(2)} Cr`;
  if (v >= 100_000)    return `Rs ${(v / 100_000).toFixed(1)} Lac`;
  return `Rs ${v.toLocaleString()}`;
};

const getCategory = (location, city) => {
  const loc  = location?.toLowerCase() || '';
  const c    = city?.toLowerCase() || '';
  if (c === 'lahore') {
    if (loc.includes('dha') || loc.includes('model town') || loc.includes('cantt') || loc.includes('gulberg')) return 'Prime';
    if (loc.includes('bahria') || loc.includes('valencia') || loc.includes('lake city') || loc.includes('johar')) return 'Luxury';
    if (loc.includes('paragon') || loc.includes('eden') || loc.includes('iqbal town') || loc.includes('wapda')) return 'Mid';
    return 'Budget';
  }
  if (c === 'islamabad') {
    if (loc.includes('f-6') || loc.includes('f-7') || loc.includes('e-7') || loc.includes('blue area')) return 'Prime';
    if (loc.includes('f-10') || loc.includes('f-11') || loc.includes('dha') || loc.includes('bahria')) return 'Luxury';
    if (loc.includes('g-10') || loc.includes('g-11') || loc.includes('i-8') || loc.includes('e-11')) return 'Mid';
    return 'Budget';
  }
  if (c === 'karachi') {
    if (loc.includes('clifton') || loc.includes('dha') || loc.includes('phase 8')) return 'Prime';
    if (loc.includes('bahria') || loc.includes('pechs') || loc.includes('gulshan')) return 'Luxury';
    if (loc.includes('nazimabad') || loc.includes('north karachi') || loc.includes('garden')) return 'Mid';
    return 'Budget';
  }
  if (c === 'multan') {
    if (loc.includes('dha') || loc.includes('cantt') || loc.includes('royal orchard')) return 'Prime';
    if (loc.includes('gulgasht') || loc.includes('wapda') || loc.includes('bosan')) return 'Luxury';
    if (loc.includes('new multan') || loc.includes('model')) return 'Mid';
    return 'Budget';
  }
  if (c === 'peshawar') {
    if (loc.includes('hayatabad') || loc.includes('cantt') || loc.includes('askari')) return 'Prime';
    if (loc.includes('university town') || loc.includes('bahria') || loc.includes('ring road')) return 'Luxury';
    if (loc.includes('gulbahar') || loc.includes('dalazak') || loc.includes('regi')) return 'Mid';
    return 'Budget';
  }
  if (c === 'sialkot') {
    if (loc.includes('cantt') || loc.includes('gulshan') || loc.includes('iqbal town')) return 'Prime';
    if (loc.includes('satellite') || loc.includes('green town') || loc.includes('paris road')) return 'Luxury';
    if (loc.includes('sanda') || loc.includes('wazirabad road')) return 'Mid';
    return 'Budget';
  }
  if (c === 'faisalabad') {
    if (loc.includes('gulberg') || loc.includes('canal road') || loc.includes('dha')) return 'Prime';
    if (loc.includes('madina town') || loc.includes('peoples colony') || loc.includes('jinnah')) return 'Luxury';
    if (loc.includes('susan road') || loc.includes('millat road') || loc.includes('d ground')) return 'Mid';
    return 'Budget';
  }
  return 'Budget';
};

// ── Map utility ──────────────────────────────────────────────────────────────

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

function MapSizer() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const t = setTimeout(() => map.invalidateSize(), 300);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

// ── Compact Sidebar Tile (map list) ─────────────────────────────────────────

function PlotTile({ property, saved, onSave, highlight, onHover }) {
  const cat  = getCategory(property.location, property.city);
  const cfg  = CATEGORY_CONFIG[cat];
  const area = parseFloat(property.area) || 0;

  // Short location: first segment before comma
  const shortLoc = property.location?.split(',')[0]?.trim() || property.location || '—';

  return (
    <div
      className={`pf-tile ${highlight ? 'pf-tile--active' : ''}`}
      onMouseEnter={() => onHover?.(property._id)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Left accent bar + icon block */}
      <div className="pf-tile__accent" style={{ background: cfg.color }}>
        <FaLayerGroup className="pf-tile__accent-icon" />
        {area > 0 && <span className="pf-tile__area-num">{area}M</span>}
      </div>

      {/* Center: info */}
      <div className="pf-tile__body">
        <div className="pf-tile__top">
          <span className="pf-tile__badge" style={{ color: cfg.color, borderColor: cfg.color + '40', background: cfg.color + '12' }}>
            {cfg.label}
          </span>
          <button
            className={`pf-tile__save ${saved ? 'pf-tile__save--saved' : ''}`}
            onClick={(e) => { e.stopPropagation(); onSave(property._id); }}
            title={saved ? 'Unsave' : 'Save'}
          >
            {saved ? <FaBookmark /> : <FaRegBookmark />}
          </button>
        </div>

        <h3 className="pf-tile__title">{property.title}</h3>

        <div className="pf-tile__meta">
          <span className="pf-tile__loc">
            <FaMapMarkerAlt className="pf-tile__meta-icon" />
            {shortLoc}
          </span>
          {area > 0 && (
            <span className="pf-tile__size">
              <FaRulerCombined className="pf-tile__meta-icon" />
              {area} Marla
            </span>
          )}
        </div>
      </div>

      {/* Right: price + link */}
      <div className="pf-tile__right">
        <div className="pf-tile__price">{fmtPKR(property.price)}</div>
        {property.page_url && (
          <a
            href={property.page_url}
            target="_blank"
            rel="noopener noreferrer"
            className="pf-tile__link"
            onClick={(e) => e.stopPropagation()}
          >
            View →
          </a>
        )}
      </div>
    </div>
  );
}

// ── Full Plot Card (grid view) ────────────────────────────────────────────────

function PlotCard({ property, saved, onSave, highlight, onHover }) {
  const cat  = getCategory(property.location, property.city);
  const cfg  = CATEGORY_CONFIG[cat];
  const area = parseFloat(property.area) || 0;

  return (
    <div
      className={`pf-plot-card ${highlight ? 'pf-plot-card--highlighted' : ''}`}
      onMouseEnter={() => onHover?.(property._id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div className="pf-plot-card__img-wrap">
        <img
          src={property.image || 'https://via.placeholder.com/300x180?text=Plot'}
          alt={property.title}
          className="pf-plot-card__img"
          onError={(e) => { e.target.src = 'https://via.placeholder.com/300x180?text=Plot'; }}
        />
        <span className="pf-plot-card__badge" style={{ background: cfg.color }}>
          {cfg.label}
        </span>
        <button
          className={`pf-plot-card__save ${saved ? 'pf-plot-card__save--saved' : ''}`}
          onClick={(e) => { e.stopPropagation(); onSave(property._id); }}
        >
          {saved ? <FaBookmark /> : <FaRegBookmark />}
        </button>
      </div>

      <div className="pf-plot-card__body">
        <h3 className="pf-plot-card__title">{property.title}</h3>
        <p className="pf-plot-card__loc">
          <FaMapMarkerAlt className="pf-icon-sm" />
          <span>{property.location}</span>
        </p>

        <div className="pf-plot-card__meta">
          {area > 0 && (
            <span className="pf-meta-pill">
              <FaRulerCombined /> {area} Marla
            </span>
          )}
          <span className="pf-meta-pill">
            <FaLayerGroup /> Plot
          </span>
        </div>

        <div className="pf-plot-card__footer">
          <div className="pf-plot-card__price">{fmtPKR(property.price)}</div>
          {property.page_url && (
            <a
              href={property.page_url}
              target="_blank"
              rel="noopener noreferrer"
              className="pf-plot-card__cta"
              onClick={(e) => e.stopPropagation()}
            >
              View <FaExternalLinkAlt className="pf-icon-xs" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}


// ── Main Component ───────────────────────────────────────────────────────────

export default function PlotFinder() {
  const [city, setCity]             = useState(CITIES[0]);
  const [allProps, setAllProps]     = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  // Filters
  const [search, setSearch]         = useState('');
  const [plotType, setPlotType]     = useState('All');
  const [sizeRange, setSizeRange]   = useState(0);
  const [maxBudget, setMaxBudget]   = useState('');
  const [category, setCategory]     = useState('All');
  const [sortBy, setSortBy]         = useState('default');
  const [showFilters, setShowFilters] = useState(false);

  // UI
  const [hoveredId, setHoveredId]   = useState(null);
  const [savedIds, setSavedIds]     = useState(new Set());
  const [mapView, setMapView]       = useState(true);

  // ── Fetch ────────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setError('');
    setSearch('');
    setSortBy('default');
    getCityProperties(city.value, { type: 'Plot' })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        // Enrich with category
        const enriched = data.map((p) => ({ ...p, category: getCategory(p.location, city.value) }));
        setAllProps(enriched);
        setFiltered(enriched);
      })
      .catch(() => setError('Unable to fetch properties. Please try again.'))
      .finally(() => setLoading(false));
  }, [city]);

  // ── Filter + Sort logic ──────────────────────────────────────────────────
  const applyFilters = useCallback(() => {
    let res = [...allProps];
    const sr = SIZE_RANGES[sizeRange];

    if (search.trim()) {
      const q = search.toLowerCase();
      res = res.filter((p) =>
        p.title?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q)
      );
    }
    if (plotType !== 'All') {
      res = res.filter((p) => p.type?.toLowerCase().includes(plotType.toLowerCase()));
    }
    if (sr.min > 0 || sr.max !== Infinity) {
      res = res.filter((p) => {
        const a = parseFloat(p.area) || 0;
        return a >= sr.min && a <= sr.max;
      });
    }
    if (maxBudget && !isNaN(maxBudget)) {
      res = res.filter((p) => p.price <= parseFloat(maxBudget));
    }
    if (category !== 'All') {
      res = res.filter((p) => p.category === category);
    }

    // Sort
    if (sortBy === 'price_asc')  res.sort((a, b) => a.price - b.price);
    if (sortBy === 'price_desc') res.sort((a, b) => b.price - a.price);
    if (sortBy === 'area_asc')   res.sort((a, b) => parseFloat(a.area) - parseFloat(b.area));
    if (sortBy === 'area_desc')  res.sort((a, b) => parseFloat(b.area) - parseFloat(a.area));

    setFiltered(res);
  }, [allProps, search, plotType, sizeRange, maxBudget, category, sortBy]);

  useEffect(() => { applyFilters(); }, [applyFilters]);

  // ── Stats ────────────────────────────────────────────────────────────────
  const prices = filtered.map((p) => p.price).filter(Boolean);
  const avgPrice = prices.length ? Math.round(prices.reduce((s, p) => s + p, 0) / prices.length) : 0;
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  const catCounts = filtered.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  const toggleSave = (id) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const clearFilters = () => {
    setSearch(''); setPlotType('All'); setSizeRange(0);
    setMaxBudget(''); setCategory('All'); setSortBy('default');
  };

  const hasActiveFilters = plotType !== 'All' || sizeRange !== 0 || maxBudget || category !== 'All';

  return (
    <div className="pf-page">
      {/* ── Hero ── */}
      <div className="pf-hero">
        <div className="pf-hero__inner">
          <div className="pf-hero__badge">
            <FaLayerGroup /> Plot Finder — Pakistan Real Estate
          </div>
          <h1 className="pf-hero__title">
            Find Your <span>Perfect Plot</span>
          </h1>
          <p className="pf-hero__sub">
            Browse verified plots across Lahore, Islamabad, Karachi &amp; Multan.
            Smart filters help you match budget, size, and location — instantly.
          </p>

          {/* City tabs */}
          <div className="pf-city-tabs">
            {CITIES.map((c) => (
              <button
                key={c.value}
                className={`pf-city-tab ${city.value === c.value ? 'active' : ''}`}
                onClick={() => setCity(c)}
              >
                <FaCity /> {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      {!loading && (
        <div className="pf-stats-bar">
          <div className="pf-stats-bar__item">
            <span className="pf-stats-bar__val">{filtered.length}</span>
            <span className="pf-stats-bar__label">Plots Found</span>
          </div>
          <div className="pf-stats-bar__divider" />
          <div className="pf-stats-bar__item">
            <span className="pf-stats-bar__val">{fmtPKR(minPrice)}</span>
            <span className="pf-stats-bar__label">Starting Price</span>
          </div>
          <div className="pf-stats-bar__divider" />
          <div className="pf-stats-bar__item">
            <span className="pf-stats-bar__val">{fmtPKR(avgPrice)}</span>
            <span className="pf-stats-bar__label">Avg Price</span>
          </div>
          <div className="pf-stats-bar__divider" />
          <div className="pf-stats-bar__item">
            <span className="pf-stats-bar__val">{fmtPKR(maxPrice)}</span>
            <span className="pf-stats-bar__label">Highest Price</span>
          </div>
          <div className="pf-stats-bar__divider pf-stats-bar__divider--grow" />
          <div className="pf-stats-bar__actions">
            <button
              className={`pf-view-btn ${!mapView ? 'active' : ''}`}
              onClick={() => setMapView(false)}
            >
              <FaBuilding /> List View
            </button>
            <button
              className={`pf-view-btn ${mapView ? 'active' : ''}`}
              onClick={() => setMapView(true)}
            >
              <FaMapMarkerAlt /> Map View
            </button>
          </div>
        </div>
      )}

      {/* ── Filter Bar ── */}
      <div className="pf-filter-bar">
        {/* Search */}
        <div className="pf-search-wrap">
          <FaSearch className="pf-search-icon" />
          <input
            type="text"
            className="pf-search-input"
            placeholder="Search by name, area, location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="pf-search-clear" onClick={() => setSearch('')}>
              <FaTimes />
            </button>
          )}
        </div>

        {/* Category chips */}
        <div className="pf-cat-chips">
          {['All', 'Prime', 'Luxury', 'Mid', 'Budget'].map((c) => (
            <button
              key={c}
              className={`pf-cat-chip ${category === c ? 'active' : ''}`}
              style={category === c && c !== 'All' ? { background: CATEGORY_CONFIG[c]?.color, borderColor: CATEGORY_CONFIG[c]?.color, color: '#fff' } : {}}
              onClick={() => setCategory(c)}
            >
              {c} {c !== 'All' && catCounts[c] ? `(${catCounts[c]})` : ''}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="pf-sort-wrap">
          <MdSort className="pf-sort-icon" />
          <select className="pf-sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            {SORT_OPTIONS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* More filters toggle */}
        <button
          className={`pf-more-filters-btn ${showFilters ? 'active' : ''} ${hasActiveFilters ? 'has-active' : ''}`}
          onClick={() => setShowFilters((v) => !v)}
        >
          <FaFilter /> Filters {hasActiveFilters ? '●' : ''} <FaChevronDown className={`pf-chevron ${showFilters ? 'open' : ''}`} />
        </button>
      </div>

      {/* ── Advanced Filters Panel ── */}
      {showFilters && (
        <div className="pf-advanced-panel">
          <div className="pf-advanced-inner">
            {/* Plot type */}
            <div className="pf-adv-field">
              <label className="pf-adv-label">Plot Type</label>
              <div className="pf-adv-chips">
                {PLOT_TYPES.map((t) => (
                  <button
                    key={t}
                    className={`pf-adv-chip ${plotType === t ? 'active' : ''}`}
                    onClick={() => setPlotType(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Size range */}
            <div className="pf-adv-field">
              <label className="pf-adv-label">Plot Size</label>
              <div className="pf-adv-chips">
                {SIZE_RANGES.map((sr, i) => (
                  <button
                    key={i}
                    className={`pf-adv-chip ${sizeRange === i ? 'active' : ''}`}
                    onClick={() => setSizeRange(i)}
                  >
                    {sr.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div className="pf-adv-field pf-adv-field--budget">
              <label className="pf-adv-label">Max Budget (PKR)</label>
              <div className="pf-budget-input-wrap">
                <FaMoneyBillWave className="pf-budget-icon" />
                <input
                  type="number"
                  className="pf-budget-input"
                  placeholder="e.g. 15000000"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                />
                {maxBudget && (
                  <span className="pf-budget-formatted">{fmtPKR(parseFloat(maxBudget))}</span>
                )}
              </div>
            </div>

            <button className="pf-clear-btn" onClick={clearFilters}>
              <FaTimes /> Clear All
            </button>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className={`pf-content ${mapView ? 'pf-content--map' : 'pf-content--list'}`}>

        {/* Error */}
        {error && (
          <div className="pf-error-banner">
            <FaTimes /> {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading ? (
          <div className="pf-skeleton-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="pf-skeleton-card">
                <div className="pf-skeleton-img" />
                <div className="pf-skeleton-line pf-skeleton-line--wide" />
                <div className="pf-skeleton-line" />
                <div className="pf-skeleton-line pf-skeleton-line--short" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Map View */}
            {mapView && (
              <div className="pf-map-layout">
                {/* Left: scrollable property list */}
                <div className="pf-map-list">
                  <div className="pf-map-list__header">
                    <span>{filtered.length} plots in {city.name}</span>
                  </div>
                  {filtered.length === 0 ? (
                    <div className="pf-empty">
                      <FaSearch className="pf-empty-icon" />
                      <p>No plots match your filters</p>
                      <button className="pf-clear-btn" onClick={clearFilters}>Clear Filters</button>
                    </div>
                  ) : (
                    <div className="pf-tile-list">
                      {filtered.map((p) => (
                        <PlotTile
                          key={p._id}
                          property={p}
                          saved={savedIds.has(p._id)}
                          onSave={toggleSave}
                          highlight={hoveredId === p._id}
                          onHover={setHoveredId}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Leaflet map */}
                <div className="pf-map-area">
                  <MapContainer
                    center={city.center}
                    zoom={city.zoom}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <MapSizer />
                    <MapController center={city.center} zoom={city.zoom} />
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {filtered.map((p) => {
                      if (!p.lat || !p.lng) return null;
                      const cat = p.category;
                      const cfg = CATEGORY_CONFIG[cat];
                      const isHovered = hoveredId === p._id;
                      return (
                        <CircleMarker
                          key={p._id}
                          center={[p.lat, p.lng]}
                          radius={isHovered ? 11 : 8}
                          fillColor={cfg.color}
                          color="#fff"
                          weight={isHovered ? 3 : 2}
                          fillOpacity={0.92}
                          eventHandlers={{
                            mouseover: () => setHoveredId(p._id),
                            mouseout:  () => setHoveredId(null),
                          }}
                        >
                          <Popup>
                            <div className="pf-map-popup">
                              <div className="pf-map-popup__badge" style={{ background: cfg.color }}>
                                {cfg.label}
                              </div>
                              <div className="pf-map-popup__price">{fmtPKR(p.price)}</div>
                              <div className="pf-map-popup__title">{p.title}</div>
                              <div className="pf-map-popup__meta">
                                <span><FaMapMarkerAlt /> {p.location}</span>
                                {p.area && <span><FaRulerCombined /> {p.area} Marla</span>}
                              </div>
                              {p.page_url && (
                                <a href={p.page_url} target="_blank" rel="noopener noreferrer" className="pf-map-popup__link">
                                  View Details →
                                </a>
                              )}
                            </div>
                          </Popup>
                        </CircleMarker>
                      );
                    })}
                  </MapContainer>

                  {/* Map legend */}
                  <div className="pf-map-legend">
                    <div className="pf-map-legend__title">Price Tier</div>
                    {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                      <div key={key} className="pf-map-legend__row">
                        <span className="pf-map-legend__dot" style={{ background: cfg.color }} />
                        <span>{cfg.label}</span>
                        {catCounts[key] ? <span className="pf-map-legend__count">{catCounts[key]}</span> : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Grid / List View */}
            {!mapView && (
              <>
                {filtered.length === 0 ? (
                  <div className="pf-empty pf-empty--center">
                    <FaSearch className="pf-empty-icon" />
                    <p>No plots match your filters</p>
                    <button className="pf-clear-btn" onClick={clearFilters}>Clear Filters</button>
                  </div>
                ) : (
                  <div className="pf-grid">
                    {filtered.map((p) => (
                      <PlotCard
                        key={p._id}
                        property={p}
                        saved={savedIds.has(p._id)}
                        onSave={toggleSave}
                        highlight={false}
                        onHover={() => {}}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
