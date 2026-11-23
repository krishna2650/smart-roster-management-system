import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Sidebar from './components/Layout/Sidebar';
import Navbar from './components/Layout/Navbar';

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

// Layout wrapper for authenticated pages
const AppLayout = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  // Allow guest access with default demo account if not logged in
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <main className="page-body">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
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
  );
}

export default App;
