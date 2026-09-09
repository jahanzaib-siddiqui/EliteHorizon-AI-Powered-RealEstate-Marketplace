import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminLogin.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Login failed'); return; }
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUser', JSON.stringify(data.admin));
      navigate('/');
    } catch {
      setError('Network error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="al-bg">
      {/* Left branding panel */}
      <div className="al-left">
        <div className="al-brand">
          <div className="al-logo">EH</div>
          <h1>Elite Horizon</h1>
          <p>Admin Control Centre</p>
        </div>
        <div className="al-features">
          {['Monitor all users & sellers', 'Manage property listings', 'Track platform analytics', 'Control site operations'].map(f => (
            <div key={f} className="al-feature-item">
              <span className="al-check">✓</span> {f}
            </div>
          ))}
        </div>
        <div className="al-version">v1.0 · Elite Horizon © 2025</div>
      </div>

      {/* Right login form */}
      <div className="al-right">
        <div className="al-card">
          <div className="al-card-header">
            <div className="al-shield">🛡️</div>
            <h2>Admin Sign In</h2>
            <p>Restricted access — authorised personnel only</p>
          </div>

          <form onSubmit={handleSubmit} className="al-form">
            <div className="al-field">
              <label>Admin Email</label>
              <input
                type="email"
                placeholder="admin@elitehorizon.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="al-field">
              <label>Password</label>
              <div className="al-pw-wrap">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter admin password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button type="button" className="al-eye" onClick={() => setShowPw(s => !s)}>
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && <div className="al-error">⚠️ {error}</div>}

            <button type="submit" className="al-btn" disabled={loading}>
              {loading ? <span className="al-spinner"></span> : 'Sign In to Dashboard'}
            </button>
          </form>

          <div className="al-hint">
            <span>Default: admin@elitehorizon.com / Admin@123</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
