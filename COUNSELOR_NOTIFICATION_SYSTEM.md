# Counselor Notification Center - Implementation Guide

## Overview
A complete, separate notification system for Guidance Counselors, distinct from the admin notification system. This system provides real-time updates on records, assignments, announcements, and system alerts.

## Architecture

### Backend Separation
- **Admin Notifications**: Stored in `Notification` model (admin-only)
- **Counselor Notifications**: Stored in `CounselorNotification` model (counselor-specific, separate database collection)

### Key Files

#### Backend Models
- `backend/models/CounselorNotification.js` - Counselor notification schema
- `backend/models/Announcement.js` - Admin announcements schema

#### Backend Controllers
- `backend/controllers/counselorNotificationController.js` - Counselor notification CRUD operations
- `backend/controllers/admin/announcementController.js` - Admin announcement management

#### Backend Routes
- `backend/routes/counselorNotificationRoutes.js` - Counselor notification API endpoints
- `backend/routes/admin/announcementRoutes.js` - Admin announcement API endpoints

#### Frontend Components
- `frontend/src/pages/NotificationCenter.jsx` - Main notification center page for counselors
- `frontend/src/components/NotificationBadge.jsx` - Unread count badge component

## Notification Types

### Categories
1. **New Record** - When a counselor creates a new record
2. **Assigned Record** - When admin assigns a record to a counselor
3. **Updated Record** - When a record is updated by admin or counselor
4. **Schedule Reminder** - Upcoming session reminders (future feature)
5. **Announcement** - Admin-created announcements sent to counselors
6. **System Alert** - General system notifications
7. **Record Request** - Requests for records (future feature)

### Priority Levels
- **Critical** - Urgent notifications (red badge)
- **High** - Important notifications (orange badge)
- **Medium** - Standard notifications (yellow badge) - Default
- **Low** - Informational notifications (gray badge)

## Features

### For Counselors

1. **View All Notifications**
   - Paginated list of all notifications
   - Sortable by priority and date
   - Real-time updates (polls every 10 seconds)

2. **Filter Notifications**
   - By status (All, Unread, Read)
   - By category (All categories or specific)
   - Search by title/description

3. **Notification Actions**
   - Mark individual as read/unread
   - Mark all as read
   - Delete individual notifications
   - Delete all read notifications

4. **Notification Badge**
   - Shows unread count on Dashboard
   - Updates automatically
   - Click to navigate to Notification Center

### For Admins

1. **Send Announcements**
   - Create announcements to all counselors
   - Create announcements to specific counselors
   - Set priority levels
   - Track announcement delivery

2. **Assign Records**
   - When admin assigns a record to a counselor, notification is automatically created
   - When admin updates a counselor's record, notification is sent

## API Endpoints

### Counselor Notification Endpoints
All endpoints require authentication via `Bearer` token.

#### Base URL: `/api/counselor/notifications`

- `GET /` - Get all notifications (with filters and pagination)
  - Query params: `page`, `limit`, `status`, `category`, `search`
  
- `GET /unread-count` - Get unread notification count (for badge)
  
- `PUT /:notificationId/read` - Mark notification as read
  
- `PUT /:notificationId/unread` - Mark notification as unread
  
- `PUT /read-all` - Mark all notifications as read
  
- `DELETE /:notificationId` - Delete a notification
  
- `DELETE /read/all` - Delete all read notifications

### Admin Announcement Endpoints
All endpoints require admin authentication.

#### Base URL: `/api/admin/announcements`

- `POST /` - Create and send announcement
  - Body: `{ title, message, priority, targetAudience, targetCounselorIds }`
  
- `GET /` - Get all announcements
  
- `PUT /:id/deactivate` - Deactivate an announcement

## Automatic Notification Triggers

### Record Creation
When a counselor creates a record:
1. Admin notification is created (in `Notification` collection)
2. Counselor notification is created (in `CounselorNotification` collection)
3. After Google Drive upload, notification metadata is updated with drive link

### Record Update
When a record is updated:
1. Admin notification is created
2. If counselor field changed, assigned counselor receives notification
3. If counselor field unchanged, counselor receives update notification

### Admin Actions
When admin updates/assigns a record:
1. Admin notification is created
2. Counselor notification is automatically sent to the assigned counselor
3. If record was reassigned, new counselor gets "Assigned Record" notification

## Database Schema

### CounselorNotification Schema
```javascript
{
  counselorId: ObjectId (ref: User),
  counselorEmail: String,
  title: String (required),
  description: String (required),
  category: Enum ["New Record", "Assigned Record", "Updated Record", 
                  "Schedule Reminder", "Announcement", "System Alert", "Record Request"],
  status: Enum ["read", "unread"] (default: "unread"),
  priority: Enum ["low", "medium", "high", "critical"] (default: "medium"),
  metadata: Object (flexible data storage),
  relatedId: ObjectId (for linking to records, announcements, etc.),
  relatedType: Enum ["record", "announcement", "schedule", "system"],
  isAnnouncement: Boolean (default: false),
  announcementId: ObjectId (ref: Announcement),
  createdAt: Date,
  updatedAt: Date
}
```

### Announcement Schema
```javascript
{
  title: String (required),
  message: String (required),
  createdBy: ObjectId (ref: Admin),
  createdByName: String,
  priority: Enum ["low", "medium", "high", "critical"],
  targetAudience: Enum ["all", "specific"],
  targetCounselorIds: [ObjectId],
  isActive: Boolean (default: true),
  expiresAt: Date (optional),
  createdAt: Date,
  updatedAt: Date
}
```

## Integration Points

### Dashboard Integration
- Notification badge component displays unread count
- Auto-refreshes every 10 seconds
- Click to navigate to Notification Center

### Record System Integration
- Automatic notifications when records are created/updated
- Notifications include record metadata (client name, session number, etc.)
- Drive links included in notification metadata

### Admin System Integration
- Admins can send announcements to counselors
- Record assignment automatically creates notifications
- Separate from admin notification system

## Frontend Routes

### Counselor Routes
- `/notifications` - Notification Center page
- Dashboard includes notification badge component

### Admin Routes
- `/admin/announcements` - Announcement management (to be created)

## Security

### Authentication
- Counselor endpoints require `protect` middleware (JWT authentication)
- Admin endpoints require `protectAdmin` middleware
- Notifications are filtered by counselor ID/email (users can only see their own)

### Authorization
- Counselors can only view/modify their own notifications
- Admins can create announcements but not directly access counselor notifications
- All operations are validated server-side

## Real-time Updates

### Polling Strategy
- Frontend polls for updates every 10 seconds
- Unread count badge updates automatically
- Notification list refreshes on user actions

### Future Enhancements
- WebSocket support for real-time push notifications
- Browser push notifications
- Email notifications for critical alerts

## Styling

### Design System
- Uses Tailwind CSS for styling
- Consistent with Dashboard design
- Responsive design for mobile/tablet
- Color-coded categories and priorities

### Notification Display
- Unread notifications: Blue border, highlighted background
- Critical priority: Red badge, enhanced shadow
- Category icons: Visual indicators for quick recognition

## Usage Examples

### Creating a Counselor Notification (Backend)
```javascript
import { createCounselorNotification } from "../controllers/counselorNotificationController.js";

await createCounselorNotification({
  counselorId: counselor._id,
  counselorEmail: counselor.email,
  title: "Record Assigned",
  description: "A new record has been assigned to you.",
  category: "Assigned Record",
  priority: "high",
  metadata: {
    recordId: record._id.toString(),
    clientName: "John Doe",
  },
  relatedId: record._id,
  relatedType: "record",
});
```

### Sending Announcement to All Counselors (Backend)
```javascript
import { createNotificationForAllCounselors } from "../controllers/counselorNotificationController.js";

await createNotificationForAllCounselors({
  title: "System Maintenance",
  description: "System will be down for maintenance on Friday.",
  category: "Announcement",
  priority: "high",
  isAnnouncement: true,
});
```

### Fetching Notifications (Frontend)
```javascript
const res = await axios.get("/api/counselor/notifications", {
  headers: { Authorization: `Bearer ${token}` },
  params: {
    page: 1,
    limit: 20,
    status: "unread",
    category: "all",
    search: "",
  },
});
```

## Testing Checklist

- [ ] Create record triggers notification
- [ ] Update record triggers notification
- [ ] Admin assigns record triggers notification
- [ ] Mark notification as read
- [ ] Mark all as read
- [ ] Delete notification
- [ ] Filter by status/category
- [ ] Search notifications
- [ ] Pagination works
- [ ] Unread count badge updates
- [ ] Admin can send announcements
- [ ] Announcements appear in counselor notifications
- [ ] Real-time polling updates
- [ ] Notification metadata includes drive links
- [ ] Security: counselors can only see their notifications

## Future Enhancements

1. **Schedule Reminders**
   - Automatic reminders for upcoming sessions
   - Calendar integration

2. **Email Notifications**
   - Email alerts for critical notifications
   - Digest emails for weekly summaries

3. **Push Notifications**
   - Browser push notifications
   - Mobile app notifications

4. **Notification Preferences**
   - User settings for notification types
   - Frequency preferences

5. **Notification Groups**
   - Group related notifications
   - Collapse/expand functionality

6. **Rich Notifications**
   - Images in notifications
   - Action buttons in notifications
   - Inline previews

## Troubleshooting

### Notifications Not Appearing
1. Check authentication token is valid
2. Verify counselor ID/email matches
3. Check database for notification entries
4. Verify notification controller is called

### Badge Count Not Updating
1. Check API endpoint `/api/counselor/notifications/unread-count`
2. Verify polling interval is running
3. Check browser console for errors

### Admin Announcements Not Reaching Counselors
1. Verify announcement creation succeeded
2. Check counselor list is populated
3. Verify `createNotificationForAllCounselors` is called
4. Check database for notification entries

## Support

For issues or questions, refer to:
- Backend logs for notification creation errors
- Frontend console for API errors
- Database queries to verify notification data

