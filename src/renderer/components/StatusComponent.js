/**
 * StatusComponent
 * Handles the status bar and status updates
 */

class StatusComponent {
  constructor(statusElement) {
    this.statusElement = statusElement;
  }

  /**
   * Update the status
   * @param {string} text - Status text
   * @param {string} color - Status color
   */
  updateStatus(text, color) {
    console.log('update Status');
    this.statusElement.innerHTML = text;
    this.statusElement.style.color = color;
  }
}

module.exports = StatusComponent;
