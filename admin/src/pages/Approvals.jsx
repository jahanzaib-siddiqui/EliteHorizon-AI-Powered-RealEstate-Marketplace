import React, { useEffect, useState, useCallback } from 'react';
import Icon from '../components/Icon';
import './Approvals.css';

const API_BASE = import.meta.env.VITE_API_URL;
const token = () => localStorage.getItem('adminToken');

const Approvals = () => {
  const [tab, setTab] = useState('users'); // 'users' | 'listings'

  /* ── User Approvals State ── */
  const [pendingUsers, setPendingUsers]       = useState([]);
  const [usersLoading, setUsersLoading]       = useState(true);
  const [userProcessing, setUserProcessing]   = useState('');
  const [rejectUserTarget, setRejectUserTarget] = useState(null);
  const [rejectUserReason, setRejectUserReason] = useState('');

  /* ── Listing Approvals State ── */
  const [listings, setListings]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [rejectTarget, setRejectTarget]       = useState(null);
  const [rejectReason, setRejectReason]       = useState('');
  const [processing, setProcessing]           = useState('');

  /* ── Fetch pending users ── */
  const fetchPendingUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/admin/users/pending`, { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      setPendingUsers(data.users || []);
    } catch { /* ignore */ } finally { setUsersLoading(false); }
  }, []);

  /* ── Fetch pending listings ── */
  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/admin/pending`, { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      setListings(data.listings || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPendingUsers(); fetchPending(); }, [fetchPendingUsers, fetchPending]);

  /* ── User approve/reject ── */
  const handleApproveUser = async (id) => {
    setUserProcessing(id);
    try {
      await fetch(`${API_BASE}/api/admin/users/${id}/approve`, {
        method: 'POST', headers: { Authorization: `Bearer ${token()}` }
      });
      setPendingUsers(prev => prev.filter(u => u._id !== id));
    } finally { setUserProcessing(''); }
  };

  const handleRejectUser = async () => {
    if (!rejectUserTarget) return;
    setUserProcessing(rejectUserTarget._id);
    try {
      await fetch(`${API_BASE}/api/admin/users/${rejectUserTarget._id}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectUserReason || 'Not specified.' })
      });
      setPendingUsers(prev => prev.filter(u => u._id !== rejectUserTarget._id));
      setRejectUserTarget(null);
      setRejectUserReason('');
    } finally { setUserProcessing(''); }
  };

  /* ── Listing approve/reject ── */
  const handleApprove = async (id) => {
    setProcessing(id);
    try {
      await fetch(`${API_BASE}/api/admin/approve/${id}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token()}` }
      });
      setListings(prev => prev.filter(l => l._id !== id));
    } finally { setProcessing(''); }
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    setProcessing(rejectTarget._id);
    try {
      await fetch(`${API_BASE}/api/admin/reject/${rejectTarget._id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason })
      });
      setListings(prev => prev.filter(l => l._id !== rejectTarget._id));
      setRejectTarget(null);
      setRejectReason('');
    } finally { setProcessing(''); }
  };

  const fmt = v => {
    if (!v) return 'N/A';
    if (v >= 10000000) return `Rs ${(v / 10000000).toFixed(1)} Cr`;
    if (v >= 100000)   return `Rs ${(v / 100000).toFixed(1)} Lac`;
    return `Rs ${v.toLocaleString()}`;
  };

  const fmtDate = d => new Date(d).toLocaleDateString('en-PK', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div>
      {/* ── Reject User Modal ── */}
      {rejectUserTarget && (
        <div className="apr-overlay">
          <div className="apr-modal">
            <div className="apr-modal-icon-wrap"><Icon name="x" size={22} color="#dc2626" /></div>
            <h3>Reject User Account</h3>
            <p>Provide a reason for rejecting <strong>{rejectUserTarget.name}</strong>'s account request.<br />
              <span style={{ fontSize: '12px', color: '#64748b' }}>CNIC: {rejectUserTarget.cnic}</span>
            </p>
            <textarea
              className="apr-reason-input"
              placeholder="e.g. CNIC information could not be verified, duplicate account..."
              value={rejectUserReason}
              onChange={e => setRejectUserReason(e.target.value)}
              rows={4}
            />
            <div className="apr-modal-btns">
              <button className="apr-cancel-btn" onClick={() => { setRejectUserTarget(null); setRejectUserReason(''); }} disabled={!!userProcessing}>
                Cancel
              </button>
              <button className="apr-reject-confirm" onClick={handleRejectUser} disabled={!!userProcessing}>
                <Icon name="x" size={14} color="white" />
                {userProcessing ? 'Rejecting...' : 'Reject Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Listing Modal ── */}
      {rejectTarget && (
        <div className="apr-overlay">
          <div className="apr-modal">
            <div className="apr-modal-icon-wrap"><Icon name="x" size={22} color="#dc2626" /></div>
            <h3>Reject Listing</h3>
            <p>Provide a clear reason for rejecting <strong>"{rejectTarget.adInfo?.title}"</strong>. The seller will see this.</p>
            <textarea
              className="apr-reason-input"
              placeholder="e.g. Price is unrealistically high, property images are unclear..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={4}
            />
            <div className="apr-modal-btns">
              <button className="apr-cancel-btn" onClick={() => { setRejectTarget(null); setRejectReason(''); }} disabled={!!processing}>Cancel</button>
              <button className="apr-reject-confirm" onClick={handleReject} disabled={!rejectReason.trim() || !!processing}>
                <Icon name="x" size={14} color="white" />
                {processing ? 'Rejecting...' : 'Reject Listing'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="adm-page-header">
        <h1 className="adm-page-title">Pending Approvals</h1>
        <p className="adm-page-sub">Review and manage pending account & listing approvals</p>
      </div>

      {/* ── Tab Switcher ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #e2e8f0', paddingBottom: '0' }}>
        {[
          { key: 'users',    label: '👤 User Accounts', count: pendingUsers.length },
          { key: 'listings', label: '🏠 Property Listings', count: listings.length },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
            border: 'none', borderBottom: tab === t.key ? '3px solid #16a34a' : '3px solid transparent',
            background: 'transparent', color: tab === t.key ? '#16a34a' : '#64748b',
            marginBottom: '-2px', transition: 'all 0.2s',
          }}>
            {t.label}
            {t.count > 0 && (
              <span style={{
                marginLeft: '8px', background: tab === t.key ? '#16a34a' : '#94a3b8',
                color: '#fff', borderRadius: '10px', padding: '1px 8px', fontSize: '11px'
              }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════ USER ACCOUNTS TAB ══════════════ */}
      {tab === 'users' && (
        <div>
          <div className="apr-info-banner">
            <Icon name="info" size={17} color="#1d4ed8" />
            <span>
              Verify each seller's CNIC before approving. Only seller accounts require admin approval — buyers are approved automatically.
              Approved sellers can list properties on the platform. Rejected sellers will be notified with your reason.
            </span>
          </div>

          {usersLoading && (
            <div className="apr-loading"><div className="apr-spinner"></div><p>Loading pending users...</p></div>
          )}

          {!usersLoading && pendingUsers.length === 0 && (
            <div className="apr-empty">
              <div className="apr-empty-icon-wrap"><Icon name="check" size={36} color="#16a34a" /></div>
              <h3>All Clear</h3>
              <p>No user accounts are pending approval right now.</p>
            </div>
          )}

          {!usersLoading && pendingUsers.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {pendingUsers.map(u => (
                <div key={u._id} style={{
                  background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px',
                  padding: '20px 24px', display: 'flex', alignItems: 'center',
                  gap: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                }}>
                  {/* Avatar */}
                  <img src={u.avatar || '/avatar_male_1_1772875227901.png'} alt=""
                    style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>{u.name}</div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>{u.email}</div>

                    {/* CNIC — highlighted */}
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      background: '#fef9c3', border: '1px solid #fde047',
                      borderRadius: '6px', padding: '3px 10px', marginTop: '8px',
                      fontSize: '13px', fontWeight: '700', color: '#78350f', letterSpacing: '0.5px'
                    }}>
                      🪪 CNIC: {u.cnic || 'Not provided'}
                    </div>

                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '12px', color: '#94a3b8' }}>
                      <span>Role: <strong style={{ color: '#475569' }}>{u.role}</strong></span>
                      <span>Registered: <strong style={{ color: '#475569' }}>{fmtDate(u.createdAt)}</strong></span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button
                      onClick={() => handleApproveUser(u._id)}
                      disabled={userProcessing === u._id}
                      style={{
                        background: '#16a34a', color: '#fff', border: 'none',
                        borderRadius: '8px', padding: '8px 18px', fontWeight: '600',
                        fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                        opacity: userProcessing === u._id ? 0.7 : 1,
                      }}>
                      <Icon name="check" size={14} color="white" />
                      {userProcessing === u._id ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => setRejectUserTarget(u)}
                      disabled={userProcessing === u._id}
                      style={{
                        background: '#fff', color: '#dc2626', border: '1px solid #fca5a5',
                        borderRadius: '8px', padding: '8px 18px', fontWeight: '600',
                        fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                      }}>
                      <Icon name="x" size={14} color="#dc2626" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════ PROPERTY LISTINGS TAB ══════════════ */}
      {tab === 'listings' && (
        <div>
          <div className="apr-info-banner">
            <Icon name="info" size={17} color="#1d4ed8" />
            <span>Review each submission carefully before approving. Approve genuine listings or reject with a specific reason so sellers can correct and resubmit.</span>
          </div>

          {loading && (
            <div className="apr-loading"><div className="apr-spinner"></div><p>Loading pending listings...</p></div>
          )}

          {!loading && listings.length === 0 && (
            <div className="apr-empty">
              <div className="apr-empty-icon-wrap"><Icon name="check" size={36} color="#16a34a" /></div>
              <h3>All Clear</h3>
              <p>No listings are pending approval right now.</p>
            </div>
          )}

          {!loading && listings.length > 0 && (
            <div className="apr-list">
              {listings.map(l => (
                <div key={l._id} className="apr-card">
                  <div className="apr-images">
                    {(l.media?.images || []).slice(0, 4).map((img, i) => (
                      <img key={i} src={img} alt="" className="apr-thumb" />
                    ))}
                    {(l.media?.images?.length || 0) === 0 && (
                      <div className="apr-no-img">
                        <Icon name="image" size={28} color="#d1d5db" />
                        <span>No images uploaded</span>
                      </div>
                    )}
                  </div>
                  <div className="apr-body">
                    <div className="apr-top-row">
                      <div>
                        <h3 className="apr-title">{l.adInfo?.title}</h3>
                        <div className="apr-location-row">
                          <Icon name="pin" size={13} color="#9ca3af" />
                          <span>{l.location?.address || l.location?.city}</span>
                        </div>
                      </div>
                      <div className="apr-price-col">
                        <div className="apr-price">{fmt(l.price?.value)}</div>
                        <span className={`adm-badge ${l.purpose === 'Sell' ? 'badge-green' : 'badge-blue'}`}>
                          {l.purpose === 'Sell' ? 'For Sale' : 'For Rent'}
                        </span>
                      </div>
                    </div>
                    <div className="apr-meta-grid">
                      {[
                        { icon: 'building', label: 'Type',      val: l.propertyType?.subCategory },
                        { icon: 'area',     label: 'Area',      val: `${l.areaSize?.value} ${l.areaSize?.unit}` },
                        { icon: 'bed',      label: 'Bedrooms',  val: l.features?.bedrooms || '—' },
                        { icon: 'bath',     label: 'Bathrooms', val: l.features?.bathrooms || '—' },
                        { icon: 'star',     label: 'Furnished', val: l.features?.furnished },
                        { icon: 'pin',      label: 'City',      val: l.location?.city },
                        { icon: 'users',    label: 'Contact',   val: `${l.contactInfo?.name || '—'} · ${l.contactInfo?.mobile || '—'}` },
                        { icon: 'calendar', label: 'Submitted', val: fmtDate(l.createdAt) },
                      ].map(m => (
                        <div key={m.label} className="apr-meta-item">
                          <span className="apr-meta-icon"><Icon name={m.icon} size={13} color="#9ca3af" /></span>
                          <div>
                            <div className="apr-meta-label">{m.label}</div>
                            <div className="apr-meta-val">{m.val || '—'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {l.adInfo?.description && (
                      <p className="apr-desc">
                        {l.adInfo.description.slice(0, 220)}{l.adInfo.description.length > 220 ? '...' : ''}
                      </p>
                    )}
                    {l.features?.amenities?.length > 0 && (
                      <div className="apr-amenities">
                        {l.features.amenities.map(a => <span key={a} className="apr-chip">{a}</span>)}
                      </div>
                    )}
                    <div className="apr-actions">
                      <button className="apr-approve-btn" onClick={() => handleApprove(l._id)} disabled={processing === l._id}>
                        <Icon name="check" size={15} color="white" />
                        {processing === l._id ? 'Processing...' : 'Approve & Go Live'}
                      </button>
                      <button className="apr-reject-btn" onClick={() => setRejectTarget(l)} disabled={processing === l._id}>
                        <Icon name="x" size={15} color="currentColor" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Approvals;
