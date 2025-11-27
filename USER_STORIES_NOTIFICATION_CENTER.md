# User Stories: Notification Center

## Notification Viewing and Management

### [CO23] As a Counselor, I want to view all my notifications in a centralized location so that I can stay informed about important updates and activities.

**Acceptance Criteria:**
- The Notification Center page displays a list of all notifications assigned to or relevant to the counselor.
- Notifications are displayed in a clear, organized layout with the most recent notifications appearing first.
- Each notification displays the following information:
  - Notification title
  - Notification description
  - Category badge (e.g., New Record, Assigned Record, Updated Record, Schedule Reminder, Announcement, System Alert)
  - Priority badge (Critical, High, Medium, Low)
  - Timestamp showing when the notification was created (formatted as relative time, e.g., "5 minutes ago", "2 hours ago")
  - Status indicator (read or unread)
- Unread notifications are visually distinguished with a highlighted border and background color.
- The page shows a loading indicator while notifications are being fetched from the backend.
- If no notifications exist, an empty state message is displayed: "No notifications found. You're all caught up! 🎉"
- The Notification Center is accessible via the navigation sidebar from any counselor-facing page.
- Notifications are loaded automatically when the Notification Center page is accessed.
- The page displays an unread count badge in the header if there are unread notifications.

---

### [CO24] As a Counselor, I want to see the count of unread notifications so that I know how many new notifications require my attention.

**Acceptance Criteria:**
- The Notification Center header displays an unread count badge (e.g., "5 unread") when there are unread notifications.
- The unread count badge is prominently displayed with a red background and white text.
- The unread count badge only appears when the count is greater than zero.
- The unread count is fetched from the backend API along with the notifications list.
- The unread count is updated in real-time as notifications are marked as read or unread.
- The unread count reflects the total number of unread notifications across all pages (not just the current page).
- The unread count badge is also displayed in the navigation sidebar via the NotificationBadge component.

---

### [CO25] As a Counselor, I want to search notifications by keywords so that I can quickly find specific notifications.

**Acceptance Criteria:**
- The Notification Center includes a search input field labeled "Search notifications..."
- The search field allows entering text to search through notification titles and descriptions.
- When the search form is submitted (via Enter key or Search button), the system filters notifications matching the search query.
- Search is case-insensitive and matches partial text within notification titles and descriptions.
- The search results are displayed immediately after submitting the search.
- The search query is sent to the backend API as a parameter for server-side filtering.
- The search can be combined with status and category filters.
- A "Reset" button clears the search query and reloads all notifications.
- If no notifications match the search criteria, the empty state message is displayed.
- The search input maintains focus and allows for quick consecutive searches.

---

### [CO26] As a Counselor, I want to filter notifications by status (read/unread) so that I can focus on notifications that need my attention.

**Acceptance Criteria:**
- The Notification Center includes a status filter dropdown with options:
  - "All Status" (shows both read and unread)
  - "Unread" (shows only unread notifications)
  - "Read" (shows only read notifications)
- The status filter dropdown has a clear label and is visually distinct.
- When a status filter option is selected, the notifications list immediately updates to show only notifications matching the selected status.
- The filter selection is sent to the backend API for server-side filtering.
- The current filter selection is visually indicated (e.g., highlighted or selected state).
- The status filter can be combined with category filter and search query.
- A "Reset" button clears the status filter and returns to "All Status".
- The filter persists during the session until manually changed or reset.
- Pagination resets to page 1 when a new status filter is applied.

---

### [CO27] As a Counselor, I want to filter notifications by category so that I can focus on specific types of notifications.

**Acceptance Criteria:**
- The Notification Center includes a category filter dropdown with options:
  - "All Categories" (shows all notification types)
  - "New Record"
  - "Assigned Record"
  - "Updated Record"
  - "Schedule Reminder"
  - "Announcement"
  - "System Alert"
- The category filter dropdown has a clear label and is visually distinct.
- When a category filter option is selected, the notifications list immediately updates to show only notifications matching the selected category.
- The filter selection is sent to the backend API for server-side filtering.
- Each category option corresponds to actual notification categories used in the system.
- The current filter selection is visually indicated.
- The category filter can be combined with status filter and search query.
- A "Reset" button clears the category filter and returns to "All Categories".
- The filter persists during the session until manually changed or reset.
- Pagination resets to page 1 when a new category filter is applied.

---

### [CO28] As a Counselor, I want to mark individual notifications as read so that I can track which notifications I've already reviewed.

**Acceptance Criteria:**
- Each notification card displays a "Mark as Read" button when the notification is unread.
- When the "Mark as Read" button is clicked, the notification status is updated to "read" via the backend API.
- Upon successful update, the notification's visual appearance changes to indicate it's read (e.g., border color changes, background color changes).
- The "Mark as Read" button is replaced with a "Mark as Unread" button for read notifications.
- The unread count in the header is decremented by one when a notification is marked as read.
- The notification list is automatically refreshed after marking as read to reflect the updated state.
- If marking as read fails, an error message is displayed (e.g., "Failed to update notification").
- The read status persists across browser sessions and page refreshes.
- The action completes quickly without requiring a full page refresh.

---

### [CO29] As a Counselor, I want to mark individual notifications as unread so that I can revisit them later.

**Acceptance Criteria:**
- Each notification card displays a "Mark as Unread" button when the notification is read.
- When the "Mark as Unread" button is clicked, the notification status is updated to "unread" via the backend API.
- Upon successful update, the notification's visual appearance changes to indicate it's unread (highlighted border and background).
- The "Mark as Unread" button is replaced with a "Mark as Read" button for unread notifications.
- The unread count in the header is incremented by one when a notification is marked as unread.
- The notification list is automatically refreshed after marking as unread to reflect the updated state.
- If marking as unread fails, an error message is displayed (e.g., "Failed to update notification").
- The unread status persists across browser sessions and page refreshes.
- The action completes quickly without requiring a full page refresh.

---

### [CO30] As a Counselor, I want to mark all notifications as read at once so that I can quickly clear my unread notifications list.

**Acceptance Criteria:**
- The Notification Center includes a "Mark All as Read" button in the action buttons section.
- When clicked, a confirmation dialog is displayed asking "Mark All as Read?" with "Yes, mark all" and "Cancel" options.
- Upon confirmation, all unread notifications for the counselor are marked as read via the backend API.
- After successful update, a success message is displayed: "All notifications marked as read".
- All notifications in the current view update their visual appearance to indicate read status.
- The unread count in the header is reset to zero or updated to reflect the change.
- The notification list is automatically refreshed to show all notifications as read.
- If the operation fails, an error message is displayed (e.g., "Failed to update notifications").
- If the user cancels the confirmation dialog, no changes are made.
- The action applies to all notifications across all pages, not just the currently visible ones.

---

### [CO31] As a Counselor, I want to delete individual notifications so that I can remove notifications that are no longer relevant.

**Acceptance Criteria:**
- Each notification card displays a "Delete" button.
- When the "Delete" button is clicked, a confirmation dialog is displayed asking "Delete Notification?" with "Yes, delete" and "Cancel" options.
- The confirmation dialog includes the notification title or a clear message that the notification will be permanently deleted.
- Upon confirmation, the notification is deleted from the database via the backend API.
- After successful deletion, a success message is displayed: "Notification deleted successfully".
- The deleted notification is immediately removed from the notifications list.
- The notification list is automatically refreshed to reflect the deletion.
- If the deletion fails, an error message is displayed (e.g., "Failed to delete notification").
- If the user cancels the confirmation dialog, no changes are made.
- The deletion is permanent and cannot be undone.
- The unread count is updated if a deleted notification was unread.

---

### [CO32] As a Counselor, I want to delete all read notifications at once so that I can clean up my notification center and focus on active notifications.

**Acceptance Criteria:**
- The Notification Center includes a "Delete All Read" button in the action buttons section.
- When clicked, a confirmation dialog is displayed asking "Delete All Read?" with "Yes, delete all" and "Cancel" options.
- The confirmation dialog clearly states that all read notifications will be permanently deleted.
- Upon confirmation, all read notifications for the counselor are deleted from the database via the backend API.
- After successful deletion, a success message is displayed: "All read notifications deleted".
- All read notifications are immediately removed from the notifications list.
- Only read notifications are deleted; unread notifications remain in the list.
- The notification list is automatically refreshed to show only remaining notifications.
- If the operation fails, an error message is displayed (e.g., "Failed to delete notifications").
- If the user cancels the confirmation dialog, no changes are made.
- The deletion is permanent and cannot be undone.
- The action applies to all read notifications across all pages.

---

## Notification Display and Information

### [CO33] As a Counselor, I want to see notification categories with visual indicators so that I can quickly identify the type of each notification.

**Acceptance Criteria:**
- Each notification displays a category badge with color-coded styling:
  - "New Record": Blue badge with 📝 icon
  - "Assigned Record": Purple badge with 👤 icon
  - "Updated Record": Green badge with ✏️ icon
  - "Schedule Reminder": Yellow badge with ⏰ icon
  - "Announcement": Indigo badge with 📢 icon
  - "System Alert": Gray badge with 🔔 icon
  - "Record Request": Orange badge with 📋 icon
- Category badges are displayed prominently within each notification card.
- Badge colors are consistent across all notifications of the same category.
- Category badges include both text and an icon for visual identification.
- The category badge is easily distinguishable from other notification elements (title, priority, status).
- Default styling is applied for any unrecognized categories.

---

### [CO34] As a Counselor, I want to see notification priority levels so that I can prioritize which notifications to address first.

**Acceptance Criteria:**
- Each notification displays a priority badge indicating its importance level:
  - "Critical": Red badge
  - "High": Orange badge
  - "Medium": Yellow badge
  - "Low": Gray badge
- Priority badges are displayed prominently within each notification card.
- Critical priority notifications have enhanced visual emphasis (e.g., shadow, border highlight).
- Priority badges are color-coded for quick visual identification.
- The priority level is clearly labeled with text (e.g., "Critical", "High", "Medium", "Low").
- Default styling is applied for any unrecognized priority levels (defaults to "Medium").
- Priority badges are distinct from category badges and status indicators.

---

### [CO35] As a Counselor, I want to see when notifications were created in a human-readable format so that I understand their recency.

**Acceptance Criteria:**
- Each notification displays a formatted timestamp showing when it was created.
- Timestamps are displayed in relative time format for recent notifications:
  - "Just now" for notifications less than 1 minute old
  - "X minutes ago" for notifications less than 1 hour old
  - "X hours ago" for notifications less than 24 hours old
  - "X days ago" for notifications less than 1 week old
- For older notifications (more than 1 week), the timestamp displays an absolute date format:
  - Format: "Month Day, Year" (e.g., "Jan 15, 2024")
- Timestamps are displayed in a consistent location within each notification card.
- Timestamps use a smaller font size to distinguish them from main content.
- Timestamps are updated dynamically based on the current time (relative times recalculate as time passes).
- If a timestamp is missing or invalid, a placeholder "—" is displayed.

---

### [CO36] As a Counselor, I want to see unread notifications highlighted differently so that I can easily identify new notifications.

**Acceptance Criteria:**
- Unread notifications have a distinct visual appearance:
  - Highlighted border (e.g., indigo/purple border)
  - Highlighted background color (e.g., light indigo background)
  - "NEW" badge displayed prominently
- Read notifications have a more subdued appearance:
  - Standard gray border
  - White or neutral background
  - No "NEW" badge
- The visual distinction between read and unread notifications is immediately apparent.
- Unread notifications stand out clearly when scanning the notifications list.
- The highlighting is consistent across all unread notifications.
- The visual state updates immediately when a notification's read status changes.
- In dark mode, unread notifications maintain appropriate contrast and visibility.

---

## Real-Time Updates and Synchronization

### [CO37] As a Counselor, I want my notifications to update automatically so that I see new notifications without manually refreshing the page.

**Acceptance Criteria:**
- The Notification Center automatically polls the backend API for new notifications every 10 seconds.
- New notifications appear in the list automatically without requiring a page refresh.
- The unread count updates automatically when new unread notifications are received.
- The automatic polling respects the current filters and search query.
- The polling continues as long as the Notification Center page is active.
- The polling stops when the user navigates away from the Notification Center page.
- The automatic updates do not disrupt user interactions (e.g., reading, marking as read).
- If the automatic update fails, it retries on the next polling interval without displaying errors.
- The polling interval is not configurable by the user (fixed at 10 seconds).
- Network requests for polling are efficient and do not significantly impact performance.

---

### [CO38] As a Counselor, I want to manually refresh notifications so that I can get the latest updates on demand.

**Acceptance Criteria:**
- The Notification Center includes a "Refresh Data" button in the navigation sidebar.
- When clicked, the "Refresh Data" button immediately fetches the latest notifications from the backend.
- The refresh action respects the current filters (status, category) and search query.
- The refresh maintains the current page number in pagination.
- A loading state may be briefly displayed during the refresh.
- The notification list is updated with the latest data after the refresh completes.
- The unread count is updated based on the refreshed data.
- The refresh action can be performed multiple times in succession.
- If the refresh fails, an appropriate error message is displayed.
- The refresh action is quick and responsive.

---

## Pagination and Navigation

### [CO39] As a Counselor, I want to navigate through multiple pages of notifications so that I can view all my notifications efficiently.

**Acceptance Criteria:**
- The Notification Center displays notifications in paginated format with a configurable number of notifications per page (default: 20 notifications per page).
- Pagination controls are displayed at the bottom of the notifications list when there is more than one page.
- Pagination displays the current page number and total number of pages (e.g., "Page 1 of 5").
- "Previous" and "Next" buttons allow navigation between pages.
- The "Previous" button is disabled when viewing the first page.
- The "Next" button is disabled when viewing the last page.
- Clicking "Previous" loads and displays the previous page of notifications.
- Clicking "Next" loads and displays the next page of notifications.
- Page navigation maintains the current filters (status, category) and search query.
- The current page number is tracked and displayed accurately.
- Pagination controls are visually disabled (grayed out) when navigation is not possible.
- Page navigation is smooth and responsive.

---

## Empty States and Error Handling

### [CO40] As a Counselor, I want to see a clear message when I have no notifications so that I understand the current state.

**Acceptance Criteria:**
- When no notifications exist (or match the current filters), an empty state is displayed.
- The empty state includes:
  - A clear message: "No notifications found."
  - A friendly secondary message: "You're all caught up! 🎉"
- The empty state is centered vertically and horizontally within the notifications list area.
- The empty state message is visually distinct and easy to read.
- The empty state appears immediately when there are no notifications to display.
- The empty state respects the current filters and search query (e.g., if searching for "test" returns no results, the empty state is shown).
- The empty state does not show pagination controls.
- The empty state is styled consistently with the rest of the application.

---

### [CO41] As a Counselor, I want to receive clear error messages when notification operations fail so that I can understand and resolve issues.

**Acceptance Criteria:**
- All API errors during notification operations display user-friendly error messages at the top of the page.
- Error messages are displayed in a prominent, color-coded alert (red background for errors).
- Success messages are displayed in a color-coded alert (green background for success).
- Error messages include specific information when available:
  - "Authentication failed. Please log in again." (for 401 errors)
  - "Access denied. You don't have permission to view notifications." (for 403 errors)
  - "Failed to load notifications" (for general errors)
  - "Failed to update notification" (for read/unread update failures)
  - "Failed to delete notification" (for deletion failures)
- Success messages include specific confirmation:
  - "All notifications marked as read"
  - "Notification deleted successfully"
  - "All read notifications deleted"
- Error and success messages automatically disappear after 3-5 seconds.
- Error messages do not break the page layout or prevent navigation.
- Authentication errors (401) automatically redirect to the login page after a brief delay.
- Network errors provide actionable feedback to the user.
- The system gracefully handles partial failures (e.g., if some operations succeed but others fail).

---

## Notification Center Integration

### [CO42] As a Counselor, I want to access the Notification Center from any page so that I can check notifications at any time.

**Acceptance Criteria:**
- The Notification Center is accessible via a navigation button in the sidebar on all counselor-facing pages:
  - Dashboard
  - Records Page
  - Reports Page
  - Profile Page
  - Settings Page
- The "Notification Center" button is clearly labeled and includes the unread count badge.
- Clicking the "Notification Center" button navigates to the Notification Center page.
- The navigation is consistent across all pages (same button location and styling).
- The unread count badge on the navigation button updates in real-time when notifications change.
- The Notification Center page maintains the same navigation sidebar for consistency.
- Navigation to the Notification Center preserves the user's session and authentication state.

---

## Filter and Search Reset

### [CO43] As a Counselor, I want to quickly reset all filters and search queries so that I can view all notifications without manually clearing each filter.

**Acceptance Criteria:**
- The Notification Center includes a "Reset" button in the search and filters section.
- When clicked, the "Reset" button:
  - Clears the search query field
  - Resets the status filter to "All Status"
  - Resets the category filter to "All Categories"
  - Reloads all notifications without any filters applied
  - Resets pagination to page 1
- The reset action is immediate and requires no confirmation.
- After reset, all notifications are displayed in their default state (sorted by most recent, showing all statuses and categories).
- The reset button is clearly labeled and easily accessible.
- The reset button is visually distinct from other action buttons (e.g., different styling).

---

## Performance and User Experience

### [CO44] As a Counselor, I want the Notification Center to load quickly so that I can access my notifications without delay.

**Acceptance Criteria:**
- The Notification Center page loads within 2-3 seconds under normal network conditions.
- A loading indicator is displayed while notifications are being fetched from the backend.
- The loading state shows a spinner and "Loading notifications..." message.
- The page structure (header, sidebar, filters) is visible immediately, with only the notifications list in loading state.
- Notification data is fetched efficiently with proper pagination to limit initial load time.
- Images and assets load progressively without blocking the main content.
- The page remains responsive during data fetching.
- Large numbers of notifications do not cause performance degradation (pagination handles this).
- Caching strategies are employed where appropriate to reduce load times.

---

### [CO45] As a Counselor, I want notification actions (mark as read, delete) to complete quickly so that I can manage notifications efficiently.

**Acceptance Criteria:**
- Marking a notification as read/unread completes within 1 second.
- Deleting a notification completes within 1 second.
- Mark all as read operation completes within 2-3 seconds (depending on the number of notifications).
- Delete all read operation completes within 2-3 seconds (depending on the number of notifications).
- Visual feedback (button state changes, loading indicators) is provided immediately when actions are initiated.
- Actions do not block other interactions on the page.
- Multiple actions can be performed in quick succession without conflicts.
- Optimistic UI updates are applied immediately, with backend synchronization happening in the background.
- Failed actions display error messages without disrupting the overall page functionality.

