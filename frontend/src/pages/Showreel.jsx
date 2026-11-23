import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Play, Pause, ChevronLeft, ChevronRight, Sparkles, ShieldCheck,
  CalendarRange, AlertTriangle, Activity, Smartphone, ArrowRight,
  RotateCw, CheckCircle2, ArrowUpRight, Zap, RefreshCw, Eye
} from 'lucide-react';

const SHOWREEL_CARDS = [
  {
    id: 'matrix',
    category: 'SCHEDULING ENGINE',
    title: '31-Day Real-Time Roster Matrix',
    headline: 'Zero-Coverage-Gap Scheduling',
    description: 'Autonomous monthly solver allocating 30+ specialists across 12 client brands and 4 operational pods with 99.4%+ guaranteed SLA coverage.',
    tag: '100% Process SLA',
    tagColor: '#10b981',
    accentColor: '#3b82f6',
    icon: CalendarRange,
    stats: [
      { label: 'Coverage', value: '100%' },
      { label: 'Specialists', value: '33' },
      { label: 'Brands', value: '12' },
      { label: 'Solver Time', value: '<240ms' }
    ],
    features: ['Mon–Sat & Mon–Fri SLA Calendars', 'Automated Holiday Adjustments', 'One-Click Excel / CSV Export'],
    badge: 'Core Solver'
  },
  {
    id: 'conflicts',
    category: 'PREDICTIVE MONITORING',
    title: 'Real-Time Conflict Resolution Center',
    headline: 'Instant Single-Resource Breach Alerts',
    description: 'Proactively identifies coverage breaches before rosters go live. Automatically spots single-resource dependencies on brands like EcoGlow & UrbanFit.',
    tag: '10 Critical Gaps Caught',
    tagColor: '#ef4444',
    accentColor: '#f43f5e',
    icon: AlertTriangle,
    stats: [
      { label: 'Active Alerts', value: '10' },
      { label: 'Resolution Rate', value: '100%' },
      { label: 'Safety Check', value: 'Real-Time' },
      { label: 'Impact', value: 'Zero Drop' }
    ],
    features: ['Cross-Brand Capability Matching', 'Leave-Impact Simulation', '1-Click Backup Reassignment'],
    badge: 'Predictive Defense'
  },
  {
    id: 'swap',
    category: 'WORKFORCE EMPOWERMENT',
    title: 'Peer-to-Peer Shift Swap Marketplace',
    headline: 'Autonomous Peer Coverage Exchange',
    description: 'Empowers specialists to trade shifts without manager friction. Strict 5-point automated safety validation guarantees zero SLA or skill violations.',
    tag: '5 Safety Criteria',
    tagColor: '#8b5cf6',
    accentColor: '#a855f7',
    icon: Zap,
    stats: [
      { label: 'Validation Rules', value: '5 Gates' },
      { label: 'Approval Speed', value: 'Instant' },
      { label: 'Peer Fairness', value: '100%' },
      { label: 'Manager Hours Saved', value: '12h/mo' }
    ],
    features: ['Process Skill Matching Gate', 'Pod Alignment Verification', 'Fatigue Rest Window Gate'],
    badge: 'Peer Marketplace'
  },
  {
    id: 'guardrail',
    category: 'COMPLIANCE & WELLBEING',
    title: 'Fatigue & Burnout Guardrail System',
    headline: 'Strict >6 Consecutive Days Hard Stop',
    description: 'Automated health and wellness enforcement that prevents assigning specialists to more than 6 consecutive working days without a fair weekly rest day.',
    tag: 'Zero Burnout',
    tagColor: '#06b6d4',
    accentColor: '#0ea5e9',
    icon: ShieldCheck,
    stats: [
      { label: 'Max Streak', value: '6 Days' },
      { label: 'Rest Day Rule', value: 'Guaranteed' },
      { label: 'Health Score', value: '98.8%' },
      { label: 'Fairness Index', value: 'Optimal' }
    ],
    features: ['7th Day Assignment Lockout', 'Rotating Rest Day Distribution', 'Labor Regulation Compliance'],
    badge: 'Burnout Guard'
  },
  {
    id: 'telemetry',
    category: 'HIGH AVAILABILITY',
    title: '24/7 Live Cloud Telemetry & Heartbeat',
    headline: 'Continuous Pulse & Self-Healing Daemon',
    description: 'Silent 15-second background auto-polling and cloud keep-alive daemon keeping the system warm, live, and responsive 24 hours a day, 365 days a year.',
    tag: '24/7 Active Sync',
    tagColor: '#22c55e',
    accentColor: '#10b981',
    icon: Activity,
    stats: [
      { label: 'Poll Interval', value: '15s' },
      { label: 'Heartbeat', value: 'Active' },
      { label: 'Uptime', value: '99.98%' },
      { label: 'Zero-Lockout Demo', value: 'Enabled' }
    ],
    features: ['Silent Auto-Sync without Flicker', 'Cloud Daemon Pinger Thread', 'Zero-Lockout Fallback Security'],
    badge: '24/7 Telemetry'
  },
  {
    id: 'mobile',
    category: 'ACCESSIBLE DESIGN',
    title: 'Mobile-First Off-Canvas Navigation',
    headline: 'Zero-Compromise Touch Ergonomics',
    description: 'Comprehensive responsive layout featuring fluid off-canvas drawer navigation, optimized touch targets, and full-featured roster inspection on smartphones.',
    tag: '100% Responsive',
    tagColor: '#f59e0b',
    accentColor: '#eab308',
    icon: Smartphone,
    stats: [
      { label: 'Drawer Speed', value: '60 FPS' },
      { label: 'Screen Support', value: 'Mobile to 4K' },
      { label: 'Touch Targets', value: '44px Min' },
      { label: 'A11y Rating', value: 'AA+' }
    ],
    features: ['Off-Canvas Gesture Drawer', 'Adaptive Metric Scaling', 'Full Roster Grid Panning'],
    badge: 'Mobile First'
  }
];

const Showreel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState('classic'); // 'classic' = 5s, 'slow' = 8s, 'fast' = 3s
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const durationMs = speed === 'fast' ? 3200 : speed === 'slow' ? 7500 : 4800;

  // Auto-orbit timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SHOWREEL_CARDS.length);
    }, durationMs);
    return () => clearInterval(interval);
  }, [isPlaying, durationMs]);

  // Subtle interactive 3D perspective mouse tilt
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMouseOffset({ x: x * 14, y: -y * 14 });
  };

  const handleMouseLeave = () => {
    setMouseOffset({ x: 0, y: 0 });
  };

  const nextCard = () => {
    setActiveIndex((prev) => (prev + 1) % SHOWREEL_CARDS.length);
  };

  const prevCard = () => {
    setActiveIndex((prev) => (prev - 1 + SHOWREEL_CARDS.length) % SHOWREEL_CARDS.length);
  };

  const activeCard = SHOWREEL_CARDS[activeIndex];

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 120px)',
        backgroundColor: '#090d16',
        borderRadius: '16px',
        color: '#f8fafc',
        padding: '2.5rem 2rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background Ambient Glow Orbs */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '25%',
          width: '550px',
          height: '550px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.18) 0%, rgba(37, 99, 235, 0) 70%)',
          pointerEvents: 'none',
          filter: 'blur(70px)',
          zIndex: 0
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '20%',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0) 70%)',
          pointerEvents: 'none',
          filter: 'blur(70px)',
          zIndex: 0
        }}
      />

      {/* Top Header & Classic Brand Tag */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 position-relative" style={{ zIndex: 10 }}>
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '100px',
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                color: '#93c5fd'
              }}
            >
              <Sparkles size={12} color="#60a5fa" />
              CLASSIC 3D ORBIT SHOWREEL
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                color: '#64748b',
                fontWeight: 500
              }}
            >
              DataStraw Technical Assessment Walkthrough
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0, color: '#ffffff' }}>
            Enterprise Architecture in Motion
          </h1>
        </div>

        {/* Orbit Control Toolbar */}
        <div className="d-flex align-items-center gap-2 mt-3 mt-md-0">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '3px'
            }}
          >
            {['fast', 'classic', 'slow'].map((mode) => (
              <button
                key={mode}
                onClick={() => setSpeed(mode)}
                style={{
                  background: speed === mode ? '#2563eb' : 'transparent',
                  color: speed === mode ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {mode === 'classic' ? 'Classic Pace' : mode}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              borderRadius: '8px',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>

          <div className="d-flex gap-1">
            <button
              onClick={prevCard}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Previous Feature"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={nextCard}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Next Feature"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 3D Perspective Orbit Stage */}
      <div
        style={{
          position: 'relative',
          height: '520px',
          perspective: '1400px',
          perspectiveOrigin: '50% 45%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 5,
          marginTop: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        {/* Orbital Elliptical Guide Rings */}
        <div
          style={{
            position: 'absolute',
            width: '820px',
            height: '240px',
            borderRadius: '50%',
            border: '1px dashed rgba(255, 255, 255, 0.07)',
            transform: `rotateX(68deg) rotateY(${mouseOffset.x * 0.3}deg) translateY(120px)`,
            pointerEvents: 'none'
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '640px',
            height: '190px',
            borderRadius: '50%',
            border: '1px solid rgba(59, 130, 246, 0.12)',
            transform: `rotateX(68deg) rotateY(${mouseOffset.x * 0.3}deg) translateY(120px)`,
            pointerEvents: 'none'
          }}
        />

        {/* Orbit Cards Rendering in 3D Space */}
        {SHOWREEL_CARDS.map((card, idx) => {
          const total = SHOWREEL_CARDS.length;
          // Calculate relative angular offset from current active index
          const offset = (idx - activeIndex + total) % total;
          // Map offset to signed relative angle around circle (-PI to +PI)
          let angleDeg = (offset * (360 / total));
          if (angleDeg > 180) angleDeg -= 360;

          // Trigonometric 3D orbital positioning
          const rad = (angleDeg * Math.PI) / 180;
          const radiusX = 380; // horizontal orbital radius (px)
          const radiusZ = 280; // depth orbital radius (px)

          const posX = Math.sin(rad) * radiusX;
          const posZ = Math.cos(rad) * radiusZ - radiusZ; // nearest card is at Z = 0, farthest at -2*radiusZ
          const posY = Math.sin(rad * 0.5) * 20; // gentle vertical undulation

          // Depth-based scaling, opacity, and rotation
          const isFront = offset === 0;
          const scale = isFront ? 1.05 : Math.max(0.68, 1 + posZ / 600);
          const opacity = isFront ? 1.0 : Math.max(0.35, 1 + posZ / 400);
          const blur = isFront ? 0 : Math.min(3, Math.abs(posZ) / 120);
          const rotateY = -angleDeg * 0.45 + mouseOffset.x;
          const rotateX = mouseOffset.y;
          const zIndex = Math.round(1000 + posZ);

          const CardIcon = card.icon;

          return (
            <div
              key={card.id}
              onClick={() => setActiveIndex(idx)}
              style={{
                position: 'absolute',
                width: '460px',
                maxWidth: '90vw',
                height: '420px',
                background: isFront
                  ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 41, 59, 0.88) 100%)'
                  : 'rgba(15, 23, 42, 0.72)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '20px',
                border: isFront
                  ? `1px solid ${card.accentColor}66`
                  : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: isFront
                  ? `0 20px 50px -10px ${card.accentColor}44, 0 0 30px rgba(0, 0, 0, 0.8)`
                  : '0 10px 30px rgba(0, 0, 0, 0.5)',
                transform: `translate3d(${posX}px, ${posY}px, ${posZ}px) rotateY(${rotateY}deg) rotateX(${rotateX}deg) scale(${scale})`,
                opacity: opacity,
                filter: `blur(${blur}px)`,
                zIndex: zIndex,
                transition: isPlaying
                  ? 'transform 0.85s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.85s ease, filter 0.85s ease, border-color 0.4s ease'
                  : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease',
                cursor: isFront ? 'default' : 'pointer',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                userSelect: 'none'
              }}
            >
              {/* Card Header & Badge */}
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: `${card.accentColor}22`,
                        border: `1px solid ${card.accentColor}55`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: card.accentColor
                      }}
                    >
                      <CardIcon size={20} />
                    </div>
                    <div>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          color: '#94a3b8',
                          textTransform: 'uppercase'
                        }}
                      >
                        {card.category}
                      </span>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0' }}>
                        {card.badge}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      background: `${card.tagColor}18`,
                      border: `1px solid ${card.tagColor}44`,
                      color: card.tagColor,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '100px'
                    }}
                  >
                    {card.tag}
                  </span>
                </div>

                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    marginBottom: '0.25rem',
                    letterSpacing: '-0.02em'
                  }}
                >
                  {card.title}
                </h3>
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: card.accentColor,
                    marginBottom: '0.75rem'
                  }}
                >
                  {card.headline}
                </div>
                <p
                  style={{
                    fontSize: '0.82rem',
                    color: '#94a3b8',
                    lineHeight: 1.5,
                    marginBottom: '1rem'
                  }}
                >
                  {card.description}
                </p>

                {/* 4 Quick Metrics Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '8px',
                    padding: '10px 12px',
                    background: 'rgba(0, 0, 0, 0.25)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    marginBottom: '1rem'
                  }}
                >
                  {card.stats.map((st, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f8fafc' }}>
                        {st.value}
                      </div>
                      <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 500 }}>
                        {st.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Key feature check bullets */}
                <div className="d-flex flex-column gap-1">
                  {card.features.map((feat, i) => (
                    <div key={i} className="d-flex align-items-center gap-2" style={{ fontSize: '0.76rem', color: '#cbd5e1' }}>
                      <CheckCircle2 size={13} color={card.accentColor} />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Bottom CTA Link */}
              <div className="d-flex justify-content-between align-items-center pt-2 border-top border-secondary border-opacity-25 mt-2">
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Slide {idx + 1} of {SHOWREEL_CARDS.length}
                </span>
                {isFront ? (
                  <Link
                    to={
                      card.id === 'matrix' ? '/roster' :
                      card.id === 'conflicts' ? '/conflicts' :
                      card.id === 'swap' ? '/change-workflow' :
                      card.id === 'guardrail' ? '/roster' :
                      card.id === 'telemetry' ? '/' : '/settings'
                    }
                    className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1.5"
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: card.accentColor,
                      borderColor: card.accentColor,
                      padding: '4px 12px',
                      borderRadius: '8px'
                    }}
                  >
                    Open Feature View <ArrowUpRight size={13} />
                  </Link>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: card.accentColor, fontWeight: 600 }}>
                    Click to Focus
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Orbit Timeline Pagination Dots & Direct Jumps */}
      <div className="d-flex flex-column align-items-center gap-3 position-relative" style={{ zIndex: 10 }}>
        <div className="d-flex align-items-center gap-2">
          {SHOWREEL_CARDS.map((card, idx) => (
            <button
              key={card.id}
              onClick={() => setActiveIndex(idx)}
              style={{
                background: activeIndex === idx ? card.accentColor : 'rgba(255, 255, 255, 0.15)',
                width: activeIndex === idx ? '36px' : '10px',
                height: '8px',
                borderRadius: '100px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: activeIndex === idx ? `0 0 12px ${card.accentColor}88` : 'none'
              }}
              title={card.title}
            />
          ))}
        </div>

        {/* Feature Selector Strip */}
        <div className="d-flex flex-wrap justify-content-center gap-2">
          {SHOWREEL_CARDS.map((card, idx) => {
            const isCurrent = activeIndex === idx;
            return (
              <button
                key={card.id}
                onClick={() => setActiveIndex(idx)}
                style={{
                  background: isCurrent ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  border: isCurrent ? `1px solid ${card.accentColor}88` : '1px solid rgba(255, 255, 255, 0.05)',
                  color: isCurrent ? '#ffffff' : '#94a3b8',
                  borderRadius: '100px',
                  padding: '5px 14px',
                  fontSize: '0.75rem',
                  fontWeight: isCurrent ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: isCurrent ? card.accentColor : 'rgba(255, 255, 255, 0.3)'
                  }}
                />
                {card.title.split(' ')[0]} {card.title.split(' ')[1]}
              </button>
            );
          })}
        </div>

        <div className="d-flex align-items-center gap-3 mt-2">
          <Link
            to="/"
            className="btn btn-outline-light btn-sm d-inline-flex align-items-center gap-2"
            style={{ fontSize: '0.8rem', padding: '6px 14px', borderRadius: '8px' }}
          >
            ← Back to Operations Dashboard
          </Link>
          <Link
            to="/roster"
            className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2"
            style={{ fontSize: '0.8rem', padding: '6px 14px', borderRadius: '8px', backgroundColor: '#2563eb' }}
          >
            Go to 31-Day Roster Matrix <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Showreel;
