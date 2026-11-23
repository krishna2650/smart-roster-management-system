import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { GitBranch, Plus, Edit2, Trash2, Check, AlertCircle, Building2 } from 'lucide-react';

const Processes = () => {
  const [processes, setProcesses] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const initialForm = {
    process_id: '',
    name: '',
    description: '',
    brand_id: '',
    operating_calendar: 'INHERIT_BRAND',
    min_employees: 1,
    max_staffing: 2,
    is_active: true
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [procRes, brandRes] = await Promise.all([
        api.get(`/processes?brand_id=${selectedBrandFilter}`),
        api.get('/brands')
      ]);
      setProcesses(procRes.data.processes || []);
      setBrands(brandRes.data.brands || []);
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
    setFormData({
      ...initialForm,
      process_id: `PRC-${String(processes.length + 1).padStart(3, '0')}`,
      brand_id: brands[0]?._id || ''
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleOpenEdit = (p) => {
    setIsEditing(true);
    setFormData({
      _id: p._id,
      process_id: p.process_id,
      name: p.name,
      description: p.description || '',
      brand_id: p.brand_id || '',
      operating_calendar: p.operating_calendar || 'INHERIT_BRAND',
      min_employees: p.min_employees || 1,
      max_staffing: p.max_staffing || 2,
      is_active: p.is_active !== undefined ? p.is_active : true
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (isEditing) {
        await api.put(`/processes/${formData._id}`, formData);
        setSuccessMsg(`Process updated.`);
      } else {
        await api.post('/processes', formData);
        setSuccessMsg(`Process registered.`);
      }
      setShowModal(false);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message);
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete process ${p.name}?`)) return;
    try {
      await api.delete(`/processes/${p._id}`);
      setSuccessMsg("Process removed.");
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
            Operational Processes
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.82rem' }}>
            Manage Customer Support (CS), Abandoned Cart (ACC), NDR, and Retention processes across brand accounts.
          </p>
        </div>
        <button
          className="btn btn-primary d-flex align-items-center gap-2"
          onClick={handleOpenCreate}
          style={{ backgroundColor: '#2563eb', fontSize: '0.85rem', fontWeight: 600 }}
        >
          <Plus size={16} /> Add Process
        </button>
      </div>

      {successMsg && (
        <div className="alert alert-success d-flex align-items-center gap-2 py-2" role="alert" style={{ fontSize: '0.85rem' }}>
          <Check size={16} /> {successMsg}
        </div>
      )}

      {/* Brand Filter */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row align-items-center">
            <div className="col-md-5">
              <label className="form-label text-muted mb-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Filter by Brand</label>
              <select
                className="form-select form-select-sm"
                value={selectedBrandFilter}
                onChange={e => setSelectedBrandFilter(e.target.value)}
              >
                <option value="">All Brands ({brands.length} Total)</option>
                {brands.map(b => (
                  <option key={b._id} value={b._id}>{b.name} ({b.operating_calendar})</option>
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
                <th>Process ID</th>
                <th>Process Name</th>
                <th>Assigned Brand</th>
                <th>Operating Calendar Rule</th>
                <th>Min Required Staff</th>
                <th>Max Staffing</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-muted">
                    Loading operational processes...
                  </td>
                </tr>
              ) : processes.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-muted">
                    No processes found.
                  </td>
                </tr>
              ) : (
                processes.map(p => (
                  <tr key={p._id}>
                    <td>
                      <span className="badge bg-light text-primary border font-monospace">
                        {p.process_id}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{p.name}</strong>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>{p.description}</div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-1">
                        <Building2 size={13} className="text-secondary" />
                        <span className="fw-semibold">{p.brand_name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {p.operating_calendar === 'INHERIT_BRAND' ? 'Inherit Brand Calendar' : p.operating_calendar}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-primary text-white">
                        {p.min_employees} staff
                      </span>
                    </td>
                    <td>{p.max_staffing || 'Uncapped'}</td>
                    <td>
                      <span className={`badge ${p.is_active ? 'bg-success' : 'bg-secondary'}`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button className="btn btn-outline-secondary" onClick={() => handleOpenEdit(p)}>
                          <Edit2 size={13} />
                        </button>
                        <button className="btn btn-outline-danger" onClick={() => handleDelete(p)}>
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
                  {isEditing ? `Edit Process: ${formData.name}` : 'Create Operational Process'}
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
                    <label className="form-label fw-bold">Process ID *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      disabled={isEditing}
                      value={formData.process_id}
                      onChange={e => setFormData({ ...formData, process_id: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Process Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Customer Support (CS), Abandoned Cart (ACC)"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Assigned Brand *</label>
                    <select
                      className="form-select"
                      required
                      value={formData.brand_id}
                      onChange={e => setFormData({ ...formData, brand_id: e.target.value })}
                    >
                      <option value="">Select Brand</option>
                      {brands.map(b => (
                        <option key={b._id} value={b._id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Operating Calendar Rule</label>
                    <select
                      className="form-select"
                      value={formData.operating_calendar}
                      onChange={e => setFormData({ ...formData, operating_calendar: e.target.value })}
                    >
                      <option value="INHERIT_BRAND">Inherit Brand Operating Calendar</option>
                      <option value="365_DAYS">365-Day Operations (Always Active)</option>
                      <option value="DAILY_EXCLUDING_HOLIDAYS">Daily Operations (Mon-Sun ex Holidays)</option>
                      <option value="MON_SAT_EXCLUDING_HOLIDAYS">Mon-Sat Operations (Sundays & Holidays Off)</option>
                    </select>
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-bold">Min Employees *</label>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        required
                        value={formData.min_employees}
                        onChange={e => setFormData({ ...formData, min_employees: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-bold">Max Staffing</label>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        value={formData.max_staffing}
                        onChange={e => setFormData({ ...formData, max_staffing: parseInt(e.target.value) || 2 })}
                      />
                    </div>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="proc_active"
                      checked={formData.is_active}
                      onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="proc_active">
                      Active process
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ backgroundColor: '#2563eb' }}>
                    Save Process
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

export default Processes;
