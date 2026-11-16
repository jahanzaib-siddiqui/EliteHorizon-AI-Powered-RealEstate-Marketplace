import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaFacebookF, FaGooglePlusG, FaLinkedinIn } from "react-icons/fa";
import "./AuthStyles.css";

const SignUp = () => {
    const avatars = [
        "/avatar_male_1_1772875227901.png",
        "/avatar_male_2_new_1772877402690.png",
        "/avatar_female_1_new_1772877416477.png",
        "/avatar_female_2_new_1772877431449.png"
    ];

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        cnic: "",
        avatar: avatars[0],
        role: "buyer",
    });
    const [error, setError]     = useState("");
    const [success, setSuccess] = useState("");
    const [cnicError, setCnicError] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Auto-format CNIC as user types: XXXXX-XXXXXXX-X
    const handleCnicChange = (e) => {
        let val = e.target.value.replace(/[^0-9]/g, ""); // digits only
        if (val.length > 13) val = val.slice(0, 13);
        let formatted = val;
        if (val.length > 5)  formatted = val.slice(0, 5) + "-" + val.slice(5);
        if (val.length > 12) formatted = val.slice(0, 5) + "-" + val.slice(5, 12) + "-" + val.slice(12);
        setFormData({ ...formData, cnic: formatted });
        // Validate on change
        const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
        if (formatted.length > 0 && !cnicRegex.test(formatted)) {
            setCnicError("Format: XXXXX-XXXXXXX-X (e.g. 35201-1234567-8)");
        } else {
            setCnicError("");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
        if (!cnicRegex.test(formData.cnic)) {
            setError("Please enter a valid CNIC in format XXXXX-XXXXXXX-X.");
            return;
        }

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

            // Seller: pending approval — show message
            if (data.pendingApproval) {
                setSuccess(data.message);
                return;
            }

            // Buyer: token returned — log in directly and go to home
            if (data.token) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));
                navigate("/");
                window.location.reload();
            }
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
                        <h2 style={{ color: '#ffffff' }}>Welcome Back!</h2>
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

                        <form onSubmit={handleSubmit} className="auth-form">
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

                            <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
                            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
                            <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />

                            {/* CNIC Field */}
                            <div style={{ position: "relative", width: "100%" }}>
                                <input
                                    type="text"
                                    name="cnic"
                                    placeholder="CNIC (e.g. 35201-1234567-8)"
                                    value={formData.cnic}
                                    onChange={handleCnicChange}
                                    maxLength={15}
                                    required
                                    style={{
                                        width: "100%",
                                        borderColor: cnicError ? "#ef4444" : formData.cnic.length === 15 ? "#22c55e" : undefined,
                                    }}
                                />
                                {cnicError && (
                                    <div style={{ fontSize: "11px", color: "#ef4444", marginTop: "2px", textAlign: "left" }}>
                                        ⚠ {cnicError}
                                    </div>
                                )}
                                {!cnicError && formData.cnic.length === 15 && (
                                    <div style={{ fontSize: "11px", color: "#16a34a", marginTop: "2px", textAlign: "left" }}>
                                        ✓ CNIC format valid
                                    </div>
                                )}
                                <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "2px", textAlign: "left" }}>
                                    🔒 Used for identity verification by admin. Format: XXXXX-XXXXXXX-X
                                </div>
                            </div>

                            {error   && <div className="auth-error">⚠ {error}</div>}
                            {success && (
                                <div style={{
                                    background: "#f0fdf4", border: "1px solid #22c55e", borderRadius: "8px",
                                    padding: "12px 14px", fontSize: "13px", color: "#15803d",
                                    textAlign: "center", marginTop: "8px", lineHeight: "1.5"
                                }}>
                                    ✅ {success}
                                    <div style={{ marginTop: "8px" }}>
                                        <button
                                            type="button"
                                            onClick={() => navigate("/signin")}
                                            style={{
                                                background: "#16a34a", color: "#fff", border: "none",
                                                borderRadius: "6px", padding: "6px 18px", cursor: "pointer",
                                                fontSize: "12px", fontWeight: "600"
                                            }}
                                        >
                                            Go to Sign In
                                        </button>
                                    </div>
                                </div>
                            )}

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

                            {!success && <button type="submit" className="auth-submit-btn">SIGN UP</button>}
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SignUp;
