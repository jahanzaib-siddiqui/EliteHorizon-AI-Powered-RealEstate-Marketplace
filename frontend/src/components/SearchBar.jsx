function SearchBar() {
  return (
    <div style={{
      backgroundImage: "url('https://images.unsplash.com/photo-1467269204594-9661b134dd2b')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      padding: "80px 0"
    }}>
      
      <div style={{
        backgroundColor: "white",
        maxWidth: "900px",
        margin: "0 auto",
        padding: "20px",
        borderRadius: "10px",
        display: "flex",
        gap: "10px"
      }}>

        <select style={inputStyle}>
          <option>Select City</option>
          <option>Lahore</option>
          <option>Islamabad</option>
          <option>Karachi</option>
        </select>

        <input
          type="text"
          placeholder="Location"
          style={inputStyle}
        />

        <select style={inputStyle}>
          <option>House</option>
          <option>Commercial</option>
          <option>Plot</option>
        </select>

        <button style={buttonStyle}>
          Search
        </button>

      </div>
    </div>
  );
}

const inputStyle = {
  padding: "10px",
  flex: 1,
  borderRadius: "6px",
  border: "1px solid #ccc"
};

const buttonStyle = {
  backgroundColor: "green",
  color: "white",
  border: "none",
  padding: "10px 20px",
  borderRadius: "6px",
  cursor: "pointer"
};

export default SearchBar;
