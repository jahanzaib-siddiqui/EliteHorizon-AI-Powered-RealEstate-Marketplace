import React, { useEffect, useState, useCallback } from 'react';
import Icon from '../components/Icon';
import './Users.css';

const token = () => localStorage.getItem('adminToken');

const Users = () => {
  const [users, setUsers]         = useState([]);
  const [total, setTotal]         = useState(0);
  const [pages, setPages]         = useState(1);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]   = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?page=${page}&limit=15&search=${encodeURIComponent(search)}`,
        { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/users/${deleteTarget._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` }
      });
      setDeleteTarget(null);
      fetchUsers();
    } finally { setDeleting(false); }
  };

  const formatDate = d => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div>
      {/* Delete modal */}
      {deleteTarget && (
        <div className="usr-overlay">
          <div className="usr-modal">
            <div className="usr-modal-icon-wrap">
              <Icon name="trash" size={22} color="#dc2626" />
            </div>
            <h3>Delete User?</h3>
            <p>Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This cannot be undone.</p>
            <div className="usr-modal-btns">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="usr-cancel">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="usr-confirm">
                {deleting ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="adm-page-header">
        <h1 className="adm-page-title">User Management</h1>
        <p className="adm-page-sub">{total} registered users on Elite Horizon</p>
      </div>

      {/* Toolbar */}
      <div className="adm-card usr-toolbar">
        <div className="usr-search-wrap">
          <span className="usr-search-icon"><Icon name="search" size={16} color="#9ca3af" /></span>
          <input className="usr-search" placeholder="Search by name or email..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="usr-count">{total} users</div>
      </div>

      {/* Table */}
      <div className="adm-card" style={{ marginTop: 16, overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <div className="usr-loading"><div className="dash-spinner"></div></div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>#</th><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u._id}>
                  <td style={{ color: '#9ca3af', fontSize: 12 }}>{(page - 1) * 15 + i + 1}</td>
                  <td>
                    <div className="usr-name-cell">
                      <div className="usr-av">{u.name?.charAt(0)?.toUpperCase()}</div>
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ color: '#6b7280' }}>{u.email}</td>
                  <td><span className={`adm-badge ${u.role === 'seller' ? 'badge-green' : 'badge-blue'}`}>{u.role}</span></td>
                  <td style={{ color: '#9ca3af', fontSize: 13 }}>{formatDate(u.createdAt)}</td>
                  <td>
                    <button className="usr-del-btn" onClick={() => setDeleteTarget(u)}>
                      <Icon name="trash" size={13} color="#dc2626" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>No users found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="usr-pagination">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="usr-pg-btn">
            <Icon name="chevronLeft" size={15} />
          </button>
          <span className="usr-pg-info">Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="usr-pg-btn">
            <Icon name="chevronRight" size={15} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Users;
