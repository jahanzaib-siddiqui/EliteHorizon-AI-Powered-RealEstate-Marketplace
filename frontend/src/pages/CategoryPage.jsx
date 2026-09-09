import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PropertySlider from "../components/PropertySlider";
import { searchProperties } from "../services/api";

function CategoryPage() {
  const { category } = useParams();
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    searchProperties({ type: category })
      .then((res) => setProperties(res.data))
      .catch((err) => console.log(err));
  }, [category]);

  return (
    <div style={{ padding: "40px" }}>
      <h2 style={{ textTransform: "capitalize" }}>
        {category} Properties
      </h2>

      {properties.length > 0 ? (
        <PropertySlider properties={properties} />
      ) : (
        <p>No {category} properties found.</p>
      )}
    </div>
  );
}

export default CategoryPage;
