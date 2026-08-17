# JULS Barangay Management System - Project Context

## Overview

JULS is a barangay management system for handling resident records, user accounts, eligibility forms, eligibility entries, dashboard statistics, and database backup/restore operations. The application is split into a React + Vite frontend and a Node.js + Express backend backed by MySQL.

- Updated: 2026-07-18
- Database file: barangay.sql
- Backend port: 5000
- Frontend dev server: 5173

---

## Current System Status

The project is currently running as a functional full-stack system with the following capabilities:

- JWT-based authentication with forced password-change handling
- Role-based frontend route protection for Admin and Staff users
- Admin/staff user management
- Resident CRUD and bulk import workflows
- Eligibility form management with archive/restore/delete flow
- Eligibility entry management and archived-form views
- Dashboard statistics and recent activity feed
- Database backup and restore support
- Activity logging for key operations

## Recent Implementation Updates

Recent refinements in the current codebase include:

- Protected routes now enforce token presence, JWT expiration checks, forced password-change redirects, and role-based access control in the React frontend.
- The application distinguishes admin-only pages such as Dashboard and Accounts from shared admin/staff pages such as Residents and Eligibility.
- Eligibility routes include a dedicated archived forms view, with route ordering set so /Eligibility/Archived is not interpreted as a form ID.
- Resident import flows use preview and confirmation steps before committing changes to the database.

---

## Architecture

### Frontend

- Framework: React 19
- Build tool: Vite
- UI library: Material UI
- Data grid: MUI X Data Grid
- Routing: React Router
- HTTP client: Axios

### Backend

- Runtime: Node.js
- Framework: Express
- Database driver: MySQL2
- Auth: JWT + bcryptjs
- File handling: Multer
- Excel import: XLSX
- Environment config: dotenv

---

## Main Modules

### 1. Authentication and Access Control

Implemented through:

- backend/controllers/authController.js
- backend/controllers/changeDefaultPasswordController.js
- backend/middleware/authMiddleware.js
- frontend/src/Reusables/ProtectedRoute.jsx

Features:

- Login with JWT-based session handling
- Password change flow for first-time or forced password reset
- Admin/staff role-based route protection

### 2. User Management

Implemented through:

- backend/controllers/userController.js
- backend/controllers/userAddController.js
- backend/controllers/userEditController.js
- backend/controllers/userDeleteController.js
- backend/controllers/userChangePassController.js

Features:

- List users
- Create accounts
- Edit accounts
- Delete accounts
- Change passwords
- Active/inactive account handling

### 3. Resident Management

Implemented through:

- backend/controllers/residentController.js
- backend/controllers/residentAddController.js
- backend/controllers/residentEditController.js
- backend/controllers/residentDeleteController.js
- backend/controllers/residentImportPreviewController.js
- backend/controllers/residentImportConfirmController.js
- frontend/src/pages/Residents/
- frontend/src/modals/AddResidentModal.jsx and related modals

Features:

- Resident CRUD
- Resident search/filtering
- Bulk import preview and confirmation
- Household-head tracking fields
- Duplicate detection on resident identity fields
- Activity logging for create/update/import operations

### 4. Eligibility Forms and Entries

Implemented through:

- backend/controllers/AddEligibilityFormController.js
- backend/controllers/EligibilityFormController.js
- backend/controllers/eligibilityFormDeleteController.js
- backend/controllers/eligibilityFormArchiveController.js
- backend/controllers/eligibilityFormEntriesController.js
- backend/controllers/eligibilityFormEntriesUpdateController.js
- backend/controllers/eligibilityFormEntriesDeleteController.js
- frontend/src/pages/EligibilityForm/

Features:

- Create and manage eligibility forms
- Enable/disable forms
- Archive/restore/permanent delete workflow
- Add/update/delete eligibility entries
- View entries by form
- Admin re-authentication for sensitive archive operations

### 5. Dashboard and Activity Feed

Implemented through:

- backend/controllers/dashboardController.js
- frontend/src/pages/DashboardPage.jsx

Features:

- Resident and user counts
- Age/gender/civil-status summaries
- Special sector counts
- Recent records overview
- Recent activity feed from activity_logs

### 6. Backup and Restore

Implemented through:

- backend/controllers/databaseBackupController.js
- backend/controllers/databaseRestoreController.js
- backend/routes/backupRoutes.js

Features:

- Download database backup as SQL
- Restore database from uploaded SQL file

---

## Current Backend Route Structure

The backend currently registers the following main route groups in server.js:

- /api/auth
- /api/users
- /api/residents
- /api/eligibility-forms
- /api/dashboard
- /api/backup

Route files are organized by feature and include dedicated add/edit/delete/change-password variants for users and residents.

---

## Current Frontend Route Structure

The app uses React Router with these main pages:

- / for login
- /ChangePassword for forced password updates
- /Dashboard for admin dashboard
- /Accounts for account management
- /Residents for resident management
- /Eligibility for eligibility forms
- /Eligibility/Archived for archived forms
- /Eligibility/:formId for eligibility entries

---

## Database Context

The system uses a MySQL database named barangay.

Core tables expected by the current backend include:

- users
- residents
- eligibility_forms
- eligibility_forms_entries
- activity_logs

The current SQL dump in the workspace is named barangay (16).sql.

---

## Activity Logging System

The application includes an activity logging utility in backend/utils/activityLogger.js that writes to the activity_logs table.

Typical logged actions include:

- Resident added / updated / imported / deleted
- Eligibility form archived / restored / deleted
- User-related actions
- Eligibility entry updates

This logging is designed to be non-blocking so the main request flow is unaffected if logging fails.

---

## Project Structure Summary

### Backend

backend/

- config/db.js
- controllers/
- middleware/authMiddleware.js
- routes/
- utils/activityLogger.js
- server.js
- package.json

### Frontend

frontend/src/

- App.jsx
- main.jsx
- pages/
- modals/
- Reusables/
- index.css

---

## Development Notes

- The frontend and backend are currently expected to run separately.
- Backend runs on port 5000 and serves API endpoints.
- Frontend runs through Vite on port 5173.
- The project uses a protected-route pattern for role-based access.
- Sensitive operations such as archive restore/delete are reinforced with re-authentication.

---

## Suggested Working Assumptions

When making changes, assume the current system is already using:

- JWT authentication
- Admin/Staff roles
- MySQL-backed persistence
- Separate backend controllers and routes per module
- React components organized by feature under frontend/src/pages

This context should be treated as the current working state of the system as of 2026-07-18.
