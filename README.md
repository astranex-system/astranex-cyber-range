# ASTRANEX CYBER RANGE

> **Tagline:** "Investigate. Exploit. Defend."
> **AstraNex Defence** — Technical Assessment Platform

AstraNex Cyber Range is a production-ready, story-driven technical assessment platform designed for AstraNex Defence engineering candidates. Rather than taking generic multiple-choice quizzes, candidates investigate a simulated cyber incident involving autonomous UGV **AX-07** ("Operation Blackout") across 8 interconnected stages.

---

## 🛡️ Architecture & Domain Model

The platform features an extensible **Assessment Engine** supporting Cybersecurity, Software Engineering, Robotics, and AI/ML evaluations.

### Key Features
- **Story-Driven Incident Response:** Connected progression where evidence from earlier stages is required for subsequent stages.
- **Server-Authoritative Timer:** 90-minute countdown enforced on the backend with automatic assessment lockdown upon expiration.
- **Server-Side Flag Hashing & Validation:** Flags are SHA-256 hashed and verified server-side with strict rate limiting to prevent brute-forcing.
- **Graduated Hint System:** Progressive hints with score penalty deductions (100% → 90% → 75% → 50%).
- **Interactive Forensics Tools:** Integrated browser Log Viewer (`auth.log`, `gateway.log`, `telemetry.log`, `command.log`, `system.log`), PCAP Packet Inspector (`ax07_capture.pcap`), and Base64 De-obfuscator tool.
- **Isolated Code Sandbox:** Stage 7 Secure Coding executes candidate Python code in a safe isolated test runner against 10 hidden pytest cases.
- **11-Field Incident Report:** Structured Incident Response Report for candidate documentation and manual admin scoring console.
- **Admin Portal & Analytics:** Dashboard metrics, candidate stage breakdown, manual report review & scoring console, score-based leaderboard, and CSV/JSON export.

---

## 📁 Repository Structure

```
astranex-cyber-range/
├── apps/
│   ├── api/               # FastAPI backend (SQLAlchemy ORM, Pydantic, JWT Auth, Pytest)
│   └── web/               # Next.js 14 App Router (TypeScript, Tailwind CSS, Defence HUD theme)
├── challenges/
│   └── operation-blackout/
│       ├── stage-4/       # Log files (auth, gateway, telemetry, command, system)
│       ├── stage-5/       # Synthetic PCAP & parsed JSON streams
│       ├── stage-6/       # Safe malware script (telemetry_update.sh)
│       └── stage-7/       # Vulnerable python auth code & test runner
├── infrastructure/
│   └── docker-compose.yml # Container orchestration
├── seed.py                # Database seed script for Operation Blackout & accounts
└── README.md
```

---

## 🚀 Quickstart (Local Development)

### 1. Database & Backend API Setup

```bash
# Navigate to API app
cd apps/api

# Activate Virtual Environment & Install dependencies
source venv/bin/activate
pip install -r requirements.txt

# Run Database Seed Script
python ../../seed.py

# Start FastAPI server on port 8000
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Web App Setup

```bash
# Navigate to Web app
cd apps/web

# Install dependencies
npm install

# Start Next.js development server on port 3000
npm run dev
```

---

## 🔑 Default Accounts

| Role | Email | Password | Portal Link |
| :--- | :--- | :--- | :--- |
| **Candidate** | `candidate@astranex.defence` | `candidate123` | `/login` → `/assessment` |
| **Admin** | `admin@astranex.defence` | `admin123` | `/login` → `/admin` |

---

## 🧪 Running Automated Tests

```bash
# Run backend pytest suite
/Users/milanjyotiray/astranex-cyber-range/apps/api/venv/bin/pytest apps/api/tests/test_api.py -v
```

---

## 📊 Scoring & Distribution

Total Assessment Points: **100 PTS**

| Stage | Domain | Max Points |
| :--- | :--- | :--- |
| Stage 0 | Mission Briefing | 0 PTS |
| Stage 1 | Reconnaissance | 10 PTS |
| Stage 2 | Telemetry API Investigation | 15 PTS |
| Stage 3 | Authentication & Authorization | 15 PTS |
| Stage 4 | Log Forensics | 15 PTS |
| Stage 5 | Network Investigation | 15 PTS |
| Stage 6 | Malware / File Analysis | 10 PTS |
| Stage 7 | Secure the System (Secure Coding) | 10 PTS |
| Stage 8 | Final Incident Report | 10 PTS |
