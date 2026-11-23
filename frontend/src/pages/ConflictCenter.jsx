import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  AlertTriangle, ShieldAlert, CheckCircle, ArrowRight, UserPlus,
  RefreshCw, Check, X, Filter, Sparkles
} from 'lucide-react';

const ConflictCenter = () => {
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('UNRESOLVED');
  
  // Backup modal state
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [backupCandidates, setBackupCandidates] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchConflicts = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/conflicts?severity=${severityFilter}&status=${statusFilter}`);
      setConflicts(res.data.conflicts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConflicts();
  }, [severityFilter, statusFilter]);

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
      // Find roster ID
      const rosterId = selectedConflict.roster_id;
      await api.post(`/rosters/${rosterId}/reassign-backup`, {
        date: selectedConflict.date,
        process_id: selectedConflict.process_id,
        employee_id: candidate.employee_id
      });
      setSuccessMsg(`Successfully assigned ${candidate.employee_name} as relief backup for ${selectedConflict.brand_name}! Roster revalidated.`);
      setSelectedConflict(null);
      fetchConflicts();
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

      {/* Filter Tabs */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-md-4">
              <label className="form-label text-muted mb-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Filter by Status</label>
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="UNRESOLVED">Active / Unresolved Conflicts</option>
                <option value="RESOLVED">Resolved Conflicts</option>
                <option value="">All Conflicts</option>
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
