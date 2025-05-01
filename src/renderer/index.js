/**
 * Main entry point for the renderer process
 * This file initializes the application and sets up event listeners
 */

// Import services
const FileService = require('./services/FileService');
const RenderService = require('./services/RenderService');
const UIService = require('./services/UIService');
const StorageService = require('./services/StorageService');

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
    
    const files = event.dataTransfer.files;
    for (let i = 0; i < files.length; i++) {
      if (files[i].path.endsWith('.blend')) {
        tableComponent.addBlendFile(files[i].path);
      }
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
    dialogComponent.openBlenderFile();
  });
  
  // Browse button for output folder
  document.querySelector('#outPutFolderSelector #browseButton').addEventListener('click', () => {
    dialogComponent.openOutputFolder();
  });
  
  // Open folder button
  document.getElementById('openFolderButton').addEventListener('click', () => {
    dialogComponent.showOutputFolder();
  });
  
  // Load button
  document.querySelector('#bottomBtns button:nth-child(1)').addEventListener('click', () => {
    dialogComponent.loadBatFile();
  });
  
  // Save button
  document.querySelector('#bottomBtns button:nth-child(2)').addEventListener('click', () => {
    fileService.saveBatFile();
  });
  
  // Render button
  document.querySelector('#bottomBtns button:nth-child(3)').addEventListener('click', () => {
    renderService.renderBatch();
  });
  
  // New button
  document.querySelector('#bottomBtns button:nth-child(4)').addEventListener('click', () => {
    fileService.newSlate();
  });
  
  // Shutdown checkbox
  document.getElementById('shutCheck').addEventListener('click', () => {
    renderService.updateShutdownOption();
  });
  
  // Core input change
  document.getElementById('coreInput').addEventListener('input', () => {
    renderService.updateCoreCount();
  });
  
  // Output path change
  document.getElementById('outputPath').addEventListener('input', () => {
    if (document.getElementById('outputPath').value.trim() === '') {
      uiService.resetOutputPath();
    }
  });
}

// Export the initialized services for use in other modules if needed
module.exports = {
  fileService,
  renderService,
  uiService,
  storageService,
  tableComponent,
  dialogComponent,
  statusComponent
};
