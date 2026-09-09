import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

function PropertyMap({ properties, center, zoom = 12 }) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {properties.map((p) => (
        <Marker key={p._id} position={[p.lat, p.lng]}>
          <Popup>
            <strong>{p.title}</strong>
            <br />
            {p.location}
            <br />
            Price: {p.price}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default PropertyMap;
