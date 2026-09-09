import React, { useEffect, useState, useCallback } from 'react';
import './Listings.css';

const API_BASE = import.meta.env.VITE_API_URL;
const token = () => localStorage.getItem('adminToken');

/* ─── SVG Icon Library ─── */
const Icon = ({ name, size = 16, color = 'currentColor' }) => {
  const icons = {
    search: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    bed:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>,
    bath:   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><line x1="10" y1="5" x2="8" y2="7"/><line x1="2" y1="12" x2="22" y2="12"/></svg>,
    area:   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>,
    pin:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    trash:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
    calendar:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    building:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="22" x2="9" y2="2"/><line x1="15" y1="22" x2="15" y2="2"/><line x1="4" y1="7" x2="9" y2="7"/><line x1="4" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="20" y2="12"/><line x1="15" y1="7" x2="20" y2="7"/></svg>,
    tag:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
    image:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
    chevronLeft: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
    chevronRight:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
    check:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    x:      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    clock:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    filter: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  };
  return icons[name] || null;
};

/* ─── Status config ─── */
const STATUS_CFG = {
  pending:  { label: 'Pending',  cls: 'lst2-status-pending',  icon: 'clock' },
  approved: { label: 'Approved', cls: 'lst2-status-approved', icon: 'check' },
  rejected: { label: 'Rejected', cls: 'lst2-status-rejected', icon: 'x'    },
};

const Listings = () => {
  const [listings, setListings] = useState([]);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading]   = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [counts, setCounts]     = useState({ all: 0, pending: 0, approved: 0, rejected: 0 });

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const [mainRes, allRes, pendRes, apprRes, rejRes] = await Promise.all([
        fetch(`/api/admin/listings?page=${page}&limit=9&search=${encodeURIComponent(search)}&status=${statusFilter}`,
          { headers: { Authorization: `Bearer ${token()}` } }),
        fetch(`/api/admin/listings?page=1&limit=1`, { headers: { Authorization: `Bearer ${token()}` } }),
        fetch(`/api/admin/listings?page=1&limit=1&status=pending`,  { headers: { Authorization: `Bearer ${token()}` } }),
        fetch(`/api/admin/listings?page=1&limit=1&status=approved`, { headers: { Authorization: `Bearer ${token()}` } }),
        fetch(`/api/admin/listings?page=1&limit=1&status=rejected`, { headers: { Authorization: `Bearer ${token()}` } }),
      ]);
      const [data, all, pend, appr, rej] = await Promise.all(
        [mainRes, allRes, pendRes, apprRes, rejRes].map(r => r.json())
      );
      setListings(data.listings || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setCounts({ all: all.total || 0, pending: pend.total || 0, approved: appr.total || 0, rejected: rej.total || 0 });
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/listings/${deleteTarget._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` }
      });
      setDeleteTarget(null);
      fetchListings();
    } finally { setDeleting(false); }
  };

  const fmt = v => {
    if (!v) return 'N/A';
    if (v >= 10000000) return `Rs ${(v / 10000000).toFixed(1)} Cr`;
    if (v >= 100000)   return `Rs ${(v / 100000).toFixed(1)} Lac`;
    return `Rs ${v.toLocaleString()}`;
  };

  const fmtDate = d => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });

  const filterTabs = [
    { key: '',         label: 'All Listings', count: counts.all },
    { key: 'pending',  label: 'Pending',      count: counts.pending },
    { key: 'approved', label: 'Approved',     count: counts.approved },
    { key: 'rejected', label: 'Rejected',     count: counts.rejected },
  ];

  return (
    <div className="lst2-root">

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="lst2-overlay">
          <div className="lst2-modal">
            <div className="lst2-modal-icon-wrap">
              <Icon name="trash" size={24} color="#dc2626" />
            </div>
            <h3 className="lst2-modal-title">Remove Listing</h3>
            <p className="lst2-modal-desc">
              You're about to permanently remove <strong>"{deleteTarget.adInfo?.title}"</strong>.
              This action cannot be undone.
            </p>
            <div className="lst2-modal-actions">
              <button className="lst2-modal-cancel" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancel
              </button>
              <button className="lst2-modal-confirm" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Removing...' : 'Remove Listing'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="lst2-header">
        <div>
          <h1 className="lst2-title">Property Listings</h1>
          <p className="lst2-subtitle">{total} propert{total !== 1 ? 'ies' : 'y'} submitted by verified sellers</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="lst2-tabs">
        {filterTabs.map(t => (
          <button key={t.key}
            className={`lst2-tab ${statusFilter === t.key ? 'lst2-tab-active' : ''}`}
            onClick={() => { setStatusFilter(t.key); setPage(1); }}>
            {t.label}
            <span className={`lst2-tab-count ${statusFilter === t.key ? 'lst2-tab-count-active' : ''}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="lst2-search-row">
        <div className="lst2-search-wrap">
          <span className="lst2-search-icon"><Icon name="search" size={16} color="#9ca3af" /></span>
          <input
            className="lst2-search"
            placeholder="Search listings by title..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="lst2-results-label">
          <Icon name="filter" size={14} color="#6b7280" />
          <span>{total} result{total !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="lst2-loading">
          <div className="lst2-spinner" />
          <span>Loading listings...</span>
        </div>
      )}

      {/* Empty */}
      {!loading && listings.length === 0 && (
        <div className="lst2-empty">
          <div className="lst2-empty-icon"><Icon name="building" size={40} color="#d1d5db" /></div>
          <h3>No listings found</h3>
          <p>Try adjusting your search or filter criteria.</p>
        </div>
      )}

      {/* Cards grid */}
      {!loading && listings.length > 0 && (
        <div className="lst2-grid">
          {listings.map(l => {
            const s = l.status || 'pending';
            const sc = STATUS_CFG[s] || STATUS_CFG.pending;
            return (
              <div 
                key={l._id} 
                className="lst2-card"
                onClick={() => window.open(`${window.location.origin.replace(/-admin\b/, '')}/properties/${l._id}`, '_blank')}
                style={{ cursor: 'pointer' }}
              >
                {/* Image */}
                <div className="lst2-card-img">
                  {l.media?.images?.[0]
                    ? <img src={`${API_BASE}${l.media.images[0]}`} alt={l.adInfo?.title} />
                    : <div className="lst2-card-no-img">
                        <Icon name="image" size={32} color="#d1d5db" />
                        <span>No Image</span>
                      </div>
                  }
                  {/* Status badge */}
                  <div className={`lst2-status-badge ${sc.cls}`}>
                    <Icon name={sc.icon} size={11} color="currentColor" />
                    {sc.label}
                  </div>
                  {/* Purpose badge */}
                  <div className={`lst2-purpose-badge ${l.purpose === 'Sell' ? 'lst2-purpose-sale' : 'lst2-purpose-rent'}`}>
                    {l.purpose === 'Sell' ? 'For Sale' : 'For Rent'}
                  </div>
                  {/* Image count */}
                  {(l.media?.images?.length || 0) > 1 && (
                    <div className="lst2-img-count">
                      <Icon name="image" size={11} color="white" />
                      {l.media.images.length}
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="lst2-card-body">
                  {/* Title */}
                  <h3 className="lst2-card-title">{l.adInfo?.title || 'Untitled Property'}</h3>

                  {/* Location */}
                  <div className="lst2-card-location">
                    <Icon name="pin" size={13} color="#9ca3af" />
                    <span>{l.location?.address || l.location?.city || '—'}</span>
                  </div>

                  {/* Property type chip */}
                  <div className="lst2-card-type-row">
                    <span className="lst2-type-chip">
                      <Icon name="building" size={11} color="#16a34a" />
                      {l.propertyType?.category} · {l.propertyType?.subCategory}
                    </span>
                  </div>

                  {/* Meta row */}
                  <div className="lst2-card-meta">
                    {l.features?.bedrooms && (
                      <div className="lst2-meta-item">
                        <Icon name="bed" size={13} color="#6b7280" />
                        <span>{l.features.bedrooms} Beds</span>
                      </div>
                    )}
                    {l.features?.bathrooms && (
                      <div className="lst2-meta-item">
                        <Icon name="bath" size={13} color="#6b7280" />
                        <span>{l.features.bathrooms} Bath</span>
                      </div>
                    )}
                    {l.areaSize?.value && (
                      <div className="lst2-meta-item">
                        <Icon name="area" size={13} color="#6b7280" />
                        <span>{l.areaSize.value} {l.areaSize.unit}</span>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="lst2-divider" />

                  {/* Footer */}
                  <div className="lst2-card-footer">
                    <div className="lst2-price">{fmt(l.price?.value)}</div>
                    <div className="lst2-date">
                      <Icon name="calendar" size={12} color="#9ca3af" />
                      {fmtDate(l.createdAt)}
                    </div>
                  </div>

                  {/* Remove button */}
                  <button 
                    className="lst2-remove-btn" 
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(l); }}
                  >
                    <Icon name="trash" size={14} color="currentColor" />
                    Remove Listing
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && !loading && (
        <div className="lst2-pagination">
          <button className="lst2-pg-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            <Icon name="chevronLeft" size={16} />
          </button>
          <div className="lst2-pg-pills">
            {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(n => (
              <button key={n} className={`lst2-pg-pill ${n === page ? 'lst2-pg-pill-active' : ''}`}
                onClick={() => setPage(n)}>{n}</button>
            ))}
            {pages > 7 && <span className="lst2-pg-dots">…</span>}
          </div>
          <button className="lst2-pg-btn" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>
            <Icon name="chevronRight" size={16} />
          </button>
          <span className="lst2-pg-label">Page {page} of {pages}</span>
        </div>
      )}
    </div>
  );
};

export default Listings;
