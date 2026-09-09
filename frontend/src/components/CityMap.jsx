import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl, Polygon, Tooltip, FeatureGroup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { SOCIETY_BOUNDARIES } from "../data/societyBoundaries";

// Fix default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const ChangeView = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
};

export default function CityMap({ properties, center, style }) {
  // Helper to get custom SVG icon
  const getMarkerIcon = (property) => {
    let color = "#f9ab00"; // Default / Budget (Yellow)

    if (property.category === "Prime") {
      color = "#d93025"; // Red
    } else if (property.category === "Luxury") {
      color = "#1a73e8"; // Blue
    } else if (property.category === "Mid") {
      color = "#1e8e3e"; // Green
    }

    let svgIcon = "";

    // HOUSE ICON
    if (property.type === "House") {
      svgIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="36px" height="36px" stroke="white" stroke-width="1.5">
            <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z"/>
        </svg>`;
    }
    // COMMERCIAL ICON (Building)
    else if (property.type === "Commercial") {
      svgIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32px" height="32px" stroke="white" stroke-width="1.5">
            <path d="M4 22V8l8-6 8 6v14H4zm6-12h2v2h-2v-2zm0 4h2v2h-2v-2zm-4-4h2v2H6v-2zm0 4h2v2H6v-2zm8-4h2v2h-2v-2zm0 4h2v2h-2v-2zm4-4h2v2h-2v-2zm0 4h2v2h-2v-2z"/>
        </svg>`;
    }
    // PLOT ICON (Square Area)
    else {
      svgIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="30px" height="30px" stroke="white" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="3" y1="21" x2="21" y2="3" stroke="white" stroke-width="1" opacity="0.5"/>
        </svg>`;
    }

    return new L.DivIcon({
      className: "custom-marker",
      html: `<div style="filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.3)); transform: translateY(-50%);">${svgIcon}</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36], // Center bottom
      popupAnchor: [0, -36],
    });
  };

  // Determine which city boundaries to show based on center or property data
  const getCityFromCenter = (lat, lng) => {
    if (Math.abs(lat - 31.5) < 0.5) return "lahore";
    if (Math.abs(lat - 33.6) < 0.5) return "islamabad";
    if (Math.abs(lat - 24.8) < 1.0) return "karachi";
    if (Math.abs(lat - 30.1) < 0.5) return "multan";
    return "lahore"; // default
  };

  const currentCityKey = center ? getCityFromCenter(center[0], center[1]) : "lahore";
  const societyPolygons = SOCIETY_BOUNDARIES[currentCityKey] || [];

  return (
    <MapContainer
      center={center}
      zoom={11}
      style={{ height: "500px", width: "100%", borderRadius: "10px", ...style }}
    >
      <ChangeView center={center} />

      <LayersControl position="topright">

        {/* BASE LAYERS */}
        <LayersControl.BaseLayer checked name="Street View">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
        </LayersControl.BaseLayer>

        <LayersControl.BaseLayer name="Satellite (Esri)">
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
          />
        </LayersControl.BaseLayer>

        <LayersControl.BaseLayer name="Dark Map">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap &copy; CartoDB'
          />
        </LayersControl.BaseLayer>

        {/* OVERLAYS */}
        <LayersControl.Overlay checked name="Society Boundaries">
          <FeatureGroup>
            {societyPolygons.map((society, idx) => (
              <Polygon
                key={idx}
                positions={society.positions}
                pathOptions={{
                  color: society.color,
                  fillColor: society.color,
                  fillOpacity: 0.1,
                  weight: 2,
                  dashArray: '5, 5'
                }}
              >
                <Tooltip sticky direction="center" opacity={0.8}>
                  <span style={{ fontWeight: 'bold' }}>{society.name}</span>
                </Tooltip>
              </Polygon>
            ))}
          </FeatureGroup>
        </LayersControl.Overlay>

      </LayersControl>

      {/* MARKERS (Always Visible) */}
      {properties
        .filter((p) => p.lat && p.lng)
        .map((p) => (
          <Marker
            key={p._id || Math.random()}
            position={[p.lat, p.lng]}
            icon={getMarkerIcon(p)}
          >
            <Popup>
              {p.page_url ? (
                <a href={p.page_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "#0f3460", fontWeight: "bold" }}>
                  {p.title}
                </a>
              ) : (
                <strong>{p.title}</strong>
              )}
              <br />
              <span style={{ color: "#555", fontSize: "12px" }}>{p.location}, {p.city}</span>
              <br />
              <span style={{ fontWeight: "bold" }}>
                PKR {(p.purpose === "Rent" ? (p.rentPrice || p.price) : p.price || 0).toLocaleString()}
                {p.purpose === "Rent" ? " /mo" : ""}
              </span>
              {p.agency_name && (
                <><br /><span style={{ color: "#777", fontSize: "11px" }}>🏢 {p.agency_name}</span></>
              )}
              <br />
              <span style={{
                color: p.category === 'Prime' ? '#c0392b' :
                  p.category === 'Luxury' ? '#2471a3' :
                    p.category === 'Mid' ? '#1e8449' : '#b7950b',
                fontWeight: 'bold',
                fontSize: "11px"
              }}>
                ● {p.category || "Budget"}
              </span>
              {p.page_url && (
                <><br />
                  <a href={p.page_url} target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-block", marginTop: "5px", background: "#0f3460", color: "#fff", padding: "3px 10px", borderRadius: "6px", fontSize: "11px", textDecoration: "none" }}>
                    View on Zameen →
                  </a>
                </>
              )}
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}

