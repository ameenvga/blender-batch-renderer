/**
 * FileService
 * Handles all file-related operations including loading, saving, and managing batch files
 */

const remote = require('@electron/remote');
const fs = require('fs');
const path = require('path');
const dialog = remote.dialog;
const ErrorService = require('./ErrorService').default;

class FileService {
  constructor() {
    this.batFilepath = '';
    this.blendFileMap = [];
    this.finalBatString = '';
    this.fullFilesString = '';
  }

  /**
   * Save the current batch file
   */
  saveBatFile() {
    try {
      console.log('save bat file');
      const fileContent = this.finalBatString;
      
      if (this.batFilepath !== '') {
        console.log('file is loaded already');
        try {
          fs.writeFile(this.batFilepath, fileContent, (err) => {
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
          ErrorService.handleError(error, 'FileService', 'error', true);
          this._updateStatus("Error saving file", 'red');
        }
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
              ErrorService.handleError(error, 'FileService', 'error', true);
              this._updateStatus("Error saving file", 'red');
            }
          }
        }).catch(err => {
          ErrorService.handleError(err, 'FileService', 'error', true);
          this._updateStatus("Error in save dialog", 'red');
        });
      }
    } catch (error) {
      ErrorService.handleError(error, 'FileService.saveBatFile', 'error', true);
      this._updateStatus("Unexpected error while saving", 'red');
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
          const batFileArray = JSON.parse(data.split('REM')[1]);
          console.log(batFileArray);

          // Getting blender source
          let blenderSource = '';
          try {
            if (batFileArray[1].trim().endsWith('.exe')) {
              blenderSource = batFileArray[1].trim();
            }
          } catch (error) {
            ErrorService.handleError(
              error, 
              'FileService.loadBatDetails', 
              'warning', 
              true
            );
            console.log('some problem with the blendersource identification');
          }
          
          console.log(blenderSource);
          document.getElementById('blenderPath').value = blenderSource;

          // Getting the jsonArray
          this.blendFileMap = [];
          try {
            if (JSON.parse(batFileArray[2])) {
              this.blendFileMap = JSON.parse(batFileArray[2]);
            }
          } catch (error) {
            ErrorService.handleError(
              error, 
              'FileService.loadBatDetails', 
              'warning', 
              true
            );
            console.log(error);
          }
          
          console.log(this.blendFileMap);
          
          // Getting the core number
          try {
            if (batFileArray[3]) {
              document.getElementById('coreInput').value = batFileArray[3];
            }
          } catch (error) {
            ErrorService.handleError(
              error, 
              'FileService.loadBatDetails', 
              'warning', 
              false
            );
            console.log('core number not found');
          }
          
          // Getting the shutdown boolean
          try {
            if (batFileArray[4]) {
              document.getElementById('shutCheck').checked = batFileArray[4];
            }
          } catch (error) {
            ErrorService.handleError(
              error, 
              'FileService.loadBatDetails', 
              'warning', 
              false
            );
            console.log('shutdown boolean not found');
          }
          
          this._dataChanged();
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
      
      const newObj = { 'blendName': filename, 'startFrame': start, 'endFrame': end, 'renderQ': boolQ };
      this.blendFileMap.push(newObj);
      console.log(this.blendFileMap);
      
      this._dataChanged();
    } catch (error) {
      ErrorService.handleError(error, 'FileService.addToBatchList', 'error', true);
      this._updateStatus("Error adding file to batch list", 'red');
    }
  }

  /**
   * Add a blend file to the batch list from drag and drop
   * @param {string} filename - Path to the blend file
   */
  addToBatchListFromDrag(filename) {
    try {
      console.log('addToBatchList');
      const newObj = { 'blendName': filename, 'startFrame': '', 'endFrame': '', 'renderQ': true };
      this.blendFileMap.push(newObj);
      console.log(this.blendFileMap);
      
      this._dataChanged();
    } catch (error) {
      ErrorService.handleError(error, 'FileService.addToBatchListFromDrag', 'error', true);
      this._updateStatus("Error adding file to batch list", 'red');
    }
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
   * Update the data when table data changes
   */
  tableDataChanged() {
    try {
      console.log('tableDataChanged');
      const oTable = document.getElementById('tableTbody');

      // Gets rows of table
      const rowLength = oTable.rows.length;
      this.blendFileMap = [];
      
      // Loops through rows    
      for (let i = 0; i < rowLength; i++) {
        // Gets cells of current row  
        const oCells = oTable.rows.item(i).cells;

        // Gets amount of cells of current row
        const cellLength = oCells.length;
        const renderQuestion = oCells[0].querySelector('.renderQ').checked;
        const filename = oCells[2].querySelector('.blfilename').innerHTML;
        const startFrame = oCells[3].querySelector('.startFrame').value;
        const endFrame = oCells[4].querySelector('.endFrame').value;
        
        this.addToBatchList(filename, startFrame, endFrame, renderQuestion);
      }
      
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
        const shotName = blenderFileName.replace(/^.*[\\\/]/, '');
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
        
        newTableInnerHtml += '<tr data-row="' + shotName + '" > ' + checkboxString + '  <td>' + (i + 1) + '</td>  <td> <div class="batchFileItem">   <img class="icons" data-filepath="' + blenderFileName + '" draggable="false" onclick="window.app.fileService.deleteEntry(\'' + blenderFileName + '\')" src="assets/deleteIcon.png"/>  <div class="blfilename">' + blenderFileName + '</div> </div></td>';
        
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
      const mapToSave = [];
      window.renderON = false;
      
      // Getting blender.exe source file
      const blenderSource = document.getElementById('blenderPath').value;
      if (blenderSource.trim() !== '') {
        this.finalBatString = '"' + blenderSource + '" -b';
      }

      // Getting the number of cores
      const coreNumber = document.getElementById('coreInput').value;

      // Getting all the blend files one by one 
      for (let i = 0; i < this.blendFileMap.length; i++) {
        const renderQStatus = this.blendFileMap[i]['renderQ'];
        
        if (renderQStatus) {
          const blenderFileName = this.blendFileMap[i]['blendName'];
          console.log(blenderFileName, 'is going to render');

          let startFrame = this.blendFileMap[i]['startFrame'];
          let endFrame = this.blendFileMap[i]['endFrame'];
          
          // Setting output string
          const outputFolder = document.getElementById('outputPath').value;
          const filename = blenderFileName.replace(/^.*[\\\/]/, '').replace('.blend', '');
          
          // Use path.join for proper cross-platform path handling
          let totalOutPutString;
          try {
            const outputPath = path.join(outputFolder, filename, `${filename}_#####`);
            totalOutPutString = `"${outputPath}"`;
          } catch (error) {
            ErrorService.handleError(
              error, 
              'FileService._dataChanged', 
              'warning', 
              false
            );
            // Fallback to old method if path.join fails
            totalOutPutString = '"' + outputFolder + '\\' + filename + '\\' + filename + "_#####" + '"';
          }
          
          let oneFileString = ' "' + blenderFileName + '"';

          if ((outputFolder.trim() !== '') && (outputFolder.trim() !== undefined)) {
            oneFileString += ' -o ' + totalOutPutString;
          }

          try {
            startFrame = parseInt(startFrame);
            if (this._isInteger(startFrame)) {
              oneFileString += ' -s ' + startFrame;
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
              oneFileString += ' -e ' + endFrame;
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
            const coreNum = parseInt(coreNumber);
            if (this._isInteger(coreNum)) {
              oneFileString += ' -t ' + coreNum;
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

          this.fullFilesString += oneFileString + ' -a';
          window.renderON = true;
        } else {
          const blenderFileName = this.blendFileMap[i]['blendName'];
          console.log(blenderFileName, 'is NOT going to render');
        }
      }

      this.finalBatString += this.fullFilesString;

      const shutDownBool = document.getElementById('shutCheck').checked;
      console.log(shutDownBool);
      if (shutDownBool) {
        this.finalBatString = this.finalBatString + ' && shutdown -t 0 -s -f';
      }

      console.log('========================');
      console.log(this.finalBatString);
      
      // Appending the REM section
      const mapToSaveData = [this.finalBatString, blenderSource, JSON.stringify(this.blendFileMap), coreNumber, shutDownBool];
      console.log(mapToSaveData);

      this.finalBatString += '\r\n REM ' + JSON.stringify(mapToSaveData);
      
      // Refresh table
      this._refreshTable(this.blendFileMap);
      this._justSaving();
    } catch (error) {
      ErrorService.handleError(error, 'FileService._dataChanged', 'error', true);
      this._updateStatus("Error updating batch data", 'red');
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
      
      if (this.batFilepath !== '') {
        console.log('file is loaded already');
        fs.writeFile(this.batFilepath, fileContent, (err) => {
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
      ErrorService.handleError(error, 'FileService._justSaving', 'error', true);
      this._updateStatus("Error saving file", 'red');
    }
  }
}

module.exports = FileService;
