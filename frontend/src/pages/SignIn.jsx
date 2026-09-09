import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaFacebookF, FaGooglePlusG, FaLinkedinIn } from "react-icons/fa";
import "./AuthStyles.css";

const SignIn = () => {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const url = `${import.meta.env.VITE_API_URL}/api/auth/signin`;

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

                {/* Left Side: Form */}
                <div className="auth-panel">
                    <div className="auth-form-container">
                        <h2>Sign in</h2>
                        <div className="social-container">
                            <a href="#" className="social"><FaFacebookF /></a>
                            <a href="#" className="social"><FaGooglePlusG /></a>
                            <a href="#" className="social"><FaLinkedinIn /></a>
                        </div>
                        <span>or use your account</span>

                        <form onSubmit={handleSubmit} className="auth-form">
                            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
                            <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />

                            <a href="#" className="forgot-password">Forgot your password?</a>

                            {error && <div className="auth-error">{error}</div>}

                            <button type="submit" className="auth-submit-btn">SIGN IN</button>
                        </form>
                    </div>
                </div>

                {/* Right Side: Green Panel */}
                <div className="auth-panel auth-panel-side">
                    <div className="auth-overlay-content">
                        <h2>Hello, Friend!</h2>
                        <p>Enter your personal details and start journey with us</p>
                        <button className="auth-ghost-btn" onClick={() => navigate("/signup")}>
                            SIGN UP
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SignIn;
