import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  GitBranch,
  Layers,
  UserCheck,
  CalendarDays,
  CalendarOff,
  CalendarRange,
  AlertTriangle,
  FileSpreadsheet,
  Settings,
  Workflow,
  Sparkles,
  Compass,
  X
} from 'lucide-react';

const Sidebar = ({ mobileOpen, onClose }) => {
  const navItems = [
    { section: "CORE OPERATIONS" },
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/3d", icon: Compass, label: "Realistic 3D World", badge: "WebGL" },
    { to: "/showreel", icon: Sparkles, label: "3D Orbit Showreel", badge: "Demo" },
    { to: "/roster", icon: CalendarRange, label: "Roster Management", badge: "Engine" },
    { to: "/conflicts", icon: AlertTriangle, label: "Conflict Center" },
    { to: "/change-workflow", icon: Workflow, label: "Change Management" },
    
    { section: "WORKFORCE & CLIENTS" },
    { to: "/employees", icon: Users, label: "Employees" },
    { to: "/brands", icon: Building2, label: "Brands" },
    { to: "/processes", icon: GitBranch, label: "Processes" },
    { to: "/pods", icon: Layers, label: "Pods & Teams" },
    { to: "/assignments", icon: UserCheck, label: "Assignments" },

    { section: "SCHEDULE RULES & LEAVES" },
    { to: "/availability", icon: CalendarDays, label: "Availability & Leaves" },
    { to: "/holidays", icon: CalendarOff, label: "Public Holidays" },

    { section: "ANALYTICS & SYSTEM" },
    { to: "/reports", icon: FileSpreadsheet, label: "Reports & Exports" },
    { to: "/settings", icon: Settings, label: "Settings & Demo Auth" },
  ];

  return (
    <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-brand d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2">
          <div className="sidebar-brand-icon">
            <CalendarRange size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em', color: '#ffffff' }}>
              DATASTRAW
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 500 }}>
              Smart Roster System
            </div>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            className="btn btn-sm btn-dark text-muted d-lg-none p-1 border-0"
            onClick={onClose}
            aria-label="Close Sidebar"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item, idx) => {
          if (item.section) {
            return (
              <div key={idx} className="nav-section-title">
                {item.section}
              </div>
            );
          }
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span className="badge bg-primary text-white" style={{ fontSize: '0.65rem' }}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div style={{ padding: '1rem', borderTop: '1px solid #1e293b', background: '#090d16' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: '#2563eb', color: '#fff', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem'
          }}>
            DS
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              DataStraw Ops
            </div>
            <div style={{ fontSize: '0.7rem', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
              Deterministic v1.0
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
