import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bell, AlertTriangle, User, LogOut, CheckCircle } from 'lucide-react';
import api from '../../services/api';

const Navbar = () => {
  const location = useLocation();
  const { user, logout, loginAsDemo } = useAuth();
  const [criticalConflicts, setCriticalConflicts] = useState(0);

  // Compute page title
  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/': return 'Executive Operations Dashboard';
      case '/roster': return 'Monthly Roster Management & Scheduling Matrix';
      case '/conflicts': return 'Operational Conflict Detection Center';
      case '/change-workflow': return 'Change Management & Backup Reassignment';
      case '/employees': return 'Employee Directory & Allocation Profile';
      case '/brands': return 'Brand Operating Calendars & Client Coverage';
      case '/processes': return 'Process Management & Staffing Rules';
      case '/pods': return 'Operational Pods & Cross-functional Teams';
      case '/assignments': return 'Employee-Brand-Process Resource Matrix';
      case '/availability': return 'Availability, Weekly Offs & Leave Requests';
      case '/holidays': return 'Public Holidays & Operating Calendar Impact';
      case '/reports': return 'Roster Analytics & CSV Data Exports';
      case '/settings': return 'System Settings & Access Controls';
      default: return 'Smart Roster Management System';
    }
  };

  useEffect(() => {
    const fetchConflictCount = async () => {
      try {
        const res = await api.get('/conflicts');
        setCriticalConflicts(res.data.critical_count || 0);
      } catch (e) {
        // quiet
      }
    };
    fetchConflictCount();
    const interval = setInterval(fetchConflictCount, 15000);
    return () => clearInterval(interval);
  }, []);

  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date());

  return (
    <header className="top-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
          {getPageTitle(location.pathname)}
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Date badge */}
        <div style={{
          fontSize: '0.8rem',
          fontWeight: 600,
          color: '#475569',
          background: '#f1f5f9',
          padding: '0.4rem 0.75rem',
          borderRadius: '6px',
          border: '1px solid #e2e8f0'
        }}>
          📅 {todayFormatted}
        </div>

        {/* Conflict Alert Pill */}
        <Link
          to="/conflicts"
          className={`badge d-flex align-items-center gap-1 ${
            criticalConflicts > 0 ? 'bg-danger text-white' : 'bg-success text-white'
          }`}
          style={{ textDecoration: 'none', padding: '0.45rem 0.75rem', borderRadius: '6px', fontSize: '0.78rem' }}
        >
          {criticalConflicts > 0 ? (
            <>
              <AlertTriangle size={14} />
              <span>{criticalConflicts} Critical Gaps</span>
            </>
          ) : (
            <>
              <CheckCircle size={14} />
              <span>Coverage Healthy</span>
            </>
          )}
        </Link>

        {/* User Profile dropdown */}
        <div className="dropdown">
          <button
            className="btn btn-light d-flex align-items-center gap-2"
            type="button"
            data-bs-toggle="dropdown"
            style={{
              border: '1px solid #e2e8f0',
              padding: '0.35rem 0.75rem',
              borderRadius: '8px',
              fontSize: '0.85rem'
            }}
          >
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              backgroundColor: '#1e3a8a', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 'bold'
            }}>
              {user ? user.full_name?.charAt(0) : 'U'}
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#0f172a' }}>
                {user ? user.full_name : 'Operations Manager'}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                {user ? user.role : 'OPERATIONS_MANAGER'}
              </div>
            </div>
          </button>
          <ul className="dropdown-menu dropdown-menu-end shadow-sm" style={{ fontSize: '0.85rem' }}>
            <li><h6 className="dropdown-header">Switch Demo Role</h6></li>
            <li>
              <button className="dropdown-item" onClick={() => loginAsDemo('ADMIN')}>
                👑 Admin (Full Access)
              </button>
            </li>
            <li>
              <button className="dropdown-item" onClick={() => loginAsDemo('OPERATIONS_MANAGER')}>
                📋 Operations Manager
              </button>
            </li>
            <li>
              <button className="dropdown-item" onClick={() => loginAsDemo('POD_LEAD')}>
                🛡️ Alpha Pod Lead
              </button>
            </li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <button className="dropdown-item text-danger d-flex align-items-center gap-2" onClick={logout}>
                <LogOut size={14} /> Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
