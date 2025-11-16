# Admin User Management System - Complete Documentation

## Table of Contents
1. [UI/UX Layout Recommendations](#uiux-layout-recommendations)
2. [API Routes and Request/Response Structures](#api-routes-and-requestresponse-structures)
3. [Database Tables and Relationships](#database-tables-and-relationships)
4. [Validation Rules](#validation-rules)
5. [Security Considerations](#security-considerations)
6. [Test Cases](#test-cases)
7. [Error Handling Guidelines](#error-handling-guidelines)
8. [Implementation Steps](#implementation-steps)

---

## UI/UX Layout Recommendations

### Page Structure
```
┌─────────────────────────────────────────────────┐
│ Header: Back Button | Title | Add New User Btn │
├─────────────────────────────────────────────────┤
│ Search & Filter Bar                             │
│ [Search Input] [Role Filter] [Status Filter]   │
│ [Search] [Reset]                                │
├─────────────────────────────────────────────────┤
│ Users Table                                     │
│ ┌───────────────────────────────────────────┐ │
│ │ Name | Email | Role | Status | Date | Act│ │
│ ├───────────────────────────────────────────┤ │
│ │ User 1 | ... | ... | ... | ... | [Actions]│ │
│ └───────────────────────────────────────────┘ │
│ Pagination: [Prev] Page X of Y [Next]          │
└─────────────────────────────────────────────────┘
```

### Modal Layouts

#### Add User Modal
- Full Name input (required)
- Email input (required, validated)
- Password input (required, min 6 chars)
- Role dropdown (User/Counselor/Admin)
- Create/Cancel buttons

#### Edit User Modal
- Full Name input (required)
- Email input (required, validated)
- Role dropdown (User/Counselor/Admin)
- Account Status dropdown (Active/Inactive)
- Update/Cancel buttons

#### Reset Password Modal
- New Password input (required, min 6 chars)
- Confirm Password input (required, must match)
- Reset/Cancel buttons

### Design Principles
- **Consistent spacing**: 16px, 20px, 24px padding
- **Color scheme**: 
  - Primary: #4f46e5 (Indigo)
  - Success: #10b981 (Green)
  - Error: #ef4444 (Red)
  - Warning: #f59e0b (Amber)
- **Typography**: Montserrat font family
- **Responsive**: Mobile-friendly with flex-wrap
- **Accessibility**: Clear labels, error messages, keyboard navigation

---

## API Routes and Request/Response Structures

### Base URL
```
http://localhost:5000/api/admin
```

### Authentication
All routes require Bearer token in Authorization header:
```
Authorization: Bearer <admin_token>
```

### 1. Get All Users
**Endpoint:** `GET /api/admin/users`

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `search` (string, optional) - Search by name or email
- `role` (string, optional) - Filter: "all" | "admin" | "counselor" | "user"
- `status` (string, optional) - Filter: "all" | "active" | "inactive"

**Response:**
```json
{
  "users": [
    {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "counselor",
      "accountStatus": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "totalPages": 5,
  "currentPage": 1,
  "total": 47
}
```

### 2. Create New User
**Endpoint:** `POST /api/admin/users`

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "securePassword123",
  "role": "counselor"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "user_id",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "counselor",
    "accountStatus": "active"
  }
}
```

### 3. Update User
**Endpoint:** `PUT /api/admin/users/:userId`

**Request Body:**
```json
{
  "name": "Jane Smith Updated",
  "email": "jane.updated@example.com",
  "role": "admin",
  "accountStatus": "active"
}
```

**Response:**
```json
{
  "message": "User updated successfully",
  "user": {
    "id": "user_id",
    "name": "Jane Smith Updated",
    "email": "jane.updated@example.com",
    "role": "admin",
    "accountStatus": "active"
  }
}
```

### 4. Toggle User Status
**Endpoint:** `PATCH /api/admin/users/:userId/status`

**Request Body:** (empty)

**Response:**
```json
{
  "message": "User account activated successfully",
  "user": {
    "id": "user_id",
    "email": "jane@example.com",
    "accountStatus": "active"
  }
}
```

### 5. Delete User
**Endpoint:** `DELETE /api/admin/users/:userId`

**Response:**
```json
{
  "message": "User deleted successfully",
  "deletedUserId": "user_id"
}
```

### 6. Reset User Password
**Endpoint:** `POST /api/admin/users/:userId/reset-password`

**Request Body:**
```json
{
  "newPassword": "newSecurePassword123"
}
```

**Response:**
```json
{
  "message": "Password reset successfully. User will need to use the new password on next login.",
  "userId": "user_id"
}
```

---

## Database Tables and Relationships

### User Schema
```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: String (enum: ["user", "counselor", "admin"], default: "user"),
  accountStatus: String (enum: ["active", "inactive"], default: "active"),
  googleId: String (optional),
  resetPasswordCode: String (optional),
  resetPasswordExpires: Date (optional),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

### Indexes
- `email`: Unique index
- `role`: Index for filtering
- `accountStatus`: Index for filtering
- `createdAt`: Index for sorting

### Relationships
- **User → Session**: One-to-Many (User can have multiple sessions)
- **User → Notification**: One-to-Many (User can receive multiple notifications)
- **Admin → User**: Many-to-Many (Admin can manage multiple users)

---

## Validation Rules

### Frontend Validation

#### Name
- Required
- Minimum 1 character
- Maximum 100 characters
- Trim whitespace

#### Email
- Required
- Valid email format (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- Maximum 255 characters
- Case-insensitive

#### Password
- Required (for create/reset)
- Minimum 6 characters
- No maximum (but recommend 128 for security)

#### Role
- Required
- Must be one of: "user", "counselor", "admin"

#### Account Status
- Required (for edit)
- Must be one of: "active", "inactive"

### Backend Validation

#### Create User
```javascript
- name: required, string, min 1, max 100
- email: required, valid email format, unique
- password: required, min 6 characters
- role: optional, must be in ["user", "counselor", "admin"]
```

#### Update User
```javascript
- name: optional, string, min 1, max 100
- email: optional, valid email format, unique (excluding current user)
- role: optional, must be in ["user", "counselor", "admin"]
- accountStatus: optional, must be in ["active", "inactive"]
```

#### Reset Password
```javascript
- newPassword: required, min 6 characters
```

### Error Messages
- **400 Bad Request**: Validation errors, duplicate email
- **403 Forbidden**: Account inactive, unauthorized access
- **404 Not Found**: User not found
- **500 Internal Server Error**: Server errors

---

## Security Considerations

### Authentication & Authorization
1. **Admin-only access**: All routes protected with `protectAdmin` middleware
2. **JWT tokens**: Bearer token authentication
3. **Role verification**: Backend checks admin role on every request
4. **Self-protection**: Admins cannot deactivate/delete their own account

### Password Security
1. **Hashing**: Passwords hashed using bcrypt (salt rounds: 10)
2. **No plaintext storage**: Passwords never stored in plaintext
3. **Password reset**: Admin-initiated resets require new password
4. **Minimum length**: 6 characters enforced

### Data Protection
1. **Input sanitization**: All inputs validated and sanitized
2. **SQL injection prevention**: Using Mongoose (NoSQL injection protection)
3. **XSS prevention**: React automatically escapes user input
4. **CSRF protection**: JWT tokens in Authorization header

### Account Status
1. **Inactive users**: Cannot log in (checked in login controllers)
2. **Session termination**: Inactive users' sessions should be terminated
3. **Audit trail**: All actions logged via notifications

### Best Practices
1. **Rate limiting**: Consider implementing rate limiting on sensitive endpoints
2. **Logging**: Log all admin actions for audit purposes
3. **Encryption**: Use HTTPS in production
4. **Token expiration**: JWT tokens expire after 1 day

---

## Test Cases

### Unit Tests

#### User Controller Tests
```javascript
describe('User Management Controller', () => {
  describe('getAllUsers', () => {
    it('should return paginated users', async () => {});
    it('should filter by role', async () => {});
    it('should filter by status', async () => {});
    it('should search by name/email', async () => {});
    it('should require admin authentication', async () => {});
  });

  describe('createUser', () => {
    it('should create user with valid data', async () => {});
    it('should reject duplicate email', async () => {});
    it('should validate email format', async () => {});
    it('should validate password length', async () => {});
    it('should hash password', async () => {});
  });

  describe('updateUser', () => {
    it('should update user information', async () => {});
    it('should reject duplicate email', async () => {});
    it('should validate role', async () => {});
    it('should return 404 for non-existent user', async () => {});
  });

  describe('toggleUserStatus', () => {
    it('should activate inactive user', async () => {});
    it('should deactivate active user', async () => {});
    it('should prevent self-deactivation', async () => {});
    it('should return 404 for non-existent user', async () => {});
  });

  describe('deleteUser', () => {
    it('should delete user', async () => {});
    it('should prevent self-deletion', async () => {});
    it('should return 404 for non-existent user', async () => {});
  });

  describe('resetUserPassword', () => {
    it('should reset password', async () => {});
    it('should validate password length', async () => {});
    it('should hash new password', async () => {});
    it('should return 404 for non-existent user', async () => {});
  });
});
```

#### Frontend Component Tests
```javascript
describe('UserManagement Component', () => {
  it('should render user list', () => {});
  it('should open add user modal', () => {});
  it('should validate form inputs', () => {});
  it('should filter users by role', () => {});
  it('should filter users by status', () => {});
  it('should search users', () => {});
  it('should handle pagination', () => {});
  it('should show error messages', () => {});
  it('should show success messages', () => {});
});
```

### Integration Tests

#### API Integration Tests
```javascript
describe('User Management API Integration', () => {
  it('should create, read, update, delete user flow', async () => {
    // 1. Create user
    // 2. Verify user appears in list
    // 3. Update user
    // 4. Verify changes
    // 5. Delete user
    // 6. Verify deletion
  });

  it('should handle activate/deactivate flow', async () => {
    // 1. Create user
    // 2. Deactivate user
    // 3. Verify user cannot login
    // 4. Activate user
    // 5. Verify user can login
  });

  it('should handle password reset flow', async () => {
    // 1. Create user
    // 2. Reset password
    // 3. Verify old password doesn't work
    // 4. Verify new password works
  });
});
```

### E2E Tests
```javascript
describe('User Management E2E', () => {
  it('should complete full user management workflow', async () => {
    // 1. Login as admin
    // 2. Navigate to user management
    // 3. Create new user
    // 4. Edit user
    // 5. Deactivate user
    // 6. Reset password
    // 7. Delete user
  });
});
```

---

## Error Handling Guidelines

### Frontend Error Handling

#### API Errors
```javascript
try {
  const response = await axios.post('/api/admin/users', userData);
  // Success handling
} catch (error) {
  if (error.response) {
    // Server responded with error
    const message = error.response.data.message || 'An error occurred';
    setMessage({ type: 'error', text: message });
  } else if (error.request) {
    // Request made but no response
    setMessage({ type: 'error', text: 'Network error. Please try again.' });
  } else {
    // Something else happened
    setMessage({ type: 'error', text: 'An unexpected error occurred.' });
  }
}
```

#### Form Validation Errors
- Display inline errors below each field
- Highlight invalid fields with red border
- Prevent form submission until valid

#### User Feedback
- Success messages: Green background, auto-dismiss after 3 seconds
- Error messages: Red background, persist until user action
- Loading states: Show spinner/disabled state during operations

### Backend Error Handling

#### Standard Error Responses
```javascript
// 400 Bad Request
res.status(400).json({ message: "Validation error message" });

// 403 Forbidden
res.status(403).json({ message: "Access denied" });

// 404 Not Found
res.status(404).json({ message: "User not found" });

// 500 Internal Server Error
res.status(500).json({ message: "Error message" });
```

#### Error Logging
```javascript
try {
  // Operation
} catch (error) {
  console.error("❌ Error description:", error);
  // Log to error tracking service (e.g., Sentry)
  res.status(500).json({ message: "Error message" });
}
```

#### Validation Error Format
```javascript
{
  "message": "Validation failed",
  "errors": {
    "email": "Email already exists",
    "password": "Password must be at least 6 characters"
  }
}
```

---

## Implementation Steps

### Backend Implementation

#### Step 1: Update User Model
- [x] Add `accountStatus` field to User schema
- [x] Set default value to "active"
- [x] Add enum validation

#### Step 2: Create Controllers
- [x] Create `userManagementController.js`
- [x] Implement `getAllUsers`
- [x] Implement `createUser`
- [x] Implement `updateUser`
- [x] Implement `toggleUserStatus`
- [x] Implement `deleteUser`
- [x] Implement `resetUserPassword`

#### Step 3: Create Routes
- [x] Create `userManagementRoutes.js`
- [x] Add all CRUD routes
- [x] Apply `protectAdmin` middleware
- [x] Register routes in `app.js`

#### Step 4: Update Login Controllers
- [x] Add account status check in `loginController.js`
- [x] Add account status check in `authController.js`

#### Step 5: Testing
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Test all endpoints manually

### Frontend Implementation

#### Step 1: Component Structure
- [x] Create UserManagement component
- [x] Set up state management
- [x] Implement admin verification

#### Step 2: User List Display
- [x] Create users table
- [x] Display all required fields
- [x] Add pagination
- [x] Add loading states

#### Step 3: Search & Filter
- [x] Implement search by name/email
- [x] Implement role filter
- [x] Implement status filter
- [x] Add reset functionality

#### Step 4: CRUD Operations
- [x] Create Add User modal
- [x] Create Edit User modal
- [x] Implement create user
- [x] Implement update user
- [x] Implement delete user
- [x] Implement toggle status

#### Step 5: Password Reset
- [x] Create Reset Password modal
- [x] Implement password reset
- [x] Add password confirmation

#### Step 6: Error Handling
- [x] Add form validation
- [x] Display error messages
- [x] Display success messages
- [x] Handle API errors

#### Step 7: Testing
- [ ] Test all user flows
- [ ] Test error scenarios
- [ ] Test responsive design
- [ ] Cross-browser testing

### Deployment Checklist
- [ ] Environment variables configured
- [ ] Database indexes created
- [ ] Error logging configured
- [ ] Rate limiting implemented
- [ ] HTTPS enabled
- [ ] CORS configured properly
- [ ] API documentation updated
- [ ] User acceptance testing completed

---

## Additional Notes

### Performance Considerations
- Pagination limits: 10-50 users per page
- Database indexes on frequently queried fields
- Consider caching for frequently accessed data

### Future Enhancements
- Bulk user operations
- User import/export (CSV)
- Advanced filtering options
- User activity logs
- Email notifications for user actions
- Two-factor authentication support

### Maintenance
- Regular security audits
- Update dependencies
- Monitor error logs
- Review user access patterns
- Backup user data regularly

