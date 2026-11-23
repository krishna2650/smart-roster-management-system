import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  CalendarRange, Play, RefreshCw, CheckCircle, AlertTriangle,
  Upload, Download, Filter, Eye, Edit2, ShieldAlert, Check, X,
  Building2, Layers, GitBranch, User, Calendar, ArrowLeftRight,
  ShieldCheck, Zap
} from 'lucide-react';
import { StatusBadge } from '../components/Common/Badge';

const RosterManagement = () => {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(12);
  const [viewMode, setViewMode] = useState('company'); // company, pod, brand, process, employee
  const [rosterData, setRosterData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Supplementary lists
  const [pods, setPods] = useState([]);
  const [brands, setBrands] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedPodFilter, setSelectedPodFilter] = useState('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('');
  const [selectedEmpFilter, setSelectedEmpFilter] = useState('');

  // Fatigue & Burnout guardrail state
  const [fatigueData, setFatigueData] = useState(null);
  const [showFatigueModal, setShowFatigueModal] = useState(false);

  // Shift Swap Marketplace state
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapEmpA, setSwapEmpA] = useState('');
  const [swapDateA, setSwapDateA] = useState('');
  const [swapEmpB, setSwapEmpB] = useState('');
  const [swapDateB, setSwapDateB] = useState('');
  const [swapValidation, setSwapValidation] = useState(null);
  const [swapLoading, setSwapLoading] = useState(false);

  // Cell edit modal
  const [editingCell, setEditingCell] = useState(null);
  const [cellEmployeeId, setCellEmployeeId] = useState('');
  const [cellStatus, setCellStatus] = useState('WORKING');
  const [cellNotes, setCellNotes] = useState('');

  // Messages
  const [feedback, setFeedback] = useState(null);

  const fetchRoster = async () => {
    try {
      setLoading(true);
      const rosterId = `ROSTER-${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
      let queryParams = `view=${viewMode}`;
      if (viewMode === 'pod' && selectedPodFilter) queryParams += `&pod_id=${selectedPodFilter}`;
      if (viewMode === 'brand' && selectedBrandFilter) queryParams += `&brand_id=${selectedBrandFilter}`;
      if (viewMode === 'employee' && selectedEmpFilter) queryParams += `&employee_id=${selectedEmpFilter}`;

      const res = await api.get(`/rosters/${rosterId}?${queryParams}`);
      setRosterData(res.data.roster);

      // Also fetch fatigue guardrail metrics
      try {
        const fatRes = await api.get(`/rosters/${rosterId}/fatigue`);
        setFatigueData(fatRes.data);
      } catch (fatErr) {
        console.error("Fatigue fetch err", fatErr);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setRosterData(null);
        setFatigueData(null);
      } else {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchFiltersData = async () => {
    try {
      const [podRes, brandRes, empRes] = await Promise.all([
        api.get('/pods'),
        api.get('/brands'),
        api.get('/employees?status=active')
      ]);
      setPods(podRes.data.pods || []);
      setBrands(brandRes.data.brands || []);
      setEmployees(empRes.data.employees || []);
      if (empRes.data.employees?.length > 0 && !selectedEmpFilter) {
        setSelectedEmpFilter(empRes.data.employees[0]._id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchFiltersData();
  }, []);

  useEffect(() => {
    fetchRoster();
  }, [selectedYear, selectedMonth, selectedPodFilter, selectedBrandFilter, selectedEmpFilter, viewMode]);

  const handleGenerate = async () => {
    try {
      setActionLoading(true);
      setFeedback(null);
      const res = await api.post('/rosters/generate', {
        year: parseInt(selectedYear),
        month: parseInt(selectedMonth)
      });
      setFeedback({
        type: 'success',
        message: `Roster generated deterministically! Coverage: ${res.data.result?.coverage_summary?.coverage_percentage}% (${res.data.result?.conflicts_count} conflicts detected).`
      });
      await fetchRoster();
    } catch (err) {
      setFeedback({
        type: 'danger',
        message: "Error generating roster: " + (err.response?.data?.error || err.message)
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!rosterData) return;
    try {
      setActionLoading(true);
      const res = await api.post(`/rosters/${rosterData.roster_id}/validate`);
      const val = res.data.validation;
      setFeedback({
        type: val.is_valid ? 'success' : 'warning',
        message: val.is_valid
          ? "Roster validation passed! All mandatory client processes have 100% adequate coverage."
          : `Validation Warning: Found ${val.critical_conflicts} critical coverage gap(s). Please review and assign backups before publishing.`
      });
      await fetchRoster();
    } catch (err) {
      setFeedback({ type: 'danger', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!rosterData) return;
    try {
      setActionLoading(true);
      const res = await api.post(`/rosters/${rosterData.roster_id}/publish`);
      setFeedback({
        type: 'success',
        message: "Roster published successfully! Notifications and shift locks activated."
      });
      await fetchRoster();
    } catch (err) {
      setFeedback({
        type: 'danger',
        message: err.response?.data?.message || err.message
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenSwapModal = () => {
    setShowSwapModal(true);
    setSwapValidation(null);
    const defaultDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
    setSwapDateA(defaultDate);
    setSwapDateB(defaultDate);
    if (employees.length >= 2) {
      if (!swapEmpA) setSwapEmpA(employees[0]._id);
      if (!swapEmpB) setSwapEmpB(employees[1]._id);
    }
  };

  const handlePrevalidateSwap = async () => {
    if (!swapEmpA || !swapDateA || !swapEmpB || !swapDateB || !rosterData) return;
    try {
      setSwapLoading(true);
      const res = await api.post(`/rosters/${rosterData.roster_id}/swap/prevalidate`, {
        emp_a_id: swapEmpA,
        date_a: swapDateA,
        emp_b_id: swapEmpB,
        date_b: swapDateB
      });
      setSwapValidation(res.data);
    } catch (err) {
      setFeedback({ type: 'danger', message: "Pre-validation error: " + (err.response?.data?.error || err.message) });
    } finally {
      setSwapLoading(false);
    }
  };

  const handleExecuteSwap = async () => {
    if (!swapValidation?.safe_to_swap || !rosterData) return;
    try {
      setSwapLoading(true);
      const res = await api.post(`/rosters/${rosterData.roster_id}/swap/execute`, {
        emp_a_id: swapEmpA,
        date_a: swapDateA,
        emp_b_id: swapEmpB,
        date_b: swapDateB
      });
      setShowSwapModal(false);
      setFeedback({
        type: 'success',
        message: res.data.message || "Shift swap executed atomically and roster revalidated!"
      });
      await fetchRoster();
    } catch (err) {
      setFeedback({ type: 'danger', message: "Execution error: " + (err.response?.data?.error || err.message) });
    } finally {
      setSwapLoading(false);
    }
  };

  const handleCellClick = (entry, dateStr, rowObj) => {
    setEditingCell({
      date: dateStr,
      entry: entry,
      rowObj: rowObj
    });
    setCellEmployeeId(entry?.employee_id || '');
    setCellStatus(entry?.status || 'WORKING');
    setCellNotes(entry?.notes || '');
  };

  const handleSaveCellEdit = async (e) => {
    e.preventDefault();
    if (!editingCell || !rosterData) return;
    try {
      const payload = {
        date: editingCell.date,
        process_id: editingCell.entry?.process_id || editingCell.rowObj?.process_id,
        employee_id: cellEmployeeId || null,
        status: cellStatus,
        notes: cellNotes
      };
      await api.put(`/rosters/${rosterData.roster_id}/entry`, payload);
      setFeedback({
        type: 'info',
        message: `Cell adjusted for ${editingCell.date}. Automatic revalidation executed.`
      });
      setEditingCell(null);
      await fetchRoster();
    } catch (err) {
      alert("Error updating cell: " + (err.response?.data?.error || err.message));
    }
  };

  // Helper to calculate days in month and flag dynamic today
  const todayStr = new Intl.DateTimeFormat('en-CA').format(new Date()); // YYYY-MM-DD
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const dateList = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const dateObj = new Date(selectedYear, selectedMonth - 1, dayNum);
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'narrow' });
    const isSunday = dateObj.getDay() === 0;
    const isSaturday = dateObj.getDay() === 6;
    const isToday = (dateStr === todayStr);
    return { dayNum, dateStr, dayName, isSunday, isSaturday, isToday };
  });

  // Group entries according to current view
  const renderViewContent = () => {
    if (!rosterData) {
      return (
        <div className="text-center py-5">
          <CalendarRange size={48} className="text-muted mb-3" />
          <h4 style={{ fontWeight: 700, color: '#0f172a' }}>No Roster Generated for {selectedMonth}/{selectedYear}</h4>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>
            Click "Generate Roster" to evaluate client operating calendars, employee availability, approved leaves, and minimum coverage.
          </p>
          <button
            className="btn btn-primary px-4 py-2"
            onClick={handleGenerate}
            disabled={actionLoading}
            style={{ backgroundColor: '#2563eb' }}
          >
            <Play size={16} className="me-2" /> Generate Monthly Roster
          </button>
        </div>
      );
    }

    const entries = rosterData.entries || [];

    if (viewMode === 'company' || viewMode === 'pod') {
      // Group by Employee
      // Distinct employees in entries
      let empMap = {};
      employees.forEach(emp => {
        if (selectedPodFilter && String(emp.pod_id) !== String(selectedPodFilter)) return;
        empMap[emp._id] = {
          id: emp._id,
          name: emp.full_name,
          code: emp.employee_id,
          designation: emp.designation,
          podName: emp.pod_name,
          dates: {}
        };
      });

      entries.forEach(e => {
        if (e.employee_id && empMap[e.employee_id]) {
          // If already has entry, prefer WORKING over other
          const existing = empMap[e.employee_id].dates[e.date];
          if (!existing || e.status === 'WORKING') {
            empMap[e.employee_id].dates[e.date] = e;
          }
        }
      });

      const rows = Object.values(empMap);

      return (
        <div className="roster-table-container">
          <table className="roster-table">
            <thead>
              <tr>
                <th className="sticky-col">Specialist & Pod</th>
                {dateList.map(d => (
                  <th
                    key={d.dateStr}
                    style={{
                      backgroundColor: d.isToday ? '#eff6ff' : d.isSunday ? '#fef2f2' : d.isSaturday ? '#f8fafc' : '#ffffff',
                      borderLeft: d.isToday ? '2px solid #2563eb' : undefined,
                      borderRight: d.isToday ? '2px solid #2563eb' : undefined,
                      minWidth: '34px'
                    }}
                  >
                    {d.isToday && (
                      <div style={{ fontSize: '0.52rem', fontWeight: 800, color: '#2563eb', letterSpacing: '0.5px' }}>TODAY</div>
                    )}
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: d.isToday ? '#2563eb' : undefined }}>{d.dayNum}</div>
                    <div style={{ fontSize: '0.65rem', color: d.isSunday ? '#dc2626' : '#64748b' }}>{d.dayName}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id}>
                  <td className="sticky-col">
                    <div style={{ fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>
                      {row.name}
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
                      {row.code} • {row.podName || 'Pod Specialist'}
                    </div>
                  </td>
                  {dateList.map(d => {
                    const entry = row.dates[d.dateStr] || {
                      date: d.dateStr,
                      employee_id: row.id,
                      status: d.isSunday ? 'WEEKLY_OFF' : 'NOT_REQUIRED',
                      notes: d.isSunday ? 'Standard Off' : 'No shift assigned'
                    };
                    return (
                      <td
                        key={d.dateStr}
                        style={{
                          backgroundColor: d.isToday ? '#f0fdf4' : d.isSunday ? '#fffcfc' : '#ffffff',
                          borderLeft: d.isToday ? '2px solid #2563eb' : undefined,
                          borderRight: d.isToday ? '2px solid #2563eb' : undefined,
                          padding: '4px 2px'
                        }}
                      >
                        <StatusBadge
                          status={entry.status}
                          notes={entry.notes}
                          onClick={() => handleCellClick(entry, d.dateStr, row)}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (viewMode === 'brand' || viewMode === 'process') {
      // Group by Brand and Process
      const brandProcessMap = {};
      entries.forEach(e => {
        const key = `${e.brand_name}__${e.process_name}`;
        if (!brandProcessMap[key]) {
          brandProcessMap[key] = {
            brandName: e.brand_name,
            processName: e.process_name,
            processId: e.process_id,
            dates: {}
          };
        }
        if (!brandProcessMap[key].dates[e.date]) {
          brandProcessMap[key].dates[e.date] = [];
        }
        brandProcessMap[key].dates[e.date].push(e);
      });

      const rows = Object.values(brandProcessMap);

      return (
        <div className="roster-table-container">
          <table className="roster-table">
            <thead>
              <tr>
                <th className="sticky-col">Brand & Process Requirements</th>
                {dateList.map(d => (
                  <th
                    key={d.dateStr}
                    style={{
                      backgroundColor: d.isToday ? '#eff6ff' : d.isSunday ? '#fef2f2' : d.isSaturday ? '#f8fafc' : '#ffffff',
                      borderLeft: d.isToday ? '2px solid #2563eb' : undefined,
                      borderRight: d.isToday ? '2px solid #2563eb' : undefined,
                      minWidth: '40px'
                    }}
                  >
                    {d.isToday && (
                      <div style={{ fontSize: '0.52rem', fontWeight: 800, color: '#2563eb', letterSpacing: '0.5px' }}>TODAY</div>
                    )}
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: d.isToday ? '#2563eb' : undefined }}>{d.dayNum}</div>
                    <div style={{ fontSize: '0.65rem', color: d.isSunday ? '#dc2626' : '#64748b' }}>{d.dayName}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}>
                  <td className="sticky-col">
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{row.brandName}</div>
                    <div className="text-primary fw-semibold" style={{ fontSize: '0.72rem' }}>
                      {row.processName}
                    </div>
                  </td>
                  {dateList.map(d => {
                    const dayEntries = row.dates[d.dateStr] || [];
                    const hasGap = dayEntries.some(e => e.status === 'COVERAGE_GAP');
                    const workingStaff = dayEntries.filter(e => e.status === 'WORKING');
                    const isHoliday = dayEntries.some(e => e.status === 'PUBLIC_HOLIDAY');
                    const isNotReq = dayEntries.some(e => e.status === 'NOT_REQUIRED');

                    let displayStatus = 'NOT_REQUIRED';
                    let notes = 'Not required';

                    if (hasGap) {
                      displayStatus = 'COVERAGE_GAP';
                      notes = 'Critical Coverage Gap! No available staff.';
                    } else if (workingStaff.length > 0) {
                      displayStatus = 'WORKING';
                      notes = `Covered by: ${workingStaff.map(w => w.employee_name).join(', ')}`;
                    } else if (isHoliday) {
                      displayStatus = 'PUBLIC_HOLIDAY';
                      notes = 'Public Holiday';
                    } else if (isNotReq) {
                      displayStatus = 'NOT_REQUIRED';
                      notes = 'Closed on this day';
                    }

                    return (
                      <td key={d.dateStr} style={{ padding: '4px 2px' }}>
                        <StatusBadge
                          status={displayStatus}
                          notes={notes}
                          onClick={() => handleCellClick(dayEntries[0] || { process_id: row.processId }, d.dateStr, row)}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (viewMode === 'employee') {
      // Individual employee view
      const selectedEmp = employees.find(e => String(e._id) === String(selectedEmpFilter)) || employees[0];
      const empEntries = entries.filter(e => String(e.employee_id) === String(selectedEmp?._id));
      const dateMap = {};
      empEntries.forEach(e => {
        dateMap[e.date] = e;
      });

      return (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-white border rounded">
            <div>
              <h5 style={{ margin: 0, fontWeight: 700 }}>{selectedEmp?.full_name} ({selectedEmp?.employee_id})</h5>
              <div className="text-muted" style={{ fontSize: '0.78rem' }}>{selectedEmp?.designation} • {selectedEmp?.pod_name}</div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted" style={{ fontSize: '0.8rem' }}>Switch Specialist:</span>
              <select
                className="form-select form-select-sm"
                value={selectedEmpFilter}
                onChange={e => setSelectedEmpFilter(e.target.value)}
                style={{ width: '220px' }}
              >
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>{emp.full_name} ({emp.employee_id})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="row g-2">
            {dateList.map(d => {
              const entry = dateMap[d.dateStr] || {
                status: d.isSunday ? 'WEEKLY_OFF' : 'NOT_REQUIRED',
                notes: d.isSunday ? 'Weekly Off' : 'Not Scheduled'
              };
              return (
                <div key={d.dateStr} className="col-lg-2 col-md-3 col-sm-4 col-6">
                  <div
                    className="p-2 border rounded bg-white"
                    style={{
                      borderLeft: `4px solid ${
                        entry.status === 'WORKING' ? '#2563eb' :
                        entry.status === 'LEAVE' ? '#f59e0b' :
                        entry.status === 'WEEKLY_OFF' ? '#64748b' : '#cbd5e1'
                      }`
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-bold">{d.dateStr}</span>
                      <span className="badge bg-light text-dark">{d.dayName}</span>
                    </div>
                    <div className="mt-2">
                      <StatusBadge status={entry.status} />
                    </div>
                    <div className="text-muted mt-1 text-truncate" style={{ fontSize: '0.7rem' }}>
                      {entry.brand_name || entry.notes}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  };

  return (
    <div>
      {/* Title & Control Bar */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
            Monthly Roster Engine & Schedule Matrix
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.82rem' }}>
            Deterministic rule-based allocation respecting single-resource brands, operating calendars, approved leaves, and fair weekly offs.
          </p>
        </div>

        {/* Action Controls */}
        <div className="d-flex gap-2 align-items-center mt-2 mt-md-0">
          <div className="input-group input-group-sm" style={{ width: '180px' }}>
            <select
              className="form-select"
              value={selectedMonth}
              onChange={e => setSelectedMonth(parseInt(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                <option key={m} value={m}>
                  {new Date(2026, m - 1, 1).toLocaleString('default', { month: 'short' })}
                </option>
              ))}
            </select>
            <select
              className="form-select"
              value={selectedYear}
              onChange={e => setSelectedYear(parseInt(e.target.value))}
            >
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>

          <button
            className="btn btn-primary btn-sm d-flex align-items-center gap-1"
            onClick={handleGenerate}
            disabled={actionLoading}
            style={{ backgroundColor: '#2563eb' }}
          >
            <Play size={13} /> Generate
          </button>

          <button
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
            onClick={handleValidate}
            disabled={actionLoading || !rosterData}
          >
            <CheckCircle size={13} /> Validate
          </button>

          <button
            className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
            onClick={handleOpenSwapModal}
            disabled={actionLoading || !rosterData}
            title="Peer-to-Peer Shift Swap Marketplace"
          >
            <ArrowLeftRight size={13} /> Swap Shifts
          </button>

          <button
            className={`btn btn-sm d-flex align-items-center gap-1 ${
              rosterData?.status === 'PUBLISHED' ? 'btn-success' : 'btn-dark'
            }`}
            onClick={handlePublish}
            disabled={actionLoading || !rosterData || rosterData?.status === 'PUBLISHED'}
          >
            <Upload size={13} />
            {rosterData?.status === 'PUBLISHED' ? 'Published' : 'Publish Roster'}
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} d-flex align-items-center justify-content-between py-2 mb-3`} style={{ fontSize: '0.85rem' }}>
          <div>{feedback.message}</div>
          <button type="button" className="btn-close" onClick={() => setFeedback(null)}></button>
        </div>
      )}

      {/* Roster Status & Coverage Card */}
      {rosterData && (
        <div className="card border-0 shadow-sm p-3 mb-3 bg-white">
          <div className="d-flex flex-wrap justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-3">
              <span className={`badge ${
                rosterData.status === 'PUBLISHED' ? 'bg-success' :
                rosterData.status === 'VALIDATED' ? 'bg-primary' : 'bg-warning text-dark'
              }`} style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem' }}>
                Status: {rosterData.status}
              </span>
              <div>
                <span className="text-muted" style={{ fontSize: '0.78rem' }}>Roster ID:</span>
                <strong className="ms-1 font-monospace">{rosterData.roster_id}</strong>
              </div>
              <div className="vr"></div>
              <div>
                <span className="text-muted" style={{ fontSize: '0.78rem' }}>Process Coverage:</span>
                <strong className={`ms-1 ${rosterData.coverage_summary?.coverage_percentage >= 95 ? 'text-success' : 'text-danger'}`}>
                  {rosterData.coverage_summary?.coverage_percentage}%
                </strong>
                <span className="text-muted ms-1" style={{ fontSize: '0.72rem' }}>
                  ({rosterData.coverage_summary?.total_process_days_covered} of {rosterData.coverage_summary?.total_process_days_required} required shifts)
                </span>
              </div>
              <div className="vr"></div>
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted" style={{ fontSize: '0.78rem' }}>Fatigue Guardrail:</span>
                {fatigueData && fatigueData.total_fatigue_risks > 0 ? (
                  <button
                    className="badge bg-danger-subtle text-danger border border-danger-subtle d-flex align-items-center gap-1 px-2 py-1"
                    onClick={() => setShowFatigueModal(true)}
                    style={{ fontSize: '0.75rem', cursor: 'pointer', background: '#fee2e2' }}
                    title="Click to view burnout alerts"
                  >
                    <AlertTriangle size={12} /> {fatigueData.total_fatigue_risks} Fatigue Alert{fatigueData.total_fatigue_risks > 1 ? 's' : ''} (&gt;6d)
                  </button>
                ) : (
                  <span className="badge bg-success-subtle text-success border border-success-subtle d-flex align-items-center gap-1 px-2 py-1" style={{ fontSize: '0.75rem', background: '#dcfce7' }}>
                    <ShieldCheck size={12} /> 100% Compliant (&le;6d)
                  </span>
                )}
              </div>
            </div>

            {rosterData.coverage_summary?.total_gaps > 0 && (
              <div className="d-flex align-items-center gap-2 text-danger fw-bold" style={{ fontSize: '0.82rem' }}>
                <ShieldAlert size={16} />
                <span>{rosterData.coverage_summary?.total_gaps} Unresolved Coverage Gap(s)</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Switcher Tabs & Filters */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
        {/* View Tabs */}
        <div className="btn-group btn-group-sm" role="group">
          <button
            type="button"
            className={`btn ${viewMode === 'company' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setViewMode('company')}
          >
            <Building2 size={13} className="me-1" /> Company View
          </button>
          <button
            type="button"
            className={`btn ${viewMode === 'pod' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setViewMode('pod')}
          >
            <Layers size={13} className="me-1" /> Pod View
          </button>
          <button
            type="button"
            className={`btn ${viewMode === 'brand' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setViewMode('brand')}
          >
            <Building2 size={13} className="me-1" /> Brand View
          </button>
          <button
            type="button"
            className={`btn ${viewMode === 'process' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setViewMode('process')}
          >
            <GitBranch size={13} className="me-1" /> Process View
          </button>
          <button
            type="button"
            className={`btn ${viewMode === 'employee' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setViewMode('employee')}
          >
            <User size={13} className="me-1" /> Employee View
          </button>
        </div>

        {/* View-specific Filter */}
        <div className="d-flex align-items-center gap-2 mt-2 mt-md-0">
          {viewMode === 'pod' && (
            <select
              className="form-select form-select-sm"
              value={selectedPodFilter}
              onChange={e => setSelectedPodFilter(e.target.value)}
              style={{ width: '220px' }}
            >
              <option value="">All Operational Pods</option>
              {pods.map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          )}

          {viewMode === 'brand' && (
            <select
              className="form-select form-select-sm"
              value={selectedBrandFilter}
              onChange={e => setSelectedBrandFilter(e.target.value)}
              style={{ width: '220px' }}
            >
              <option value="">All Brands</option>
              {brands.map(b => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Status Legend Bar */}
      <div className="card border-0 shadow-sm p-2 mb-3 bg-light">
        <div className="d-flex flex-wrap align-items-center gap-3" style={{ fontSize: '0.75rem' }}>
          <strong className="text-muted">LEGEND:</strong>
          <span className="d-flex align-items-center gap-1"><span className="badge-status badge-working">W</span> Working</span>
          <span className="d-flex align-items-center gap-1"><span className="badge-status badge-weekly-off">WO</span> Weekly Off</span>
          <span className="d-flex align-items-center gap-1"><span className="badge-status badge-leave">LV</span> Approved Leave</span>
          <span className="d-flex align-items-center gap-1"><span className="badge-status badge-comp-off">CO</span> Comp-Off</span>
          <span className="d-flex align-items-center gap-1"><span className="badge-status badge-public-holiday">PH</span> Public Holiday</span>
          <span className="d-flex align-items-center gap-1"><span className="badge-status badge-not-required">—</span> Not Required</span>
          <span className="d-flex align-items-center gap-1"><span className="badge-status badge-coverage-gap">GAP</span> Coverage Gap</span>
          <span className="text-muted ms-auto fst-italic">Click any cell to edit allocation and revalidate.</span>
        </div>
      </div>

      {/* Main Grid Content */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <div className="text-muted mt-2" style={{ fontSize: '0.85rem' }}>Loading schedule grid...</div>
        </div>
      ) : (
        renderViewContent()
      )}

      {/* Cell Edit Modal */}
      {editingCell && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <h5 className="modal-title mb-0" style={{ fontSize: '1rem', fontWeight: 700 }}>
                    Manual Shift Adjustment
                  </h5>
                  <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                    Date: {editingCell.date} • {editingCell.rowObj?.name || editingCell.rowObj?.processName}
                  </span>
                </div>
                <button type="button" className="btn-close" onClick={() => setEditingCell(null)}></button>
              </div>
              <form onSubmit={handleSaveCellEdit}>
                <div className="modal-body" style={{ fontSize: '0.85rem' }}>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Assigned Specialist</label>
                    <select
                      className="form-select"
                      value={cellEmployeeId}
                      onChange={e => setCellEmployeeId(e.target.value)}
                    >
                      <option value="">Unassigned (Coverage Gap)</option>
                      {employees.map(emp => (
                        <option key={emp._id} value={emp._id}>{emp.full_name} ({emp.employee_id})</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Shift Status</label>
                    <select
                      className="form-select"
                      value={cellStatus}
                      onChange={e => setCellStatus(e.target.value)}
                    >
                      <option value="WORKING">WORKING (Active Shift)</option>
                      <option value="WEEKLY_OFF">WEEKLY_OFF (Fair Rest Day)</option>
                      <option value="LEAVE">LEAVE (Approved Absence)</option>
                      <option value="COMP_OFF">COMP_OFF</option>
                      <option value="PUBLIC_HOLIDAY">PUBLIC_HOLIDAY</option>
                      <option value="NOT_REQUIRED">NOT_REQUIRED</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Manager Notes</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Reason for manual modification..."
                      value={cellNotes}
                      onChange={e => setCellNotes(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingCell(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ backgroundColor: '#2563eb' }}>
                    Save & Revalidate Roster
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Shift Swap Marketplace Modal */}
      {showSwapModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 rounded bg-primary-subtle text-primary">
                    <ArrowLeftRight size={18} />
                  </div>
                  <div>
                    <h5 className="modal-title mb-0" style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                      Peer-to-Peer Shift Swap Marketplace
                    </h5>
                    <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                      Algorithmic pre-validation enforcing skills, operating calendars, approved leaves, and fatigue guardrails.
                    </span>
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowSwapModal(false)}></button>
              </div>

              <div className="modal-body p-4" style={{ fontSize: '0.85rem' }}>
                <div className="row g-3 mb-4">
                  {/* Side A: Specialist 1 */}
                  <div className="col-md-6">
                    <div className="p-3 rounded border bg-light">
                      <div className="d-flex align-items-center gap-2 mb-2 text-primary fw-bold">
                        <User size={15} /> Specialist A (Initiator)
                      </div>
                      <div className="mb-2">
                        <label className="form-label text-muted small mb-1">Select Specialist</label>
                        <select
                          className="form-select form-select-sm"
                          value={swapEmpA}
                          onChange={e => { setSwapEmpA(e.target.value); setSwapValidation(null); }}
                        >
                          {employees.map(emp => (
                            <option key={emp._id} value={emp._id}>{emp.full_name} ({emp.employee_id})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="form-label text-muted small mb-1">Shift Date to Trade</label>
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          value={swapDateA}
                          onChange={e => { setSwapDateA(e.target.value); setSwapValidation(null); }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Side B: Specialist 2 */}
                  <div className="col-md-6">
                    <div className="p-3 rounded border bg-light">
                      <div className="d-flex align-items-center gap-2 mb-2 text-primary fw-bold">
                        <User size={15} /> Specialist B (Counterpart)
                      </div>
                      <div className="mb-2">
                        <label className="form-label text-muted small mb-1">Select Specialist</label>
                        <select
                          className="form-select form-select-sm"
                          value={swapEmpB}
                          onChange={e => { setSwapEmpB(e.target.value); setSwapValidation(null); }}
                        >
                          {employees.map(emp => (
                            <option key={emp._id} value={emp._id}>{emp.full_name} ({emp.employee_id})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="form-label text-muted small mb-1">Target Shift Date</label>
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          value={swapDateB}
                          onChange={e => { setSwapDateB(e.target.value); setSwapValidation(null); }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Prevalidation Button */}
                <div className="d-flex justify-content-center mb-3">
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm px-4 d-flex align-items-center gap-2"
                    onClick={handlePrevalidateSwap}
                    disabled={swapLoading || !swapEmpA || !swapEmpB}
                  >
                    {swapLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        Running Algorithmic Pre-Validation...
                      </>
                    ) : (
                      <>
                        <Zap size={14} /> Run Algorithmic Pre-Validation
                      </>
                    )}
                  </button>
                </div>

                {/* Prevalidation Results */}
                {swapValidation && (
                  <div className="border rounded p-3 mb-3 bg-white">
                    <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                      <span className="fw-bold">Validation Guardrails Checklist</span>
                      {swapValidation.safe_to_swap ? (
                        <span className="badge bg-success-subtle text-success border border-success-subtle d-flex align-items-center gap-1">
                          <CheckCircle size={13} /> SAFE TO EXECUTE
                        </span>
                      ) : (
                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle d-flex align-items-center gap-1">
                          <AlertTriangle size={13} /> BLOCKED BY GUARDRAIL
                        </span>
                      )}
                    </div>

                    <div className="d-flex flex-column gap-2 mb-3">
                      {swapValidation.checks?.map((chk, idx) => (
                        <div key={idx} className="d-flex align-items-start gap-2">
                          {chk.passed ? (
                            <CheckCircle size={16} className="text-success mt-1 flex-shrink-0" />
                          ) : (
                            <X size={16} className="text-danger mt-1 flex-shrink-0" />
                          )}
                          <div>
                            <div className={`fw-semibold ${chk.passed ? 'text-dark' : 'text-danger'}`}>
                              {chk.name}
                            </div>
                            <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                              {chk.details}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {swapValidation.safe_to_swap && (
                      <div className="alert alert-success d-flex align-items-center gap-2 py-2 mb-0" style={{ fontSize: '0.82rem' }}>
                        <ShieldCheck size={16} className="text-success flex-shrink-0" />
                        <div>
                          Both specialists meet all eligibility, schedule compatibility, skill, and fatigue requirements. Shifts can be safely exchanged without causing critical coverage gaps.
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="modal-footer border-top bg-light">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowSwapModal(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success btn-sm d-flex align-items-center gap-1 px-3"
                  onClick={handleExecuteSwap}
                  disabled={swapLoading || !swapValidation?.safe_to_swap}
                >
                  <ArrowLeftRight size={13} /> Approve & Execute Swap
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fatigue & Burnout Details Modal */}
      {showFatigueModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 rounded bg-danger-subtle text-danger">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <h5 className="modal-title mb-0" style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                      Fatigue & Burnout Guardrail Monitoring
                    </h5>
                    <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                      Enforcing max 6 consecutive working days without rest. Specialists exceeding streak limit are flagged below.
                    </span>
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowFatigueModal(false)}></button>
              </div>

              <div className="modal-body p-3" style={{ fontSize: '0.85rem' }}>
                <div className="d-flex justify-content-between align-items-center p-2 mb-3 rounded bg-light border">
                  <div>
                    <span className="text-muted">Maximum Allowed Streak:</span>
                    <strong className="ms-1">6 Consecutive Days</strong>
                  </div>
                  <div>
                    <span className="text-muted">Burnout Risk Specialists:</span>
                    <strong className="ms-1 text-danger">{fatigueData?.total_fatigue_risks || 0}</strong>
                  </div>
                  <div>
                    <span className="text-muted">Compliant Specialists:</span>
                    <strong className="ms-1 text-success">{fatigueData?.healthy_employees_count || 0}</strong>
                  </div>
                </div>

                {fatigueData?.risks?.length === 0 ? (
                  <div className="alert alert-success py-3 text-center mb-0">
                    <ShieldCheck size={24} className="text-success mb-2" />
                    <div className="fw-bold">Zero Fatigue Violations Detected!</div>
                    <div className="text-muted small">All active specialists have at least one weekly rest day scheduled every 6 days.</div>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm table-hover align-middle border mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Specialist Name</th>
                          <th>Pod</th>
                          <th>Consecutive Streak</th>
                          <th>Streak Period</th>
                          <th>Risk Severity</th>
                          <th>Recommended Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fatigueData?.risks?.map((r, i) => (
                          <tr key={i}>
                            <td className="fw-semibold text-dark">{r.employee_name}</td>
                            <td><span className="badge bg-light text-dark border">{r.pod_name}</span></td>
                            <td>
                              <span className="fw-bold text-danger">{r.streak_length} days</span>
                            </td>
                            <td className="font-monospace small text-muted">
                              {r.streak_start} → {r.streak_end}
                            </td>
                            <td>
                              <span className={`badge ${r.violation_level === 'CRITICAL' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                                {r.violation_level}
                              </span>
                            </td>
                            <td className="small text-muted">
                              Schedule weekly off or initiate shift swap.
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="modal-footer border-top bg-light">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowFatigueModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RosterManagement;
