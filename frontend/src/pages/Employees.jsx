import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Users, Search, Filter, Plus, Edit2, Trash2, Eye, X, Check, AlertCircle, Building2, GitBranch
} from 'lucide-react';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [pods, setPods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPod, setSelectedPod] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // Modals state
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const initialForm = {
    employee_id: '',
    full_name: '',
    email: '',
    phone: '',
    designation: 'Operations Associate',
    pod_id: '',
    role: 'OPERATIONS_ASSOCIATE',
    employment_status: 'Full-time',
    date_of_joining: new Date().toISOString().split('T')[0],
    skills: 'Customer Support, NDR',
    preferred_weekly_off: 'Sunday',
    is_active: true
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [empRes, podRes] = await Promise.all([
        api.get(`/employees?search=${search}&pod_id=${selectedPod}&status=${selectedStatus}`),
        api.get('/pods')
      ]);
      setEmployees(empRes.data.employees || []);
      setPods(podRes.data.pods || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, selectedPod, selectedStatus]);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormData({
      ...initialForm,
      employee_id: `EMP-${String(employees.length + 1).padStart(3, '0')}`,
      pod_id: pods[0]?._id || ''
    });
    setErrorMsg('');
    setShowFormModal(true);
  };

  const handleOpenEdit = (emp) => {
    setIsEditing(true);
    setFormData({
      _id: emp._id,
      employee_id: emp.employee_id,
      full_name: emp.full_name,
      email: emp.email,
      phone: emp.phone || '',
      designation: emp.designation,
      pod_id: emp.pod_id || '',
      role: emp.role || 'OPERATIONS_ASSOCIATE',
      employment_status: emp.employment_status || 'Full-time',
      date_of_joining: emp.date_of_joining || '',
      skills: Array.isArray(emp.skills) ? emp.skills.join(', ') : emp.skills,
      preferred_weekly_off: Array.isArray(emp.preferred_weekly_off) ? emp.preferred_weekly_off[0] : emp.preferred_weekly_off || 'Sunday',
      is_active: emp.is_active !== undefined ? emp.is_active : true
    });
    setErrorMsg('');
    setShowFormModal(true);
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const payload = {
        ...formData,
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        preferred_weekly_off: [formData.preferred_weekly_off]
      };

      if (isEditing) {
        await api.put(`/employees/${formData._id}`, payload);
        setSuccessMsg(`Employee ${formData.full_name} updated successfully!`);
      } else {
        await api.post('/employees', payload);
        setSuccessMsg(`Employee ${formData.full_name} registered successfully!`);
      }
      setShowFormModal(false);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message);
    }
  };

  const handleDelete = async (emp) => {
    if (!window.confirm(`Are you sure you want to delete ${emp.full_name} (${emp.employee_id})?`)) return;
    try {
      await api.delete(`/employees/${emp._id}`);
      setSuccessMsg(`Employee deleted successfully.`);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert("Cannot delete: " + (err.response?.data?.error || err.message));
    }
  };

  const handleViewProfile = async (emp) => {
    try {
      const res = await api.get(`/employees/${emp._id}`);
      setSelectedEmp(res.data.employee);
      setShowDetailModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
            Workforce Directory
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.82rem' }}>
            Manage {employees.length} operational specialists, skills, preferred weekly offs, and pod mappings.
          </p>
        </div>
        <button
          className="btn btn-primary d-flex align-items-center gap-2"
          onClick={handleOpenCreate}
          style={{ backgroundColor: '#2563eb', fontSize: '0.85rem', fontWeight: 600 }}
        >
          <Plus size={16} /> Add Employee
        </button>
      </div>

      {successMsg && (
        <div className="alert alert-success d-flex align-items-center gap-2 py-2" role="alert" style={{ fontSize: '0.85rem' }}>
          <Check size={16} /> {successMsg}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-muted">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search by ID, name, email, or designation..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
            </div>
            <div className="col-md-4">
              <select
                className="form-select"
                value={selectedPod}
                onChange={(e) => setSelectedPod(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              >
                <option value="">All Operational Pods</option>
                {pods.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              >
                <option value="">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.82rem' }}>
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Specialist Name</th>
                <th>Role & Pod</th>
                <th>Designation</th>
                <th>Skills</th>
                <th>Preferred Off</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Loading employees...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-muted">
                    No employees matched the current filters.
                  </td>
                </tr>
              ) : (
                employees.map(emp => (
                  <tr key={emp._id}>
                    <td>
                      <span className="badge bg-light text-primary border font-monospace">
                        {emp.employee_id}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{emp.full_name}</div>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>{emp.email}</div>
                    </td>
                    <td>
                      <span className={`badge ${emp.role === 'POD_LEAD' ? 'bg-primary' : 'bg-light text-dark border'}`}>
                        {emp.role}
                      </span>
                      <div className="text-muted" style={{ fontSize: '0.72rem', marginTop: '2px' }}>
                        {emp.pod_name || 'Unassigned'}
                      </div>
                    </td>
                    <td>{emp.designation}</td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {(emp.skills || []).slice(0, 2).map((s, idx) => (
                          <span key={idx} className="badge bg-light text-secondary border" style={{ fontSize: '0.68rem' }}>
                            {s}
                          </span>
                        ))}
                        {(emp.skills || []).length > 2 && (
                          <span className="badge bg-light text-muted border" style={{ fontSize: '0.68rem' }}>
                            +{emp.skills.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border" style={{ fontSize: '0.72rem' }}>
                        {Array.isArray(emp.preferred_weekly_off) ? emp.preferred_weekly_off[0] : emp.preferred_weekly_off}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${emp.is_active ? 'bg-success' : 'bg-secondary'}`}>
                        {emp.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-outline-secondary"
                          onClick={() => handleViewProfile(emp)}
                          title="View Profile & Assignments"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          className="btn btn-outline-secondary"
                          onClick={() => handleOpenEdit(emp)}
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => handleDelete(emp)}
                          title="Delete"
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

      {/* Add / Edit Employee Modal */}
      {showFormModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" style={{ fontSize: '1rem', fontWeight: 700 }}>
                  {isEditing ? `Edit Specialist: ${formData.full_name}` : 'Register New Specialist'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowFormModal(false)}></button>
              </div>
              <form onSubmit={handleSaveEmployee}>
                <div className="modal-body" style={{ fontSize: '0.85rem' }}>
                  {errorMsg && (
                    <div className="alert alert-danger py-2 mb-3" style={{ fontSize: '0.8rem' }}>
                      <AlertCircle size={14} className="me-1" /> {errorMsg}
                    </div>
                  )}
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Employee ID *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        disabled={isEditing}
                        value={formData.employee_id}
                        onChange={e => setFormData({ ...formData, employee_id: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Full Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.full_name}
                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Work Email *</label>
                      <input
                        type="email"
                        className="form-control"
                        required
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold">Phone Number</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Designation *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.designation}
                        onChange={e => setFormData({ ...formData, designation: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Operational Pod</label>
                      <select
                        className="form-select"
                        value={formData.pod_id}
                        onChange={e => setFormData({ ...formData, pod_id: e.target.value })}
                      >
                        <option value="">Unassigned</option>
                        {pods.map(p => (
                          <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold">Role</label>
                      <select
                        className="form-select"
                        value={formData.role}
                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                      >
                        <option value="OPERATIONS_ASSOCIATE">Operations Associate</option>
                        <option value="POD_LEAD">Pod Lead</option>
                        <option value="OPERATIONS_MANAGER">Operations Manager</option>
                        <option value="ADMIN">Administrator</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Preferred Weekly Off</label>
                      <select
                        className="form-select"
                        value={formData.preferred_weekly_off}
                        onChange={e => setFormData({ ...formData, preferred_weekly_off: e.target.value })}
                      >
                        <option value="Sunday">Sunday</option>
                        <option value="Saturday">Saturday</option>
                        <option value="Monday">Monday</option>
                        <option value="Friday">Friday</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Date of Joining</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.date_of_joining}
                        onChange={e => setFormData({ ...formData, date_of_joining: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-bold">Skills (comma separated)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Customer Support, Abandoned Cart, NDR, Retention"
                        value={formData.skills}
                        onChange={e => setFormData({ ...formData, skills: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="is_active_check"
                          checked={formData.is_active}
                          onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                        />
                        <label className="form-check-label" htmlFor="is_active_check">
                          Active status (Available for roster assignments)
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowFormModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ backgroundColor: '#2563eb' }}>
                    Save Specialist
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Employee Profile Slide-out / Modal */}
      {showDetailModal && selectedEmp && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-light">
                <div>
                  <h5 className="modal-title mb-0" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                    {selectedEmp.full_name} ({selectedEmp.employee_id})
                  </h5>
                  <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                    {selectedEmp.designation} • {selectedEmp.pod_name}
                  </span>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowDetailModal(false)}></button>
              </div>
              <div className="modal-body" style={{ fontSize: '0.85rem' }}>
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded">
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>Contact Details</div>
                      <div className="fw-bold">{selectedEmp.email}</div>
                      <div>{selectedEmp.phone || 'No phone recorded'}</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded">
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>Operational Preferences</div>
                      <div><strong>Preferred Weekly Off:</strong> {Array.isArray(selectedEmp.preferred_weekly_off) ? selectedEmp.preferred_weekly_off.join(', ') : selectedEmp.preferred_weekly_off}</div>
                      <div><strong>Skills:</strong> {(selectedEmp.skills || []).join(', ')}</div>
                    </div>
                  </div>
                </div>

                <h6 className="fw-bold border-bottom pb-2 mb-3">
                  <Building2 size={16} className="me-1 text-primary" /> Active Brand & Process Assignments
                </h6>
                {(selectedEmp.assignments || []).length === 0 ? (
                  <p className="text-muted">No active assignments configured for this employee.</p>
                ) : (
                  <div className="table-responsive mb-4">
                    <table className="table table-sm table-bordered">
                      <thead className="table-light">
                        <tr>
                          <th>Brand</th>
                          <th>Process</th>
                          <th>Effective From</th>
                          <th>Allocation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEmp.assignments.map((a, i) => (
                          <tr key={i}>
                            <td className="fw-semibold">{a.brand_name}</td>
                            <td>{a.process_name}</td>
                            <td>{a.effective_start_date}</td>
                            <td>{a.allocation_percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <h6 className="fw-bold border-bottom pb-2 mb-3">
                  <GitBranch size={16} className="me-1 text-warning" /> Leaves & Availability Records
                </h6>
                {(selectedEmp.availability || []).length === 0 ? (
                  <p className="text-muted">No leave records registered.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered">
                      <thead className="table-light">
                        <tr>
                          <th>Start Date</th>
                          <th>End Date</th>
                          <th>Type</th>
                          <th>Status</th>
                          <th>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEmp.availability.map((l, i) => (
                          <tr key={i}>
                            <td>{l.start_date}</td>
                            <td>{l.end_date}</td>
                            <td><span className="badge bg-light text-dark border">{l.type}</span></td>
                            <td>
                              <span className={`badge ${l.status === 'APPROVED' ? 'bg-success' : l.status === 'PENDING' ? 'bg-warning text-dark' : 'bg-danger'}`}>
                                {l.status}
                              </span>
                            </td>
                            <td>{l.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowDetailModal(false)}>
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

export default Employees;
