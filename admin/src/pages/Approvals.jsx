import React, { useEffect, useState, useCallback } from 'react';
import Icon from '../components/Icon';
import './Approvals.css';

const API_BASE = import.meta.env.VITE_API_URL;
const token = () => localStorage.getItem('adminToken');

const STATUS_ICON = { pending: 'clock', approved: 'check', rejected: 'x' };
const STATUS_CLS  = { pending: 'lst2-status-pending', approved: 'lst2-status-approved', rejected: 'lst2-status-rejected' };

const Approvals = () => {
  const [listings, setListings]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing]   = useState('');

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/pending`, { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      setListings(data.listings || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleApprove = async (id) => {
    setProcessing(id);
    try {
      await fetch(`/api/admin/approve/${id}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token()}` }
      });
      setListings(prev => prev.filter(l => l._id !== id));
    } finally { setProcessing(''); }
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    setProcessing(rejectTarget._id);
    try {
      await fetch(`/api/admin/reject/${rejectTarget._id}`, {
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
      {/* Reject Modal */}
      {rejectTarget && (
        <div className="apr-overlay">
          <div className="apr-modal">
            <div className="apr-modal-icon-wrap">
              <Icon name="x" size={22} color="#dc2626" />
            </div>
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
              <button className="apr-cancel-btn"
                onClick={() => { setRejectTarget(null); setRejectReason(''); }}
                disabled={!!processing}>
                Cancel
              </button>
              <button className="apr-reject-confirm"
                onClick={handleReject}
                disabled={!rejectReason.trim() || !!processing}>
                <Icon name="x" size={14} color="white" />
                {processing ? 'Rejecting...' : 'Reject Listing'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="adm-page-header">
        <h1 className="adm-page-title">Pending Approvals</h1>
        <p className="adm-page-sub">
          {loading ? 'Loading...' : `${listings.length} listing${listings.length !== 1 ? 's' : ''} awaiting review`}
        </p>
      </div>

      {/* Info banner */}
      <div className="apr-info-banner">
        <Icon name="info" size={17} color="#1d4ed8" />
        <span>
          Review each submission carefully before approving. Approve genuine listings or reject with a specific
          reason so sellers can correct and resubmit.
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div className="apr-loading">
          <div className="apr-spinner"></div>
          <p>Loading pending listings...</p>
        </div>
      )}

      {/* Empty */}
      {!loading && listings.length === 0 && (
        <div className="apr-empty">
          <div className="apr-empty-icon-wrap">
            <Icon name="check" size={36} color="#16a34a" />
          </div>
          <h3>All Clear</h3>
          <p>No listings are pending approval right now.</p>
        </div>
      )}

      {/* Cards */}
      {!loading && listings.length > 0 && (
        <div className="apr-list">
          {listings.map(l => (
            <div key={l._id} className="apr-card">
              {/* Images */}
              <div className="apr-images">
                {(l.media?.images || []).slice(0, 4).map((img, i) => (
                  <img key={i} src={`${API_BASE}${img}`} alt="" className="apr-thumb" />
                ))}
                {(l.media?.images?.length || 0) === 0 && (
                  <div className="apr-no-img">
                    <Icon name="image" size={28} color="#d1d5db" />
                    <span>No images uploaded</span>
                  </div>
                )}
              </div>

              {/* Body */}
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

                {/* Meta grid */}
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

                {/* Description */}
                {l.adInfo?.description && (
                  <p className="apr-desc">
                    {l.adInfo.description.slice(0, 220)}{l.adInfo.description.length > 220 ? '...' : ''}
                  </p>
                )}

                {/* Amenities */}
                {l.features?.amenities?.length > 0 && (
                  <div className="apr-amenities">
                    {l.features.amenities.map(a => <span key={a} className="apr-chip">{a}</span>)}
                  </div>
                )}

                {/* Actions */}
                <div className="apr-actions">
                  <button className="apr-approve-btn"
                    onClick={() => handleApprove(l._id)}
                    disabled={processing === l._id}>
                    <Icon name="check" size={15} color="white" />
                    {processing === l._id ? 'Processing...' : 'Approve & Go Live'}
                  </button>
                  <button className="apr-reject-btn"
                    onClick={() => setRejectTarget(l)}
                    disabled={processing === l._id}>
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
  );
};

export default Approvals;
