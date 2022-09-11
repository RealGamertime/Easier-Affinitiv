
/* This code is injected inside the html of the current webpage thus breaking out of the "isolated world" put in place on chrome extensions.
 * This is required in order to access the page's functions and variables.
 */

document.addEventListener('info', function (e) {
  var data = e.detail;
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
  document.dispatchEvent(new CustomEvent('injectionComplete'));
});

