# Counselor Settings Module - Complete Documentation

## Overview

The Counselor Settings Module provides a comprehensive settings management system for counselors in the counseling record-keeping system. This module is completely separate from Admin settings and ensures counselors can only access and modify their personal, non-administrative preferences.

## Module Structure

### Backend Components

#### 1. **Data Model** (`backend/models/CounselorSettings.js`)

**Schema Structure:**
```javascript
{
  userId: ObjectId (required, unique, indexed),
  userModel: String (enum: ["User", "GoogleUser"]),
  userEmail: String (required, indexed),
  
  display: {
    theme: String (enum: ["light", "dark"], default: "light"),
    uiDensity: String (enum: ["compact", "normal"], default: "normal"),
    defaultDashboardView: String (enum: ["calendar", "records", "notifications"], default: "calendar")
  },
  
  notifications: {
    recordUpdates: Boolean (default: true),
    adminAnnouncements: Boolean (default: true),
    googleCalendarSync: Boolean (default: true),
    soundEnabled: Boolean (default: false)
  },
  
  googleCalendar: {
    showOnDashboard: Boolean (default: true),
    preferredView: String (enum: ["day", "week", "month"], default: "month")
  },
  
  privacy: {
    hideProfilePhoto: Boolean (default: false),
    maskNameInPDFs: Boolean (default: false)
  }
}
```

**Key Features:**
- Supports both `User` and `GoogleUser` models via `refPath`
- Automatic settings creation on first access
- Indexed for fast lookups by `userId` and `userEmail`
- Default values ensure settings always exist

#### 2. **API Controller** (`backend/controllers/counselorSettingsController.js`)

**Endpoints:**

##### GET `/api/counselor/settings`
- **Purpose:** Retrieve counselor's current settings
- **Access:** Private (Counselor only)
- **Response:**
  ```json
  {
    "success": true,
    "settings": {
      "display": { ... },
      "notifications": { ... },
      "googleCalendar": { ... },
      "privacy": { ... }
    }
  }
  ```
- **Behavior:** Creates default settings if none exist

##### PUT `/api/counselor/settings`
- **Purpose:** Update counselor settings
- **Access:** Private (Counselor only)
- **Request Body:** Partial settings object (only include categories to update)
  ```json
  {
    "display": { "theme": "dark" },
    "notifications": { "recordUpdates": false }
  }
  ```
- **Validation:**
  - Theme: Must be "light" or "dark"
  - UI Density: Must be "compact" or "normal"
  - Default Dashboard View: Must be "calendar", "records", or "notifications"
  - Notification settings: Must be booleans
  - Privacy settings: Must be booleans
  - Preferred View: Must be "day", "week", or "month"
- **Response:**
  ```json
  {
    "success": true,
    "message": "Settings updated successfully",
    "settings": { ... }
  }
  ```

##### POST `/api/counselor/settings/reset`
- **Purpose:** Reset all settings to defaults
- **Access:** Private (Counselor only)
- **Response:**
  ```json
  {
    "success": true,
    "message": "Settings reset to defaults",
    "settings": { ... }
  }
  ```

#### 3. **Routes** (`backend/routes/counselorSettingsRoutes.js`)

**Route Registration:**
- Mounted at `/api/counselor/settings` in `app.js`
- All routes protected by `protect` middleware
- Role-based access control enforced in controller

### Frontend Components

#### 1. **Settings Page** (`frontend/src/pages/SettingsPage.jsx`)

**Layout Structure:**
- Sidebar navigation (consistent with other counselor pages)
- Main content area with tabbed interface
- Five main tabs:
  1. **Account Settings** - Links to profile management
  2. **Display & Interface** - Theme, UI density, dashboard view
  3. **Notifications** - Toggle notification preferences
  4. **Google Calendar** - Frontend-only display preferences
  5. **Privacy** - Profile visibility and PDF masking options

**State Management:**
- Settings stored in component state
- LocalStorage used for frontend-only settings (theme, calendar display)
- Backend sync for notification and privacy settings
- Real-time theme application (no page reload needed)

**Key Functions:**
- `fetchSettings()` - Load settings from backend
- `updateSetting(category, key, value)` - Update individual setting
- `saveSettings(category)` - Save settings to backend
- `resetSettings()` - Reset all to defaults
- `applyTheme(theme)` - Apply theme to document immediately

## Settings Categories

### 1. Account Settings

**Frontend Behavior:**
- Read-only display of account information
- Link to Profile Page for actual modifications
- Quick access to Activity Logs

**Backend Logic:**
- No backend settings stored here
- References existing profile endpoints

**UI Components:**
- Information card with navigation button to Profile Page

---

### 2. Display & Interface Settings

**Settings:**
- **Theme** (Light/Dark Mode)
  - Frontend: Applied immediately via `document.documentElement.classList`
  - Backend: Stored for persistence across sessions
  - Default: "light"

- **UI Density** (Compact/Normal)
  - Frontend: Affects spacing and font sizes throughout the app
  - Backend: Stored for persistence
  - Default: "normal"

- **Default Dashboard View** (Calendar/Records/Notifications)
  - Frontend: Determines initial view when opening dashboard
  - Backend: Stored for persistence
  - Default: "calendar"

**Frontend Behavior:**
- Theme changes apply immediately without page reload
- Settings saved to both localStorage (immediate) and backend (persistence)
- Dropdown selects for UI Density and Dashboard View

**Backend Logic:**
- Stored in `CounselorSettings.display` object
- Validation ensures only valid enum values

**Validation Rules:**
- Theme: enum ["light", "dark"]
- UI Density: enum ["compact", "normal"]
- Default Dashboard View: enum ["calendar", "records", "notifications"]

---

### 3. Notification Settings

**Settings:**
- **Record Update Notifications** (Boolean)
  - Controls notifications for record creation/updates/assignments
  - Default: `true`

- **Admin Announcements** (Boolean)
  - Controls notifications for admin announcements
  - Default: `true`

- **Google Calendar Sync Alerts** (Boolean)
  - Controls alerts for calendar sync status
  - Default: `true`

- **Notification Sound** (Boolean)
  - Enables/disables sound for notifications
  - Default: `false`

**Frontend Behavior:**
- Toggle switches for each notification type
- Settings saved to backend for persistence
- Real-time toggle updates

**Backend Logic:**
- Stored in `CounselorSettings.notifications` object
- Used by notification system to filter which notifications to send
- All values validated as booleans

**Validation Rules:**
- All notification settings must be boolean values

**Integration Points:**
- Notification controller should check these settings before sending notifications
- Example: `if (counselorSettings.notifications.recordUpdates) { sendNotification(...) }`

---

### 4. Google Calendar Display Settings

**Settings:**
- **Show on Dashboard** (Boolean)
  - Toggles calendar widget visibility on dashboard
  - Default: `true`

- **Preferred View** (Day/Week/Month)
  - Sets preferred calendar view format
  - Default: "month"

**Frontend Behavior:**
- **Frontend-only** - No backend storage required
- Stored in localStorage for persistence
- Applied immediately in CalendarView component
- No API calls needed

**Backend Logic:**
- None (frontend-only preferences)

**Implementation Notes:**
- Settings stored in browser localStorage
- Persist across sessions on same device
- Can be stored in backend for cross-device sync (optional enhancement)

**Validation Rules:**
- Show on Dashboard: boolean
- Preferred View: enum ["day", "week", "month"]

---

### 5. Privacy Settings

**Settings:**
- **Hide Profile Photo from Admin** (Boolean)
  - Prevents admins from viewing profile picture in admin panels
  - Default: `false`

- **Mask Name in PDF Files** (Boolean)
  - Replaces name with generic identifier in PDF reports (if system policy allows)
  - Default: `false`

**Frontend Behavior:**
- Toggle switches for privacy options
- Settings saved to backend
- Applied in PDF generation and admin views

**Backend Logic:**
- Stored in `CounselorSettings.privacy` object
- Checked during PDF generation
- Checked in admin views when displaying counselor information

**Validation Rules:**
- All privacy settings must be boolean values

**Integration Points:**
- PDF generation: Check `maskNameInPDFs` before including counselor name
- Admin views: Check `hideProfilePhoto` before displaying profile picture

---

## Security & Access Control

### Role-Based Access Control (RBAC)

**Implementation:**
1. All routes protected by `protect` middleware
2. Controller checks `req.user.role === "counselor"`
3. Only authenticated counselors can access/modify settings
4. Admin users cannot access this module (separate admin settings)

**Access Validation:**
```javascript
if (!user || user.role !== "counselor") {
  return res.status(403).json({
    success: false,
    message: "Access denied. Only counselors can access settings."
  });
}
```

**Data Isolation:**
- Settings linked to specific `userId`
- Users can only access their own settings
- Cross-user access prevented by MongoDB queries

### Data Validation

**Backend Validation:**
- Enum validation for all select fields
- Boolean validation for all toggle fields
- Type checking before database updates
- Error messages returned for invalid inputs

**Frontend Validation:**
- Form validation before submission
- Immediate feedback on invalid selections
- User-friendly error messages

---

## Database Interactions

### Creating Settings

**Behavior:**
- Settings created automatically on first access
- Default values applied from schema
- No manual creation required

**Code:**
```javascript
CounselorSettings.getOrCreateSettings(userId, userModel, userEmail)
```

### Updating Settings

**Behavior:**
- Partial updates supported (only update provided fields)
- Existing settings merged with new values
- Timestamp updated automatically

**Code:**
```javascript
settings.display = { ...settings.display, ...display };
await settings.save();
```

### Querying Settings

**Behavior:**
- Indexed lookups by `userId` and `userModel`
- Fast retrieval via compound index
- Single document per user (unique constraint)

---

## Error Handling

### Backend Errors

**403 Forbidden:**
- User not authenticated
- User role is not "counselor"

**400 Bad Request:**
- Invalid enum values
- Type mismatches (e.g., string instead of boolean)
- Validation errors array returned

**500 Internal Server Error:**
- Database connection issues
- Unexpected errors logged with details

### Frontend Errors

**Network Errors:**
- Graceful fallback to localStorage
- User notification via SweetAlert2
- Retry mechanism available

**Validation Errors:**
- Real-time form validation
- Clear error messages
- Prevent invalid submissions

---

## UI/UX Design

### Layout

**Structure:**
- Consistent sidebar navigation across all counselor pages
- Tabbed interface for settings categories
- Clean, modern design with Tailwind CSS
- Responsive layout for mobile devices

### Components

**Tab Navigation:**
- Icon + Label for each category
- Active tab highlighted with indigo gradient
- Smooth transitions between tabs

**Form Controls:**
- Toggle switches for boolean settings
- Dropdown selects for enum choices
- Theme selection cards with visual indicators

**Save/Reset Actions:**
- Individual "Save" buttons per category
- Global "Reset to Defaults" button
- Loading states during save operations
- Success/error feedback via SweetAlert2

### User Feedback

**Success Messages:**
- "Settings Saved!" confirmation
- Automatic dismiss after 2 seconds
- Non-intrusive notification

**Error Messages:**
- Clear error descriptions
- Actionable error messages
- Support for multiple validation errors

---

## Integration Steps

### Backend Integration

1. **Register Routes in `app.js`:**
   ```javascript
   import counselorSettingsRoutes from "./routes/counselorSettingsRoutes.js";
   app.use("/api/counselor/settings", counselorSettingsRoutes);
   ```

2. **Update Notification System:**
   - Check `counselorSettings.notifications.recordUpdates` before sending record notifications
   - Check `counselorSettings.notifications.adminAnnouncements` before sending announcement notifications

3. **Update PDF Generation:**
   - Check `counselorSettings.privacy.maskNameInPDFs` before including counselor name
   - Replace with generic identifier if enabled

4. **Update Admin Views:**
   - Check `counselorSettings.privacy.hideProfilePhoto` before displaying profile pictures
   - Show placeholder if hidden

### Frontend Integration

1. **Add Route in `App.jsx`:**
   ```javascript
   import SettingsPage from "./pages/SettingsPage";
   <Route path="/settings" element={<SettingsPage />} />
   ```

2. **Apply Theme Settings:**
   - Load theme from settings on app initialization
   - Apply theme class to `document.documentElement`
   - React to theme changes in real-time

3. **Apply UI Density:**
   - Load density setting from settings
   - Apply conditional CSS classes based on density
   - Adjust spacing and font sizes accordingly

4. **Apply Dashboard View:**
   - Redirect to appropriate view on dashboard load
   - Check `defaultDashboardView` setting
   - Navigate accordingly

5. **Integrate Notification Settings:**
   - Check settings before displaying notifications
   - Respect sound preference
   - Filter notifications based on preferences

---

## Testing Checklist

### Backend Tests

- [ ] Settings created automatically on first access
- [ ] Only counselors can access settings
- [ ] Validation rejects invalid enum values
- [ ] Validation rejects non-boolean values for toggles
- [ ] Partial updates work correctly
- [ ] Settings reset to defaults correctly
- [ ] Settings isolated per user

### Frontend Tests

- [ ] Settings load correctly on page mount
- [ ] Theme applies immediately on change
- [ ] Settings save successfully
- [ ] Error handling works for network failures
- [ ] localStorage persistence works for frontend settings
- [ ] Reset to defaults works correctly
- [ ] All form controls work as expected
- [ ] Responsive design works on mobile

### Integration Tests

- [ ] Notification settings affect notification delivery
- [ ] Privacy settings affect PDF generation
- [ ] Privacy settings affect admin views
- [ ] Theme persists across page refreshes
- [ ] Dashboard redirects based on default view

---

## Future Enhancements

1. **Cross-Device Sync:**
   - Store Google Calendar preferences in backend for cross-device sync

2. **Advanced Theme Options:**
   - Custom color schemes
   - Accent color selection

3. **Notification Scheduling:**
   - Quiet hours settings
   - Notification frequency controls

4. **Export/Import Settings:**
   - Export settings as JSON
   - Import settings from file

5. **Settings Presets:**
   - Save custom presets
   - Quick switch between presets

---

## File Structure

```
backend/
  ├── models/
  │   └── CounselorSettings.js (NEW)
  ├── controllers/
  │   └── counselorSettingsController.js (NEW)
  └── routes/
      └── counselorSettingsRoutes.js (NEW)

frontend/src/
  └── pages/
      └── SettingsPage.jsx (NEW)
```

---

## API Endpoints Summary

| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| GET | `/api/counselor/settings` | Get settings | Counselor |
| PUT | `/api/counselor/settings` | Update settings | Counselor |
| POST | `/api/counselor/settings/reset` | Reset to defaults | Counselor |

---

## Conclusion

This Counselor Settings Module provides a comprehensive, secure, and user-friendly settings management system. It maintains clear separation from admin functionality, implements proper role-based access control, and offers both frontend-only and backend-persisted settings options. The module is designed to be extensible and maintainable, with clear documentation and validation at every level.

