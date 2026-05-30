# JULS System - Project Context

## 📋 Project Overview

**JULS** is a comprehensive **Barangay Management System** built with a modern full-stack architecture. It's designed to manage and track residents, households, user accounts, and eligibility forms for a barangay (village-level) administrative unit.

**Database Name:** `barangay`
**Current Version:** Post-RBAC Integration with Bulk Import Support
**Last Updated:** April 29, 2026

---

## 🏗️ Architecture

### Full-Stack Structure
```
JULS System
├── Frontend (React + Vite)
│   ├── Pages
│   ├── Components/Modals
│   └── Services (Axios API calls)
├── Backend (Node.js + Express)
│   ├── Controllers
│   ├── Routes
│   ├── Middleware
│   └── Config (Database)
└── Database (MySQL)
    └── Tables: users, residents, households, eligibility_forms, eligibility_forms_entries
```

---

## 💻 Technology Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js (v5.2.1)
- **Database:** MySQL2 (v3.16.1)
- **Authentication:** JWT (jsonwebtoken v9.0.3)
- **Security:** bcryptjs (v3.0.3)
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
- Fields: user_id, username, password (hashed), email, role, status (Active/Inactive), created_at, updated_at
- Uses JWT for authentication
- Password management with forced change on first login
- Role-based access control (RBAC) implemented

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
- Eligibility program forms (e.g., "fuel subsidy", "underaged", "unemployed")
- Fields: form_id, form_name, status (Enabled/Disabled), created_by, created_at
- Can be enabled or disabled
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
- ✅ Role-based access control (RBAC)
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
- ✅ Track eligibility entries for residents/households
- ✅ Mark residents/households as rewarded
- ✅ Delete eligibility entries
- ✅ View eligibility form details

### System Features
- ✅ Auto logout mechanism
- ✅ Dashboard with overview
- ✅ Change password functionality
- ✅ Responsive Material-UI design
- ✅ Data import/export with XLSX support

---

## 📁 File Structure

### Backend Structure
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
│   ├── EligibilityFormController.js
│   ├── eligibilityFormDeleteController.js
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
│   ├── eligibilityFormEntriesRoutes.js
│   ├── eligibilityFormEntriesUpdateRoutes.js
│   └── eligibilityFormEntriesDeleteRoutes.js
├── .env                                   # Environment variables
├── server.js                              # Main Express app
└── package.json
```

### Frontend Structure
```
frontend/
├── src/
│   ├── pages/
│   │   ├── Accounts/
│   │   │   ├── AccountsPage.jsx
│   │   │   ├── AccountsTable.jsx
│   │   │   └── AccountsToolbar.jsx
│   │   ├── Households/
│   │   │   ├── HouseholdsPage.jsx
│   │   │   ├── HouseholdsTable.jsx
│   │   │   └── HouseholdsToolbar.jsx
│   │   ├── Residents/
│   │   │   ├── ResidentsPage.jsx
│   │   │   ├── ResidentsTable.jsx
│   │   │   └── ResidentsToolbar.jsx
│   │   ├── EligibilityForm/
│   │   │   ├── EligibilityPage.jsx
│   │   │   ├── EligibilityTable.jsx
│   │   │   ├── EligibilityEntriesPage.jsx
│   │   │   ├── EligibilityEntriesTable.jsx
│   │   │   └── EligiblitiyEntriesToolbar.jsx
│   │   ├── DashboardPage.jsx
│   │   └── ChangePasswordPage.jsx
│   ├── modals/
│   │   ├── AddAccountModal.jsx
│   │   ├── EditAccountModal.jsx
│   │   ├── DeleteAccountModal.jsx
│   │   ├── ChangePasswordModal.jsx
│   │   ├── AddResidentModal.jsx
│   │   ├── EditResidentModal.jsx
│   │   ├── DeleteResidentModal.jsx
│   │   ├── ImportResidentModal.jsx
│   │   ├── AddHouseholdModal.jsx
│   │   ├── EditHouseholdModal.jsx
│   │   ├── DeleteHouseholdModal.jsx
│   │   ├── ImportHouseholdModal.jsx
│   │   ├── AddEligibilityFormModal.jsx
│   │   ├── DeleteEligibilityFormModal.jsx
│   │   └── DeleteEligibilityFormEntriesModal.jsx
│   ├── App.jsx                            # Main app component
│   └── main.jsx
├── public/                                # Static assets
├── index.html
├── vite.config.js
├── eslint.config.js
├── package.json
└── .gitignore
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

### Eligibility Forms
- `GET /api/eligibility-forms` - Get all forms
- `POST /api/eligibility-forms` - Add new form
- `DELETE /api/eligibility-forms/:id` - Delete form
- `GET /api/eligibility-forms/entries` - Get entries
- `POST /api/eligibility-forms/entries` - Add entry
- `PUT /api/eligibility-forms/entries/:id` - Update entry (mark as rewarded)
- `DELETE /api/eligibility-forms/entries/:id` - Delete entry

---

## 🔐 Security & Authentication

### JWT Authentication
- Tokens issued on login
- Verified on protected routes via `authMiddleware.js`
- Token includes user ID and role information

### Password Security
- Passwords hashed with bcryptjs
- Default password assigned on user creation
- Force password change on first login
- Change password functionality available

### RBAC (Role-Based Access Control)
- Integrated into user model
- User roles control access levels
- Middleware verifies role permissions

---

## 🚀 Running the Project

### Prerequisites
- Node.js installed
- MySQL server running with `barangay` database
- Database populated from `barangay (11).sql`

### Backend Setup
```bash
cd backend
npm install
# Configure .env file
node server.js
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Backend runs on: `http://localhost:5000`
Frontend runs on: `http://localhost:5173` (Vite default)

---

## 📝 Recent Development History

### Latest Commits (Most Recent First)
1. **de6a1a3** - Working Bulk import of records and Integrated RBAC
2. **592a468** - Modified user add function with default password and force change pass. Added eligibility function to household records
3. **d47ff34** - Auto Logout Mechanism implemented
4. **58f2033** - Page layout modification
5. **c531979** - Properly working Eligibility page with inclusions (some layout/design flaws)
6. **9ecd852** - Fix logo and implement it everywhere
7. **6a5f053** - Displaying Eligibility Forms and details with enable/disable functionality
8. **8290ea7** - User auth includes account status. Added Change Password functionality
9. **4c85a2b** - Working Accounts Management with search and filtering
10. **b02d35f** - Working Household Actions with properly positioned icons

---

## ⚙️ Configuration

### Database Connection (backend/config/db.js)
```javascript
Host: localhost
User: root
Password: (empty)
Database: barangay
Connection Pool Limit: 10
```

### Environment Variables (backend/.env)
```
PORT=5000
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=barangay
JWT_SECRET=<your-secret-key>
```

---

## 🎨 UI Components

### Main Pages
- **LoginPage** - User authentication
- **DashboardPage** - Overview/home page
- **AccountsPage** - User management interface
- **ResidentsPage** - Resident management
- **HouseholdsPage** - Household management
- **EligibilityPage** - Eligibility form management
- **EligibilityEntriesPage** - Entry tracking
- **ChangePasswordPage** - Password change

### Modal Components
All major operations use modal dialogs:
- Add/Edit/Delete operations
- Bulk import workflows
- Password change

### Data Display
- MUI DataGrid for tabular data
- Search and filtering on all tables
- Sortable columns
- Pagination support

---

## 🔄 Data Flow

### User Registration & Authentication
1. Admin creates user with default password
2. System forces password change on first login
3. JWT token issued on successful login
4. Token stored client-side for authenticated requests

### Resident/Household Management
1. Add individual records or bulk import via XLSX
2. Preview imported data before confirmation
3. CRUD operations available
4. Data searchable and filterable

### Eligibility Processing
1. Create eligibility forms/programs
2. Mark residents/households as eligible
3. Track reward status
4. Enable/disable programs as needed

---

## 📊 Data Import/Export

### Bulk Import Features
- Supported format: XLSX (Excel files)
- Two-step process: Preview → Confirm
- Applicable to: Residents, Households
- Preview shows data before database insertion
- Error handling during import

---

## 🚧 Known Features & Status

| Feature | Status | Last Updated |
|---------|--------|--------------|
| User Authentication | ✅ Complete | 8290ea7 |
| User Management with RBAC | ✅ Complete | de6a1a3 |
| Resident CRUD | ✅ Complete | 592a468 |
| Resident Bulk Import | ✅ Complete | de6a1a3 |
| Household CRUD | ✅ Complete | b02d35f |
| Household Bulk Import | ✅ Complete | de6a1a3 |
| Eligibility Forms | ✅ Complete | 6a5f053 |
| Auto Logout | ✅ Complete | d47ff34 |
| Change Password | ✅ Complete | 8290ea7 |
| Dashboard | ✅ Complete | 58f2033 |
| Search/Filter | ✅ Complete | 4c85a2b |

---

## 📝 Notes for Future Development

1. **RBAC Integration:** Role-based access control is integrated but may need refinement on specific endpoints
2. **Eligibility Tracking:** The system supports marking residents/households as rewarded
3. **Bulk Operations:** Two-step preview/confirm pattern used for data integrity
4. **Auto Logout:** Mechanism is implemented for session management
5. **Material-UI Migration:** Modern UI components are in place with consistent styling

---

## 🔍 Development Patterns

### Backend Patterns
- Separate route files per resource (e.g., `userRoutes.js`, `residentRoutes.js`)
- Dedicated controller files for each operation (Add, Edit, Delete)
- Centralized database connection via pool
- JWT middleware for protected routes

### Frontend Patterns
- Page components for major sections
- Modal components for user interactions
- Toolbar components with action buttons
- Table components with MUI DataGrid
- Axios for HTTP requests
- React Router for navigation

---

## 📞 Contact & Support

**Project:** JULS - Barangay Management System
**Git User:** NicaLexza
**Current Branch:** main
**Repository Status:** Active Development

---

*This context document was generated on 2026-05-21 for Claude AI assistance.*
