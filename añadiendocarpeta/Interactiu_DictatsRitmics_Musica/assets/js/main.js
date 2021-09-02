const languages = { cat, en, es };
let translations = cat;

function updateTranslations() {
    document.querySelectorAll("[data-i18n]").forEach(function(element) {
        if (!translations[element.dataset.i18n]) {
            return;
        }

        if (element.dataset.i18n_target) {
            element[element.dataset.i18n_target] = translations[element.dataset.i18n];
        } else {
            switch(element.tagName.toLowerCase()) {
                case "a":
                    element.href = translations[element.dataset.i18n];
                    break;
                case "input":
                case "textarea":
                    element.placeholder = translations[element.dataset.i18n];
                default:
                    element.innerHTML = translations[element.dataset.i18n];
            }
        }   
    });
}
  
function changeLng(lng) {
    translations = languages[lng];
    updateTranslations();
}

function openInfo(){
  document.getElementsByClassName("info-wrapper")[0].classList.toggle("active");
}
function closeInfo(){
  document.getElementsByClassName("info-wrapper")[0].classList.remove("active");
}
function info(){
  const infoElement = document.getElementById("info-wrapper");
  infoElement.classList.add(".active")
}

let positionOriginXNegra;
let positionOriginYNegra;
let positionOriginXCorchea;
let positionOriginYCorchea;
let positionOriginXSilencio;
let positionOriginYSilencio;

document.addEventListener("DOMContentLoaded", function(event) { 
  updateTranslations();
  makeElementDraggable();

  positionOriginXNegra = $('#nota-negra-0')[0].transform.animVal[0].matrix.e; // $('#nota-negra-0')[0].getBoundingClientRect().x;
  positionOriginYNegra = $('#nota-negra-0')[0].transform.animVal[0].matrix.f; //$('#nota-negra-0')[0].getBoundingClientRect().y;

  positionOriginXCorchea = $('#nota-corchea-0')[0].transform.animVal[0].matrix.e;
  positionOriginYCorchea = $('#nota-corchea-0')[0].transform.animVal[0].matrix.f;
});

/* ---------------- Draggable ------------------ */

var svg = document.querySelector("#draggable-notes-svg");

let counter = 0;

function makeElementDraggable(){
  let droppables = $(".item");
  let dropArea = $(".drop-area");
  let dropAreaNotes = $(".drop-area-notes");

  let dropArea0 = $("#wrapper-0-notas");
  let dropArea1 = $("#wrapper-1-notas");
  let dropArea2 = $("#wrapper-2-notas");
  let dropArea3 = $("#wrapper-3-notas");

  let overlapThreshold = "10%";

  Draggable.create(droppables, {
      bounds: ".container-parte-superior",
      
      onDrag: function(e) {
          if (this.hitTest(dropArea, overlapThreshold)) {
            $(this.target).addClass("dragged");

          } else{
            $(this.target).removeClass("dragged");
          }
      },
      onDragEnd: function(e) {
  
        if (this.hitTest(dropArea, overlapThreshold)) {
          let id = this.target.id;
          let note = id.split('-')[1];

          switch(note){
            case 'negra':
              addBlackNote();    
              break;
            case 'corchea':
              addQuaverNote()
              break;
            case 'silencio':
              addSilenceNote()
              break;
          }

          //Guardamos id y posición de la nota, para después ordenarlas y saber si están en el orden correcto
          const noteDragged = document.getElementById(this.target.id)
          const posX = noteDragged.getBoundingClientRect().x;
          savePositionNote(this.target.id, posX);

          sortNotesPerXPosition();
        } 
        
        if (this.hitTest(dropArea0, overlapThreshold)) {
          toggleClassesDropAreaNotes(this.target, 'dropArea0')

        } else if (this.hitTest(dropArea1, overlapThreshold)) {
          toggleClassesDropAreaNotes(this.target, 'dropArea1')

        } else if (this.hitTest(dropArea2, overlapThreshold)) {
          toggleClassesDropAreaNotes(this.target, 'dropArea2')

        } else if (this.hitTest(dropArea3, overlapThreshold)) {
          toggleClassesDropAreaNotes(this.target, 'dropArea3')
        } 
        
        if (!$(this.target).hasClass("dragged")) {

          const id = this.target.id;
          const pickedNote = id.split('-')[1];

          switch(pickedNote){
            case 'negra':
              TweenLite.to(this.target, 0.2, {
                x: positionOriginXNegra,
                y: positionOriginYNegra
              });
              break;
            case 'corchea':
              TweenLite.to(this.target, 0.2, {
                x: positionOriginXCorchea,
                y: positionOriginYCorchea
              });
              break;
            case 'silencio':
              TweenLite.to(this.target, 0.2, {
                x: 0,
                y: 0
              });
              break;
          }
        
          //Eliminar notas que se saquen de la partitura:
          let idDelete = this.target.id;
          delete sortedNotes[idDelete];
          delete notePos[idDelete];
        }

        //Comprobar que haya 4 notas en cada tiempo
        let correctTempus = false;
        correctTempus = checkCorrectTempus();

        //checkCorrectOrder()
        //Comprobar que se hayan puesto las notas en el orden correcto
        if(correctTempus){
          checkCorrectOrder()
          evaluationMessage()
        }
        evaluationMessage()
      }
  });
}

let notePos = {};

function savePositionNote(idNote, x){
  notePos[idNote] = x;
}

let sortedNotes = {};

function sortNotesPerXPosition(){
  sortedNotes = Object.entries(notePos)
    .sort(([,a],[,b]) => a-b)
    .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});
}

// ORDEN CORRECTO: 
// 4/4 : negra negra silencio negra | corchea corchea negra silencio | corchea negra corchea negra | negra silencio corchea negra |
const correctNotesOrder = [ 'negra', 'negra', 'silencio', 'negra', 'corchea', 'corchea', 'negra', 'silencio', 'corchea', 'negra', 'corchea', 'negra', 'negra', 'silencio', 'corchea', 'negra']

const numNotesTempo = 4; //4
const numtotalNotesPartiture = 16; //16

function checkCorrectTempus(){

  let numberNotesDroparea0 = $('.dropArea0').length;
  let numberNotesDroparea1 = $('.dropArea1').length;
  let numberNotesDroparea2 = $('.dropArea2').length;
  let numberNotesDroparea3 = $('.dropArea3').length;

  let totalNotes = numberNotesDroparea0 + numberNotesDroparea1 + numberNotesDroparea2 + numberNotesDroparea3;

  if(totalNotes == numtotalNotesPartiture){
    if(numberNotesDroparea0 != numNotesTempo){
      $('#wrapper-0-notas')[0].style.stroke = 'red';
    } 
    if(numberNotesDroparea1 != numNotesTempo){
      $('#wrapper-1-notas')[0].style.stroke = 'red';
    } 
    if(numberNotesDroparea2 != numNotesTempo){
      $('#wrapper-2-notas')[0].style.stroke = 'red';
    } 
    if(numberNotesDroparea3 != numNotesTempo){
      $('#wrapper-3-notas')[0].style.stroke = 'red';
    }
  }
  
  if(numberNotesDroparea0 === numNotesTempo && numberNotesDroparea1 === numNotesTempo && numberNotesDroparea2 === numNotesTempo && numberNotesDroparea3 === numNotesTempo){
    return true;
  } else {
    return false;
  }
}

let correctNotesNum = 0;
let wrongNotesNum = 0;

function checkCorrectOrder(){
  
  let notesUserCounter = 0;
  let userOrder = [];
  let idsOrder = [];

  Object.entries(sortedNotes).forEach(([key, value]) => {

    let nameNote = key.split('-')[1];
    let numberNote = key.split('-')[2];
    userOrder.push(nameNote.toString());
    idsOrder.push(key.toString())

    let notesData = {
      name: nameNote,
      number: numberNote,
      id: key,
    }

    if(nameNote === correctNotesOrder[notesUserCounter]){
      correctNotesNum++;
      changeColorNotes(notesData, 'correct');
    }else{
      wrongNotesNum++;
      changeColorNotes(notesData, 'incorrect');
    }
    notesUserCounter++;
  });

  let isCorrect = false;

  if(notesUserCounter == numtotalNotesPartiture || notesUserCounter > numtotalNotesPartiture){

    isCorrect = JSON.stringify(userOrder) === JSON.stringify(correctNotesOrder);

    if(isCorrect === true){
      $('#wrapper-0-notas')[0].style.stroke = 'green';
      $('#wrapper-1-notas')[0].style.stroke = 'green';
      $('#wrapper-2-notas')[0].style.stroke = 'green';
      $('#wrapper-3-notas')[0].style.stroke = 'green';         
      
      return true;
    }
  } 
} 

function changeColorNotes(notesData, correct){

  let color;
  if(correct === "correct"){
    color = '#6cff09'
  } else {
    color = '#fd4444'
  }

  let notes = document.getElementsByClassName(notesData.name + "-" + notesData.number);
  let notesLength = notes.length;
  let draggedNote = document.getElementById(notesData.id);

  if(draggedNote.classList.contains('dragged') === true){
    for (let i = 0; i < notesLength; i++){
      notes[i].style.fill = color;
    }
  }
}

function toggleClassesDropAreaNotes(note, dropArea){
  note.classList = "item dragged " + dropArea;
}

const evalDiv = document.getElementById("evaluation");
function evaluationMessage(){
  if(correctNotesNum === numtotalNotesPartiture){
    evalDiv.innerHTML = 'CORRECTE!'
    evalDiv.classList = "correct evaluation-div"
  }else{
    evalDiv.innerHTML = 'INCORRECTE! <br>' + correctNotesNum + ' notes correctes'
    evalDiv.classList = "incorrect evaluation-div"
  }
}

function resetInteractive(){  
  
  //Reset variables
  notePos = {};
  sortedNotes = {};
  idCounter = 0;
  idSilenceCounter = 0;
  idCounter = 0;
  idQuaver = 0;
  correctNotesNum = 0;
  wrongNotesNum = 0;

  //Eliminar todas las notas
  $('.item').remove();

  addBlackNote();
  addQuaverNote();
  addSilenceNote();

  $('#wrapper-0-notas')[0].style.stroke = '#b0b0b0';
  $('#wrapper-1-notas')[0].style.stroke = '#b0b0b0';
  $('#wrapper-2-notas')[0].style.stroke = '#b0b0b0';
  $('#wrapper-3-notas')[0].style.stroke = '#b0b0b0';

  evalDiv.innerHTML = '';
  evalDiv.classList = "evaluation-div"

}

//--------------------- Añadiendo notas creando elementos g (Svg) ------------------------------

var boxNote0 = document.querySelector("#recipienteNota0");
var boxNote1 = document.querySelector("#recipienteNota1");
var boxNote2 = document.querySelector("#recipienteNota2");

var xmlns = "http://www.w3.org/2000/svg";
const coordsBlackNote = 'm 49.666767,20.844648 c -0.936237,-1.156666 -3.088252,-1.31525 -4.417304,-0.645893 -1.559537,0.785437 -3.252122,3.051238 -2.476925,4.61589 0.687086,1.386808 3.140638,1.426819 4.468921,0.69395 0.96573,-0.532833 1.836808,-1.388711 2.278627,-2.399325 0.238813,-0.546258 0.487922,-1.398185 0.349783,-1.969417 -0.03714,-0.15357 -0.102263,-0.170625 -0.203102,-0.295205 z';

let idCounter = 0;
function addBlackNote(){
  idCounter++;

  var g = document.createElementNS(xmlns, "g");
  let gId = 'nota-negra-' + idCounter;
  g.setAttributeNS(null, "id", gId); 
  g.setAttributeNS(null, "class", "item");   
  g.setAttributeNS(null, "transform", "translate(189.86667,78.779376)"); 

  var path3 = document.createElementNS(xmlns, "rect");
  path3.setAttributeNS(null, "class", "negra-" + idCounter + " addedNote");  
  path3.setAttributeNS(null, 'fill', "#00000000");
  path3.setAttributeNS(null, 'y', 0.582611);
  path3.setAttributeNS(null, 'x', 38);
  path3.setAttributeNS(null, 'height', 37.417732);
  path3.setAttributeNS(null, "width", 20.090431);
  g.appendChild(path3);

  var path = document.createElementNS(xmlns, "path");
  path.setAttributeNS(null, 'fill', "#000000");
  path.setAttributeNS(null, 'opacity', 1);
  path.setAttributeNS(null, "d", "m 49.666767,20.844648 c -0.936237,-1.156666 -3.088252,-1.31525 -4.417304,-0.645893 -1.559537,0.785437 -3.252122,3.051238 -2.476925,4.61589 0.687086,1.386808 3.140638,1.426819 4.468921,0.69395 0.96573,-0.532833 1.836808,-1.388711 2.278627,-2.399325 0.238813,-0.546258 0.487922,-1.398185 0.349783,-1.969417 -0.03714,-0.15357 -0.102263,-0.170625 -0.203102,-0.295205 z");
  g.appendChild(path);

  var path2 = document.createElementNS(xmlns, "path");
  path2.setAttributeNS(null, 'fill', "none");
  path2.setAttributeNS(null, 'stroke', '#000000');
  path2.setAttributeNS(null, 'stroke-width', 1);
  path2.setAttributeNS(null, 'stroke-opacity', 1);
  path2.setAttributeNS(null, "d", "M 49.422784,21.147701 V 8.318764");
  g.appendChild(path2);
  
  boxNote0.appendChild(g);
  
  makeElementDraggable()
}

let idQuaver = 0;
function addQuaverNote(){
  idQuaver++;

  var g = document.createElementNS(xmlns, "g");
  let gId = 'nota-corchea-' + idQuaver;
  g.setAttributeNS(null, "id", gId); 
  g.setAttributeNS(null, "class", "item"); 
  g.setAttributeNS(null, "transform", "translate(15.345837,-0.52916667)"); 

  var path6 = document.createElementNS(xmlns, "rect");
  path6.setAttributeNS(null, "class", "corchea-" + idQuaver + " addedNote");  
  path6.setAttributeNS(null, 'fill', "#00000000");
  path6.setAttributeNS(null, 'y', 80);
  path6.setAttributeNS(null, 'x', 266);
  path6.setAttributeNS(null, 'height', 37.417732);
  path6.setAttributeNS(null, "width", 32);
  g.appendChild(path6);

  var path = document.createElementNS(xmlns, "path"); 
  path.setAttributeNS(null, 'fill', "#000000");
  path.setAttributeNS(null, 'opacity', 1);
  path.setAttributeNS(null, "d", "m 274.90478,102.54479 c -0.93624,-1.15667 -3.08826,-1.31525 -4.41731,-0.64589 -1.55953,0.78543 -3.25212,3.05123 -2.47692,4.61589 0.68708,1.3868 3.14064,1.42681 4.46892,0.69395 0.96573,-0.53284 1.83681,-1.38872 2.27863,-2.39933 0.23881,-0.54626 0.48792,-1.39818 0.34978,-1.96942 -0.0371,-0.15357 -0.10226,-0.17062 -0.2031,-0.2952 z");
  g.appendChild(path);

  var path2 = document.createElementNS(xmlns, "path"); 
  path2.setAttributeNS(null, 'fill', "none");
  path2.setAttributeNS(null, 'stroke', '#000000');
  path2.setAttributeNS(null, 'stroke-width', 1);
  path2.setAttributeNS(null, 'stroke-opacity', 1);
  path2.setAttributeNS(null, "d", "M 274.66079,102.84784 V 90.018904");
  g.appendChild(path2);

  var path3 = document.createElementNS(xmlns, "path");
  path3.setAttributeNS(null, 'fill', "#000000");
  path3.setAttributeNS(null, 'opacity', 1);
  path3.setAttributeNS(null, "d", "m 294.27606,102.82827 c -0.93624,-1.15667 -3.08825,-1.31525 -4.41731,-0.64589 -1.55953,0.78543 -3.25212,3.05124 -2.47692,4.61589 0.68708,1.3868 3.14064,1.42682 4.46892,0.69395 0.96573,-0.53284 1.83681,-1.38871 2.27863,-2.39933 0.23881,-0.54626 0.48792,-1.39818 0.34978,-1.96941 -0.0371,-0.15357 -0.10226,-0.17063 -0.2031,-0.29521 z");
  g.appendChild(path3);

  var path4 = document.createElementNS(xmlns, "path");
  path4.setAttributeNS(null, 'fill', "none");
  path4.setAttributeNS(null, 'stroke', '#000000');
  path4.setAttributeNS(null, 'stroke-width', 1);
  path4.setAttributeNS(null, 'stroke-opacity', 1);
  path4.setAttributeNS(null, "d", "M 294.03207,103.13132 V 90.302386");
  g.appendChild(path4);

  var path5 = document.createElementNS(xmlns, "rect");
  path5.setAttributeNS(null, 'fill', "#000000");
  path5.setAttributeNS(null, 'opacity', 1);
  path5.setAttributeNS(null, 'x', 274.17752);
  path5.setAttributeNS(null, 'y', 86.607887);
  path5.setAttributeNS(null, 'height', '3.6945028');
  path5.setAttributeNS(null, 'width', '20.334084');
  g.appendChild(path5);
  
  boxNote1.appendChild(g);
  
  makeElementDraggable()
}

let idSilenceCounter = 0;
function addSilenceNote(){
  idSilenceCounter++;

  var g = document.createElementNS(xmlns, "g");
  let gId = 'nota-silencio-' + idSilenceCounter;
  g.setAttributeNS(null, "id", gId); 
  g.setAttributeNS(null, "class", "item"); 

  var path2 = document.createElementNS(xmlns, "rect");
  path2.setAttributeNS(null, "class", "silencio-" + idSilenceCounter + " addedNote");  
  path2.setAttributeNS(null, 'fill', "#00000000");
  path2.setAttributeNS(null, 'y', 78.582611);
  path2.setAttributeNS(null, 'x', 344);
  path2.setAttributeNS(null, 'height', 37.417732);
  path2.setAttributeNS(null, "width", 15.090431);
  g.appendChild(path2);

  var path = document.createElementNS(xmlns, "path");  
  path.setAttributeNS(null, 'fill', "#000000");
  path.setAttributeNS(null, 'opacity', 1);
  path.setAttributeNS(null, "d", "m 350.64034,89.640891 c 4.10796,5.706343 -4.73652,4.084078 0.25106,9.071644 0.22692,0.22692 1.11103,1.351865 1.21892,1.351865 0.13853,0 -2.0665,-1.474825 -3.0736,-0.467717 -1.44377,1.443767 1.64023,4.908227 2.00452,5.345387 -0.25894,-0.84861 -0.94662,-3.16824 0.0668,-3.67496 1.27419,-0.63709 3.36248,1.25562 3.36248,0.91993 -0.006,-0.3259 0,0 -0.006,-0.3259 -1.39683,-1.69172 -1.73527,-1.79172 -2.42123,-4.135345 0.15622,-1.483814 1.99451,-2.224343 2.50397,-3.202486 0.61964,-1.239275 -3.10223,-4.479968 -3.90713,-4.882418 z");
  g.appendChild(path);
  
  boxNote2.appendChild(g);
  
  makeElementDraggable()
}




  /*
  let resetNotes = document.getElementsByClassName("item");
  let resetNotesLength = resetNotes.length;
  console.log(resetNotes)
  for(let i = 0; i < resetNotesLength ; i++){
    //resetNotes[i].parentNode.removeChild(resetNotes[i]);
    let noteName = resetNotes[i].id.split('-')[1];
    let newId = 'nota-' + noteName + '-0';
    resetNotes[i].id = newId;
  }

  //Resetear el id de las bases de las notas que cambian de color 
  let addedRectNotes = document.getElementsByClassName("addedNote");
  let addedNotesLength = addedRectNotes.length;

  for(let i = 0; i < addedNotesLength ; i++){

    addedRectNotes[i].parentNode.removeChild(addedRectNotes[i]);
   
    let className = addedRectNotes[i].classList[0].split('-')[0];
    let resetClass = className + '-0';
    addedRectNotes[i].classList = resetClass;
    
  }
  
  let draggedNotes = $('.dragged');
  let draggedNotesLength = draggedNotes.length;

  for(let i = 0; i < draggedNotesLength ; i++){
    draggedNotes[i].parentNode.removeChild(draggedNotes[i]);
  }
  */