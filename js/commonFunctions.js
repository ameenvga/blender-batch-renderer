
//Need to change data when frame number changes


function isInteger(x) {
    return Math.round(x) === x;
}

var mapToSave =[]
var renderON = false
function dataChanged(){
    console.log('dataChanged')
    //try to rearrange data file with all the details
    
    //save the change in file or warn the user to save the file

    finalBatString = ''
    fullFilesString ='';
    mapToSave = []
    renderON = false
    //getting blender.exe source file
    var blenderSource = blenderPath.value
    if(blenderSource.trim()!= ''){
        finalBatString = '"' + blenderSource + '" -b';
    }

    //getting the number of cores
    var coreNumber = coreInput.value

    //getting all the blend files one by one 
    for(i=0; i < blendFileMap.length; i++){
        
        var renderQStatus = blendFileMap[i]['renderQ']
        
        if(renderQStatus){
            
            var blenderFileName = blendFileMap[i]['blendName']
            console.log(blenderFileName, 'is going to render')


            var startFrame = blendFileMap[i]['startFrame']
            var endFrame = blendFileMap[i]['endFrame']
            //setting output string
            var outputFolder = document.getElementById('outputPath').value
            var filename = blenderFileName.replace(/^.*[\\\/]/, '') .replace('.blend', '')
            var totalOutPutString = '"'+ outputFolder+'\\'+ filename +'\\' + filename + "_#####"+ '"' 
            // console.log(totalOutPutString)
                
            var oneFileString = ' "'+ blenderFileName + '"' ;

            if((outputFolder.trim() != '') && (outputFolder.trim() != undefined)){
                oneFileString+= ' -o ' + totalOutPutString
            }




            try{
                startFrame = parseInt(startFrame)
                if (isInteger(startFrame)){
                    // console.log('startFrame is integer')
                    oneFileString += ' -s '+ startFrame 
                }    
            }catch(e){
                console.log('error in frame numbering')
            }
    
            
            try{
                endFrame = parseInt(endFrame)
                if (isInteger(endFrame)){
                    // console.log('startFrame is integer')
                    oneFileString += ' -e '+ endFrame 
                }    
            }catch(e){
                console.log('error in frame numbering')
            }



            try{
                coreNumber = parseInt(coreNumber)
                if(isInteger(coreNumber)){
                    oneFileString += ' -t '+ coreNumber;
                }
                else{
                    coreNumber = ''
                }
            }
            catch(e){
                console.log('error in core numbering')
            }

            fullFilesString += oneFileString +' -a'
            renderON = true
        }
        else{
            var blenderFileName = blendFileMap[i]['blendName']
            console.log(blenderFileName, 'is NOT going to render')
        }
        
    }

    finalBatString += fullFilesString

    var shutDownBool = shutChecker.checked
        console.log(shutDownBool)
        if(shutDownBool){
            finalBatString = finalBatString + ' && shutdown -t 0 -s -f';
        }
    //-----------------------------------------

    console.log('========================')
    console.log(finalBatString)
    //appending the REM section

     mapToSave = [ finalBatString, blenderSource,  JSON.stringify(blendFileMap), coreNumber, shutDownBool ]
    console.log(mapToSave)

    finalBatString += '\r\n REM '  +   JSON.stringify(mapToSave) 
    // finalBatString += '\r\n REM ' + blenderSource + ' REM ' + JSON.stringify(blendFileMap) + ' REM ' + coreNumber + ' REM ' +
    //                     shutDownBool
    
    //refresh table
    refreshTable(blendFileMap)
    justSaving()
}



function updateStatus(text, color){
    // debugger
    console.log('update Status')
    statusBar.innerHTML = text
    statusBar.style.color = color
}

function justSaving(){
    console.log('justSaving')
    var fileContent = finalBatString
    
    if(batFilepath != '' ){
        console.log('file is loaded already')
        fs.writeFile(batFilepath, fileContent, (err)=>{
            if(err) console.log(err);
            else{
              localStorage.setItem('savedBatFile', batFilepath)
                console.log('saved file is ', batFilepath)
                dataChecker = fileContent
//                    statusBar.innerHTML = 
                updateStatus("File updated successfully!", 'green')
            }
        })
    }
    else{
        updateStatus('Welcome! This file is not saved!', 'red')
    }
}


function StartWatcher(path){
    var chokidar = require("chokidar");

    var watcher = chokidar.watch(path, {
        ignored: /[\/\\]\./,
        persistent: true
    });

    function onWatcherReady(){
        console.info('From here can you check for real changes, the initial scan has been completed.');
    }
          
    // Declare the listeners of the watcher
    watcher
    .on('add', function(path) {
          console.log('File', path, 'has been added');
        //   renderPreview.src = path
    })
    .on('addDir', function(path) {
        //   var text = 'Directory ' + path + ' has been added';
        //   showWhichOneRender(path)
        //   updateStatus(text, 'blue')
    })
    .on('change', function(path) {
        //  console.log('File', path, 'has been changed');
         updateRenderSection(path)
    })

    .on('error', function(error) {
         console.log('Error happened', error);
         updateStatus(error, 'red')
    })
    .on('ready', onWatcherReady)
    // .on('raw', function(event, path, details) {
    //      // This event should be triggered everytime something happens.
    //      console.log('Raw event info:', event, path, details);
    // });
}
function updateRenderSection(path){
    console.log('updateRenderSection')
    var currentFrameDisplay = document.getElementById('currentFrame')
    var fileNameDiplay = document.getElementById('fileNameDiplay')
    var frameNumberDisplay = document.getElementById('frameNumberDisplay')
    var filename = path.replace(/^.*[\\\/]/, '')
    var frameNumber = filename.replace('.png','').split('_')
    frameNumber = frameNumber[frameNumber.length-1]
    var blendFileName = filename.replace('.png','').slice(0, -6) +'.blend'
    
    //updating details
    // preloadImage(path)
 
    // renderPreviewHTML = `<img id="renderPreview" class="lozad"  src="${path}"/>`
    // document.getElementById('newRenderDiv').innerHTML = renderPreviewHTML
    updatePreviewImage(path)

    fileNameDiplay.innerHTML = blendFileName
    frameNumberDisplay.innerHTML = frameNumber
    currentFrameDisplay.textContent = path

    //setting rendered frame in startframe 
    // console.log(blendFileName)
    var x = document.querySelectorAll("[data-startPath='"+ blendFileName +"']")
    x[0].value = parseInt(frameNumber)
    tableDataChanged()
    var y = document.querySelectorAll("[data-row='"+ blendFileName +"']")[0]
    // console.log(x[0])
    y.style.background = 'greenyellow'
    // console.log(y)
    
    //unchecking the rendered filename
    if( currentRenderingShot == 'none'){
        console.log('NONE-----------NOEN----------OENONE')
        currentRenderingShot = blendFileName
    }else if( currentRenderingShot == blendFileName) {
        
    }else if((currentRenderingShot != 'none') && (currentRenderingShot != blendFileName)){
        console.log('!!!!!!!SHOT CHANGED!!!!!')
        uncheckPreviousShot(currentRenderingShot)
        currentRenderingShot = blendFileName
    }

}

function uncheckPreviousShot(shotName){
    console.log('uncheckPreviousShot')

    var lastShot = document.querySelectorAll("[data-finish='"+ shotName +"']")[0]
    lastShot.checked = false
    tableDataChanged()
}

function updatePreviewImage(path) {
    console.log('updatePreviewImage')
    setTimeout(
      function() {
        renderPreview.src = path
      }, 3000);
  }