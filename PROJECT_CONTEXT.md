# JULS System - Project Context (Updated 2026-06-06)

## 📋 Project Overview

**JULS** is a comprehensive **Barangay Management System** built with a modern full-stack architecture. It's designed to manage and track residents, households, user accounts, and eligibility forms for a barangay (village-level) administrative unit.

**Database Name:** `barangay`
**Current Version:** Archive Feature Implementation (In Progress)
**Git User:** NicaLexza
**Current Branch:** main
**Last Updated:** June 6, 2026

---

## 🚀 Current Development Status

### 🔨 In-Progress Features (Not Yet Committed)

#### 1. **Eligibility Form Archive System** ⭐ ACTIVE
A soft-delete system for eligibility forms with admin credential verification and restore/permanent delete capabilities.

**Files Modified/Created:**
- ✅ `backend/controllers/eligibilityFormArchiveController.js` (NEW)
- ✅ `backend/routes/eligibilityFormArchiveRoutes.js` (NEW)
- ✅ `frontend/src/modals/ReAuthModal.jsx` (NEW)
- ✅ `frontend/src/pages/EligibilityForm/EligibilityArchivedPage.jsx` (NEW)
- ✅ `frontend/src/pages/EligibilityForm/EligibilityArchivedTable.jsx` (NEW)
- 🔄 `backend/controllers/EligibilityFormController.js` (MODIFIED)
- 🔄 `backend/controllers/eligibilityFormDeleteController.js` (MODIFIED)
- 🔄 `backend/server.js` (MODIFIED)
- 🔄 `frontend/src/App.jsx` (MODIFIED)
- 🔄 `frontend/src/modals/DeleteEligibilityFormModal.jsx` (MODIFIED)
- 🔄 `frontend/src/pages/EligibilityForm/EligibilityTable.jsx` (MODIFIED)

**Changes Summary:**
- Soft-delete mechanism: Forms marked as 'Archived' instead of permanently deleted
- Admin-only credential verification for restore/permanent delete operations
- Separate archived forms page with dedicated UI
- ReAuthModal for sensitive credential verification
- Archive icon added to form actions
- Statistics tracking: total entries and rewarded count per form

---

## 🏗️ Architecture

### Full-Stack Structure
```
JULS System
├── Frontend (React + Vite)
│   ├── Pages
│   │   ├── Eligibility Forms Management
│   │   │   ├── Active Forms (Enabled/Disabled)
│   │   │   └── Archived Forms (NEW)
│   │   └── Other Management Pages
│   ├── Modals (Including ReAuthModal - NEW)
│   └── Reusables (ProtectedRoute, Navbar, etc.)
├── Backend (Node.js + Express)
│   ├── Controllers
│   │   ├── Archive Management (NEW)
│   │   └── Eligibility Form Controllers
│   ├── Routes
│   │   └── Archive Routes (NEW)
│   ├── Middleware (Auth, Token Verification)
│   └── Config (Database)
└── Database (MySQL)
    └── Tables with Archive Status Support
```

---

## 💻 Technology Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js (v5.2.1)
- **Database:** MySQL2 (v3.16.1)
- **Authentication:** JWT (jsonwebtoken v9.0.3)
- **Security:** bcryptjs (v3.0.3) - For credential verification
- **File Upload:** Multer (v2.1.1)
- **Data Import:** XLSX (v0.18.5)
- **CORS:** Enabled for cross-origin requests
- **Port:** 5000

### Frontend
- **Framework:** React (v19.2.3)
- **Build Tool:** Vite (v7.2.4)
- **Styling:** Material-UI (@mui/material v7.3.7)
- **Data Grid:** MUI X-Data-Grid (v8.27.0)
- **Routing:** React Router DOM (v7.12.0)
- **HTTP Client:** Axios (v1.13.2)
- **Date Handling:** DayJS (v1.11.19)
- **Icons:** MUI Icons Material (v7.3.7)
- **Date Picker:** MUI X-Date-Pickers (v8.27.0)

---

## 📊 Database Schema

### Core Tables

#### 1. **users**
- User accounts for system access
- Fields: user_id, username, password (hashed), email, role, status (Active/Inactive), fullname, created_at, updated_at
- Uses JWT for authentication
- Password management with forced change on first login
- Role-based access control (RBAC): Admin, Staff

#### 2. **residents**
- Individual resident information
- Fields: resident_id, name, age, contact, address, status, created_at, updated_at
- Linked to households
- Bulk import capability via XLSX

#### 3. **households**
- Household/family group records
- Fields: household_id, name, address, number_of_members, status, created_at, updated_at
- Can contain multiple residents
- Bulk import and eligibility tracking

#### 4. **eligibility_forms**
- Eligibility program forms
- Fields: form_id, form_name, status (Enabled/Disabled/Archived), created_by, created_at
- **NEW:** Archive status for soft-delete
- Can be enabled, disabled, or archived
- Example forms: underaged, unemployed, fuel subsidy, households

#### 5. **eligibility_forms_entries**
- Individual eligibility entries linking residents/households to forms
- Fields: entry_id, form_id, resident_id, household_id, is_rewarded (boolean), processed_by, processed_at
- Tracks which residents/households qualify for which programs
- Reward status tracking

---

## 🎯 Key Features

### User Management
- ✅ User authentication with JWT
- ✅ Role-based access control (RBAC) - Admin/Staff roles
- ✅ Account creation with default password
- ✅ Force password change on first login
- ✅ Account status management (Active/Inactive)
- ✅ Account editing and deletion
- ✅ User search and filtering

### Resident Management
- ✅ Add/Edit/Delete resident records
- ✅ Bulk import residents via XLSX file upload
- ✅ Import preview with confirmation step
- ✅ Search and filtering capabilities
- ✅ Status tracking

### Household Management
- ✅ Add/Edit/Delete household records
- ✅ Bulk import households via XLSX
- ✅ Link residents to households
- ✅ Search and filtering
- ✅ Eligibility tracking per household

### Eligibility Forms Management
- ✅ Create eligibility forms/programs
- ✅ Enable/Disable forms
- ✅ **NEW:** Archive forms (soft-delete)
- ✅ **NEW:** View archived forms on separate page
- ✅ **NEW:** Restore archived forms (Admin-only, requires re-auth)
- ✅ **NEW:** Permanently delete archived forms (Admin-only, requires re-auth)
- ✅ Track eligibility entries for residents/households
- ✅ Mark residents/households as rewarded
- ✅ Delete eligibility entries
- ✅ View eligibility form details with statistics

### Security Features
- ✅ Auto logout mechanism
- ✅ **NEW:** ReAuth modal for sensitive operations
- ✅ **NEW:** Credential verification before archive restoration/deletion
- ✅ JWT authentication on all protected routes
- ✅ Role-based access control enforcement
- ✅ Admin-only archive management

### System Features
- ✅ Dashboard with overview
- ✅ Change password functionality
- ✅ Responsive Material-UI design
- ✅ Data import/export with XLSX support
- ✅ Search and filtering across all tables

---

## 📁 File Structure

### Backend Structure (Current)
```
backend/
├── config/
│   └── db.js                              # MySQL connection pool
├── controllers/
│   ├── authController.js                  # Authentication logic
│   ├── userController.js                  # User CRUD operations
│   ├── userAddController.js
│   ├── userEditController.js
│   ├── userDeleteController.js
│   ├── userChangePassController.js
│   ├── residentController.js
│   ├── residentAddController.js
│   ├── residentEditController.js
│   ├── residentDeleteController.js
│   ├── residentBulkImportController.js
│   ├── residentImportPreviewController.js
│   ├── residentImportConfirmController.js
│   ├── householdController.js
│   ├── householdAddController.js
│   ├── householdEditController.js
│   ├── householdDeleteController.js
│   ├── householdBulkImportController.js
│   ├── householdImportPreviewController.js
│   ├── householdImportConfirmController.js
│   ├── AddEligibilityFormController.js
│   ├── EligibilityFormController.js       # MODIFIED - separates archived forms
│   ├── eligibilityFormDeleteController.js # MODIFIED - implements soft-delete
│   ├── eligibilityFormArchiveController.js # NEW - archive management
│   ├── eligibilityFormEntriesController.js
│   ├── eligibilityFormEntriesUpdateController.js
│   └── eligibilityFormEntriesDeleteController.js
├── middleware/
│   └── authMiddleware.js                  # JWT verification
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── userAddRoutes.js
│   ├── userEditRoutes.js
│   ├── userDeleteRoutes.js
│   ├── userChangePassRoutes.js
│   ├── residentRoutes.js
│   ├── residentAddRoutes.js
│   ├── residentEditRoutes.js
│   ├── residentDeleteRoutes.js
│   ├── residentBulkImportRoutes.js
│   ├── householdRoutes.js
│   ├── householdAddRoutes.js
│   ├── householdEditRoutes.js
│   ├── householdDeleteRoutes.js
│   ├── householdBulkImportRoutes.js
│   ├── eligibilityFormAddRoutes.js
│   ├── eligibilityFormRoutes.js
│   ├── eligibilityFormDeleteRoutes.js
│   ├── eligibilityFormArchiveRoutes.js    # NEW - archive routes
│   ├── eligibilityFormEntriesRoutes.js
│   ├── eligibilityFormEntriesUpdateRoutes.js
│   └── eligibilityFormEntriesDeleteRoutes.js
├── .env                                   # Environment variables
├── server.js                              # Main Express app (MODIFIED)
└── package.json
```

### Frontend Structure (Current)
```
frontend/src/
├── pages/
│   ├── Accounts/
│   │   ├── AccountsPage.jsx
│   │   ├── AccountsTable.jsx
│   │   └── AccountsToolbar.jsx
│   ├── Households/
│   │   ├── HouseholdsPage.jsx
│   │   ├── HouseholdsTable.jsx
│   │   └── HouseholdsToolbar.jsx
│   ├── Residents/
│   │   ├── ResidentsPage.jsx
│   │   ├── ResidentsTable.jsx
│   │   └── ResidentsToolbar.jsx
│   ├── EligibilityForm/
│   │   ├── EligibilityPage.jsx
│   │   ├── EligibilityTable.jsx           # MODIFIED - archive action added
│   │   ├── EligibilityEntriesPage.jsx
│   │   ├── EligibilityEntriesTable.jsx
│   │   ├── EligiblitiyEntriesToolbar.jsx
│   │   ├── EligibilityArchivedPage.jsx    # NEW - archived forms page
│   │   └── EligibilityArchivedTable.jsx   # NEW - archived forms table
│   ├── DashboardPage.jsx
│   └── ChangePasswordPage.jsx
├── modals/
│   ├── AddAccountModal.jsx
│   ├── EditAccountModal.jsx
│   ├── DeleteAccountModal.jsx
│   ├── ChangePasswordModal.jsx
│   ├── AddResidentModal.jsx
│   ├── EditResidentModal.jsx
│   ├── DeleteResidentModal.jsx
│   ├── ImportResidentModal.jsx
│   ├── AddHouseholdModal.jsx
│   ├── EditHouseholdModal.jsx
│   ├── DeleteHouseholdModal.jsx
│   ├── ImportHouseholdModal.jsx
│   ├── AddEligibilityFormModal.jsx
│   ├── DeleteEligibilityFormModal.jsx     # MODIFIED - soft-delete implementation
│   ├── DeleteEligibilityFormEntriesModal.jsx
│   └── ReAuthModal.jsx                    # NEW - credential verification modal
├── Reusables/
│   ├── ProtectedRoute.jsx
│   ├── Navbar.jsx
│   └── Footer.jsx
├── App.jsx                                # MODIFIED - new archive route
└── main.jsx
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Users Management
- `GET /api/users` - Get all users
- `POST /api/users` - Add new user (default password, force change)
- `PUT /api/users/:id` - Edit user
- `DELETE /api/users/:id` - Delete user
- `PUT /api/users/change-password/:id` - Change password

### Residents Management
- `GET /api/residents` - Get all residents
- `POST /api/residents` - Add new resident
- `PUT /api/residents/:id` - Edit resident
- `DELETE /api/residents/:id` - Delete resident
- `POST /api/residents/import/preview` - Preview bulk import
- `POST /api/residents/import/confirm` - Confirm bulk import

### Households Management
- `GET /api/households` - Get all households
- `POST /api/households` - Add new household
- `PUT /api/households/:id` - Edit household
- `DELETE /api/households/:id` - Delete household
- `POST /api/households/import/preview` - Preview bulk import
- `POST /api/households/import/confirm` - Confirm bulk import

### Eligibility Forms (Active)
- `GET /api/eligibility-forms` - Get all active forms (Enabled/Disabled)
- `POST /api/eligibility-forms` - Add new form
- `DELETE /api/eligibility-forms/delete/:id` - Soft-delete form (archive)
- `PUT /api/eligibility-forms/:id/status` - Toggle Enable/Disable status

### Eligibility Forms (Archive) - NEW
- `GET /api/eligibility-forms/archived` - Get all archived forms
- `POST /api/eligibility-forms/archived/:id/restore` - Restore from archive (Admin-only, re-auth required)
- `DELETE /api/eligibility-forms/archived/:id` - Permanently delete archived form (Admin-only, re-auth required)

### Eligibility Entries
- `GET /api/eligibility-forms/entries` - Get entries
- `POST /api/eligibility-forms/entries` - Add entry
- `PUT /api/eligibility-forms/entries/:id` - Update entry (mark as rewarded)
- `DELETE /api/eligibility-forms/entries/:id` - Delete entry

---

## 🔐 Archive System Details

### Archive Workflow
1. User clicks "Delete" on an eligibility form
2. DeleteEligibilityFormModal appears with confirmation
3. Form is soft-deleted: `status` changed to 'Archived'
4. Form no longer appears in active forms list
5. Form moves to Archived Forms page

### Restore Workflow (Admin-only)
1. Admin navigates to Archived Forms page
2. Admin selects form and clicks "Restore"
3. ReAuthModal appears requesting admin credentials
4. Backend verifies credentials against database
5. If verified: Form status changed back to 'Disabled'
6. Form reappears in active forms list

### Permanent Delete Workflow (Admin-only)
1. Admin navigates to Archived Forms page
2. Admin selects form and clicks "Delete Permanently"
3. ReAuthModal appears requesting admin credentials
4. Backend verifies credentials against database
5. If verified: Form permanently deleted from database
6. Form removed from archived list

### Security Features
- **ReAuth Modal:** Requires admin username and password before sensitive operations
- **Credential Verification:** Backend validates credentials against current user
- **Role Enforcement:** Only Admin role can access restore/permanent delete
- **Status Checking:** Ensures user account is Active before allowing operations
- **Password Hashing:** bcryptjs used for credential verification

---

## 🎨 New Components & Modals

### ReAuthModal.jsx (NEW)
**Purpose:** Secure credential verification for sensitive operations

**Props:**
- `open` (boolean) - Control modal visibility
- `onClose` (function) - Called when modal closed
- `onConfirm` (function) - Called with `{username, password}` after submission
- `title` (string) - Dialog title
- `description` (string) - Helper text
- `confirmLabel` (string) - Confirm button text
- `confirmColor` (string) - MUI button color
- `loading` (boolean) - Show loading state
- `error` (string) - Error message display

**Features:**
- Username and password input fields
- Eye icon toggle to show/hide password
- Enter key support for quick submission
- Icons for visual clarity (lock, identity)
- Loading state with spinner
- Error display area

### EligibilityArchivedPage.jsx (NEW)
**Purpose:** Page wrapper for archived forms management

**Layout:**
```
Navbar
  ↓
EligibilityArchivedTable
  ↓
Footer
```

### EligibilityArchivedTable.jsx (NEW)
**Purpose:** Display and manage archived eligibility forms

**Features:**
- Fetch archived forms from backend
- Card-based UI for each archived form
- Statistics: total entries, rewarded count
- Kebab menu with Restore and Delete options
- Admin-only controls (client-side gating via JWT decode)
- ReAuthModal integration for sensitive actions
- Back navigation to active forms

**State Management:**
```javascript
forms          // Array of archived forms
loading        // Fetch loading state
menuAnchor     // Kebab menu anchor element
selectedForm   // Currently selected form
reAuthOpen     // ReAuthModal visibility
reAuthAction   // "restore" | "delete"
reAuthLoading  // ReAuth operation loading
reAuthError    // ReAuth error message
```

---

## 🔄 Modified Components

### EligibilityTable.jsx (MODIFIED)
**Changes:**
- Archive action added to kebab menu
- Archive button with ArchiveIcon
- Soft-delete implementation on delete
- Statistics display (total_entries, rewarded_count)
- Navigation to active forms carries is_archived flag

### DeleteEligibilityFormModal.jsx (MODIFIED)
**Changes:**
- Title changed from "Delete Form?" to "Archive Form?"
- Icon changed to ArchiveIcon
- Backend endpoint targets `/delete/` path (soft-delete)
- Text reflects archive instead of permanent delete

### EligibilityFormController.js (MODIFIED)
**Changes:**
- `getForms()` now filters WHERE status IN ('Enabled', 'Disabled')
- Archived forms excluded from active forms list
- Includes statistics: COUNT(entries), SUM(is_rewarded)
- `updateFormStatus()` only allows Enabled/Disabled (not Archived)

### eligibilityFormDeleteController.js (MODIFIED)
**Changes:**
- Now implements soft-delete instead of hard delete
- Sets status to 'Archived' instead of DELETE FROM
- Returns success message: "Form archived successfully"

### App.jsx (MODIFIED)
**Changes:**
- New route: `/Eligibility/Archived` → `EligibilityArchivedPage`
- Route declared BEFORE `/Eligibility/:formId` to prevent routing conflicts
- Admin + Staff roles allowed (controlled in backend)
- ProtectedRoute wrapper for auth

### server.js (MODIFIED)
**Changes:**
- New route registration: `app.use("/api/eligibility-forms", eligibilityFormArchiveRoutes);`
- Archive routes mounted on same path as other eligibility endpoints

---

## 🔐 Security & Authentication

### JWT Authentication
- Tokens issued on login
- Verified on protected routes via `authMiddleware.js`
- Token includes: user ID, role, username
- Token stored in localStorage on frontend

### Password Security
- Passwords hashed with bcryptjs
- Default password assigned on user creation
- Force password change on first login
- Credential re-verification required for sensitive operations

### RBAC (Role-Based Access Control)
- Two roles: Admin, Staff
- Admin-only: Dashboard, Accounts, Archive management
- Shared routes: Residents, Households, Eligibility (both roles)
- ChangePassword: Any authenticated user
- Middleware verifies role permissions

### Archive Operations Security
- Credential verification required
- Verified against current logged-in user
- Account must be Active status
- Password validated with bcrypt.compare()
- Only Admin role can perform restore/delete operations

---

## 🚀 Running the Project

### Prerequisites
- Node.js installed
- MySQL server running with `barangay` database
- Database populated from SQL file

### Backend Setup
```bash
cd backend
npm install
# Configure .env file with DB credentials
node server.js
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

**URLs:**
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`

---

## 📝 Recent Commit History

1. **cb16954** - Added Resident Report generation and printability
2. **ca340ce** - Working Dashboard and printable Eligibility forms
3. **de6a1a3** - Working Bulk import of records and Integrated RBAC
4. **592a468** - Modified user add function with default pass & force change. Added eligibility function to household records
5. **d47ff34** - Auto Logout Mechanism implemented

---

## 🔄 Current Uncommitted Changes

### Files Modified (Ready to Commit)
```
 backend/controllers/EligibilityFormController.js
 backend/controllers/eligibilityFormDeleteController.js
 backend/server.js
 frontend/src/App.jsx
 frontend/src/modals/DeleteEligibilityFormModal.jsx
 frontend/src/pages/EligibilityForm/EligibilityTable.jsx
```

### Files Created (Ready to Commit)
```
 backend/controllers/eligibilityFormArchiveController.js
 backend/routes/eligibilityFormArchiveRoutes.js
 frontend/src/modals/ReAuthModal.jsx
 frontend/src/pages/EligibilityForm/EligibilityArchivedPage.jsx
 frontend/src/pages/EligibilityForm/EligibilityArchivedTable.jsx
```

### Change Summary
- 108 insertions(+), 268 deletions(-)
- Archive functionality fully implemented
- Soft-delete mechanism in place
- Admin credential verification integrated
- Archived forms management page created

---

## 📊 Feature Status Matrix

| Feature | Status | Implementation | Last Update |
|---------|--------|-----------------|-------------|
| User Authentication | ✅ Complete | JWT + bcrypt | d47ff34 |
| RBAC (Admin/Staff) | ✅ Complete | Role-based routing | de6a1a3 |
| Resident CRUD | ✅ Complete | Full lifecycle | 592a468 |
| Resident Bulk Import | ✅ Complete | Preview + Confirm | de6a1a3 |
| Household CRUD | ✅ Complete | Full lifecycle | de6a1a3 |
| Household Bulk Import | ✅ Complete | Preview + Confirm | de6a1a3 |
| Eligibility Forms | ✅ Complete | Create/Enable/Disable | 6a5f053 |
| **Eligibility Archive** | 🔄 IN PROGRESS | Soft-delete + Restore | Current |
| Form Statistics | ✅ Complete | Entries + Rewards | Current |
| ReAuth Modal | 🔄 IN PROGRESS | Credential verification | Current |
| Auto Logout | ✅ Complete | Session management | d47ff34 |
| Change Password | ✅ Complete | Force change support | 8290ea7 |

---

## 🛠️ Development Patterns

### Backend Patterns
- Separate route files per resource with CRUD operations
- Dedicated controller files for specific operations
- Centralized database connection via pool (10 connections)
- JWT middleware for protected routes
- Credential verification with bcrypt for sensitive ops
- Error handling with HTTP status codes

### Frontend Patterns
- Page components for major sections
- Modal components for user interactions
- Toolbar components with action buttons
- Card-based UI for forms/entries display
- Axios interceptors for token headers
- React Router for navigation
- Material-UI components for consistency
- Client-side JWT decode for role gating

### Archive Pattern
- Soft-delete: Status field instead of hard delete
- Separation: Archived forms on separate page/endpoint
- Security: Admin-only with credential re-verification
- Recovery: Easy restore to Disabled status
- Transparency: Statistics preserved on archived forms

---

## 🎯 Next Steps (Post-Archive Feature)

1. Test archive workflow end-to-end
2. Verify credential verification security
3. Test restore functionality
4. Test permanent delete functionality
5. Verify route protection and role-based access
6. UI/UX testing on archived forms page
7. Performance testing with multiple archived forms
8. Commit changes with appropriate message
9. Prepare for next feature iteration

---

## 📞 Project Information

**Project:** JULS - Barangay Management System
**Git User:** NicaLexza
**Current Branch:** main
**Status:** Active Development - Archive Feature in Progress
**Last Context Update:** June 6, 2026 10:30 AM
**Context Document Version:** 2.0

---

*This comprehensive context document includes all current development work, in-progress features, and complete system architecture for Claude AI assistance.*
