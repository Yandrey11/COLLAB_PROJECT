/**
 * Centralized route-to-title mapping configuration
 * This file maps routes to their corresponding page titles
 */

export const routeTitles = {
  // Public routes
  "/": "Home",
  "/login": "Login",
  "/signup": "Sign Up",
  "/forgot-password": "Forgot Password",
  "/reset-password": "Reset Password",
  "/set-password": "Set Password",

  // Counselor routes
  "/dashboard": "Dashboard",
  "/records": "Counseling Records",
  "/reports": "Reports",
  "/notifications": "Notifications",
  "/profile": "My Profile",
  "/settings": "Settings",

  // Admin routes
  "/AdminLogin": "Admin Login",
  "/adminsignup": "Admin Sign Up",
  "/AdminDashboard": "Admin Dashboard",
  "/admin/users": "Admin User Management",
  "/admin/notifications": "Admin Notifications",
  "/admin/records": "Admin Record Management",
  "/admin/profile": "Admin Profile",
  "/admin/settings": "Admin Settings",
};

/**
 * Get title for a given route path
 * @param {string} pathname - The current route pathname
 * @returns {string} The page title
 */
export const getTitleForRoute = (pathname) => {
  // Try exact match first
  if (routeTitles[pathname]) {
    return routeTitles[pathname];
  }

  // Try to match admin routes (they might have query params)
  if (pathname.startsWith("/admin/")) {
    const basePath = pathname.split("?")[0]; // Remove query params
    if (routeTitles[basePath]) {
      return routeTitles[basePath];
    }
  }

  // Default fallback
  return "Guidance Counseling System";
};

export default routeTitles;

