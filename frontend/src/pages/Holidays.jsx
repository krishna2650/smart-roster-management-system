import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { CalendarOff, Plus, Edit2, Trash2, Check, AlertCircle, Info } from 'lucide-react';

const Holidays = () => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const initialForm = {
    name: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    location: 'National',
    is_active: true
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const res = await api.get('/holidays');
      setHolidays(res.data.holidays || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormData(initialForm);
    setErrorMsg('');
    setShowModal(true);
  };

  const handleOpenEdit = (h) => {
    setIsEditing(true);
    setFormData({
      _id: h._id,
      name: h.name,
      date: h.date,
      description: h.description || '',
      location: h.location || 'National',
      is_active: h.is_active !== undefined ? h.is_active : true
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (isEditing) {
        await api.put(`/holidays/${formData._id}`, formData);
        setSuccessMsg(`Holiday updated.`);
      } else {
        await api.post('/holidays', formData);
        setSuccessMsg(`Holiday created.`);
      }
      setShowModal(false);
      fetchHolidays();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message);
    }
  };

  const handleDelete = async (h) => {
    if (!window.confirm(`Delete holiday ${h.name}?`)) return;
    try {
      await api.delete(`/holidays/${h._id}`);
      setSuccessMsg("Holiday deleted.");
      fetchHolidays();
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
            Public Holiday Calendar & Scheduling Policies
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.82rem' }}>
            Configure national and regional holidays. Brand operating policies determine whether a team works on a holiday.
          </p>
        </div>
        <button
          className="btn btn-primary d-flex align-items-center gap-2"
          onClick={handleOpenCreate}
          style={{ backgroundColor: '#2563eb', fontSize: '0.85rem', fontWeight: 600 }}
        >
          <Plus size={16} /> Add Holiday
        </button>
      </div>

      {successMsg && (
        <div className="alert alert-success d-flex align-items-center gap-2 py-2" role="alert" style={{ fontSize: '0.85rem' }}>
          <Check size={16} /> {successMsg}
        </div>
      )}

      {/* Policy Explanation Banner */}
      <div className="alert alert-light border shadow-sm p-3 mb-4 d-flex gap-3 align-items-start" style={{ fontSize: '0.82rem' }}>
        <Info size={18} className="text-primary flex-shrink-0 mt-1" />
        <div>
          <strong>Brand Operating Calendar vs Public Holiday Interaction:</strong>
          <ul className="mb-0 mt-1 ps-3">
            <li><strong>365-Day Operations (e.g. EcoGlow, NutriFuel):</strong> Operating policy is <code>WORK_ON_HOLIDAYS</code>. Mandatory shift coverage is required even on Republic Day or Diwali.</li>
            <li><strong>Daily Operations Excluding Holidays (e.g. PureSkin, KetoBites):</strong> Operations run 7 days a week, but the entire brand is off on official public holidays.</li>
            <li><strong>Mon–Sat Excluding Holidays (e.g. Velvet Thread, UrbanStyle):</strong> Closed on both Sundays and official public holidays.</li>
          </ul>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.82rem' }}>
            <thead className="table-light">
              <tr>
                <th>Holiday Name</th>
                <th>Calendar Date</th>
                <th>Description</th>
                <th>Scope / Location</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">
                    Loading holidays...
                  </td>
                </tr>
              ) : holidays.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">
                    No holidays configured.
                  </td>
                </tr>
              ) : (
                holidays.map(h => (
                  <tr key={h._id}>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{h.name}</strong>
                    </td>
                    <td>
                      <span className="badge bg-light text-primary border font-monospace" style={{ fontSize: '0.78rem' }}>
                        {h.date}
                      </span>
                    </td>
                    <td>{h.description || 'Public Holiday'}</td>
                    <td>
                      <span className="badge bg-light text-secondary border">
                        {h.location || 'National'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${h.is_active ? 'bg-success' : 'bg-secondary'}`}>
                        {h.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button className="btn btn-outline-secondary" onClick={() => handleOpenEdit(h)}>
                          <Edit2 size={13} />
                        </button>
                        <button className="btn btn-outline-danger" onClick={() => handleDelete(h)}>
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
                  {isEditing ? 'Edit Public Holiday' : 'Create Public Holiday'}
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
                    <label className="form-label fw-bold">Holiday Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Republic Day, Diwali, Christmas"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      required
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Scope / Location</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="National, Regional, etc."
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Description</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ backgroundColor: '#2563eb' }}>
                    Save Holiday
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

export default Holidays;
