function loadBatFile(){
        console.log('load Bat file')
        dialog.showOpenDialog({ filters: [

          {name: 'batch file', extensions: ['bat'] }

          ]}, (filenames) => {
          if(filenames === undefined) {
              return
          }
          else{
              console.log("selected file")
              var openedfilename = filenames[0];
              blenderFilesString = ''
              loadBatDetails(openedfilename)
              localStorage.setItem('savedBatFile', openedfilename)
          }
      });
        statusBar.innerHTML = ''
    }

    function saveBatFile(){
        console.log('save bat file')
        var fileContent = getFileContent()
        
        if(batFilepath != ''){
            console.log('file is loaded already')
            fs.writeFile(batFilepath, fileContent, (err)=>{
                if(err) console.log(err);
                else{
                  localStorage.setItem('savedBatFile', batFilepath)
                    console.log('saved file is ', batFilepath)
                    dataChecker = fileContent
//                    statusBar.innerHTML = "File saved successfully!"
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
                    dataChecker = fileContent
                    updateStatus("File saved successfully!", 'green')
                }
            })

        })
        }
        
    }
    function getFileContent(){
        console.log('get file content')
        var savedBatFileFile;
        if(blenderPath.value.trim() == ''){
            document.getElementById('statusBar').innerHTML = 'No Blender Source detected!'
        }else{
            savedBatFileFile = '"'+ blenderPath.value+'" -b '

        }
        var filenamesArray = document.getElementsByClassName('blfilename')
        var filenames =""
        for(i=0; i < filenamesArray.length; i++){
            filenames += '"'+filenamesArray[i].textContent+'" -a '
        }
        console.log(savedBatFileFile)
        console.log(filenames)

        var finalContentToFile;

        var shutDownBool = shutChecker.checked
        console.log(shutDownBool)
        if(shutDownBool){
            finalContentToFile = savedBatFileFile + filenames + '&& shutdown -t 0 -s -f'
        }
        else{
            finalContentToFile = savedBatFileFile + filenames
        }

        console.log(finalContentToFile)
        return finalContentToFile
    }
    function renderBatch(){
        console.log('render batch function')
        var finalContent = getFileContent()
        if(batFilepath == ''){
            statusBar.innerHTML = "Please save the file before Rendering"
        }else{
            if(dataChecker == getFileContent()){
                shell.openItem(path.join(batFilepath));
                if(shutChecker.checked!= true){
                    updateStatus("Rendering without system shutdown", 'red')
                }else{
                    updateStatus('Your system will shutdown after rendering completion!', 'green')
                }
            }
            else{
//                statusBar.innerHTML = "Please save the file before Rendering"
                updateStatus("Please save the file before Rendering", 'red')
            }   
        }
        
        
    
    }

    function resetAll(){
        console.log('reset All')
        blenderFilesString = ''
        refreshBatchContainer()
        batFilepath = ''
        statusBar.innerHTML = ''
        shutChecker.checked = false
        newSlate()
        
    }
    function newSlate(){
        console.log('new slate')
        localStorage.setItem('savedBatFile', 'newSlate')
        updateStatus('You are creating a new batch file!', 'green')
    }
    function refreshBatchContainer(){
        console.log('refresh Batch Container')
        // blenderFilesContainer.innerHTML =  ' <tr>  <th>Filename</th>  <th>Start</th>  <th>End</th> </tr><tr>';
        
    } 

    function updateStatus(text, color){
        console.log('update Status')
        statusBar.innerHTML = text
        statusBar.style.color = color
    }