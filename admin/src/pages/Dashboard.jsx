import React, { useEffect, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend
} from 'chart.js';
import Icon from '../components/Icon';
import './Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const token = () => localStorage.getItem('adminToken');

const fmt = (v) => {
  if (v >= 10000000) return `${(v / 10000000).toFixed(1)} Cr`;
  if (v >= 100000)   return `${(v / 100000).toFixed(1)} Lac`;
  return `Rs ${v?.toLocaleString()}`;
};

const Dashboard = () => {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/admin/stats`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json()).then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="dash-loading">
      <div className="dash-spinner"></div>
      <p>Loading dashboard data...</p>
    </div>
  );
  if (!stats) return <div className="dash-loading"><p>Failed to load stats.</p></div>;

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const barData = {
    labels: stats.monthlySignups.map(m => monthNames[m._id.month - 1]),
    datasets: [{
      label: 'New Users',
      data: stats.monthlySignups.map(m => m.count),
      backgroundColor: 'rgba(22,163,74,.75)',
      borderRadius: 6,
    }]
  };

  const purposeMap = {};
  stats.listingsByPurpose.forEach(p => { purposeMap[p._id] = p.count; });
  const doughnutData = {
    labels: ['For Sale', 'For Rent'],
    datasets: [{
      data: [purposeMap['Sell'] || 0, purposeMap['Rent'] || 0],
      backgroundColor: ['#16a34a', '#3b82f6'],
      borderWidth: 0,
    }]
  };

  const statCards = [
    { label: 'Total Users',     value: stats.totalUsers,      iconName: 'users',     color: 'green',  sub: `${stats.totalSellers} sellers · ${stats.totalBuyers} buyers` },
    { label: 'Active Listings', value: stats.totalListings,   iconName: 'listings',  color: 'blue',   sub: 'Seller-submitted properties' },
    { label: 'DB Properties',   value: stats.totalProperties, iconName: 'properties',color: 'purple', sub: 'Seeded from dataset' },
    { label: 'Pending Review',  value: stats.pendingListings, iconName: 'approvals', color: 'orange', sub: 'Awaiting admin approval' },
  ];

  return (
    <div className="dash">
      <div className="adm-page-header">
        <h1 className="adm-page-title">Dashboard Overview</h1>
        <p className="adm-page-sub">Real-time snapshot of Elite Horizon operations</p>
      </div>

      {/* Stat cards */}
      <div className="dash-grid">
        {statCards.map(c => (
          <div key={c.label} className={`dash-stat dash-${c.color}`}>
            <div className="dash-stat-icon-wrap">
              <Icon name={c.iconName} size={22} color="rgba(255,255,255,0.9)" strokeWidth={1.6} />
            </div>
            <div className="dash-stat-value">{c.value}</div>
            <div className="dash-stat-label">{c.label}</div>
            <div className="dash-stat-sub">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="dash-charts">
        <div className="adm-card dash-chart-big">
          <div className="dash-card-title">Monthly User Signups</div>
          <Bar data={barData} options={{
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              y: { grid: { color: '#f0fdf4' }, ticks: { color: '#6b7280' } },
              x: { ticks: { color: '#6b7280' } }
            }
          }} />
        </div>
        <div className="adm-card dash-chart-sm">
          <div className="dash-card-title">Listings by Purpose</div>
          <div style={{ maxWidth: 220, margin: '0 auto' }}>
            <Doughnut data={doughnutData} options={{
              cutout: '65%',
              plugins: { legend: { position: 'bottom', labels: { color: '#374151', font: { weight: '600' } } } }
            }} />
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="dash-bottom">
        {/* Recent listings */}
        <div className="adm-card dash-table-card">
          <div className="dash-card-title">Recent Listings</div>
          <table className="adm-table">
            <thead>
              <tr><th>Title</th><th>City</th><th>Price</th><th>Status</th></tr>
            </thead>
            <tbody>
              {stats.recentListings.map(l => (
                <tr key={l._id}>
                  <td>{l.adInfo?.title || '—'}</td>
                  <td><span className="adm-tag-city">{l.location?.city}</span></td>
                  <td style={{ fontWeight: 700, color: '#16a34a' }}>{fmt(l.price?.value)}</td>
                  <td>
                    <span className={`adm-badge ${
                      l.status === 'approved' ? 'badge-green' :
                      l.status === 'rejected' ? 'badge-red' : 'badge-orange'
                    }`}>{l.status || 'pending'}</span>
                  </td>
                </tr>
              ))}
              {stats.recentListings.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign:'center', color:'#9ca3af' }}>No listings yet</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Recent users */}
        <div className="adm-card dash-table-card">
          <div className="dash-card-title">Recent Users</div>
          <table className="adm-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th></tr>
            </thead>
            <tbody>
              {stats.recentUsers.map(u => (
                <tr key={u._id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td style={{ color: '#6b7280', fontSize: 13 }}>{u.email}</td>
                  <td><span className={`adm-badge ${u.role === 'seller' ? 'badge-green' : 'badge-blue'}`}>{u.role}</span></td>
                </tr>
              ))}
              {stats.recentUsers.length === 0 && (
                <tr><td colSpan={3} style={{ textAlign:'center', color:'#9ca3af' }}>No users yet</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Listings by city */}
        <div className="adm-card dash-city-card">
          <div className="dash-card-title">Listings by City</div>
          <div className="dash-city-list">
            {stats.listingsByCity.map(c => (
              <div key={c._id} className="dash-city-row">
                <span className="dash-city-name">{c._id || 'Unknown'}</span>
                <div className="dash-city-bar-wrap">
                  <div className="dash-city-bar"
                    style={{ width: `${Math.min(100, (c.count / Math.max(...stats.listingsByCity.map(x => x.count))) * 100)}%` }}>
                  </div>
                </div>
                <span className="dash-city-count">{c.count}</span>
              </div>
            ))}
            {stats.listingsByCity.length === 0 && <p style={{ color: '#9ca3af', fontSize: 14 }}>No data yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
