import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const CITY_COORDS = {
    Lahore:     [31.5204, 74.3587],
    Islamabad:  [33.6844, 73.0479],
    Karachi:    [24.8607, 67.0011],
    Multan:     [30.1575, 71.5249],
    Peshawar:   [34.0151, 71.5249],
    Sialkot:    [32.4945, 74.5229],
    Faisalabad: [31.4504, 73.1350],
};

function RecenterMap({ center }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, 12);
    }, [center, map]);
    return null;
}

function ClickMarker({ position, setPosition }) {
    useMapEvents({
        click(e) {
            setPosition([e.latlng.lat, e.latlng.lng]);
        },
    });
    return position ? <Marker position={position} /> : null;
}

const LocationPicker = ({ city, onLocationSelect }) => {
    const defaultPos = CITY_COORDS[city] || CITY_COORDS.Lahore;
    const [markerPos, setMarkerPos] = useState(defaultPos);

    // When city changes, reset marker to city center
    useEffect(() => {
        const coords = CITY_COORDS[city] || CITY_COORDS.Lahore;
        setMarkerPos(coords);
        onLocationSelect(coords[0], coords[1]);
    }, [city]);

    const handleMarkerSet = (pos) => {
        setMarkerPos(pos);
        onLocationSelect(pos[0], pos[1]);
    };

    return (
        <div style={{ marginTop: "12px", borderRadius: "8px", overflow: "hidden", border: "1px solid #cbd5e0" }}>
            <MapContainer
                center={defaultPos}
                zoom={12}
                scrollWheelZoom={true}
                style={{ height: "300px", width: "100%" }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                />
                <RecenterMap center={CITY_COORDS[city] || CITY_COORDS.Lahore} />
                <ClickMarker position={markerPos} setPosition={handleMarkerSet} />
            </MapContainer>
            <div style={{ background: "#f8fafc", padding: "8px 14px", fontSize: "13px", color: "#718096" }}>
                📍 Click anywhere on the map to set your property location.
                {markerPos && (
                    <span style={{ marginLeft: "10px", fontWeight: 500 }}>
                        Lat: {markerPos[0].toFixed(5)}, Lng: {markerPos[1].toFixed(5)}
                    </span>
                )}
            </div>
        </div>
    );
};

export default LocationPicker;
