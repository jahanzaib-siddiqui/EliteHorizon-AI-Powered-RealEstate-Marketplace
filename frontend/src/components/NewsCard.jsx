function NewsCard({ article }) {
  return (
    <div
      style={{
        width: "340px",
        background: "#fff",
        borderRadius: "14px",
        overflow: "hidden",
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        transition: "transform 0.3s",
      }}
    >
      <img
        src={article.image}
        alt={article.title}
        style={{ width: "100%", height: "200px", objectFit: "cover" }}
      />

      <div style={{ padding: "20px" }}>
        <span style={{ fontSize: "13px", color: "#2c8a68" }}>
          {article.category}
        </span>

        <h3 style={{ fontSize: "18px", margin: "10px 0" }}>
          {article.title}
        </h3>

        <p style={{ fontSize: "14px", color: "#555" }}>
          {article.summary}
        </p>

        <p style={{ fontSize: "12px", marginTop: "10px", color: "#888" }}>
          {article.date}
        </p>
      </div>
    </div>
  );
}

export default NewsCard;
