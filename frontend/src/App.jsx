import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Sidebar from './components/Layout/Sidebar';
import Navbar from './components/Layout/Navbar';
import Chatbot from './components/Common/Chatbot';

import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Brands from './pages/Brands';
import Processes from './pages/Processes';
import Pods from './pages/Pods';
import Assignments from './pages/Assignments';
import Availability from './pages/Availability';
import Holidays from './pages/Holidays';
import RosterManagement from './pages/RosterManagement';
import ConflictCenter from './pages/ConflictCenter';
import ChangeManagement from './pages/ChangeManagement';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Showreel from './pages/Showreel';
import Realistic3DShowreel from './pages/Realistic3DShowreel';

// Layout wrapper for authenticated pages
const AppLayout = ({ children }) => {
  const { user, loading } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar mobileOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
      {mobileSidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileSidebarOpen(false)} />
      )}
      <div className="main-content">
        <Navbar onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
        <main className="page-body">
          {children}
        </main>
      </div>
      <Chatbot />
    </div>
  );
};

// Enterprise Error Boundary preventing any blank screen crashes
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught display error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="d-flex flex-column justify-content-center align-items-center min-vh-100 bg-light p-4 text-center">
          <div className="card shadow-sm border-0 p-4" style={{ maxWidth: '480px', borderRadius: '14px' }}>
            <h4 style={{ fontWeight: 800, color: '#0f172a' }}>DataStraw Smart Roster System</h4>
            <p className="text-muted" style={{ fontSize: '0.88rem' }}>
              A display render event was caught. You can restore the session below.
            </p>
            <div className="alert alert-warning text-start" style={{ fontSize: '0.78rem' }}>
              {this.state.error?.message || 'Interface component recovery'}
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = '/';
              }}
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
            <Route path="/3d" element={<AppLayout><Realistic3DShowreel /></AppLayout>} />
            <Route path="/realistic-3d" element={<AppLayout><Realistic3DShowreel /></AppLayout>} />
            <Route path="/showreel" element={<AppLayout><Showreel /></AppLayout>} />
            <Route path="/roster" element={<AppLayout><RosterManagement /></AppLayout>} />
            <Route path="/conflicts" element={<AppLayout><ConflictCenter /></AppLayout>} />
            <Route path="/change-workflow" element={<AppLayout><ChangeManagement /></AppLayout>} />
            <Route path="/employees" element={<AppLayout><Employees /></AppLayout>} />
            <Route path="/brands" element={<AppLayout><Brands /></AppLayout>} />
            <Route path="/processes" element={<AppLayout><Processes /></AppLayout>} />
            <Route path="/pods" element={<AppLayout><Pods /></AppLayout>} />
            <Route path="/assignments" element={<AppLayout><Assignments /></AppLayout>} />
            <Route path="/availability" element={<AppLayout><Availability /></AppLayout>} />
            <Route path="/holidays" element={<AppLayout><Holidays /></AppLayout>} />
            <Route path="/reports" element={<AppLayout><Reports /></AppLayout>} />
            <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
