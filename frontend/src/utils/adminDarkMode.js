/**
 * Utility functions to convert inline styles to Tailwind dark mode classes
 * This helps maintain consistent dark mode across admin pages
 */

/**
 * Get dark mode compatible background class
 */
export const getDarkBgClass = () => "bg-white dark:bg-gray-800";

/**
 * Get dark mode compatible text color classes
 */
export const getDarkTextClasses = {
  primary: "text-gray-900 dark:text-gray-100",
  secondary: "text-gray-600 dark:text-gray-400",
  muted: "text-gray-500 dark:text-gray-500",
  light: "text-gray-400 dark:text-gray-500",
};

/**
 * Get dark mode compatible border classes
 */
export const getDarkBorderClass = () => "border-gray-200 dark:border-gray-700";

/**
 * Common card classes with dark mode support
 */
export const cardClasses = {
  container: "bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm",
  card: "bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4",
  smallCard: "bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3",
};

