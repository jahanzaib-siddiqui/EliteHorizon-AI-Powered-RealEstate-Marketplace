import React from 'react';
import Icon from '../components/Icon';
import './Settings.css';

const Settings = () => {
  return (
    <div>
      <div className="adm-page-header">
        <h1 className="adm-page-title">Admin Settings</h1>
        <p className="adm-page-sub">System configuration and admin credentials</p>
      </div>

      <div className="set-grid">
        {/* Credentials */}
        <div className="adm-card">
          <div className="set-section-header">
            <div className="set-section-icon"><Icon name="shield" size={16} color="#16a34a" /></div>
            <h3 className="set-section-title">Admin Credentials</h3>
          </div>
          <div className="set-info-list">
            {[
              { label: 'Admin Email',      val: 'admin@elitehorizon.com', mono: false },
              { label: 'Default Password', val: 'Admin@123',               mono: false, red: true },
              { label: 'Session Duration', val: '8 hours (JWT)',            mono: false },
            ].map(r => (
              <div key={r.label} className="set-info-row">
                <span className="set-info-label">{r.label}</span>
                <span className={`set-info-val ${r.red ? 'set-val-red' : ''}`}>{r.val}</span>
              </div>
            ))}
          </div>
          <div className="set-note">
            <Icon name="alertTriangle" size={14} color="#c2410c" />
            <span>Change admin credentials in <code>backend/routes/adminRoutes.js</code> before deploying.</span>
          </div>
        </div>

        {/* System info */}
        <div className="adm-card">
          <div className="set-section-header">
            <div className="set-section-icon"><Icon name="monitor" size={16} color="#16a34a" /></div>
            <h3 className="set-section-title">System Information</h3>
          </div>
          <div className="set-info-list">
            {[
              { label: 'Main Website',  val: import.meta.env.VITE_API_URL?.replace('real-estat', 'real-estat-woad') || 'Deployed on Vercel' },
              { label: 'Admin Panel',   val: window.location.origin },
              { label: 'Backend API',   val: import.meta.env.VITE_API_URL },
              { label: 'Database',      val: 'MongoDB Atlas — elite-horizon' },
              { label: 'Auth',          val: 'JWT · 8h expiry' },
              { label: 'Image Storage', val: 'Cloudinary CDN' },
            ].map(r => (
              <div key={r.label} className="set-info-row">
                <span className="set-info-label">{r.label}</span>
                <code className="set-code">{r.val}</code>
              </div>
            ))}
          </div>
        </div>

        {/* Collections */}
        <div className="adm-card">
          <div className="set-section-header">
            <div className="set-section-icon"><Icon name="database" size={16} color="#16a34a" /></div>
            <h3 className="set-section-title">MongoDB Collections</h3>
          </div>
          <div className="set-info-list">
            {[
              { name: 'users',            desc: 'Buyer & seller accounts' },
              { name: 'properties',       desc: 'Dataset-seeded properties' },
              { name: 'sellerproperties', desc: 'Seller-listed properties' },
            ].map(c => (
              <div key={c.name} className="set-collection-row">
                <code className="set-coll-name">{c.name}</code>
                <span className="set-coll-desc">{c.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div className="adm-card">
          <div className="set-section-header">
            <div className="set-section-icon"><Icon name="link" size={16} color="#16a34a" /></div>
            <h3 className="set-section-title">Quick Links</h3>
          </div>
          <div className="set-links">
            {[
              { label: 'Main Website',        href: `https://elite-horizon-ai-powered-real-estat-woad.vercel.app` },
              { label: 'Backend Health',       href: import.meta.env.VITE_API_URL },
              { label: 'API — Properties',     href: `${import.meta.env.VITE_API_URL}/api/properties?limit=5` },
              { label: 'API — Admin Users',    href: `${import.meta.env.VITE_API_URL}/api/admin/users` },
            ].map(l => (
              <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="set-link-btn">
                <Icon name="link" size={14} color="#16a34a" />
                {l.label}
              </a>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
