function openBlenderFile () {
    console.log('openBlenderFile')
    dialog.showOpenDialog({ filters: [

        {name: 'blender file'}

        ]}, (filenames) => {
        if(filenames === undefined) {
            return
        }
        else{
            console.log("Selected Blender Source")
            var openedfilename = filenames[0];
            blenderPath.value = openedfilename
            localStorage.setItem('blenderSource', openedfilename)
            dataChanged()
        }
    });

  }

     shutChecker.addEventListener('click', shutDownSwitch)
    function shutDownSwitch(){
        console.log('shutDown switch')
        dataChanged()
    }


    function saveBatFile(){
        console.log('save bat file')
        var fileContent = finalBatString;
        console.log(fileContent)
        if(batFilepath != ''){
            console.log('file is loaded already')
            fs.writeFile(batFilepath, fileContent, (err)=>{
                if(err) {
                    console.log(err);
                    alert(err)
                }
                else{
                    localStorage.setItem('savedBatFile', batFilepath)
                    console.log('saved file is ', batFilepath)
                    updateStatus("File saved successfully!", 'green')
                }
            })
        }
        else{
            console.log('there is no file. Save MANUALLY')
            dialog.showSaveDialog({ filters: [

          {name: 'batch file', extensions: ['bat'] }

          ]},(filename) => {
            if(filename === undefined){
                return
            }
            if(filename.endsWith(".bat")){
                filename = filename.substring(0, filename.length-4)
            }

            fs.writeFile(filename + ".bat", fileContent, (err)=>{
                if(err) console.log(err);
                else{
                    localStorage.setItem('savedBatFile', filename + ".bat")
                    console.log('saved file is ', filename + ".bat")
                    batFilepath = filename + ".bat"
                    updateStatus("File saved successfully!", 'green')
                }
            })

        })
        }
        
    }
    function newSlate(){
        console.log('newSlate')
        localStorage.setItem('savedBatFile', 'newSlate')
        updateStatus('You are creating a new batch file!', 'green')

        blendFileMap = [];
        batFilepath = ''
        coreInput.value = '';
        shutChecker.checked = false
        resetOutPutPath() 
        dataChanged()
    }


    function resetOutPutPath(){
        console.log('resetOutPutPath')
        renderDiv.style.display = 'none'
        document.getElementById('outputPath').value = ''
    }
    function loadBatFile(){
        console.log('loadBatFile')
        dialog.showOpenDialog({ filters: [

          {name: 'batch file', extensions: ['bat'] }

          ]}, (filenames) => {
          if(filenames === undefined) {
              return
          }
          else{
              console.log("selected file")
              var openedfilename = filenames[0];
              loadBatDetails(openedfilename)
              localStorage.setItem('savedBatFile', openedfilename)
          }
      });
    }

    function loadBatDetails(batfilename){
        console.log('load Bat Details')
        batFilepath = batfilename
        console.log(batFilepath)
        fs.readFile(batfilename, 'utf-8', (err, data) => {
            if(err){
                alert('Looks like the file is missing');
                resetAll()
                return
            }
            var batFileArray = JSON.parse(data.split('REM')[1])
            console.log(batFileArray)

            //getting blender source
            var blenderSource =''
            try {
                if(batFileArray[1].trim().endsWith('.exe')){
                    blenderSource = batFileArray[1].trim()
                }
            } catch (error) {
                console.log('some problem with the blendersource identification')
            }
            console.log(blenderSource)
            blenderPath.value = blenderSource

            //getting the jsonArray
            blendFileMap = []
            try {
                if(JSON.parse(batFileArray[2])){
                    blendFileMap = JSON.parse(batFileArray[2])
                } 
            } catch (error) {
                
            }
            console.log(blendFileMap)
            refreshTable(blendFileMap)

            //getting the number of cores
            var coreNumber = '';
            if(batFileArray[3]){
                coreNumber = batFileArray[3].trim()
            }
            console.log(coreNumber)
            coreInput.value = coreNumber

            //getting shutDownValue
            var shutDownBool = false;
            try {
                if(batFileArray[4].trim() == 'true'){
                    shutDownBool = true
                    shutChecker.checked = true
                }else{
                    shutChecker.checked = false
                }
            } catch (error) {
                shutChecker.checked = false
            }
            console.log(shutDownBool)
        })
        
    }

    const shell = require('electron').shell;
    const path = require('path');

    function renderBatch(){
        
        console.log('render batch function')
          if(batFilepath == ''){
            updateStatus("Please save the file before rendering!", 'red')
          }else{
            if(fileReadyForRender()){
                shell.openItem(path.join(batFilepath));
                if(shutChecker.checked!= true){
                    updateStatus("Rendering without system shutdown.......", 'red')
                    console.log(document.getElementById('outputPath').value)
                }else{
                    updateStatus('Rendering......Your system will shutdown after rendering completion!', 'green')
                }
                if( document.getElementById('outputPath').value != ''){
                    StartWatcher(document.getElementById('outputPath').value);
                }
            }
            else{
//                statusBar.innerHTML = "Please save the file before Rendering"
                updateStatus("Can't render! Please make sure everything is correct.", 'red')
            }   
        }
        
        
    
    }


function fileReadyForRender(){
    console.log('fileReadyForRender')
    console.log("BLEND FILE MAP")
    console.log(blendFileMap)
    if(blenderPath.value == ''){
        return false
    }
    else {
        if(renderON == false){
            return false
        }
        else{
            return true
        }
    }

}

function openOutputFolder(){
    console.log('openOutputFolder')

    dialog.showOpenDialog({
        properties: ['openDirectory']
    },function(path){
        if(path){
            document.getElementById('outputPath').value = path
            // Start to watch the selected path
            StartWatcher(path)
            dataChanged()
            document.getElementById('renderDiv').style.display = 'flex'
        }else {
            console.log("No path selected");
        }
    });
}

function showOutputFolder(){
    console.log('showOutputFolder')
    const {shell} = require('electron') // deconstructing assignment
    if(document.getElementById('outputPath').value){
        shell.openItem(document.getElementById('outputPath').value)
    }
    
}