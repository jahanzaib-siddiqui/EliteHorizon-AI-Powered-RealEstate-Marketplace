import React, { useState, useEffect, useRef } from 'react';
import {
  FaHome, FaBuilding, FaLayerGroup, FaStore,
  FaMapMarkerAlt, FaChartLine, FaLeaf, FaCity,
  FaTrophy, FaBrain, FaKey, FaCheckCircle,
  FaExclamationTriangle, FaPercentage, FaArrowUp
} from 'react-icons/fa';
import Footer from '../components/Footer';
import './InvestmentScore.css';

const API_URL = import.meta.env.VITE_ML_API_URL;

const PROPERTY_TYPES = [
  { key: 'house',      icon: <FaHome />,      name: 'House',      subtype: 'house',            canRent: true  },
  { key: 'plot',       icon: <FaLayerGroup />, name: 'Plot',       subtype: 'residential plot', canRent: false },
  { key: 'commercial', icon: <FaStore />,     name: 'Commercial', subtype: 'office',           canRent: false },
];

const LAHORE_ZONES = [
  'DHA Defence', 'Bahria Town', 'Gulberg', 'Model Town', 'Johar Town',
  'Garden Town', 'Cantt', 'Wapda Town', 'Faisal Town', 'Valencia', 'Other'
];

const ISLAMABAD_ZONES = [
  'F-7 / F-6', 'F-10 / F-11', 'E-7 / E-11', 'G-10 / G-11', 'Blue Area',
  'DHA', 'Bahria Enclave', 'I-8 / I-10', 'G-13 / I-14', 'Other'
];

const KARACHI_ZONES    = ['Clifton', 'DHA Defence', 'PECHS', 'Gulshan-e-Iqbal', 'North Nazimabad', 'Bahria Town', 'Korangi', 'Scheme 33', 'Other'];
const MULTAN_ZONES     = ['DHA Multan', 'Cantt', 'Gulgasht', 'Wapda Town', 'New Multan', 'Mumtazabad', 'Bosan Road', 'Other'];
const PESHAWAR_ZONES   = ['Hayatabad', 'Cantt', 'University Town', 'Bahria Town', 'Askari', 'Gulbahar', 'Ring Road', 'Kohat Road', 'Other'];
const SIALKOT_ZONES    = ['Cantt', 'Iqbal Town', 'Gulshan Colony', 'Satellite Town', 'Green Town', 'Paris Road', 'Other'];
const FAISALABAD_ZONES = ['Gulberg', 'Canal Road', 'Madina Town', 'Peoples Colony', 'Jinnah Town', 'DHA Faisalabad', 'Susan Road', 'Millat Road', 'Other'];

const CITY_ZONES = {
  lahore:     LAHORE_ZONES,
  islamabad:  ISLAMABAD_ZONES,
  karachi:    KARACHI_ZONES,
  multan:     MULTAN_ZONES,
  peshawar:   PESHAWAR_ZONES,
  sialkot:    SIALKOT_ZONES,
  faisalabad: FAISALABAD_ZONES,
};

const ALL_CITIES = [
  { key: 'lahore',     label: 'Lahore'     },
  { key: 'islamabad',  label: 'Islamabad'  },
  { key: 'karachi',    label: 'Karachi'    },
  { key: 'multan',     label: 'Multan'     },
  { key: 'peshawar',   label: 'Peshawar'   },
  { key: 'sialkot',    label: 'Sialkot'    },
  { key: 'faisalabad', label: 'Faisalabad' },
];

function ScoreGauge({ score, tier }) {
  const radius = 90;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const tierColor = {
    prime: '#10b981',
    good: '#16a34a',
    fair: '#f59e0b',
    below_average: '#f97316',
    avoid: '#ef4444',
  }[tier] || '#10b981';

  return (
    <div className="is-gauge-wrapper">
      <svg width="240" height="150" viewBox="0 0 240 150" style={{ display: 'block', margin: '0 auto' }}>
        {/* Track arc */}
        <path
          d="M 30 130 A 90 90 0 0 1 210 130"
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Score arc */}
        <path
          d="M 30 130 A 90 90 0 0 1 210 130"
          fill="none"
          stroke={tierColor}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
        />
        {/* 0 label */}
        <text x="22" y="148" fontSize="11" fontWeight="600" fill="rgba(255,255,255,0.5)" textAnchor="middle">0</text>
        {/* 100 label */}
        <text x="218" y="148" fontSize="11" fontWeight="600" fill="rgba(255,255,255,0.5)" textAnchor="middle">100</text>
        {/* Tier color dot in center */}
        <circle cx="120" cy="108" r="5" fill={tierColor} opacity="0.8" />
      </svg>
    </div>
  );
}


export default function InvestmentScore() {
  const [step, setStep] = useState(1); // 1: Input form, 2: Processing, 3: Results
  const [city, setCity] = useState('lahore');
  const [propType, setPropType] = useState(PROPERTY_TYPES[0]);
  const [area, setArea] = useState('');
  const [areaUnit, setAreaUnit] = useState('marla');
  const [locationZone, setLocationZone] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [procStep, setProcStep] = useState('');
  const [apiStatus, setApiStatus] = useState('ok');
  
  const [result, setResult] = useState(null);
  const [displayScore, setDisplayScore] = useState(0);

  // Initialize location zone based on city selection
  useEffect(() => {
    const zones = CITY_ZONES[city] || LAHORE_ZONES;
    setLocationZone(zones[0]);
  }, [city]);

  // Check API health on mount
  useEffect(() => {
    fetch(`${API_URL}/api/health`)
      .then((res) => res.json())
      .then(() => setApiStatus('ok'))
      .catch(() => setApiStatus('offline'));
  }, []);

  // Score counter animation
  useEffect(() => {
    if (step === 3 && result && result.score) {
      let current = 0;
      const target = result.score;
      const duration = 1500; // ms
      const stepTime = Math.max(Math.floor(duration / target), 15);
      
      const timer = setInterval(() => {
        current += 1;
        if (current >= target) {
          setDisplayScore(target);
          clearInterval(timer);
        } else {
          setDisplayScore(current);
        }
      }, stepTime);

      return () => clearInterval(timer);
    }
  }, [step, result]);

  const runAnalysis = async () => {
    if (!area || isNaN(area) || parseFloat(area) <= 0) {
      setError('Please enter a valid area size.');
      return;
    }
    setError('');
    setStep(2);
    setLoading(true);

    const steps = [
      'Loading Random Forest model...',
      'Computing location premium...',
      'Calculating demand factors...',
      'Generating investment score...'
    ];

    // Simulate progress animation
    for (let i = 0; i < steps.length; i++) {
      setProcStep(steps[i]);
      await new Promise((res) => setTimeout(res, 750));
    }

    try {
      const res = await fetch(`${API_URL}/api/investment-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          area: parseFloat(area),
          area_unit: areaUnit,
          city,
          location_zone: locationZone,
          property_type: propType.subtype,
        })
      });

      const data = await res.json();
      if (data.success) {
        setResult(data);
        setStep(3);
      } else {
        setError(data.error || 'Server error. Please try again.');
        setStep(1);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to connect to the prediction server. Please make sure the backend is running.');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const resetWizard = () => {
    setArea('');
    setStep(1);
    setResult(null);
    setDisplayScore(0);
  };

  return (
    <div className="is-page">
      {/* Hero Section */}
      <header className="is-hero">
        <div className="is-hero-orb is-hero-orb-1" />
        <div className="is-hero-orb is-hero-orb-2" />
        
        <div className="is-hero-badge">
          <span className="is-hero-stat-dot" style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: apiStatus === 'ok' ? '#10b981' : '#ef4444', marginRight: '8px' }} />
          {apiStatus === 'ok' ? 'AI Engine Online' : 'AI Engine Offline'}
        </div>
        
        <h1>AI-Powered <span>Investment Score</span></h1>
        <p>
          Leverage our Random Forest model to calculate property growth potentials, rental yields, and zone premiums in real time.
        </p>

        <div className="is-hero-stats">
          <div className="is-hero-stat">
            <div className="is-hero-stat-num">7,374</div>
            <div className="is-hero-stat-label">Properties Trained</div>
          </div>
          <div className="is-hero-stat">
            <div className="is-hero-stat-num">RF <span>Model</span></div>
            <div className="is-hero-stat-label">Random Forest Regressor</div>
          </div>
          <div className="is-hero-stat">
            <div className="is-hero-stat-num">98.3%</div>
            <div className="is-hero-stat-label">Model Accuracy</div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="is-main">
        <div className="is-wizard-card">
          {/* Progress Indicator */}
          <div className="is-progress-bar">
            <div className="is-progress-step">
              <div className={`is-step-circle ${step >= 1 ? (step > 1 ? 'done' : 'active') : ''}`}>
                {step > 1 ? '✓' : '1'}
              </div>
              <span className={`is-step-label ${step === 1 ? 'active' : ''}`}>Property Details</span>
              <div className={`is-step-line ${step > 1 ? 'done' : ''}`} />
            </div>

            <div className="is-progress-step">
              <div className={`is-step-circle ${step >= 2 ? (step > 2 ? 'done' : 'active') : ''}`}>
                {step > 2 ? '✓' : '2'}
              </div>
              <span className={`is-step-label ${step === 2 ? 'active' : ''}`}>AI Processing</span>
              <div className={`is-step-line ${step > 2 ? 'done' : ''}`} />
            </div>

            <div className="is-progress-step">
              <div className={`is-step-circle ${step === 3 ? 'active' : ''}`}>3</div>
              <span className={`is-step-label ${step === 3 ? 'active' : ''}`}>Investment Score</span>
            </div>
          </div>

          <div className="is-step-body">
            {/* STEP 1: Input Form */}
            {step === 1 && (
              <div>
                <h3 className="is-step-title">Analyze Property Potential</h3>
                <p className="is-step-sub">Provide the physical parameters of the property to evaluate its investment value.</p>
                
                {error && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaExclamationTriangle />
                    <span>{error}</span>
                  </div>
                )}

                <div className="is-form-grid">
                  {/* City Select */}
                  <div className="is-field">
                    <label>Select City</label>
                    <div className="is-city-cards">
                      {ALL_CITIES.map(({ key, label }) => (
                        <div
                          key={key}
                          className={`is-city-card ${city === key ? 'active' : ''}`}
                          onClick={() => setCity(key)}
                        >
                          <FaCity className="is-city-card-icon" />
                          <span className="is-city-card-name">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Property Type */}
                  <div className="is-field">
                    <label>Property Type</label>
                    <div className="is-type-grid">
                      {PROPERTY_TYPES.map((t) => (
                        <div
                          key={t.key}
                          className={`is-type-card ${propType.key === t.key ? 'active' : ''}`}
                          onClick={() => setPropType(t)}
                        >
                          <div className="is-type-icon">{t.icon}</div>
                          <span className="is-type-name">{t.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Location Area Chips */}
                  <div className="is-field">
                    <label>Select Sector / Zone</label>
                    <div className="is-location-chips">
                      {(CITY_ZONES[city] || LAHORE_ZONES).map((z) => (
                        <div
                          key={z}
                          className={`is-location-chip ${locationZone === z ? 'active' : ''}`}
                          onClick={() => setLocationZone(z)}
                        >
                          {z}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Area input */}
                  <div className="is-field">
                    <label>Property Size</label>
                    <div className="is-area-row">
                      <input
                        type="number"
                        className="is-input"
                        placeholder="Enter size e.g. 5, 10, 1"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        min="1"
                      />
                      <select
                        className="is-input"
                        value={areaUnit}
                        onChange={(e) => setAreaUnit(e.target.value)}
                      >
                        <option value="marla">Marla</option>
                        <option value="kanal">Kanal</option>
                        <option value="sqft">Sq. Ft.</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="is-nav-buttons">
                  <button 
                    className="is-btn is-btn-primary" 
                    onClick={runAnalysis}
                  >
                    <FaBrain />
                    Calculate AI Investment Score
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Processing */}
            {step === 2 && (
              <div className="is-processing">
                <div className="is-proc-spinner">
                  <div className="is-proc-ring-outer" />
                  <div className="is-proc-ring-inner" />
                  <div className="is-proc-icon">
                    <FaBrain />
                  </div>
                </div>
                <h3>Evaluating Investment Metrics</h3>
                <p className="is-proc-text">{procStep}</p>
              </div>
            )}

            {/* STEP 3: Results */}
            {step === 3 && result && (
              <div className="is-results">
                {/* Score Arc Card */}
                <div className="is-score-card">
                  {/* Gauge + number stacked in a relative wrapper */}
                  <div className="is-gauge-stack">
                    <ScoreGauge score={result.score} tier={result.tier} />
                    <div className="is-score-center">
                      <div className="is-score-number">{Math.round(displayScore)}</div>
                      <span className="is-score-max">out of 100</span>
                    </div>
                  </div>

                  <div className="is-verdict-badge" style={{
                    backgroundColor: {
                      prime: '#10b981', good: '#16a34a', fair: '#f59e0b',
                      below_average: '#f97316', avoid: '#ef4444'
                    }[result.tier] || '#10b981',
                    color: 'white'
                  }}>
                    {result.verdict}
                  </div>

                  <div className="is-formula-box">
                    {result.formula}
                  </div>
                </div>

                {/* Score Breakdown and Comparisons Grid */}
                <div className="is-cards-grid">
                  {/* Breakdown Card */}
                  <div className="is-card">
                    <h4 className="is-card-title">
                      <FaChartLine className="is-card-title-icon" />
                      Composite Parameter Weights
                    </h4>
                    
                    <div className="is-breakdown-list">
                      {[
                        { label: 'Random Forest Model Score', key: 'rf_score', icon: <FaBrain />, color: '#10b981' },
                        { label: 'Location Premium', key: 'location_score', icon: <FaMapMarkerAlt />, color: '#16a34a' },
                        { label: 'Market Demand Weight', key: 'demand_score', icon: <FaChartLine />, color: '#f59e0b' },
                        { label: 'Est. Rental Yield Potential', key: 'yield_score', icon: <FaPercentage />, color: '#f97316' },
                        { label: 'Overall Market Trends', key: 'market_score', icon: <FaArrowUp />, color: '#ef4444' },
                      ].map((item) => (
                        <div key={item.key} className="is-breakdown-item">
                          <div className="is-breakdown-row">
                            <span className="is-breakdown-name">
                              {item.icon}
                              {item.label}
                            </span>
                            <span className="is-breakdown-val">{result.breakdown[item.key]}%</span>
                          </div>
                          <div className="is-breakdown-track">
                            <div 
                              className="is-breakdown-fill" 
                              style={{ 
                                width: `${result.breakdown[item.key]}%`,
                                backgroundColor: item.color 
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Comparison Card */}
                  <div className="is-card">
                    <h4 className="is-card-title">
                      <FaTrophy className="is-card-title-icon" />
                      Comparative Index
                    </h4>

                    <div className="is-comp-list">
                      <div className="is-comp-item">
                        <div className="is-comp-label">
                          <span>Your Selection</span>
                          <span>{result.score}</span>
                        </div>
                        <div className="is-comp-track">
                          <div 
                            className="is-comp-fill" 
                            style={{ 
                              width: `${result.score}%`,
                              background: 'linear-gradient(90deg, #10b981, #34d399)'
                            }}
                          />
                        </div>
                      </div>

                      <div className="is-comp-item">
                        <div className="is-comp-label">
                          <span>City Average</span>
                          <span>{result.comparisons.city_average}</span>
                        </div>
                        <div className="is-comp-track">
                          <div 
                            className="is-comp-fill" 
                            style={{ 
                              width: `${result.comparisons.city_average}%`,
                              backgroundColor: '#94a3b8' 
                            }}
                          />
                        </div>
                      </div>

                      <div className="is-comp-item">
                        <div className="is-comp-label">
                          <span>Top Zone Benchmark</span>
                          <span>{result.comparisons.top_zone}</span>
                        </div>
                        <div className="is-comp-track">
                          <div 
                            className="is-comp-fill" 
                            style={{ 
                              width: `${result.comparisons.top_zone}%`,
                              backgroundColor: '#fbbf24' 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Property Specification Details */}
                <div className="is-card">
                  <h4 className="is-card-title">
                    <FaCheckCircle className="is-card-title-icon" />
                    Property Profile Summary
                  </h4>

                  <div className="is-details-grid">
                    <div className="is-details-item">
                      <span className="is-details-label">Target City</span>
                      <span className="is-details-val" style={{ textTransform: 'capitalize' }}>{result.details.city}</span>
                    </div>
                    <div className="is-details-item">
                      <span className="is-details-label">Sector / Zone</span>
                      <span className="is-details-val">{result.details.location_zone}</span>
                    </div>
                    <div className="is-details-item">
                      <span className="is-details-label">Property Class</span>
                      <span className="is-details-val" style={{ textTransform: 'capitalize' }}>{result.details.property_type}</span>
                    </div>
                    <div className="is-details-item">
                      <span className="is-details-label">Physical Size</span>
                      <span className="is-details-val">{area} {areaUnit} ({result.details.area_sqft.toLocaleString()} Sq. Ft.)</span>
                    </div>
                    <div className="is-details-item">
                      <span className="is-details-label">AI Engine Model</span>
                      <span className="is-details-val">{result.model_info.algorithm}</span>
                    </div>
                    <div className="is-details-item">
                      <span className="is-details-label">Model Accuracy (R²)</span>
                      <span className="is-details-val">{(result.model_info.r2 * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                {/* CTAs */}
                <div className="is-cta-row">
                  <button className="is-btn is-btn-secondary" onClick={() => setStep(1)}>
                    Adjust Input Details
                  </button>
                  <button className="is-btn is-btn-primary" onClick={resetWizard}>
                    New Analysis
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
