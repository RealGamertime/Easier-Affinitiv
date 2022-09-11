var techSelectionClass = $('#technicianSelect');
var warnUser = false;
var pageTechIndex = -1;
var inspectionsResults;
var injectionComplete = false;
retrieveSettings();
main();
// const settings={
// 	'selectedTech': null,
// 	'autoTech': false,
//   'statusTracker':true,
//   'openMeasurements':false,
// 	'selectedConf': 0,
// 	'selectedAct':0,
// 	'availTechs': ["Cosmo Verdi","Dugan Sheridan","HECTOR A OLMEDO","Jesus Rodriguez","KEVIN GILLILAND","Nicholas Carr","Nick Wekell","SEAN M RAGSDALE","TRISTAN SHARP"]
// };
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
      console.log(data);
			console.log("Begin: Settings");
      for(let prop in data)
			{
				if (settings.hasOwnProperty(prop)) {
					settings[prop] = data[prop];
					console.log(prop + ": " + data[prop]);
				}
				else{
					console.info(prop + " is not in settings... removing.");
					chrome.storage.sync.remove(prop);
				}
			}
			console.log("End: Settings");
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
  await waitForPageLoad();
	autoMeasurements();
}

function autoMeasurements(){
  if(settings.autoMeasurements){
    console.log("auto measurements");
    let inspectionsResults = $("li[id*='-ed11-8379-00155dbf760b'][id*='result']");
    inspectionsResults.each((i,element)=>{
      $(element).find('i.fa-plus-square-o').click(()=> {
        $(element).find('custom-fields i.fa-pencil').click();
      if(settings.autoCloseMeasurements){
        var boxes = $(element).find('custom-field-input');
        boxes.each((i, box)=>{
          $(box).find('textarea').eq(0).focusout(()=>{ 
            $(box).find('i.fa-save').click();
        });
        });
      }
      });
    });
  }
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
  (document.body || document.head || document.documentElement).appendChild(s);
  while(!injectionComplete){
    await new Promise((resolve, reject) => setTimeout(resolve, 10));
  }
}

document.addEventListener('injectionComplete', function (e) {
  injectionComplete = true;
  console.log('Injection Completed!');
});