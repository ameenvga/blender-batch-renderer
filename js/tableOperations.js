

function addToBatchList(filename, start, end, boolQ){
    console.log('addToBatchList')
    console.log(filename)
    console.log(boolQ)
    var newObj = { 'blendName': filename, 'startFrame': start, 'endFrame':end, 'renderQ' : boolQ};
    blendFileMap.push(newObj);
    console.log(blendFileMap)
    
}
function addToBatchListFromDrag(filename){
    console.log('addToBatchList')
    var newObj = { 'blendName': filename, 'startFrame':'' , 'endFrame':'', 'renderQ' : true};
    blendFileMap.push(newObj);
    console.log(blendFileMap)
    
}

document.addEventListener('drop', function(event) {
    console.log('Something is dragged over')
    event.preventDefault();
    event.stopPropagation();
    var files = event.dataTransfer.files
    for(i=0; i< files.length; i++){
      console.log(files[i].path)
      if(files[i].path.endsWith('.blend')){
        addToBatchListFromDrag(filename = files[i].path)
      }
    }
    dataChanged()
  });
  document.addEventListener('dragover', function(event) {
    event.preventDefault();
    event.stopPropagation();
  });

  function refreshTable(blendFileMap){
    console.log('refreshTable')
    var newTableInnerHrml = ''
    tableTbody.innerHTML = newTableInnerHrml
    //gettingDataFrom batDataString

   for(i=0; i < blendFileMap.length; i++){
        var blenderFileName = blendFileMap[i]['blendName']
        var shotName = blenderFileName.replace(/^.*[\\\/]/, '')
        var startFrame = blendFileMap[i]['startFrame']
        var endFrame = blendFileMap[i]['endFrame']
        var renderQStatus = blendFileMap[i]['renderQ']
        var checkboxString = ''
        if(renderQStatus){
            renderON = true
            checkboxString = ' <td> <input type="checkbox" class="renderQ" data-finish="'+ shotName +'" checked> </td>'
        }
        else{
            checkboxString = ' <td> <input type="checkbox" class="renderQ" data-finish="'+ shotName +'" > </td>'

        }
        newTableInnerHrml += '<tr data-row="'+shotName+'" > '+ checkboxString +'  <td>'+ (i + 1) + '</td>  <td> <div class="batchFileItem">   <img class="icons" data-filepath="'+blenderFileName+'" draggable="false" onclick="deleteEntry()" src="assets/deleteIcon.png"/>  <div class="blfilename">' +blenderFileName +'</div> </div></td>'
        
         try{
            startFrame = parseInt(startFrame)
            if (isInteger(startFrame)){
                // console.log('startFrame is integer')
                newTableInnerHrml += '<td> <input class="startFrame" data-startPath="'+shotName+'" type="number" value ='+ startFrame +'> </td>'
                
            }  
            else{
                newTableInnerHrml += '<td ><input class="startFrame" data-startPath="'+shotName+'" type="number"></td>'
            }  
        }catch(e){
            console.log('error in frame numbering')
            newTableInnerHrml += '<td ><input class="startFrame" data-startPath="'+shotName+'" type="number"></td>'
        }
  
        
        try{
            endFrame = parseInt(endFrame)
            if (isInteger(endFrame)){
                // console.log('startFrame is integer')
                newTableInnerHrml +=  '<td> <input class="endFrame" type="number" value ='+ endFrame +'> </td>'
            }    
            else{
                newTableInnerHrml += '<td ><input class="endFrame" type="number"></td>'
            }
        }catch(e){
            console.log('error in frame numbering')
            newTableInnerHrml += '<td ><input class="endFrame" type="number"></td>'
        }
        newTableInnerHrml += ''
        newTableInnerHrml += '</tr>'
    }
    tableTbody.innerHTML = newTableInnerHrml
}

function tableDataChanged(){
    console.log('tableDataChanged')
    var oTable = document.getElementById('tableTbody');

    //gets rows of table
    var rowLength = oTable.rows.length;
    blendFileMap = [];
    //loops through rows    
    for (i = 0; i < rowLength; i++){

      //gets cells of current row  
       var oCells = oTable.rows.item(i).cells;

       //gets amount of cells of current row
       var cellLength = oCells.length;
        var renderQuestion = oCells[0].querySelector('.renderQ').checked
        var filename = oCells[2].querySelector('.blfilename').innerHTML
        var startFrame = oCells[3].querySelector('.startFrame').value
        var endFrame = oCells[4].querySelector('.endFrame').value
        
        addToBatchList(filename, startFrame, endFrame, renderQuestion)
        
    }
    dataChanged()
}

function deleteEntry(){
    console.log('deleting a file from the batch')
    blendfilename =  event.target.getAttribute('data-filepath')
    // console.log(blendfilename)

    //finding the element from JsonArray
    for(i =0; i < blendFileMap.length; i++){
        // console.log(blendFileMap[i]['blendName'])
        if(blendFileMap[i]['blendName'] == blendfilename ){
            console.log('time to delete ', blendfilename)
            blendFileMap.splice(i, 1)
        }
    }
    console.log('after deletion')
    console.log(blendFileMap)
    dataChanged()

    updateStatus('Deleted an item from the list!', 'red')
  }