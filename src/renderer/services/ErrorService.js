/**
 * ErrorService.js
 * Centralized error handling service for the application
 */

class ErrorService {
    constructor() {
        this.errorLog = [];
        this.errorListeners = [];
        this.maxLogSize = 100;
        
        // Error levels
        this.ERROR_LEVELS = {
            INFO: 'info',
            WARNING: 'warning',
            ERROR: 'error',
            CRITICAL: 'critical'
        };
        
        // Initialize error display element
        this.initErrorDisplay();
    }
    
    /**
     * Initialize error display element
     */
    initErrorDisplay() {
        // Create error container if it doesn't exist
        if (!document.getElementById('error-container')) {
            const errorContainer = document.createElement('div');
            errorContainer.id = 'error-container';
            errorContainer.className = 'error-container';
            document.body.appendChild(errorContainer);
        }
    }
    
    /**
     * Handle an error
     * @param {Error|string} error - The error object or message
     * @param {string} source - The source of the error (component/service name)
     * @param {string} level - Error level (info, warning, error, critical)
     * @param {boolean} showToUser - Whether to display the error to the user
     * @returns {string} - Error ID
     */
    handleError(error, source = 'Unknown', level = 'error', showToUser = true) {
        const errorId = this.generateErrorId();
        const timestamp = new Date();
        const errorMessage = error instanceof Error ? error.message : error;
        const stack = error instanceof Error ? error.stack : new Error().stack;
        
        // Create error object
        const errorObj = {
            id: errorId,
            message: errorMessage,
            source,
            level,
            timestamp,
            stack,
            handled: false
        };
        
        // Add to log
        this.logError(errorObj);
        
        // Console output based on level
        this.consoleOutput(errorObj);
        
        // Show to user if required
        if (showToUser) {
            this.displayErrorToUser(errorObj);
        }
        
        // Notify listeners
        this.notifyListeners(errorObj);
        
        return errorId;
    }
    
    /**
     * Generate a unique error ID
     * @returns {string} - Unique error ID
     */
    generateErrorId() {
        return `err-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
    
    /**
     * Log error to internal log
     * @param {Object} errorObj - Error object
     */
    logError(errorObj) {
        this.errorLog.push(errorObj);
        
        // Trim log if it exceeds max size
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift();
        }
    }
    
    /**
     * Output error to console based on level
     * @param {Object} errorObj - Error object
     */
    consoleOutput(errorObj) {
        const { level, message, source, id } = errorObj;
        const logMessage = `[${source}] (${id}): ${message}`;
        
        switch (level) {
            case this.ERROR_LEVELS.INFO:
                console.info(logMessage);
                break;
            case this.ERROR_LEVELS.WARNING:
                console.warn(logMessage);
                break;
            case this.ERROR_LEVELS.ERROR:
            case this.ERROR_LEVELS.CRITICAL:
                console.error(logMessage);
                break;
            default:
                console.log(logMessage);
        }
    }
    
    /**
     * Display error to user
     * @param {Object} errorObj - Error object
     */
    displayErrorToUser(errorObj) {
        const { level, message, id } = errorObj;
        const container = document.getElementById('error-container');
        
        if (!container) return;
        
        // Create error element
        const errorElement = document.createElement('div');
        errorElement.className = `error-message error-${level}`;
        errorElement.id = `error-${id}`;
        
        // Create message content
        errorElement.innerHTML = `
            <div class="error-header">
                <span class="error-level">${level.toUpperCase()}</span>
                <span class="error-close" onclick="window.app.errorService.dismissError('${id}')">×</span>
            </div>
            <div class="error-content">${message}</div>
        `;
        
        // Add to container
        container.appendChild(errorElement);
        
        // Auto-dismiss non-critical errors after 5 seconds
        if (level !== this.ERROR_LEVELS.CRITICAL) {
            setTimeout(() => {
                this.dismissError(id);
            }, 5000);
        }
    }
    
    /**
     * Dismiss an error from the UI
     * @param {string} errorId - Error ID to dismiss
     */
    dismissError(errorId) {
        const errorElement = document.getElementById(`error-${errorId}`);
        if (errorElement) {
            errorElement.classList.add('dismissing');
            setTimeout(() => {
                if (errorElement.parentNode) {
                    errorElement.parentNode.removeChild(errorElement);
                }
            }, 300);
        }
        
        // Mark as handled in log
        const errorObj = this.errorLog.find(err => err.id === errorId);
        if (errorObj) {
            errorObj.handled = true;
        }
    }
    
    /**
     * Add an error listener
     * @param {Function} listener - Function to call when an error occurs
     * @returns {number} - Listener ID for removal
     */
    addListener(listener) {
        if (typeof listener === 'function') {
            this.errorListeners.push(listener);
            return this.errorListeners.length - 1;
        }
        return -1;
    }
    
    /**
     * Remove an error listener
     * @param {number} listenerId - Listener ID to remove
     */
    removeListener(listenerId) {
        if (listenerId >= 0 && listenerId < this.errorListeners.length) {
            this.errorListeners[listenerId] = null;
        }
    }
    
    /**
     * Notify all listeners of an error
     * @param {Object} errorObj - Error object
     */
    notifyListeners(errorObj) {
        this.errorListeners.forEach(listener => {
            if (typeof listener === 'function') {
                try {
                    listener(errorObj);
                } catch (err) {
                    console.error('Error in error listener:', err);
                }
            }
        });
    }
    
    /**
     * Get all errors
     * @param {boolean} onlyUnhandled - Whether to return only unhandled errors
     * @returns {Array} - Array of error objects
     */
    getErrors(onlyUnhandled = false) {
        if (onlyUnhandled) {
            return this.errorLog.filter(err => !err.handled);
        }
        return [...this.errorLog];
    }
    
    /**
     * Clear all errors
     * @param {boolean} onlyHandled - Whether to clear only handled errors
     */
    clearErrors(onlyHandled = true) {
        if (onlyHandled) {
            this.errorLog = this.errorLog.filter(err => !err.handled);
        } else {
            this.errorLog = [];
        }
    }
}

// Create a singleton instance
const errorService = new ErrorService();

// Export both the class and the singleton instance
module.exports = errorService;
