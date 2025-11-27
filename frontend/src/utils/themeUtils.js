/**
 * Theme Utility Functions
 * Manages light/dark mode across the application
 */

/**
 * Apply theme to document
 * @param {string} theme - 'light' or 'dark'
 */
export const applyTheme = (theme) => {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  // Store theme preference
  localStorage.setItem("theme", theme);
};

/**
 * Get current theme from localStorage or default to 'light'
 * @returns {string} - 'light' or 'dark'
 */
export const getCurrentTheme = () => {
  return localStorage.getItem("theme") || "light";
};

/**
 * Initialize theme on app load
 * Checks localStorage, settings API, or defaults to light mode
 */
export const initializeTheme = async () => {
  // First check localStorage for immediate theme
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    applyTheme(savedTheme);
    return savedTheme;
  }

  // Try to fetch from settings API
  try {
    const token = localStorage.getItem("token");
    if (token) {
      const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${BASE_URL}/api/counselor/settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.settings?.display?.theme) {
          applyTheme(data.settings.display.theme);
          return data.settings.display.theme;
        }
      }
    }
  } catch (error) {
    console.error("Error fetching theme from settings:", error);
  }

  // Default to light mode
  applyTheme("light");
  return "light";
};

/**
 * Toggle theme between light and dark
 * @returns {string} - The new theme ('light' or 'dark')
 */
export const toggleTheme = () => {
  const currentTheme = getCurrentTheme();
  const newTheme = currentTheme === "light" ? "dark" : "light";
  applyTheme(newTheme);
  return newTheme;
};

