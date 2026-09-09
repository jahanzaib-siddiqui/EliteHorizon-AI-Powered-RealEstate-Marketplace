import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// fix default marker icon issue in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

function LahoreMap({ properties }) {
  return (
    <MapContainer
      center={[31.5204, 74.3587]} // Lahore center
      zoom={12}
      style={{ height: "500px", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      {properties.map((p) => (
        <Marker key={p._id} position={[p.lat, p.lng]}>
          <Popup>
            <strong>{p.title}</strong> <br />
            {p.location} <br />
            Price: {p.price.toLocaleString()} PKR
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default LahoreMap;
