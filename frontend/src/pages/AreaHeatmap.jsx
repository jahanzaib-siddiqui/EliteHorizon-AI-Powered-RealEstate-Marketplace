import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  FaMapMarkedAlt, FaFire, FaMapMarkerAlt, FaChartBar,
  FaLayerGroup, FaExclamationTriangle, FaInfoCircle
} from 'react-icons/fa';
import './AreaHeatmap.css';

window.L = L;

const API_URL = import.meta.env.VITE_ML_API_URL;

const CITY_CONFIG = {
  lahore: {
    center: [31.5204, 74.3587],
    zoom: 12,
    label: 'Lahore',
    zones: [
      { name: 'DHA Defence', score: 92 },
      { name: 'Gulberg', score: 88 },
      { name: 'Bahria Town', score: 85 },
      { name: 'Model Town', score: 82 },
      { name: 'Johar Town', score: 78 },
    ],
  },
  islamabad: {
    center: [33.6844, 73.0479],
    zoom: 12,
    label: 'Islamabad',
    zones: [
      { name: 'F-7 / F-6', score: 95 },
      { name: 'E-7 / E-11', score: 90 },
      { name: 'F-10 / F-11', score: 88 },
      { name: 'Blue Area', score: 86 },
      { name: 'DHA Islamabad', score: 84 },
    ],
  },
  karachi: {
    center: [24.8607, 67.0011],
    zoom: 11,
    label: 'Karachi',
    zones: [
      { name: 'Clifton', score: 94 },
      { name: 'DHA Defence', score: 91 },
      { name: 'PECHS', score: 85 },
      { name: 'Gulshan-e-Iqbal', score: 78 },
      { name: 'North Nazimabad', score: 72 },
    ],
  },
  multan: {
    center: [30.1575, 71.5249],
    zoom: 12,
    label: 'Multan',
    zones: [
      { name: 'DHA Multan', score: 90 },
      { name: 'Cantt', score: 86 },
      { name: 'Gulgasht', score: 80 },
      { name: 'Wapda Town', score: 74 },
      { name: 'New Multan', score: 68 },
    ],
  },
  peshawar: {
    center: [34.0151, 71.5249],
    zoom: 12,
    label: 'Peshawar',
    zones: [
      { name: 'Hayatabad', score: 88 },
      { name: 'Cantt', score: 84 },
      { name: 'University Town', score: 82 },
      { name: 'Bahria Town', score: 78 },
      { name: 'Gulbahar', score: 65 },
    ],
  },
  sialkot: {
    center: [32.4945, 74.5229],
    zoom: 12,
    label: 'Sialkot',
    zones: [
      { name: 'Cantt', score: 86 },
      { name: 'Iqbal Town', score: 80 },
      { name: 'Gulshan Colony', score: 74 },
      { name: 'Satellite Town', score: 70 },
      { name: 'Green Town', score: 65 },
    ],
  },
  faisalabad: {
    center: [31.4504, 73.1350],
    zoom: 12,
    label: 'Faisalabad',
    zones: [
      { name: 'Gulberg', score: 89 },
      { name: 'Canal Road', score: 84 },
      { name: 'Madina Town', score: 78 },
      { name: 'Peoples Colony', score: 72 },
      { name: 'Susan Road', score: 65 },
    ],
  },
  all: {
    center: [30.5, 71.5],
    zoom: 6,
    label: 'All Regions',
    zones: [
      { name: 'F-7 / F-6 (ISB)', score: 95 },
      { name: 'DHA Defence (LHR)', score: 92 },
      { name: 'Clifton (KHI)', score: 94 },
      { name: 'DHA Multan', score: 90 },
      { name: 'Hayatabad (PEW)', score: 88 },
    ],
  },
};

const fmtPKR = (v) => {
  if (!v || v <= 0) return 'N/A';
  if (v >= 10_000_000) return `Rs ${(v / 10_000_000).toFixed(2)} Cr`;
  if (v >= 100_000) return `Rs ${(v / 100_000).toFixed(2)} Lac`;
  return `Rs ${v.toLocaleString()}`;
};

/** Percentile-rank normalisation:
 *  Each item's intensity = its percentile rank among all items (0–1).
 *  Guarantees the full colour spectrum is always visible regardless
 *  of price distribution skew or outliers. */
const percentileNormalise = (items) => {
  if (!items || items.length === 0) return [];
  const sorted = [...items].sort((a, b) => a.price - b.price);
  const n = sorted.length;
  const rankMap = new Map();
  sorted.forEach((item, i) => {
    if (!rankMap.has(item.price)) rankMap.set(item.price, i);
  });
  return items.map((item) => {
    const rank = rankMap.get(item.price) ?? 0;
    const intensity = n <= 1 ? 0.5 : rank / (n - 1);
    return { ...item, intensity: parseFloat(intensity.toFixed(3)) };
  });
};

/** Min-max normalisation:
 *  Stretches the existing intensity values to the full 0-1 range.
 *  Used for grid (KDE) points whose raw intensities may be top-heavy. */
const minMaxNormaliseGrid = (items) => {
  if (!items || items.length === 0) return [];
  const vals = items.map((g) => g.intensity);
  const mn = Math.min(...vals);
  const mx = Math.max(...vals);
  const range = mx - mn || 1;
  return items.map((g) => ({
    ...g,
    intensity: parseFloat(((g.intensity - mn) / range).toFixed(3)),
  }));
};

/** Get colour from intensity (0=green, 0.25=yellow, 0.5=orange, 1=red) */
const intensityToColor = (intensity) => {
  if (intensity >= 0.75) return '#ef4444';   // Red   – highest prices
  if (intensity >= 0.50) return '#f97316';   // Orange
  if (intensity >= 0.25) return '#facc15';   // Yellow
  return '#22c55e';                           // Green  – lowest prices
};

/** Intensity bucket label */
const intensityToLabel = (intensity) => {
  if (intensity >= 0.75) return 'Premium';
  if (intensity >= 0.50) return 'High';
  if (intensity >= 0.25) return 'Medium';
  return 'Affordable';
};

// ── Map utility components ───────────────────────────────────────────────────

function MapCenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

function MapInvalidator() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const t = setTimeout(() => map.invalidateSize(), 300);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

// ── Heatmap (KDE) Layer ──────────────────────────────────────────────────────

function HeatmapLayer({ points, visible }) {
  const map = useMap();
  const heatRef = useRef(null);
  const [scriptReady, setScriptReady] = useState(!!window.L?.heatLayer);

  // Load leaflet-heat script once
  useEffect(() => {
    if (window.L?.heatLayer) { setScriptReady(true); return; }
    let script = document.querySelector('script[data-leaflet-heat]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js';
      script.setAttribute('data-leaflet-heat', '1');
      script.async = true;
      document.head.appendChild(script);
    }
    const onLoad = () => setScriptReady(true);
    script.addEventListener('load', onLoad);
    return () => script.removeEventListener('load', onLoad);
  }, []);

  // Rebuild heatmap whenever inputs change
  useEffect(() => {
    if (heatRef.current) { map.removeLayer(heatRef.current); heatRef.current = null; }
    if (!visible || !scriptReady || !points?.length || !window.L?.heatLayer) return;

    try {
      // KDE grid points already carry their own well-distributed 0-1 intensity
      // from the Python KDE computation. Use them directly.
      const heatPoints = points.map((p) => [p.lat, p.lng, p.intensity ?? 0.5]);

      heatRef.current = window.L.heatLayer(heatPoints, {
        radius: 40,
        blur: 25,
        maxZoom: 14,
        max: 1.0,          // treat intensity=1 as the hottest
        minOpacity: 0.35,  // always render something even for cold areas
        gradient: {
          0.00: '#1a7f37',  // Deep green  – very low density / low price
          0.25: '#65a30d',  // Yellow-green
          0.45: '#facc15',  // Yellow       – medium
          0.65: '#f97316',  // Orange       – medium-high
          0.85: '#ef4444',  // Red          – hotspot / premium
          1.00: '#7f1d1d',  // Dark red     – extreme premium
        },
      }).addTo(map);
    } catch (err) {
      console.error('HeatLayer error:', err);
    }

    return () => {
      if (heatRef.current) { map.removeLayer(heatRef.current); heatRef.current = null; }
    };
  }, [points, visible, scriptReady, map]);

  return null;
}

// ── Price Range Legend ───────────────────────────────────────────────────────

function PriceLegend({ priceRange, points }) {
  if (!points?.length) return null;
  const prices = [...points].map((p) => p.price).sort((a, b) => a - b);
  const n = prices.length;
  const q1 = prices[Math.floor(n * 0.25)];
  const q2 = prices[Math.floor(n * 0.50)];
  const q3 = prices[Math.floor(n * 0.75)];
  return (
    <div className="hm-price-legend">
      <div className="hm-price-legend-bar" />
      <div className="hm-price-legend-ticks">
        <span style={{ color: '#22c55e' }}>{fmtPKR(prices[0])}</span>
        <span style={{ color: '#facc15' }}>{fmtPKR(q2)}</span>
        <span style={{ color: '#ef4444' }}>{fmtPKR(prices[n - 1])}</span>
      </div>
      <div className="hm-price-legend-labels">
        <span>Affordable</span>
        <span>Median</span>
        <span>Premium</span>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function AreaHeatmap() {
  const [city, setCity] = useState('lahore');
  const [heatData, setHeatData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHeat, setShowHeat] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [apiStatus, setApiStatus] = useState('ok');
  const [error, setError] = useState('');

  // ── Data fetch ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const cities = city === 'all'
          ? ['lahore', 'islamabad', 'karachi', 'multan', 'peshawar', 'sialkot', 'faisalabad']
          : [city];
        const responses = await Promise.all(
          cities.map((c) => fetch(`${API_URL}/api/heatmap-data/${c}`, { headers: { 'ngrok-skip-browser-warning': 'true' } }).then((r) => r.json()))
        );
        const failed = responses.find((r) => !r.success);
        if (failed) { setError(failed.error || 'Failed to load data'); return; }

        const merged = {
          grid: responses.flatMap((r) => r.data.grid),
          points: responses.flatMap((r) => r.data.points),
          count: responses.reduce((s, r) => s + r.data.count, 0),
          price_range: {
            min: Math.min(...responses.map((r) => r.data.price_range.min)),
            max: Math.max(...responses.map((r) => r.data.price_range.max)),
          },
        };

        // Apply percentile-rank normalisation on property points so every
        // price tier is represented with a distinct colour.
        merged.points = percentileNormalise(merged.points);

        // Grid intensities from Python KDE can be top-heavy (P25~0.7, P50~0.8)
        // so we min-max stretch them to guarantee full green→red range.
        merged.grid = minMaxNormaliseGrid(merged.grid);

        setHeatData(merged);
        setApiStatus('ok');
      } catch (err) {
        console.error(err);
        setError('API offline — showing simulated data.');
        setApiStatus('offline');
        const mock = getMockData(city);
        setHeatData(mock);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [city]);

  // ── Mock data (offline fallback) ───────────────────────────────────────────
  const getMockData = (selectedCity) => {
    const allCities = ['lahore', 'islamabad', 'karachi', 'multan', 'peshawar', 'sialkot', 'faisalabad'];
    const cfgs = selectedCity === 'all'
      ? allCities.map((c) => CITY_CONFIG[c]).filter(Boolean)
      : [CITY_CONFIG[selectedCity]].filter(Boolean);

    const MOCK_LOCS = {
      lahore:     ['DHA Phase 6', 'Gulberg III', 'Bahria Town', 'Model Town', 'Johar Town'],
      islamabad:  ['F-7/2', 'E-11/3', 'G-11', 'Blue Area', 'DHA Phase 2'],
      karachi:    ['Clifton', 'DHA Phase 8', 'PECHS', 'Gulshan-e-Iqbal', 'North Nazimabad'],
      multan:     ['DHA Multan', 'Cantt', 'Gulgasht', 'Wapda Town', 'New Multan'],
      peshawar:   ['Hayatabad', 'Cantt', 'University Town', 'Bahria Town', 'Gulbahar'],
      sialkot:    ['Cantt', 'Iqbal Town', 'Gulshan Colony', 'Satellite Town', 'Green Town'],
      faisalabad: ['Gulberg', 'Canal Road', 'Madina Town', 'Peoples Colony', 'Susan Road'],
    };

    const grid = [];
    const points = [];

    cfgs.forEach((cfg) => {
      const cityKey = Object.keys(CITY_CONFIG).find((k) => CITY_CONFIG[k] === cfg) || 'lahore';
      const locs = MOCK_LOCS[cityKey] || MOCK_LOCS.lahore;
      for (let i = 0; i < 18; i++) {
        for (let j = 0; j < 18; j++) {
          const lat = cfg.center[0] + (i - 9) * 0.012;
          const lng = cfg.center[1] + (j - 9) * 0.012;
          const dist = Math.sqrt((i - 9) ** 2 + (j - 9) ** 2);
          const intensity = Math.max(0, Math.min(1, 1 - dist / 12));
          const price = 5_000_000 + intensity * 95_000_000;
          grid.push({ lat, lng, intensity, price });
        }
      }
      for (let k = 0; k < 80; k++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * 0.07;
        const lat = cfg.center[0] + Math.sin(angle) * r;
        const lng = cfg.center[1] + Math.cos(angle) * r;
        const price = Math.round(5_000_000 + Math.random() * 95_000_000);
        points.push({
          lat, lng, price,
          area: 1000 + Math.floor(Math.random() * 4000),
          type: Math.random() > 0.3 ? 'House' : 'Flat',
          location: locs[k % locs.length],
          intensity: 0,
        });
      }
    });

    const normPoints = percentileNormalise(points);
    const normGrid   = minMaxNormaliseGrid(grid);
    return { grid: normGrid, points: normPoints, count: points.length, price_range: { min: 5_000_000, max: 100_000_000 } };
  };

  // ── Derived stats ──────────────────────────────────────────────────────────
  const currentConfig = CITY_CONFIG[city];
  const totalProps = heatData?.points?.length ?? 0;
  const prices = heatData?.points?.map((p) => p.price).filter(Boolean) ?? [];
  const medianPrice = prices.length
    ? prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)]
    : 0;
  const avgPrice = prices.length
    ? Math.round(prices.reduce((s, p) => s + p, 0) / prices.length)
    : 0;

  // Colour distribution counts
  const colorCounts = heatData?.points
    ? {
        green:  heatData.points.filter((p) => p.intensity < 0.25).length,
        yellow: heatData.points.filter((p) => p.intensity >= 0.25 && p.intensity < 0.50).length,
        orange: heatData.points.filter((p) => p.intensity >= 0.50 && p.intensity < 0.75).length,
        red:    heatData.points.filter((p) => p.intensity >= 0.75).length,
      }
    : null;

  return (
    <div className="hm-page">
      {/* ── Hero ── */}
      <header className="hm-hero">
        <div className="hm-badge">
          <span
            style={{
              display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
              background: apiStatus === 'ok' ? '#10b981' : '#ef4444', marginRight: 6,
            }}
          />
          {apiStatus === 'ok' ? 'Live AI Engine Connected' : 'Offline Mode'}
        </div>
        <h1>Market <span>Density &amp; Heatmap</span></h1>
        <p>
          Explore spatial real-estate price distribution. Each colour tier reflects
          a distinct price quartile — green (affordable) through red (premium).
        </p>
        <div className="hm-hero-stats">
          <div className="hm-hero-stat">
            <div className="hm-hero-stat-val">7 Cities</div>
            <div className="hm-hero-stat-label">Lahore, Karachi, ISB & more</div>
          </div>
          <div className="hm-hero-stat">
            <div className="hm-hero-stat-val">{heatData?.grid?.length ?? '—'}</div>
            <div className="hm-hero-stat-label">KDE Grid Points</div>
          </div>
          <div className="hm-hero-stat">
            <div className="hm-hero-stat-val">{totalProps}</div>
            <div className="hm-hero-stat-label">Property Markers</div>
          </div>
        </div>
      </header>

      {/* ── Layout ── */}
      <div className="hm-layout">
        {/* Map */}
        <div className="hm-map-container">
          {loading && (
            <div className="hm-map-loading-overlay">
              <div className="hm-spinner" />
              <span>Loading spatial data…</span>
            </div>
          )}
          <MapContainer
            center={currentConfig.center}
            zoom={currentConfig.zoom}
            className="hm-map"
            style={{ height: '100%', width: '100%' }}
          >
            <MapInvalidator />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapCenter center={currentConfig.center} zoom={currentConfig.zoom} />

            {/* KDE Heatmap — uses grid's pre-computed intensities directly */}
            {heatData && (
              <HeatmapLayer
                points={heatData.grid?.length ? heatData.grid : heatData.points}
                visible={showHeat}
              />
            )}

            {/* Individual Property Markers — coloured by percentile rank */}
            {showMarkers && heatData?.points?.map((p, idx) => (
              <CircleMarker
                key={idx}
                center={[p.lat, p.lng]}
                radius={6}
                fillColor={intensityToColor(p.intensity)}
                color="#ffffff"
                weight={1.5}
                fillOpacity={0.88}
              >
                <Popup>
                  <div className="hm-tooltip-card">
                    <div
                      className="hm-tooltip-tier"
                      style={{ background: intensityToColor(p.intensity) }}
                    >
                      {intensityToLabel(p.intensity)}
                    </div>
                    <div className="hm-tooltip-price">{fmtPKR(p.price)}</div>
                    <div className="hm-tooltip-details">
                      <span><strong>Location:</strong> {p.location || '—'}</span>
                      <span><strong>Type:</strong> {p.type || '—'}</span>
                      <span><strong>Area:</strong> {p.area ? `${p.area} sq ft` : '—'}</span>
                      <span><strong>Percentile:</strong> {Math.round(p.intensity * 100)}th</span>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          <div className="hm-map-badge">
            <div className="hm-map-badge-dot" />
            Live AI Heatmap — {currentConfig.label}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="hm-sidebar">
          {apiStatus === 'offline' && (
            <div className="hm-offline-banner">
              <FaExclamationTriangle />
              <span>API offline. Showing simulated data.</span>
            </div>
          )}
          {error && !loading && (
            <div className="hm-error-banner">
              <FaExclamationTriangle />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="hm-sidebar-loading">
              <div className="hm-spinner" />
              <span>Fetching spatial coordinates…</span>
            </div>
          ) : (
            <>
              {/* Region selector */}
              <div className="hm-sidebar-section">
                <span className="hm-sidebar-title">Select Region</span>
                <div className="hm-city-toggle" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {['lahore', 'islamabad', 'karachi', 'multan', 'peshawar', 'sialkot', 'faisalabad', 'all'].map((c) => (
                    <button
                      key={c}
                      className={`hm-city-btn ${city === c ? 'active' : ''}`}
                      onClick={() => setCity(c)}
                    >
                      {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Layer controls */}
              <div className="hm-sidebar-section">
                <span className="hm-sidebar-title">Layer Controls</span>
                <div className="hm-layer-toggles">
                  <div className="hm-toggle-row" onClick={() => setShowHeat((v) => !v)}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FaFire style={{ color: '#ef4444' }} />
                      KDE Density Heatmap
                    </span>
                    <input type="checkbox" checked={showHeat} onChange={() => {}} />
                  </div>
                  <div className="hm-toggle-row" onClick={() => setShowMarkers((v) => !v)}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FaMapMarkerAlt style={{ color: '#10b981' }} />
                      Property Price Markers
                    </span>
                    <input type="checkbox" checked={showMarkers} onChange={() => {}} />
                  </div>
                </div>
              </div>

              {/* Colour legend */}
              <div className="hm-sidebar-section">
                <span className="hm-sidebar-title">Price Tier Legend</span>
                <div className="hm-legend">
                  <div className="hm-legend-gradient" />
                  <div className="hm-legend-tiers">
                    {[
                      { color: '#22c55e', label: 'Affordable', sub: '0–25th pct' },
                      { color: '#facc15', label: 'Medium',     sub: '25–50th pct' },
                      { color: '#f97316', label: 'High',       sub: '50–75th pct' },
                      { color: '#ef4444', label: 'Premium',    sub: '75–100th pct' },
                    ].map(({ color, label, sub }) => (
                      <div key={label} className="hm-legend-tier-row">
                        <span className="hm-legend-dot" style={{ background: color }} />
                        <span className="hm-legend-tier-label">{label}</span>
                        <span className="hm-legend-tier-sub">{sub}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Colour distribution */}
              {colorCounts && (
                <div className="hm-sidebar-section">
                  <span className="hm-sidebar-title">Colour Distribution</span>
                  <div className="hm-color-dist">
                    {[
                      { color: '#22c55e', label: 'Affordable', count: colorCounts.green },
                      { color: '#facc15', label: 'Medium',     count: colorCounts.yellow },
                      { color: '#f97316', label: 'High',       count: colorCounts.orange },
                      { color: '#ef4444', label: 'Premium',    count: colorCounts.red },
                    ].map(({ color, label, count }) => (
                      <div key={label} className="hm-color-dist-row">
                        <span className="hm-legend-dot" style={{ background: color }} />
                        <span className="hm-color-dist-label">{label}</span>
                        <div className="hm-color-dist-bar-track">
                          <div
                            className="hm-color-dist-bar-fill"
                            style={{
                              width: `${totalProps ? (count / totalProps) * 100 : 0}%`,
                              background: color,
                            }}
                          />
                        </div>
                        <span className="hm-color-dist-count">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="hm-sidebar-section">
                <span className="hm-sidebar-title">Market Statistics</span>
                <div className="hm-stats-grid">
                  <div className="hm-stat-card">
                    <span className="hm-stat-card-label">Median Price</span>
                    <div className="hm-stat-card-val">{fmtPKR(medianPrice)}</div>
                  </div>
                  <div className="hm-stat-card">
                    <span className="hm-stat-card-label">Avg Price</span>
                    <div className="hm-stat-card-val">{fmtPKR(avgPrice)}</div>
                  </div>
                  <div className="hm-stat-card">
                    <span className="hm-stat-card-label">Properties</span>
                    <div className="hm-stat-card-val">{totalProps}</div>
                  </div>
                  <div className="hm-stat-card">
                    <span className="hm-stat-card-label">KDE Points</span>
                    <div className="hm-stat-card-val">{heatData?.grid?.length ?? 0}</div>
                  </div>
                </div>
              </div>

              {/* Top Zones */}
              <div className="hm-sidebar-section">
                <span className="hm-sidebar-title">Top Index Hotspots</span>
                <div className="hm-zone-list">
                  {currentConfig.zones.map((zone) => (
                    <div key={zone.name} className="hm-zone-item">
                      <div className="hm-zone-header">
                        <span>{zone.name}</span>
                        <span className="hm-zone-score">{zone.score}/100</span>
                      </div>
                      <div className="hm-zone-bar-track">
                        <div
                          className="hm-zone-bar-fill"
                          style={{
                            width: `${zone.score}%`,
                            background: zone.score >= 90
                              ? '#ef4444' : zone.score >= 82
                              ? '#f97316' : '#10b981',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Methodology note */}
              <div className="hm-sidebar-section">
                <div className="hm-method-note">
                  <FaInfoCircle style={{ color: '#10b981', flexShrink: 0 }} />
                  <span>
                    Colours use <strong>percentile-rank normalisation</strong> — each
                    quartile (25%) of properties receives one colour tier, ensuring
                    the full spectrum is always visible regardless of price range.
                  </span>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
