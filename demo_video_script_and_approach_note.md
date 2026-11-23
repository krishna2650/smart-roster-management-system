# DataStraw Smart Roster Management System
## Submission Deliverables: Approach Note & 3–5 Minute Demo Video Script

---

### Part 1: Official Approach Note
*(Copy and paste this into your submission email and GitHub README)*

> **Solution & Architecture Approach Note:**
> 
> We solved DataStraw's workforce scheduling challenge by modeling operational relationships as decoupled, first-class entities in MongoDB and developing a deterministic, rule-based constraint satisfaction engine in Python 3.13. 
> 
> The system addresses the asymmetrical reality of D2C operations: differentiating between **single-resource brands** (~80% of accounts where a single dedicated specialist manages Customer Support, Abandoned Cart, and NDR as an integrated shift) and **multi-employee brands** with process specialization. The engine rigorously enforces three divergent client operating calendar models (365-day continuous, daily excluding holidays, and Monday–Saturday excluding Sundays/holidays), tracks leave availability to prevent double-booking, and guarantees fair weekly off rotation. 
> 
> To safeguard client SLAs, the platform implements pre-publish validation gates (Rule 10: never silently publish an invalid roster), a live Conflict Center with algorithmic candidate relief ranking based on pod affiliation and skill suitability ($10 + 50 \times \text{SamePod} + 25 \times \text{Skills}$), a fatigue and burnout streak detector ($>6$ consecutive days), and an in-place Change Management engine that resolves unplanned disruptions without rebuilding the entire monthly roster.

---

### Part 2: 3–5 Minute Demo Video Script & Click-by-Click Guide

Record using **Loom**, **OBS Studio**, or the built-in Windows screen recorder (**`Win + Alt + R`**). Keep both `http://localhost:3000` open in Chrome and your microphone active.

---

#### 🎬 Scene 1: Introduction & Executive Telemetry (0:00 – 0:45)
* **Screen:** Open **[http://localhost:3000](http://localhost:3000)** (Executive Dashboard).
* **What to do on screen:** Hover over the KPI cards (*32 Specialists, 12 Brands, 4 Pods, 35 Processes*), scroll down slightly to show the Pod Distribution bar chart and Shift Breakdown pie chart.
* **What to say:**
  > *"Hello DataStraw team! Today I am presenting the Smart Roster Management System, built specifically to tackle complex multi-brand D2C customer operations. 
  > 
  > As you can see on our Executive Dashboard, our central database manages 32 active specialists distributed across 4 operational pods—Alpha, Beta, Gamma, and Delta—supporting 12 client brands. We have live telemetry tracking active coverage, upcoming public holidays, and pod allocations."*

---

#### 🎬 Scene 2: Brand Operating Calendars & Asymmetry (0:45 – 1:30)
* **Screen:** Click on **Brands** in the sidebar ([http://localhost:3000/brands](http://localhost:3000/brands)).
* **What to do on screen:** Point out **EcoGlow** (highlighting the `365_DAYS` badge) and **VoltTech** or **SnackNation** (`MON_SAT_EXCLUDING_HOLIDAYS`).
* **What to say:**
  > *"One of the primary challenges outlined in the assessment is calendar asymmetry. 
  > 
  > Here in the Brands directory, you can see accounts like EcoGlow, which operate 365 days a year with zero tolerance for downtime, while others operate Monday through Saturday excluding public holidays. Furthermore, roughly 80% of our accounts are single-resource brands where one specialist handles Customer Support, Abandoned Cart, and NDR as an integrated shift, while the remaining 20% feature multi-employee process specialization."*

---

#### 🎬 Scene 3: Deterministic Roster Generation & 5 Perspectives (1:30 – 2:30)
* **Screen:** Click on **Roster Engine** in the sidebar ([http://localhost:3000/roster](http://localhost:3000/roster)).
* **What to do on screen:** 
  1. Select **December 2026** in the top dropdowns.
  2. Click the **"Generate"** button (watch it complete in under 1 second with 100% coverage).
  3. Click through the view tabs on top of the matrix:
     * **Company View:** Show full 32-specialist grid.
     * **Pod View:** Select *Alpha Pod* from the dropdown.
     * **Brand View:** Show *EcoGlow* and *VoltTech* process breakdown.
     * **Employee View:** Select *Rahul Verma* to show his individual calendar.
* **What to say:**
  > *"Now let's look at the Roster Engine. By clicking 'Generate', our Python constraint engine deterministically allocates over 1,000 monthly shifts in milliseconds, satisfying all 10 scheduling constraints including approved leaves, minimum headcounts, and rotating rest days.
  > 
  > Stakeholders can inspect the schedule from 5 distinct perspectives: Company-wide, Pod-specific, Brand requirements, Process SLA breakdown, or individual specialist views."*

---

#### 🎬 Scene 4: Change Management & Emergency Disruption (2:30 – 3:30)
* **Screen:** Click on **Change Management** in the sidebar ([http://localhost:3000/change-workflow](http://localhost:3000/change-workflow)).
* **What to do on screen:**
  1. Click **Step 1: Generate Baseline Schedule**.
  2. Click **Step 2: Simulate Emergency Leave (Rahul Verma on Dec 15)**.
  3. Click **Step 3: Detect Critical Coverage Gap** (Point out EcoGlow showing red gap).
  4. Click **Step 4: Algorithmic Candidate Ranking** (Show *Priya Sharma* ranked #1 with 50 same-pod bonus).
  5. Click **Step 5: Assign Relief & Revalidate** (Watch coverage restore to 100%).
* **What to say:**
  > *"Real-world operations face disruptions. In our Change Management simulator, we simulate our dedicated specialist Rahul Verma taking an emergency sick leave on December 15. 
  > 
  > Because EcoGlow is a 365-day brand, the system immediately flags a CRITICAL coverage gap across CS, ACC, and NDR. Crucially, the manager does not need to rebuild the entire month manually. The system runs our candidate ranking algorithm—giving preference to same-pod specialists with matching skill sets—and with one click, Priya Sharma is assigned as relief, patching the schedule in-place and restoring 100% SLA compliance."*

---

#### 🎬 Scene 5: Shift Swap Marketplace, Fatigue Guardrail & Wrap-up (3:30 – 4:15)
* **Screen:** Go back to **Roster Engine** ([http://localhost:3000/roster](http://localhost:3000/roster)).
* **What to do on screen:**
  1. Click **"Swap Shifts"** in the top toolbar.
  2. Click **"Run Algorithmic Pre-Validation"** to show all 5 green checkmarks (Existence, Collision, Leave, Skill, Fatigue).
  3. Close modal and click the **Fatigue Alert badge** to show the Burnout Guardrail ($>6$ consecutive days streak monitoring).
  4. Click the floating **AI Chatbot** in the bottom-right corner and ask: *"Who is the lead for Alpha Pod?"*.
* **What to say:**
  > *"Finally, we engineered two enterprise capabilities: a Peer-to-Peer Shift Swap Marketplace with 5-stage automated safety pre-validation, and an algorithmic Fatigue Guardrail enforcing a maximum 6-consecutive-day streak policy to prevent burnout. 
  > 
  > With 51 out of 51 automated tests passing and a full REST API, the system is fully production-ready. Thank you!"*

---

### Part 3: Quick Checklist Before Submitting

- [x] Backend running on `http://127.0.0.1:5000` (Python Flask + PyMongo).
- [x] Frontend running on `http://localhost:3000` (React 18 + Vite).
- [x] 51/51 automated integration tests passing (`verify_all_features.py`).
- [x] 18/18 unit tests passing (`backend/tests/`).
- [x] Clean Git commit history (`660cf54`).
- [x] Record 3–5 min video using Loom or Windows screen recorder following the script above.
- [x] Paste the video link into the email template and send to:
  * **To:** `ozair.shaikh@datastraw.in`, `aryan.jaiswal@datastraw.in`
  * **CC:** `talent@datastraw.in`
