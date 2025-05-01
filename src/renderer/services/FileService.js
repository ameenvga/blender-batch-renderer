/**
 * FileService
 * Handles all file-related operations including loading, saving, and managing batch files
 */

const remote = require('@electron/remote');
const fs = require('fs');
const path = require('path');
const dialog = remote.dialog;

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
    console.log('save bat file');
    const fileContent = this.finalBatString;
    
    if (this.batFilepath !== '') {
      console.log('file is loaded already');
      fs.writeFile(this.batFilepath, fileContent, (err) => {
        if (err) {
          console.log(err);
          alert(err);
        } else {
          localStorage.setItem('savedBatFile', this.batFilepath);
          console.log('saved file is ', this.batFilepath);
          this._updateStatus("File saved successfully!", 'green');
        }
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

          fs.writeFile(filename + ".bat", fileContent, (err) => {
            if (err) console.log(err);
            else {
              localStorage.setItem('savedBatFile', filename + ".bat");
              console.log('saved file is ', filename + ".bat");
              this.batFilepath = filename + ".bat";
              this._updateStatus("File saved successfully!", 'green');
            }
          });
        }
      }).catch(err => {
        console.log(err);
      });
    }
  }

  /**
   * Create a new batch file
   */
  newSlate() {
    console.log('newSlate');
    localStorage.setItem('savedBatFile', 'newSlate');
    this._updateStatus('You are creating a new batch file!', 'green');

    this.blendFileMap = [];
    this.batFilepath = '';
    document.getElementById('coreInput').value = '';
    document.getElementById('shutCheck').checked = false;
    this._resetOutputPath();
    this._dataChanged();
  }

  /**
   * Load a batch file
   */
  loadBatFile() {
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
      console.log(err);
    });
  }

  /**
   * Load batch file details
   * @param {string} batfilename - Path to the batch file
   */
  loadBatDetails(batfilename) {
    console.log('load Bat Details');
    this.batFilepath = batfilename;
    console.log(this.batFilepath);
    
    fs.readFile(batfilename, 'utf-8', (err, data) => {
      if (err) {
        alert('Looks like the file is missing');
        this._resetAll();
        return;
      }
      
      const batFileArray = JSON.parse(data.split('REM')[1]);
      console.log(batFileArray);

      // Getting blender source
      let blenderSource = '';
      try {
        if (batFileArray[1].trim().endsWith('.exe')) {
          blenderSource = batFileArray[1].trim();
        }
      } catch (error) {
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
        console.log(error);
      }
      
      console.log(this.blendFileMap);
      this._refreshTable(this.blendFileMap);

      // Getting the number of cores
      let coreNumber = '';
      if (batFileArray[3]) {
        coreNumber = batFileArray[3].trim();
      }
      
      console.log(coreNumber);
      document.getElementById('coreInput').value = coreNumber;

      // Getting shutDownValue
      let shutDownBool = false;
      try {
        if (batFileArray[4].trim() === 'true') {
          shutDownBool = true;
          document.getElementById('shutCheck').checked = true;
        } else {
          document.getElementById('shutCheck').checked = false;
        }
      } catch (error) {
        document.getElementById('shutCheck').checked = false;
      }
      
      console.log(shutDownBool);
    });
  }

  /**
   * Add a blend file to the batch list
   * @param {string} filename - Path to the blend file
   * @param {string} start - Start frame
   * @param {string} end - End frame
   * @param {boolean} boolQ - Whether to render this file
   */
  addToBatchList(filename, start, end, boolQ) {
    console.log('addToBatchList');
    console.log(filename);
    console.log(boolQ);
    
    const newObj = { 'blendName': filename, 'startFrame': start, 'endFrame': end, 'renderQ': boolQ };
    this.blendFileMap.push(newObj);
    console.log(this.blendFileMap);
    
    this._dataChanged();
  }

  /**
   * Add a blend file to the batch list from drag and drop
   * @param {string} filename - Path to the blend file
   */
  addToBatchListFromDrag(filename) {
    console.log('addToBatchList');
    const newObj = { 'blendName': filename, 'startFrame': '', 'endFrame': '', 'renderQ': true };
    this.blendFileMap.push(newObj);
    console.log(this.blendFileMap);
    
    this._dataChanged();
  }

  /**
   * Delete an entry from the batch list
   * @param {string} blendfilename - Path to the blend file to delete
   */
  deleteEntry(blendfilename) {
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
  }

  /**
   * Update the data when table data changes
   */
  tableDataChanged() {
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

  /**
   * Private method to reset output path
   * @private
   */
  _resetOutputPath() {
    console.log('resetOutPutPath');
    document.getElementById('renderDiv').style.display = 'none';
    document.getElementById('outputPath').value = '';
  }

  /**
   * Private method to reset all
   * @private
   */
  _resetAll() {
    this.blendFileMap = [];
    this.batFilepath = '';
    document.getElementById('coreInput').value = '';
    document.getElementById('shutCheck').checked = false;
    this._resetOutputPath();
    this._dataChanged();
  }

  /**
   * Private method to refresh table
   * @private
   * @param {Array} blendFileMap - Array of blend files
   */
  _refreshTable(blendFileMap) {
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
        console.log('error in frame numbering');
        newTableInnerHtml += '<td ><input class="endFrame" type="number"></td>';
      }
      
      newTableInnerHtml += '</tr>';
    }
    
    tableTbody.innerHTML = newTableInnerHtml;
    
    // Add event listeners to the table elements
    this._addTableEventListeners();
  }

  /**
   * Private method to add event listeners to table elements
   * @private
   */
  _addTableEventListeners() {
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
  }

  /**
   * Private method to check if a number is an integer
   * @private
   * @param {number} x - Number to check
   * @returns {boolean} - Whether the number is an integer
   */
  _isInteger(x) {
    return Math.round(x) === x;
  }

  /**
   * Private method to update data when changes are made
   * @private
   */
  _dataChanged() {
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
        const totalOutPutString = '"' + outputFolder + '\\' + filename + '\\' + filename + "_#####" + '"';
        
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
          console.log('error in frame numbering');
        }
        
        try {
          endFrame = parseInt(endFrame);
          if (this._isInteger(endFrame)) {
            oneFileString += ' -e ' + endFrame;
          }
        } catch (e) {
          console.log('error in frame numbering');
        }

        try {
          const coreNum = parseInt(coreNumber);
          if (this._isInteger(coreNum)) {
            oneFileString += ' -t ' + coreNum;
          }
        } catch (e) {
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
  }

  /**
   * Private method to save the batch file
   * @private
   */
  _justSaving() {
    console.log('justSaving');
    const fileContent = this.finalBatString;
    
    if (this.batFilepath !== '') {
      console.log('file is loaded already');
      fs.writeFile(this.batFilepath, fileContent, (err) => {
        if (err) console.log(err);
        else {
          localStorage.setItem('savedBatFile', this.batFilepath);
          console.log('saved file is ', this.batFilepath);
          window.dataChecker = fileContent;
          this._updateStatus("File updated successfully!", 'green');
        }
      });
    } else {
      this._updateStatus('Welcome! This file is not saved!', 'red');
    }
  }
}

module.exports = FileService;
