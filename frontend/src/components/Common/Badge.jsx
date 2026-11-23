import React from 'react';

export const StatusBadge = ({ status, onClick, notes }) => {
  let badgeClass = 'badge-not-required';
  let label = status || 'N/A';

  switch (status) {
    case 'WORKING':
      badgeClass = 'badge-working';
      label = 'W';
      break;
    case 'WEEKLY_OFF':
      badgeClass = 'badge-weekly-off';
      label = 'WO';
      break;
    case 'LEAVE':
      badgeClass = 'badge-leave';
      label = 'LV';
      break;
    case 'COMP_OFF':
      badgeClass = 'badge-comp-off';
      label = 'CO';
      break;
    case 'PUBLIC_HOLIDAY':
      badgeClass = 'badge-public-holiday';
      label = 'PH';
      break;
    case 'NOT_REQUIRED':
      badgeClass = 'badge-not-required';
      label = '—';
      break;
    case 'COVERAGE_GAP':
      badgeClass = 'badge-coverage-gap';
      label = 'GAP!';
      break;
    default:
      label = status;
  }

  return (
    <span
      className={`badge-status ${badgeClass}`}
      onClick={onClick}
      title={notes || status}
    >
      {label}
    </span>
  );
};

export const CalendarBadge = ({ calendarType }) => {
  if (calendarType === '365_DAYS') {
    return <span className="badge bg-danger text-white">365-Day (24/7)</span>;
  }
  if (calendarType === 'DAILY_EXCLUDING_HOLIDAYS') {
    return <span className="badge bg-primary text-white">Daily (Ex Holidays)</span>;
  }
  if (calendarType === 'MON_SAT_EXCLUDING_HOLIDAYS') {
    return <span className="badge bg-secondary text-white">Mon–Sat (Sun Off)</span>;
  }
  return <span className="badge bg-light text-dark">{calendarType}</span>;
};
