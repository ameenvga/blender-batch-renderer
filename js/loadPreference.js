function loadPreferences(){
    console.log('load preference')
    console.log(localStorage.blenderSource)
    console.log(localStorage.savedBatFile)
    if(localStorage.savedBatFile == undefined){
        console.log('no bat file found saved last time')
        }
    else if(localStorage.savedBatFile == 'newSlate'){
        console.log('new slate present')
        newSlate()
        if(localStorage.blenderSource != undefined){
            console.log('BlenderSource file is found')
            console.log(localStorage.blenderSource)
            blenderPath.value = localStorage.blenderSource
            }
        }
    else{
        loadBatDetails(localStorage.savedBatFile)
        }
  
    
}