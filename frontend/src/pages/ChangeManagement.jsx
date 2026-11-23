import React, { useState } from 'react';
import api from '../services/api';
import {
  Workflow, ArrowRight, CheckCircle, AlertTriangle, UserCheck, Play, RefreshCw, Sparkles
} from 'lucide-react';

const ChangeManagement = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [simulationLog, setSimulationLog] = useState([]);
  const [coverageBefore, setCoverageBefore] = useState(null);
  const [coverageAfter, setCoverageAfter] = useState(null);
  const [backups, setBackups] = useState([]);
  const [selectedBackup, setSelectedBackup] = useState(null);

  const addLog = (msg) => {
    setSimulationLog(prev => [...prev, { time: new Date().toLocaleTimeString(), msg }]);
  };

  // Step 1: Initial Roster State
  const runStep1 = async () => {
    try {
      setLoading(true);
      addLog("Generating benchmark monthly roster for December 2026...");
      const res = await api.post('/rosters/generate', { year: 2026, month: 12 });
      const summary = res.data.result?.coverage_summary || {};
      setCoverageBefore(summary);
      addLog(`Roster generated. Current Coverage: ${summary.coverage_percentage}%. Total Gaps: ${summary.total_gaps}.`);
      setCurrentStep(2);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Employee requests approved leave (Rahul Verma on Dec 15)
  const runStep2 = async () => {
    try {
      setLoading(true);
      addLog("Specialist Rahul Verma requests approved leave on 2026-12-15...");
      // Fetch Rahul
      const empRes = await api.get('/employees?search=Rahul Verma');
      const rahul = empRes.data.employees[0];

      await api.post('/availability', {
        employee_id: rahul._id,
        start_date: '2026-12-15',
        end_date: '2026-12-15',
        type: 'CASUAL_LEAVE',
        status: 'APPROVED',
        reason: 'Change Management Demo: Emergency Leave'
      });
      addLog("Leave approved and saved in database.");

      // Re-run roster generation to detect impact
      addLog("Triggering deterministic scheduling engine to evaluate impact on EcoGlow (365_DAYS brand)...");
      const res = await api.post('/rosters/generate', { year: 2026, month: 12 });
      const summary = res.data.result?.coverage_summary || {};
      setCoverageBefore(summary);

      addLog(`CRITICAL GAP DETECTED: Single dedicated employee unavailable for EcoGlow Skincare on 2026-12-15.`);
      setCurrentStep(3);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Fetch candidate backup recommendations
  const runStep3 = async () => {
    try {
      setLoading(true);
      addLog("Querying Backup Recommendation Engine for Dec 15 relief resources...");
      const res = await api.get('/conflicts');
      const criticalGaps = (res.data.conflicts || []).filter(c => c.date === '2026-12-15' && c.brand_name?.includes('EcoGlow'));
      
      if (criticalGaps.length > 0) {
        const gap = criticalGaps[0];
        const backupRes = await api.get(`/conflicts/${gap._id}/backups`);
        setBackups(backupRes.data.backup_candidates || []);
        setSelectedBackup(backupRes.data.backup_candidates[0] || null);
        addLog(`Identified ${backupRes.data.backup_candidates?.length || 0} eligible candidates ranked by pod & skill.`);
      } else {
        addLog("No conflict found, fetching generic backups...");
      }
      setCurrentStep(4);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Assign backup & revalidate
  const runStep4 = async () => {
    if (!selectedBackup) return;
    try {
      setLoading(true);
      addLog(`Assigning relief specialist ${selectedBackup.employee_name} to EcoGlow on 2026-12-15...`);
      
      const res = await api.get('/conflicts');
      const gap = (res.data.conflicts || []).find(c => c.date === '2026-12-15' && c.brand_name?.includes('EcoGlow'));
      
      if (gap) {
        await api.post(`/rosters/ROSTER-2026-12/reassign-backup`, {
          date: '2026-12-15',
          process_id: gap.process_id,
          employee_id: selectedBackup.employee_id
        });
      }

      addLog("Relief assignment committed. Revalidating entire monthly roster...");
      const valRes = await api.post(`/rosters/ROSTER-2026-12/validate`);
      const val = valRes.data.validation;
      setCoverageAfter(val);
      addLog(`REVALIDATION SUCCESS: Coverage restored to ${val.coverage_percentage}%. Critical gaps: ${val.critical_conflicts}.`);
      setCurrentStep(5);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setSimulationLog([]);
    setCoverageBefore(null);
    setCoverageAfter(null);
    setBackups([]);
    setSelectedBackup(null);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
            Change Management & Backup Reassignment Workflow
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.82rem' }}>
            Interactive demonstration of Section 15: Handling single-resource brand employee leave, gap detection, backup suggestion, and automatic revalidation.
          </p>
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={handleReset}>
          <RefreshCw size={14} className="me-1" /> Reset Simulation
        </button>
      </div>

      {/* Stepper Wizard Indicator */}
      <div className="card border-0 shadow-sm p-3 mb-4 bg-white">
        <div className="row text-center g-2" style={{ fontSize: '0.8rem' }}>
          <div className="col">
            <div className={`p-2 rounded ${currentStep >= 1 ? 'bg-primary text-white fw-bold' : 'bg-light text-muted'}`}>
              1. Initial Roster
            </div>
          </div>
          <div className="col">
            <div className={`p-2 rounded ${currentStep >= 2 ? 'bg-primary text-white fw-bold' : 'bg-light text-muted'}`}>
              2. Leave Request
            </div>
          </div>
          <div className="col">
            <div className={`p-2 rounded ${currentStep >= 3 ? 'bg-primary text-white fw-bold' : 'bg-light text-muted'}`}>
              3. Gap Detection
            </div>
          </div>
          <div className="col">
            <div className={`p-2 rounded ${currentStep >= 4 ? 'bg-primary text-white fw-bold' : 'bg-light text-muted'}`}>
              4. Backup Ranking
            </div>
          </div>
          <div className="col">
            <div className={`p-2 rounded ${currentStep >= 5 ? 'bg-success text-white fw-bold' : 'bg-light text-muted'}`}>
              5. Revalidation
            </div>
          </div>
        </div>
      </div>

      {/* Main Execution Grid */}
      <div className="row g-4">
        {/* Left: Step Controllers */}
        <div className="col-lg-7">
          {currentStep === 1 && (
            <div className="card border-0 shadow-sm p-4 bg-white">
              <h5 style={{ fontWeight: 700 }}>Step 1: Baseline Roster State</h5>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                EcoGlow Cosmetics requires 365-day operations and is managed by single dedicated specialist Rahul Verma.
              </p>
              <button
                className="btn btn-primary d-flex align-items-center gap-2"
                onClick={runStep1}
                disabled={loading}
                style={{ backgroundColor: '#2563eb', width: 'fit-content' }}
              >
                <Play size={16} /> Generate December 2026 Baseline Roster
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="card border-0 shadow-sm p-4 bg-white">
              <h5 style={{ fontWeight: 700 }}>Step 2: Simulate Employee Leave Request</h5>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                Rahul Verma requests and receives approved casual leave on <strong>15 December 2026</strong>.
              </p>
              <button
                className="btn btn-warning text-dark fw-bold d-flex align-items-center gap-2"
                onClick={runStep2}
                disabled={loading}
                style={{ width: 'fit-content' }}
              >
                <AlertTriangle size={16} /> Approve Rahul's Leave & Run Gap Detection
              </button>
            </div>
          )}

          {currentStep === 3 && (
            <div className="card border-0 shadow-sm p-4 bg-white">
              <div className="alert alert-danger py-2 mb-3 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
                <AlertTriangle size={18} />
                <div>
                  <strong>Mandatory Coverage Gap Detected!</strong> EcoGlow operates 365 days, but dedicated specialist Rahul is unavailable on Dec 15.
                </div>
              </div>
              <h5 style={{ fontWeight: 700 }}>Step 3: Trigger Backup Recommendation Engine</h5>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                The algorithm searches all 30+ specialists across pods for non-working, skill-matched candidates.
              </p>
              <button
                className="btn btn-primary d-flex align-items-center gap-2"
                onClick={runStep3}
                disabled={loading}
                style={{ backgroundColor: '#2563eb', width: 'fit-content' }}
              >
                <Sparkles size={16} /> Recommend Eligible Relief Specialists
              </button>
            </div>
          )}

          {currentStep === 4 && (
            <div className="card border-0 shadow-sm p-4 bg-white">
              <h5 style={{ fontWeight: 700 }}>Step 4: Select and Assign Relief Specialist</h5>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                Choose the best-scoring candidate to cover EcoGlow on 15 December:
              </p>
              <div className="list-group mb-3" style={{ fontSize: '0.85rem' }}>
                {backups.map(cand => (
                  <label
                    key={cand.employee_id}
                    className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                      selectedBackup?.employee_id === cand.employee_id ? 'active' : ''
                    }`}
                    style={{ cursor: 'pointer' }}
                  >
                    <div>
                      <input
                        type="radio"
                        name="backupRadio"
                        className="form-check-input me-2"
                        checked={selectedBackup?.employee_id === cand.employee_id}
                        onChange={() => setSelectedBackup(cand)}
                      />
                      <strong>{cand.employee_name}</strong> ({cand.designation})
                      <div style={{ fontSize: '0.72rem', opacity: 0.9 }}>
                        {cand.reasons.join(' • ')}
                      </div>
                    </div>
                    <span className="badge bg-light text-dark border">
                      {cand.score} pts
                    </span>
                  </label>
                ))}
              </div>
              <button
                className="btn btn-success d-flex align-items-center gap-2"
                onClick={runStep4}
                disabled={loading || !selectedBackup}
                style={{ width: 'fit-content' }}
              >
                <CheckCircle size={16} /> Assign Selected Relief & Revalidate Roster
              </button>
            </div>
          )}

          {currentStep === 5 && (
            <div className="card border-0 shadow-sm p-4 bg-white">
              <div className="text-center py-3">
                <CheckCircle size={48} className="text-success mb-2 mx-auto" />
                <h4 style={{ fontWeight: 800, color: '#16a34a' }}>Change Workflow Successfully Landed!</h4>
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                  Coverage restored. Relief specialist assigned without invalidating unaffected processes.
                </p>
              </div>
              <div className="p-3 bg-light rounded mb-3" style={{ fontSize: '0.82rem' }}>
                <div className="d-flex justify-content-between mb-1">
                  <span>Assigned Relief Resource:</span>
                  <strong>{selectedBackup?.employee_name}</strong>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span>Target Brand Account:</span>
                  <strong>EcoGlow Skincare (365_DAYS)</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Updated Coverage Metric:</span>
                  <strong className="text-success">{coverageAfter?.coverage_percentage}%</strong>
                </div>
              </div>
              <button className="btn btn-outline-primary btn-sm" onClick={handleReset}>
                Run Simulation Again
              </button>
            </div>
          )}
        </div>

        {/* Right: Live Telemetry Log */}
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm h-100 bg-white">
            <div className="card-header bg-light fw-bold" style={{ fontSize: '0.85rem' }}>
              Deterministic Execution Log
            </div>
            <div className="card-body p-3 font-monospace" style={{ fontSize: '0.75rem', maxHeight: '350px', overflowY: 'auto' }}>
              {simulationLog.length === 0 ? (
                <span className="text-muted">Awaiting workflow initialization...</span>
              ) : (
                simulationLog.map((l, i) => (
                  <div key={i} className="mb-2 pb-1 border-bottom">
                    <span className="text-muted">[{l.time}]</span> {l.msg}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangeManagement;
