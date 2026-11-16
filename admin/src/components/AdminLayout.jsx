import React, { useEffect, useState, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import Icon from './Icon';
import './AdminLayout.css';

const AdminLayout = () => {
  const navigate = useNavigate();
  const admin = JSON.parse(localStorage.getItem('adminUser') || '{}');
  const [pendingCount, setPendingCount] = useState(0);

  /* ── Notification Bell State ── */
  const [pendingUsers, setPendingUsers]       = useState([]);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);
  const [bellOpen, setBellOpen]               = useState(false);
  const [seenCount, setSeenCount]             = useState(() => parseInt(localStorage.getItem('adminSeenUsers') || '0'));
  const bellRef                               = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => { if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadNotifs = Math.max(0, pendingUsersCount - seenCount);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const headers = { Authorization: `Bearer ${token}` };

    const fetchPending = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/pending`, { headers });
        const data = await res.json();
        setPendingCount(data.total || 0);
      } catch { /* ignore */ }
    };

    const fetchPendingUsers = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/pending`, { headers });
        const data = await res.json();
        const users = data.users || [];
        setPendingUsers(users);
        setPendingUsersCount(users.length);
      } catch { /* ignore */ }
    };

    fetchPending();
    fetchPendingUsers();
    const interval = setInterval(() => { fetchPending(); fetchPendingUsers(); }, 30000);
    return () => clearInterval(interval);
  }, []);

  const nav = [
    { to: '/',           iconName: 'dashboard',   label: 'Dashboard',    end: true },
    { to: '/users',      iconName: 'users',        label: 'Users' },
    { to: '/listings',   iconName: 'listings',     label: 'Listings' },
    { to: '/approvals',  iconName: 'approvals',    label: 'Approvals',   badge: pendingCount + pendingUsersCount },
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
            {/* ── Notification Bell ── */}
            <div className="notif-bell-wrap" ref={bellRef}>
              <button
                className="notif-bell-btn"
                onClick={() => {
                  setBellOpen(o => !o);
                  // mark all as seen
                  setSeenCount(pendingUsersCount);
                  localStorage.setItem('adminSeenUsers', String(pendingUsersCount));
                }}
              >
                <Icon name="bell" size={19} color="#374151" />
                {unreadNotifs > 0 && (
                  <span className="notif-badge">{unreadNotifs}</span>
                )}
              </button>

              {bellOpen && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <span>🔔 New User Signups</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{pendingUsers.length} pending</span>
                  </div>
                  {pendingUsers.length === 0 ? (
                    <div className="notif-empty">No pending user accounts</div>
                  ) : (
                    <div className="notif-list">
                      {pendingUsers.slice(0, 8).map(u => (
                        <div
                          key={u._id}
                          className="notif-item"
                          onClick={() => { setBellOpen(false); navigate('/approvals'); }}
                        >
                          <img
                            src={u.avatar || '/avatar_male_1_1772875227901.png'}
                            alt=""
                            className="notif-av"
                          />
                          <div className="notif-info">
                            <div className="notif-name">{u.name}</div>
                            <div className="notif-cnic">🪪 {u.cnic || 'No CNIC'}</div>
                            <div className="notif-meta">{u.role} · {new Date(u.createdAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })}</div>
                          </div>
                          <span className="notif-pending-pill">Pending</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div
                    className="notif-footer"
                    onClick={() => { setBellOpen(false); navigate('/approvals'); }}
                  >
                    View all in Approvals →
                  </div>
                </div>
              )}
            </div>

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
