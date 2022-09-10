/*var skipped = false;

skipped = !skipped;
async function clickSkipAll(skip){
  if(typeof skip === 'undefined') {
    skip = skipped;
    skipped = !skipped;
  }
  var skipButtons = $('[ng-click="vm.toggleSkipInspectionResult(inspectionResult)"]');
  await skipButtons.each((i)=>{
  var button = skipButtons.eq(i);
  var hasSkipped = button.find("i.fa-check-square-o").length == 1;
  if(skip != hasSkipped){
      try{
      button.click();
      }catch(err){
          console.log(button);
          console.log(err.message);
      }
  }
});
}

chrome.runtime.onConnect.addListener(function(port) {
	console.assert(port.name === "main");
	port.onMessage.addListener(function(msg) {
		if(request.toggle == "skipAll"){
			console.log("Skipping All 25 Point Inspections!");
			clickSkipAll();
			port.postMessage({toggle:skipped});
		}
	});
});
 
/*chrome.runtime.onMessage.addListener( function(request, sender, sendResponse){
  if(request.toggle == "skipAll"){
    console.log("Skipping All 25 Point Inspections!");
    
    clickSkipAll();
    sendResponse({toggle:skipped});
  }
});*/
var techSelectionClass = $('#technicianSelect');
var warnUser = false;
var pageTechIndex = -1;
retrieveSettings();
main();
const settings={
	'selectedTech': null,
	'autoTech': false,
	'selectedConf': 0,
	'selectedAct':0,
	'availTechs': ["Cosmo Verdi","Dugan Sheridan","HECTOR A OLMEDO","Jesus Rodriguez","KEVIN GILLILAND","Nicholas Carr","Nick Wekell","SEAN M RAGSDALE","TRISTAN SHARP"]
};
function retrieveSettings(){
  
  
  // chrome.storage.sync.get(null, function(data) { 
  //   console.log(data)});
  chrome.storage.sync.get(null, function(data) {
    console.log("Raw");
    console.log(data);
    console.log(Object.keys(data));
    //Checking if any settings in storage.sync
    if(Object.keys(data).length === 0){
      //Initilizing settings
      console.log("No data, importing default settings.");
      chrome.storage.sync.set(settings);
    }
    else{
      //console.log(data.selectedTech);
      settings.selectedTech = data.selectedTech;
      settings.selectedConf = data.selectedConf;
	  settings.selectedAct = data.selectedAct;
	  settings.autoTech = data.autoTech;
    }
});
}

/*function updateSetting(settingKey, data){
  if(Array.toString(settings[settingKey]) != Array.toString(data))
  {
    settings[settingKey] = data;
    chrome.storage.sync.set(settings);
    console.info(`Setting: ${settingKey} updated with new data.`);
  }
}*/

async function main(){
  //chrome.storage.sync.clear();
  await waitForPageLoad();
  //var techs = getAllTechnicians();
  //updateSetting("availTechs", techs);
  console.log(settings.selectedTech);
  //alert(techs);
  if(settings.availTechs.includes(settings.selectedTech)){
    //alert(settings.selectedTech + " is available");
    var availTechs = techSelectionClass.children();
    availTechs.each((index, tech)=>{
      if(tech.innerHTML == settings.selectedTech)
      {
        pageTechIndex=index;
      }
    });
  }
  else{
	  
    console.info(`Selected Technician; ${settings.selectedTech} does not exist.`);
  }
  inject();
}
//var scheduledServices = document.getElementById("scheduled-services");

function autoTechChange(){
	var techValue = techSelectionClass[0].selectedOptions[0].innerText;
	var noTechAssigned = (techValue=="" || techValue=="NOTAPPLICABLE");
    if(settings.selectedAct == 0)
		return true;
	return noTechAssigned;
}
function autoTechWarn(){
	console.log(techSelectionClass[0].selectedOptions[0].innerText);
	var techValue = techSelectionClass[0].selectedOptions[0].innerText;
	var noTechAssigned = techValue==="" || techValue==="NOTAPPLICABLE";
    console.log(noTechAssigned);
	if(settings.selectedConf == 0)
		return false;
	else if(settings.selectedConf == 1)
		return !noTechAssigned;
	return true;
}

async function waitForPageLoad(){
  //alert("Waiting for ajaxspinner to load");
  while(!$('.ajaxSpinner').length){
    await new Promise((resolve, reject) => setTimeout(resolve, 3000));
  }
  //alert("Waiting for ajaxspinner to close");
  while($('.ajaxSpinner').length){
    await new Promise((resolve, reject) => setTimeout(resolve, 500));
  }
  //await new Promise((resolve, reject) => setTimeout(resolve, 500));
}
function getAllTechnicians(htmlString){
  var techs = [];
  for(var tech of techSelectionClass[0].children){
    var name = tech.innerText;
    if(!(name=="" || name=="NOTAPPLICABLE")){
      techs.push(tech.innerText);
    }
  };
  return techs;
}

function inject(){
	var warnUser = autoTechWarn();
	var changeTech = (settings.autoTech && pageTechIndex !=-1 && autoTechChange());
	
  var s = document.createElement('script');
  s.src = chrome.runtime.getURL('./inject.js');
  s.onload = function() {
    var data = {
      changeTech: changeTech,
	  warnUser: warnUser,
	  selectedIndex: pageTechIndex
    };
    document.dispatchEvent(new CustomEvent('info', { detail: data }));
    
  };
  (document.body || document.head || document.documentElement).appendChild(s);
}