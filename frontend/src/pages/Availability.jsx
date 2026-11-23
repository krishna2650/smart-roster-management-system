import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  CalendarDays, Plus, Check, X, Trash2, AlertCircle, Clock, ShieldCheck
} from 'lucide-react';

const Availability = () => {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const initialForm = {
    employee_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    type: 'CASUAL_LEAVE',
    status: 'PENDING',
    reason: ''
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recRes, empRes] = await Promise.all([
        api.get(`/availability?status=${statusFilter}&type=${typeFilter}`),
        api.get('/employees?status=active')
      ]);
      setRecords(recRes.data.records || []);
      setEmployees(empRes.data.employees || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, typeFilter]);

  const handleOpenCreate = () => {
    setFormData({
      ...initialForm,
      employee_id: employees[0]?._id || ''
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.post('/availability', formData);
      setSuccessMsg("Leave / availability request logged successfully.");
      setShowModal(false);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message);
    }
  };

  const handleApprove = async (rec) => {
    try {
      await api.post(`/availability/${rec._id}/approve`, {
        approved_by: employees[0]?._id
      });
      setSuccessMsg(`Leave request for ${rec.employee_name} APPROVED. Now active in roster.`);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleReject = async (rec) => {
    try {
      await api.post(`/availability/${rec._id}/reject`);
      setSuccessMsg(`Leave request for ${rec.employee_name} rejected.`);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleDelete = async (rec) => {
    if (!window.confirm(`Delete this record for ${rec.employee_name}?`)) return;
    try {
      await api.delete(`/availability/${rec._id}`);
      setSuccessMsg("Record deleted.");
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
            Availability, Weekly Offs & Leaves
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.82rem' }}>
            Manage planned leaves, sick leaves, comp-offs, and approvals. Only approved leaves block roster shift allocation.
          </p>
        </div>
        <button
          className="btn btn-primary d-flex align-items-center gap-2"
          onClick={handleOpenCreate}
          style={{ backgroundColor: '#2563eb', fontSize: '0.85rem', fontWeight: 600 }}
        >
          <Plus size={16} /> Log Leave / Comp-Off
        </button>
      </div>

      {successMsg && (
        <div className="alert alert-success d-flex align-items-center gap-2 py-2" role="alert" style={{ fontSize: '0.85rem' }}>
          <Check size={16} /> {successMsg}
        </div>
      )}

      {/* Policy Reminder */}
      <div className="alert alert-info py-2 d-flex align-items-center gap-2 mb-4" style={{ fontSize: '0.8rem' }}>
        <ShieldCheck size={16} className="text-primary flex-shrink-0" />
        <div>
          <strong>Deterministic Rule 1:</strong> Employees on APPROVED leave will never be scheduled to work. PENDING requests remain visible for management review but do not block client coverage until approved. Overlapping leave dates for the same specialist are strictly prevented.
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-2">
            <div className="col-md-3">
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="">All Approval Statuses</option>
                <option value="APPROVED">Approved Only</option>
                <option value="PENDING">Pending Approval (Action Required)</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select form-select-sm"
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
              >
                <option value="">All Leave / Availability Types</option>
                <option value="CASUAL_LEAVE">Casual Leave (CL)</option>
                <option value="SICK_LEAVE">Sick Leave (SL)</option>
                <option value="PLANNED_LEAVE">Planned Leave (PL)</option>
                <option value="COMP_OFF">Compensatory Off (Comp-Off)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.82rem' }}>
            <thead className="table-light">
              <tr>
                <th>Specialist</th>
                <th>Leave Type</th>
                <th>Duration Window</th>
                <th>Reason</th>
                <th>Approval Status</th>
                <th>Approval Details</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">
                    Loading records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">
                    No availability records found.
                  </td>
                </tr>
              ) : (
                records.map(r => (
                  <tr key={r._id}>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{r.employee_name}</strong>
                      <div className="text-muted font-monospace" style={{ fontSize: '0.7rem' }}>{r.employee_code}</div>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {r.type}
                      </span>
                    </td>
                    <td>
                      <strong>{r.start_date}</strong> {r.end_date !== r.start_date && ` to ${r.end_date}`}
                    </td>
                    <td>
                      <span className="text-muted">{r.reason || 'Personal / General reason'}</span>
                    </td>
                    <td>
                      <span className={`badge ${
                        r.status === 'APPROVED' ? 'bg-success' :
                        r.status === 'PENDING' ? 'bg-warning text-dark' : 'bg-danger'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      {r.approval_date ? (
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                          Approved on {r.approval_date}
                        </div>
                      ) : (
                        <span className="text-muted" style={{ fontSize: '0.72rem' }}>Awaiting manager action</span>
                      )}
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        {r.status === 'PENDING' && (
                          <>
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={() => handleApprove(r)}
                              title="Approve Leave"
                            >
                              <Check size={14} /> Approve
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleReject(r)}
                              title="Reject Leave"
                            >
                              <X size={14} /> Reject
                            </button>
                          </>
                        )}
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => handleDelete(r)}
                          title="Delete Record"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" style={{ fontSize: '1rem', fontWeight: 700 }}>
                  Log Leave or Comp-Off Request
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body" style={{ fontSize: '0.85rem' }}>
                  {errorMsg && (
                    <div className="alert alert-danger py-2 mb-3">
                      <AlertCircle size={14} className="me-1" /> {errorMsg}
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label fw-bold">Select Specialist *</label>
                    <select
                      className="form-select"
                      required
                      value={formData.employee_id}
                      onChange={e => setFormData({ ...formData, employee_id: e.target.value })}
                    >
                      <option value="">Select Employee</option>
                      {employees.map(e => (
                        <option key={e._id} value={e._id}>{e.full_name} ({e.employee_id})</option>
                      ))}
                    </select>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-bold">Start Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        required
                        value={formData.start_date}
                        onChange={e => setFormData({ ...formData, start_date: e.target.value, end_date: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-bold">End Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        required
                        value={formData.end_date}
                        onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-bold">Leave Type</label>
                      <select
                        className="form-select"
                        value={formData.type}
                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                      >
                        <option value="CASUAL_LEAVE">Casual Leave</option>
                        <option value="SICK_LEAVE">Sick Leave</option>
                        <option value="PLANNED_LEAVE">Planned Leave</option>
                        <option value="COMP_OFF">Comp-Off</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-bold">Initial Status</label>
                      <select
                        className="form-select"
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="PENDING">Pending Approval</option>
                        <option value="APPROVED">Directly Approved</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Reason / Explanation *</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      required
                      placeholder="e.g. Family emergency, medical checkup, weekend overtime compensation"
                      value={formData.reason}
                      onChange={e => setFormData({ ...formData, reason: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ backgroundColor: '#2563eb' }}>
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Availability;
