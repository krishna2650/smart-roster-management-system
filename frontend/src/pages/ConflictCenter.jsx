import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  AlertTriangle, ShieldAlert, CheckCircle, ArrowRight, UserPlus,
  RefreshCw, Check, X, Filter, Sparkles, Calendar
} from 'lucide-react';

const ConflictCenter = () => {
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('UNRESOLVED');
  const [monthFilter, setMonthFilter] = useState('');
  const [counts, setCounts] = useState({ total: 0, critical: 0, unresolved: 0, resolved: 0 });
  
  // Backup modal state
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [backupCandidates, setBackupCandidates] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchConflicts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (severityFilter) queryParams.append('severity', severityFilter);
      if (statusFilter) queryParams.append('status', statusFilter);
      if (monthFilter) queryParams.append('month', monthFilter);
      
      const res = await api.get(`/conflicts?${queryParams.toString()}`);
      setConflicts(res.data.conflicts || []);
      setCounts({
        total: res.data.global_total ?? res.data.total ?? 0,
        critical: res.data.global_critical_unresolved ?? res.data.critical_count ?? 0,
        unresolved: res.data.global_unresolved ?? res.data.unresolved_count ?? 0,
        resolved: res.data.global_resolved ?? 0
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConflicts();
  }, [severityFilter, statusFilter, monthFilter]);

  const handleOpenBackups = async (c) => {
    setSelectedConflict(c);
    setLoadingBackups(true);
    try {
      const res = await api.get(`/conflicts/${c._id}/backups`);
      setBackupCandidates(res.data.backup_candidates || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleAssignBackup = async (candidate) => {
    if (!selectedConflict) return;
    try {
      // Find roster ID or derive from date (e.g. ROSTER-2026-12)
      const rosterId = selectedConflict.roster_id || `ROSTER-${selectedConflict.date.substring(0, 7)}`;
      await api.post(`/rosters/${rosterId}/reassign-backup`, {
        date: selectedConflict.date,
        process_id: selectedConflict.process_id,
        brand_id: selectedConflict.brand_id,
        employee_id: candidate.employee_id
      });
      setSuccessMsg(`Successfully assigned ${candidate.employee_name} as relief backup for ${selectedConflict.brand_name}! Roster revalidated.`);
      setSelectedConflict(null);
      fetchConflicts();
      window.dispatchEvent(new Event('conflicts-updated'));
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert("Error assigning backup: " + (err.response?.data?.error || err.message));
    }
  };

  const handleResolveManual = async (c) => {
    const notes = prompt("Enter resolution notes / rationale:");
    if (!notes) return;
    try {
      await api.put(`/conflicts/${c._id}/resolve`, { notes });
      setSuccessMsg("Conflict marked as resolved and roster revalidated.");
      fetchConflicts();
      window.dispatchEvent(new Event('conflicts-updated'));
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
            Operational Conflict Detection & Resolution Center
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.82rem' }}>
            Real-time constraint monitor identifying mandatory coverage shortfalls, single-resource brand risks, and incompatible shift collisions.
          </p>
        </div>
        <button
          className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
          onClick={fetchConflicts}
        >
          <RefreshCw size={14} /> Refresh Conflicts
        </button>
      </div>

      {successMsg && (
        <div className="alert alert-success d-flex align-items-center gap-2 py-2" role="alert" style={{ fontSize: '0.85rem' }}>
          <Check size={16} /> {successMsg}
        </div>
      )}

      {/* Telemetry Summary Cards */}
      <div className="row g-2 mb-3">
        <div className="col-sm-3 col-6">
          <div
            className={`p-2 px-3 rounded border d-flex align-items-center justify-content-between ${
              severityFilter === 'CRITICAL' ? 'bg-danger text-white border-danger shadow-sm' : 'bg-white text-dark shadow-xs'
            }`}
            style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
            onClick={() => {
              setSeverityFilter(severityFilter === 'CRITICAL' ? '' : 'CRITICAL');
              setStatusFilter('UNRESOLVED');
            }}
            title="Filter strictly by Critical Mandatory Coverage Gaps"
          >
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>Critical Gaps</div>
              <div style={{ fontSize: '0.68rem', opacity: 0.85 }}>Mandatory Shortfalls</div>
            </div>
            <span className={`badge ${severityFilter === 'CRITICAL' ? 'bg-white text-danger' : 'bg-danger text-white'}`} style={{ fontSize: '0.9rem' }}>
              {counts.critical}
            </span>
          </div>
        </div>

        <div className="col-sm-3 col-6">
          <div
            className={`p-2 px-3 rounded border d-flex align-items-center justify-content-between ${
              statusFilter === 'UNRESOLVED' && severityFilter !== 'CRITICAL' ? 'bg-warning text-dark border-warning shadow-sm' : 'bg-white text-dark shadow-xs'
            }`}
            style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
            onClick={() => {
              setStatusFilter('UNRESOLVED');
              setSeverityFilter('');
            }}
            title="View Active / Unresolved live coverage gaps"
          >
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>Active Live Gaps</div>
              <div style={{ fontSize: '0.68rem', opacity: 0.85 }}>Requiring Relief Backup</div>
            </div>
            <span className={`badge ${statusFilter === 'UNRESOLVED' && severityFilter !== 'CRITICAL' ? 'bg-dark text-white' : 'bg-warning text-dark'}`} style={{ fontSize: '0.9rem' }}>
              {counts.unresolved}
            </span>
          </div>
        </div>

        <div className="col-sm-3 col-6">
          <div
            className={`p-2 px-3 rounded border d-flex align-items-center justify-content-between ${
              statusFilter === 'RESOLVED' ? 'bg-success text-white border-success shadow-sm' : 'bg-white text-dark shadow-xs'
            }`}
            style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
            onClick={() => {
              setStatusFilter('RESOLVED');
              setSeverityFilter('');
            }}
            title="View Resolved conflicts & audit logs"
          >
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>Resolved & Covered</div>
              <div style={{ fontSize: '0.68rem', opacity: 0.85 }}>Relief Assigned / Signed off</div>
            </div>
            <span className={`badge ${statusFilter === 'RESOLVED' ? 'bg-white text-success' : 'bg-success text-white'}`} style={{ fontSize: '0.9rem' }}>
              {counts.resolved}
            </span>
          </div>
        </div>

        <div className="col-sm-3 col-6">
          <div
            className={`p-2 px-3 rounded border d-flex align-items-center justify-content-between ${
              statusFilter === '' && severityFilter === '' ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-dark shadow-xs'
            }`}
            style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
            onClick={() => {
              setStatusFilter('');
              setSeverityFilter('');
            }}
            title="View All conflicts"
          >
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>All Conflicts</div>
              <div style={{ fontSize: '0.68rem', opacity: 0.85 }}>Active + Resolved Records</div>
            </div>
            <span className={`badge ${statusFilter === '' && severityFilter === '' ? 'bg-white text-primary' : 'bg-primary text-white'}`} style={{ fontSize: '0.9rem' }}>
              {counts.total}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-md-4">
              <label className="form-label text-muted mb-1 d-flex align-items-center gap-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                <Calendar size={13} className="text-primary" /> Filter by Calendar Month
              </label>
              <select
                className="form-select form-select-sm"
                value={monthFilter}
                onChange={e => setMonthFilter(e.target.value)}
              >
                <option value="">All Months</option>
                <option value="12">December (10 Conflicts - PureSkin, EcoGlow, Velvet Thread, VoltTech)</option>
                <option value="1">January (VoltTech, NutriFuel)</option>
                <option value="2">February (KetoBites, UrbanStyle, VoltTech)</option>
                <option value="3">March (AudioPulse, VoltTech, Zenith)</option>
                <option value="4">April (SmartCharge, LuxeHome, VoltTech, Zenith)</option>
                <option value="5">May (GlowJewel, NutriFuel)</option>
                <option value="6">June (UrbanStyle, PureSkin, Velvet Thread)</option>
                <option value="7">July (KetoBites, VoltTech)</option>
                <option value="8">August (AudioPulse, EcoGlow)</option>
                <option value="9">September (LuxeHome, SmartCharge, VoltTech)</option>
                <option value="10">October (GlowJewel, VoltTech, Zenith)</option>
                <option value="11">November (NutriFuel, UrbanStyle, VoltTech, Zenith)</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label text-muted mb-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Filter by Status</label>
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="UNRESOLVED">Active / Unresolved Conflicts ({counts.unresolved} live)</option>
                <option value="RESOLVED">Resolved Conflicts ({counts.resolved} archived)</option>
                <option value="">All Conflicts ({counts.total} total)</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label text-muted mb-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Filter by Severity</label>
              <select
                className="form-select form-select-sm"
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value)}
              >
                <option value="">All Severity Levels</option>
                <option value="CRITICAL">Critical (Mandatory Coverage Gaps)</option>
                <option value="HIGH">High (Double Booking / Capacity)</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
          <div className="text-muted mt-2 pt-2 border-top d-flex flex-wrap justify-content-between align-items-center" style={{ fontSize: '0.76rem' }}>
            <div>
              Showing <strong>{conflicts.length}</strong> {statusFilter === 'UNRESOLVED' ? 'live unassigned gap(s)' : statusFilter === 'RESOLVED' ? 'resolved gap(s)' : 'conflict record(s)'}.
            </div>
            {statusFilter === 'UNRESOLVED' && counts.resolved > 0 && (
              <span className="text-primary fw-semibold" style={{ cursor: 'pointer' }} onClick={() => setStatusFilter('RESOLVED')}>
                {counts.resolved} previously resolved conflicts archived in audit log →
              </span>
            )}
            {statusFilter === 'RESOLVED' && counts.unresolved > 0 && (
              <span className="text-danger fw-semibold" style={{ cursor: 'pointer' }} onClick={() => setStatusFilter('UNRESOLVED')}>
                ← Return to {counts.unresolved} live unresolved gap(s)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Conflicts List */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <div className="text-muted mt-2" style={{ fontSize: '0.85rem' }}>Evaluating constraints...</div>
        </div>
      ) : conflicts.length === 0 ? (
        <div className="card border-0 shadow-sm p-5 text-center bg-white">
          <CheckCircle size={48} className="text-success mb-3 mx-auto" />
          <h4 style={{ fontWeight: 700, color: '#0f172a' }}>Zero Conflicts Detected</h4>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>
            All active client processes have verified coverage matching their designated operating calendars.
          </p>
        </div>
      ) : (
        <div className="row g-3">
          {conflicts.map(c => (
            <div key={c._id} className="col-12">
              <div className={`conflict-card ${c.severity?.toLowerCase()}`}>
                <div className="d-flex flex-wrap justify-content-between align-items-start mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className={`badge ${
                      c.severity === 'CRITICAL' ? 'bg-danger text-white' :
                      c.severity === 'HIGH' ? 'bg-warning text-dark' : 'bg-primary'
                    }`} style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                      {c.severity} SEVERITY
                    </span>
                    <span className="badge bg-light text-secondary border font-monospace">
                      {c.conflict_id}
                    </span>
                    <span className="badge bg-light text-primary border font-monospace">
                      Date: {c.date}
                    </span>
                  </div>

                  <span className={`badge ${c.resolution_status === 'RESOLVED' ? 'bg-success' : 'bg-secondary'}`}>
                    {c.resolution_status}
                  </span>
                </div>

                <div className="row g-3 align-items-center">
                  <div className="col-lg-8">
                    <h5 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                      {c.brand_name} • {c.process_name}
                    </h5>
                    <p className="mb-2" style={{ fontSize: '0.82rem', color: '#334155' }}>
                      {c.explanation}
                    </p>

                    <div className="p-2 bg-light rounded d-flex align-items-start gap-2" style={{ fontSize: '0.78rem' }}>
                      <Sparkles size={16} className="text-primary flex-shrink-0 mt-1" />
                      <div>
                        <strong>Algorithmic Recommendation:</strong> {c.suggested_resolution}
                      </div>
                    </div>

                    {c.resolution_notes && (
                      <div className="text-muted mt-2" style={{ fontSize: '0.75rem' }}>
                        <strong>Resolution Note:</strong> {c.resolution_notes}
                      </div>
                    )}
                  </div>

                  <div className="col-lg-4 text-lg-end">
                    {c.resolution_status === 'UNRESOLVED' ? (
                      <div className="d-flex flex-column gap-2 align-items-lg-end">
                        <button
                          className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                          onClick={() => handleOpenBackups(c)}
                          style={{ backgroundColor: '#2563eb', fontSize: '0.82rem' }}
                        >
                          <UserPlus size={14} /> Assign Recommended Backup
                        </button>
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => handleResolveManual(c)}
                          style={{ fontSize: '0.78rem' }}
                        >
                          Verify & Mark Resolved
                        </button>
                      </div>
                    ) : (
                      <div className="text-success fw-bold d-flex align-items-center gap-1 justify-content-lg-end" style={{ fontSize: '0.85rem' }}>
                        <CheckCircle size={16} /> Resolved
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Backup Recommendation Modal */}
      {selectedConflict && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-light">
                <div>
                  <h5 className="modal-title mb-0" style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                    Backup Reassignment Recommendation Engine
                  </h5>
                  <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                    Target: {selectedConflict.brand_name} ({selectedConflict.process_name}) on {selectedConflict.date}
                  </span>
                </div>
                <button type="button" className="btn-close" onClick={() => setSelectedConflict(null)}></button>
              </div>
              <div className="modal-body" style={{ fontSize: '0.85rem' }}>
                <div className="alert alert-warning py-2 mb-3" style={{ fontSize: '0.8rem' }}>
                  <AlertTriangle size={14} className="me-1" />
                  <strong>Issue:</strong> {selectedConflict.explanation}
                </div>

                <h6 className="fw-bold mb-2">
                  <Sparkles size={16} className="text-primary me-1" />
                  Eligible Available Candidates (Ranked by Pod & Skill Compatibility):
                </h6>

                {loadingBackups ? (
                  <div className="text-center py-4 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Calculating candidate suitability scores...
                  </div>
                ) : backupCandidates.length === 0 ? (
                  <p className="text-muted py-3">No immediate eligible backups available on this date.</p>
                ) : (
                  <div className="list-group">
                    {backupCandidates.map((cand, idx) => (
                      <div key={cand.employee_id} className="list-group-item d-flex justify-content-between align-items-center p-3">
                        <div>
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-primary text-white" style={{ fontSize: '0.72rem' }}>
                              #{idx + 1} Best Match
                            </span>
                            <strong style={{ fontSize: '0.95rem' }}>{cand.employee_name}</strong>
                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>({cand.designation})</span>
                          </div>
                          <div className="mt-1 d-flex flex-wrap gap-1">
                            {cand.reasons.map((r, i) => (
                              <span key={i} className="badge bg-light text-secondary border" style={{ fontSize: '0.7rem' }}>
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="d-flex align-items-center gap-3">
                          <div className="text-end">
                            <div className="text-success fw-bold" style={{ fontSize: '1rem' }}>
                              {cand.score} pts
                            </div>
                            <div className="text-muted" style={{ fontSize: '0.65rem' }}>Suitability Score</div>
                          </div>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleAssignBackup(cand)}
                            style={{ backgroundColor: '#2563eb' }}
                          >
                            Assign Relief
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedConflict(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConflictCenter;
