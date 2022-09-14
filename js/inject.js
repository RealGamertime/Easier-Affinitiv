
/* This code is injected inside the html of the current webpage thus breaking out of the "isolated world" put in place on chrome extensions.
 * This is required in order to access the page's functions and variables.
 */

document.addEventListener('info', async function (e) {
  var data = e.detail;
	console.log(e);
  if (data.changeTech) {
    //alert(data.selectedIndex);
	  $('#technicianSelect').get(0).selectedIndex = data.selectedIndex;
	  
	  
	  console.log('received', data.selectedIndex);
	  if (!data.warnUser) {
		var realConfirm = window.confirm;
		window.confirm = function () {
		  window.confirm = realConfirm;
		  return true;
		};
	  }
	  $('#technicianSelect').change();

		console.log("Waiting for ajaxspinner to close");
		do{
			console.log("Waiting!");
			await new Promise((resolve, reject) => setTimeout(resolve, 500));
		}while($('.ajaxSpinner').length);
  }
	

  if(data.statusTracker){
	var scheduledServices = document.getElementById("scheduled-services");
	var statusTrackerContainer = document.getElementById("statusTrackerContainer");
	var inspectionDetails = $('section').eq(0).get(0);
	var dummyNode = statusTrackerContainer.cloneNode(true);
	inspectionDetails.append(dummyNode);

	$(window).scroll(function() {   
		if($(window).scrollTop() > 700) {
			inspectionDetails.prepend(dummyNode);
		   inspectionDetails.append(statusTrackerContainer);  
		}
		else{
			inspectionDetails.insertBefore(statusTrackerContainer,scheduledServices);
			inspectionDetails.append(dummyNode);

		}
	});
  }
	fixTireOptions();
  document.dispatchEvent(new CustomEvent('injectionComplete'));
});
document.addEventListener('autoMeasure', function (data) {
	let inspectionsResults = $("li[id*='-ed11-8379-00155dbf760b'][id*='result']");
	inspectionsResults.each((i,element)=>{
		$(element).find('i.fa-plus-square-o').click(()=> {
			$(element).find('custom-fields i.fa-pencil').click();
		if(data.detail.autoCloseMeasurements){
			var boxes = $(element).find('custom-field-input');
			boxes.each((i, box)=>{
				$(box).find('textarea').eq(0).focusout(()=>{ 
					//console.log(box);
					var textElement = $(box).find('textarea');
					var measurement = textElement.val();
					$(box).find('i.fa-save').click();
					var boxAhead = $(boxes.get(i+1)).find('textarea');
					console.log(boxAhead);
					$(boxAhead).val(measurement).select();
					$(boxAhead).change();
			});
			});
		}
		});
	});
});


function fixTireOptions(){
	var inspectionElement = $(`li[id*='-ed11-8379-00155dbf760b'][id*='result'] dd[title*='Front Tires']`).parents("li");
	inspectionElement.find('i.fa-plus-square-o').click(function(){
			$('option[label="Mount & Balance Four Tires"]').attr("label","Mount & Balance 4 Tires");
			var e = $('option[label="Mount And Balance 3 Tires."]').attr("label","Mount & Balance 3 Tires");
			e.prev().insertAfter(e);
	});
}