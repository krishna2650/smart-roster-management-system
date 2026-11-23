import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import {
  Sparkles, Play, Pause, RotateCw, ZoomIn, ZoomOut,
  ChevronLeft, ChevronRight, Eye, ArrowRight, ShieldCheck,
  CalendarRange, AlertTriangle, Zap, Activity, Smartphone,
  Layers, Compass, ArrowUpRight, Maximize2
} from 'lucide-react';

const FEATURES_DATA = [
  {
    id: 'matrix',
    category: 'SCHEDULING ENGINE',
    badge: 'Core Solver',
    title: '31-Day Real-Time Roster Matrix',
    headline: 'Zero-Coverage-Gap Autonomous Solver',
    description: 'Mathematically guarantees 100% SLA coverage across 12 client brands and 4 operational pods. Solves 31 operating days with automated shift balancing and instant CSV/Excel export.',
    accent: '#3b82f6',
    tag: '100% Process SLA',
    tagColor: '#10b981',
    route: '/roster',
    stats: [
      { val: '100%', lbl: 'Coverage' },
      { val: '33', lbl: 'Specialists' },
      { val: '12', lbl: 'Brands' },
      { val: '<240ms', lbl: 'Solver Time' }
    ],
    highlights: [
      'Mon–Sat & Mon–Fri SLA Calendars',
      'Automated Public Holiday Adjustments',
      'One-Click Excel / CSV Export Matrix'
    ],
    orbitAngle: 0
  },
  {
    id: 'conflicts',
    category: 'PREDICTIVE MONITORING',
    badge: 'Predictive Defense',
    title: 'Real-Time Conflict Center',
    headline: 'Instant Single-Resource Breach Alerts',
    description: 'Proactively identifies coverage breaches before rosters go live. Automatically spots single-resource dependencies on brands like EcoGlow & UrbanFit when leaves are requested.',
    accent: '#f43f5e',
    tag: '10 Critical Gaps Caught',
    tagColor: '#ef4444',
    route: '/conflicts',
    stats: [
      { val: '10', lbl: 'Active Alerts' },
      { val: '100%', lbl: 'Resolution' },
      { val: 'Real-Time', lbl: 'Detection' },
      { val: 'Zero', lbl: 'Service Drop' }
    ],
    highlights: [
      'Cross-Brand Capability Matching',
      'Leave-Impact Simulation Engine',
      '1-Click Backup Reassignment'
    ],
    orbitAngle: (Math.PI / 3) * 1
  },
  {
    id: 'swap',
    category: 'WORKFORCE EMPOWERMENT',
    badge: 'Peer Marketplace',
    title: 'Peer-to-Peer Shift Swap Marketplace',
    headline: 'Autonomous Peer Coverage Exchange',
    description: 'Empowers specialists to trade shifts without manager friction. Strict 5-point automated safety validation guarantees zero SLA or skill violations.',
    accent: '#a855f7',
    tag: '5 Safety Criteria',
    tagColor: '#8b5cf6',
    route: '/change-workflow',
    stats: [
      { val: '5 Gates', lbl: 'Validation' },
      { val: 'Instant', lbl: 'Approval' },
      { val: '100%', lbl: 'Fairness' },
      { val: '12h/mo', lbl: 'Manager Saved' }
    ],
    highlights: [
      'Process Skill Matching Gate',
      'Pod Alignment Verification',
      'Fatigue Rest Window Gate'
    ],
    orbitAngle: (Math.PI / 3) * 2
  },
  {
    id: 'guardrail',
    category: 'COMPLIANCE & WELLBEING',
    badge: 'Burnout Guard',
    title: 'Fatigue & Burnout Guardrail System',
    headline: 'Strict >6 Consecutive Days Hard Stop',
    description: 'Automated health and wellness enforcement that prevents assigning specialists to more than 6 consecutive working days without a fair weekly rest day.',
    accent: '#0ea5e9',
    tag: 'Zero Burnout',
    tagColor: '#06b6d4',
    route: '/roster',
    stats: [
      { val: '6 Days', lbl: 'Max Streak' },
      { val: 'Locked', lbl: '7th Day' },
      { val: '98.8%', lbl: 'Health Score' },
      { val: 'Optimal', lbl: 'Fairness' }
    ],
    highlights: [
      '7th Day Assignment Lockout',
      'Rotating Rest Day Distribution',
      'Labor Regulation Compliance'
    ],
    orbitAngle: (Math.PI / 3) * 3
  },
  {
    id: 'telemetry',
    category: 'HIGH AVAILABILITY',
    badge: '24/7 Telemetry',
    title: '24/7 Cloud Telemetry & Heartbeat',
    headline: 'Continuous Pulse & Self-Healing Daemon',
    description: 'Silent 15-second background auto-polling and cloud keep-alive daemon keeping the system warm, live, and responsive 24 hours a day, 365 days a year.',
    accent: '#10b981',
    tag: '24/7 Active Sync',
    tagColor: '#22c55e',
    route: '/',
    stats: [
      { val: '15s', lbl: 'Auto-Poll' },
      { val: 'Active', lbl: 'Keep-Alive' },
      { val: '99.98%', lbl: 'Uptime' },
      { val: 'Live', lbl: 'MongoDB' }
    ],
    highlights: [
      'Silent Auto-Sync without Flicker',
      'Cloud Daemon Pinger Thread',
      'Zero-Lockout Fallback Security'
    ],
    orbitAngle: (Math.PI / 3) * 4
  },
  {
    id: 'mobile',
    category: 'ACCESSIBLE DESIGN',
    badge: 'Mobile First',
    title: 'Mobile-First Off-Canvas Navigation',
    headline: 'Zero-Compromise Touch Ergonomics',
    description: 'Comprehensive responsive layout featuring fluid off-canvas drawer navigation, optimized touch targets, and full-featured roster inspection on smartphones.',
    accent: '#eab308',
    tag: '100% Responsive',
    tagColor: '#f59e0b',
    route: '/settings',
    stats: [
      { val: '60 FPS', lbl: 'Drawer' },
      { val: 'Mobile-4K', lbl: 'Displays' },
      { val: '44px', lbl: 'Touch Targets' },
      { val: 'AA+', lbl: 'Accessibility' }
    ],
    highlights: [
      'Off-Canvas Gesture Drawer',
      'Adaptive Metric Scaling',
      'Full Roster Grid Panning'
    ],
    orbitAngle: (Math.PI / 3) * 5
  }
];

const Realistic3DShowreel = () => {
  const mountRef = useRef(null);
  const [activeFeatureIdx, setActiveFeatureIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [cameraMode, setCameraMode] = useState('orbit'); // 'orbit', 'free', 'spotlight'
  const [theme, setTheme] = useState('cyber'); // 'cyber', 'emerald', 'midnight'

  // References to communicate with Three.js render loop without re-instantiating scene
  const sceneStateRef = useRef({
    activeIdx: 0,
    isPlaying: true,
    cameraMode: 'orbit',
    theme: 'cyber',
    mouseX: 0,
    mouseY: 0,
    isDragging: false,
    prevMousePos: { x: 0, y: 0 },
    rotationAngle: 0,
    manualRotX: 0.2,
    manualRotY: 0,
    zoomDist: 14
  });

  // Keep ref synchronized
  useEffect(() => {
    sceneStateRef.current.activeIdx = activeFeatureIdx;
    sceneStateRef.current.isPlaying = isPlaying;
    sceneStateRef.current.cameraMode = cameraMode;
    sceneStateRef.current.theme = theme;
  }, [activeFeatureIdx, isPlaying, cameraMode, theme]);

  // Three.js Mount & Render Lifecycle
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x07090e, 0.025);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 3.5, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 2. Lighting System
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.4);
    scene.add(ambientLight);

    const mouseLight = new THREE.PointLight(0x3b82f6, 4.5, 30);
    mouseLight.position.set(0, 4, 6);
    scene.add(mouseLight);

    const secondaryLight = new THREE.PointLight(0x10b981, 3.5, 25);
    secondaryLight.position.set(-6, -3, -4);
    scene.add(secondaryLight);

    const topSun = new THREE.DirectionalLight(0xffffff, 2.0);
    topSun.position.set(5, 12, 8);
    scene.add(topSun);

    // 3. Central Holographic Core (DataStraw Roster Crystal)
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // Inner Faceted Jewel
    const jewelGeo = new THREE.OctahedronGeometry(1.6, 0);
    const jewelMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      emissive: 0x2563eb,
      emissiveIntensity: 0.35,
      roughness: 0.15,
      metalness: 0.85,
      flatShading: true
    });
    const jewelMesh = new THREE.Mesh(jewelGeo, jewelMat);
    coreGroup.add(jewelMesh);

    // Outer Geodesic Wireframe Dome
    const outerGeo = new THREE.IcosahedronGeometry(2.35, 1);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      wireframe: true,
      transparent: true,
      opacity: 0.45
    });
    const outerWireMesh = new THREE.Mesh(outerGeo, outerMat);
    coreGroup.add(outerWireMesh);

    // Pulsing Core Ring
    const ringGeo = new THREE.TorusGeometry(3.2, 0.04, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.6
    });
    const coreRing = new THREE.Mesh(ringGeo, ringMat);
    coreRing.rotation.x = Math.PI / 2.3;
    coreGroup.add(coreRing);

    // Secondary Tilted Orbital Ring
    const ring2Geo = new THREE.TorusGeometry(4.8, 0.03, 16, 120);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      transparent: true,
      opacity: 0.4
    });
    const coreRing2 = new THREE.Mesh(ring2Geo, ring2Mat);
    coreRing2.rotation.x = -Math.PI / 3;
    coreRing2.rotation.y = 0.3;
    coreGroup.add(coreRing2);

    // 4. Operational Pod Satellites (Alpha, Beta, Gamma, Delta)
    const podNames = ['Alpha Pod', 'Beta Pod', 'Gamma Pod', 'Delta Pod'];
    const podColors = [0x3b82f6, 0x10b981, 0xa855f7, 0xf59e0b];
    const podMeshes = [];

    const podGroup = new THREE.Group();
    scene.add(podGroup);

    for (let i = 0; i < 4; i++) {
      const pGeo = new THREE.DodecahedronGeometry(0.35, 0);
      const pMat = new THREE.MeshStandardMaterial({
        color: podColors[i],
        emissive: podColors[i],
        emissiveIntensity: 0.6,
        roughness: 0.2,
        metalness: 0.7
      });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      podGroup.add(pMesh);
      podMeshes.push(pMesh);
    }

    // 5. 1,500 Particle Stardust Field
    const particleCount = 1200;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 50;
      positions[i + 1] = (Math.random() - 0.5) * 35;
      positions[i + 2] = (Math.random() - 0.5) * 45;

      const c = new THREE.Color(i % 2 === 0 ? 0x3b82f6 : 0x10b981);
      colors[i] = c.r;
      colors[i + 1] = c.g;
      colors[i + 2] = c.b;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    const starField = new THREE.Points(particleGeo, particleMat);
    scene.add(starField);

    // 6. 3D Feature Hologram Node Markers
    const featureNodes = [];
    const featureOrbitGroup = new THREE.Group();
    scene.add(featureOrbitGroup);

    const orbitRadius = 6.2;
    FEATURES_DATA.forEach((feat, idx) => {
      const nodeGeo = new THREE.SphereGeometry(0.32, 16, 16);
      const nodeMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(feat.accent),
        emissive: new THREE.Color(feat.accent),
        emissiveIntensity: 0.8,
        roughness: 0.1,
        metalness: 0.9
      });
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      
      const angle = (idx / FEATURES_DATA.length) * Math.PI * 2;
      node.position.set(
        Math.cos(angle) * orbitRadius,
        Math.sin(angle * 2) * 0.6,
        Math.sin(angle) * orbitRadius
      );
      featureOrbitGroup.add(node);
      featureNodes.push(node);
    });

    // Mouse Interaction Handlers
    const onMouseDown = (e) => {
      sceneStateRef.current.isDragging = true;
      sceneStateRef.current.prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      sceneStateRef.current.mouseX = normX;
      sceneStateRef.current.mouseY = normY;

      // Mouse drag rotation
      if (sceneStateRef.current.isDragging) {
        const deltaX = e.clientX - sceneStateRef.current.prevMousePos.x;
        const deltaY = e.clientY - sceneStateRef.current.prevMousePos.y;
        sceneStateRef.current.manualRotY += deltaX * 0.006;
        sceneStateRef.current.manualRotX += deltaY * 0.006;
        sceneStateRef.current.manualRotX = Math.max(-1.2, Math.min(1.2, sceneStateRef.current.manualRotX));
        sceneStateRef.current.prevMousePos = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseUp = () => {
      sceneStateRef.current.isDragging = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      sceneStateRef.current.zoomDist += e.deltaY * 0.01;
      sceneStateRef.current.zoomDist = Math.max(8, Math.min(24, sceneStateRef.current.zoomDist));
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // Handle Window Resize
    const onResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', onResize);

    // 7. 60 FPS Render Loop with Physics & Lerp Camera Motion
    let clock = new THREE.Clock();
    let animId;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();
      const state = sceneStateRef.current;

      // Update Point Lights to follow mouse softly
      mouseLight.position.x += (state.mouseX * 7 - mouseLight.position.x) * 0.06;
      mouseLight.position.y += (state.mouseY * 5 + 3 - mouseLight.position.y) * 0.06;

      // Rotate Core Jewel & Outer Shell
      jewelMesh.rotation.y += 0.008;
      jewelMesh.rotation.x += 0.004;
      outerWireMesh.rotation.y -= 0.005;
      outerWireMesh.rotation.z += 0.003;
      coreRing.rotation.z += 0.007;
      coreRing2.rotation.z -= 0.005;

      // Floating core bobbing
      coreGroup.position.y = Math.sin(time * 1.5) * 0.25;

      // Rotate Pod Satellites around core
      podMeshes.forEach((pod, i) => {
        const podAngle = time * 0.4 + (i * Math.PI) / 2;
        const pRadius = 3.6;
        pod.position.set(
          Math.cos(podAngle) * pRadius,
          Math.sin(time * 2 + i) * 0.4,
          Math.sin(podAngle) * pRadius
        );
        pod.rotation.y += 0.02;
        pod.rotation.x += 0.01;
      });

      // Slowly rotate starfield
      starField.rotation.y = time * 0.015;

      // Orbit features rotation
      if (state.isPlaying) {
        state.rotationAngle += 0.004;
      }
      featureOrbitGroup.rotation.y = state.rotationAngle + state.manualRotY;
      featureOrbitGroup.rotation.x = state.manualRotX;

      // Pulse feature node scale
      featureNodes.forEach((node, i) => {
        const isCurrent = i === state.activeIdx;
        const targetScale = isCurrent ? 1.6 : 1.0;
        node.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
      });

      // Smooth Camera Positioning & Damping
      if (state.cameraMode === 'spotlight') {
        const targetAngle = -(state.activeIdx / FEATURES_DATA.length) * Math.PI * 2 - featureOrbitGroup.rotation.y;
        const camTargetX = Math.sin(targetAngle) * (state.zoomDist * 0.7);
        const camTargetZ = Math.cos(targetAngle) * (state.zoomDist * 0.7);
        camera.position.x += (camTargetX - camera.position.x) * 0.05;
        camera.position.z += (camTargetZ - camera.position.z) * 0.05;
        camera.position.y += (2.2 - camera.position.y) * 0.05;
      } else {
        // Orbit mode with gentle mouse tilt
        const camTargetX = Math.sin(state.mouseX * 0.6) * 4;
        const camTargetY = 3.5 + state.mouseY * 2.5;
        const camTargetZ = state.zoomDist;
        camera.position.x += (camTargetX - camera.position.x) * 0.06;
        camera.position.y += (camTargetY - camera.position.y) * 0.06;
        camera.position.z += (camTargetZ - camera.position.z) * 0.06;
      }
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup on component unmount
    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const activeFeature = FEATURES_DATA[activeFeatureIdx];

  const handleNext = () => {
    setActiveFeatureIdx((prev) => (prev + 1) % FEATURES_DATA.length);
  };

  const handlePrev = () => {
    setActiveFeatureIdx((prev) => (prev - 1 + FEATURES_DATA.length) % FEATURES_DATA.length);
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: 'calc(100vh - 110px)',
        minHeight: '680px',
        background: '#07090e',
        borderRadius: '18px',
        overflow: 'hidden',
        boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        color: '#f8fafc',
        fontFamily: "'Plus Jakarta Sans', sans-serif"
      }}
    >
      {/* 1. Full-Canvas Interactive Three.js WebGL Mount */}
      <div
        ref={mountRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          cursor: 'grab',
          zIndex: 1
        }}
        title="Click & Drag to Orbit 360° • Scroll to Zoom"
      />

      {/* 2. Top Holographic HUD Status Bar */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '24px',
          right: '24px',
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none'
        }}
      >
        <div style={{ pointerEvents: 'auto' }}>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                background: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(59, 130, 246, 0.35)',
                borderRadius: '100px',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#93c5fd',
                letterSpacing: '0.04em'
              }}
            >
              <Sparkles size={12} color="#60a5fa" />
              REALISTIC 3D WEBGL ENGINE • 60 FPS
            </span>
            <span className="badge bg-success-subtle text-success border border-success-subtle d-none d-md-inline-block" style={{ fontSize: '0.7rem' }}>
              PBR Specular Shading
            </span>
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#ffffff' }}>
            Interactive Spatial Architecture
          </h2>
          <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
            Click & drag to rotate 360° in real 3D space • Mouse scroll to zoom
          </div>
        </div>

        {/* 3D Camera & Control Toolbar */}
        <div
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: '6px 10px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="btn btn-sm text-white d-flex align-items-center gap-1.5"
            style={{ fontSize: '0.75rem', fontWeight: 600, background: 'rgba(255, 255, 255, 0.08)', borderRadius: '8px' }}
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
            {isPlaying ? 'Pause Orbit' : 'Resume'}
          </button>

          <button
            onClick={() => setCameraMode(cameraMode === 'spotlight' ? 'orbit' : 'spotlight')}
            className={`btn btn-sm d-flex align-items-center gap-1.5 ${cameraMode === 'spotlight' ? 'btn-primary' : 'text-white'}`}
            style={{ fontSize: '0.75rem', fontWeight: 600, borderRadius: '8px', background: cameraMode === 'spotlight' ? '#2563eb' : 'rgba(255, 255, 255, 0.08)' }}
          >
            <Compass size={13} />
            {cameraMode === 'spotlight' ? 'Spotlight View' : 'Free Orbit'}
          </button>

          <Link
            to="/roster"
            className="btn btn-sm btn-outline-light d-none d-sm-inline-flex align-items-center gap-1"
            style={{ fontSize: '0.75rem', borderRadius: '8px' }}
          >
            Roster Matrix <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>

      {/* 3. Floating Holographic Feature Spotlight Card (Bottom-Left) */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '24px',
          width: '460px',
          maxWidth: 'calc(100vw - 48px)',
          zIndex: 10,
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.88) 0%, rgba(30, 41, 59, 0.82) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: '18px',
          border: `1px solid ${activeFeature.accent}66`,
          boxShadow: `0 20px 50px -10px ${activeFeature.accent}33, 0 0 30px rgba(0, 0, 0, 0.7)`,
          padding: '1.5rem',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="d-flex align-items-center gap-2">
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: activeFeature.accent,
                boxShadow: `0 0 8px ${activeFeature.accent}`
              }}
            />
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.08em' }}>
              {activeFeature.category}
            </span>
          </div>
          <span
            style={{
              background: `${activeFeature.tagColor}18`,
              border: `1px solid ${activeFeature.tagColor}44`,
              color: activeFeature.tagColor,
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '100px'
            }}
          >
            {activeFeature.tag}
          </span>
        </div>

        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: '0 0 4px 0' }}>
          {activeFeature.title}
        </h3>
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: activeFeature.accent, marginBottom: '0.6rem' }}>
          {activeFeature.headline}
        </div>
        <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.45, marginBottom: '0.85rem' }}>
          {activeFeature.description}
        </p>

        {/* 4 Stat KPIs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '6px',
            background: 'rgba(0, 0, 0, 0.35)',
            padding: '8px 10px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            marginBottom: '0.85rem',
            textAlign: 'center'
          }}
        >
          {activeFeature.stats.map((st, i) => (
            <div key={i}>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc' }}>
                {st.val}
              </div>
              <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 500 }}>
                {st.lbl}
              </div>
            </div>
          ))}
        </div>

        {/* Action Controls & Navigation */}
        <div className="d-flex justify-content-between align-items-center pt-2 border-top border-secondary border-opacity-25">
          <div className="d-flex align-items-center gap-1">
            <button
              onClick={handlePrev}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                borderRadius: '8px',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Previous Feature Node"
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', padding: '0 8px' }}>
              {activeFeatureIdx + 1} / {FEATURES_DATA.length}
            </span>
            <button
              onClick={handleNext}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                borderRadius: '8px',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Next Feature Node"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <Link
            to={activeFeature.route}
            className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1.5"
            style={{
              backgroundColor: activeFeature.accent,
              borderColor: activeFeature.accent,
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '5px 12px',
              borderRadius: '8px'
            }}
          >
            Launch Feature <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* 4. Bottom-Right Feature Quick Selector Pills */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          right: '24px',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          alignItems: 'flex-end',
          pointerEvents: 'none'
        }}
      >
        <div
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: '8px',
            borderRadius: '14px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          {FEATURES_DATA.map((feat, idx) => {
            const isCurrent = activeFeatureIdx === idx;
            return (
              <button
                key={feat.id}
                onClick={() => setActiveFeatureIdx(idx)}
                style={{
                  background: isCurrent ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                  border: isCurrent ? `1px solid ${feat.accent}88` : '1px solid transparent',
                  color: isCurrent ? '#ffffff' : '#94a3b8',
                  borderRadius: '8px',
                  padding: '5px 12px',
                  fontSize: '0.72rem',
                  fontWeight: isCurrent ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  width: '180px'
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: isCurrent ? feat.accent : 'rgba(255, 255, 255, 0.3)',
                    boxShadow: isCurrent ? `0 0 6px ${feat.accent}` : 'none'
                  }}
                />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {feat.title.split(' ')[0]} {feat.title.split(' ')[1]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Realistic3DShowreel;
