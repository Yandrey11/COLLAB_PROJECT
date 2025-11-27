# User Profile Settings Module Documentation

## Module Description

The **User Profile Settings Module** is a comprehensive profile management system designed exclusively for counselors in the counseling record-keeping system. This module provides counselors with secure access to view and update their personal information, manage security settings, upload profile pictures, and view their account activity logs.

### Key Features

- **Role-Based Access Control**: Only authenticated counselors can access their profile settings
- **Secure Profile Management**: View and update personal information (name, email, phone, bio)
- **Password Management**: Change password with strong validation
- **Profile Picture Management**: Upload and remove profile pictures with file validation
- **Activity Logging**: Comprehensive activity tracking for security and auditing
- **Separation of Concerns**: Clear separation between counselor frontend logic and backend API

---

## Counselor-Facing Features

### 1. Profile Information Tab

**Features:**
- View current profile information (name, email, phone number, bio)
- Update personal information with real-time validation
- Profile picture upload/removal with preview
- Character counter for bio field (500 character limit)
- Form validation with error messages

**User Actions:**
- Edit name, email, phone number, and bio
- Upload new profile picture (JPEG, PNG, GIF, WebP, max 5MB)
- Remove existing profile picture
- Cancel changes or save updates

### 2. Change Password Tab

**Features:**
- Change password with current password verification
- Strong password validation (8+ chars, uppercase, lowercase, number, special char)
- Password confirmation matching
- Special handling for Google-authenticated users (redirect to Google account settings)
- Secure password hashing using bcrypt

**User Actions:**
- Enter current password for verification
- Enter and confirm new password
- Receive validation feedback
- Success/error notifications

### 3. Activity Logs Tab

**Features:**
- View comprehensive account activity history
- Paginated activity logs (20 per page)
- Activity type icons and descriptions
- Timestamp formatting
- Filter by activity type

**Tracked Activities:**
- Profile viewed
- Profile updated
- Password changed
- Profile picture uploaded/removed
- Account activity viewed
- Email/name updated
- Login/logout events

---

## Backend API Endpoints

All endpoints require authentication via JWT token in the `Authorization: Bearer <token>` header.

### Base URL
```
/api/profile
```

### 1. Get Profile

**Endpoint:** `GET /api/profile`

**Description:** Retrieve the authenticated counselor's profile information.

**Authentication:** Required (Bearer token)

**Authorization:** Counselor role only

**Request:**
```http
GET /api/profile
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "profile": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "counselor",
    "accountStatus": "active",
    "profilePicture": "/uploads/profiles/filename.jpg",
    "phoneNumber": "+1234567890",
    "bio": "Experienced counselor...",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "isGoogleUser": false
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: User is not a counselor
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server error

---

### 2. Update Profile

**Endpoint:** `PUT /api/profile`

**Description:** Update the authenticated counselor's profile information.

**Authentication:** Required (Bearer token)

**Authorization:** Counselor role only

**Request:**
```http
PUT /api/profile
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "+1234567890",
  "bio": "Updated bio text..."
}
```

**Validation Rules:**
- `name`: Required, string, 2-100 characters
- `email`: Required, valid email format, must be unique
- `phoneNumber`: Optional, string, max 20 characters, alphanumeric + special chars
- `bio`: Optional, string, max 500 characters

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "profile": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "bio": "Updated bio text...",
    "profilePicture": "/uploads/profiles/filename.jpg",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: User is not a counselor
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server error

---

### 3. Change Password

**Endpoint:** `POST /api/profile/password`

**Description:** Change the authenticated counselor's password.

**Authentication:** Required (Bearer token)

**Authorization:** Counselor role only

**Request:**
```http
POST /api/profile/password
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "currentPassword": "old_password123",
  "newPassword": "NewPassword123!"
}
```

**Validation Rules:**
- `currentPassword`: Required, must match existing password
- `newPassword`: Required, must meet password strength requirements:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character (!@#$%^&*)
  - Must be different from current password

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors or password doesn't meet requirements
- `401 Unauthorized`: Current password is incorrect or invalid token
- `403 Forbidden`: User is not a counselor
- `404 Not Found`: User not found (or password not set for Google users)
- `500 Internal Server Error`: Server error

**Special Cases:**
- Google-authenticated users receive `400 Bad Request` with message: "Google-authenticated users cannot change password here. Use Google account settings."

---

### 4. Upload Profile Picture

**Endpoint:** `POST /api/profile/picture`

**Description:** Upload a new profile picture for the authenticated counselor.

**Authentication:** Required (Bearer token)

**Authorization:** Counselor role only

**Request:**
```http
POST /api/profile/picture
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

profilePicture: <file>
```

**File Validation:**
- Allowed MIME types: `image/jpeg`, `image/jpg`, `image/png`, `image/gif`, `image/webp`
- Maximum file size: 5MB
- Old profile picture is automatically deleted if exists

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile picture uploaded successfully",
  "profilePicture": "/uploads/profiles/timestamp-userId-filename.jpg"
}
```

**Error Responses:**
- `400 Bad Request`: No file uploaded or invalid file type
- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: User is not a counselor
- `404 Not Found`: User not found
- `413 Payload Too Large`: File exceeds 5MB limit
- `500 Internal Server Error`: Server error or file upload failure

---

### 5. Remove Profile Picture

**Endpoint:** `DELETE /api/profile/picture`

**Description:** Remove the authenticated counselor's profile picture.

**Authentication:** Required (Bearer token)

**Authorization:** Counselor role only

**Request:**
```http
DELETE /api/profile/picture
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile picture removed successfully"
}
```

**Error Responses:**
- `400 Bad Request`: No profile picture to remove
- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: User is not a counselor
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server error

---

### 6. Get Activity Logs

**Endpoint:** `GET /api/profile/activity`

**Description:** Retrieve paginated activity logs for the authenticated counselor.

**Authentication:** Required (Bearer token)

**Authorization:** Counselor role only

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of logs per page (default: 20)

**Request:**
```http
GET /api/profile/activity?page=1&limit=20
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Activity logs retrieved successfully",
  "logs": [
    {
      "_id": "log_id",
      "userId": "user_id",
      "userEmail": "john@example.com",
      "userName": "John Doe",
      "activityType": "profile_updated",
      "description": "Updated profile: name, email",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "metadata": {
        "oldName": "John",
        "newName": "John Doe"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalLogs": 100,
    "hasMore": true
  }
}
```

**Activity Types:**
- `profile_viewed`
- `profile_updated`
- `password_changed`
- `profile_picture_uploaded`
- `profile_picture_removed`
- `account_activity_viewed`
- `email_updated`
- `name_updated`
- `login`
- `logout`

**Error Responses:**
- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: User is not a counselor
- `500 Internal Server Error`: Server error

---

## Data Validation

### Profile Data Validation

**Name:**
- Type: String
- Required: Yes
- Length: 2-100 characters
- Trimmed before storage

**Email:**
- Type: String
- Required: Yes
- Format: Valid email regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Case-insensitive (converted to lowercase)
- Must be unique across User and GoogleUser collections

**Phone Number:**
- Type: String
- Required: No (optional)
- Length: Max 20 characters
- Format: Alphanumeric + special chars (`/^[\d\s\-\+\(\)]+$/`)
- Can be null/empty

**Bio:**
- Type: String
- Required: No (optional)
- Length: Max 500 characters
- Can be null/empty

### Password Validation

**Current Password:**
- Required: Yes
- Must match existing hashed password in database

**New Password:**
- Required: Yes
- Minimum length: 8 characters
- Must contain:
  - At least one uppercase letter (A-Z)
  - At least one lowercase letter (a-z)
  - At least one number (0-9)
  - At least one special character (!@#$%^&*)
- Must be different from current password

### File Upload Validation

**Profile Picture:**
- Allowed MIME types:
  - `image/jpeg`
  - `image/jpg`
  - `image/png`
  - `image/gif`
  - `image/webp`
- Maximum file size: 5MB (5 * 1024 * 1024 bytes)
- Filename sanitization: Special characters replaced with underscores
- Storage location: `backend/uploads/profiles/`

---

## Security Handling

### 1. Authentication

**JWT Token Verification:**
- All endpoints require valid JWT token in `Authorization: Bearer <token>` header
- Token is verified using `protect` middleware
- Expired or invalid tokens result in `401 Unauthorized` response

### 2. Authorization

**Role-Based Access Control:**
- All profile endpoints check if user role is `"counselor"`
- Admin users are explicitly denied access to counselor profile endpoints
- Google users are supported but treated as counselors

**Implementation:**
```javascript
if (req.user.role !== "counselor") {
  return res.status(403).json({
    message: "Access denied. Only counselors can access this profile."
  });
}
```

### 3. Password Security

**Password Hashing:**
- Passwords are hashed using `bcrypt` with salt rounds of 10
- Hashing occurs automatically via Mongoose pre-save hook
- Plain text passwords are never stored in database

**Password Verification:**
- Current password is verified before allowing change
- Uses `bcrypt.compare()` for secure comparison
- Failed attempts are logged but don't expose password details

**Google Users:**
- Google-authenticated users cannot change password through this module
- They are redirected to use Google account settings

### 4. File Upload Security

**File Type Validation:**
- Only image MIME types are allowed
- File extension and MIME type are both validated
- Invalid files are rejected before storage

**File Size Limits:**
- Maximum 5MB file size enforced
- Large files are rejected to prevent DoS attacks

**File Storage:**
- Files stored in `backend/uploads/profiles/` directory
- Unique filenames prevent collisions: `timestamp-userId-filename.ext`
- Old profile pictures are automatically deleted when new ones are uploaded

**Path Traversal Prevention:**
- Filenames are sanitized before storage
- Only basename is used in file paths
- Full paths are never constructed from user input

### 5. Input Sanitization

**Email:**
- Converted to lowercase before storage
- Regex validation prevents injection
- Unique constraint prevents duplicates

**Name:**
- Trimmed to remove whitespace
- Length validation prevents overflow

**Phone Number:**
- Regex validation allows only safe characters
- Length limit prevents overflow

**File Names:**
- Special characters replaced with underscores
- Path traversal characters removed

### 6. Activity Logging

**Security Information Captured:**
- IP address (for security auditing)
- User agent (for fraud detection)
- Timestamp (for timeline analysis)
- Activity type (for pattern analysis)

**Privacy Considerations:**
- Activity logs are only accessible to the user themselves
- No sensitive data (passwords, tokens) is logged
- Metadata captures change details without exposing secrets

---

## Database Interactions

### Models

#### 1. User Model (`backend/models/User.js`)

**Schema Fields:**
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: String (enum: ["counselor", "admin"], default: "counselor"),
  accountStatus: String (enum: ["active", "inactive"], default: "active"),
  profilePicture: String (optional),
  phoneNumber: String (optional),
  bio: String (optional, maxlength: 500),
  googleId: String (optional),
  // ... other fields
  createdAt: Date,
  updatedAt: Date
}
```

**Methods:**
- `matchPassword(enteredPassword)`: Compare password with hashed version

**Pre-save Hook:**
- Automatically hashes password if modified

#### 2. GoogleUser Model (`backend/models/GoogleUser.js`)

**Schema Fields:**
- Similar to User model but for Google OAuth users
- No password field (uses Google authentication)
- Same profile fields: `profilePicture`, `phoneNumber`, `bio`

#### 3. ActivityLog Model (`backend/models/ActivityLog.js`)

**Schema Fields:**
```javascript
{
  userId: ObjectId (required, refPath: "userModel"),
  userModel: String (required, enum: ["User", "GoogleUser"]),
  userEmail: String (required),
  userName: String (required),
  activityType: String (required, enum: [activity types]),
  description: String (required),
  ipAddress: String (optional),
  userAgent: String (optional),
  metadata: Map (optional),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `userId + createdAt`: For efficient user activity queries
- `userEmail + createdAt`: For email-based queries
- `activityType + createdAt`: For activity type filtering

### Database Operations

#### Profile Retrieval

**Query:**
```javascript
const { user, userModel } = await findUserById(req.user._id);
```

**Implementation:**
- Checks User collection first
- Falls back to GoogleUser collection
- Returns user object and model type

#### Profile Update

**Update Operation:**
```javascript
Object.assign(user, updates);
await saveUser(user, userModel);
```

**Validation:**
- Email uniqueness check across both User and GoogleUser collections
- Field-by-field validation before update
- Only modified fields are updated

#### Password Change

**Update Operation:**
```javascript
user.password = newPassword;
await saveUser(user, userModel);
```

**Process:**
1. Verify current password using `bcrypt.compare()`
2. Validate new password strength
3. Hash new password via pre-save hook
4. Save updated user

#### Activity Log Creation

**Insert Operation:**
```javascript
await ActivityLog.create({
  userId: user._id,
  userModel: user.googleId ? "GoogleUser" : "User",
  // ... other fields
});
```

**Error Handling:**
- Activity log failures don't break main operations
- Errors are logged but not thrown

---

## Error/Success Responses

### Success Response Format

All successful responses follow this format:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ }
}
```

### Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

### HTTP Status Codes

| Status Code | Meaning | Use Cases |
|------------|---------|-----------|
| 200 | OK | Successful GET, PUT, DELETE operations |
| 201 | Created | Successful POST operations (profile creation) |
| 400 | Bad Request | Validation errors, invalid input |
| 401 | Unauthorized | Invalid/expired token, incorrect password |
| 403 | Forbidden | Role-based access denied |
| 404 | Not Found | User not found, resource doesn't exist |
| 413 | Payload Too Large | File exceeds size limit |
| 500 | Internal Server Error | Server errors, database failures |

### Common Error Messages

**Authentication Errors:**
- `"Not authorized, no token"`: Missing Authorization header
- `"Invalid or expired token"`: Token verification failed
- `"User not found"`: User doesn't exist in database

**Authorization Errors:**
- `"Access denied. Only counselors can access this profile."`: Non-counselor trying to access
- `"Access denied. Only counselors can update their profile."`: Role mismatch

**Validation Errors:**
- `"Name must be between 2 and 100 characters"`
- `"Invalid email format"`
- `"Email already in use by another account"`
- `"Bio must be 500 characters or less"`
- `"New password does not meet security requirements"`

**Operation-Specific Errors:**
- `"Current password is incorrect"`
- `"New password must be different from current password"`
- `"No file uploaded"`
- `"Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."`
- `"No profile picture to remove"`

---

## Integration Steps

### Backend Setup

1. **Install Dependencies:**
```bash
cd backend
npm install multer@^1.4.5-lts.1
```

2. **Create Uploads Directory:**
```bash
mkdir -p uploads/profiles
```

3. **Environment Variables:**
No additional environment variables required (uses existing JWT_SECRET)

4. **Verify Routes:**
Routes are automatically registered in `backend/app.js`:
```javascript
app.use("/api/profile", profileRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
```

### Frontend Setup

1. **Route Registration:**
Route is already added to `frontend/src/App.jsx`:
```javascript
<Route path="/profile" element={<ProfilePage />} />
```

2. **Navigation:**
Link to profile page from Dashboard:
```javascript
<button onClick={() => navigate("/profile")}>
  User Profile & Settings
</button>
```

### Testing

1. **Test Profile Retrieval:**
```bash
curl -X GET http://localhost:5000/api/profile \
  -H "Authorization: Bearer <token>"
```

2. **Test Profile Update:**
```bash
curl -X PUT http://localhost:5000/api/profile \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name", "email": "new@example.com"}'
```

3. **Test Password Change:**
```bash
curl -X POST http://localhost:5000/api/profile/password \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword": "old123", "newPassword": "NewPass123!"}'
```

---

## Frontend-Backend Separation

### Frontend Responsibilities

- **UI Rendering**: Profile forms, tabs, activity logs display
- **Client-Side Validation**: Immediate feedback on input fields
- **File Preview**: Image preview before upload
- **State Management**: Form state, loading states, error states
- **API Communication**: Axios requests with authentication headers
- **User Feedback**: SweetAlert2 notifications for success/error

### Backend Responsibilities

- **Authentication**: JWT token verification
- **Authorization**: Role-based access control
- **Data Validation**: Server-side validation for security
- **Database Operations**: CRUD operations on User/GoogleUser/ActivityLog
- **File Handling**: Multer middleware for file uploads
- **Security**: Password hashing, file validation, input sanitization
- **Activity Logging**: Automatic logging of all user actions

### Clear Separation Points

1. **Validation**: Frontend validates for UX, backend validates for security
2. **File Handling**: Frontend sends FormData, backend processes with Multer
3. **Authentication**: Frontend sends token, backend verifies and authorizes
4. **Error Handling**: Frontend displays errors, backend returns structured errors
5. **Activity Logging**: Backend automatically logs, frontend only displays

---

## Security Considerations Summary

1. ✅ **Authentication**: JWT token verification on all endpoints
2. ✅ **Authorization**: Role-based access control (counselors only)
3. ✅ **Password Security**: bcrypt hashing with salt rounds
4. ✅ **File Upload Security**: Type validation, size limits, sanitization
5. ✅ **Input Validation**: Server-side validation for all inputs
6. ✅ **SQL Injection Prevention**: Mongoose ORM prevents injection
7. ✅ **XSS Prevention**: Input sanitization, no HTML rendering
8. ✅ **Path Traversal Prevention**: Filename sanitization
9. ✅ **Activity Logging**: Comprehensive security audit trail
10. ✅ **Error Handling**: No sensitive information in error messages (production)

---

## Conclusion

The User Profile Settings Module provides a secure, comprehensive profile management system for counselors with clear separation between frontend and backend responsibilities. All security best practices are implemented, including role-based access control, password hashing, file upload validation, and comprehensive activity logging.

