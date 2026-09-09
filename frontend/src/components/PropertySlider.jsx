import { useRef, useEffect, useState } from "react";
import PropertyCard from "./PropertyCard";

function PropertySlider({ properties }) {
  const sliderRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const CARD_SCROLL = 320; // card width + gap

  const checkScroll = () => {
    const el = sliderRef.current;
    if (!el) return;

    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(
      el.scrollLeft + el.clientWidth < el.scrollWidth - 5
    );
  };

  const scrollLeft = () => {
    sliderRef.current.scrollBy({
      left: -CARD_SCROLL,
      behavior: "smooth",
    });
  };

  const scrollRight = () => {
    sliderRef.current.scrollBy({
      left: CARD_SCROLL,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    checkScroll();
    const timer = setTimeout(checkScroll, 150); // Gives DOM time to render explicit flex gaps.
    window.addEventListener("resize", checkScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkScroll);
    };
  }, [properties]);

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", width: "100%", minWidth: 0 }}>
      {/* Left Arrow */}
      <button
        onClick={scrollLeft}
        disabled={!canScrollLeft}
        style={{
          ...arrowStyle("left"),
          opacity: canScrollLeft ? 1 : 0.3,
          cursor: canScrollLeft ? "pointer" : "not-allowed",
        }}
      >
        ←
      </button>

      {/* Slider */}
      <div
        ref={sliderRef}
        onScroll={checkScroll}
        className="hide-scrollbar"
        style={{
          display: "flex",
          gap: "20px",
          overflowX: "auto",      // ✅ KEY FIX
          scrollBehavior: "smooth",
          padding: "10px",        // removed massive 40px left/right padding
          maxWidth: "100%",       // Force containment
          msOverflowStyle: "none",  // IE and Edge
          scrollbarWidth: "none",  // Firefox
          flex: 1,                 // take up remaining space
          minWidth: 0,             // ALLOW FLEX CHILD TO SHRINK
        }}
      >
        {properties.map((property, index) => (
          <PropertyCard
            key={index}
            page_url={property.page_url}
            title={property.title}
            location={property.location}
            price={property.price}
            rentPrice={property.rentPrice}
            purpose={property.purpose}
            type={property.type}
            image={property.image}
            style={{ width: "260px", flexShrink: 0 }}
          />
        ))}
      </div>

      {/* Right Arrow */}
      <button
        onClick={scrollRight}
        disabled={!canScrollRight}
        style={{
          ...arrowStyle("right"),
          opacity: canScrollRight ? 1 : 0.3,
          cursor: canScrollRight ? "pointer" : "not-allowed",
        }}
      >
        →
      </button>
    </div>
  );
}

const arrowStyle = (side) => ({
  flexShrink: 0,
  width: "45px",
  height: "45px",
  minWidth: 0,
  padding: 0,
  borderRadius: "50%",
  backgroundColor: "#e6f4ea",
  color: "#1a7f37",
  fontSize: "20px",
  fontWeight: "bold",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  zIndex: 10,
  margin: side === "left" ? "0 10px 0 -15px" : "0 -15px 0 10px", boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
});

export default PropertySlider;
