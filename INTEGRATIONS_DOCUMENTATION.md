# System Integrations Documentation

This document provides a comprehensive overview of all third-party integrations and services used in the Counseling Services Management System.

---

## Table of Contents

1. [Authentication Integrations](#authentication-integrations)
2. [Cloud Storage Integrations](#cloud-storage-integrations)
3. [Email Service Integration](#email-service-integration)
4. [Security Integrations](#security-integrations)
5. [Database Integration](#database-integration)
6. [PDF Generation Libraries](#pdf-generation-libraries)
7. [Frontend Libraries & Services](#frontend-libraries--services)
8. [Configuration Requirements](#configuration-requirements)

---

## Authentication Integrations

### 1. Google OAuth 2.0

**Purpose**: Allow users and admins to authenticate using their Google accounts.

**Implementation**:
- **Backend Package**: `passport-google-oauth20` (v2.0.0)
- **Frontend Package**: `@react-oauth/google` (v0.12.2)
- **Configuration Files**:
  - `backend/config/passport.js` - User Google OAuth
  - `backend/config/adminPassport.js` - Admin Google OAuth
  - `backend/config/googleOAuth.js` - OAuth client helper

**Features**:
- Separate OAuth flows for regular users and admins
- Automatic user creation in `GoogleUser` collection for new users
- Admin verification against existing `Admin` collection
- JWT token generation after successful authentication
- Session management via Passport.js

**Routes**:
- User: `/auth/google` (initiate), `/auth/google/callback` (callback)
- Admin: `/auth/admin/google` (initiate), `/auth/admin/google/callback` (callback)

**Environment Variables Required**:
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback
GOOGLE_ADMIN_CALLBACK_URL=http://localhost:5000/auth/admin/google/callback
```

**Models**:
- `GoogleUser` - Stores Google-authenticated users
- `Admin` - Stores admin accounts (can link Google ID)

---

### 2. GitHub OAuth 2.0

**Purpose**: Allow users and admins to authenticate using their GitHub accounts.

**Implementation**:
- **Backend Package**: `passport-github2` (v0.1.12)
- **Configuration Files**:
  - `backend/config/passport-github.js` - User GitHub OAuth
  - `backend/routes/githubAuth.js` - GitHub authentication routes
  - `backend/routes/admin/adminGithubAuthRoutes.js` - Admin GitHub routes

**Features**:
- OAuth 2.0 flow with GitHub
- Automatic user creation in `GitHubUser` collection
- Scope: `user:email` for accessing user email
- Separate flows for users and admins

**Routes**:
- User: `/auth/github` (initiate), `/auth/github/callback` (callback)
- Admin: `/auth/admin/github` (initiate), `/auth/admin/github/callback` (callback)

**Environment Variables Required**:
```env
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:5000/auth/github/callback
GITHUB_ADMIN_CALLBACK_URL=http://localhost:5000/auth/admin/github/callback
```

**Models**:
- `GitHubUser` - Stores GitHub-authenticated users

---

### 3. Facebook OAuth (Referenced but Not Fully Implemented)

**Status**: Package installed but not configured in backend routes.

**Implementation**:
- **Backend Package**: `passport-facebook` (v3.0.0)
- **Frontend Reference**: `Login.jsx` contains a `handleFacebookLogin` function that redirects to `/auth/facebook`

**Note**: The Facebook OAuth route handler is not implemented in the backend. The frontend button exists but will result in a 404 error.

**To Implement**:
1. Create Facebook app at [Facebook Developers](https://developers.facebook.com/)
2. Configure Passport Facebook strategy in `backend/config/passport.js`
3. Add routes in `backend/routes/authRoutes.js`
4. Add environment variables:
   ```env
   FACEBOOK_APP_ID=your_facebook_app_id
   FACEBOOK_APP_SECRET=your_facebook_app_secret
   FACEBOOK_CALLBACK_URL=http://localhost:5000/auth/facebook/callback
   ```

---

### 4. Local Authentication (Email/Password)

**Purpose**: Traditional email and password authentication.

**Implementation**:
- **Backend**: Custom implementation using `bcryptjs` for password hashing
- **JWT**: `jsonwebtoken` (v9.0.2) for token generation
- **Files**:
  - `backend/controllers/loginController.js`
  - `backend/controllers/signupController.js`
  - `backend/controllers/authController.js`

**Features**:
- Password hashing with bcrypt (10 salt rounds)
- JWT token generation (1-day expiration)
- Account status checking (active/inactive)
- Session tracking via `Session` model
- Default role assignment: "counselor"

**Routes**:
- `/api/auth/signup` - User registration
- `/api/auth/login` - User login
- `/api/auth/logout` - User logout
- `/api/auth/me` - Get current user info

**Models**:
- `User` - Stores local authentication users

---

## Cloud Storage Integrations

### 5. Google Drive API

**Purpose**: Upload counseling session records as PDF files to users' Google Drive.

**Implementation**:
- **Backend Package**: `googleapis` (v164.1.0)
- **Configuration Files**:
  - `backend/config/googleDrive.js` - Drive client initialization
  - `backend/config/googleDriveAuthController.js` - OAuth flow for Drive
  - `backend/config/google-service-account.json` - Service account credentials (optional)
  - `backend/config/googleTokenStore.js` - Token persistence

**Features**:
- OAuth 2.0 flow for Drive access
- Scope: `https://www.googleapis.com/auth/drive.file` (limited to files created by the app)
- PDF generation and upload from `recordController.js`
- Automatic file naming: `{CounselorName}_{ClientName}_record_{TrackingNumber}.pdf`
- Two-page PDF format:
  - Page 1: Summary Statistics
  - Page 2: Detailed Records
- Header and footer on each page
- Document tracking number generation

**Routes**:
- `/auth/drive` - Initiate Google Drive OAuth
- `/auth/drive/callback` - Handle OAuth callback

**Environment Variables Required**:
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:5000/auth/drive/callback
GOOGLE_REFRESH_TOKEN=your_refresh_token (optional, for service account)
```

**Usage Flow**:
1. User clicks "Connect Google Drive" button on RecordsPage
2. Redirects to Google OAuth consent screen
3. User grants permissions
4. Callback stores tokens in memory
5. When saving a record, PDF is generated and uploaded to Drive
6. Success/error messages displayed to user

**Files Using Integration**:
- `backend/controllers/recordController.js` - PDF generation and upload logic
- `frontend/src/pages/RecordsPage.jsx` - UI for Drive connection

---

## Email Service Integration

### 6. Nodemailer (Gmail SMTP)

**Purpose**: Send password reset codes via email.

**Implementation**:
- **Backend Package**: `nodemailer` (v7.0.10)
- **Configuration File**: `backend/controllers/resetController.js`

**Features**:
- Gmail SMTP service integration
- 6-digit reset code generation
- 10-minute expiration for reset codes
- HTML/text email support
- Secure credential management via environment variables

**Routes**:
- `/api/reset/forgot-password` - Request password reset
- `/api/reset/reset-password` - Verify code and reset password

**Environment Variables Required**:
```env
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_gmail_app_password
```

**Email Template**:
```
Subject: Password Reset Code
Body: Your password reset code is: {6-digit-code}. It will expire in 10 minutes.
```

**Security Notes**:
- Use Gmail App Password (not regular password) for `EMAIL_PASS`
- Enable 2-factor authentication on Gmail account
- Reset codes expire after 10 minutes
- Codes are single-use (cleared after successful reset)

---

## Security Integrations

### 7. Google reCAPTCHA v2

**Purpose**: Prevent bot attacks and spam on login forms.

**Implementation**:
- **Frontend Package**: `react-google-recaptcha` (v3.1.0)
- **Backend**: Custom verification via Google API
- **Configuration Files**:
  - `frontend/src/pages/Login.jsx` - reCAPTCHA widget
  - `backend/controllers/admin/adminLoginController.js` - Server-side verification

**Features**:
- reCAPTCHA v2 "I'm not a robot" checkbox
- Server-side token verification
- Required for admin login
- Optional for regular user login (frontend present, backend verification may vary)

**Routes Using reCAPTCHA**:
- `/api/admin/login` - Admin login (verified)
- `/api/auth/login` - User login (frontend widget present)

**Environment Variables Required**:
```env
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
```

**Frontend Configuration**:
```javascript
SITE_KEY = "6Lf-8vErAAAAAGohFk-EE6OaLY60jkwo1gTH05B7"
```

**Verification Endpoint**:
```
POST https://www.google.com/recaptcha/api/siteverify
```

---

### 8. JSON Web Tokens (JWT)

**Purpose**: Secure authentication token management.

**Implementation**:
- **Backend Package**: `jsonwebtoken` (v9.0.2)
- **Frontend Package**: `jwt-decode` (v4.0.0)
- **Usage**: All authentication flows generate JWT tokens

**Features**:
- Token expiration: 1 day
- Payload includes: `{ id, role }`
- Stored in localStorage on frontend
- Sent via `Authorization: Bearer {token}` header
- Token refresh mechanism for admins

**Environment Variables Required**:
```env
JWT_SECRET=your_jwt_secret_key
```

**Token Structure**:
```json
{
  "id": "user_mongodb_id",
  "role": "counselor|admin|user",
  "iat": 1234567890,
  "exp": 1234654290
}
```

---

### 9. Session Management

**Purpose**: Manage user sessions for OAuth flows and track active sessions.

**Implementation**:
- **Backend Packages**: 
  - `express-session` (v1.18.2)
  - `connect-mongo` (v5.1.0) - MongoDB session store
  - `cookie-session` (v2.1.1)
- **Configuration**: `backend/app.js`
- **Model**: `Session` - Tracks user sessions

**Features**:
- Session storage in MongoDB
- Cookie-based session management
- 7-day session expiration
- Session tracking for security and analytics
- Automatic session creation on login

**Configuration**:
```javascript
{
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // true for HTTPS
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}
```

**Environment Variables Required**:
```env
SESSION_SECRET=your_session_secret_key
MONGO_URI=your_mongodb_connection_string
```

---

## Database Integration

### 10. MongoDB

**Purpose**: Primary database for all application data.

**Implementation**:
- **Backend Package**: `mongoose` (v8.19.2)
- **Configuration File**: `backend/config/db.js`
- **ODM**: Mongoose for schema definition and queries

**Features**:
- Connection pooling
- Schema validation
- Middleware hooks (pre-save, post-save)
- Indexing for performance
- Transaction support

**Models**:
- `User` - Local authentication users
- `Admin` - Admin accounts
- `GoogleUser` - Google OAuth users
- `GitHubUser` - GitHub OAuth users
- `Record` - Counseling session records
- `Session` - User session tracking
- `Notification` - Admin notifications
- `SessionSettings` - Session configuration
- `Report` - Report data

**Environment Variables Required**:
```env
MONGO_URI=mongodb://localhost:27017/counseling_db
# or
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
```

**Connection**:
- Automatic reconnection on failure
- Error handling and logging
- Connection status monitoring

---

## PDF Generation Libraries

### 11. PDFKit (Backend)

**Purpose**: Generate PDF files for counseling records on the server.

**Implementation**:
- **Backend Package**: `pdfkit` (v0.17.2)
- **Usage**: `backend/controllers/recordController.js`

**Features**:
- Multi-page PDF generation
- Header and footer on each page
- Custom fonts and styling
- Text wrapping and formatting
- Document tracking numbers
- Automatic page breaks
- Color support (RGB format)

**PDF Structure**:
- **Page 1**: Summary Statistics
  - Client information
  - Session overview
  - Key metrics
- **Page 2**: Detailed Records
  - Full session details
  - Notes and outcomes
  - Counselor information

**File Naming**:
```
{CounselorName}_{ClientName}_record_{TrackingNumber}.pdf
```

---

### 12. jsPDF & jsPDF-AutoTable (Frontend)

**Purpose**: Generate PDF reports on the client side.

**Implementation**:
- **Frontend Packages**: 
  - `jspdf` (v3.0.3)
  - `jspdf-autotable` (v5.0.2)
- **Usage**: `frontend/src/pages/ReportsPage.jsx`

**Features**:
- Client-side PDF generation
- Table formatting with AutoTable
- Custom styling
- Download functionality
- Report filtering and export

**Usage**:
- Generate filtered reports
- Export session data
- Download as PDF file

---

## Frontend Libraries & Services

### 13. Framer Motion

**Purpose**: Animation and UI transitions.

**Implementation**:
- **Frontend Package**: `framer-motion` (v12.23.24)
- **Usage**: All major pages (Dashboard, RecordsPage, ReportsPage, Admin pages)

**Features**:
- Page transitions
- Component animations
- Loading states
- Modal animations
- Smooth user experience

---

### 14. Axios

**Purpose**: HTTP client for API requests.

**Implementation**:
- **Backend Package**: `axios` (v1.12.2)
- **Frontend Package**: `axios` (v1.13.2)

**Features**:
- Promise-based requests
- Request/response interceptors
- Error handling
- Automatic JSON parsing
- CORS support

---

### 15. React Router DOM

**Purpose**: Client-side routing and navigation.

**Implementation**:
- **Frontend Package**: `react-router-dom` (v7.9.4)

**Features**:
- Declarative routing
- Protected routes
- Navigation guards
- URL parameter handling
- Query string support

---

## Configuration Requirements

### Environment Variables Summary

Create a `.env` file in the `backend` directory with the following variables:

```env
# Server Configuration
PORT=5000
CLIENT_URL=http://localhost:5173

# Database
MONGO_URI=mongodb://localhost:27017/counseling_db

# JWT & Sessions
JWT_SECRET=your_jwt_secret_key
SESSION_SECRET=your_session_secret_key

# Google OAuth (User & Admin)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback
GOOGLE_ADMIN_CALLBACK_URL=http://localhost:5000/auth/admin/google/callback

# Google Drive
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:5000/auth/drive/callback
GOOGLE_REFRESH_TOKEN=your_refresh_token (optional)

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:5000/auth/github/callback
GITHUB_ADMIN_CALLBACK_URL=http://localhost:5000/auth/admin/github/callback

# Email Service (Gmail)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password

# reCAPTCHA
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
```

### Frontend Environment Variables

Create a `.env` file in the `frontend` directory (if needed):

```env
VITE_API_URL=http://localhost:5000
```

---

## Integration Flow Diagrams

### Google OAuth Flow (User)
```
User clicks "Sign in with Google"
  ↓
Redirect to Google OAuth consent screen
  ↓
User grants permissions
  ↓
Google redirects to /auth/google/callback
  ↓
Backend creates/updates GoogleUser
  ↓
Generate JWT token
  ↓
Redirect to frontend with token
  ↓
Frontend stores token and redirects to Dashboard
```

### Google Drive Upload Flow
```
User clicks "Connect Google Drive"
  ↓
Redirect to Google Drive OAuth
  ↓
User grants Drive permissions
  ↓
Tokens stored in memory
  ↓
User saves a record
  ↓
Generate PDF using PDFKit
  ↓
Upload to Google Drive via Drive API
  ↓
Display success/error message
```

### Password Reset Flow
```
User requests password reset
  ↓
Generate 6-digit code
  ↓
Store code in User model (10-min expiry)
  ↓
Send email via Nodemailer (Gmail SMTP)
  ↓
User enters code and new password
  ↓
Verify code and update password
  ↓
Clear reset code
```

---

## Security Considerations

1. **OAuth Tokens**: Stored securely, never exposed to frontend
2. **JWT Tokens**: Short expiration (1 day), stored in httpOnly cookies (recommended)
3. **Password Hashing**: bcrypt with 10 salt rounds
4. **reCAPTCHA**: Server-side verification required
5. **Environment Variables**: Never commit to version control
6. **CORS**: Configured for specific origins only
7. **Session Management**: Secure cookies, MongoDB storage
8. **Email Credentials**: Use App Passwords, not regular passwords

---

## Troubleshooting

### Common Issues

1. **Google OAuth Not Working**
   - Verify callback URLs match Google Cloud Console
   - Check environment variables
   - Ensure OAuth consent screen is configured

2. **Google Drive Upload Fails**
   - Verify Drive API is enabled in Google Cloud Console
   - Check OAuth tokens are valid
   - Ensure correct scopes are requested

3. **Email Not Sending**
   - Verify Gmail App Password is correct
   - Check 2FA is enabled on Gmail account
   - Verify SMTP settings

4. **reCAPTCHA Verification Fails**
   - Check secret key matches site key
   - Verify domain is registered in reCAPTCHA console
   - Check network connectivity to Google API

5. **MongoDB Connection Issues**
   - Verify connection string format
   - Check network access
   - Ensure MongoDB is running

---

## API Endpoints Summary

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - Google OAuth callback
- `GET /auth/github` - Initiate GitHub OAuth
- `GET /auth/github/callback` - GitHub OAuth callback

### Admin Authentication
- `POST /api/admin/signup` - Admin registration
- `POST /api/admin/login` - Admin login (with reCAPTCHA)
- `GET /auth/admin/google` - Admin Google OAuth
- `GET /auth/admin/google/callback` - Admin Google callback
- `GET /auth/admin/github` - Admin GitHub OAuth
- `GET /auth/admin/github/callback` - Admin GitHub callback

### Google Drive
- `GET /auth/drive` - Initiate Drive OAuth
- `GET /auth/drive/callback` - Drive OAuth callback

### Password Reset
- `POST /api/reset/forgot-password` - Request reset code
- `POST /api/reset/reset-password` - Reset password with code

### Records
- `GET /api/records` - Get all records
- `POST /api/records` - Create record
- `PUT /api/records/:id` - Update record
- `DELETE /api/records/:id` - Delete record
- `POST /api/records/:id/upload-drive` - Upload record to Drive

---

## Version Information

- **Node.js**: Recommended v18+ or v20+
- **MongoDB**: v6.0+
- **React**: v19.1.1
- **Express**: v5.1.0
- **Mongoose**: v8.19.2

---

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Drive API Documentation](https://developers.google.com/drive/api)
- [GitHub OAuth Documentation](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)
- [Passport.js Documentation](http://www.passportjs.org/)
- [Nodemailer Documentation](https://nodemailer.com/about/)
- [reCAPTCHA Documentation](https://developers.google.com/recaptcha)
- [MongoDB Documentation](https://www.mongodb.com/docs/)
- [PDFKit Documentation](https://pdfkit.org/)

---

**Last Updated**: 2024
**Document Version**: 1.0

