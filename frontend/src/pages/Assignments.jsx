import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { UserCheck, Plus, Edit2, Trash2, Check, AlertCircle, Building2, GitBranch, Users } from 'lucide-react';

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [brands, setBrands] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const initialForm = {
    employee_id: '',
    brand_id: '',
    process_id: '',
    effective_start_date: new Date().toISOString().split('T')[0],
    effective_end_date: '',
    status: 'Active',
    allocation_percentage: 100,
    is_primary: true
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assignRes, empRes, brandRes, procRes] = await Promise.all([
        api.get(`/assignments?brand_id=${selectedBrandFilter}`),
        api.get('/employees?status=active'),
        api.get('/brands'),
        api.get('/processes')
      ]);
      setAssignments(assignRes.data.assignments || []);
      setEmployees(empRes.data.employees || []);
      setBrands(brandRes.data.brands || []);
      setProcesses(procRes.data.processes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBrandFilter]);

  const handleOpenCreate = () => {
    setIsEditing(false);
    const firstBrand = brands[0]?._id || '';
    const filteredProcs = processes.filter(p => String(p.brand_id) === String(firstBrand));
    setFormData({
      ...initialForm,
      employee_id: employees[0]?._id || '',
      brand_id: firstBrand,
      process_id: filteredProcs[0]?._id || ''
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleBrandChangeInForm = (b_id) => {
    const brandProcs = processes.filter(p => String(p.brand_id) === String(b_id));
    setFormData({
      ...formData,
      brand_id: b_id,
      process_id: brandProcs[0]?._id || ''
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (isEditing) {
        await api.put(`/assignments/${formData._id}`, formData);
        setSuccessMsg(`Assignment updated.`);
      } else {
        await api.post('/assignments', formData);
        setSuccessMsg(`Assignment established successfully.`);
      }
      setShowModal(false);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message);
    }
  };

  const handleDelete = async (a) => {
    if (!window.confirm(`Remove assignment for ${a.employee_name} on ${a.brand_name} (${a.process_name})?`)) return;
    try {
      await api.delete(`/assignments/${a._id}`);
      setSuccessMsg("Assignment removed.");
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const availableProcessesForSelectedBrand = processes.filter(
    p => String(p.brand_id) === String(formData.brand_id)
  );

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
            Resource Allocation & Process Assignments
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.82rem' }}>
            Map operational specialists to Brand Processes. Supports single dedicated managers, specialized role splits, and multi-brand coverage.
          </p>
        </div>
        <button
          className="btn btn-primary d-flex align-items-center gap-2"
          onClick={handleOpenCreate}
          style={{ backgroundColor: '#2563eb', fontSize: '0.85rem', fontWeight: 600 }}
        >
          <Plus size={16} /> New Assignment
        </button>
      </div>

      {successMsg && (
        <div className="alert alert-success d-flex align-items-center gap-2 py-2" role="alert" style={{ fontSize: '0.85rem' }}>
          <Check size={16} /> {successMsg}
        </div>
      )}

      {/* Case Guide Banner */}
      <div className="alert alert-light border shadow-sm mb-4" style={{ fontSize: '0.8rem' }}>
        <strong>Supported Staffing Models:</strong>
        <span className="ms-2 badge bg-primary text-white">Case 1: 1 Employee manages all processes for Brand</span>
        <span className="ms-2 badge bg-info text-white">Case 2: Specialized Process Split (Priya: CS, Amit: ACC, Sneha: NDR)</span>
        <span className="ms-2 badge bg-secondary text-white">Case 3: Shared Process (Tarun & Ritu share CS)</span>
        <span className="ms-2 badge bg-dark text-white">Case 4: Multi-brand Allocation</span>
      </div>

      {/* Brand Filter */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row align-items-center">
            <div className="col-md-5">
              <label className="form-label text-muted mb-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Filter by Client Brand</label>
              <select
                className="form-select form-select-sm"
                value={selectedBrandFilter}
                onChange={e => setSelectedBrandFilter(e.target.value)}
              >
                <option value="">All Brands ({brands.length} Total)</option>
                {brands.map(b => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
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
                <th>Brand Account</th>
                <th>Assigned Process</th>
                <th>Effective Window</th>
                <th>Allocation %</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">
                    Loading assignments...
                  </td>
                </tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">
                    No active assignments for this selection.
                  </td>
                </tr>
              ) : (
                assignments.map(a => (
                  <tr key={a._id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <Users size={14} className="text-primary" />
                        <div>
                          <strong style={{ color: '#0f172a' }}>{a.employee_name}</strong>
                          <div className="text-muted font-monospace" style={{ fontSize: '0.7rem' }}>{a.employee_code}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-1">
                        <Building2 size={13} className="text-secondary" />
                        <span className="fw-semibold">{a.brand_name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {a.process_name}
                      </span>
                    </td>
                    <td>
                      <div>From: {a.effective_start_date}</div>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                        To: {a.effective_end_date || 'Indefinite / Ongoing'}
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-primary text-white">
                        {a.allocation_percentage}%
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${a.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDelete(a)}
                        title="Remove Assignment"
                      >
                        <Trash2 size={13} />
                      </button>
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
                  Create Resource Assignment
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
                        <option key={e._id} value={e._id}>
                          {e.full_name} ({e.employee_id} • {e.designation})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Select Brand *</label>
                    <select
                      className="form-select"
                      required
                      value={formData.brand_id}
                      onChange={e => handleBrandChangeInForm(e.target.value)}
                    >
                      <option value="">Select Brand</option>
                      {brands.map(b => (
                        <option key={b._id} value={b._id}>{b.name} ({b.operating_calendar})</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Select Process *</label>
                    <select
                      className="form-select"
                      required
                      value={formData.process_id}
                      onChange={e => setFormData({ ...formData, process_id: e.target.value })}
                    >
                      <option value="">Select Process belonging to Brand</option>
                      {availableProcessesForSelectedBrand.map(p => (
                        <option key={p._id} value={p._id}>{p.name} (Min {p.min_employees} staff)</option>
                      ))}
                    </select>
                    {availableProcessesForSelectedBrand.length === 0 && formData.brand_id && (
                      <div className="form-text text-danger">No processes configured for this brand yet.</div>
                    )}
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-bold">Effective Start Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        required
                        value={formData.effective_start_date}
                        onChange={e => setFormData({ ...formData, effective_start_date: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-bold">Effective End Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.effective_end_date}
                        onChange={e => setFormData({ ...formData, effective_end_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Workload Allocation %</label>
                    <input
                      type="number"
                      className="form-control"
                      min="10"
                      max="100"
                      step="10"
                      value={formData.allocation_percentage}
                      onChange={e => setFormData({ ...formData, allocation_percentage: parseInt(e.target.value) || 100 })}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ backgroundColor: '#2563eb' }}>
                    Confirm Assignment
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

export default Assignments;
