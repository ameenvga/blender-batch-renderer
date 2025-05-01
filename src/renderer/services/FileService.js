/**
 * FileService
 * Handles all file-related operations including loading, saving, and managing batch files
 */

const remote = require('@electron/remote');
const fs = require('fs');
const path = require('path');
const dialog = remote.dialog;
const ErrorService = require('./ErrorService');

class FileService {
  constructor() {
    this.batFilepath = '';
    this.blendFileMap = [];
    this.finalBatString = '';
    this.fullFilesString = '';
    this.isSaving = false; // Flag to prevent concurrent saves
    this.lastSaveTime = 0; // To throttle saves
    this.saveThrottleMs = 500; // Minimum time between saves
  }

  /**
   * Save the current batch file
   */
  saveBatFile() {
    try {
      console.log('save bat file');
      const fileContent = this.finalBatString;
      
      // Prevent concurrent saves
      if (this.isSaving) {
        ErrorService.handleError(
          'File save in progress, please wait',
          'FileService',
          'warning',
          true
        );
        return;
      }
      
      this.isSaving = true;
      
      if (this.batFilepath !== '') {
        console.log('file is loaded already');
        
        // Create backup of existing file
        this._createBackup(this.batFilepath).then(() => {
          try {
            fs.writeFile(this.batFilepath, fileContent, (err) => {
              this.isSaving = false;
              if (err) {
                const errorMessage = `Failed to save file: ${err.message}`;
                ErrorService.handleError(err, 'FileService', 'error', true);
                this._updateStatus(errorMessage, 'red');
              } else {
                localStorage.setItem('savedBatFile', this.batFilepath);
                console.log('saved file is ', this.batFilepath);
                this._updateStatus("File saved successfully!", 'green');
              }
            });
          } catch (error) {
            this.isSaving = false;
            ErrorService.handleError(error, 'FileService', 'error', true);
            this._updateStatus("Error saving file", 'red');
          }
        }).catch(error => {
          this.isSaving = false;
          ErrorService.handleError(error, 'FileService', 'warning', true);
          // Continue with save even if backup fails
          this._updateStatus("Backup failed, proceeding with save", 'orange');
        });
      } else {
        console.log('there is no file. Save MANUALLY');
        dialog.showSaveDialog({
          filters: [
            { name: 'batch file', extensions: ['bat'] }
          ]
        }).then(result => {
          if (!result.canceled && result.filePath) {
            let filename = result.filePath;
            if (filename.endsWith(".bat")) {
              filename = filename.substring(0, filename.length - 4);
            }

            try {
              fs.writeFile(filename + ".bat", fileContent, (err) => {
                this.isSaving = false;
                if (err) {
                  const errorMessage = `Failed to save file: ${err.message}`;
                  ErrorService.handleError(err, 'FileService', 'error', true);
                  this._updateStatus(errorMessage, 'red');
                } else {
                  localStorage.setItem('savedBatFile', filename + ".bat");
                  console.log('saved file is ', filename + ".bat");
                  this.batFilepath = filename + ".bat";
                  this._updateStatus("File saved successfully!", 'green');
                }
              });
            } catch (error) {
              this.isSaving = false;
              ErrorService.handleError(error, 'FileService', 'error', true);
              this._updateStatus("Error saving file", 'red');
            }
          } else {
            this.isSaving = false;
          }
        }).catch(err => {
          this.isSaving = false;
          ErrorService.handleError(err, 'FileService', 'error', true);
          this._updateStatus("Error in save dialog", 'red');
        });
      }
    } catch (error) {
      this.isSaving = false;
      ErrorService.handleError(error, 'FileService.saveBatFile', 'error', true);
      this._updateStatus("Unexpected error while saving", 'red');
    }
  }

  /**
   * Create a backup of the batch file before saving
   * @param {string} filePath - Path to the file to backup
   * @returns {Promise} - Resolves when backup is complete
   * @private
   */
  _createBackup(filePath) {
    return new Promise((resolve, reject) => {
      try {
        const backupPath = `${filePath}.bak`;
        fs.copyFile(filePath, backupPath, (err) => {
          if (err) {
            console.warn(`Could not create backup: ${err.message}`);
            // Don't reject, just continue
            resolve();
          } else {
            console.log(`Backup created at ${backupPath}`);
            resolve();
          }
        });
      } catch (error) {
        console.warn(`Backup error: ${error.message}`);
        // Don't reject, just continue
        resolve();
      }
    });
  }

  /**
   * Delete an entry from the batch list
   * @param {string} blendfilename - Path to the blend file to delete
   */
  deleteEntry(blendfilename) {
    try {
      console.log('deleting a file from the batch');
      
      // Finding the element from JsonArray
      for (let i = 0; i < this.blendFileMap.length; i++) {
        if (this.blendFileMap[i]['blendName'] === blendfilename) {
          console.log('time to delete ', blendfilename);
          this.blendFileMap.splice(i, 1);
          // Break after finding and removing the match
          break;
        }
      }
      
      console.log('after deletion');
      console.log(this.blendFileMap);
      this._dataChanged();
      
      this._updateStatus('Deleted an item from the list!', 'red');
    } catch (error) {
      ErrorService.handleError(error, 'FileService.deleteEntry', 'error', true);
      this._updateStatus("Error deleting file from batch list", 'red');
    }
  }

  /**
   * Add a blend file to the batch list from drag and drop
   * @param {string} filename - Path to the blend file
   */
  addToBatchListFromDrag(filename) {
    try {
      console.log('addToBatchList');
      
      // Validate the file exists
      if (!this._fileExists(filename)) {
        ErrorService.handleError(
          `File not found: ${filename}`,
          'FileService.addToBatchListFromDrag',
          'warning',
          true
        );
        this._updateStatus(`File not found: ${path.basename(filename)}`, 'red');
        return;
      }
      
      // Check if file is already in the list
      const isDuplicate = this.blendFileMap.some(item => item.blendName === filename);
      if (isDuplicate) {
        ErrorService.handleError(
          `File already in batch: ${filename}`,
          'FileService.addToBatchListFromDrag',
          'warning',
          true
        );
        this._updateStatus(`File already in batch: ${path.basename(filename)}`, 'orange');
        return;
      }
      
      // Validate it's a blend file
      if (!filename.toLowerCase().endsWith('.blend')) {
        ErrorService.handleError(
          `Not a Blender file: ${filename}`,
          'FileService.addToBatchListFromDrag',
          'warning',
          true
        );
        this._updateStatus(`Not a Blender file: ${path.basename(filename)}`, 'red');
        return;
      }
      
      const newObj = { 'blendName': filename, 'startFrame': '', 'endFrame': '', 'renderQ': true };
      this.blendFileMap.push(newObj);
      console.log(this.blendFileMap);
      
      this._dataChanged();
      this._updateStatus(`Added: ${path.basename(filename)}`, 'green');
    } catch (error) {
      ErrorService.handleError(error, 'FileService.addToBatchListFromDrag', 'error', true);
      this._updateStatus("Error adding file to batch list", 'red');
    }
  }
  
  /**
   * Check if a file exists
   * @param {string} filepath - Path to the file
   * @returns {boolean} - Whether the file exists
   * @private
   */
  _fileExists(filepath) {
    try {
      return fs.existsSync(filepath);
    } catch (error) {
      console.warn(`Error checking if file exists: ${error.message}`);
      return false;
    }
  }

  /**
   * Create a new batch file
   */
  newSlate() {
    try {
      console.log('newSlate');
      localStorage.setItem('savedBatFile', 'newSlate');
      this._updateStatus('You are creating a new batch file!', 'green');

      this.blendFileMap = [];
      this.batFilepath = '';
      document.getElementById('coreInput').value = '';
      document.getElementById('shutCheck').checked = false;
      this._resetOutputPath();
      this._dataChanged();
    } catch (error) {
      ErrorService.handleError(error, 'FileService.newSlate', 'error', true);
      this._updateStatus("Error creating new batch file", 'red');
    }
  }

  /**
   * Load a batch file
   */
  loadBatFile() {
    try {
      console.log('loadBatFile');
      dialog.showOpenDialog({
        filters: [
          { name: 'batch file', extensions: ['bat'] }
        ]
      }).then(result => {
        if (!result.canceled && result.filePaths.length > 0) {
          console.log("selected file");
          const openedfilename = result.filePaths[0];
          
          // Validate the file exists
          if (!this._fileExists(openedfilename)) {
            ErrorService.handleError(
              `File not found: ${openedfilename}`,
              'FileService.loadBatFile',
              'error',
              true
            );
            this._updateStatus(`File not found: ${path.basename(openedfilename)}`, 'red');
            return;
          }
          
          this.loadBatDetails(openedfilename);
          localStorage.setItem('savedBatFile', openedfilename);
        }
      }).catch(err => {
        ErrorService.handleError(err, 'FileService.loadBatFile', 'error', true);
        this._updateStatus("Error opening file dialog", 'red');
      });
    } catch (error) {
      ErrorService.handleError(error, 'FileService.loadBatFile', 'error', true);
      this._updateStatus("Unexpected error while loading file", 'red');
    }
  }

  /**
   * Load batch file details
   * @param {string} batfilename - Path to the batch file
   */
  loadBatDetails(batfilename) {
    try {
      console.log('load Bat Details');
      this.batFilepath = batfilename;
      console.log(this.batFilepath);
      
      fs.readFile(batfilename, 'utf-8', (err, data) => {
        if (err) {
          const errorMessage = `Failed to read file: ${err.message}`;
          ErrorService.handleError(err, 'FileService.loadBatDetails', 'error', true);
          this._updateStatus(errorMessage, 'red');
          this._resetAll();
          return;
        }
        
        try {
          // Check if the file contains REM metadata
          if (!data.includes('\r\n REM ') && !data.includes('\n REM ')) {
            ErrorService.handleError(
              'Not a valid batch file - missing metadata',
              'FileService.loadBatDetails',
              'error',
              true
            );
            this._updateStatus('Not a valid batch file format', 'red');
            this._resetAll();
            return;
          }
          
          // Extract metadata - handle different line ending formats
          let remPart = '';
          if (data.includes('\r\n REM ')) {
            remPart = data.split('\r\n REM ')[1];
          } else {
            remPart = data.split('\n REM ')[1];
          }
          
          if (!remPart) {
            ErrorService.handleError(
              'Invalid batch file format - cannot parse metadata',
              'FileService.loadBatDetails',
              'error',
              true
            );
            this._updateStatus('Invalid batch file format', 'red');
            this._resetAll();
            return;
          }
          
          // Try to parse the metadata
          let metadata;
          try {
            metadata = JSON.parse(remPart);
          } catch (parseError) {
            ErrorService.handleError(
              parseError,
              'FileService.loadBatDetails',
              'error',
              true
            );
            this._updateStatus('Invalid batch file metadata format', 'red');
            this._resetAll();
            return;
          }
          
          // Handle different metadata formats (backward compatibility)
          if (Array.isArray(metadata)) {
            // Old format [command, blenderSource, blendFiles, coreNumber, shutDownBool]
            this._loadLegacyFormat(metadata);
          } else {
            // New format {command, blenderSource, blendFiles, coreNumber, shutDownBool}
            this._loadNewFormat(metadata);
          }
          
          this._updateStatus('Batch file loaded successfully!', 'green');
        } catch (parseError) {
          ErrorService.handleError(
            parseError, 
            'FileService.loadBatDetails', 
            'error', 
            true
          );
          this._updateStatus('Invalid batch file format', 'red');
          this._resetAll();
        }
      });
    } catch (error) {
      ErrorService.handleError(error, 'FileService.loadBatDetails', 'error', true);
      this._updateStatus("Error loading batch file details", 'red');
    }
  }
  
  /**
   * Load legacy format batch file
   * @param {Array} metadata - Array of metadata from old format
   * @private
   */
  _loadLegacyFormat(metadata) {
    try {
      console.log('Loading legacy format');
      
      // Getting blender source
      let blenderSource = '';
      try {
        if (metadata[1] && typeof metadata[1] === 'string') {
          blenderSource = metadata[1].trim();
          document.getElementById('blenderPath').value = blenderSource;
        }
      } catch (error) {
        ErrorService.handleError(
          error, 
          'FileService._loadLegacyFormat', 
          'warning', 
          true
        );
        console.log('Problem with blender source identification');
      }
      
      // Getting the blend files array
      try {
        let blendFiles = [];
        if (metadata[2]) {
          // Handle case where files are already parsed or need parsing
          if (typeof metadata[2] === 'string') {
            blendFiles = JSON.parse(metadata[2]);
          } else {
            blendFiles = metadata[2];
          }
          
          // Validate blend files
          if (Array.isArray(blendFiles)) {
            this.blendFileMap = blendFiles.filter(file => {
              return file && typeof file === 'object' && 'blendName' in file;
            });
          }
        }
      } catch (error) {
        ErrorService.handleError(
          error, 
          'FileService._loadLegacyFormat', 
          'warning', 
          true
        );
        console.log('Problem parsing blend files');
        this.blendFileMap = [];
      }
      
      // Getting the core number
      try {
        if (metadata[3]) {
          document.getElementById('coreInput').value = metadata[3];
        }
      } catch (error) {
        ErrorService.handleError(
          error, 
          'FileService._loadLegacyFormat', 
          'warning', 
          false
        );
        console.log('Core number not found');
      }
      
      // Getting the shutdown boolean
      try {
        if (metadata[4] !== undefined) {
          document.getElementById('shutCheck').checked = Boolean(metadata[4]);
        }
      } catch (error) {
        ErrorService.handleError(
          error, 
          'FileService._loadLegacyFormat', 
          'warning', 
          false
        );
        console.log('Shutdown boolean not found');
      }
      
      this._dataChanged();
    } catch (error) {
      ErrorService.handleError(
        error, 
        'FileService._loadLegacyFormat', 
        'error', 
        true
      );
      this._resetAll();
    }
  }
  
  /**
   * Load new format batch file
   * @param {Object} metadata - Object of metadata from new format
   * @private
   */
  _loadNewFormat(metadata) {
    try {
      console.log('Loading new format');
      
      // Getting blender source
      if (metadata.blenderSource) {
        document.getElementById('blenderPath').value = metadata.blenderSource;
      }
      
      // Getting the blend files array
      if (metadata.blendFiles && Array.isArray(metadata.blendFiles)) {
        this.blendFileMap = metadata.blendFiles.filter(file => {
          return file && typeof file === 'object' && 'blendName' in file;
        });
      }
      
      // Getting the core number
      if (metadata.coreNumber) {
        document.getElementById('coreInput').value = metadata.coreNumber;
      }
      
      // Getting the shutdown boolean
      if (metadata.shutDownBool !== undefined) {
        document.getElementById('shutCheck').checked = Boolean(metadata.shutDownBool);
      }
      
      this._dataChanged();
    } catch (error) {
      ErrorService.handleError(
        error, 
        'FileService._loadNewFormat', 
        'error', 
        true
      );
      this._resetAll();
    }
  }

  /**
   * Add a blend file to the batch list
   * @param {string} filename - Path to the blend file
   * @param {string} start - Start frame
   * @param {string} end - End frame
   * @param {boolean} boolQ - Whether to render this file
   */
  addToBatchList(filename, start, end, boolQ) {
    try {
      console.log('addToBatchList');
      console.log(filename);
      console.log(boolQ);
      
      // Check if file is already in the list
      const isDuplicate = this.blendFileMap.some(item => item.blendName === filename);
      if (isDuplicate) {
        // If it's already in the list, this is an update, not an add
        // Find and update the existing entry
        for (let i = 0; i < this.blendFileMap.length; i++) {
          if (this.blendFileMap[i].blendName === filename) {
            this.blendFileMap[i].startFrame = start;
            this.blendFileMap[i].endFrame = end;
            this.blendFileMap[i].renderQ = boolQ;
            break;
          }
        }
      } else {
        // Add as a new entry
        const newObj = { 'blendName': filename, 'startFrame': start, 'endFrame': end, 'renderQ': boolQ };
        this.blendFileMap.push(newObj);
      }
      
      console.log(this.blendFileMap);
      this._dataChanged();
    } catch (error) {
      ErrorService.handleError(error, 'FileService.addToBatchList', 'error', true);
      this._updateStatus("Error adding file to batch list", 'red');
    }
  }

  /**
   * Update the data when table data changes
   */
  tableDataChanged() {
    try {
      console.log('tableDataChanged');
      const oTable = document.getElementById('tableTbody');

      // Gets rows of table
      const rowLength = oTable.rows.length;
      
      // Store current files to detect removals
      const oldFiles = this.blendFileMap.map(item => item.blendName);
      const newFiles = [];
      
      // Create a new blendFileMap
      const updatedMap = [];
      
      // Loops through rows    
      for (let i = 0; i < rowLength; i++) {
        // Gets cells of current row  
        const oCells = oTable.rows.item(i).cells;

        // Gets amount of cells of current row
        const renderQuestion = oCells[0].querySelector('.renderQ').checked;
        const filename = oCells[2].querySelector('.blfilename').innerHTML;
        const startFrame = oCells[3].querySelector('.startFrame').value;
        const endFrame = oCells[4].querySelector('.endFrame').value;
        
        newFiles.push(filename);
        updatedMap.push({
          'blendName': filename,
          'startFrame': startFrame,
          'endFrame': endFrame,
          'renderQ': renderQuestion
        });
      }
      
      // Update the blendFileMap
      this.blendFileMap = updatedMap;
      this._dataChanged();
    } catch (error) {
      ErrorService.handleError(error, 'FileService.tableDataChanged', 'error', true);
      this._updateStatus("Error updating table data", 'red');
    }
  }

  /**
   * Private method to update status
   * @private
   * @param {string} text - Status text
   * @param {string} color - Status color
   */
  _updateStatus(text, color) {
    try {
      console.log('update Status');
      const statusBar = document.getElementById('statusBar');
      statusBar.innerHTML = text;
      statusBar.style.color = color;
    } catch (error) {
      ErrorService.handleError(error, 'FileService._updateStatus', 'error', true);
      console.log("Error updating status");
    }
  }

  /**
   * Private method to reset output path
   * @private
   */
  _resetOutputPath() {
    try {
      console.log('resetOutPutPath');
      document.getElementById('renderDiv').style.display = 'none';
      document.getElementById('outputPath').value = '';
    } catch (error) {
      ErrorService.handleError(error, 'FileService._resetOutputPath', 'error', true);
      console.log("Error resetting output path");
    }
  }

  /**
   * Private method to reset all
   * @private
   */
  _resetAll() {
    try {
      this.blendFileMap = [];
      this.batFilepath = '';
      document.getElementById('coreInput').value = '';
      document.getElementById('shutCheck').checked = false;
      this._resetOutputPath();
      this._dataChanged();
    } catch (error) {
      ErrorService.handleError(error, 'FileService._resetAll', 'error', true);
      console.log("Error resetting all");
    }
  }

  /**
   * Private method to refresh table
   * @private
   * @param {Array} blendFileMap - Array of blend files
   */
  _refreshTable(blendFileMap) {
    try {
      console.log('refreshTable');
      let newTableInnerHtml = '';
      const tableTbody = document.getElementById('tableTbody');
      tableTbody.innerHTML = newTableInnerHtml;
      
      // Getting data from batDataString
      for (let i = 0; i < blendFileMap.length; i++) {
        const blenderFileName = blendFileMap[i]['blendName'];
        const shotName = path.basename(blenderFileName);
        let startFrame = blendFileMap[i]['startFrame'];
        let endFrame = blendFileMap[i]['endFrame'];
        const renderQStatus = blendFileMap[i]['renderQ'];
        let checkboxString = '';
        
        if (renderQStatus) {
          window.renderON = true;
          checkboxString = ' <td> <input type="checkbox" class="renderQ" data-finish="' + shotName + '" checked> </td>';
        } else {
          checkboxString = ' <td> <input type="checkbox" class="renderQ" data-finish="' + shotName + '" > </td>';
        }
        
        newTableInnerHtml += '<tr data-row="' + shotName + '" > ' + checkboxString + '  <td>' + (i + 1) + '</td>  <td> <div class="batchFileItem">   <img class="icons" data-filepath="' + blenderFileName + '" draggable="false" onclick="window.app.fileService.deleteEntry(\'' + blenderFileName + '\')" src="../../assets/deleteIcon.png"/>  <div class="blfilename">' + blenderFileName + '</div> </div></td>';
        
        try {
          startFrame = parseInt(startFrame);
          if (this._isInteger(startFrame)) {
            newTableInnerHtml += '<td> <input class="startFrame" data-startPath="' + shotName + '" type="number" value =' + startFrame + '> </td>';
          } else {
            newTableInnerHtml += '<td ><input class="startFrame" data-startPath="' + shotName + '" type="number"></td>';
          }
        } catch (e) {
          ErrorService.handleError(
            e, 
            'FileService._refreshTable', 
            'warning', 
            false
          );
          console.log('error in frame numbering');
          newTableInnerHtml += '<td ><input class="startFrame" data-startPath="' + shotName + '" type="number"></td>';
        }
        
        try {
          endFrame = parseInt(endFrame);
          if (this._isInteger(endFrame)) {
            newTableInnerHtml += '<td> <input class="endFrame" type="number" value =' + endFrame + '> </td>';
          } else {
            newTableInnerHtml += '<td ><input class="endFrame" type="number"></td>';
          }
        } catch (e) {
          ErrorService.handleError(
            e, 
            'FileService._refreshTable', 
            'warning', 
            false
          );
          console.log('error in frame numbering');
          newTableInnerHtml += '<td ><input class="endFrame" type="number"></td>';
        }
        
        newTableInnerHtml += '</tr>';
      }
      
      tableTbody.innerHTML = newTableInnerHtml;
      
      // Add event listeners to the table elements
      this._addTableEventListeners();
    } catch (error) {
      ErrorService.handleError(error, 'FileService._refreshTable', 'error', true);
      console.log("Error refreshing table");
    }
  }

  /**
   * Private method to add event listeners to table elements
   * @private
   */
  _addTableEventListeners() {
    try {
      const self = this;
      
      // Add event listeners to startFrame and endFrame inputs
      const startFrameInputs = document.querySelectorAll('.startFrame');
      const endFrameInputs = document.querySelectorAll('.endFrame');
      const renderQCheckboxes = document.querySelectorAll('.renderQ');
      
      startFrameInputs.forEach(input => {
        input.addEventListener('change', () => self.tableDataChanged());
      });
      
      endFrameInputs.forEach(input => {
        input.addEventListener('change', () => self.tableDataChanged());
      });
      
      renderQCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => self.tableDataChanged());
      });
    } catch (error) {
      ErrorService.handleError(error, 'FileService._addTableEventListeners', 'error', true);
      console.log("Error adding event listeners to table elements");
    }
  }

  /**
   * Private method to check if a number is an integer
   * @private
   * @param {number} x - Number to check
   * @returns {boolean} - Whether the number is an integer
   */
  _isInteger(x) {
    try {
      return Math.round(x) === x;
    } catch (error) {
      ErrorService.handleError(error, 'FileService._isInteger', 'error', true);
      console.log("Error checking if number is integer");
      return false;
    }
  }

  /**
   * Private method to update data when changes are made
   * @private
   */
  _dataChanged() {
    try {
      console.log('dataChanged');
      
      // Try to rearrange data file with all the details
      
      // Save the change in file or warn the user to save the file
      this.finalBatString = '';
      this.fullFilesString = '';
      window.renderON = false;
      
      // Store the state in a single state object
      const state = {
        blenderSource: document.getElementById('blenderPath').value.trim(),
        coreNumber: document.getElementById('coreInput').value.trim(),
        outputFolder: document.getElementById('outputPath').value.trim(),
        shutDownBool: document.getElementById('shutCheck').checked
      };
      
      // Getting blender.exe source file
      if (state.blenderSource !== '') {
        this.finalBatString = `"${state.blenderSource}" -b`;
      }

      // Getting all the blend files one by one 
      for (let i = 0; i < this.blendFileMap.length; i++) {
        const renderQStatus = this.blendFileMap[i]['renderQ'];
        
        if (renderQStatus) {
          const blenderFileName = this.blendFileMap[i]['blendName'];
          console.log(blenderFileName, 'is going to render');

          let startFrame = this.blendFileMap[i]['startFrame'];
          let endFrame = this.blendFileMap[i]['endFrame'];
          
          // Setting output string
          if (state.outputFolder) {
            const fileBaseName = path.basename(blenderFileName, '.blend');
            
            // Build output path properly for all platforms
            try {
              // Create output path segments
              const outputDir = path.join(state.outputFolder, fileBaseName);
              const outputFile = `${fileBaseName}_#####`;
              const outputPath = path.join(outputDir, outputFile);
              
              // Build command string with proper path handling
              let oneFileString = ` "${blenderFileName}"`;
              oneFileString += ` -o "${outputPath}"`;
              
              // Add frame range if specified
              try {
                startFrame = parseInt(startFrame);
                if (this._isInteger(startFrame)) {
                  oneFileString += ` -s ${startFrame}`;
                }
              } catch (e) {
                ErrorService.handleError(
                  e, 
                  'FileService._dataChanged', 
                  'warning', 
                  false
                );
                console.log('error in frame numbering');
              }
              
              try {
                endFrame = parseInt(endFrame);
                if (this._isInteger(endFrame)) {
                  oneFileString += ` -e ${endFrame}`;
                }
              } catch (e) {
                ErrorService.handleError(
                  e, 
                  'FileService._dataChanged', 
                  'warning', 
                  false
                );
                console.log('error in frame numbering');
              }

              // Add core count if specified
              try {
                const coreNum = parseInt(state.coreNumber);
                if (this._isInteger(coreNum)) {
                  oneFileString += ` -t ${coreNum}`;
                }
              } catch (e) {
                ErrorService.handleError(
                  e, 
                  'FileService._dataChanged', 
                  'warning', 
                  false
                );
                console.log('error in core numbering');
              }

              this.fullFilesString += `${oneFileString} -a`;
              window.renderON = true;
            } catch (error) {
              ErrorService.handleError(
                error, 
                'FileService._dataChanged', 
                'warning', 
                false
              );
              console.log('Error creating output path');
            }
          } else {
            // No output folder specified, just add the blend file
            this.fullFilesString += ` "${blenderFileName}" -a`;
            window.renderON = true;
          }
        } else {
          const blenderFileName = this.blendFileMap[i]['blendName'];
          console.log(blenderFileName, 'is NOT going to render');
        }
      }

      this.finalBatString += this.fullFilesString;

      if (state.shutDownBool) {
        this.finalBatString = this.finalBatString + ' && shutdown -t 0 -s -f';
      }

      console.log('========================');
      console.log(this.finalBatString);
      
      // Create a clean metadata object
      const metadata = {
        command: this.finalBatString,
        blenderSource: state.blenderSource,
        blendFiles: this.blendFileMap,
        coreNumber: state.coreNumber,
        shutDownBool: state.shutDownBool
      };
      
      // Appending the REM section - only stringify the object once
      const metadataString = JSON.stringify(metadata);
      this.finalBatString += '\r\n REM ' + metadataString;
      
      // Refresh table
      this._refreshTable(this.blendFileMap);
      
      // Throttle saves to prevent too many disk operations
      this._throttledSaving();
    } catch (error) {
      ErrorService.handleError(error, 'FileService._dataChanged', 'error', true);
      this._updateStatus("Error updating batch data", 'red');
    }
  }

  /**
   * Throttled version of _justSaving to prevent too many writes
   * @private
   */
  _throttledSaving() {
    const now = Date.now();
    if (now - this.lastSaveTime > this.saveThrottleMs) {
      this.lastSaveTime = now;
      this._justSaving();
    } else {
      // Schedule a save for later if we're saving too frequently
      clearTimeout(this._saveTimeout);
      this._saveTimeout = setTimeout(() => {
        this.lastSaveTime = Date.now();
        this._justSaving();
      }, this.saveThrottleMs);
    }
  }

  /**
   * Private method to save the batch file
   * @private
   */
  _justSaving() {
    try {
      console.log('justSaving');
      const fileContent = this.finalBatString;
      
      // Prevent concurrent saves
      if (this.isSaving) {
        console.log('Save already in progress, skipping');
        return;
      }
      
      if (this.batFilepath !== '') {
        console.log('file is loaded already');
        this.isSaving = true;
        
        fs.writeFile(this.batFilepath, fileContent, (err) => {
          this.isSaving = false;
          if (err) {
            ErrorService.handleError(err, 'FileService._justSaving', 'error', true);
            console.log(err);
            this._updateStatus("Error updating file", 'red');
          } else {
            localStorage.setItem('savedBatFile', this.batFilepath);
            console.log('saved file is ', this.batFilepath);
            window.dataChecker = fileContent;
            this._updateStatus("File updated successfully!", 'green');
          }
        });
      } else {
        this._updateStatus('Welcome! This file is not saved!', 'red');
      }
    } catch (error) {
      this.isSaving = false;
      ErrorService.handleError(error, 'FileService._justSaving', 'error', true);
      this._updateStatus("Error saving file", 'red');
    }
  }
}

module.exports = FileService;
