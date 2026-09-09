import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfileDropdown.css";

const ProfileDropdown = ({ user, handleLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const navigate = useNavigate();

    // Edit form state
    const [formData, setFormData] = useState({
        name: user?.name || "",
        monthlyIncome: user?.monthlyIncome || 0,
        bankBalance: user?.bankBalance || 0,
        avatar: user?.avatar || "/avatar_male_1_1772875227901.png"
    });
    const [error, setError] = useState("");

    const avatars = [
        "/avatar_male_1_new_1772877387882.png",
        "/avatar_male_2_new_1772877402690.png",
        "/avatar_female_1_new_1772877416477.png",
        "/avatar_female_2_new_1772877431449.png"
    ];

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
        if (!isOpen) { // Reset edit state when reopening
            setIsEditing(false);
            setFormData({
                name: user?.name || "",
                monthlyIncome: user?.monthlyIncome || 0,
                bankBalance: user?.bankBalance || 0,
                avatar: user?.avatar || avatars[0]
            })
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAvatarSelect = (img) => {
        setFormData({ ...formData, avatar: img });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/update`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: user.id,
                    ...formData
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to update profile");
            }

            // Update local storage and force re-render (or trigger parent update)
            localStorage.setItem("user", JSON.stringify(data.user));
            setIsEditing(false);
            window.location.reload(); // Simple way to refresh Navbar data globally
        } catch (err) {
            setError(err.message);
        }
    };

    if (!user) return null;

    return (
        <div className="profile-wrapper">
            {/* Header Button */}
            <div className="profile-header-trigger" onClick={toggleDropdown}>
                <img src={user.avatar || avatars[0]} alt="Avatar" className="profile-avatar-small" />
                <span className="profile-name-text">{user.name}</span>
            </div>

            {/* Dropdown Box */}
            {isOpen && (
                <div className="profile-dropdown">
                    {!isEditing ? (
                        <>
                            {/* View Mode */}
                            <div className="profile-info-header">
                                <img src={user.avatar || avatars[0]} alt="Avatar" className="profile-avatar-large" />
                                <h3>{user.name}</h3>
                                <p className="profile-email">{user.email}</p>
                                {user.role === "seller" && (
                                    <button 
                                        onClick={() => { setIsOpen(false); navigate("/seller-dashboard"); }}
                                        style={{ 
                                            marginTop: '12px', 
                                            padding: '6px 12px', 
                                            backgroundColor: '#e8f5e9', 
                                            color: '#16a34a', 
                                            border: '1px solid #16a34a', 
                                            borderRadius: '6px', 
                                            cursor: 'pointer', 
                                            fontWeight: '600',
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                            <line x1="3" y1="9" x2="21" y2="9"></line>
                                            <line x1="9" y1="21" x2="9" y2="9"></line>
                                        </svg>
                                        Seller Dashboard
                                    </button>
                                )}
                                {user.role === "buyer" && (
                                    <button 
                                        onClick={() => { setIsOpen(false); navigate("/buyer-dashboard"); }}
                                        style={{ 
                                            marginTop: '12px', 
                                            padding: '6px 12px', 
                                            backgroundColor: '#eff6ff', 
                                            color: '#2563eb', 
                                            border: '1px solid #2563eb', 
                                            borderRadius: '6px', 
                                            cursor: 'pointer', 
                                            fontWeight: '600',
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                                        </svg>
                                        Buyer Dashboard
                                    </button>
                                )}
                            </div>

                            <div className="profile-details-grid">
                                <div className="detail-item">
                                    <span className="detail-label">Monthly Income</span>
                                    <span className="detail-value">PKR {user.monthlyIncome || 0}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Bank Balance</span>
                                    <span className="detail-value">PKR {user.bankBalance || 0}</span>
                                </div>
                            </div>

                            <div className="profile-actions">
                                <button className="edit-btn" onClick={() => setIsEditing(true)}>Edit Profile</button>
                                <button className="logout-btn" onClick={handleLogout}>Logout</button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Edit Mode */}
                            <form className="profile-edit-form" onSubmit={handleUpdate}>
                                <h3>Edit Profile</h3>

                                <label>Choose Avatar:</label>
                                <div className="avatar-selection-grid">
                                    {avatars.map((img, idx) => (
                                        <img
                                            key={idx}
                                            src={img}
                                            alt={`Avatar ${idx + 1}`}
                                            className={`avatar-choice ${formData.avatar === img ? 'selected' : ''}`}
                                            onClick={() => handleAvatarSelect(img)}
                                        />
                                    ))}
                                </div>

                                <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} required />
                                <input type="number" name="monthlyIncome" placeholder="Monthly Income" value={formData.monthlyIncome} onChange={handleChange} />
                                <input type="number" name="bankBalance" placeholder="Bank Balance" value={formData.bankBalance} onChange={handleChange} />

                                {error && <div className="profile-error">{error}</div>}

                                <div className="profile-actions-edit">
                                    <button type="button" className="cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                                    <button type="submit" className="save-btn">Save Changes</button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProfileDropdown;
