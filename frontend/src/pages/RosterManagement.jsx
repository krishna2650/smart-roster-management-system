import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  CalendarRange, Play, RefreshCw, CheckCircle, AlertTriangle,
  Upload, Download, Filter, Eye, Edit2, ShieldAlert, Check, X
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
      const res = await api.get(`/rosters/${rosterId}?view=${viewMode}&pod_id=${selectedPodFilter}&brand_id=${selectedBrandFilter}&employee_id=${selectedEmpFilter}`);
      setRosterData(res.data.roster);
    } catch (err) {
      if (err.response?.status === 404) {
        setRosterData(null);
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

  // Helper to calculate days in month
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const dateList = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const dateObj = new Date(selectedYear, selectedMonth - 1, dayNum);
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'narrow' });
    const isSunday = dateObj.getDay() === 0;
    const isSaturday = dateObj.getDay() === 6;
    return { dayNum, dateStr, dayName, isSunday, isSaturday };
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
                      backgroundColor: d.isSunday ? '#fef2f2' : d.isSaturday ? '#f8fafc' : '#ffffff',
                      minWidth: '34px'
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>{d.dayNum}</div>
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
                          backgroundColor: d.isSunday ? '#fffcfc' : '#ffffff',
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
                      backgroundColor: d.isSunday ? '#fef2f2' : d.isSaturday ? '#f8fafc' : '#ffffff',
                      minWidth: '40px'
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>{d.dayNum}</div>
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
            🏢 Company-wide View
          </button>
          <button
            type="button"
            className={`btn ${viewMode === 'pod' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setViewMode('pod')}
          >
            🛡️ Pod-wise View
          </button>
          <button
            type="button"
            className={`btn ${viewMode === 'brand' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setViewMode('brand')}
          >
            🏷️ Brand-wise View
          </button>
          <button
            type="button"
            className={`btn ${viewMode === 'process' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setViewMode('process')}
          >
            ⚙️ Process-wise View
          </button>
          <button
            type="button"
            className={`btn ${viewMode === 'employee' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setViewMode('employee')}
          >
            👤 Employee-wise View
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
          <span className="d-flex align-items-center gap-1"><span className="badge-status badge-coverage-gap">GAP!</span> Mandatory Coverage Gap</span>
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
    </div>
  );
};

export default RosterManagement;
