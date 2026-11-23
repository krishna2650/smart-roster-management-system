import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Building2, Plus, Edit2, Trash2, Calendar, ShieldCheck, Check, AlertCircle } from 'lucide-react';
import { CalendarBadge } from '../components/Common/Badge';

const Brands = () => {
  const [brands, setBrands] = useState([]);
  const [pods, setPods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const initialForm = {
    brand_id: '',
    name: '',
    description: '',
    client_status: 'Active',
    pod_id: '',
    operating_calendar: '365_DAYS',
    public_holiday_policy: 'WORK_ON_HOLIDAYS',
    minimum_coverage_requirements: 1,
    is_active: true
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [brandRes, podRes] = await Promise.all([
        api.get('/brands'),
        api.get('/pods')
      ]);
      setBrands(brandRes.data.brands || []);
      setPods(podRes.data.pods || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormData({
      ...initialForm,
      brand_id: `BRD-${String(brands.length + 1).padStart(3, '0')}`,
      pod_id: pods[0]?._id || ''
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleOpenEdit = (b) => {
    setIsEditing(true);
    setFormData({
      _id: b._id,
      brand_id: b.brand_id,
      name: b.name,
      description: b.description || '',
      client_status: b.client_status || 'Active',
      pod_id: b.pod_id || '',
      operating_calendar: b.operating_calendar || '365_DAYS',
      public_holiday_policy: b.public_holiday_policy || 'WORK_ON_HOLIDAYS',
      minimum_coverage_requirements: b.minimum_coverage_requirements || 1,
      is_active: b.is_active !== undefined ? b.is_active : true
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (isEditing) {
        await api.put(`/brands/${formData._id}`, formData);
        setSuccessMsg(`Brand ${formData.name} updated successfully!`);
      } else {
        await api.post('/brands', formData);
        setSuccessMsg(`Brand ${formData.name} created successfully!`);
      }
      setShowModal(false);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message);
    }
  };

  const handleDelete = async (b) => {
    if (!window.confirm(`Are you sure you want to delete brand ${b.name}?`)) return;
    try {
      await api.delete(`/brands/${b._id}`);
      setSuccessMsg(`Brand deleted.`);
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
            Brand & Client Accounts
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.82rem' }}>
            Configure client operating calendars (365 days, daily, or Sundays off), public holiday rules, and ownership pods.
          </p>
        </div>
        <button
          className="btn btn-primary d-flex align-items-center gap-2"
          onClick={handleOpenCreate}
          style={{ backgroundColor: '#2563eb', fontSize: '0.85rem', fontWeight: 600 }}
        >
          <Plus size={16} /> Add Brand
        </button>
      </div>

      {successMsg && (
        <div className="alert alert-success d-flex align-items-center gap-2 py-2" role="alert" style={{ fontSize: '0.85rem' }}>
          <Check size={16} /> {successMsg}
        </div>
      )}

      {/* Brand Cards Grid */}
      <div className="row g-3">
        {brands.map(b => (
          <div key={b._id} className="col-lg-4 col-md-6">
            <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '10px' }}>
              <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="badge bg-light text-primary border font-monospace">
                    {b.brand_id}
                  </span>
                  <div className="btn-group btn-group-sm">
                    <button className="btn btn-light btn-sm text-secondary" onClick={() => handleOpenEdit(b)}>
                      <Edit2 size={13} />
                    </button>
                    <button className="btn btn-light btn-sm text-danger" onClick={() => handleDelete(b)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <h5 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                  {b.name}
                </h5>
                <p className="text-muted mb-3" style={{ fontSize: '0.78rem', minHeight: '36px' }}>
                  {b.description || 'D2C brand with active operational coverage requirements.'}
                </p>

                <div className="p-2 bg-light rounded mb-3" style={{ fontSize: '0.78rem' }}>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Operating Mode:</span>
                    <CalendarBadge calendarType={b.operating_calendar} />
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Assigned Pod:</span>
                    <span className="fw-semibold">{b.pod_name}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Holiday Policy:</span>
                    <span className="fw-semibold text-secondary">{b.public_holiday_policy}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Min Staffing:</span>
                    <span className="fw-bold text-primary">{b.minimum_coverage_requirements} staff</span>
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                  <span className="badge bg-info text-white" style={{ fontSize: '0.72rem' }}>
                    {b.processes_count || 3} Active Processes
                  </span>
                  <span className={`badge ${b.client_status === 'Active' ? 'bg-success' : 'bg-warning text-dark'}`} style={{ fontSize: '0.72rem' }}>
                    {b.client_status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Brand Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" style={{ fontSize: '1rem', fontWeight: 700 }}>
                  {isEditing ? `Edit Brand: ${formData.name}` : 'Register New Brand Client'}
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
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Brand ID *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        disabled={isEditing}
                        value={formData.brand_id}
                        onChange={e => setFormData({ ...formData, brand_id: e.target.value })}
                      />
                    </div>
                    <div className="col-md-8">
                      <label className="form-label fw-bold">Brand Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-bold">Description</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Operating Calendar Mode *</label>
                      <select
                        className="form-select"
                        value={formData.operating_calendar}
                        onChange={e => setFormData({ ...formData, operating_calendar: e.target.value })}
                      >
                        <option value="365_DAYS">365-Day Operations (Sundays & Public Holidays required)</option>
                        <option value="DAILY_EXCLUDING_HOLIDAYS">Daily Operations (Mon-Sun except public holidays)</option>
                        <option value="MON_SAT_EXCLUDING_HOLIDAYS">Mon–Sat Operations (Sundays & Public Holidays OFF)</option>
                      </select>
                      <div className="form-text">
                        Enforced deterministically by the monthly scheduling algorithm.
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Public Holiday Policy</label>
                      <select
                        className="form-select"
                        value={formData.public_holiday_policy}
                        onChange={e => setFormData({ ...formData, public_holiday_policy: e.target.value })}
                      >
                        <option value="WORK_ON_HOLIDAYS">WORK_ON_HOLIDAYS (Mandatory Holiday Staffing)</option>
                        <option value="OFF_ON_HOLIDAYS">OFF_ON_HOLIDAYS (Team Off on Public Holidays)</option>
                      </select>
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
                      <label className="form-label fw-bold">Client Status</label>
                      <select
                        className="form-select"
                        value={formData.client_status}
                        onChange={e => setFormData({ ...formData, client_status: e.target.value })}
                      >
                        <option value="Active">Active</option>
                        <option value="Onboarding">Onboarding</option>
                        <option value="Paused">Paused</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold">Min Coverage Requirements</label>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        max="10"
                        value={formData.minimum_coverage_requirements}
                        onChange={e => setFormData({ ...formData, minimum_coverage_requirements: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ backgroundColor: '#2563eb' }}>
                    Save Brand
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

export default Brands;
