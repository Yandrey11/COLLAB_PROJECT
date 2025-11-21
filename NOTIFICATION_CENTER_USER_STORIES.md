# Notification Center User Stories

## [ADM09] As an Admin, I want to receive and manage system notifications, so that I can stay informed about important events and take timely action.

**Acceptance Criteria:**
- Admin can access the Notification Center from the Admin Dashboard.
- The Notification Center displays a list of notifications including:
  - Notification title
  - Brief description
  - Date and time received
  - Status (read/unread)
  - Category/type (e.g., System Alert, User Activity, Errors)
- New notifications are clearly highlighted or marked as unread.
- Admin can filter notifications by status (read/unread) and category.
- Admin can mark individual notifications as read or unread.
- Admin can delete notifications with a confirmation prompt.
- Notifications related to critical issues (e.g., system errors, security alerts) are prominently displayed.
- Notifications are updated in real-time or upon page refresh.
- Only Admin users can access and manage the Notification Center.

---

## [ADM09.1] As an Admin, I want to view notification priority levels, so that I can quickly identify urgent notifications that require immediate attention.

**Acceptance Criteria:**
- Each notification displays a priority badge (Critical, High, Medium, Low).
- Critical priority notifications have enhanced visual styling (e.g., stronger shadow, prominent display).
- Priority badges are color-coded:
  - Critical: Red background
  - High: Orange background
  - Medium: Blue background
  - Low: Gray background
- Priority is visible at a glance in the notification list.

---

## [ADM09.2] As an Admin, I want to search for specific notifications, so that I can quickly find relevant information without scrolling through all notifications.

**Acceptance Criteria:**
- A search input field is available in the Notification Center.
- Admin can search by typing keywords in the search bar.
- Search functionality searches through notification titles and descriptions.
- Search is case-insensitive.
- Search results update when the "Search" button is clicked or Enter is pressed.
- Search can be combined with status and category filters.
- Search query persists when navigating between pages.
- A "Reset" button clears the search along with all filters.

---

## [ADM09.3] As an Admin, I want to see the count of unread notifications, so that I can quickly assess how many notifications require my attention.

**Acceptance Criteria:**
- The Notification Center header displays the total count of unread notifications.
- The unread count is displayed prominently (e.g., in a badge or highlighted area).
- The unread count updates in real-time as notifications are marked as read.
- The unread count badge is only visible when there are unread notifications.

---

## [ADM09.4] As an Admin, I want to mark all notifications as read at once, so that I can efficiently manage multiple notifications without individual actions.

**Acceptance Criteria:**
- A "Mark All Read" button is available in the Notification Center header.
- Clicking the button shows a confirmation dialog before marking all as read.
- Upon confirmation, all unread notifications are marked as read.
- The unread count updates immediately after the action.
- A success message is displayed after successfully marking all as read.

---

## [ADM09.5] As an Admin, I want to delete all read notifications at once, so that I can clean up old notifications and keep the notification list manageable.

**Acceptance Criteria:**
- A "Delete Read" button is available in the Notification Center header.
- Clicking the button shows a confirmation dialog before deleting all read notifications.
- Upon confirmation, all read notifications are permanently deleted.
- The notification list updates immediately after deletion.
- A success message is displayed after successfully deleting all read notifications.
- Only read notifications are deleted; unread notifications remain.

---

## [ADM09.6] As an Admin, I want to navigate through notifications using pagination, so that I can efficiently browse through large numbers of notifications.

**Acceptance Criteria:**
- Notifications are displayed in pages (5 notifications per page).
- Pagination controls (Previous/Next buttons) are available at the bottom of the notification list.
- The current page number and total pages are displayed.
- Navigation buttons are disabled when at the first or last page.
- Current filters and search query persist when navigating between pages.
- Page resets to 1 when applying new filters or search.

---

## [ADM09.7] As an Admin, I want notifications to update automatically, so that I can see new notifications without manually refreshing the page.

**Acceptance Criteria:**
- The Notification Center automatically polls for new notifications every 10 seconds.
- New notifications appear in the list without requiring a page refresh.
- The unread count updates automatically when new notifications arrive.
- Real-time updates respect current filters and search queries.
- The polling continues while the Notification Center page is open.

---

## [ADM09.8] As an Admin, I want to see formatted timestamps for notifications, so that I can easily understand when each notification was received.

**Acceptance Criteria:**
- Each notification displays a human-readable timestamp.
- Timestamps are formatted as:
  - "Just now" for notifications less than 1 minute old
  - "X minute(s) ago" for notifications less than 1 hour old
  - "X hour(s) ago" for notifications less than 24 hours old
  - "X day(s) ago" for notifications less than 7 days old
  - Full date and time for older notifications
- Timestamps are clearly visible in each notification card.

---

## [ADM09.9] As an Admin, I want to see visual indicators for notification categories, so that I can quickly identify the type of each notification.

**Acceptance Criteria:**
- Each notification displays a category badge (System Alert, User Activity, Error, Security Alert, Info).
- Category badges are color-coded:
  - System Alert: Blue
  - User Activity: Green
  - Error: Red
  - Security Alert: Orange
  - Info: Gray
- Each category has an associated icon for quick visual identification.
- Category badges are clearly visible in each notification card.

---

## [ADM09.10] As an Admin, I want to see compact notification cards, so that I can view more notifications at once without excessive scrolling.

**Acceptance Criteria:**
- Notification cards are compact and space-efficient.
- Each card displays essential information (title, description, status, category, priority, timestamp).
- Cards use appropriate padding and spacing for readability.
- Unread notifications have distinct visual styling (purple border, highlighted background).
- Critical notifications have enhanced visual prominence.
- The layout is responsive and works on different screen sizes.

---

## [ADM09.11] As an Admin, I want to receive feedback messages for my actions, so that I know whether my operations succeeded or failed.

**Acceptance Criteria:**
- Success messages are displayed after successful operations (mark as read, delete, etc.).
- Error messages are displayed when operations fail.
- Messages are clearly visible and use appropriate colors (green for success, red for errors).
- Messages automatically disappear after 3 seconds.
- Messages do not interfere with the user's ability to interact with the page.

---

## [ADM09.12] As an Admin, I want to see an empty state when no notifications match my filters, so that I understand why no notifications are displayed.

**Acceptance Criteria:**
- When no notifications match the current filters/search, a message is displayed: "No notifications found."
- The empty state message is centered and clearly visible.
- The empty state appears instead of an empty list.
- Pagination controls are hidden when there are no notifications.

---

## [ADM09.13] As an Admin, I want to have my admin access verified before accessing the Notification Center, so that only authorized users can view and manage notifications.

**Acceptance Criteria:**
- The Notification Center verifies admin authentication before loading.
- If no admin token is present, the user is redirected to the admin login page.
- If the user's role is not "admin", the user is redirected to the admin login page.
- Access verification happens on page load and prevents unauthorized access.
- The page only loads notifications after successful admin verification.

---

## [ADM09.14] As an Admin, I want to navigate back to the Admin Dashboard from the Notification Center, so that I can easily return to the main admin interface.

**Acceptance Criteria:**
- A "Back" button is available in the Notification Center header.
- Clicking the "Back" button navigates to the Admin Dashboard.
- The button is clearly visible and easily accessible.
- Navigation preserves the admin session.

---

## Technical Notes:

### Implementation Details:
- **Pagination**: 5 notifications per page
- **Real-time Updates**: Polling every 10 seconds
- **Search**: Searches in title and description fields (case-insensitive)
- **Filters**: Status (all/unread/read) and Category (all/System Alert/User Activity/Error/Security Alert/Info)
- **Priority Levels**: Critical, High, Medium, Low
- **Categories**: System Alert, User Activity, Error, Security Alert, Info
- **Authentication**: Admin-only access via adminToken verification

### API Endpoints Used:
- `GET /api/admin/notifications` - Fetch notifications with filters, pagination, and search
- `PUT /api/admin/notifications/:id/read` - Mark notification as read
- `PUT /api/admin/notifications/:id/unread` - Mark notification as unread
- `PUT /api/admin/notifications/read-all` - Mark all notifications as read
- `DELETE /api/admin/notifications/:id` - Delete a notification
- `DELETE /api/admin/notifications/read/all` - Delete all read notifications

