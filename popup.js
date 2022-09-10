//chrome.storage.sync.clear();


import "./jquery-3.6.0.min.js";
/***
["skipAll"].forEach(addListenerFor);

var activeTab = null;

// function comActivePage(data){
// 	chrome.tabs.query({active:true, currentWindow:true}, function(tabs){
//       var activeTab = tabs[0];
// 	  chrome.tabs.sendMessage(activeTab.id, ()=>{console.log("Hello World")});
// 	});
// }
// comActivePage("");

function saveData(data){
	
}
chrome.tabs.query({active:true, currentWindow:true}, function(tabs){
	activeTab = tabs[0];
});
var port = chrome.tabs.connect(activeTab.id, {name: "main"});

function addListenerFor(obj){
  var itemToggled;
  var element = document.getElementById("skipAll");
  element.addEventListener('click', function(){
	  port.postMessage({toggle: "skipAll"});
	  port.onMessage.addListner((response)=>{
		  itemToggled = response.toggle;
		  element.innerText = itemToggled ? "Skip" : "Unskip";
	  });
  });
}
*/
const settings={
	'selectedTech': null,
	'autoTech': false,
	'selectedConf': 0,
	'selectedAct':0,
	'availTechs': ["Cosmo Verdi","Dugan Sheridan","HECTOR A OLMEDO","Jesus Rodriguez","KEVIN GILLILAND","Nicholas Carr","Nick Wekell","SEAN M RAGSDALE","TRISTAN SHARP"]
};
//var isMPI = false;
document.addEventListener("DOMContentLoaded", async () =>{
	chrome.storage.sync.get(null, async (data) =>{
		if(Object.keys(data).length === 0){
      //Initilizing settings
      console.log("No data, importing default settings.");
      chrome.storage.sync.set(settings);
		}
		else{
			
			settings.selectedTech = data.selectedTech;
			settings.autoTech = data.autoTech;
			settings.selectedConf = data.selectedConf;
			settings.selectedAct = data.selectedAct;
			settings.availTechs = data.availTechs;
		}
		console.log("Begin: Settings");
		console.log("Auto Tech: " + settings.autoTech);
		console.log("Selected Tech: " + settings.selectedTech);
		console.log("Selected Confirm: " + settings.selectedConf);
		console.log("Avail Techs: " + settings.availTechs);
		console.log("Selected Activate Params: " + settings.selectedAct);
		console.log("End: Settings");
		main();
	});
});

document.getElementById("autoTech").addEventListener("change", function(event){
	console.log(this.checked);
	chrome.storage.sync.set({'autoTech':this.checked});
});
document.getElementById("techSelection").addEventListener("change", function(){
	console.log("changed selectedTech to: " + this.value);
	chrome.storage.sync.set({'selectedTech':this.value});
});
document.getElementById("activateSelection").addEventListener("change", function(event){
  chrome.storage.sync.set({'selectedAct':this.selectedIndex});
});
document.getElementById("confirmSelection").addEventListener("change", function(event){
  chrome.storage.sync.set({'selectedConf':this.selectedIndex});
});



function main(){
	var techs = settings.availTechs;
	initSettings(techs);
}

function loadTechOptions(techs){
	techs.forEach((tech, index)=>{
		var techOption = document.createElement("option");
		techOption.innerText = tech;
		techOption.id = index;
		var techSelectionClass = document.getElementById("techSelection");
		techSelectionClass.appendChild(techOption);
	});
}
function initSettings(techs){
	$('#autoTech')[0].checked = settings.autoTech;
	$('#activateSelection')[0].selectedIndex = settings.selectedAct;
	$('#confirmSelection')[0].selectedIndex = settings.selectedConf;
	loadTechOptions(techs);
	if(techs.includes(settings.selectedTech)){
		console.log("Selected tech exists.");
		$('#techSelection')[0].value =settings.selectedTech;
	}
	else{
		console.warn(`Selected Technician: ${settings.selectedTech} does not exist.`);
	}
}