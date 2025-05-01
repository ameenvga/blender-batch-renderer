/**
 * RenderService
 * Handles all rendering operations and related functionality
 */

const remote = require('@electron/remote');
const { shell } = remote;
const path = require('path');
const chokidar = require('chokidar');

class RenderService {
  constructor() {
    this.currentRenderingShot = 'none';
    this.renderON = false;
  }

  /**
   * Render the batch file
   */
  renderBatch() {
    console.log('render batch function');
    const batFilepath = window.app.fileService.batFilepath;
    
    if (batFilepath === '') {
      this._updateStatus("Please save the file before rendering!", 'red');
    } else {
      if (this.fileReadyForRender()) {
        shell.openPath(batFilepath);
        
        if (!document.getElementById('shutCheck').checked) {
          this._updateStatus("Rendering without system shutdown.......", 'red');
          console.log(document.getElementById('outputPath').value);
        } else {
          this._updateStatus('Rendering......Your system will shutdown after rendering completion!', 'green');
        }
        
        if (document.getElementById('outputPath').value !== '') {
          this.startWatcher(document.getElementById('outputPath').value);
        }
      } else {
        this._updateStatus("Can't render! Please make sure everything is correct.", 'red');
      }
    }
  }

  /**
   * Check if the file is ready for rendering
   * @returns {boolean} - Whether the file is ready for rendering
   */
  fileReadyForRender() {
    console.log('fileReadyForRender');
    console.log("BLEND FILE MAP");
    console.log(window.app.fileService.blendFileMap);
    
    if (document.getElementById('blenderPath').value === '') {
      return false;
    } else {
      if (this.renderON === false) {
        return false;
      } else {
        return true;
      }
    }
  }

  /**
   * Update the shutdown option
   */
  updateShutdownOption() {
    console.log('shutDown switch');
    window.app.fileService._dataChanged();
  }

  /**
   * Update the core count
   */
  updateCoreCount() {
    window.app.fileService._dataChanged();
  }

  /**
   * Start watching the output folder for new renders
   * @param {string} watchPath - Path to watch
   */
  startWatcher(watchPath) {
    console.log('Starting watcher for path:', watchPath);
    
    const watcher = chokidar.watch(watchPath, {
      ignored: /[\/\\]\./,
      persistent: true
    });

    function onWatcherReady() {
      console.info('From here can you check for real changes, the initial scan has been completed.');
    }
          
    // Declare the listeners of the watcher
    watcher
      .on('add', (path) => {
        console.log('File', path, 'has been added');
      })
      .on('addDir', (path) => {
        // var text = 'Directory ' + path + ' has been added';
        // showWhichOneRender(path)
        // updateStatus(text, 'blue')
      })
      .on('change', (path) => {
        this.updateRenderSection(path);
      })
      .on('error', (error) => {
        console.log('Error happened', error);
        this._updateStatus(error, 'red');
      })
      .on('ready', onWatcherReady);
  }

  /**
   * Update the render section with the new render
   * @param {string} path - Path to the rendered file
   */
  updateRenderSection(path) {
    console.log('updateRenderSection');
    const currentFrameDisplay = document.getElementById('currentFrame');
    const fileNameDisplay = document.getElementById('fileNameDiplay');
    const frameNumberDisplay = document.getElementById('frameNumberDisplay');
    const filename = path.replace(/^.*[\\\/]/, '');
    const frameNumber = filename.replace('.png', '').split('_');
    const frameNum = frameNumber[frameNumber.length - 1];
    const blendFileName = filename.replace('.png', '').slice(0, -6) + '.blend';
    
    // Updating details
    this.updatePreviewImage(path);

    fileNameDisplay.innerHTML = blendFileName;
    frameNumberDisplay.innerHTML = frameNum;
    currentFrameDisplay.textContent = path;

    // Setting rendered frame in startframe 
    const startFrameInputs = document.querySelectorAll(`[data-startPath='${blendFileName}']`);
    if (startFrameInputs.length > 0) {
      startFrameInputs[0].value = parseInt(frameNum);
      window.app.fileService.tableDataChanged();
      
      const rowElements = document.querySelectorAll(`[data-row='${blendFileName}']`);
      if (rowElements.length > 0) {
        rowElements[0].style.background = 'greenyellow';
      }
    }
    
    // Unchecking the rendered filename
    if (this.currentRenderingShot === 'none') {
      console.log('NONE-----------NOEN----------OENONE');
      this.currentRenderingShot = blendFileName;
    } else if (this.currentRenderingShot === blendFileName) {
      // Same shot, do nothing
    } else if ((this.currentRenderingShot !== 'none') && (this.currentRenderingShot !== blendFileName)) {
      console.log('!!!!!!!SHOT CHANGED!!!!!');
      this.uncheckPreviousShot(this.currentRenderingShot);
      this.currentRenderingShot = blendFileName;
    }
  }

  /**
   * Uncheck the previous shot
   * @param {string} shotName - Name of the shot to uncheck
   */
  uncheckPreviousShot(shotName) {
    console.log('uncheckPreviousShot');

    const lastShotCheckboxes = document.querySelectorAll(`[data-finish='${shotName}']`);
    if (lastShotCheckboxes.length > 0) {
      lastShotCheckboxes[0].checked = false;
      window.app.fileService.tableDataChanged();
    }
  }

  /**
   * Update the preview image
   * @param {string} path - Path to the image
   */
  updatePreviewImage(path) {
    console.log('updatePreviewImage');
    setTimeout(() => {
      document.getElementById('renderPreview').src = path;
    }, 3000);
  }

  /**
   * Private method to update status
   * @private
   * @param {string} text - Status text
   * @param {string} color - Status color
   */
  _updateStatus(text, color) {
    console.log('update Status');
    const statusBar = document.getElementById('statusBar');
    statusBar.innerHTML = text;
    statusBar.style.color = color;
  }
}

module.exports = RenderService;
