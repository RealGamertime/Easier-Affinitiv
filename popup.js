//chrome.storage.sync.clear();


import { getActiveTabUrl, sendTabHTMLMessage, getAllTechnicians} from "./utils.js";
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
//Disables animations on page load to prevent all bars from transitioning as if someone clicked it.
window.onload = async function(event) {
	await new Promise((resolve, reject) => setTimeout(resolve, 50));
	var sheet = window.document.styleSheets[0];
	sheet.insertRule('.check-box { transition: background-color 0.4s; }', sheet.cssRules.length);
	sheet.insertRule('.label-checkbox{transition: background-color 0.4s ease;', sheet.cssRules.length);
	sheet.insertRule('.label-checkbox::before{transition:transform 0.4s ease;}', sheet.cssRules.length);
};

const settings={
	'selectedTech': null,
	'warnUser': true,
  'availTechs': ["Cosmo Verdi","Dugan Sheridan","HECTOR A OLMEDO","Jesus Rodriguez","KEVIN GILLILAND","Nicholas Carr","Nick Wekell","SEAN M RAGSDALE","TRISTAN SHARP"]
};
var isMPI = false;
document.addEventListener("DOMContentLoaded", async () =>{
	const activeTab = await getActiveTabUrl();
	isMPI = activeTab.url.includes("MPI");
	chrome.storage.sync.get(null, async (data) =>{
		if(Object.keys(data).length === 0){
      //Initilizing settings
      console.log("No data, importing default settings.");
      chrome.storage.sync.set(settings);
		}
		else{
			settings.selectedTech = data.selectedTech;
			settings.warnUser = data.warnUser;
			settings.availTechs = data.availTechs;
		}
		//console.log(value.selectedTech);
		console.log(activeTab.url.includes("MPI"));
		
		console.log("Begin: Settings");
		console.log("Selected Tech: " + settings.selectedTech);
		console.log("Warn User: " + settings.warnUser);
		console.log("Avail Techs: " + settings.availTechs);
		console.log("End: Settings");
		var curTab = await getActiveTabUrl();
		if(isMPI){
			await sendTabHTMLMessage(curTab);
		}
		else{
			main();
		}
	});
});
var pageSource;
chrome.runtime.onMessage.addListener(function(request, sender) {
	if (request.action == "getSource") {
			pageSource = request.source;
			//alert(pageSource);
			main();
			//var title = pageSource.match(/<title[^>]*>([^<]+)<\/title>/)[1];
	}
});

document.getElementById("techSelection").addEventListener("change", function(){
	console.log("changed selectedTech to: " + this.value);
	chrome.storage.sync.set({'selectedTech':this.value});
});
document.getElementById("warnUser").addEventListener("change", function(event){
	chrome.storage.sync.set({'warnUser':event.currentTarget.checked});
	console.log(event.currentTarget.checked);
});



function main(){
	console.log(isMPI);
	if(isMPI)
	{
	var techs = getAllTechnicians(pageSource);
	selectSettings(techs);
	}
	else if(settings.availTechs.length != 0)
	{
		console.log("Techs saved, retrieving data.");
		var techs = settings.availTechs;
		selectSettings(techs);
	}
	else{ console.error("No Techs found");}
}

function createTechOptions(techs){
	techs.forEach((tech, index)=>{
		var techOption = document.createElement("option");
		techOption.innerText = tech;
		techOption.id = index;
		var techSelectionClass = document.getElementsByClassName("techSelection")[0];
		techSelectionClass.appendChild(techOption);
	});
}
function selectSettings(techs){
	$('#warnUser')[0].checked = settings.warnUser;
	createTechOptions(techs);
	if(techs.includes(settings.selectedTech)){
		console.log("Selected tech exists.");
		$('#techSelection')[0].value =settings.selectedTech;
	}
	else{
		console.warn(`Selected Technician: ${settings.selectedTech} does not exist.`);
	}
	

}
/*function importContentSettings(activeTab){
	if(techs.includes(settings.selectedTech)){
		selectTech(activeTab, settings.selectedTech, settings.warnUser);
	}
	//Todo: Send selectedTech value to ./content.js for it to change the selected Technician for the current MPI if no tech has been selected.
}*/