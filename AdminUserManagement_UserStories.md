# Admin User Management – User Story

## [ADM06] As an Admin, I want to manage system users, so that I can control who has access to the system and ensure proper role assignment.

### Acceptance Criteria

1. View User List
   - Admin can view all registered system users (Admins and Counselors).
   - The user table displays for each user:
     - Full name
     - Email
     - Role (Admin / Counselor)
     - Online status (Active / Offline)
     - Date created
   - Users are loaded from the backend via `/api/admin/users` with pagination (10 users per page).
   - Admin can navigate between pages using **Prev** and **Next** controls and see the current page and total pages.

2. Add New User
   - Admin can open an **Add New User** modal.
   - The add-user form requires:
     - Full name
     - Email
     - Role (default: Counselor; options: Admin, Counselor)
   - Validation includes:
     - Required fields for name and email.
     - Valid email format.
   - On submit, the frontend posts to `/api/admin/users` with the form data.
   - System checks for duplicate emails across existing users (handled on the backend) and returns a clear error message if the email is already registered.
   - On success:
     - A success message is shown: user created successfully.
     - A password setup link is sent to the new user’s email (described in the UI).
     - The user list refreshes and shows the newly created user.

3. Edit User Information
   - Admin can open an **Edit User** modal from the Actions column.
   - The edit form allows updating:
     - Name
     - Email
     - Role (Admin / Counselor)
   - Validation includes:
     - Required fields for name and email.
     - Valid email format.
   - On submit, the frontend sends a `PUT` request to `/api/admin/users/{userId}` with updated data.
   - The system checks for duplicate emails on the backend and returns a descriptive error if the email is already in use.
   - On success, the user list refreshes and a success message is displayed.

4. Online Status Indicator
   - For each user, the list displays an **Online Status** badge.
   - Possible values:
     - **Active** (user currently online)
     - **Offline** (user not online)
   - Badge color and label clearly distinguish Active vs Offline.
   - Online status is read-only from this page (Admin cannot directly toggle online/offline here).

5. Delete User
   - Admin can initiate user deletion from the Actions column.
   - Before deletion, a confirmation dialog appears with:
     - The user’s email.
     - A clear warning that the action cannot be undone.
   - If confirmed:
     - The frontend sends a `DELETE` request to `/api/admin/users/{userId}`.
     - On success, the user is removed from the list and a success message is shown.
   - If the backend returns an error, an error message is displayed and the list remains unchanged.

6. Search & Filter
   - Admin can search users by **name or email** using a search input.
   - Admin can filter the list using:
     - **Role filter**: All Roles, Admin, Counselor.
     - **Status filter**: All Status, Active (Online), Offline.
   - Search and filters call `/api/admin/users` with appropriate query parameters (page, search, role, status).
   - A **Reset** button clears search and filters and reloads the default view (Counselor role, all statuses).

7. Password Reset (Admin-Initiated)
   - From the Actions column, Admin can click **Send Reset Link** for a user.
   - A confirmation dialog appears asking if the Admin wants to send a reset link to the user’s email.
   - On confirmation:
     - The frontend posts to `/api/admin/users/{userId}/reset-password`.
     - On success, a confirmation message is displayed indicating that a password reset link has been sent.
   - If the backend reports an error (e.g., email issues or user type restrictions), an error message is shown to the Admin.

8. Authorization & Access Control
   - Access to the **User Management** page is restricted to authenticated Admins only.
   - On initial load, the page:
     - Checks for an `adminToken` in local storage.
     - Verifies admin access by calling `/api/admin/dashboard`.
   - If no valid admin token is present or the user is not an Admin:
     - The user is redirected to `/adminlogin`.
   - Counselors and unauthenticated users cannot access the User Management view.
