# DigiSanduk – Secure Data Sharing Platform

Modern FastAPI + React application for inter-organization threat-intelligence sharing with granular trust controls, auditing, and optional SIEM forwarding.

## At a Glance
- **Frontend:** React (Vite) + Tailwind, Axios, protected routes, role-aware UI, navy/gold theme, glowing DigiSanduk branding.
- **Backend:** FastAPI, SQLAlchemy, JWT auth, role/organization scoping, audit hooks, Splunk HEC integration.
- **Roles:** Super Admin (platform-wide), Org Admin (per org), Employee.
- **ID format:** All entities display as `DS#<Type>#nnn` (e.g., `DS#Org#001`, `DS#User#014`).
- **Trust model:** Sharing is allowed only when a connection/trust exists between orgs; UI surfaces block reasons.
- **Audit:** Every action (auth, org/user changes, requests, approvals, SIEM ops) is recorded; audit page is super-admin only.
- **SIEM:** Built-in Splunk HEC integration with add/edit/delete + test; app events can be forwarded automatically.
- **MFA:** Settings exposed in the Profile page (per-user).

## Repository Layout
- `backend/` – FastAPI app, database models, routers (auth, org, data, admin, audit, integrations), audit pipeline.
- `frontend/` – React UI, Tailwind theme, routed pages (auth, dashboard, share, requests, admin console, integrations, audit).
- `frontend/public/` – Static assets. Place `logo.png` (sidebar/auth logo) and `favicon.png` (same provided logo) here.

## Prerequisites
- Python 3.10+ (for FastAPI stack)
- Node.js 18+ (for Vite/React)
- SQLite included by default; swap `DATABASE_URL` if using Postgres.
- Optional: Splunk Enterprise/Cloud with HTTP Event Collector (HEC) enabled.

## Quick Start
### 1) Backend (API)
```bash
cd backend
python -m venv venv
./venv/Scripts/activate           # PowerShell: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Environment (create .env if you prefer):
set SECRET_KEY=change-me
set DATABASE_URL=sqlite:///./digisanduk.db
set CORS_ALLOW_ORIGINS=*

uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Seeded super admin: **admin@digisanduk / digisanduk** (auto-created on startup).

### 2) Frontend (Web)
```bash
cd frontend
cp .env.example .env
# edit VITE_API_BASE_URL to your backend, e.g. http://localhost:8000 or your ngrok URL
npm install
npm run dev -- --host --port 5173
```
Drop `logo.png` and `favicon.png` into `frontend/public/`, then open `http://localhost:5173`.

## How It Works (Functional Walkthrough)
### Authentication & Profile
- Email/password with JWT; login fails if the account is disabled.
- Password change requires the current password for verification.
- MFA controls live in the Profile tab.

### Roles & Governance
- **Super Admin:** Create orgs, add users, assign/change org admins, enable/disable users, view audit logs, manage SIEM integrations.
- **Org Admin:** Manage their org’s users (except disabling admins), approve/reject data requests, send encrypted payloads.
- **Employee:** Can request/share data and view inbound shares; cannot manage users.

### Data Sharing Lifecycle
1. Requesting org submits a **data request** (target org, data type, reason).
2. Target org admin sees it in **Approvals** and toggles **Approve/Reject**.
3. When approved, sender can transmit encrypted payloads; can resend until the toggle is switched off (which marks it rejected on the requester side).
4. **Shared With Me** lists inbound payloads for the org (admins and employees see it).
5. Sharing is blocked if no trust/connection exists; UI shows the block reason.

### Connections & Trust
- Super admin (or org admin where allowed) establishes trust/connection between orgs.
- Trust governs whether shares can be initiated; disabling trust blocks further sends.

### Audit Logging
- Every critical action (auth, CRUD on org/users, requests, approvals, payload sends, SIEM config/tests) is logged.
- Audit page is visible only to the super admin; entries can also be forwarded to SIEM.

### SIEM Integration (Splunk HEC)
1. In Splunk, enable HEC, create a token, and note the index (e.g., `history`) and endpoint `https://<splunk-host>:8088/services/collector/event`.
2. In **Integrations**, add the HEC URL, token, optional index/sourcetype, and **Test**. A `SIEM_TEST` event is sent.
3. On success, app events (audits, shares, approvals) can be auto-forwarded to Splunk.
4. Search in Splunk: `index=history sourcetype=httpEvent` (or your sourcetype) to see events.

## Theming & Branding
- Dark navy base with gold accents (inspired by provided poster); glowing **DigiSanduk** wordmark.
- Orb background moved down to avoid logo collision.
- Custom neon/glass UI toggles for user enable/disable in Team view.

## Troubleshooting
- **401 on login from another device:** Verify correct API base URL, valid credentials, and that the user is not disabled.
- **Splunk test fails (connection refused):** Ensure HEC is enabled, correct port (8088), protocol (http/https), and firewall open.
- **No metrics for employees:** Expected; metrics are hidden for non-admins.
- **Logos not showing:** Confirm `frontend/public/logo.png` and `favicon.png` exist and restart `npm run dev`.

## Applications
- Secure inter-org threat intel sharing with approvals and traceability.
- Enforced trust relationships before any data movement.
- Complete auditability for compliance; optional SIEM forwarding for SOC visibility.
- Role-segmented operations for multi-tenant environments (super admin vs org admins vs employees).

---
Feel free to adapt sections for your GitHub page; this README covers both backend and frontend so the repo can be cloned and run end-to-end.
