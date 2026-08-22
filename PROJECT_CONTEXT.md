# JULS Barangay Management System - Project Context

## Overview

JULS is a barangay management system for handling resident records, user accounts, eligibility forms, eligibility entries, dashboard statistics, and database backup/restore operations. The application is split into a React + Vite frontend and a Node.js + Express backend backed by MySQL/MariaDB.

- Updated: 2026-08-20
- Version: v3.0
- Database file: barangay.sql
- Backend port: 5000
- Frontend dev server: 5173

---

## Current System Status

The project is a functionally complete full-stack system with the following capabilities:

- JWT-based authentication with forced password-change handling
- Role-based frontend route protection for Admin and Staff users
- Admin/staff user management
- Resident CRUD and bulk import workflows (preview → confirm)
- Eligibility form management with archive/restore/delete flow
- Eligibility entry management and archived-form views
- Dashboard statistics and recent activity feed
- Database backup and restore, hardened with re-authentication, two-step backup flow, browser-aware save handling, and post-restore count validation
- Activity logging for key operations

## Recent Implementation Updates

Most recent work addressed professor feedback on the database backup/restore feature:

- **Backup** — Converted from a single GET-style action to `POST` with bcrypt re-authentication (matching restore's existing security pattern). Split into two calls: `/api/backup/summary` (re-auths and returns current record counts) followed by `/api/backup/download` (re-auths again and streams the actual `mysqldump` output). Save handling is browser-aware: `window.showSaveFilePicker()` is used on Chrome/Edge/Opera, whose promise only resolves after the user confirms the native save dialog (a genuine completion signal); Firefox/Safari fall back to an `<a download>` click, with snackbar messaging that avoids claiming the save is complete since there's no way to confirm it client-side.
- **Restore** — `/api/backup/restore` re-verifies admin credentials, pipes the uploaded `.sql` file into the `mysql` CLI, and returns post-restore record counts. Because a forced logout/redirect happens immediately after a successful restore, the result snackbar is handed off via `sessionStorage` (`postRestoreNotice`) and displayed by `LoginPage.jsx` after the reload — `localStorage` can't be used since it's cleared as part of the same flow.
- **Count validation** — `utils/parseBackupCounts.js` parses `INSERT` statements character-by-character (tracking string state and paren depth, so commas/parens inside string literals like `"New York, Makati"` aren't miscounted) to determine how many rows the uploaded backup *file* claims to contain per table. This is compared against actual post-restore `COUNT(*)` results to catch silent data loss from truncated uploads, surfacing per-table mismatches in the response with `severity="warning"`.
- **Shared utility** — `utils/tableCounts.js` centralizes the four-table `COUNT(*)` query so backup summary and restore don't duplicate it.

Earlier completed work (still in effect): shared MUI theme (`palette.primary.main = #002f59`, `textTransform: none`, 8px button radius, 16px dialog radius), MUI v7 Grid regression fixes (flexbox `Box` replacements throughout, since `item`/`xs`/`md` props are silently ignored in v7), consolidated `InfoPopper.jsx` and `ModalLogoBadge.jsx` reusable components, `activity_logs` audit trail, household head normalization (separate `households` table removed — head status now lives on `residents.is_household_head` / `household_member_count`), resident bulk import with preview/confirm flow, and a design consistency audit across ~50+ components.

---

## Architecture

### Frontend

- Framework: React 19
- Build tool: Vite 7
- UI library: Material UI v7 (`@mui/material`, `@mui/icons-material`)
- Data grid: MUI X Data Grid v8
- Date pickers: MUI X Date Pickers v8 (Day.js adapter)
- Routing: React Router v7
- HTTP client: Axios
- Charts: Chart.js 4 (lazy-loaded from CDN in `ResidentStatsModal.jsx`), used alongside Recharts references in stats tooling

### Backend

- Runtime: Node.js
- Framework: Express 5
- Database driver: mysql2 (callback-style queries throughout, not promise-based)
- Auth: JWT (`jsonwebtoken`) + bcryptjs
- File handling: Multer (memory storage for both resident import and backup restore uploads)
- Excel import: `xlsx` package
- Backup/restore: Node `child_process.spawn` wrapping the `mysqldump` / `mysql` CLI binaries, paths configurable via `MYSQLDUMP_PATH` / `MYSQL_PATH` env vars (Windows/XAMPP dev)
- Environment config: dotenv

---

## Main Modules

### 1. Authentication and Access Control

- `controllers/authController.js`
- `controllers/changeDefaultPasswordController.js`
- `middleware/authMiddleware.js` (`verifyToken`, applied per-route, not globally)
- `Reusables/ProtectedRoute.jsx` — client-side JWT decode via `atob` (no signature check; real enforcement is server-side), handles token presence, expiry, forced password-change redirect, and role gating

### 2. User Management

- `controllers/userController.js`, `userAddController.js`, `userEditController.js`, `userDeleteController.js`, `userChangePassController.js`
- List / create / edit / delete accounts, change passwords, Active/Inactive status, temporary password generation (`utils/passwordGenerator.js`, `crypto.randomInt`)

### 3. Resident Management

- `controllers/residentController.js`, `residentAddController.js`, `residentEditController.js`, `residentDeleteController.js`, `residentImportPreviewController.js`, `residentImportConfirmController.js` (plus the older direct-import `residentBulkImportController.js`, kept for backward compatibility)
- `pages/Residents/`, `modals/AddResidentModal.jsx` and related modals
- Resident CRUD, search/filtering, bulk import preview + confirm, household-head tracking fields, duplicate detection on name + birthdate, activity logging on create/update/import

### 4. Eligibility Forms and Entries

- `controllers/AddEligibilityFormController.js`, `EligibilityFormController.js`, `eligibilityFormDeleteController.js` (soft-delete → Archived), `eligibilityFormArchiveController.js` (archived list, restore, permanent delete), `eligibilityFormEntriesController.js`, `eligibilityFormEntriesUpdateController.js`, `eligibilityFormEntriesDeleteController.js`
- `pages/EligibilityForm/`
- Create/manage forms, enable/disable, archive → restore/permanent-delete workflow (admin re-auth required for restore and permanent delete), add/update/delete entries, per-form entry views, dedicated archived-forms page

### 5. Dashboard and Activity Feed

- `controllers/dashboardController.js` (`getDashboardStats`, `getRecentActivity`)
- `pages/DashboardPage.jsx`
- Resident/household/account/form counts, age/gender/civil-status breakdowns, special sector counts, recent records, recent activity feed from `activity_logs`, and the backup/restore action buttons (both gated behind `ReAuthModal`)

### 6. Backup and Restore

- `controllers/databaseBackupController.js` (`getBackupSummary`, `backupDatabase`), `controllers/databaseRestoreController.js` (`restoreDatabase`)
- `routes/backupRoutes.js`
- `utils/tableCounts.js`, `utils/parseBackupCounts.js`
- Admin-only, credential re-auth required for both backup and restore; restore reports per-table expected-vs-actual count mismatches

---

## Current Backend Route Structure

Route groups registered in `server.js`:

- `/api/auth` → `authRoutes.js`
- `/api/users` → `userRoutes.js`, `userAddRoutes.js`, `userEditRoutes.js`, `userDeleteRoutes.js`, `userChangePassRoutes.js`
- `/api/residents` → `residentRoutes.js`, `residentAddRoutes.js`, `residentEditRoutes.js`, `residentDeleteRoutes.js`, `residentBulkImportRoutes.js`
- `/api/eligibility-forms` → `eligibilityFormArchiveRoutes.js`, `eligibilityFormAddRoutes.js`, `eligibilityFormRoutes.js`, `eligibilityFormDeleteRoutes.js`, `eligibilityFormEntriesRoutes.js`, `eligibilityFormEntriesUpdateRoutes.js`, `eligibilityFormEntriesDeleteRoutes.js`
- `/api/dashboard` → `dashboardRoutes.js`
- `/api/backup` → `backupRoutes.js` — `POST /summary`, `POST /download`, `POST /restore` (multipart, `.sql` only, 50MB limit)

Route files are organized by feature with dedicated add/edit/delete/change-password variants for users and residents. Eligibility archive routes are registered before the generic eligibility form routes so `/archived` resolves correctly.

---

## Current Frontend Route Structure

React Router routes (`App.jsx`):

- `/` — Login (public)
- `/ChangePassword` — forced password update (any authenticated role)
- `/Dashboard` — admin-only
- `/Accounts` — admin-only
- `/Residents` — Admin + Staff
- `/Eligibility` — Admin + Staff
- `/Eligibility/Archived` — Admin + Staff (declared **before** `/Eligibility/:formId` so React Router doesn't treat "Archived" as a `formId` param)
- `/Eligibility/:formId` — Admin + Staff (entries view)

---

## Database Context

MySQL/MariaDB database named `barangay` (MariaDB 10.4.32 per current `barangay.sql` dump header).

Core tables:

- `users`
- `residents`
- `eligibility_forms`
- `eligibility_forms_entries`
- `activity_logs`

The `households` table has been removed — household-head status lives directly on `residents` (`is_household_head`, `household_member_count`). Enum columns (e.g. `eligibility_forms.status`, `users.role`) require `ALTER TABLE ... MODIFY COLUMN` before new enum values can be used in `UPDATE`s.

---

## Activity Logging System

`utils/activityLogger.js` writes to `activity_logs` via a fire-and-forget `logActivity()` call — never throws, errors only go to console, so a logging failure never breaks the calling request.

**Placement rule:** `logActivity` must be called inside the innermost `db.query` callback, after `res.json()` has already been sent, and only on the success branch — never outside callbacks, never inside object literals.

Typical logged actions: Resident added/updated/imported/deleted; Eligibility Form created/archived/restored/deleted; Account created; Database backup_created/restored.

**Ordering note:** restore actions are logged only *after* the restore completes, since the restore operation overwrites `activity_logs` itself as part of replacing the whole database.

---

## Project Structure Summary

### Backend

```
backend/
  config/db.js
  controllers/
  middleware/authMiddleware.js
  routes/
  utils/
    activityLogger.js
    tableCounts.js
    parseBackupCounts.js
    passwordGenerator.js
  server.js
  package.json
```

### Frontend

```
frontend/src/
  App.jsx
  main.jsx
  theme.js
  pages/
  modals/
  Reusables/
    ProtectedRoute.jsx
    PageLayout.jsx
    InfoPopper.jsx
    ModalLogoBadge.jsx
    Navbar.jsx
    Footer.jsx
    Button.jsx
  index.css
```

---

## Development Notes

- Frontend and backend run separately (Vite dev server on 5173, Express on 5000).
- Dev environment is XAMPP on Windows; production target is Linux (not yet deployed).
- `MYSQL_PATH` / `MYSQLDUMP_PATH` env vars point to the XAMPP MySQL binaries on Windows dev — will need updating for Linux production paths.
- Sensitive operations (backup, restore, archived-form restore/permanent-delete) are all reinforced with the shared `ReAuthModal.jsx` re-authentication pattern.
- MUI v7 Grid's `item`/`xs`/`md` props are silently ignored — use the `size` prop or, preferably, flexbox `Box` components (version-agnostic, used throughout this codebase).
- Chart.js + flex containers: `responsive: true` conflicts with flex sizing — chart wrapper divs use hardcoded pixel heights instead.

---

## Suggested Working Assumptions

When making changes, assume the current system already uses:

- JWT authentication with forced password-change flow
- Admin/Staff roles enforced client-side (`ProtectedRoute`) and server-side (`verifyToken` + inline role checks in controllers)
- MySQL/MariaDB persistence via mysql2 callback-style queries
- Separate backend controllers and routes per module/action (add/edit/delete typically split into their own files)
- React components organized by feature under `frontend/src/pages`, with shared pieces in `frontend/src/Reusables`
- Full file rewrites (not incremental patches) as the preferred editing approach, pulling fresh source before editing
- Sequential, one-item-at-a-time implementation with confirmation at each step

This context reflects the current working state of the system as of 2026-08-20 (v3.0).