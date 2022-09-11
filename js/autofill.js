
const services = [ 
"Engine Air Filter",
"Cabin Air Filter",
"Battery Replacement",
"Battery Service",
"Fuel System Cleaning",
"Brake Fluid Flush",
"Coolant Flush",
"Power Steering Flush",
"Auto Trans Flush",
"4x4 Service",
"Alignment"];

$(this).ready(function(){
 for (var service of services){
   createServiceElement(service);
 }
});

$("#submit").click(function(e){
  e.preventDefault();
  var formValuepairs = $('#autoFillForm').serializeArray();;
  sendToPage(formValuepairs.map(u => u.name).join(' '));
  console.log(formValuepairs);
  
});
function createServiceElement(service){
  var id = service.replaceAll(" ","").toLowerCase();
  $('<label>').attr({id: id}).text(service).insertBefore('#autoFillForm div');
  $('<input>' + id).attr({
    type: 'checkbox',
    id: id,
    name: id
  }).prependTo(`#autoFillForm label#${id}`);
}


async function sendToPage(data) {
  let queryOptions = { url:"*://*.autoloop.us/dms/app/Schedule/MPI/Inspection/*"};
  let [tab] = await chrome.tabs.query(queryOptions);
  console.log(tab);
  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    func: inject,
    args:[data]
  });
}

function inject(data){

  $('a#lnkDashboard').text(data);
}