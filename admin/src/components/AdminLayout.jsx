import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import Icon from './Icon';
import './AdminLayout.css';

const AdminLayout = () => {
  const navigate = useNavigate();
  const admin = JSON.parse(localStorage.getItem('adminUser') || '{}');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await fetch('/api/admin/pending', {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        });
        const data = await res.json();
        setPendingCount(data.total || 0);
      } catch { /* ignore */ }
    };
    fetchPending();
    const interval = setInterval(fetchPending, 60000);
    return () => clearInterval(interval);
  }, []);

  const nav = [
    { to: '/',           iconName: 'dashboard',   label: 'Dashboard',    end: true },
    { to: '/users',      iconName: 'users',        label: 'Users' },
    { to: '/listings',   iconName: 'listings',     label: 'Listings' },
    { to: '/approvals',  iconName: 'approvals',    label: 'Approvals',   badge: pendingCount },
    { to: '/properties', iconName: 'properties',   label: 'Properties' },
    { to: '/chats',      iconName: 'shield',        label: 'Chat Monitor' },
    { to: '/training',   iconName: 'robot',         label: 'AI Training' },
    { to: '/settings',   iconName: 'settings',      label: 'Settings' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-logo">EH</div>
          <div>
            <div className="sidebar-site">Elite Horizon</div>
            <div className="sidebar-role">Admin Panel</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {nav.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => `sidebar-link${isActive ? ' sidebar-link-active' : ''}`}>
              <span className="sidebar-icon">
                <Icon name={n.iconName} size={18} color="currentColor" strokeWidth={1.7} />
              </span>
              {n.label}
              {n.badge > 0 && <span className="sidebar-badge">{n.badge}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-admin">
            <div className="sidebar-av">{admin.name?.charAt(0) || 'A'}</div>
            <div>
              <div className="sidebar-name">{admin.name || 'Admin'}</div>
              <div className="sidebar-email">{admin.email || ''}</div>
            </div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout}>
            <Icon name="logout" size={15} color="currentColor" />
            Logout
          </button>
        </div>
      </aside>

      <div className="layout-main">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <div className="topbar-live">
              <span className="live-dot"></span>
              System Online
            </div>
            {pendingCount > 0 && (
              <div className="topbar-alert" onClick={() => navigate('/approvals')}>
                <Icon name="alertTriangle" size={13} color="#c2410c" />
                {pendingCount} listing{pendingCount !== 1 ? 's' : ''} awaiting approval
              </div>
            )}
          </div>
          <div className="topbar-right">
            <span className="topbar-time">
              {new Date().toLocaleDateString('en-PK', {
                weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
              })}
            </span>
          </div>
        </header>

        <main className="layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
