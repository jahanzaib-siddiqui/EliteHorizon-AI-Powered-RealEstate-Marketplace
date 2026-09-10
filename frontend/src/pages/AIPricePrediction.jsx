import React, { useState, useEffect, useRef } from 'react';
import Footer from '../components/Footer';
import {
  FaHome, FaBuilding, FaLayerGroup, FaStore,
  FaKey, FaHandHoldingHeart,
  FaTrophy, FaCity, FaUsers, FaChartLine, FaBrain,
  FaCheckCircle, FaExclamationTriangle
} from 'react-icons/fa';
import { MdOutlineOtherHouses } from 'react-icons/md';
import './AIPricePrediction.css';

const API_URL = import.meta.env.VITE_ML_API_URL;

/* ── Format PKR ── */
const fmtPKR = (v) => {
  if (!v) return 'N/A';
  if (v >= 10_000_000) return `Rs ${(v / 10_000_000).toFixed(2)} Cr`;
  if (v >= 100_000)    return `Rs ${(v / 100_000).toFixed(2)} Lac`;
  return `Rs ${v.toLocaleString()}`;
};

/* ── Property Types ── */
const PROPERTY_TYPES = [
  { key: 'house',      icon: 'house',      name: 'House / Home',  desc: 'Residential houses, villas & apartments', subtype: 'house',            canRent: true  },
  { key: 'plot',       icon: 'plot',       name: 'Plot / Land',   desc: 'Residential & commercial plots',          subtype: 'residential plot', canRent: false },
  { key: 'commercial', icon: 'commercial', name: 'Commercial',    desc: 'Offices, shops & buildings',              subtype: 'office',           canRent: true  },
];

/* ── Location zones ── */
const LAHORE_ZONES     = ['DHA Defence', 'Bahria Town', 'Gulberg', 'Model Town', 'Johar Town', 'Garden Town', 'Cantt', 'Wapda Town', 'Faisal Town', 'Valencia', 'Other'];
const ISLAMABAD_ZONES  = ['F-7 / F-6', 'F-10 / F-11', 'E-7 / E-11', 'G-10 / G-11', 'Blue Area', 'DHA', 'Bahria Enclave', 'I-8 / I-10', 'G-13 / I-14', 'Other'];
const KARACHI_ZONES    = ['Clifton', 'DHA Defence', 'PECHS', 'Gulshan-e-Iqbal', 'North Nazimabad', 'Bahria Town', 'Korangi', 'Scheme 33', 'Other'];
const MULTAN_ZONES     = ['DHA Multan', 'Cantt', 'Gulgasht', 'Wapda Town', 'New Multan', 'Mumtazabad', 'Bosan Road', 'Other'];
const PESHAWAR_ZONES   = ['Hayatabad', 'Cantt', 'University Town', 'Bahria Town', 'Askari', 'Gulbahar', 'Ring Road', 'Kohat Road', 'Other'];
const SIALKOT_ZONES    = ['Cantt', 'Iqbal Town', 'Gulshan Colony', 'Satellite Town', 'Green Town', 'Paris Road', 'Other'];
const FAISALABAD_ZONES = ['Gulberg', 'Canal Road', 'Madina Town', 'Peoples Colony', 'Jinnah Town', 'DHA Faisalabad', 'Susan Road', 'Millat Road', 'Other'];

/* ── Edu Accordion data ── */
const EDU_ITEMS = [
  {
    step: '01',
    title: 'Data Collection & Cleaning',
    subtitle: '3,000+ real zameen.com properties',
    content: (
      <div>
        <p>Our dataset contains <strong>7,374 real property listings</strong> scraped from zameen.com across Lahore and Islamabad. Raw data is messy — it contains missing values, inconsistent area units (marla, kanal, sqft), and extreme outlier prices.</p>
        <p>We clean it by: (1) converting all areas to square feet, (2) dropping rows with no price or area, (3) filling missing bedrooms/bathrooms with the column median, (4) removing statistical outliers using the <strong>IQR (Interquartile Range)</strong> method.</p>
        <div className="ai-pipeline">
          {['📥 Raw CSVs','→','🧹 Drop Nulls','→','📐 Normalize Area','→','🗑️ Remove Outliers','→','✅ Clean Data'].map((s,i) => (
            s === '→'
              ? <span key={i} className="ai-pipeline-arrow">→</span>
              : <div key={i} className="ai-pipeline-step">
                  <div className="ai-pipeline-step-icon">{s.split(' ')[0]}</div>
                  <div className="ai-pipeline-step-text">{s.split(' ').slice(1).join(' ')}</div>
                </div>
          ))}
        </div>
        <p><strong>IQR Outlier Rule:</strong> Any price below Q1 − 1.5×IQR or above Q3 + 1.5×IQR is removed as an extreme outlier that would hurt training.</p>
      </div>
    ),
  },
  {
    step: '02',
    title: 'Feature Engineering',
    subtitle: 'Turning raw data into model inputs',
    content: (
      <div>
        <p><strong>Feature Engineering</strong> is the process of transforming raw data into numerical inputs the model can understand. Machines can't process text like "DHA Lahore" — we must convert it to numbers.</p>
        <p>Features we engineered for this project:</p>
        <ul style={{paddingLeft:'20px', color:'#475569', fontSize:'0.88rem', lineHeight:'1.8'}}>
          <li><strong>area_sqft</strong>: Area normalized to square feet (1 marla = 272.25 sqft, 1 kanal = 5445 sqft)</li>
          <li><strong>city_encoded</strong>: Lahore → 0, Islamabad → 1 (Label Encoding)</li>
          <li><strong>ptype_encoded</strong>: house=0, flat=1, upper portion=2 … (ordinal encoding)</li>
          <li><strong>location_score</strong>: 1–5 premium score based on zone (DHA/Gulberg=4, others=2) — captures location value without creating thousands of dummy columns</li>
        </ul>
        <div className="ai-code-block">
          <span className="cm"># Area Normalization</span>{'\n'}
          <span className="kw">def</span> <span className="fn">normalize_area</span>(area, unit):{'\n'}
          {'    '}<span className="kw">if</span> unit == <span className="st">'marla'</span>: <span className="kw">return</span> area * <span className="nm">272.25</span>{'\n'}
          {'    '}<span className="kw">if</span> unit == <span className="st">'kanal'</span>: <span className="kw">return</span> area * <span className="nm">5445.0</span>{'\n'}
          {'    '}<span className="kw">return</span> area  <span className="cm"># already sqft</span>
        </div>
      </div>
    ),
  },
  {
    step: '03',
    title: 'XGBoost Algorithm',
    subtitle: 'eXtreme Gradient Boosting — how it works',
    content: (
      <div>
        <p><strong>XGBoost (eXtreme Gradient Boosting)</strong> is an ensemble learning algorithm that combines hundreds of weak decision trees into one powerful predictor. It's the go-to model for tabular data in competitive ML due to its speed and accuracy.</p>
        <p><strong>Core Idea — Gradient Boosting:</strong></p>
        <ul style={{paddingLeft:'20px', color:'#475569', fontSize:'0.88rem', lineHeight:'1.8'}}>
          <li>Start with a simple prediction (e.g., mean price = Rs 25 Lac)</li>
          <li>Calculate residuals: <em>actual_price − prediction</em></li>
          <li>Train a decision tree to predict those residuals</li>
          <li>Add that tree's output (× learning_rate) to the prediction</li>
          <li>Repeat 400 times — each tree corrects the previous errors</li>
        </ul>
        <div className="ai-code-block">
          <span className="fn">XGBRegressor</span>({'\n'}
          {'    '}n_estimators=<span className="nm">400</span>,    <span className="cm"># 400 decision trees</span>{'\n'}
          {'    '}max_depth=<span className="nm">6</span>,          <span className="cm"># each tree max 6 levels deep</span>{'\n'}
          {'    '}learning_rate=<span className="nm">0.05</span>,   <span className="cm"># shrinkage: 5% contribution per tree</span>{'\n'}
          {'    '}subsample=<span className="nm">0.8</span>,        <span className="cm"># 80% rows sampled per tree</span>{'\n'}
          {'    '}colsample_bytree=<span className="nm">0.8</span>, <span className="cm"># 80% features per tree</span>{'\n'}
          {'    '}reg_alpha=<span className="nm">0.1</span>,        <span className="cm"># L1 regularization</span>{'\n'}
          {'    '}reg_lambda=<span className="nm">1.0</span>        <span className="cm"># L2 regularization</span>{'\n'}
          )
        </div>
        <p><strong>Regularization</strong> (L1 + L2) prevents overfitting — it penalizes overly complex models that memorize training data but fail on new inputs.</p>
      </div>
    ),
  },
  {
    step: '04',
    title: 'Train / Test Split',
    subtitle: '80% training, 20% testing — preventing overfitting',
    content: (
      <div>
        <p>Before training, we split our dataset into two non-overlapping parts using <strong>random_state=42</strong> for reproducibility:</p>
        <ul style={{paddingLeft:'20px', color:'#475569', fontSize:'0.88rem', lineHeight:'1.8'}}>
          <li><strong>Training Set (80%)</strong>: The model learns patterns from these 1,196 samples</li>
          <li><strong>Test Set (20%)</strong>: 299 samples the model <em>never sees during training</em> — used only to evaluate real-world performance</li>
        </ul>
        <p>This separation prevents <strong>data leakage</strong> — if we evaluated on training data, the model would score perfectly by memorization, not generalization.</p>
        <div className="ai-code-block">
          X_train, X_test, y_train, y_test = <span className="fn">train_test_split</span>({'\n'}
          {'    '}X, y, test_size=<span className="nm">0.20</span>, random_state=<span className="nm">42</span>{'\n'}
          ){'\n'}{'\n'}
          <span className="cm"># Train samples : 1,196</span>{'\n'}
          <span className="cm"># Test  samples :   299</span>
        </div>
      </div>
    ),
  },
  {
    step: '05',
    title: 'Model Evaluation Metrics',
    subtitle: 'MAE, RMSE, R² — measuring prediction quality',
    content: (
      <div>
        <p>We use three standard metrics to evaluate how well our model predicts prices on the test set:</p>
        <div className="ai-metrics-grid">
          <div className="ai-metric-box">
            <div className="ai-metric-box-name">R² Score</div>
            <div className="ai-metric-box-val">0.709</div>
            <div className="ai-metric-box-desc">70.9% variance explained</div>
          </div>
          <div className="ai-metric-box">
            <div className="ai-metric-box-name">MAE</div>
            <div className="ai-metric-box-val">~23.6M</div>
            <div className="ai-metric-box-desc">Avg error in PKR</div>
          </div>
          <div className="ai-metric-box">
            <div className="ai-metric-box-name">RMSE</div>
            <div className="ai-metric-box-val">~51.6M</div>
            <div className="ai-metric-box-desc">Penalizes big errors</div>
          </div>
        </div>
        <ul style={{paddingLeft:'20px', color:'#475569', fontSize:'0.88rem', lineHeight:'1.8', marginTop:'12px'}}>
          <li><strong>MAE (Mean Absolute Error)</strong>: Average of |actual − predicted|. Interpretable: "on average off by X PKR"</li>
          <li><strong>RMSE (Root Mean Squared Error)</strong>: √(mean of squared errors). Penalizes large errors more than MAE — useful when big misses are costly</li>
          <li><strong>R² (Coefficient of Determination)</strong>: 0=model is useless, 1=perfect. Our 0.71 means the model explains 70.9% of price variation — strong for real estate where many factors are unobservable</li>
        </ul>
      </div>
    ),
  },
  {
    step: '06',
    title: 'Feature Importance & Predictions',
    subtitle: 'What drives property prices?',
    content: (
      <div>
        <p>XGBoost calculates <strong>feature importance</strong> — how much each input feature contributed to reducing prediction error across all 400 trees. Our model reveals:</p>
        {[
          { name: 'Area (sqft)',      pct: 35.9, insight: 'Larger properties cost significantly more' },
          { name: 'Location Score',   pct: 22.0, insight: 'DHA/Gulberg command 3–4× premium over other zones' },
          { name: 'Property Type',    pct: 17.8, insight: 'Commercial plots vs residential affect price sharply' },
          { name: 'Bedrooms',         pct: 10.6, insight: 'More rooms = higher price but diminishing returns' },
          { name: 'Bathrooms',        pct: 6.9,  insight: 'Reflects quality finishes' },
          { name: 'City',             pct: 6.7,  insight: 'Islamabad typically commands premium over Lahore' },
        ].map(f => (
          <div key={f.name} style={{marginBottom:'10px'}}>
            <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.82rem', fontWeight:'600', color:'#374151', marginBottom:'4px'}}>
              <span>{f.name}</span><span style={{color:'#10b981'}}>{f.pct}%</span>
            </div>
            <div style={{background:'#f1f5f9', borderRadius:'6px', height:'8px', overflow:'hidden', marginBottom:'3px'}}>
              <div style={{height:'100%', width:`${f.pct*2}%`, background:'linear-gradient(90deg, #10b981, #34d399)', borderRadius:'6px'}} />
            </div>
            <div style={{fontSize:'0.72rem', color:'#64748b'}}>{f.insight}</div>
          </div>
        ))}
        <p style={{marginTop:'12px'}}>For <strong>prediction</strong>: user inputs are encoded using the same transformations as training, assembled into a feature vector in the exact same column order, then passed to <code style={{background:'#f1f5f9', padding:'2px 6px', borderRadius:'4px', fontSize:'0.82rem'}}>model.predict()</code>.</p>
      </div>
    ),
  },
];

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function AIPricePrediction() {
  const [step, setStep]                 = useState(1);
  const [propType, setPropType]         = useState(null);
  const [purpose, setPurpose]           = useState('buy');
  const [city, setCity]                 = useState('Lahore');
  const [area, setArea]                 = useState('');
  const [areaUnit, setAreaUnit]         = useState('marla');
  const [bedrooms, setBedrooms]         = useState(3);
  const [bathrooms, setBathrooms]       = useState(2);
  const [locationZone, setLocationZone] = useState('');
  const [prediction, setPrediction]     = useState(null);
  const [procStep, setProcStep]         = useState(0);
  const [error, setError]               = useState('');
  const [openEdu, setOpenEdu]           = useState(null);
  const [apiStatus, setApiStatus]       = useState('checking'); // 'ok' | 'offline' | 'checking'

  const mainRef = useRef(null);

  /* Check API health */
  useEffect(() => {
    fetch(`${API_URL}/api/health`, { headers: { 'ngrok-skip-browser-warning': 'true' } })
      .then(r => r.json())
      .then(() => setApiStatus('ok'))
      .catch(() => setApiStatus('offline'));
  }, []);

  /* Auto-scroll to top of wizard on step change */
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [step]);

  /* Processing animation */
  useEffect(() => {
    if (step !== 3) return;
    setProcStep(0);
    const steps = [0, 1, 2, 3];
    steps.forEach((s, i) => {
      setTimeout(() => setProcStep(s + 1), i * 700);
    });
    // After animation, call API
    setTimeout(() => callAPI(), 800);
  }, [step]);

  const callAPI = async () => {
    setError('');
    try {
      const body = {
        area         : parseFloat(area) || 5,
        area_unit    : areaUnit,
        bedrooms,
        bathrooms,
        city,
        location_zone: locationZone,
        property_type: propType?.subtype || 'house',
        purpose      : purpose === 'buy' ? 'sale' : 'rent',
      };

      const res  = await fetch(`${API_URL}/api/predict`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body   : JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        setPrediction(data);
        setTimeout(() => setStep(4), 400);
      } else {
        setError(data.error || 'Prediction failed. Please try again.');
        setStep(2);
      }
    } catch (e) {
      setError('Could not connect to AI server. Please ensure the Flask API is running on port 5002.');
      setStep(2);
    }
  };

  const CITY_ZONES = {
    'Lahore':      LAHORE_ZONES,
    'Islamabad':   ISLAMABAD_ZONES,
    'Karachi':     KARACHI_ZONES,
    'Multan':      MULTAN_ZONES,
    'Peshawar':    PESHAWAR_ZONES,
    'Sialkot':     SIALKOT_ZONES,
    'Faisalabad':  FAISALABAD_ZONES,
  };
  const zones = CITY_ZONES[city] || LAHORE_ZONES;

  const STEP_LABELS = ['Property Type', 'Property Details', 'AI Processing', 'Results'];

  const canGoNext = () => {
    if (step === 1) return !!propType;
    if (step === 2) return !!area && !!locationZone;
    return true;
  };

  /* Feature importance display */
  const fiDisplay = prediction?.feature_importances
    ? Object.entries(prediction.feature_importances)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => ({
          name: {
            area_sqft     : 'Area (sqft)',
            location_score: 'Location Zone',
            ptype_encoded : 'Property Type',
            bedrooms      : 'Bedrooms',
            bathrooms     : 'Bathrooms',
            city_encoded  : 'City',
          }[k] || k,
          pct: Math.round(v * 100),
        }))
    : [];

  const modelStats = prediction?.model_stats || {};
  const r2Pct = modelStats.r2 ? Math.round(modelStats.r2 * 100) : 0;

  /* Insights */
  const insights = [];
  if (prediction) {
    const loc = locationZone.toLowerCase();
    if (loc.includes('dha') || loc.includes('gulberg') || loc.includes('f-7') || loc.includes('f-6') || loc.includes('e-7')) {
      insights.push({ label: 'Premium Zone', color: 'green', Icon: FaTrophy });
    }
    if (city === 'Islamabad') {
      insights.push({ label: 'Capital City Premium', color: 'blue', Icon: FaCity });
    }
    if (bedrooms >= 4) {
      insights.push({ label: 'Large Family Home', color: 'green', Icon: FaUsers });
    }
    if (purpose === 'rent') {
      const monthly = prediction.prediction?.raw || 0;
      const annual  = monthly * 12;
      const yield_  = ((annual / (monthly * 120)) * 100).toFixed(1);
      insights.push({ label: `Est. Yield ~${yield_}%`, color: 'amber', Icon: FaChartLine });
    }
    insights.push({ label: `Trained on ${modelStats.trained_on?.toLocaleString() || '1,196'} properties`, color: 'blue', Icon: FaBrain });
  }

  return (
    <div className="ai-page">
      {/* ── HERO ── */}
      <section className="ai-hero">
        <div className="ai-hero-orb ai-hero-orb-1" />
        <div className="ai-hero-orb ai-hero-orb-2" />
        <div className="ai-hero-orb ai-hero-orb-3" />

        <div className="ai-hero-badge">
          <span className="ai-hero-badge-dot" />
          XGBoost Machine Learning Model — Live Predictions
        </div>

        <h1>
          AI-Powered Property<br />
          <span>Price Estimation</span>
        </h1>
        <p>
          Get accurate property price estimates powered by a trained XGBoost model
          built on 7,374+ real Zameen.com listings from Lahore &amp; Islamabad.
        </p>

        <div className="ai-hero-stats">
          <div className="ai-hero-stat">
            <div className="ai-hero-stat-num">7,<span>374</span></div>
            <div className="ai-hero-stat-label">Training Properties</div>
          </div>
          <div className="ai-hero-stat">
            <div className="ai-hero-stat-num"><span>4</span></div>
            <div className="ai-hero-stat-label">Trained Models</div>
          </div>
          <div className="ai-hero-stat">
            <div className="ai-hero-stat-num">70.<span>9</span>%</div>
            <div className="ai-hero-stat-label">R² Accuracy</div>
          </div>
          <div className="ai-hero-stat">
            <div className="ai-hero-stat-num"><span>400</span></div>
            <div className="ai-hero-stat-label">Decision Trees</div>
          </div>
        </div>
      </section>

      {/* ── MAIN ── */}
      <div className="ai-main" ref={mainRef}>

        {/* API offline warning */}
        {apiStatus === 'offline' && (
          <div className="ai-error-box" style={{marginBottom:'16px'}}>
            <FaExclamationTriangle style={{flexShrink:0}} />
            AI server offline. Start it: <code style={{marginLeft:'8px', background:'rgba(0,0,0,0.1)', padding:'2px 8px', borderRadius:'4px'}}>cd ai-models &amp;&amp; python3 predict_api.py</code>
          </div>
        )}

        {/* ── WIZARD CARD ── */}
        <div className="ai-wizard-card">

          {/* Progress Bar */}
          <div className="ai-progress-bar">
            {STEP_LABELS.map((label, i) => {
              const sn = i + 1;
              const isActive = sn === step;
              const isDone   = sn < step;
              return (
                <React.Fragment key={sn}>
                  <div className="ai-step-item">
                    <div className={`ai-step-circle ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
                      {isDone ? '✓' : sn}
                    </div>
                    <div className={`ai-step-label ${isActive ? 'active' : ''}`}>{label}</div>
                  </div>
                  {i < STEP_LABELS.length - 1 && (
                    <div className={`ai-step-line ${isDone ? 'done' : ''}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* ─── STEP 1: Type Selector ─── */}
          {step === 1 && (
            <div className="ai-step-body">
              <h2 className="ai-step-title">What type of property?</h2>
              <p className="ai-step-sub">Select the property category you want to estimate.</p>

              <div className="ai-type-grid">
                {PROPERTY_TYPES.map(pt => (
                  <div
                    key={pt.key}
                    className={`ai-type-card ${propType?.key === pt.key ? 'selected' : ''}`}
                    onClick={() => {
                      setPropType(pt);
                      // Plots & commercial cannot be rented — auto-reset to buy
                      if (!pt.canRent) setPurpose('buy');
                    }}
                  >
                    <div className="ai-type-check"><FaCheckCircle /></div>
                    <div className="ai-type-icon-wrap">
                      {pt.icon === 'house'      && <FaHome />}
                      {pt.icon === 'flat'       && <MdOutlineApartment />}
                      {pt.icon === 'plot'       && <FaLayerGroup />}
                      {pt.icon === 'commercial' && <FaStore />}
                    </div>
                    <div className="ai-type-name">{pt.name}</div>
                    <div className="ai-type-desc">{pt.desc}</div>
                  </div>
                ))}
              </div>

              {/* Purpose — hide Rent for plots & commercial */}
              <div className="ai-purpose-row">
                <span className="ai-purpose-label">Looking to:</span>
                <div className="ai-purpose-toggle">
                  <button
                    className={`ai-purpose-btn ${purpose === 'buy' ? 'active' : ''}`}
                    onClick={() => setPurpose('buy')}
                  >
                    <FaKey style={{fontSize:'0.82rem'}} /> Buy
                  </button>
                  {/* Rent only shown for house & flat — plots/commercial are not rented */}
                  {(!propType || propType.canRent) && (
                    <button
                      className={`ai-purpose-btn ${purpose === 'rent' ? 'active' : ''}`}
                      onClick={() => setPurpose('rent')}
                    >
                      <FaHandHoldingHeart style={{fontSize:'0.82rem'}} /> Rent
                    </button>
                  )}
                </div>
                {propType && !propType.canRent && (
                  <span style={{fontSize:'0.78rem', color:'#94a3b8', marginLeft:'4px'}}>
                    Plots &amp; commercial are sale-only
                  </span>
                )}
              </div>

              <div className="ai-nav-row">
                <div />
                <button className="ai-nav-next" onClick={() => setStep(2)} disabled={!canGoNext()}>
                  Next: Property Details →
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 2: Details Form ─── */}
          {step === 2 && (
            <div className="ai-step-body">
              <h2 className="ai-step-title">Property Details</h2>
              <p className="ai-step-sub">Fill in the details for an accurate AI estimate.</p>

              {error && <div className="ai-error-box">⚠️ {error}</div>}

              <div className="ai-form-grid">
                {/* City */}
                <div className="ai-field">
                  <label>🏙️ City</label>
                  <select className="ai-input" value={city} onChange={e => { setCity(e.target.value); setLocationZone(''); }}>
                    <option>Lahore</option>
                    <option>Islamabad</option>
                    <option>Karachi</option>
                    <option>Multan</option>
                    <option>Peshawar</option>
                    <option>Sialkot</option>
                    <option>Faisalabad</option>
                  </select>
                </div>

                {/* Area */}
                <div className="ai-field">
                  <label>📐 Property Area</label>
                  <div className="ai-field-input-row">
                    <input
                      className="ai-input"
                      type="number"
                      placeholder={areaUnit === 'marla' ? 'e.g. 10' : areaUnit === 'kanal' ? 'e.g. 1' : 'e.g. 2000'}
                      value={area}
                      onChange={e => setArea(e.target.value)}
                      min="1"
                    />
                    <select className="ai-input-unit" value={areaUnit} onChange={e => setAreaUnit(e.target.value)}>
                      <option value="marla">Marla</option>
                      <option value="kanal">Kanal</option>
                      <option value="sqft">Sq. Ft.</option>
                    </select>
                  </div>
                </div>

                {/* Bedrooms — hide for commercial/plot */}
                {!['plot', 'commercial'].includes(propType?.key) && (
                  <div className="ai-field">
                    <label>🛏️ Bedrooms</label>
                    <div className="ai-count-selector">
                      <button className="ai-count-btn" onClick={() => setBedrooms(Math.max(1, bedrooms - 1))}>−</button>
                      <span className="ai-count-val">{bedrooms}</span>
                      <button className="ai-count-btn" onClick={() => setBedrooms(Math.min(12, bedrooms + 1))}>+</button>
                    </div>
                  </div>
                )}

                {/* Bathrooms — hide for plot */}
                {propType?.key !== 'plot' && (
                  <div className="ai-field">
                    <label>🚿 Bathrooms</label>
                    <div className="ai-count-selector">
                      <button className="ai-count-btn" onClick={() => setBathrooms(Math.max(1, bathrooms - 1))}>−</button>
                      <span className="ai-count-val">{bathrooms}</span>
                      <button className="ai-count-btn" onClick={() => setBathrooms(Math.min(10, bathrooms + 1))}>+</button>
                    </div>
                  </div>
                )}

                {/* Location Zone */}
                <div className="ai-field full-width">
                  <label>📍 Location Zone <span style={{color:'#ef4444', fontSize:'0.75rem'}}>* Required</span></label>
                  <div className="ai-location-grid">
                    {zones.map(z => (
                      <button
                        key={z}
                        className={`ai-location-chip ${locationZone === z ? 'selected' : ''}`}
                        onClick={() => setLocationZone(z)}
                      >
                        {z}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="ai-nav-row">
                <button className="ai-nav-back" onClick={() => setStep(1)}>← Back</button>
                <button
                  className="ai-nav-next"
                  onClick={() => setStep(3)}
                  disabled={!canGoNext()}
                >
                  🤖 Get AI Estimate →
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 3: Processing ─── */}
          {step === 3 && (
            <div className="ai-step-body">
              <div className="ai-processing">
                <div className="ai-brain-container">
                  <div className="ai-brain-ring ai-brain-ring-1" />
                  <div className="ai-brain-ring ai-brain-ring-2" />
                  <div className="ai-brain-ring ai-brain-ring-3" />
                  <div className="ai-brain-center">🤖</div>
                </div>

                <h2 className="ai-processing-title">Analyzing Your Property</h2>
                <p className="ai-processing-sub">XGBoost is running 400 decision trees…</p>

                <div className="ai-proc-steps">
                  {[
                    'Encoding property features…',
                    'Running gradient boosted trees…',
                    'Calculating confidence intervals…',
                    'Preparing your estimate…',
                  ].map((label, i) => (
                    <div
                      key={i}
                      className={`ai-proc-step ${procStep === i + 1 ? 'active' : ''} ${procStep > i + 1 ? 'done' : ''}`}
                    >
                      <div className="ai-proc-dot" />
                      {procStep > i + 1 ? `✓ ${label}` : label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 4: Results ─── */}
          {step === 4 && prediction && (
            <div className="ai-step-body">
              <h2 className="ai-step-title">AI Price Estimate</h2>
              <p className="ai-step-sub">
                Based on {modelStats.trained_on?.toLocaleString() || '—'} real properties · Model R² = {r2Pct}%
              </p>

              <div className="ai-results">
                {/* Main Price Card */}
                <div className="ai-price-card">
                  <div className="ai-price-card-top">
                    <div>
                      <div className="ai-price-label">
                        Estimated {purpose === 'rent' ? 'Monthly Rent' : 'Market Price'}
                      </div>
                      <div className="ai-price-amount">
                        {fmtPKR(prediction.prediction?.raw)}
                      </div>
                    </div>
                    <div className="ai-accuracy-badge">
                      Model Accuracy <span>{r2Pct}%</span>
                    </div>
                  </div>

                  <div className="ai-confidence-row">
                    <div className="ai-conf-bound">
                      <span className="ai-conf-bound-label">Low Estimate</span>
                      <span className="ai-conf-bound-val">{fmtPKR(prediction.prediction?.low)}</span>
                    </div>
                    <div className="ai-conf-bar-wrap">
                      <div style={{fontSize:'0.7rem', color:'#6ee7b7', textAlign:'center', marginBottom:'4px'}}>
                        Confidence Range
                      </div>
                      <div className="ai-conf-bar-track">
                        <div className="ai-conf-bar-fill" />
                      </div>
                    </div>
                    <div className="ai-conf-bound">
                      <span className="ai-conf-bound-label">High Estimate</span>
                      <span className="ai-conf-bound-val">{fmtPKR(prediction.prediction?.high)}</span>
                    </div>
                  </div>

                  <div style={{marginTop:'20px', display:'flex', flexWrap:'wrap', gap:'8px'}}>
                    {[
                      { label: `📐 ${area} ${areaUnit}`, },
                      { label: `🏙️ ${city}`, },
                      { label: `📍 ${locationZone}`, },
                      !['plot','commercial'].includes(propType?.key) && { label: `🛏️ ${bedrooms} Beds`, },
                      propType?.key !== 'plot' && { label: `🚿 ${bathrooms} Baths`, },
                    ].filter(Boolean).map((t, i) => (
                      <span key={i} style={{
                        background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)',
                        color:'#a7f3d0', padding:'5px 12px', borderRadius:'20px', fontSize:'0.78rem', fontWeight:'600'
                      }}>
                        {t.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Feature Importance */}
                <div className="ai-stat-card">
                  <div className="ai-stat-card-title">
                    <div className="ai-stat-card-icon">🔑</div>
                    Price Drivers
                  </div>
                  <div className="ai-fi-list">
                    {fiDisplay.map(f => (
                      <div key={f.name} className="ai-fi-item">
                        <div className="ai-fi-row">
                          <span className="ai-fi-name">{f.name}</span>
                          <span className="ai-fi-pct">{f.pct}%</span>
                        </div>
                        <div className="ai-fi-track">
                          <div className="ai-fi-fill" style={{ width: `${f.pct * 2}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Model Stats */}
                <div className="ai-stat-card">
                  <div className="ai-stat-card-title">
                    <div className="ai-stat-card-icon">📊</div>
                    Model Performance
                  </div>
                  <div className="ai-model-stats">
                    <div className="ai-model-stat-row">
                      <div className="ai-model-stat-label">
                        R² Score
                        <small>Variance explained</small>
                      </div>
                      <div>
                        <div className="ai-model-stat-val green">{r2Pct}%</div>
                        <div className="ai-r2-bar">
                          <div className="ai-r2-fill" style={{ width: `${r2Pct}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="ai-model-stat-row">
                      <div className="ai-model-stat-label">
                        Avg Error (MAE)
                        <small>Mean Absolute Error</small>
                      </div>
                      <div className="ai-model-stat-val">{fmtPKR(modelStats.mae)}</div>
                    </div>
                    <div className="ai-model-stat-row">
                      <div className="ai-model-stat-label">
                        Trained On
                        <small>Property samples</small>
                      </div>
                      <div className="ai-model-stat-val">{modelStats.trained_on?.toLocaleString()}</div>
                    </div>
                    <div className="ai-model-stat-row">
                      <div className="ai-model-stat-label">
                        Algorithm
                        <small>Ensemble method</small>
                      </div>
                      <div className="ai-model-stat-val">XGBoost</div>
                    </div>
                  </div>
                </div>

                {/* Market Insights */}
                {insights.length > 0 && (
                  <div className="ai-stat-card" style={{gridColumn:'1/-1'}}>
                    <div className="ai-stat-card-title">
                      <div className="ai-stat-card-icon"><FaChartLine /></div>
                      Market Insights
                    </div>
                    <div className="ai-insights-row">
                      {insights.map((ins, i) => (
                        <span key={i} className={`ai-insight-chip ${ins.color}`}>
                          {ins.Icon && <ins.Icon style={{fontSize:'0.85rem', flexShrink:0}} />}
                          {ins.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA */}
                <div className="ai-results-cta">
                  <button className="ai-cta-btn ai-cta-primary" onClick={() => { setStep(1); setPropType(null); setArea(''); setLocationZone(''); setPrediction(null); }}>
                    🔄 New Estimate
                  </button>
                  <button className="ai-cta-btn ai-cta-secondary" onClick={() => setStep(2)}>
                    ✏️ Edit Details
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── ML EDUCATION SECTION ── */}
        <div className="ai-edu-section">
          <div className="ai-edu-header">
            <div className="ai-edu-eyebrow">Under the Hood</div>
            <h2 className="ai-edu-title">How the AI Model Works</h2>
            <p className="ai-edu-sub">
              Explore every stage of the machine learning pipeline — from raw data to live predictions.
              Perfect for understanding the core concepts behind this feature.
            </p>
          </div>

          <div className="ai-accordion">
            {EDU_ITEMS.map((item, i) => (
              <div
                key={i}
                className={`ai-acc-item ${openEdu === i ? 'open' : ''}`}
              >
                <div className="ai-acc-header" onClick={() => setOpenEdu(openEdu === i ? null : i)}>
                  <div className="ai-acc-step-num">{item.step}</div>
                  <div>
                    <div className="ai-acc-title">{item.title}</div>
                    <div className="ai-acc-subtitle">{item.subtitle}</div>
                  </div>
                  <div className="ai-acc-chevron">▼</div>
                </div>
                <div className="ai-acc-body">
                  <div className="ai-acc-content">{item.content}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
