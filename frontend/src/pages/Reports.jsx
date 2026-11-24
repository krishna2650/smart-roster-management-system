import React, { useState, useEffect } from 'react';
import api, { getBaseUrl } from '../services/api';
import {
  FileSpreadsheet, Download, Printer, CheckCircle, AlertTriangle, Building2, BarChart2
} from 'lucide-react';

const Reports = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const res = await api.get('/reports/summary');
        setSummary(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const handleDownloadCsv = (type) => {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/reports/export-csv?type=${type}&roster_id=${summary?.roster_id || ''}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
            Roster Reports & Enterprise Exports
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.82rem' }}>
            Export live MongoDB application schedules, client coverage compliance, and conflict audit logs.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" onClick={handlePrint}>
            <Printer size={14} /> Print View
          </button>
        </div>
      </div>

      {/* Export Options Grid */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-3 bg-white h-100">
            <h6 className="fw-bold mb-1">Company Schedule CSV</h6>
            <p className="text-muted" style={{ fontSize: '0.78rem' }}>
              Full detailed daily shift allocation matrix across all brands, processes, and specialists.
            </p>
            <button
              className="btn btn-primary btn-sm mt-auto d-flex align-items-center justify-content-center gap-1"
              onClick={() => handleDownloadCsv('company')}
              style={{ backgroundColor: '#2563eb' }}
            >
              <Download size={14} /> Download Schedule CSV
            </button>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-3 bg-white h-100">
            <h6 className="fw-bold mb-1">Conflicts & Gaps Audit CSV</h6>
            <p className="text-muted" style={{ fontSize: '0.78rem' }}>
              Comprehensive log of unresolved and resolved coverage gaps, severity rankings, and suggestions.
            </p>
            <button
              className="btn btn-danger btn-sm mt-auto d-flex align-items-center justify-content-center gap-1"
              onClick={() => handleDownloadCsv('conflicts')}
            >
              <Download size={14} /> Export Conflicts CSV
            </button>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-3 bg-white h-100">
            <h6 className="fw-bold mb-1">Leave & Availability Summary CSV</h6>
            <p className="text-muted" style={{ fontSize: '0.78rem' }}>
              Summary of all casual, sick, planned leaves and approved comp-offs across teams.
            </p>
            <button
              className="btn btn-outline-secondary btn-sm mt-auto d-flex align-items-center justify-content-center gap-1"
              onClick={() => handleDownloadCsv('leaves')}
            >
              <Download size={14} /> Export Leaves CSV
            </button>
          </div>
        </div>
      </div>

      {/* Brand Compliance & Coverage Breakdown */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white py-3">
          <h5 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
            Brand SLA Coverage Compliance Audit
          </h5>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.82rem' }}>
            <thead className="table-light">
              <tr>
                <th>Brand Client</th>
                <th>Operating Rule</th>
                <th>Required Shifts</th>
                <th>Covered Shifts</th>
                <th>Unstaffed Gaps</th>
                <th>Coverage SLA %</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">
                    Loading audit telemetry...
                  </td>
                </tr>
              ) : (summary?.brand_coverage || []).map((b, i) => (
                <tr key={i}>
                  <td className="fw-semibold">{b.brand_name}</td>
                  <td>
                    <span className="badge bg-light text-dark border">
                      {b.operating_calendar}
                    </span>
                  </td>
                  <td>{b.total_shifts_required}</td>
                  <td className="text-success fw-bold">{b.covered_shifts}</td>
                  <td className={b.gaps > 0 ? 'text-danger fw-bold' : 'text-muted'}>
                    {b.gaps}
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <div className="progress flex-grow-1" style={{ height: '6px' }}>
                        <div
                          className={`progress-bar ${b.coverage_percentage >= 95 ? 'bg-success' : 'bg-warning'}`}
                          style={{ width: `${b.coverage_percentage}%` }}
                        ></div>
                      </div>
                      <span className="fw-bold">{b.coverage_percentage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
