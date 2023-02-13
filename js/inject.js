/* This code is injected inside the html of the current webpage thus breaking out of the "isolated world" put in place on chrome extensions.
 * This is required in order to access the page's functions and variables.
 */

const opCodeConverter = {
	"BGBF": [14, 30000],
	"COOLANT": [8, 30000],
	"CABINAF": [4, 15000],
	"AFIC": [4, 15000],
	"ENGINEAF": [7, 15000],
	"AFILTER": [7, 15000],
	"BG3PART": [10, 30000],
	"BGPSF": [15, 30000],
	"101LIFE": -1,
	"27PT": -1,
	"101": -1,
	"101S": -1,
	"101D": -1,
	"ROTATE": -1,
	"27PTEX": -1,
	"100": -1,
	"DECLINE": -1,
	"SUBLET": -1,
	"COURTESY": -1,
	"TIREREPAIR": -1,
	"LOANER": -1,
	"ALIGN": -1,
	"RENTAL": -1
};

var serviceHistory = null;

document.addEventListener('info', async function (e) {
  console.log("Info event triggered");
	try {
		var data = e.detail;
    console.log(e);
		if (data.statusTracker) {
			var scheduledServices = document.getElementById("scheduled-services");
			var statusTrackerContainer = document.getElementById("statusTrackerContainer");
			var inspectionDetails = document.querySelector('section');
			var dummyNode = statusTrackerContainer.cloneNode(true);
			inspectionDetails.append(dummyNode);

			document.addEventListener('scroll', function (e) {
				if (window.scrollY > 700) {
					inspectionDetails.prepend(dummyNode);
					inspectionDetails.append(statusTrackerContainer);
					//console.log(dummyNode);
				} else {
					inspectionDetails.insertBefore(statusTrackerContainer, scheduledServices);
					inspectionDetails.append(dummyNode);
				}
			});
		}
    console.log(data);
    document.dispatchEvent(new CustomEvent('updatePage', { detail: data }));
		document.dispatchEvent(new CustomEvent('injectionComplete'));
	} catch (e) {
		console.error(e);
	}
});

var isUpdatePageRunning = false;

document.addEventListener('updatePage', function (data) {
  if(isUpdatePageRunning){
    console.error("Running two updatePage events at once!");
  }
  else{
    isUpdatePageRunning = true;
  }
	try {
    if(serviceHistory == null){
      console.log("CALLING AJAX REQUEST!");
      var authToken = localStorage.getItem("autoLoopApiAuthToken");
      var requestUrl = "https://autoloop.us/dms/app/Schedule/Details.aspx/GetVehicleHistory";
      var vin = $('div#customer-data dd').eq(4).text().replace(/\s/g, '');
      var output = null;
      var parse = {
        "vin": vin
      };
      // send the request
      $.ajax({
        'async': false,
        type: "POST",
        url: requestUrl,
        dataType: 'json',
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(parse),
        headers: {
          'x-loop-companyid': 8316,
          'Authorization': "Bearer " + authToken
        },
        success: function (data) {
          let history = data.d;
          //console.log(data);
          serviceHistory = history.map(function (a) {
            return [parseInt(a.Mileage.replace(/\,/g, '')), a.LaborLines.map(function (a) {
              return a.OpCode;
            })];
          })
        }
      });
    }
		var inspectionsResults = $("section[id*='inspection-results'] li[id*='result']");
		serviceHistory.each(ro => parseRO(ro));
		fixTireOptions();
		if (data.detail.autoMeasurements) {
			inspectionsResults.each(function (i, element) {
				$(element).find('i.fa-plus-square-o').click(function () {
					$(element).find('custom-fields i.fa-pencil').click();
					if (data.detail.autoCloseMeasurements) {
						var boxes = $(element).find('custom-field-input');
						boxes.each(function (i, box) {
							$(box).find('textarea').eq(0).focusout(async function () {
								//console.log(box);
								var textElement = $(box).find('textarea');
								var measurement = textElement.val();
								$(box).find('i.fa-save').click();
								console.log(measurement);
								console.log(boxes.length);
								if ($(element).find('custom-fields i.fa-pencil').length < boxes.length) {
									do {
										console.log($(document).has(boxes).length);
										if ($(document).has(boxes).length == 0) return;
										var focusedElement = $(document.activeElement);
										if (focusedElement.is('textarea') && boxes.has(focusedElement)) break;
										await new Promise((resolve, reject) => setTimeout(resolve, 10));
										console.count("Waiting for focused element to be in boxes.");
									} while (true);
									console.countReset("Waiting for focused element to be in boxes.");
									console.log("Clicked another element in box");
									console.log(focusedElement);
									focusedElement.val(measurement).select();
									focusedElement.change();
								}
							});
						});
					}
				});
			});
		}
	} catch (e) {
		console.error(e);
	} finally{
  isUpdatePageRunning = false;
  console.log("updatePage event finished");
  }
});


function fixTireOptions() {
	var inspectionElement = $(`section[id*='inspection-results'] li[id*='result'] dd[title*='Front Tires']`).parents("li");
	inspectionElement.find('i.fa-plus-square-o').click(function () {
		$('option[label="Mount & Balance Four Tires"]').attr("label", "Mount & Balance 4 Tires");
		var e = $('option[label="Mount And Balance 3 Tires."]').attr("label", "Mount & Balance 3 Tires");
		e.prev().insertAfter(e);
	});
}

function parseRO(ro) {
	let mileage = parseInt($('div#customer-data dd').eq(8).text().replace(/\,/g, ''));
	let inspectionsResults = $("section[id*='inspection-results'] li[id*='result']");
	for (let opCode of ro[1]) {
		let opInfo = opCodeConverter[opCode]
		if (opInfo === undefined) {
			console.log("opCode: " + opCode + " Unknown");
			continue;
		}
		if (opInfo == -1) continue;
		let inspectionLineIndex = opInfo[0];
		let serviceInterval = opInfo[1];
		let inspectionLine = inspectionsResults.eq(inspectionLineIndex).find("dl.description dd");
		if (inspectionLine.css("color") != 'rgb(0, 0, 0)') continue;
		console.log(inspectionLine);
		let lastService = mileage - ro[0];
		if (lastService > serviceInterval) {
			inspectionLine.css("color", "red");
		} else {
			inspectionLine.css("color", "darkseagreen");
		}
		inspectionLine.mouseenter(function () {
			var $this = $(this);
			$this.attr('title', "This service was performed " + lastService.toLocaleString() + " mile(s) ago.");
		})

	}
}
console.log("Is EV?: " + checkEV());
// Checks if vehicle is an EV, if so will return true;
function checkEV(){
  let ev = $('div#customer-data dd')[3].innerText.includes("Ariya");
  return ev |= $('div#customer-data dd')[3].innerText.includes("Leaf");
  
}


//////////////////////////////////////////////////////////////////////////
// Interaction with service items.
//////////////////////////////////////////////////////////////////////////

document.addEventListener('changeService', function (data) {
  let changeRequests = data.detail;
  console.log(changeRequests);
  changeRequests.forEach((changeRequest)=>{
    if(changeRequest.mPIDescription == "autoGreen"){
      autoGreen();
    }
    else if(changeRequest.mPIDescription == "autoSkip"){
      autoSkip();
    }
    else
    {
    console.log("Not Auto Green");
    setService(changeRequest);
    }
    //await new Promise((resolve, reject) => setTimeout(resolve, 300));
    //console.log(formValuepairs);
    //brow.sendMessage('setService');
    console.log(changeRequest);
  });
});


async function autoGreen(){
  console.log("autoGreen");
  try{
  var inspectionElements = $(`section[id*='inspection-results'] li[id*='result'] dd`).parents("li");
  var notSelectedElements = inspectionElements.filter(function(){return !($(this).find("fancy-checkbox i.fa-check-square-o").length)});
  notSelectedElements.find("fancy-checkbox[additional-classes='green']").each(function(){envokeClick($(this))});
  }catch(e){console.log(e);}
  function envokeClick(jqelement){
    try
    {
      jqelement[0].dispatchEvent(new CustomEvent('click'))
    }catch(e){console.log(e);}
  }
}
async function autoSkip(){
  console.log("autoSkip");
  try{
  var inspectionElements = $(`section[id*='inspection-results'] li[id*='result'] dd`).parents("li");
  var notSelectedElements = inspectionElements.filter(function(){return !($(this).find("fancy-checkbox i.fa-check-square-o").length)});
  notSelectedElements.find("dl.skip fancy-checkbox").each(function(){envokeClick($(this))});
  }catch(e){console.log(e);}
  function envokeClick(jqelement){
    try
    {
      jqelement[0].dispatchEvent(new CustomEvent('click'))
    }catch(e){console.log(e);}
  }
}

async function setService(service){
  var inspectionElement = $(`section[id*='inspection-results'] li[id*='result'] dd[title*='${service.mPIDescription}']`).parents("li");
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