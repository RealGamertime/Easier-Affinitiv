
const services = [{ 
  serviceName:"Engine Air Filter",
  mPIDescription:"Engine Air Filter",
  quickSelectOption:"Replace Air Filter",
},{ 
  serviceName:"Cabin Air Filter",
  mPIDescription:"Cabin Air Filter",
  quickSelectOption:"Cabin Air Filter"
},{ 
  serviceName:"Battery Replacement",
  mPIDescription:"Battery Performance",
  quickSelectOption:"Replace Battery"
},{ 
  serviceName:"Battery Service",
  mPIDescription:"Battery Performance",
  otherNotes:"Battery Cleaning Service Recommended.",
  hours:0.3
},{ 
  serviceName:"Fuel System Cleaning",
  mPIDescription:"Fuel System",
  quickSelectOption:"Fuel System Cleaning"
},{
  serviceName:"Wiper Blades",
  mPIDescription:"Wiper Blades"
},{
  serviceName:"Brake Fluid Flush",
  mPIDescription:"Brake Fluid",
  quickSelectOption: "Brake System"
},{
  serviceName:"Coolant Flush",
  mPIDescription: "Cooling System",
  quickSelectOption:"Cooling System"
},{
  serviceName:"Power Steering Flush",
  mPIDescription:"Power Steering Fluid",
  quickSelectOption:"Power Steering Fluid"
},{ 
  serviceName:"4x4 Service",
  mPIDescription:"Transmission, U-Joints",
  otherNotes:"4x4 Service Recommended.",
  hours:1.5
},{
  serviceName:"Auto Transmission Flush",
  mPIDescription:"Transmission, U-Joints",
  quickSelectOption:"Automatic"
},{
  serviceName: "4 Wheel Alignment",
  mPIDescription: "Drive Shaft/CV Boots",
  quickSelectOption: "4 Wheel"
}];


/* Data:

,{
  serviceName:
  mPIDescription:
  quickSelectOption:
  otherNotes:
  hours:
}


NEEDED:
Name displayed
Name on MPI
OPTIONAL:
Quick Select
Other Notes
hours
*/


$(this).ready(function(){
 for (let i = 0; i < services.length; i++) {
  createServiceElement(services[i].serviceName, i);
 }
});

$("#submit").click(async function(e){
  e.preventDefault();
  let formValuepairs = $('#autoFillForm').serializeArray();
  for(let valuePair of formValuepairs){
    let serviceIndex = parseInt(valuePair.name);
    //console.log(serviceIndex);
    //console.log(services[serviceIndex]);
    sendToPage(services[serviceIndex], setService);
    await new Promise((resolve, reject) => setTimeout(resolve, 300));
    //console.log(formValuepairs);
    //brow.sendMessage('setService');
  }
});

function createServiceElement(service,id){
  $('<label>').attr({id: id}).text(service).insertBefore('#autoFillForm div');
  $('<input>' + id).attr({
    type: 'checkbox',
    id: id,
    name: id
  }).prependTo(`#autoFillForm label#${id}`);
}
async function sendToPage(data, func) {
  let queryOptions = { url:"*://*.autoloop.us/dms/app/Schedule/MPI/Inspection/*"};
  let [tab] = await chrome.tabs.query(queryOptions);
  //chrome.tabs.sendMessage(tab.id,data);
  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    func: func,
    args:[data]
  });
}



async function setService(service){
  var inspectionElement = $(`li[id*='-ed11-8379-00155dbf760b'][id*='result'] dd[title*='${service.mPIDescription}']`).parents("li");
  if(inspectionElement.find("fancy-checkbox[additional-classes='red'] i.fa-check-square-o").length === 0)
  {
    if(service.quickSelectOption || service.otherNotes)
      {
        
        envokeClick(inspectionElement.find('i.fa-plus-square-o'));

        if(service.quickSelectOption){
          var quickSelectElement = inspectionElement.find(`select.service-selector`);
          quickSelectElement.find(`option[label*="${service.quickSelectOption}"]`).prop('selected', true);
          envokeChange(quickSelectElement);
          envokeClick(inspectionElement.find('button[ng-click="vm.add()"]'));
        }
        if(service.otherNotes){
          var otherNotesElement = inspectionElement.find('div.notes-history-container');
          
          envokeChange(otherNotesElement.find('input').val(service.otherNotes));
          envokeClick(otherNotesElement.find('button'));
          if(service.hours)
          {
            envokeChange(otherNotesElement.find('input').val(`${service.hours} hours`));
            envokeClick(otherNotesElement.find('button'));
          }
        }

    }
    if(service.quickSelectOption){
      while(true){
        if(inspectionElement.find('ul.inspection-result-services-list').length > 0){
          break;
        }
        console.log("waiting");
        await new Promise((resolve, reject) => setTimeout(resolve, 50));
      }
    }
    envokeClick(inspectionElement.find("fancy-checkbox[additional-classes='red']"));
    envokeClick(inspectionElement.find('i.fa-minus-square-o'));
    function envokeClick(jqelement){
      try
      {
        jqelement[0].dispatchEvent(new CustomEvent('click'))
      }catch(e){console.log(e);}
    }
    function envokeChange(jqelement){
      try
      {
        jqelement[0].dispatchEvent(new CustomEvent('change'));
      }catch(e){console.log(e);}
    }
  }
}