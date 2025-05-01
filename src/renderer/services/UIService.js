/**
 * UIService
 * Handles UI-related operations and state management
 */

class UIService {
  constructor() {
    // Initialize UI state
    this.renderDivVisible = false;
  }

  /**
   * Initialize the UI
   */
  initializeUI() {
    // Set initial UI state
    document.getElementById('renderDiv').style.display = 'none';
    this._updateStatus('Welcome to Blender Batch Renderer!', 'green');
  }

  /**
   * Reset the output path
   */
  resetOutputPath() {
    console.log('resetOutPutPath');
    document.getElementById('renderDiv').style.display = 'none';
    document.getElementById('outputPath').value = '';
  }

  /**
   * Show the render preview
   * @param {boolean} show - Whether to show the render preview
   */
  showRenderPreview(show) {
    this.renderDivVisible = show;
    document.getElementById('renderDiv').style.display = show ? 'flex' : 'none';
  }

  /**
   * Update the status bar
   * @param {string} text - Status text
   * @param {string} color - Status color
   */
  updateStatus(text, color) {
    console.log('update Status');
    const statusBar = document.getElementById('statusBar');
    statusBar.innerHTML = text;
    statusBar.style.color = color;
  }
}

module.exports = UIService;
