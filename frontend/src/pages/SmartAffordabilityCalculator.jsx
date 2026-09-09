import React, { useState, useMemo, useEffect } from 'react';
import PropertySlider from '../components/PropertySlider';
import { searchProperties } from '../services/api';
import { FaBrain, FaRegLightbulb, FaSearchLocation, FaQuestionCircle } from 'react-icons/fa';
import './SmartAffordabilityCalculator.css';

function SmartAffordabilityCalculator() {
    const [monthlyIncome, setMonthlyIncome] = useState(300000);
    const [monthlyExpenses, setMonthlyExpenses] = useState(100000);
    const [availableSavings, setAvailableSavings] = useState(2000000);
    const [advisorLoanTerm, setAdvisorLoanTerm] = useState(5);
    const [city, setCity] = useState('All');

    const [recommendedProperties, setRecommendedProperties] = useState([]);
    const [purpose, setPurpose] = useState('Buy');

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const calculations = useMemo(() => {
        const disposableIncome = Math.max(0, monthlyIncome - monthlyExpenses);
        // Safe rule: Max 40% of disposable income goes to installment
        const safeMonthlyPayment = disposableIncome * 0.40;

        const r = (12 / 100) / 12; // Assuming fixed 12% market rate
        const n = advisorLoanTerm * 12;

        let maxPrincipal = 0;
        if (r > 0 && safeMonthlyPayment > 0) {
            maxPrincipal = safeMonthlyPayment * ((Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n)));
        } else if (safeMonthlyPayment > 0) {
            maxPrincipal = safeMonthlyPayment * n;
        }

        const maxAffordableProperty = maxPrincipal + availableSavings;

        return {
            disposableIncome,
            safeMonthlyPayment,
            maxPrincipal,
            maxAffordableProperty,
            availableSavings
        };
    }, [monthlyIncome, monthlyExpenses, availableSavings, advisorLoanTerm]);

    // Fetch properties dynamically based on the affordability cap
    useEffect(() => {
        // Debounce or directly fetch based on the calculated limit
        const filters = { purpose, limit: 500 };
        if (city !== 'All') {
            filters.city = city.toLowerCase();
        }
        
        if (calculations.maxAffordableProperty > 0) {
            if (purpose === 'Rent') {
                filters.maxPrice = calculations.safeMonthlyPayment;
            } else {
                filters.maxPrice = calculations.maxAffordableProperty;
            }
        }

        searchProperties(filters)
            .then(res => setRecommendedProperties(res.data || []))
            .catch(err => console.log(err));
    }, [city, purpose, calculations.maxAffordableProperty, calculations.safeMonthlyPayment]);

    const affordableProperties = useMemo(() => {
        if (purpose === 'Rent') {
            return recommendedProperties.filter(prop =>
                prop.rentPrice > 0 && prop.rentPrice <= calculations.safeMonthlyPayment
            );
        }
        if (calculations.maxAffordableProperty > 0) {
            return recommendedProperties.filter(prop => prop.price > 0 && prop.price <= calculations.maxAffordableProperty);
        }
        return [];
    }, [recommendedProperties, calculations.maxAffordableProperty, calculations.safeMonthlyPayment, purpose]);

    return (
        <div className="calculator-wrapper" style={{ background: '#f8fafc' }}>
            <div className="calculator-container">

                <div className="calculator-header">
                    <h1>AI Affordability Advisor</h1>
                    <p>
                        Let our AI determine exactly how much house you can securely afford based on your real income and automatically find matching properties.
                    </p>
                </div>

                <div className="calculator-content">

                    <div className="input-section ai-advisor-inputs">
                        <h3 style={{ marginBottom: '10px', color: '#1e293b', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaBrain style={{ color: '#10b981', fontSize: '1.4rem' }} /> Tell us about your finances
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '0 0 25px 0' }}>We securely calculate your purchasing power using a conservative 40% DTI (Debt-to-Income) matrix.</p>

                        <div className="input-group">
                            <div className="input-label">
                                <label>Total Monthly Income</label>
                                <span className="highlight-text">{formatCurrency(monthlyIncome)}</span>
                            </div>
                            <input type="range" className="range-slider advisor-slider" min="50000" max="2000000" step="10000" value={monthlyIncome} onChange={e => setMonthlyIncome(Number(e.target.value))} />
                        </div>

                        <div className="input-group">
                            <div className="input-label">
                                <label>Total Monthly Expenses</label>
                                <span className="highlight-text-red">{formatCurrency(monthlyExpenses)}</span>
                            </div>
                            <input type="range" className="range-slider expense-slider" min="0" max="1000000" step="5000" value={monthlyExpenses} onChange={e => setMonthlyExpenses(Number(e.target.value))} />
                        </div>

                        <div className="input-group">
                            <div className="input-label">
                                <label>Available Savings (Down Payment)</label>
                                <span className="highlight-text">{formatCurrency(availableSavings)}</span>
                            </div>
                            <input type="range" className="range-slider advisor-slider" min="0" max="50000000" step="100000" value={availableSavings} onChange={e => setAvailableSavings(Number(e.target.value))} />
                        </div>

                        <div className="input-group">
                            <div className="input-label">
                                <label>Desired Ownership Timeline</label>
                                <span>{advisorLoanTerm} Years</span>
                            </div>
                            <input type="range" className="range-slider advisor-slider" min="1" max="5" step="1" value={advisorLoanTerm} onChange={(e) => setAdvisorLoanTerm(Number(e.target.value))} />
                        </div>

                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <div className="input-label">
                                <label>Preferred City</label>
                            </div>
                            <select 
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '10px', fontSize: '1rem', background: '#fff' }} 
                                value={city} 
                                onChange={(e) => setCity(e.target.value)}
                            >
                                <option value="All">All Cities</option>
                                <option value="Lahore">Lahore</option>
                                <option value="Islamabad">Islamabad</option>
                                <option value="Karachi">Karachi</option>
                                <option value="Multan">Multan</option>
                                <option value="Peshawar">Peshawar</option>
                                <option value="Sialkot">Sialkot</option>
                                <option value="Faisalabad">Faisalabad</option>
                            </select>
                        </div>

                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <div className="input-label">
                                <label>Looking To</label>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                {['Buy', 'Rent'].map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPurpose(p)}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: `2px solid ${purpose === p ? '#10b981' : '#cbd5e1'}`,
                                            background: purpose === p ? '#10b981' : '#fff',
                                            color: purpose === p ? '#fff' : '#334155',
                                            fontWeight: 600,
                                            fontSize: '0.95rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        {p === 'Buy' ? '🏠 Buy' : '🔑 Rent'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="results-section advisor-results">
                        <div className="advisor-tag"><FaRegLightbulb style={{ marginRight: '6px' }}/> AI Recommendation</div>

                        <div className="monthly-result advisor-card">
                            <h3>Max Affordable Property</h3>
                            <div className="amount highlight">{formatCurrency(calculations.maxAffordableProperty < 0 ? 0 : calculations.maxAffordableProperty)}</div>
                            <div className="advisor-rationale">
                                Based on a safe <strong>40% DTI ratio</strong> over {advisorLoanTerm} years.
                            </div>
                        </div>

                        <div className="result-breakdown advisor-breakdown">
                            <div className="breakdown-item">
                                <div className="breakdown-label">Disposable Income</div>
                                <div className="breakdown-value">{formatCurrency(calculations.disposableIncome)} /mo</div>
                            </div>
                            <div className="breakdown-item">
                                <div className="breakdown-label">Safe Installment Cap</div>
                                <div className="breakdown-value checkmark">{formatCurrency(calculations.safeMonthlyPayment)} /mo</div>
                            </div>
                            <div className="breakdown-item total-payment">
                                <div className="breakdown-label">Supported Loan Amount</div>
                                <div className="breakdown-value">{formatCurrency(calculations.maxPrincipal)}</div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <div className="advisor-recommendations-wrapper" style={{ padding: '0 20px 60px 20px', maxWidth: '1200px', margin: '0 auto' }}>
                <div className="recommendations-header">
                    <h2>{purpose === 'Rent' ? 'Rentals Within Your Monthly Budget' : 'Properties You Can Safely Afford'}</h2>
                    <p>{purpose === 'Rent'
                        ? `Showing commercial & residential rentals with monthly rent ≤ your safe installment cap of PKR ${calculations.safeMonthlyPayment.toLocaleString()}.`
                        : 'Our AI selected these properties because their projected monthly installments fall strictly within your safety threshold.'
                    }</p>
                </div>

                {affordableProperties.length > 0 ? (
                    <PropertySlider properties={affordableProperties} />
                ) : (
                    <div className="no-recommendations">
                        <FaSearchLocation className="emoji-icon" style={{ fontSize: '3rem', color: '#94a3b8', marginBottom: '16px' }} />
                        <h3>No direct matches found just yet.</h3>
                        <p>Try increasing your ownership timeline or available savings to expand your purchasing power.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SmartAffordabilityCalculator;
