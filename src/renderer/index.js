/**
 * Main entry point for the renderer process
 * This file initializes the application and sets up event listeners
 */

// Import services
const FileService = require('./services/FileService');
const RenderService = require('./services/RenderService');
const UIService = require('./services/UIService');
const StorageService = require('./services/StorageService');
const ErrorService = require('./services/ErrorService').default;

// Import UI components
const TableComponent = require('./components/TableComponent');
const DialogComponent = require('./components/DialogComponent');
const StatusComponent = require('./components/StatusComponent');

// Initialize services
const fileService = new FileService();
const renderService = new RenderService();
const uiService = new UIService();
const storageService = new StorageService();

// Initialize UI components
const tableComponent = new TableComponent(
  document.getElementById('tableTbody'),
  fileService,
  renderService
);
const dialogComponent = new DialogComponent(fileService);
const statusComponent = new StatusComponent(document.getElementById('statusBar'));

// Create global namespace for application
window.app = {
  fileService,
  renderService,
  uiService,
  storageService,
  tableComponent,
  dialogComponent,
  statusComponent,
  errorService: ErrorService
};

// Set up global error handler
window.addEventListener('error', (event) => {
  ErrorService.handleError(event.error || event.message, 'Window', 'error', true);
  event.preventDefault();
});

// Set up unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  ErrorService.handleError(event.reason, 'Promise', 'error', true);
  event.preventDefault();
});

// Load saved preferences
document.addEventListener('DOMContentLoaded', () => {
  // Load preferences from localStorage
  const savedPreferences = storageService.loadPreferences();
  
  // Set up UI with saved preferences
  if (savedPreferences.blenderSource) {
    document.getElementById('blenderPath').value = savedPreferences.blenderSource;
  }
  
  if (savedPreferences.savedBatFile && savedPreferences.savedBatFile !== 'newSlate') {
    fileService.loadBatDetails(savedPreferences.savedBatFile);
  }
  
  // Set up drag and drop event listeners
  setupDragAndDropListeners();
  
  // Set up button event listeners
  setupButtonListeners();
  
  // Initialize UI state
  uiService.initializeUI();
});

/**
 * Set up drag and drop event listeners
 */
function setupDragAndDropListeners() {
  document.addEventListener('drop', (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    try {
      const files = event.dataTransfer.files;
      for (let i = 0; i < files.length; i++) {
        if (files[i].path.endsWith('.blend')) {
          tableComponent.addBlendFile(files[i].path);
        }
      }
    } catch (error) {
      ErrorService.handleError(error, 'DragAndDrop', 'error', true);
    }
  });
  
  document.addEventListener('dragover', (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
}

/**
 * Set up button event listeners
 */
function setupButtonListeners() {
  // Browse button for Blender executable
  document.getElementById('browseButton').addEventListener('click', () => {
    try {
      dialogComponent.openBlenderFile();
    } catch (error) {
      ErrorService.handleError(error, 'BrowseButton', 'error', true);
    }
  });
  
  // Browse button for output folder
  document.querySelector('#outPutFolderSelector #browseButton').addEventListener('click', () => {
    try {
      dialogComponent.openOutputFolder();
    } catch (error) {
      ErrorService.handleError(error, 'OutputFolderButton', 'error', true);
    }
  });
  
  // Open folder button
  document.getElementById('openFolderButton').addEventListener('click', () => {
    try {
      dialogComponent.showOutputFolder();
    } catch (error) {
      ErrorService.handleError(error, 'OpenFolderButton', 'error', true);
    }
  });
  
  // Load button
  document.querySelector('#bottomBtns button:nth-child(1)').addEventListener('click', () => {
    try {
      dialogComponent.loadBatFile();
    } catch (error) {
      ErrorService.handleError(error, 'LoadButton', 'error', true);
    }
  });
  
  // Save button
  document.querySelector('#bottomBtns button:nth-child(2)').addEventListener('click', () => {
    try {
      fileService.saveBatFile();
    } catch (error) {
      ErrorService.handleError(error, 'SaveButton', 'error', true);
    }
  });
  
  // Render button
  document.querySelector('#bottomBtns button:nth-child(3)').addEventListener('click', () => {
    try {
      renderService.renderBatch();
    } catch (error) {
      ErrorService.handleError(error, 'RenderButton', 'error', true);
    }
  });
  
  // New button
  document.querySelector('#bottomBtns button:nth-child(4)').addEventListener('click', () => {
    try {
      fileService.newSlate();
    } catch (error) {
      ErrorService.handleError(error, 'NewButton', 'error', true);
    }
  });
  
  // Shutdown checkbox
  document.getElementById('shutCheck').addEventListener('click', () => {
    try {
      renderService.updateShutdownOption();
    } catch (error) {
      ErrorService.handleError(error, 'ShutdownCheckbox', 'error', true);
    }
  });
  
  // Core input change
  document.getElementById('coreInput').addEventListener('input', () => {
    try {
      renderService.updateCoreCount();
    } catch (error) {
      ErrorService.handleError(error, 'CoreInput', 'error', true);
    }
  });
  
  // Output path change
  document.getElementById('outputPath').addEventListener('input', () => {
    try {
      if (document.getElementById('outputPath').value.trim() === '') {
        uiService.resetOutputPath();
      }
    } catch (error) {
      ErrorService.handleError(error, 'OutputPath', 'error', true);
    }
  });
}

// Export the initialized services for use in other modules if needed
module.exports = window.app;
