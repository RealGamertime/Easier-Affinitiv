
/* This code is injected inside the html of the current webpage thus breaking out of the "isolated world" put in place on chrome extensions.
 * This is required in order to access the page's functions and variables.
 */

document.addEventListener('info', function (e) {
  var data = e.detail;
  if (data.warnUser == null) {
    console.warn("Easier Affinitiv: warnUser has no value, defaulting to warning user.");
    data.warnUser = true;
  }
  console.log('received', data.warnUser);
  if (!data.warnUser) {
    var realConfirm = window.confirm;
    window.confirm = function () {
      window.confirm = realConfirm;
      return true;
    };
  }
  $('#technicianSelect').change();
});

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

