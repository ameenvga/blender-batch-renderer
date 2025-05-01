/**
 * StorageService
 * Handles data persistence and loading preferences
 */

class StorageService {
  constructor() {
    // Initialize storage
  }

  /**
   * Load preferences from localStorage
   * @returns {Object} - Loaded preferences
   */
  loadPreferences() {
    console.log('Loading preferences');
    const preferences = {};
    
    try {
      // Load blender source
      if (localStorage.getItem('blenderSource')) {
        preferences.blenderSource = localStorage.getItem('blenderSource');
      }
      
      // Load saved bat file
      if (localStorage.getItem('savedBatFile')) {
        preferences.savedBatFile = localStorage.getItem('savedBatFile');
      }
      
      // Load other preferences as needed
      
      return preferences;
    } catch (error) {
      console.error('Error loading preferences:', error);
      return {};
    }
  }

  /**
   * Save a preference to localStorage
   * @param {string} key - Preference key
   * @param {*} value - Preference value
   */
  savePreference(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error saving preference ${key}:`, error);
    }
  }

  /**
   * Clear all preferences
   */
  clearPreferences() {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing preferences:', error);
    }
  }
}

module.exports = StorageService;
