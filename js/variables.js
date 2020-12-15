const remote = require('electron').remote
var app = require('electron').remote
var dialog = app.dialog
const electron = require('electron')
var fs = require('fs')
var fileWatcher = require("chokidar");

var blenderPath = document.getElementById('blenderPath')
var blenderFilesContainer = document.getElementById('blenderFilesContainer')
var batFilepath =''
var statusBar = document.getElementById('statusBar')
var shutChecker = document.getElementById('shutCheck')
var coreInput = document.getElementById('coreInput')
var tableTbody = document.getElementById('tableTbody')
var blendFileMap = []; //blendName, startFrame, endFrame
var fullFilesString ='';
var finalBatString = ''
var renderPreview = document.getElementById('renderPreview')
var currentRenderingShot = 'none';
var outputPath =  document.getElementById('outputPath')
outputPath.oninput = function(){
    console.log('ouputPathChanged')
    if(outputPath.value.trim() == ''){
        resetOutPutPath()
    }
    
}