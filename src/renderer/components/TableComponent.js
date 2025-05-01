/**
 * TableComponent
 * Handles the table of Blender files and related operations
 */

class TableComponent {
  constructor(tableElement, fileService, renderService) {
    this.tableElement = tableElement;
    this.fileService = fileService;
    this.renderService = renderService;
  }

  /**
   * Add a Blender file to the table
   * @param {string} filePath - Path to the Blender file
   */
  addBlendFile(filePath) {
    this.fileService.addToBatchListFromDrag(filePath);
  }

  /**
   * Delete a Blender file from the table
   * @param {string} filePath - Path to the Blender file
   */
  deleteBlendFile(filePath) {
    this.fileService.deleteEntry(filePath);
  }

  /**
   * Update the table data
   */
  updateTableData() {
    this.fileService.tableDataChanged();
  }
}

module.exports = TableComponent;
