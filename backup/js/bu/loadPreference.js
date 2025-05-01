function loadPreferences(){
    console.log('load preference')
    console.log(localStorage.blenderSource)
    console.log(localStorage.savedBatFile)
    if(localStorage.savedBatFile == undefined){
        console.log('no bat file found saved last time')
        }
    else if(localStorage.savedBatFile == 'newSlate'){
        console.log('new slate present')
        resetAll()
        if(localStorage.blenderSource != undefined){
            console.log('BlenderSource file is found')
            console.log(localStorage.blenderSource)
            blenderPath.value = localStorage.blenderSource
            }
        }
    else{
        loadBatDetails(localStorage.savedBatFile)
        }
    if(localStorage.blenderSource != undefined){
        console.log('BlenderSource file is found')
        console.log(localStorage.blenderSource)
        blenderPath.value = localStorage.blenderSource
    }
    
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
        var batFileArray = data.split('"')
        console.log(batFileArray)
        for(i=0; i < batFileArray.length; i++){
            if(batFileArray[i].endsWith('.exe')){
                console.log('foundsavedBatFile')
                blenderPath.value = batFileArray[i]
            }
            else if(batFileArray[i].endsWith('.blend')){
                console.log('found blend file')
                addToBatchList(batFileArray[i])
            }
        }

        refreshBatchContainer()
        console.log(batFileArray[batFileArray.length-1])
        if(batFileArray[batFileArray.length-1] == ' -a && shutdown -t 0 -s -f') {
          shutChecker.checked = true
        }
        else{
          shutChecker.checked = false
        }
        updateStatus('Loaded file: '+ batFilepath, 'green')
        dataChecker = getFileContent()
    })
}