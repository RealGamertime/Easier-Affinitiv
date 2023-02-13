var warnUser = false;
var pageTechIndex = -1;
var injectionComplete = false;
var pageInit = false;
const settings={
	'selectedTech':[], // Technician for auto tech
	'autoTech': false, // Enable auto change technician
	'statusTracker':true, // Enable status track at bottom of page
	'autoMeasurements':true, // Enable auto open measurement for tires/brakes
	'autoCloseMeasurements':true, // Enable auto close measurements for tires/brakes
  'eV': true, // Enable auto eletric vehicle, auto skips ICE services.
	'selectedConf': 0, // Disable Confirmation for auto Tech.
	'selectedAct':0, // Change Condition for auto Tech.
	'availTechs': {} // All available techs for MPI.
};


// Initial Check to see if page is already loaded before extension loaded.
var services = $("section[id*='inspection-results'] li[id*='result']");
if(services.length !=0){
  console.log("Page Already Loaded");
  pageInit = true;
}
// End of Check.

// Creates an observer to observe every change in the DOM inspection results area.
// This is done so that every time the inspection elements are loaded, we can reoverlay our changes onto the page.
var observer = new MutationObserver(function (itemArray){
  var services = itemArray.map(item => item.addedNodes[0]).filter(elem => $(elem).is("li[id*='result']"));
  if(services.length != 0){
    if(!pageInit){
    pageInit = true;
    }else{
    updatePageMods();
    }
    //console.log(services);
  }
});
let options = {
subtree:true,
childList: true
};
let targetNode = $('inspection-details')[0];
observer.observe(targetNode, options);
// End of observer creation.


main();

// Retrieves settings stored on google account or if not logged in stored locally.
// Since it is submitting a request, function is async to keep page responsive.
async function retrieveSettings(){
  await new Promise((resolve,reject)=>{
    chrome.storage.sync.get(null, function(data) {
      //Checking if any settings are being stored.
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
        console.log("Loaded Settings: ");
        console.log(data);
        resolve();
      }
    });
  });
}

// This is the first main function called after setup. Configures page for extension.
async function main(){
  //chrome.storage.sync.clear();
  await retrieveSettings();
  checkForTechChanges();

  while(!pageInit){
    await new Promise((resolve, reject) => setTimeout(resolve, 10));
    console.log("Waiting for page to initialize");
  }
  await inject();
  console.log(settings.availTechs);
  if(settings.availTechs[settings.selectedTech[0]] != undefined){
    // console.log("Working");
    // let option = $('#technicianSelect').find(`option[label='${settings.selectedTech[0]}']`);
    // console.log(option);
    // if(option.length == 1){
    //   pageTechIndex=option[0].index;
    console.log(settings.selectedTech[0], " is available! ");
    // }
    if (settings.autoTech) {
      console.log("Changing Tech");
      let query = {technicianId: settings.selectedTech[1],"inspectionTypeId": "5675eac1-ab28-4161-be0d-5f3217a1ae20"}; // This is the id for the NOTAPPLICABLE Tech.
	      sendQuery(`/api/v1/Inspections/${inspectionId}`, "PUT", query);
      //var isTechAvail = $('#technicianSelect').get(0).selectedIndex != settings.selectedIndex;
      //var techValue = $('#technicianSelect :selected').text();
      //var warnUser = settings.selectedConf == 2 || (settings.selectedConf && !settings.noTechAssigned);
      var changeTech = (settings.autoTech && pageTechIndex !=-1 && isTechAssigned());
      if(changeTech){
        
        //alert(settings.selectedIndex);
        // var techSelect = document.querySelector('#technicianSelect');
        // techSelect.selectedIndex = settings.selectedIndex;
  
  
        // console.log('received', settings.selectedIndex);
        // if (!settings.warnUser) {
        //   var realConfirm = window.confirm;
        //   window.confirm = function () {
        //     window.confirm = realConfirm;
        //     return true;
        //   };
        // }
        
      } 
      var data = {
        selectedIndex: pageTechIndex,
        ...settings
      };
      document.dispatchEvent(new CustomEvent('info', { detail: data }));
    }
  }
  else{
    console.info(`Selected Technician; ${settings.selectedTech[0]} does not exist.`);
  }
}
function isTechAssigned(){
  if(settings.selectedAct == 0)
    return true;
  return (techValue=="" || techValue=="NOTAPPLICABLE");
}
// Dispatches "updatePage" event to communicate with inject.js.
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
// Checks if any techs have been added or removed from company.
// Get request from autoloop api for all technicians, then compares to the settings, makes alterations to local settings as needed.
function oldCheckForTechChanges(){
  var authToken = localStorage.getItem("autoLoopApiAuthToken");
  var requestUrl = "https://xapi.autoloop.com/api/v1/Technicians";
  var services = [];
  var data = {
  companyId: 8316,
    mpiTechniciansOnly: true
  };
  // send the request
  $.ajax({
  async: false,
  type: "GET",
  url: requestUrl,
  dataType: 'json',
  data: data,
  beforeSend: function (xhr) {
      xhr.setRequestHeader("Authorization", "Bearer " + authToken);
      xhr.setRequestHeader("X-Loop-Companyld", "8316");
  },
  success: function (techsInfo) {
    let techNames = techsInfo.map(function(tech){return tech.name});
    //console.log(techNames);
    if(techNames.toString() != settings.availTechs.toString()){
      console.log("There has been a change in availabiliy of technicians, updating available techs.");
      //console.log(techNames);
      //console.log(settings.availTechs);
      let techParse = {"availTechs": techNames};
      chrome.storage.sync.set(techParse);
    }
  }
  });
}

function checkForTechChanges(){
  sendQuery('api/v1/Technicians', "GET", null, {...baseUrlParams, mpiTechniciansOnly: true}).then(function(response){
    techNames = response.reduce(function(result, tech) {
      result[tech.name] = tech.technicianId;
      return result;
    }, {})
    console.log(response);
    if(JSON.stringify(techNames) != JSON.stringify(settings.availTechs)){
      console.log("There has been a change in availabiliy of technicians, updating available techs.");
      chrome.storage.sync.set({"availTechs": techNames});
    }
  });
}


// Injects inject.js onto page to break out of chrome extension's "isolated World" to interacte with page.
async function inject(){
  
	var json = document.createElement
  var s = document.createElement('script');
  s.src = chrome.runtime.getURL('/js/inject.js');
  s.onload = function() {
    var data = {
      selectedIndex: pageTechIndex,
      ...settings
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
  
  
  /*function autoTechWarn(){
    //console.log($('#technicianSelect')[0].selectedOptions[0].innerText);
    //var techValue = $('#technicianSelect')[0].selectedOptions[0].innerText;
    //var noTechAssigned = techValue==="" || techValue==="NOTAPPLICABLE";
      //console.log(noTechAssigned);
    // if(settings.selectedConf == 0)
      // return false;
    // else if(settings.selectedConf == 1)
      // return !noTechAssigned;
    // return true;
    return settings.selectedConf == 2 || (settings.selectedConf && !noTechAssigned);
  }*/
}


function sendQuery(rawUrl, method, payload, rawUrlParams=baseUrlParams, baseUrl = 'https://xapi.autoloop.com'){
	let urlParams = new URLSearchParams([...Object.entries(rawUrlParams)]);
	var url = new URL(`${rawUrl}?${urlParams}`, 'https://xapi.autoloop.com');
    return new Promise((resolve,reject) => {
        payload = JSON.stringify(payload);
        var authToken = localStorage.getItem("autoLoopApiAuthToken");
        var request = new XMLHttpRequest();
        request.open(method, url, true);
        request.onload = function() {
        	if (request.readyState==4){
				console.log("Status: " + request.status);
                let data = JSON.parse(request.response);
				//console.log(data);
                resolve(data);
            }
        };
        request.setRequestHeader("Content-Type", "application/json;charset=utf-8");
        request.setRequestHeader("Authorization", "Bearer " + authToken);
        request.setRequestHeader("X-Loop-CompanyId", 8316);
        request.send(payload);
    })
}

var inspectionId = new URLSearchParams(window.location.search).get("inspectionId");
var inspectionResultIds = [];
var inspectionsResults = $("section[id*='inspection-results'] li[id*='result']");
inspectionsResults.each(function(index){
	inspectionResultIds[index] = $(this).attr("id").substring(7);
});
const techUrl = 'api/v1/Technicians';
const baseUrlParams = {companyId:8316};
console.log(inspectionId);
console.log(inspectionResultIds);

function removeTech(){
	let query = {technicianId: "33a899ae-7266-4180-bdaf-1be1764dc893"}; // This is the id for the NOTAPPLICABLE Tech.
	sendQuery(`/api/v1/Inspections/${inspectionId}`, "PUT", query);
}
console.log(inspectionId);
// removeTech()


