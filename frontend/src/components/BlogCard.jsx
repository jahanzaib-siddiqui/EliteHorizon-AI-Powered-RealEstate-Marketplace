// components/BlogCard.jsx
import React from "react";

const BlogCard = ({ blog }) => {
  return (
    <div
      style={{
        width: "300px",
        borderRadius: "10px",
        overflow: "hidden",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        background: "#fff",
        cursor: "pointer",
        transition: "transform 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <img src={blog.image} alt={blog.title} style={{ width: "100%", height: "180px", objectFit: "cover" }} />
      <div style={{ padding: "15px" }}>
        <span style={{ color: "#2c8a68", fontWeight: "600", fontSize: "14px" }}>
          {blog.category}
        </span>
        <h3 style={{ fontSize: "18px", margin: "10px 0", color: "#1f2937" }}>
          {blog.title}
        </h3>
        <p style={{ fontSize: "14px", color: "#6b7280" }}>{blog.excerpt}</p>
      </div>
    </div>
  );
};

export default BlogCard;
