const DEBUG = true;

var techSelectionClass = $('#technicianSelect');
var warnUser = false;
var pageTechIndex = -1;
var inspectionsResults;
var injectionComplete = false;
main();

const settings={
	'selectedTech': null,
	'autoTech': false,
	'statusTracker':true,
	'autoMeasurements':false,
	'autoCloseMeasurements':true,
	'selectedConf': 0,
	'selectedAct':0,
	'availTechs': ["Cosmo Verdi","Dugan Sheridan","HECTOR A OLMEDO","Jesus Rodriguez","KEVIN GILLILAND","Nicholas Carr","Nick Wekell","SEAN M RAGSDALE","TRISTAN SHARP"]
};
async function retrieveSettings(){
  
  
  // chrome.storage.sync.get(null, function(data) { 
  //   console.log(data)});
  await new Promise((resolve,reject)=>{
    chrome.storage.sync.get(null, function(data) {
      //Checking if any settings in storage.sync
      if(Object.keys(data).length === 0){
        //Initilizing settings
        debug("No data, importing default settings.");
        chrome.storage.sync.set(settings);
      }
      else{
        for(let prop in data)
        {
          if (settings.hasOwnProperty(prop)) {
            settings[prop] = data[prop];
          }
          else{
            console.info(prop + " is not in settings... removing.");
            chrome.storage.sync.remove(prop);
          }
        }
        debug("Loaded Settings: ", data);
        resolve();
      }
    });
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
  debug("retrieving settings");
  await retrieveSettings();
  debug("waiting for page load");
  await waitForPageLoad();
  //var techs = getAllTechnicians();
  //updateSetting("availTechs", techs);
  //console.log(settings.selectedTech);
  //alert(techs);
  if(settings.availTechs.includes(settings.selectedTech)){
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
  await inject();
  autoMeasurements();
}

$('#technicianSelect').on('change', ()=>{
	techChanged();
});

async function techChanged(){
  debug("TECHCHANGED");
  await waitForPageLoad();
	autoMeasurements();
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
	debug(techSelectionClass[0].selectedOptions[0].innerText);
	var techValue = techSelectionClass[0].selectedOptions[0].innerText;
	var noTechAssigned = techValue==="" || techValue==="NOTAPPLICABLE";
    debug(noTechAssigned);
	if(settings.selectedConf == 0)
		return false;
	else if(settings.selectedConf == 1)
		return !noTechAssigned;
	return true;
}

function autoMeasurements(){
  if(settings.autoMeasurements){
    debug("Auto Measurements Initilizing");
    document.dispatchEvent(new CustomEvent('autoMeasure', {detail:{'autoCloseMeasurements':settings.autoCloseMeasurements}}));
  }
}

async function waitForPageLoad(){
  debug("Waiting for ajaxspinner to load");
  while(!$('.ajaxSpinner').length){
    await new Promise((resolve, reject) => setTimeout(resolve, 3000));
    debug("Waiting!");
  }
  debug("Waiting for ajaxspinner to close");
  while($('.ajaxSpinner').length){
    await new Promise((resolve, reject) => setTimeout(resolve, 500));
    debug("Waiting!");
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

async function inject(){
	var warnUser = autoTechWarn();
	var changeTech = (settings.autoTech && pageTechIndex !=-1 && autoTechChange());
	
  var s = document.createElement('script');
  s.src = chrome.runtime.getURL('/js/inject.js');
  s.onload = function() {
    var data = {
      changeTech: changeTech,
      warnUser: warnUser,
      selectedIndex: pageTechIndex,
      statusTracker: settings.statusTracker
    };
    document.dispatchEvent(new CustomEvent('info', { detail: data }));
    
  };
  document.addEventListener('injectionComplete', function (e) {
    injectionComplete = true;
    debug('Injection Completed!');
  });
  (document.body || document.head || document.documentElement).appendChild(s);
  
  while(!injectionComplete){
    await new Promise((resolve, reject) => setTimeout(resolve, 10));
  }
}


function debug(info, obj){
  if(DEBUG) {
    console.log(info);
    if(obj != null){
      console.log(obj);
    }
  }
}