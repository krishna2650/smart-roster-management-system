import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bell, AlertTriangle, User, LogOut, CheckCircle, Calendar, Shield, UserCog, UserCheck, Menu } from 'lucide-react';
import api from '../../services/api';

const Navbar = ({ onToggleMobileSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, loginAsDemo } = useAuth();
  const [criticalConflicts, setCriticalConflicts] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Dynamic date tick: auto-updates every 30 seconds so date advances every day at midnight
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

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
        const res = await api.get('/conflicts?status=UNRESOLVED');
        const count = res.data.global_critical_unresolved ?? res.data.critical_count ?? 0;
        setCriticalConflicts(count);
      } catch (e) {
        // quiet
      }
    };
    fetchConflictCount();
    const interval = setInterval(fetchConflictCount, 10000);
    
    // Listen for custom conflicts-updated events from resolution actions
    const handleUpdate = () => fetchConflictCount();
    window.addEventListener('conflicts-updated', handleUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('conflicts-updated', handleUpdate);
    };
  }, []);

  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(currentDate);

  return (
    <header className="top-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {onToggleMobileSidebar && (
          <button
            type="button"
            className="btn btn-sm btn-light border d-lg-none p-1"
            onClick={onToggleMobileSidebar}
            aria-label="Toggle navigation drawer"
          >
            <Menu size={18} />
          </button>
        )}
        <h1 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#0f172a' }} className="text-truncate">
          {getPageTitle(location.pathname)}
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Dynamic Live Date Badge */}
        <div
          className="d-none d-sm-flex align-items-center gap-1"
          style={{
            fontSize: '0.78rem',
            fontWeight: 600,
            color: '#334155',
            background: '#f8fafc',
            padding: '0.35rem 0.65rem',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            whiteSpace: 'nowrap'
          }}
          title="Dynamic Live Date (Updates every day automatically)"
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
          <Calendar size={13} className="text-secondary" />
          <span>{todayFormatted}</span>
        </div>

        {/* Conflict Alert Pill */}
        <Link
          to="/conflicts?month=2026-12&severity=CRITICAL"
          className={`badge d-flex align-items-center gap-1 ${
            criticalConflicts > 0 ? 'bg-danger text-white' : 'bg-success text-white'
          }`}
          style={{ textDecoration: 'none', padding: '0.45rem 0.75rem', borderRadius: '6px', fontSize: '0.78rem' }}
          title={`Active Benchmark: ${criticalConflicts} Critical Mandatory Coverage Gaps in Dec 2026`}
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
              <button className="dropdown-item d-flex align-items-center gap-2" onClick={() => loginAsDemo('ADMIN')}>
                <UserCog size={14} className="text-primary" /> Admin (Full Access)
              </button>
            </li>
            <li>
              <button className="dropdown-item d-flex align-items-center gap-2" onClick={() => loginAsDemo('OPERATIONS_MANAGER')}>
                <UserCheck size={14} className="text-primary" /> Operations Manager
              </button>
            </li>
            <li>
              <button className="dropdown-item d-flex align-items-center gap-2" onClick={() => loginAsDemo('POD_LEAD')}>
                <Shield size={14} className="text-primary" /> Alpha Pod Lead
              </button>
            </li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <button className="dropdown-item text-danger d-flex align-items-center gap-2" onClick={handleLogout}>
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
