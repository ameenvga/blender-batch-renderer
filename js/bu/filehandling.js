
//        var shutDownBool = false
  
    
    
   
    
    function addToBatchList(blendfilename){
        console.log('add to batch list')

        blenderFilesString += '<div class="batchFileItem"><img class="icons" data-filepath="'+blendfilename+'" onclick="deleteEntry()" draggable="false" src="assets/deleteIcon.svg"/><div class="blfilename">'+ blendfilename +'</div> </div>'
        
      }
    function justSaving(){
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
            statusBar.innerHTML = 
            updateStatus('This file is not saved!', 'red')
        }
    }
    function deleteEntry(){
      console.log('deleting a file from the batch')
      blendfilename =  event.target.getAttribute('data-filepath')
      blenderFilesString = blenderFilesString.replace('<div class="batchFileItem"><img class="icons" data-filepath="'+blendfilename+'" onclick="deleteEntry()" draggable="false" src="assets/deleteIcon.svg"/><div class="blfilename">'+ blendfilename +'</div> </div>', '')
      refreshBatchContainer()
      justSaving()
        updateStatus('Deleted an item from the list!', 'red')
    }
    
   
   

    const shell = require('electron').shell;
    const path = require('path');

    shutChecker.addEventListener('click', shutDownSwitch)
    function shutDownSwitch(){
        console.log('shutDown switch')
        justSaving()
    }
    

    document.addEventListener('drop', function(event) {
      event.preventDefault();
      event.stopPropagation();
      var files = event.dataTransfer.files
      for(i=0; i< files.length; i++){
        console.log(files[i].path)
        if(files[i].path.endsWith('.blend')){
          addToBatchList(files[i].path)
        }
      }
        refreshBatchContainer()
        justSaving()
    });
    document.addEventListener('dragover', function(event) {
      event.preventDefault();
      event.stopPropagation();
    });
