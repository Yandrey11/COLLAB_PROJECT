# User Stories: Profile and Settings

## Profile Management

### [CO9] As a Counselor, I want to view my profile information so that I can verify my account details are accurate.

**Acceptance Criteria:**
- The Profile Page displays the counselor's full name, email address, phone number, and bio.
- The profile picture is displayed prominently at the top of the profile section.
- All profile information is loaded automatically when the Profile Page is accessed.
- The profile data is fetched from the backend API and displayed in read-only format initially.
- If profile data is missing, appropriate placeholders or empty states are shown.
- The page shows a loading indicator while profile data is being fetched.
- If an error occurs while loading the profile, an appropriate error message is displayed.

---

### [CO10] As a Counselor, I want to update my personal information (name, email, phone number, bio) so that my profile remains current and accurate.

**Acceptance Criteria:**
- The Profile Page provides editable form fields for full name, email address, phone number, and bio.
- Full name and email fields are marked as required with an asterisk (*).
- The bio field includes a character counter showing "X/500 characters" to indicate the maximum length.
- Phone number field accepts standard phone number formats.
- Email field includes client-side validation for proper email format.
- When the form is submitted, the system validates all required fields are filled.
- The system displays a success message (e.g., "Profile updated successfully") upon successful update.
- The profile information is immediately refreshed after a successful update.
- If the update fails, an error message is displayed explaining the issue (e.g., "Failed to update profile", "Invalid email format").
- The form prevents duplicate email addresses if already in use by another account.
- Google-authenticated users see a notice that email changes should be made through Google account settings.

---

### [CO11] As a Counselor, I want to upload a profile picture so that other users can identify me visually.

**Acceptance Criteria:**
- The Profile Page includes an "Upload Picture" button that opens a file picker dialog.
- The system accepts image files in JPEG, PNG, GIF, or WebP formats only.
- The system validates file size and rejects images larger than 5MB with an error message.
- Invalid file types display an error message: "Please upload a JPEG, PNG, GIF, or WebP image".
- When an image is selected, a preview is shown immediately before upload.
- During upload, a progress indicator or loading state is displayed (e.g., "Uploading...").
- Upon successful upload, the profile picture is immediately displayed on the page.
- The uploaded image is stored on the backend server and the file path is saved in the database.
- The profile picture is displayed consistently across all pages (Dashboard, Records Page, etc.).
- If the upload fails, an error message is displayed (e.g., "Failed to upload image. Please try again.").
- The uploaded image URL is accessible and displays correctly with proper backend path resolution.

---

### [CO12] As a Counselor, I want to remove my profile picture so that I can delete an outdated or unwanted image.

**Acceptance Criteria:**
- The Profile Page includes a "Remove Picture" button that is visible when a profile picture exists.
- When selected, the system prompts the user for confirmation before removing the picture.
- Upon confirmation, the profile picture is deleted from both the server storage and database.
- After removal, a default placeholder icon is displayed in place of the profile picture.
- A success message confirms the picture has been removed (e.g., "Profile picture removed successfully").
- The removal action is reflected immediately across all pages in the application.
- If removal fails, an error message is displayed (e.g., "Failed to remove profile picture. Please try again.").
- The system logs the profile picture removal action in the activity log.

---

## Password Management

### [CO13] As a Counselor, I want to change my account password so that I can maintain account security.

**Acceptance Criteria:**
- The Settings Page (Account Settings tab) includes a "Change Password" section.
- The section displays three password fields: Current Password, New Password, and Confirm New Password.
- All password fields are required and marked with an asterisk (*).
- The new password field includes validation requirements displayed as helper text:
  - "Must be at least 8 characters with uppercase, lowercase, number, and special character"
- The system validates that the current password matches the user's existing password.
- The system validates that the new password meets the security requirements.
- The system validates that the "New Password" and "Confirm New Password" fields match.
- Upon successful password change, a success message is displayed (e.g., "Password changed successfully").
- After password change, the password form fields are cleared.
- The system logs the password change in the activity log.
- If the current password is incorrect, an error message is displayed.
- If password requirements are not met, appropriate validation errors are shown.
- If passwords don't match, an error message indicates the mismatch.
- Google-authenticated users see a notice that password changes should be made through Google account settings.
- Password changes invalidate existing sessions and require re-authentication if implemented.

---

## Display and Interface Settings

### [CO14] As a Counselor, I want to switch between light and dark themes so that I can customize the interface appearance to my preference.

**Acceptance Criteria:**
- The Settings Page includes a "Display & Interface" tab with theme selection options.
- Two theme options are presented: "Light Mode" and "Dark Mode" with visual icons (☀️ and 🌙).
- The currently selected theme is highlighted with a colored border and background.
- When a theme is selected, the entire application interface immediately updates to reflect the choice.
- The theme preference is saved to the backend database and persists across sessions.
- The theme preference is also stored in browser localStorage for immediate application on page load.
- The theme selection works consistently across all counselor-facing pages (Dashboard, Records, Reports, Profile, Settings, Notification Center).
- If theme saving fails, an error message is displayed.
- The theme preference is loaded automatically when the Settings Page is accessed.
- A "Save Display Settings" button commits the theme change to the database.

---

## Notification Settings

### [CO15] As a Counselor, I want to configure which notifications I receive so that I'm informed about relevant activities without being overwhelmed.

**Acceptance Criteria:**
- The Settings Page includes a "Notifications" tab with toggle switches for different notification types.
- Available notification toggles include:
  - Record Update Notifications: Get notified when records are created, updated, or assigned
  - Admin Announcements: Receive notifications for important announcements from administrators
  - Notification Sound: Play a sound when receiving new notifications
- Each toggle switch clearly indicates its current state (on/off).
- Toggle switches have visual feedback when clicked (smooth transition animation).
- Each notification type includes a brief description explaining what it controls.
- Notification preferences are saved to the backend database when "Save Notification Settings" is clicked.
- A success message confirms when notification settings are saved (e.g., "Notification settings saved successfully").
- Notification preferences persist across browser sessions.
- If saving fails, an error message is displayed.
- The notification preferences are loaded automatically when the Settings Page is accessed.
- Changes to notification settings take effect immediately after saving.

---

## Privacy Settings

### [CO16] As a Counselor, I want to control my privacy settings so that I can manage how my information is displayed and shared.

**Acceptance Criteria:**
- The Settings Page includes a "Privacy" tab with privacy-related toggle switches.
- Available privacy toggles include:
  - Hide Profile Photo from Admin: Prevents administrators from viewing profile picture in admin panels
  - Mask Name in PDF Files: Replaces name with generic identifier in automatically generated PDF reports (if allowed by system policy)
- Each toggle switch clearly indicates its current state (on/off).
- Each privacy option includes a brief description explaining what it controls and its implications.
- Privacy preferences are saved to the backend database when "Save Privacy Settings" is clicked.
- A success message confirms when privacy settings are saved (e.g., "Privacy settings saved successfully").
- Privacy preferences persist across browser sessions.
- If saving fails, an error message is displayed.
- The privacy preferences are loaded automatically when the Settings Page is accessed.
- When "Hide Profile Photo from Admin" is enabled, administrators cannot view the counselor's profile picture.
- When "Mask Name in PDF Files" is enabled, PDF reports generated for this counselor use anonymized identifiers instead of the actual name (subject to system policy).

---

## Activity Logs

### [CO17] As a Counselor, I want to view my account activity history so that I can monitor account access and changes.

**Acceptance Criteria:**
- The Settings Page (Account Settings tab) includes an "Account Activity Logs" section.
- Activity logs display a chronological list of account-related activities with the most recent first.
- Each log entry shows:
  - Activity description (e.g., "Profile updated", "Password changed", "Login")
  - Activity type badge with appropriate color coding
  - Date and time of the activity in a readable format
  - Activity icon for visual identification
- Activity logs support pagination with "Previous" and "Next" buttons.
- Pagination displays current page number and total pages (e.g., "Page 1 of 5").
- The activity logs section can be expanded or collapsed with a toggle button.
- A loading indicator is shown while activity logs are being fetched.
- If no activity logs exist, a message is displayed: "No activity logs found."
- Activity logs are fetched automatically when the Account Settings tab is accessed.
- Activity log entries are read-only and cannot be modified or deleted by the counselor.
- Common activity types include:
  - Profile viewed (👁️)
  - Profile updated (✏️)
  - Password changed (🔒)
  - Profile picture uploaded (📷)
  - Profile picture removed (🗑️)
  - Email updated (📧)
  - Name updated (✏️)
  - Login (🔑)
  - Logout (🚪)

---

## Settings Management

### [CO18] As a Counselor, I want to reset my settings to default values so that I can quickly restore original preferences.

**Acceptance Criteria:**
- The Settings Page header includes a "Reset to Defaults" button.
- When clicked, the system displays a confirmation dialog asking the user to confirm the reset action.
- Upon confirmation, all settings (display, notifications, privacy) are reset to their default values:
  - Theme: Light Mode
  - Record Update Notifications: Enabled
  - Admin Announcements: Enabled
  - Notification Sound: Disabled
  - Hide Profile Photo from Admin: Disabled
  - Mask Name in PDF Files: Disabled
- Default settings are saved to the backend database.
- A success message confirms the reset (e.g., "Settings reset to defaults successfully").
- The interface immediately reflects the default settings (e.g., theme changes instantly).
- If reset fails, an error message is displayed.
- The reset action is logged in the activity log.

---

### [CO19] As a Counselor, I want my settings to be saved and loaded automatically so that my preferences persist across sessions.

**Acceptance Criteria:**
- All settings changes are automatically saved to the backend database when "Save [Section] Settings" buttons are clicked.
- Settings are loaded automatically when the Settings Page is accessed.
- Settings preferences persist across browser sessions and devices when logged in with the same account.
- Settings are stored in both the backend database and browser localStorage for quick access.
- If backend storage is unavailable, settings are loaded from localStorage as a fallback.
- Theme preference is applied immediately on page load before any content is displayed.
- A loading indicator is shown while settings are being fetched from the backend.
- If settings cannot be loaded, appropriate error handling is displayed without breaking the page functionality.
- Settings are synchronized between the frontend and backend to prevent conflicts.

---

## Profile Picture Integration

### [CO20] As a Counselor, I want my profile picture to be displayed consistently across all pages so that I'm easily identifiable.

**Acceptance Criteria:**
- The profile picture uploaded on the Profile Page is displayed in:
  - Dashboard sidebar
  - Records Page sidebar
  - Reports Page sidebar
  - Notification Center sidebar
  - Profile Page main content area
  - Settings Page (if applicable)
- Profile pictures are displayed with consistent sizing (circular format, appropriate dimensions).
- Profile pictures load correctly using proper backend URL resolution.
- If a profile picture fails to load, a default placeholder icon is displayed instead.
- Profile picture URLs are properly formatted and accessible from the backend server.
- Profile pictures maintain aspect ratio and are not distorted.
- The profile picture update is reflected immediately across all pages without requiring a page refresh.
- If profile picture storage fails, an error is displayed without breaking the page layout.

---

## Settings Navigation

### [CO21] As a Counselor, I want to navigate between different settings sections easily so that I can find and modify specific preferences quickly.

**Acceptance Criteria:**
- The Settings Page includes a tabbed interface with the following tabs:
  - Account Settings (👤)
  - Display & Interface (🎨)
  - Notifications (🔔)
  - Privacy (🔒)
- Each tab clearly displays its name and icon for easy identification.
- The currently active tab is highlighted with a distinct background color.
- Clicking a tab immediately switches to that section with a smooth transition animation.
- Tab content loads instantly without page refresh.
- Each tab section displays relevant settings organized in a logical, easy-to-understand layout.
- The tab navigation is accessible and works with keyboard navigation.
- The active tab state is maintained when scrolling within the settings page.

---

## Error Handling and Validation

### [CO22] As a Counselor, I want to receive clear error messages when settings operations fail so that I can understand and resolve issues.

**Acceptance Criteria:**
- All API errors during settings operations display user-friendly error messages.
- Validation errors for form fields are displayed inline near the relevant field.
- Network errors display appropriate messages (e.g., "Network error. Please check your connection.").
- Authentication errors redirect to the login page with an appropriate message.
- Error messages are displayed using a consistent UI component (e.g., SweetAlert2).
- Error messages include actionable information when possible (e.g., "File too large. Maximum size is 5MB.").
- The system gracefully handles partial failures (e.g., if some settings save but others fail).
- Error states do not break the page layout or prevent navigation.
- Loading states are properly cleared even if an error occurs.
- Users can retry failed operations without losing their input data.

