
import services from '/json/autoFillServices.json' assert { type: "json" };


/* Data:

,{
  serviceName:
  mPIDescription:
  quickSelectOption:
  otherNotes:
  hours:
}


NEEDED:
Name displayed : serviceName
Name on MPI : mPIDescription
OPTIONAL:
Quick Select : quickSelectOption
Other Notes : otherNotes
hours : hours
*/


// This is ran the moment the DOM is safe to manipulate.
// Calls a function for every service in the '/json/autoFillServices.json' file that loads each service onto the page.
$(this).ready(function(){
 for (let i = 0; i < services.length; i++) {
  createServiceElement(services[i].serviceName, i);
 }
});


// This is ran every time the submit button is clicked. Converts raw input data into the services in json file, then sends the data to sendToPage()
$("#submit").click(function(e){
  e.preventDefault();
  let formValuepairs = $('#autoFillForm').serializeArray();
  //sendToPage(services[serviceIndex], setService);
  let requests = formValuepairs.map(function(valuePair){
    let serviceIndex = parseInt(valuePair.name);
    return services[serviceIndex];
    
  });
  console.log(requests);
  sendToPage(requests);
});

// Creates an option on webpage for service item.
function createServiceElement(service,id){
  $('<label>').attr({id: id}).text(service).insertBefore('#autoFillForm div');
  $('<input>' + id).attr({
    type: 'checkbox',
    id: id,
    name: id
  }).prependTo(`#autoFillForm label#${id}`);
}

// Sends requested service alterations to the page, triggers 'changeService' in inject.js
// Since this extension is technically another webpage, in order for commands to be sent to the page, we must find the tab and execute a script in that page.
async function sendToPage(data) {
  let queryOptions = { url:"*://*.autoloop.us/dms/app/Schedule/MPI/Inspection/*"};
  let [tab] = await chrome.tabs.query(queryOptions);
  //chrome.tabs.sendMessage(tab.id,data);
  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    func: ((data)=>document.dispatchEvent(new CustomEvent('changeService', {detail: data}))),
    args:[data]
  });
}

