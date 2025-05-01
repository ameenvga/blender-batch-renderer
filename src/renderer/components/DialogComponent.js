/**
 * DialogComponent
 * Handles file dialogs and selection operations
 */

const remote = require('@electron/remote');
const { shell } = remote;
const dialog = remote.dialog;

class DialogComponent {
  constructor(fileService) {
    this.fileService = fileService;
  }

  /**
   * Open a dialog to select a Blender executable
   */
  openBlenderFile() {
    console.log('openBlenderFile');
    dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'blender file' }
      ]
    }).then(result => {
      if (!result.canceled && result.filePaths.length > 0) {
        console.log("Selected Blender Source");
        const openedfilename = result.filePaths[0];
        document.getElementById('blenderPath').value = openedfilename;
        localStorage.setItem('blenderSource', openedfilename);
        this.fileService._dataChanged();
      }
    }).catch(err => {
      console.log(err);
    });
  }

  /**
   * Open a dialog to select an output folder
   */
  openOutputFolder() {
    console.log('openOutputFolder');
    dialog.showOpenDialog({
      properties: ['openDirectory']
    }).then(result => {
      if (!result.canceled && result.filePaths.length > 0) {
        const path = result.filePaths[0];
        document.getElementById('outputPath').value = path;
        // Start to watch the selected path
        window.app.renderService.startWatcher(path);
        this.fileService._dataChanged();
        document.getElementById('renderDiv').style.display = 'flex';
      } else {
        console.log("No path selected");
      }
    }).catch(err => {
      console.log(err);
    });
  }

  /**
   * Open the output folder in the file explorer
   */
  showOutputFolder() {
    console.log('showOutputFolder');
    if (document.getElementById('outputPath').value) {
      shell.openPath(document.getElementById('outputPath').value);
    }
  }

  /**
   * Open a dialog to select a batch file to load
   */
  loadBatFile() {
    this.fileService.loadBatFile();
  }
}

module.exports = DialogComponent;
