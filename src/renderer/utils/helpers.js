/**
 * Helper Utilities
 * Common utility functions used throughout the application
 */

/**
 * Check if a value is an integer
 * @param {number} x - Value to check
 * @returns {boolean} - Whether the value is an integer
 */
function isInteger(x) {
  return Math.round(x) === x;
}

/**
 * Get the filename from a path
 * @param {string} path - File path
 * @returns {string} - Filename
 */
function getFilenameFromPath(path) {
  return path.replace(/^.*[\\\/]/, '');
}

/**
 * Format a path for display
 * @param {string} path - File path
 * @param {number} maxLength - Maximum length
 * @returns {string} - Formatted path
 */
function formatPath(path, maxLength = 50) {
  if (!path) return '';
  if (path.length <= maxLength) return path;
  
  const filename = getFilenameFromPath(path);
  const pathStart = path.substring(0, maxLength - filename.length - 3);
  return `${pathStart}...${filename}`;
}

/**
 * Debounce a function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

module.exports = {
  isInteger,
  getFilenameFromPath,
  formatPath,
  debounce
};
