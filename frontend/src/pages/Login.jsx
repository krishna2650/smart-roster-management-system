import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CalendarRange, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login, loginAsDemo } = useAuth();
  const [email, setEmail] = useState('manager@datastraw.com');
  const [password, setPassword] = useState('manager123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role) => {
    setError('');
    setLoading(true);
    try {
      await loginAsDemo(role);
      navigate('/');
    } catch (err) {
      setError('Demo login failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light px-3">
      <div className="card border-0 shadow-lg" style={{ maxWidth: '440px', width: '100%', borderRadius: '14px' }}>
        <div className="card-body p-4 p-sm-5">
          <div className="text-center mb-4">
            <div className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-3 p-3 mb-3 shadow-sm" style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)' }}>
              <CalendarRange size={32} />
            </div>
            <h3 style={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
              DATASTRAW
            </h3>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>
              Smart Roster Management System
            </p>
          </div>

          {error && (
            <div className="alert alert-danger py-2 mb-3" style={{ fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Work Email</label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-muted">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  className="form-control border-start-0"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Password</label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-muted">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  className="form-control border-start-0"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2"
              disabled={loading}
              style={{ backgroundColor: '#2563eb', fontWeight: 600, fontSize: '0.9rem' }}
            >
              {loading ? 'Authenticating...' : <>Sign In to Operations <ArrowRight size={16} /></>}
            </button>
          </form>

          {/* Quick Demo Switcher Buttons */}
          <div className="mt-4 pt-4 border-top">
            <div className="text-center mb-2 text-muted fw-bold" style={{ fontSize: '0.72rem', letterSpacing: '0.05em' }}>
              ONE-CLICK DEMO EVALUATION ROLES
            </div>
            <div className="d-grid gap-2">
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={() => handleDemoLogin('OPERATIONS_MANAGER')}
              >
                📋 Operations Manager (Default)
              </button>
              <button
                type="button"
                className="btn btn-outline-dark btn-sm"
                onClick={() => handleDemoLogin('ADMIN')}
              >
                👑 Admin Director
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => handleDemoLogin('POD_LEAD')}
              >
                🛡️ Alpha Pod Lead
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
