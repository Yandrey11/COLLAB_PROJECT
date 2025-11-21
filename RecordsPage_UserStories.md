# Counseling Records – User Stories

## [REC01] As a Counselor, I want to view all counseling records, so that I can review past sessions and track client progress.

### Acceptance Criteria

1. View Records List
   - Counselor can view a list of counseling records loaded from `GET /api/records`.
   - For each record, the view shows:
     - Session number
     - Client name
     - Date
     - Session type (Individual, Group, Career, Academic)
     - Status (Ongoing, Completed, Referred)
     - Counselor name
     - Google Drive file link (if available).

2. Desktop & Mobile Views
   - On **desktop**, records are displayed in a table layout (`desktop-table`).
   - On **mobile**, records are displayed as individual cards (`mobile-cards`) with equivalent key information.

3. Empty State
   - If there are no records (or no records match current filters), a clear “No records found” message is displayed.

---

## [REC02] As a Counselor, I want to create a new counseling record, so that I can document my sessions with clients.

### Acceptance Criteria

1. Open/Close New Record Form
   - Counselor can toggle a **Create New Record** form using a button.
   - Button label toggles between “Create New Record” and “Close Form”.

2. Record Fields
   - The create form includes:
     - Client name (required)
     - Date (optional)
     - Session type (required; options: Individual, Group, Career, Academic)
     - Status (default: Ongoing; options: Ongoing, Completed, Referred)
     - Session notes (optional)
     - Outcomes (optional).

3. Validation & Login Requirement
   - If **client name** or **session type** is missing, the system:
     - Shows a warning alert.
     - Prevents saving the record.
   - If the counselor is not logged in (no token):
     - A “Login Required” warning is displayed.
     - Counselor is redirected to the Login page.

4. Save Behavior
   - On save:
     - The counselor identity (name or email) is attached to the record.
     - A `POST` request is sent to `POST /api/records` with all form data + `counselor`.
   - On success:
     - A success message confirms the record was created (and uploaded to Google Drive).
     - The records list refreshes to include the new record.
     - The form is cleared and closed.

---

## [REC03] As a Counselor, I want to edit existing counseling records, so that I can correct or update information about past sessions.

### Acceptance Criteria

1. Open Edit Modal
   - Each record (table row or mobile card) has an **Edit** action.
   - Clicking **Edit** opens a modal pre-filled with that record’s data.

2. Editable Fields
   - Counselor can edit:
     - Session type
     - Status (Ongoing, Completed, Referred)
     - Notes
     - Outcomes.

3. Save & Cancel
   - Clicking **Save Changes**:
     - Sends a `PUT` request to `PUT /api/records/{recordId}` with updated fields.
     - On success, shows a confirmation message and refreshes the records list.
   - Clicking **Cancel** or clicking outside the modal:
     - Closes the modal without saving changes.

---

## [REC04] As a Counselor, I want to search and filter counseling records, so that I can quickly find sessions relevant to a specific client or session type.

### Acceptance Criteria

1. Search by Client Name
   - A search input allows typing a client name (partial match).
   - As the counselor types, records are filtered client-side by `clientName`.

2. Filter by Session Type
   - A dropdown allows filtering by:
     - All Types, Individual, Group, Career, Academic.
   - Selected filter is applied client-side on the loaded records.

3. Combined Filters
   - Search and type filter can be used together.
   - Only records matching both the search text and selected session type are shown.

4. No Results Message
   - If no records match the current search/filter, a “No records found” message is displayed.

---

## [REC05] As a Counselor, I want to connect Google Drive and access linked files, so that I can store and view supporting documents for each session.

### Acceptance Criteria

1. Connect Google Drive
   - A **Connect Google Drive** button is available on the page.
   - Clicking the button redirects to `http://localhost:5000/auth/drive` to start the OAuth flow.

2. OAuth Feedback Messages
   - After returning from OAuth:
     - If the URL contains `?success=drive_connected`, a success banner is shown (“Google Drive connected successfully”).
     - If the URL contains `?error=drive_connection_failed`, an error banner is shown.
   - Banners:
     - Can be closed manually.
     - Automatically disappear after a short time.

3. View Drive File
   - For records with a `driveLink`:
     - A link (e.g., “View File” or “📎 View Drive File”) is displayed.
     - Clicking opens the file in a new browser tab.
   - If no `driveLink` exists:
     - A “No file” label is shown.

---

## [REC06] As a Counselor, I want my identity to be clearly shown on the records page, so that I know which account is associated with the records I create.

### Acceptance Criteria

1. Counselor Header Badge
   - The header shows the **Counselor** name or email from the authenticated user.
   - If no valid user is detected:
     - The header shows “Not logged in” with a warning style.

2. Counselor in Records List
   - Each record shows the associated **Counselor** name.
   - If the record’s counselor field is “Unknown User” / “Unknown Counselor”, the page:
     - Tries to display the current user’s name or email instead, when available.
   - If there is no known counselor for a record, a placeholder such as “—” is shown.

3. Authentication Handling
   - If `GET /api/auth/me` indicates an invalid/expired token:
     - Local auth data (`token`, `authToken`, `user`) is cleared.
     - The page treats the user as not logged in (which blocks record creation).

---
