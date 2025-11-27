# Google OAuth Debug Guide

## Issue: User gets redirected back to login after successful Google OAuth

## Fixes Applied:

### 1. Enhanced Token Creation (`backend/controllers/googleAuthController.js`)
- ✅ Added comprehensive logging to track user ID format
- ✅ Ensures user ID is converted to string before creating JWT
- ✅ Logs user object details for debugging

### 2. Enhanced User Lookup (`backend/controllers/authController.js`)
- ✅ Added multiple fallback mechanisms:
  - First tries to find user by ID (converted to ObjectId if needed)
  - Then tries to find by string ID
  - Finally tries to find by email as fallback
- ✅ Added detailed logging at each step
- ✅ Logs sample GoogleUsers in database for debugging

### 3. Improved Error Handling
- ✅ Better error messages with debug information
- ✅ Frontend Dashboard logs all errors to console

## How to Debug:

### Step 1: Check Backend Logs
When you log in with Google, check the backend console for these logs:

1. **Token Creation:**
   - Look for: `🔑 Creating JWT token for Google user:`
   - Should show: userId, email, user object details
   - Look for: `✅ Google login success for...`

2. **User Lookup:**
   - Look for: `🔍 getCurrentUser: Looking up user with decoded.id:`
   - Should show: decoded ID and email
   - Look for: `✅ Found GoogleUser:` or `⚠️ User not found`

### Step 2: Check Frontend Console
Open browser DevTools and check Console tab:

1. **Token Receipt:**
   - Look for: `🔑 Received Google token from URL`

2. **API Response:**
   - Look for: `✅ User authenticated successfully:` (success)
   - Or: `🚫 Token validation failed:` (failure)
   - Check the error message and status code

### Step 3: Check Network Tab
1. Open DevTools → Network tab
2. Filter by "me" or "auth"
3. Look for request to `/api/auth/me`
4. Check:
   - **Status Code**: Should be 200 (OK)
   - **Request Headers**: Should include `Authorization: Bearer <token>`
   - **Response**: Should contain user object or error message

## Common Issues and Solutions:

### Issue 1: User not found in database
**Symptoms:**
- Backend log shows: `⚠️ User not found in User or GoogleUser collections`
- Response status: 404

**Solution:**
- Check if GoogleUser was actually created in database
- Verify the ID format matches
- Check if email matches

### Issue 2: ID format mismatch
**Symptoms:**
- Token created but user lookup fails
- Different ID formats in logs

**Solution:**
- The code now tries multiple ID formats (ObjectId, string)
- Also tries email as fallback

### Issue 3: Token not being passed correctly
**Symptoms:**
- Frontend shows: `🚫 No token found`
- Dashboard redirects immediately

**Solution:**
- Check URL parameters: Should have `?token=...`
- Check localStorage: Should contain token after redirect
- Verify token is being extracted from URL

## Next Steps:

1. **Try logging in with Google again**
2. **Check both backend and frontend console logs**
3. **Copy the error messages you see**
4. **Check the Network tab for the `/api/auth/me` request**
5. **Share the specific error messages/logs**

The comprehensive logging should now show exactly where the issue is occurring.

