import os
import subprocess
import shutil

html_content = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>DataStraw Smart Roster Management System - Features Factsheet</title>
<style>
  @page {
    size: A4;
    margin: 12mm 14mm 12mm 14mm;
    @bottom-right {
      content: counter(page);
      font-size: 8pt;
      color: #64748b;
    }
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    line-height: 1.45;
    font-size: 8.8pt;
    margin: 0;
    padding: 0;
    background: #ffffff;
  }

  .header-banner {
    background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
    color: #ffffff;
    padding: 16px 20px;
    border-radius: 8px;
    margin-bottom: 14px;
  }

  .header-banner h1 {
    font-size: 16.5pt;
    font-weight: 800;
    margin: 0 0 3px 0;
    letter-spacing: -0.3px;
  }

  .header-banner p {
    margin: 0;
    font-size: 9pt;
    color: #93c5fd;
    font-weight: 500;
  }

  .meta-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
  }

  .meta-pill {
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.25);
    color: #ffffff;
    font-size: 7.5pt;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 4px;
  }

  .feature-category {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 10px 14px;
    margin-bottom: 11px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    page-break-inside: avoid;
  }

  .category-title {
    font-size: 10.5pt;
    font-weight: 800;
    color: #0f172a;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0 0 7px 0;
    padding-bottom: 4px;
    border-bottom: 1.5px solid #2563eb;
  }

  .feature-item {
    margin-bottom: 6px;
  }

  .feature-item:last-child {
    margin-bottom: 0;
  }

  .feature-name {
    font-size: 8.8pt;
    font-weight: 700;
    color: #1e3a8a;
    display: inline-block;
    margin-bottom: 2px;
  }

  ul.bullets {
    margin: 2px 0 5px 16px;
    padding: 0;
  }

  ul.bullets li {
    font-size: 8.3pt;
    color: #334155;
    margin-bottom: 2px;
    line-height: 1.35;
  }

  ul.bullets li strong {
    color: #0f172a;
  }

  .tag {
    display: inline-block;
    font-size: 7pt;
    font-weight: 700;
    padding: 1px 5px;
    border-radius: 3px;
    vertical-align: middle;
  }

  .tag-core { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
  .tag-bonus { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
  .tag-ai { background: #ede9fe; color: #5b21b6; border: 1px solid #ddd6fe; }

  .two-col-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .footer-bar {
    margin-top: 10px;
    padding-top: 6px;
    border-top: 1px solid #cbd5e1;
    display: flex;
    justify-content: space-between;
    font-size: 7.5pt;
    color: #64748b;
  }
</style>
</head>
<body>

  <!-- HEADER -->
  <div class="header-banner">
    <h1>DataStraw Smart Roster Management System</h1>
    <p>Comprehensive Feature Factsheet • High-Level Architecture & Capabilities</p>
    <div class="meta-pills">
      <span class="meta-pill">Live Application: smart-roster-management-system-1-bfo5.onrender.com</span>
      <span class="meta-pill">GitHub: krishna2650/smart-roster-management-system</span>
      <span class="meta-pill">Scale: 32 Specialists • 12 Brands • 4 Pods • 35 Processes</span>
      <span class="meta-pill">Test Verification: 18/18 Unit Tests • 51/51 Integration Tests Passed</span>
    </div>
  </div>

  <!-- CATEGORY 1: CORE ROSTER & SCHEDULING ENGINE -->
  <div class="feature-category">
    <div class="category-title">
      <span>1. Deterministic Roster Engine & Multi-Perspective Matrix</span>
      <span class="tag tag-core">CORE SCHEDULING</span>
    </div>
    
    <div class="two-col-grid">
      <div class="feature-item">
        <div class="feature-name">Deterministic Monthly Solver</div>
        <ul class="bullets">
          <li><strong>Sub-Second Generation:</strong> Calculates 1,000+ monthly shift assignments in &lt;1 second.</li>
          <li><strong>Operating Calendar Enforcement:</strong> Evaluates <code>365_DAYS</code>, <code>DAILY_EXCLUDING_HOLIDAYS</code>, and <code>MON_SAT_EXCLUDING_HOLIDAYS</code>.</li>
          <li><strong>Distinguishes SLA from Staff Schedule:</strong> Separate brand operational rules from individual specialist working days.</li>
          <li><strong>Mathematical Coverage Reconciler:</strong> Calculates exact coverage (99.0% with test gaps; 100.0% when relief assigned).</li>
        </ul>
      </div>

      <div class="feature-item">
        <div class="feature-name">5 Stakeholder Perspective Views</div>
        <ul class="bullets">
          <li><strong>Company-Wide View:</strong> Enterprise monthly matrix spanning all operational pods.</li>
          <li><strong>Pod-Wise View:</strong> Filter schedules by Alpha, Beta, Gamma, or Delta Pod.</li>
          <li><strong>Brand-Wise View:</strong> Monitor daily coverage and staffing levels per client account.</li>
          <li><strong>Process-Wise View:</strong> Staffing breakdown for CS, Abandoned Cart, NDR, and Retention.</li>
          <li><strong>Employee-Wise View:</strong> Personalized calendar of working shifts, rest days, and leaves.</li>
        </ul>
      </div>
    </div>

    <div class="two-col-grid" style="margin-top: 6px;">
      <div class="feature-item">
        <div class="feature-name">Interactive Cell Click Shift Editor</div>
        <ul class="bullets">
          <li><strong>1-Click Status Toggling:</strong> Click any cell to assign Working (W), Weekly Off (WO), Leave (LV), or Holiday (HD).</li>
          <li><strong>Instant Re-Validation:</strong> Automatically recalculates coverage and conflict counts on every change.</li>
        </ul>
      </div>

      <div class="feature-item">
        <div class="feature-name">Real-Time Telemetry & Live Clock</div>
        <ul class="bullets">
          <li><strong>Dynamic 'TODAY' Marker:</strong> Highlights the live calendar date with a blue badge and accent border.</li>
          <li><strong>Live Ticking Clock:</strong> 1-second interval timer updating seconds live (1, 2, 3...) with tabular numbers.</li>
          <li><strong>Background Database Polling:</strong> Auto-synchronizes live roster metrics every 15 seconds.</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- CATEGORY 2: WORKFORCE & BRAND STRUCTURE -->
  <div class="feature-category">
    <div class="category-title">
      <span>2. Workforce Structure & ~80% Single-Resource Rule</span>
      <span class="tag tag-core">ORGANIZATION</span>
    </div>
    
    <div class="two-col-grid">
      <div class="feature-item">
        <div class="feature-name">~80% Single-Resource Brands (83.3%)</div>
        <ul class="bullets">
          <li><strong>10 of 12 Brands (83.3%):</strong> Managed by a single dedicated employee owning all processes (EcoGlow, PureSkin, Velvet Thread, etc.).</li>
          <li>Absence of a dedicated specialist triggers an immediate high-priority SLA gap warning.</li>
        </ul>
      </div>

      <div class="feature-item">
        <div class="feature-name">Multi-Resource Brands (16.7%)</div>
        <ul class="bullets">
          <li><strong>2 of 12 Brands (16.7%):</strong> Staffed by teams of 3 specialists (VoltTech & Zenith).</li>
          <li>Models process specialization (Priya on CS, Amit on ACC, Sneha on NDR) and shared shifts.</li>
        </ul>
      </div>
    </div>

    <div class="two-col-grid" style="margin-top: 6px;">
      <div class="feature-item">
        <div class="feature-name">32-Specialist Headcount Reconciliation</div>
        <ul class="bullets">
          <li><strong>16 Primary Brand Specialists:</strong> Directly assigned to brand operational processes.</li>
          <li><strong>16 Pod Relief Specialists:</strong> Reserve capacity providing leave and off-day cover.</li>
          <li><strong>100% Accounted Daily Status:</strong> 24 Working + 4 Off + 4 Leave = 32 Specialists.</li>
        </ul>
      </div>

      <div class="feature-item">
        <div class="feature-name">Central Database & Decoupled Assignments</div>
        <ul class="bullets">
          <li>Normalized MongoDB architecture connecting Employees, Brands, Processes, Pods, and Shifts.</li>
          <li>Full CRUD interfaces to add, edit, or reassign resources without code changes.</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- CATEGORY 3: CONFLICT DETECTION & CHANGE MANAGEMENT -->
  <div class="feature-category">
    <div class="category-title">
      <span>3. Conflict Detection Center & Change Management Workflow</span>
      <span class="tag tag-core">INTELLIGENCE</span>
    </div>
    
    <div class="two-col-grid">
      <div class="feature-item">
        <div class="feature-name">Conflict Detection Center (/conflicts)</div>
        <ul class="bullets">
          <li><strong>Multi-Level Severity:</strong> Classifies gaps into CRITICAL, HIGH, and MEDIUM tiers.</li>
          <li><strong>Hard vs. Soft Constraints:</strong> Distinguishes client SLAs from employee preferences.</li>
          <li><strong>Comprehensive Detection:</strong> Flags unstaffed shifts, leave conflicts, and double-booking.</li>
          <li><strong>Strict Publish Block:</strong> Rosters with critical gaps remain locked in DRAFT status.</li>
        </ul>
      </div>

      <div class="feature-item">
        <div class="feature-name">Intelligent Backup Reassignment Engine</div>
        <ul class="bullets">
          <li><strong>Automated Candidate Ranking:</strong> Ranks available relief specialists for any unstaffed gap.</li>
          <li><strong>Scoring Model:</strong> Pod Affinity (50 pts) + Skill Match (30 pts) + Low Fatigue (20 pts).</li>
          <li><strong>1-Click Relief Reassignment:</strong> Immediately deploys relief and restores coverage to 100%.</li>
        </ul>
      </div>
    </div>

    <div class="feature-item" style="margin-top: 6px;">
      <div class="feature-name">Post-Generation Change Simulator (/change-workflow)</div>
      <ul class="bullets">
        <li>Simulates mid-month employee leave requests and displays the ripple effect on brand coverage.</li>
        <li>Evaluates whether multi-resource teams can absorb single absences without external cover.</li>
      </ul>
    </div>
  </div>

  <!-- CATEGORY 4: ENTERPRISE & BONUS ADDITIONS -->
  <div class="feature-category">
    <div class="category-title">
      <span>4. Enterprise Capabilities & Beyond-the-Basics Additions</span>
      <span class="tag tag-bonus">BONUS FEATURES</span>
    </div>
    
    <div class="two-col-grid">
      <div class="feature-item">
        <div class="feature-name">AI Assistant <span class="tag tag-ai">AI COPILOT</span></div>
        <ul class="bullets">
          <li><strong>Floating Pill Launcher:</strong> Elevated button with gold sparkles and live pulsing green indicator.</li>
          <li><strong>Natural Language Queries:</strong> Real-time database query engine answering questions on employee allocations, operating rules, conflicts, and coverage metrics.</li>
        </ul>
      </div>

      <div class="feature-item">
        <div class="feature-name">Peer-to-Peer Shift Swap Marketplace</div>
        <ul class="bullets">
          <li>Allows specialists to propose and exchange shifts peer-to-peer.</li>
          <li><strong>5-Stage Algorithmic Pre-Validation:</strong> Validates shift existence, double-booking, leaves, skill qualifications, and continuous fatigue streaks.</li>
        </ul>
      </div>
    </div>

    <div class="two-col-grid" style="margin-top: 6px;">
      <div class="feature-item">
        <div class="feature-name">Fatigue & Burnout Guardrail</div>
        <ul class="bullets">
          <li>Evaluates continuous working streaks across all 32 operational specialists.</li>
          <li>Proactively flags specialists working &gt;6 consecutive days without a mandatory rest day.</li>
        </ul>
      </div>

      <div class="feature-item">
        <div class="feature-name">RBAC, Typography & Data Exports</div>
        <ul class="bullets">
          <li><strong>1-Click Role Switcher:</strong> Switch between Admin, Operations Manager, and Pod Lead.</li>
          <li><strong>CSV Data Exports (/reports):</strong> 1-click export of monthly rosters for payroll and audits.</li>
          <li><strong>Modern Typography:</strong> Paired <code>Inter</code> (data/tables) with <code>DM Sans</code> (headings).</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer-bar">
    <div>DataStraw Smart Roster Management System • Executive Feature Factsheet</div>
    <div>Live URL: smart-roster-management-system-1-bfo5.onrender.com • GitHub: krishna2650/smart-roster-management-system</div>
  </div>

</body>
</html>
"""

html_path = r"c:\Problem statement\features_summary.html"
pdf_path = r"c:\Problem statement\DataStraw_Smart_Roster_System_Features.pdf"
artifact_path = r"C:\Users\Priyanka\.gemini\antigravity\brain\ab16e695-7324-480b-848d-41d2fb524eac\DataStraw_Smart_Roster_System_Features.pdf"

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"HTML generated at: {html_path}")

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
cmd = [
    edge_path,
    "--headless",
    "--no-sandbox",
    "--disable-gpu",
    f"--print-to-pdf={pdf_path}",
    html_path
]

res = subprocess.run(cmd, capture_output=True, text=True)
print("Edge return code:", res.returncode)

if os.path.exists(pdf_path):
    size_kb = os.path.getsize(pdf_path) / 1024
    print(f"SUCCESS: PDF generated at: {pdf_path} ({size_kb:.1f} KB)")
    shutil.copyfile(pdf_path, artifact_path)
    print(f"Copied to artifact directory: {artifact_path}")
else:
    print("PDF generation failed:", res.stderr)
