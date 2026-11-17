import React, { useEffect, useState, useRef } from 'react';
import Icon from '../components/Icon';
import './TrainingPanel.css';

const token = () => localStorage.getItem('adminToken');
const API   = `${import.meta.env.VITE_API_URL}/api/admin/train`;

const MODEL_LABELS = {
  homes_buy:        { label: 'Homes — Buy',        color: 'green'  },
  homes_rent:       { label: 'Homes — Rent',        color: 'blue'   },
  plots_buy:        { label: 'Plots — Buy',         color: 'purple' },
  commercial_buy:   { label: 'Commercial — Buy',    color: 'orange' },
  commercial_rent:  { label: 'Commercial — Rent',   color: 'teal'   },
  investment_score: { label: 'Investment Score',    color: 'gold'   },
};

function timeAgo(date) {
  if (!date) return 'Never';
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function fmtPKR(v) {
  if (!v) return '—';
  if (v >= 10000000) return `Rs ${(v/10000000).toFixed(1)} Cr`;
  if (v >= 100000)   return `Rs ${(v/100000).toFixed(1)} Lac`;
  return `Rs ${Number(v).toLocaleString()}`;
}

export default function TrainingPanel() {
  const [status,    setStatus]    = useState({ status: 'idle', modelFiles: [] });
  const [logs,      setLogs]      = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [reloading, setReloading] = useState(false);
  const [toast,     setToast]     = useState(null);
  const logRef = useRef(null);
  const pollRef = useRef(null);

  // ── Fetch status ────────────────────────────────────────────────────────────
  const fetchStatus = async () => {
    try {
      const res  = await fetch(`${API}/status`, { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      setStatus(data);
    } catch (_) {}
  };

  // ── Fetch logs ───────────────────────────────────────────────────────────────
  const fetchLogs = async () => {
    try {
      const res  = await fetch(`${API}/logs`, { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (_) {}
  };

  // ── Auto-scroll log terminal ─────────────────────────────────────────────────
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  // ── Poll while training ──────────────────────────────────────────────────────
  useEffect(() => {
    fetchStatus();
    fetchLogs();

    if (status.status === 'running') {
      pollRef.current = setInterval(() => {
        fetchStatus();
        fetchLogs();
      }, 2000);
    } else {
      clearInterval(pollRef.current);
    }
    return () => clearInterval(pollRef.current);
  }, [status.status]);

  // Initial load
  useEffect(() => { fetchStatus(); fetchLogs(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Load last training results from MongoDB (for Vercel/cloud) ──────────────
  const loadLastResults = async () => {
    try {
      const res  = await fetch(`${API}/last-results`, { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      if (data.logs?.length) {
        setLogs(data.logs);
        setStatus(s => ({
          ...s,
          status:     data.status || 'done',
          startedAt:  data.startedAt,
          finishedAt: data.finishedAt,
        }));
        showToast('Showing last local training results from database.', 'success');
      } else {
        showToast('No previous training results found. Run training locally first.', 'warning');
      }
    } catch {
      showToast('Could not load last results.', 'error');
    }
  };

  // ── Start training ───────────────────────────────────────────────────────────
  const handleStart = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res  = await fetch(`${API}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Training started! Logs will stream below.', 'success');
        setStatus(s => ({ ...s, status: 'running' }));
      } else if (res.status === 503 && data.message === 'cloud') {
        // Vercel environment — display last saved results from MongoDB
        if (data.lastLogs?.length) {
          setLogs(data.lastLogs);
          setStatus(s => ({
            ...s,
            status:     data.lastStatus || 'done',
            startedAt:  data.lastStartedAt,
            finishedAt: data.lastFinishedAt,
          }));
          showToast('Cloud mode — showing last local training results.', 'success');
        } else {
          showToast('No saved results yet. Run training locally first: /opt/anaconda3/bin/python3 train.py', 'warning');
        }
      } else {
        showToast(data.message || 'Failed to start training.', 'error');
      }
    } catch {
      showToast('Network error — is the local backend running?', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Stop training ────────────────────────────────────────────────────────────
  const handleStop = async () => {
    await fetch(`${API}/stop`, { method: 'POST', headers: { Authorization: `Bearer ${token()}` } });
    setStatus(s => ({ ...s, status: 'idle' }));
    showToast('Training stopped.', 'warning');
  };

  // ── Reload AI Models ─────────────────────────────────────────────────────────
  const handleReload = async () => {
    setReloading(true);
    try {
      const res  = await fetch(`${API}/reload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      showToast(data.message, res.ok ? 'success' : 'warning');
    } catch {
      showToast('Reload failed.', 'error');
    } finally {
      setReloading(false);
    }
  };

  const isRunning = status.status === 'running';
  const isDone    = status.status === 'done';
  const isError   = status.status === 'error';

  return (
    <div className="tp">
      {/* Toast */}
      {toast && (
        <div className={`tp-toast tp-toast-${toast.type}`}>{toast.msg}</div>
      )}

      {/* Header */}
      <div className="adm-page-header">
        <h1 className="adm-page-title">AI Model Training</h1>
        <p className="adm-page-sub">Retrain XGBoost &amp; Random Forest models from the latest dataset</p>
      </div>

      {/* Cloud limitation notice */}
      <div style={{
        background: '#fefce8', border: '1px solid #fde047', borderRadius: '10px',
        padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px',
        justifyContent: 'space-between', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <Icon name="alertTriangle" size={17} color="#ca8a04" />
          <div style={{ fontSize: '13px', color: '#854d0e', lineHeight: '1.5' }}>
            <strong>Training runs locally only.</strong> Vercel (cloud) cannot spawn Python processes.
            <br />To retrain: open Terminal → <code style={{ background: '#fef9c3', padding: '1px 5px', borderRadius: '4px' }}>
              cd ai-models &amp;&amp; /opt/anaconda3/bin/python3 train.py
            </code>
          </div>
        </div>
        <button
          onClick={loadLastResults}
          style={{
            background: '#854d0e', color: '#fff', border: 'none', borderRadius: '7px',
            padding: '7px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          <Icon name="refresh" size={13} color="#fff" /> Load Last Results
        </button>
      </div>

      {/* Status Banner */}
      <div className={`tp-banner tp-banner-${status.status}`}>
        <div className="tp-banner-left">
          <span className={`tp-dot tp-dot-${status.status}`} />
          <span className="tp-banner-status">
            {isRunning ? 'Training in progress…' :
             isDone    ? `Last training completed ${timeAgo(status.finishedAt)}` :
             isError   ? 'Last training failed' :
                         'Idle — No training running'}
          </span>
          {status.startedAt && (
            <span className="tp-banner-meta">
              Started: {new Date(status.startedAt).toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="tp-banner-actions">
          {!isRunning ? (
            <button className="tp-btn tp-btn-primary" onClick={handleStart} disabled={loading}>
              {loading ? 'Starting…' : <><Icon name="play" size={14} color="white" /> Start Training</>}
            </button>
          ) : (
            <button className="tp-btn tp-btn-danger" onClick={handleStop}>
              <Icon name="square" size={14} color="white" /> Stop Training
            </button>
          )}
          <button
            className="tp-btn tp-btn-secondary"
            onClick={handleReload}
            disabled={reloading}
          >
            {reloading ? 'Reloading…' : <><Icon name="refresh" size={14} color="currentColor" /> Reload AI Models</>}
          </button>
        </div>
      </div>

      <div className="tp-grid">
        {/* Log Terminal */}
        <div className="tp-card tp-card-log">
          <div className="tp-card-header">
            <span className="tp-card-title">Live Training Log</span>
            {isRunning && <span className="tp-live-badge">● LIVE</span>}
            {!isRunning && logs.length > 0 && <span style={{ fontSize: '11px', color: '#6b7280' }}>Stored results</span>}
          </div>
          <div className="tp-terminal" ref={logRef}>
            {logs.length === 0 ? (
              <span className="tp-terminal-empty">No logs yet. Click "Start Training" to begin.</span>
            ) : (
              logs.map((line, i) => {
                const isSuccess = line.includes('✅') || line.includes('saved') || line.includes('complete');
                const isError   = line.includes('❌') || line.includes('Error') || line.includes('error');
                const isWarning = line.includes('⚠️') || line.includes('warning');
                const isHeader  = line.includes('===') || line.includes('---');
                return (
                  <div
                    key={i}
                    className={`tp-log-line ${
                      isSuccess ? 'tp-log-success' :
                      isError   ? 'tp-log-error'   :
                      isWarning ? 'tp-log-warning'  :
                      isHeader  ? 'tp-log-header'   : ''
                    }`}
                  >
                    {line}
                  </div>
                );
              })
            )}
            {isRunning && <div className="tp-cursor">█</div>}
          </div>
        </div>

        {/* Model Cards */}
        <div className="tp-card tp-card-models">
          <div className="tp-card-header">
            <span className="tp-card-title">Trained Models</span>
            <span className="tp-model-count">{status.modelFiles?.length || 0} models</span>
          </div>

          {status.modelFiles?.length === 0 ? (
            <div className="tp-empty">No trained models found. Run training to generate them.</div>
          ) : (
            <div className="tp-model-list">
              {status.modelFiles.map(m => {
                const info = MODEL_LABELS[m.key] || { label: m.key, color: 'green' };
                return (
                  <div key={m.filename} className={`tp-model-card tp-model-${info.color}`}>
                    <div className="tp-model-top">
                      <span className="tp-model-label">{info.label}</span>
                      <span className="tp-model-ago">{timeAgo(m.lastModified)}</span>
                    </div>
                    <div className="tp-model-stats">
                      {m.r2 !== null && (
                        <div className="tp-model-stat">
                          <span className="tp-stat-label">R² Score</span>
                          <span className="tp-stat-value tp-stat-r2">{(m.r2 * 100).toFixed(1)}%</span>
                        </div>
                      )}
                      {m.mae !== null && (
                        <div className="tp-model-stat">
                          <span className="tp-stat-label">MAE</span>
                          <span className="tp-stat-value">{fmtPKR(m.mae)}</span>
                        </div>
                      )}
                      {m.trainSamples !== null && (
                        <div className="tp-model-stat">
                          <span className="tp-stat-label">Samples</span>
                          <span className="tp-stat-value">{m.trainSamples?.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="tp-model-stat">
                        <span className="tp-stat-label">Size</span>
                        <span className="tp-stat-value">{m.sizeKB} KB</span>
                      </div>
                    </div>
                    {m.algorithm && (
                      <div className="tp-model-algo">{m.algorithm}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
