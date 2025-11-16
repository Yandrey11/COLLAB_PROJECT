# Admin Record Management - User Stories & Acceptance Criteria

## Overview
The Admin Record Management system allows administrators to view, search, filter, paginate, edit, delete, and manage counseling records. The system focuses on storing, viewing, updating, and managing counseling records — not automated scheduling or advanced features.

---

## User Story 1: View All Counseling Records

**As an** admin  
**I want to** view all counseling records in the system  
**So that** I can monitor and manage all counseling sessions

### Acceptance Criteria:
- [ ] Admin can access a dedicated "Record Management" page from the admin dashboard
- [ ] All records are displayed in a table format with the following columns:
  - Client Name
  - Date
  - Session Type
  - Session Number
  - Status (Ongoing, Completed, Referred)
  - Counselor Name
  - Actions (View, Edit, Delete)
- [ ] Records are sorted by date (newest first) by default
- [ ] The page displays a total count of records
- [ ] Records load within 2 seconds for up to 1000 records
- [ ] Empty state message is shown when no records exist
- [ ] Admin must be authenticated to access this page

---

## User Story 2: Search Counseling Records

**As an** admin  
**I want to** search for specific counseling records  
**So that** I can quickly find records by client name, counselor, or other criteria

### Acceptance Criteria:
- [ ] A search input field is available at the top of the records table
- [ ] Admin can search by:
  - Client name (partial match, case-insensitive)
  - Counselor name (partial match, case-insensitive)
  - Session type (exact match)
  - Status (exact match)
- [ ] Search results update in real-time as the admin types (debounced by 300ms)
- [ ] Search is case-insensitive
- [ ] Search works across multiple fields simultaneously
- [ ] Clear search button resets the search and shows all records
- [ ] Search results maintain pagination
- [ ] No results message is displayed when search yields no matches

---

## User Story 3: Filter Counseling Records

**As an** admin  
**I want to** filter counseling records by various criteria  
**So that** I can view specific subsets of records

### Acceptance Criteria:
- [ ] Filter options are available for:
  - Status (All, Ongoing, Completed, Referred)
  - Session Type (All, Individual, Group, Family, etc.)
  - Date Range (Start Date and End Date)
  - Counselor (dropdown with all unique counselors)
- [ ] Multiple filters can be applied simultaneously
- [ ] Active filters are visually indicated (e.g., badges or highlighted buttons)
- [ ] "Clear All Filters" button resets all filters
- [ ] Filtered results maintain pagination
- [ ] Filter count is displayed (e.g., "Showing 25 of 100 records")
- [ ] Filters persist when navigating between pages (stored in URL query params)

---

## User Story 4: Paginate Counseling Records

**As an** admin  
**I want to** paginate through counseling records  
**So that** I can efficiently browse large numbers of records

### Acceptance Criteria:
- [ ] Records are paginated with configurable page size (10, 25, 50, 100 per page)
- [ ] Page size selector is visible and functional
- [ ] Pagination controls display:
  - Current page number
  - Total number of pages
  - Previous/Next buttons
  - First/Last page buttons (optional)
- [ ] Page numbers are clickable for direct navigation
- [ ] Pagination works correctly with search and filters
- [ ] Current page and page size persist in URL query params
- [ ] Total record count is displayed (e.g., "Page 1 of 10 (Total: 250 records)")
- [ ] Pagination is disabled when there is only one page

---

## User Story 5: View Full Record Details

**As an** admin  
**I want to** view complete details of a counseling record  
**So that** I can see all information about a specific session

### Acceptance Criteria:
- [ ] Admin can click a "View" button or record row to open a detailed view
- [ ] Detailed view displays all record fields:
  - Client Name
  - Date
  - Session Type
  - Session Number
  - Status
  - Counselor Name
  - Notes (full text, formatted)
  - Outcomes (full text, formatted)
  - Google Drive Link (if available)
  - Attached Files (if any)
  - Created At timestamp
  - Updated At timestamp
  - Audit Trail (who created/updated and when)
- [ ] Detailed view opens in a modal or separate page
- [ ] Modal can be closed by clicking outside, pressing ESC, or clicking a close button
- [ ] All text fields support long content with scrolling
- [ ] Google Drive link opens in a new tab
- [ ] Attached files can be downloaded or viewed
- [ ] Audit trail shows:
  - Created by (counselor/admin name)
  - Created at (timestamp)
  - Last modified by (counselor/admin name)
  - Last modified at (timestamp)
  - Modification history (if available)

---

## User Story 6: Edit Counseling Records

**As an** admin  
**I want to** edit counseling records  
**So that** I can correct errors or update information

### Acceptance Criteria:
- [ ] Admin can click an "Edit" button on any record
- [ ] Edit form opens in a modal or inline edit mode
- [ ] All editable fields are available:
  - Client Name
  - Date
  - Session Type
  - Session Number
  - Status
  - Notes
  - Outcomes
- [ ] Counselor name is displayed but not editable (read-only)
- [ ] Form validation ensures:
  - Client Name is required
  - Date is a valid date
  - Session Type is required
  - Session Number is a positive integer
  - Status is one of the valid options
- [ ] "Save" button updates the record
- [ ] "Cancel" button discards changes
- [ ] Success message is displayed after successful update
- [ ] Error message is displayed if update fails
- [ ] Record is automatically refreshed in the list after update
- [ ] Audit trail is updated with:
  - Last modified by (admin name)
  - Last modified at (timestamp)
- [ ] Notification is sent to admins about the record update

---

## User Story 7: Delete Counseling Records

**As an** admin  
**I want to** delete counseling records  
**So that** I can remove incorrect or obsolete records

### Acceptance Criteria:
- [ ] Admin can click a "Delete" button on any record
- [ ] Confirmation dialog appears before deletion:
  - Shows record details (client name, date, session number)
  - Warns that deletion is permanent
  - Requires explicit confirmation
- [ ] Admin can cancel the deletion
- [ ] Record is permanently deleted from the database upon confirmation
- [ ] Success message is displayed after successful deletion
- [ ] Error message is displayed if deletion fails
- [ ] Record is removed from the list immediately after deletion
- [ ] Pagination is adjusted if the deleted record was on the last page
- [ ] Notification is sent to admins about the record deletion
- [ ] Audit trail logs the deletion (who deleted and when)

---

## User Story 8: Upload Files to Google Drive

**As an** admin  
**I want to** upload record files to Google Drive  
**So that** I can store and share record documents securely

### Acceptance Criteria:
- [ ] Admin can click an "Upload to Drive" button on any record
- [ ] System checks if Google Drive is connected
- [ ] If not connected, admin is prompted to connect Google Drive
- [ ] PDF is generated from the record data
- [ ] PDF follows the standard format (header, body, footer, tracking number)
- [ ] PDF filename format: `{CounselorName}_{ClientName}_record_{TrackingNumber}.pdf`
- [ ] PDF is uploaded to the configured Google Drive folder
- [ ] Upload progress is displayed (loading indicator)
- [ ] Success message is displayed with the Google Drive link
- [ ] Error message is displayed if upload fails
- [ ] Record's `driveLink` field is updated with the Google Drive URL
- [ ] Admin can click the link to view the file in Google Drive
- [ ] Link opens in a new tab

---

## User Story 9: View or Download Attached Files

**As an** admin  
**I want to** view or download files attached to records  
**So that** I can access supporting documents

### Acceptance Criteria:
- [ ] Records can have multiple file attachments
- [ ] Attached files are displayed in the record details view
- [ ] Each file shows:
  - File name
  - File type/icon
  - File size
  - Upload date
  - Uploaded by (counselor/admin name)
- [ ] Admin can click a file to download it
- [ ] Admin can click a "View" button to preview the file (if supported)
- [ ] File downloads start immediately when clicked
- [ ] Google Drive links open in a new tab
- [ ] File preview modal supports common formats (PDF, images, text)
- [ ] Error message is displayed if file cannot be accessed
- [ ] Files are stored securely and access is logged

---

## User Story 10: Generate PDF Files of Records

**As an** admin  
**I want to** generate PDF files of counseling records  
**So that** I can create printable or shareable documents

### Acceptance Criteria:
- [ ] Admin can click a "Generate PDF" button on any record
- [ ] PDF is generated using the standard format:
  - Header with title and tracking number
  - Body with all record details
  - Footer with system information and page numbers
- [ ] PDF includes:
  - Client Name
  - Date
  - Session Type
  - Session Number
  - Status
  - Counselor Name
  - Notes
  - Outcomes
  - Generated date and time
  - Document tracking number
- [ ] PDF filename format: `{CounselorName}_{ClientName}_record_{TrackingNumber}.pdf`
- [ ] PDF is generated on the server side
- [ ] Loading indicator is shown during PDF generation
- [ ] PDF is automatically downloaded to the admin's device
- [ ] Success message is displayed after download
- [ ] Error message is displayed if generation fails
- [ ] PDF can be generated for multiple records (bulk export) - optional enhancement

---

## User Story 11: Track History/Audit Trail

**As an** admin  
**I want to** view the history and audit trail of records  
**So that** I can track changes and maintain accountability

### Acceptance Criteria:
- [ ] Each record maintains an audit trail with:
  - Created by (user/admin name and ID)
  - Created at (timestamp)
  - Last modified by (user/admin name and ID)
  - Last modified at (timestamp)
  - Modification history (array of changes)
- [ ] Modification history includes:
  - Field name that changed
  - Old value
  - New value
  - Changed by (user/admin name)
  - Changed at (timestamp)
- [ ] Audit trail is visible in the record details view
- [ ] Audit trail is read-only (cannot be edited or deleted)
- [ ] Audit trail is automatically updated on:
  - Record creation
  - Record update
  - Record deletion (soft delete or log)
- [ ] Audit trail entries are sorted by timestamp (newest first)
- [ ] Admin can filter audit trail by:
  - Action type (Create, Update, Delete)
  - User/Admin who made the change
  - Date range
- [ ] Audit trail is stored in the database and persists permanently

---

## User Story 12: Receive Notifications When Counselors Create or Update Records

**As an** admin  
**I want to** receive notifications when counselors create or update records  
**So that** I can stay informed about counseling activities

### Acceptance Criteria:
- [ ] Notification is created when a counselor creates a new record
- [ ] Notification is created when a counselor updates an existing record
- [ ] Notification includes:
  - Title: "New Record Created" or "Record Updated"
  - Description: Client name, session number, counselor name, action type
  - Category: "User Activity"
  - Priority: "medium" (or "high" for critical updates)
  - Related record ID (clickable link to record)
  - Timestamp
- [ ] Notification appears in the admin notification center
- [ ] Notification is marked as "unread" by default
- [ ] Admin can click the notification to view the record
- [ ] Notification persists until admin marks it as read
- [ ] Multiple admins receive the same notification
- [ ] Notifications are stored in the database
- [ ] Notification count badge is updated in real-time
- [ ] Notifications are sorted by priority and date (newest first)

---

## Technical Requirements

### Backend:
- [ ] Admin record management controller with all CRUD operations
- [ ] Admin record management routes (protected with admin middleware)
- [ ] Record model updated with audit trail fields
- [ ] File attachment support in Record model
- [ ] Notification system integration
- [ ] PDF generation service
- [ ] Google Drive integration
- [ ] Search and filter query optimization
- [ ] Pagination support

### Frontend:
- [ ] Admin Record Management page component
- [ ] Record table with sorting and actions
- [ ] Search and filter UI components
- [ ] Pagination component
- [ ] Record detail modal
- [ ] Record edit modal/form
- [ ] Delete confirmation dialog
- [ ] File upload/download UI
- [ ] PDF generation button and handler
- [ ] Google Drive upload button and handler
- [ ] Audit trail display component
- [ ] Loading states and error handling
- [ ] Responsive design for mobile/tablet

### Security:
- [ ] All admin routes protected with admin authentication middleware
- [ ] Input validation and sanitization
- [ ] File upload size and type restrictions
- [ ] Secure file storage
- [ ] Audit trail cannot be tampered with
- [ ] Role-based access control

### Performance:
- [ ] Pagination to limit database queries
- [ ] Indexed database fields for search/filter
- [ ] Debounced search input
- [ ] Lazy loading for large datasets
- [ ] Caching for frequently accessed data (optional)

---

## Definition of Done

A user story is considered complete when:
1. All acceptance criteria are met
2. Code is reviewed and approved
3. Unit tests are written and passing
4. Integration tests are written and passing
5. UI/UX matches the design specifications
6. Documentation is updated
7. Feature is tested in staging environment
8. No critical bugs are present
9. Performance requirements are met
10. Security requirements are met

---

**Document Version**: 1.0  
**Last Updated**: 2024

