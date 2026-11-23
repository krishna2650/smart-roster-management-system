import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Layers, Plus, Edit2, Trash2, Users, Building2, Check, AlertCircle } from 'lucide-react';

const Pods = () => {
  const [pods, setPods] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPodDetails, setSelectedPodDetails] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const initialForm = {
    pod_id: '',
    name: '',
    pod_lead_id: '',
    is_active: true
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [podRes, empRes, brandRes] = await Promise.all([
        api.get('/pods'),
        api.get('/employees'),
        api.get('/brands')
      ]);
      setPods(podRes.data.pods || []);
      setEmployees(empRes.data.employees || []);
      setBrands(brandRes.data.brands || []);
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
      pod_id: `POD-${String(pods.length + 1).padStart(3, '0')}`,
      pod_lead_id: employees[0]?._id || ''
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleOpenEdit = (p) => {
    setIsEditing(true);
    setFormData({
      _id: p._id,
      pod_id: p.pod_id,
      name: p.name,
      pod_lead_id: p.pod_lead_id || '',
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
        await api.put(`/pods/${formData._id}`, formData);
        setSuccessMsg(`Pod updated.`);
      } else {
        await api.post('/pods', formData);
        setSuccessMsg(`Pod created.`);
      }
      setShowModal(false);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message);
    }
  };

  const handleViewPodDetails = async (p) => {
    try {
      const res = await api.get(`/pods/${p._id}`);
      setSelectedPodDetails(res.data.pod);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
            Operational Pods & Teams
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.82rem' }}>
            Cross-functional operational units overseen by dedicated Pod Leads to ensure SLA adherence.
          </p>
        </div>
        <button
          className="btn btn-primary d-flex align-items-center gap-2"
          onClick={handleOpenCreate}
          style={{ backgroundColor: '#2563eb', fontSize: '0.85rem', fontWeight: 600 }}
        >
          <Plus size={16} /> Create Pod
        </button>
      </div>

      {successMsg && (
        <div className="alert alert-success d-flex align-items-center gap-2 py-2" role="alert" style={{ fontSize: '0.85rem' }}>
          <Check size={16} /> {successMsg}
        </div>
      )}

      {/* Pod Grid */}
      <div className="row g-3 mb-4">
        {pods.map(p => (
          <div key={p._id} className="col-lg-6">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '10px' }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="badge bg-light text-primary border font-monospace">
                    {p.pod_id}
                  </span>
                  <div className="btn-group btn-group-sm">
                    <button className="btn btn-light btn-sm text-secondary" onClick={() => handleOpenEdit(p)}>
                      <Edit2 size={13} />
                    </button>
                  </div>
                </div>

                <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                  {p.name}
                </h4>

                <div className="p-3 bg-light rounded mb-3" style={{ fontSize: '0.82rem' }}>
                  <div className="d-flex justify-content-between mb-2 pb-1 border-bottom">
                    <span className="text-muted">Pod Lead:</span>
                    <strong className="text-primary">{p.pod_lead_name || 'Unassigned Lead'}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Assigned Team Members:</span>
                    <span className="fw-bold">{p.assigned_employees_count} specialists</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Assigned Brands:</span>
                    <span className="fw-bold">{p.assigned_brands_count} client brand(s)</span>
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center">
                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => handleViewPodDetails(p)}
                    style={{ fontSize: '0.78rem' }}
                  >
                    View Pod Team & Roster
                  </button>
                  <span className={`badge ${p.is_active ? 'bg-success' : 'bg-secondary'}`}>
                    {p.is_active ? 'Operational' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pod Details Modal */}
      {selectedPodDetails && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <h5 className="modal-title mb-0" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                    {selectedPodDetails.name}
                  </h5>
                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                    Pod Lead: {selectedPodDetails.pod_lead?.full_name || 'N/A'}
                  </span>
                </div>
                <button type="button" className="btn-close" onClick={() => setSelectedPodDetails(null)}></button>
              </div>
              <div className="modal-body" style={{ fontSize: '0.85rem' }}>
                <h6 className="fw-bold mb-2">
                  <Users size={16} className="me-1 text-primary" /> Team Members ({(selectedPodDetails.members || []).length})
                </h6>
                <div className="table-responsive mb-3">
                  <table className="table table-sm table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Designation</th>
                        <th>Skills</th>
                        <th>Preferred Off</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedPodDetails.members || []).map(m => (
                        <tr key={m._id}>
                          <td className="font-monospace">{m.employee_id}</td>
                          <td className="fw-semibold">{m.full_name}</td>
                          <td>{m.designation}</td>
                          <td>{(m.skills || []).join(', ')}</td>
                          <td>{Array.isArray(m.preferred_weekly_off) ? m.preferred_weekly_off[0] : m.preferred_weekly_off}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h6 className="fw-bold mb-2">
                  <Building2 size={16} className="me-1 text-secondary" /> Assigned Client Brands ({(selectedPodDetails.brands || []).length})
                </h6>
                <div className="list-group">
                  {(selectedPodDetails.brands || []).map(b => (
                    <div key={b._id} className="list-group-item d-flex justify-content-between align-items-center py-2">
                      <div>
                        <strong>{b.name}</strong>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>{b.operating_calendar}</div>
                      </div>
                      <span className="badge bg-primary text-white">Min {b.minimum_coverage_requirements} staff</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedPodDetails(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" style={{ fontSize: '1rem', fontWeight: 700 }}>
                  {isEditing ? 'Edit Pod' : 'Create Operational Pod'}
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
                    <label className="form-label fw-bold">Pod ID *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      disabled={isEditing}
                      value={formData.pod_id}
                      onChange={e => setFormData({ ...formData, pod_id: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Pod Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Epsilon Pod - Quick Commerce"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Designated Pod Lead</label>
                    <select
                      className="form-select"
                      value={formData.pod_lead_id}
                      onChange={e => setFormData({ ...formData, pod_lead_id: e.target.value })}
                    >
                      <option value="">Select Pod Lead</option>
                      {employees.map(e => (
                        <option key={e._id} value={e._id}>{e.full_name} ({e.designation})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ backgroundColor: '#2563eb' }}>
                    Save Pod
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

export default Pods;
