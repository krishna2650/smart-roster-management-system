import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, User, Key, Check } from 'lucide-react';

const Settings = () => {
  const { user, loginAsDemo } = useAuth();
  const [successMsg, setSuccessMsg] = useState('');

  const handleSwitch = async (role) => {
    await loginAsDemo(role);
    setSuccessMsg(`Switched session to ${role} role.`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div>
      <div className="mb-4">
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
          System Settings & Access Controls (RBAC)
        </h2>
        <p className="text-muted mb-0" style={{ fontSize: '0.82rem' }}>
          Role-Based Access Control and authentication profiles for hiring evaluation and demonstration.
        </p>
      </div>

      {successMsg && (
        <div className="alert alert-success d-flex align-items-center gap-2 py-2" role="alert" style={{ fontSize: '0.85rem' }}>
          <Check size={16} /> {successMsg}
        </div>
      )}

      {/* Current User Card */}
      <div className="card border-0 shadow-sm p-4 bg-white mb-4">
        <h5 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
          <User size={18} className="me-2 text-primary" /> Active Session Profile
        </h5>
        <div className="p-3 bg-light rounded mt-3" style={{ fontSize: '0.85rem' }}>
          <div className="row g-3">
            <div className="col-md-4">
              <span className="text-muted">Logged-in User:</span>
              <div className="fw-bold">{user?.full_name || 'Operations Manager'}</div>
            </div>
            <div className="col-md-4">
              <span className="text-muted">Email Identity:</span>
              <div className="fw-bold">{user?.email || 'manager@datastraw.com'}</div>
            </div>
            <div className="col-md-4">
              <span className="text-muted">Assigned Security Role:</span>
              <div>
                <span className="badge bg-primary text-white" style={{ fontSize: '0.78rem' }}>
                  {user?.role || 'OPERATIONS_MANAGER'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Switcher Card */}
      <div className="card border-0 shadow-sm p-4 bg-white">
        <h5 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
          <Key size={18} className="me-2 text-warning" /> Switch Demo Evaluator Account
        </h5>
        <p className="text-muted" style={{ fontSize: '0.82rem' }}>
          Test the application from the perspective of each required stakeholder role:
        </p>

        <div className="row g-3 mt-1">
          <div className="col-md-4">
            <div className="p-3 border rounded bg-white h-100 d-flex flex-column justify-content-between">
              <div>
                <h6 className="fw-bold mb-1">👑 Admin</h6>
                <p className="text-muted" style={{ fontSize: '0.75rem' }}>
                  Full application access, pod management, cross-pod reassignments, system settings.
                </p>
                <div className="font-monospace text-muted" style={{ fontSize: '0.72rem' }}>
                  admin@datastraw.com / admin123
                </div>
              </div>
              <button
                className="btn btn-outline-primary btn-sm mt-3"
                onClick={() => handleSwitch('ADMIN')}
              >
                Act as Admin
              </button>
            </div>
          </div>

          <div className="col-md-4">
            <div className="p-3 border rounded bg-white h-100 d-flex flex-column justify-content-between">
              <div>
                <h6 className="fw-bold mb-1">📋 Operations Manager</h6>
                <p className="text-muted" style={{ fontSize: '0.75rem' }}>
                  Monthly roster generation, leave approvals, conflict resolutions, publishing rosters.
                </p>
                <div className="font-monospace text-muted" style={{ fontSize: '0.72rem' }}>
                  manager@datastraw.com / manager123
                </div>
              </div>
              <button
                className="btn btn-primary btn-sm mt-3"
                onClick={() => handleSwitch('OPERATIONS_MANAGER')}
                style={{ backgroundColor: '#2563eb' }}
              >
                Act as Operations Manager
              </button>
            </div>
          </div>

          <div className="col-md-4">
            <div className="p-3 border rounded bg-white h-100 d-flex flex-column justify-content-between">
              <div>
                <h6 className="fw-bold mb-1">🛡️ Alpha Pod Lead</h6>
                <p className="text-muted" style={{ fontSize: '0.75rem' }}>
                  Oversees Alpha Pod (Priya Sharma), team availability, brand coverage adherence.
                </p>
                <div className="font-monospace text-muted" style={{ fontSize: '0.72rem' }}>
                  podlead@datastraw.com / lead123
                </div>
              </div>
              <button
                className="btn btn-outline-secondary btn-sm mt-3"
                onClick={() => handleSwitch('POD_LEAD')}
              >
                Act as Pod Lead
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
