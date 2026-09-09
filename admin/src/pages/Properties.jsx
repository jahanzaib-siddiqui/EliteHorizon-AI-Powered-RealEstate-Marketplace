import React, { useEffect, useState } from 'react';
import Icon from '../components/Icon';
import './Users.css';

const token = () => localStorage.getItem('adminToken');

const Properties = () => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/admin/properties`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="adm-page-header">
        <h1 className="adm-page-title">Property Database</h1>
        <p className="adm-page-sub">Dataset-seeded properties — {data?.total || 0} total</p>
      </div>

      {loading ? (
        <div className="usr-loading"><div className="dash-spinner"></div></div>
      ) : (
        <>
          <div className="prop-stat-row">
            {/* Total card */}
            <div className="adm-card prop-total-card">
              <div className="prop-total-icon">
                <Icon name="building" size={32} color="#16a34a" strokeWidth={1.4} />
              </div>
              <div className="prop-total-value">{data?.total}</div>
              <div className="prop-total-label">Total DB Properties</div>
              <div className="prop-total-sub">Across all cities in the dataset</div>
            </div>

            {/* City breakdown */}
            <div className="adm-card prop-city-card">
              <h3 className="adm-card-section-title">Listings by City</h3>
              <div className="dash-city-list">
                {(data?.byCity || []).map(c => (
                  <div key={c._id} className="dash-city-row">
                    <span className="dash-city-name">{c._id || 'Unknown'}</span>
                    <div className="dash-city-bar-wrap">
                      <div className="dash-city-bar"
                        style={{ width: `${Math.min(100, (c.count / Math.max(...(data?.byCity || []).map(x => x.count))) * 100)}%` }}
                      />
                    </div>
                    <span className="dash-city-count">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Info card */}
          <div className="adm-card" style={{ marginTop: 16 }}>
            <h3 className="adm-card-section-title" style={{ marginBottom: 14 }}>About the Dataset</h3>
            <div className="prop-info-grid">
              {[
                { icon: 'database',  label: 'Source',     value: 'CSV dataset files seeded via Node.js scripts' },
                { icon: 'pin',       label: 'Cities',     value: (data?.byCity || []).map(c => c._id).join(' · ') || 'N/A' },
                { icon: 'database',  label: 'Collection', value: 'properties (MongoDB)' },
                { icon: 'activity',  label: 'Status',     value: 'Read-only — seeded data' },
              ].map(item => (
                <div key={item.label} className="prop-info-item">
                  <div className="prop-info-icon-wrap">
                    <Icon name={item.icon} size={16} color="#16a34a" />
                  </div>
                  <div>
                    <div className="prop-info-label">{item.label}</div>
                    <div className="prop-info-value">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Properties;
