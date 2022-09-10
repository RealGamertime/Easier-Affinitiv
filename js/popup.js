import "/js/jquery-3.6.0.min.js";

const debugLoadAutofill = false;

const initInputIds = ['autoTech','selectedAct','selectedConf', 'statusTracker', 'autoCloseMeasurements','autoMeasurements'];

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

if(debugLoadAutofill) window.location.href = './autofill.html';

document.addEventListener("DOMContentLoaded", async () =>{
	chrome.storage.sync.get(null, async (data) =>{
		if(Object.keys(data).length === 0){
      //Initilizing settings
      // console.log("No data, importing default settings.");
      chrome.storage.sync.set(settings);
		}
		else{
			// console.log(data);
			// console.log("Begin: Settings");
			for(let prop in data)
			{
				if (settings.hasOwnProperty(prop)) {
					settings[prop] = data[prop];
					// console.log(prop + ": " + data[prop]);
				}
				else{
					// console.info(prop + " is not in settings... removing.");
					chrome.storage.sync.remove(prop);
				}
			}
			// console.log("End: Settings");
		}
		
		main();
	});
});
$(':checkbox').on('change', event =>{
	console.log(event);
	updateDropDownAccess(event);
	chrome.storage.sync.set({[event.target.id]:event.target.checked});

	
});

$('#autoFillPage').click(function(){
	window.location.href = './autofill.html';
});

function updateDropDownAccess(event) {
	if(typeof event != "undefined")
	{
		if ($(event.target).parents(".dropDownOpen").length) {
			let optionElement = $(event.target.closest(".option"));
			var options = optionElement.find(".dropDownOptions");
			var childElements = options.find("*");
			var isDisabled = !event.target.checked;
			options.toggleClass( "disabled", isDisabled);
			childElements.prop( "disabled", isDisabled);
		}
	}
	else
	{
		$(".option").each(async function(){
			let button = $(this).find(".dropDownOpen input");
			if(button.length){
				let options = $(this).find(".dropDownOptions");
				let childElements = options.find("*");
				let isDisabled = !settings[button[0].id];
				options.toggleClass( "disabled", isDisabled);
				childElements.prop( "disabled", isDisabled);
			}
		});
	}
}

$('select.optionSelection').on('change', event =>{
	chrome.storage.sync.set({[event.target.id]:event.target.value});
});
document.querySelectorAll(".dropDownOpen").forEach(element=>{
	// console.log(element);
	element.addEventListener("click", function(event){
		let clickedElementType = event.target.tagName.toLowerCase();
		let optionElement = event.target.closest(".option");
		// console.log(clickedElementType);
		if(clickedElementType != 'input' && clickedElementType != 'span' && event.target.className != 'toggle'){
			let dropDownOptions = optionElement.getElementsByClassName("dropDownOptions")[0];
			// console.log(dropDownOptions);
			let arrow = optionElement.getElementsByClassName("arrow")[0];
			if(dropDownOptions.style.display == ''){
				dropDownOptions.style.display = 'block';
				arrow.classList.add('arrowUp');
				arrow.classList.remove('arrowDown');
			}
			else{
				dropDownOptions.style.display = '';
				arrow.classList.add('arrowDown');
				arrow.classList.remove('arrowUp');
			}
		}
		// console.log(event);
	});
});

function main(){
	var techs = settings.availTechs;
	initSettings(techs);
}

function loadTechOptions(techs){
	techs.forEach((tech, index)=>{
		var techOption = document.createElement("option");
		techOption.innerText = tech;
		techOption.id = index;
		var techSelectionClass = document.getElementById("selectedTech");
		techSelectionClass.appendChild(techOption);
	});
}
function initSettings(techs){
	updateDropDownAccess();
	for (var id of initInputIds)
	{
	try{
		var element = $(`#${id}`); // String manipulation by adding # at begining of id.
		var elementType = element.get(0).tagName;
		if(elementType === 'INPUT'){
			element[0].checked = settings[id];
		} else if(elementType === 'SELECT'){
			element[0].selectedIndex = settings[id];
		} else{
			throw new Error(`'${elementType}' is not a user input id.`);
		}
	}catch(e){
		console.warn(`Unable to initilize tag id '${id}'. It is either an invalid id or not an valid input type. \n ${e.message}`);
	}
	}
	loadTechOptions(techs);
	if(techs.includes(settings.selectedTech)){
		// console.log("Selected tech exists.");
		$('#selectedTech')[0].value =settings.selectedTech;
	}
	else{
		console.warn(`Selected Technician: ${settings.selectedTech} does not exist.`);
	}
}