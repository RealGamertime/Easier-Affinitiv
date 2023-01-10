var warnUser = false;
var pageTechIndex = -1;
var injectionComplete = false;
var pageInit = false;
const authToken = localStorage.getItem("autoLoopApiAuthToken");
const companyId = 8316;

var observer = new MutationObserver(function (mutations){
  //console.log(mutations);




  var services = mutations.map(item => item.addedNodes[0]).filter(elem => $(elem).is("li[id*='result']"));
  if(services.length != 0){
    if(!pageInit){
    pageInit = true;
    }else{
    updatePageMods();
    }
    console.log(services);
  }
});
let options = {
subtree:true,
childList: true
};
let targetNode = $('inspection-details')[0];
console.log(targetNode);
if($(document).find("li[id*='result']")){
  console.log("Objects already loaded");
  pageInit = true;
}
observer.observe(targetNode, options);


document.addEventListener("DOMContentLoaded", ()=>{
  console.log("LOADED")});
window.addEventListener("load", ()=>{
  console.log("LOADED")});

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
        console.log("No data, importing default settings.");
        chrome.storage.sync.set(settings);
      }else{
        for(let prop in data){
          if (settings.hasOwnProperty(prop)) {
            settings[prop] = data[prop];
          }else{
            console.info(prop + " is not in settings... removing.");
            chrome.storage.sync.remove(prop);
          }
        }
        console.log("Loaded Settings: ", data);
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

main();
async function main(){
  //chrome.storage.sync.clear();
  console.log(authToken);
  await retrieveSettings();
  verifyTechs();

  while(!pageInit){
    await new Promise((resolve, reject) => setTimeout(resolve, 10));
    console.log("Waiting for page to initialize");
  }
  if(settings.availTechs.includes(settings.selectedTech)){
    console.log("Working");
    let option = $('#technicianSelect').find(`option[label='${settings.selectedTech}']`);
    console.log(option);
    if(option.length == 1){
      pageTechIndex=option[0].index;
      console.log(settings.selectedTech, " is available! ", pageTechIndex);
    }
  }
  else{
    console.info(`Selected Technician; ${settings.selectedTech} does not exist.`);
  }
  await inject();
  console.log(settings);
  updatePageMods();
}

function verifyTechs(){
  var requestUrl = "https://xapi.autoloop.com/api/v1/Technicians";
  var data = {
      companyId: 8316,
      mpiTechniciansOnly:true,
      forAppointmentSchedulingOnly:false
    };
    // send the request
    $.ajax({
        type: "GET",
        url: requestUrl,
        dataType: 'json',
        data: data,
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", "Bearer " + authToken);
            xhr.setRequestHeader("X-Loop-CompanyId", JSON.stringify(companyId));
        },
        success: function (techsRaw) {
          let techNames = techsRaw.map(tech=>tech.name);
          if(settings.availTechs != techNames){
            settings.availTechs = techNames;
            chrome.storage.sync.set({availTechs:techNames});
          }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            notificationBar.clear();
            notificationBar.add(notificationBar.Error, "An error occurred while trying to add the shortcut: " + errorThrown);
            notificationBar.showNotifications();
        }
    }); //$.ajax
}

function updatePageMods(){
  document.dispatchEvent(new CustomEvent('updatePage', 
    {
      detail:{
        'autoMeasurements':settings.autoMeasurements,
        'autoCloseMeasurements':settings.autoCloseMeasurements
      }
    }
  ));
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
    console.log('Injection Completed!');
  });
  (document.body || document.head || document.documentElement).appendChild(s);
  
  while(!injectionComplete){
    await new Promise((resolve, reject) => setTimeout(resolve, 10));
    console.log("Waiting for injection code to complete.");
  }
  console.log("Injection code completed!");
  


  function autoTechChange(){
    var techValue = $('#technicianSelect')[0].selectedOptions[0].innerText;
    var noTechAssigned = (techValue=="" || techValue=="NOTAPPLICABLE");
      if(settings.selectedAct == 0)
      return true;
    return noTechAssigned;
  }
  function autoTechWarn(){
    console.log($('#technicianSelect')[0].selectedOptions[0].innerText);
    var techValue = $('#technicianSelect')[0].selectedOptions[0].innerText;
    var noTechAssigned = techValue==="" || techValue==="NOTAPPLICABLE";
      console.log(noTechAssigned);
    if(settings.selectedConf == 0)
      return false;
    else if(settings.selectedConf == 1)
      return !noTechAssigned;
    return true;
  }
}
// $("body").on('DOMNodeRemoved', ".ajaxLoaderOverlay", function(e) {
//   console.log(e);
// });