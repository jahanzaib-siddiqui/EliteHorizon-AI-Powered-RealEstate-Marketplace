import React, { useState, useRef, useEffect } from "react";
import { FaChevronDown, FaWaveSquare, FaQuestionCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./KnowMoreDropdown.css";

const KnowMoreDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    return (
        <li className="know-more-container" ref={dropdownRef}>
            <div className="know-more-trigger" onClick={toggleDropdown}>
                Know More <FaChevronDown className={`chevron-icon ${isOpen ? 'open' : ''}`} />
            </div>

            {isOpen && (
                <div className="know-more-dropdown shadow-lg">
                    {/* Item 1: How it Works */}
                    <div className="dropdown-item" onClick={() => { navigate('#'); setIsOpen(false); }}>
                        <div className="icon-wrapper">
                            <FaWaveSquare className="menu-icon" />
                        </div>
                        <div className="item-content">
                            <h4>How it works</h4>
                            <p>Explore how fractional investments work with Elite Horizon. Learn through our step-by-step guide and enjoy a seamless investment experience.</p>
                        </div>
                    </div>

                    <div className="dropdown-divider"></div>

                    {/* Item 2: FAQs */}
                    <div className="dropdown-item" onClick={() => { navigate('#'); setIsOpen(false); }}>
                        <div className="icon-wrapper">
                            <FaQuestionCircle className="menu-icon" />
                        </div>
                        <div className="item-content">
                            <h4>FAQs</h4>
                            <p>Find answers about Elite Horizon, how it works, and getting started on your journey.</p>
                        </div>
                    </div>

                    <div className="dropdown-divider"></div>

                    {/* Item 3: AI Price Prediction */}
                    <div className="dropdown-item" onClick={() => { navigate('/ai-price-prediction'); setIsOpen(false); }}>
                        <div className="icon-wrapper" style={{ background: 'linear-gradient(135deg, #064e3b, #10b981)', color: 'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem' }}>
                            🤖
                        </div>
                        <div className="item-content">
                            <h4 style={{ color: '#064e3b' }}>AI Price Prediction</h4>
                            <p>Get accurate property price estimates using our trained XGBoost machine learning model built on 3,000+ real listings.</p>
                        </div>
                    </div>
                </div>
            )}
        </li>
    );
};

export default KnowMoreDropdown;
