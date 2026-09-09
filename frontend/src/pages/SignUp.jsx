import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaFacebookF, FaGooglePlusG, FaLinkedinIn } from "react-icons/fa";
import "./AuthStyles.css";

const SignUp = () => {
    const avatars = [
        "/avatar_male_1_1772875227901.png", // Updated avatar path
        "/avatar_male_2_new_1772877402690.png",
        "/avatar_female_1_new_1772877416477.png",
        "/avatar_female_2_new_1772877431449.png"
    ];

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        monthlyIncome: "",
        bankBalance: "",
        avatar: avatars[0], // Default avatar selection
        role: "buyer", // Added role field with default
    });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const url = `${import.meta.env.VITE_API_URL}/api/auth/signup`;

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "An error occurred");
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            navigate("/");
            window.location.reload();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">

                {/* Left Side: Green Panel */}
                <div className="auth-panel auth-panel-side">
                    <div className="auth-overlay-content">
                        <h2>Welcome Back!</h2>
                        <p>To keep connected with us please login with your personal info</p>
                        <button className="auth-ghost-btn" onClick={() => navigate("/signin")}>
                            SIGN IN
                        </button>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="auth-panel">
                    <div className="auth-form-container">
                        <h2>Create Account</h2>
                        <div className="social-container">
                            <a href="#" className="social"><FaFacebookF /></a>
                            <a href="#" className="social"><FaGooglePlusG /></a>
                            <a href="#" className="social"><FaLinkedinIn /></a>
                        </div>
                        <span>or use your email for registration</span>

                        <form onSubmit={handleSubmit} className="auth-form scrollable-form">
                            <label style={{ fontSize: "12px", color: "#666", marginBottom: "5px", textAlign: "left" }}>Choose Avatar:</label>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", padding: "0 10px" }}>
                                {avatars.map((img, idx) => (
                                    <img
                                        key={idx}
                                        src={img}
                                        alt={`Avatar ${idx + 1}`}
                                        style={{
                                            width: "45px", height: "45px", borderRadius: "50%", cursor: "pointer",
                                            border: formData.avatar === img ? "2px solid #28a745" : "2px solid transparent",
                                            boxShadow: formData.avatar === img ? "0 0 8px rgba(40, 167, 69, 0.4)" : "none",
                                            transition: "all 0.2s"
                                        }}
                                        onClick={() => setFormData({ ...formData, avatar: img })}
                                    />
                                ))}
                            </div>

                            <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} required />
                            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
                            <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
                            <input type="number" name="monthlyIncome" placeholder="Monthly Income" value={formData.monthlyIncome} onChange={handleChange} />
                            <input type="number" name="bankBalance" placeholder="Bank Balance" value={formData.bankBalance} onChange={handleChange} />

                            {error && <div className="auth-error">{error}</div>}

                            <div className="role-selection">
                                <label>Account Type:</label>
                                <div className="role-options">
                                    <label className={`role-option ${formData.role === "buyer" ? "active" : ""}`}>
                                        <input
                                            type="radio"
                                            name="role"
                                            value="buyer"
                                            checked={formData.role === "buyer"}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        />
                                        Buyer
                                    </label>
                                    <label className={`role-option ${formData.role === "seller" ? "active" : ""}`}>
                                        <input
                                            type="radio"
                                            name="role"
                                            value="seller"
                                            checked={formData.role === "seller"}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        />
                                        Seller
                                    </label>
                                </div>
                            </div>

                            <button type="submit" className="auth-submit-btn">SIGN UP</button>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SignUp;
