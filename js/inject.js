/* This code is injected inside the html of the current webpage thus breaking out of the "isolated world" put in place on chrome extensions.
 * This is required in order to access the page's functions and variables.
 */
var hasPageUpdated = false;

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

document.addEventListener('pageUpdated', function () {
	hasPageUpdated = true;
	console.log("PAGE UPDATED");
});

document.addEventListener('info', async function (e) {
	try {
		var data = e.detail;
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
		if (data.changeTech && $('#technicianSelect').get(0).selectedIndex != data.selectedIndex) {
			//alert(data.selectedIndex);
			var techSelect = document.querySelector('#technicianSelect');
			techSelect.selectedIndex = data.selectedIndex;


			console.log('received', data.selectedIndex);
			if (!data.warnUser) {
				var realConfirm = window.confirm;
				window.confirm = function () {
					window.confirm = realConfirm;
					return true;
				};
			}
			techSelect.dispatchEvent(new CustomEvent('change'));
		}
		document.dispatchEvent(new CustomEvent('injectionComplete'));
	} catch (e) {
		console.error(e);
	}
});



document.addEventListener('updatePage', function (data) {
	try {
		var authToken = localStorage.getItem("autoLoopApiAuthToken");
		var requestUrl = "https://autoloop.us/dms/app/Schedule/Details.aspx/GetVehicleHistory";
		var vin = $('div#customer-data dd').eq(4).text().replace(/\s/g, '');
		var output = null;
		var ajaxData = {
			"vin": vin
		};
		// send the request
		$.ajax({
			'async': false,
			type: "POST",
			url: requestUrl,
			dataType: 'json',
			contentType: "application/json; charset=utf-8",
			data: JSON.stringify(ajaxData),
			headers: {
				'x-loop-companyid': 8316,
				'Authorization': "Bearer " + authToken
			},
			success: function (data) {
				let history = data.d;
				//console.log(data);
				let serviceHistory = history.map(function (a) {
					return [parseInt(a.Mileage.replace(/\,/g, '')), a.LaborLines.map(function (a) {
						return a.OpCode;
					})];
				})
				//console.log(serviceHistory);
				output = serviceHistory;
			}
		});
		var inspectionsResults = $("li[id*='-ed11-8379-00155dbf760b'][id*='result']");
		output.each(ro => parseRO(ro));
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
	}
});


function fixTireOptions() {
	var inspectionElement = $(`li[id*='-ed11-8379-00155dbf760b'][id*='result'] dd[title*='Front Tires']`).parents("li");
	inspectionElement.find('i.fa-plus-square-o').click(function () {
		$('option[label="Mount & Balance Four Tires"]').attr("label", "Mount & Balance 4 Tires");
		var e = $('option[label="Mount And Balance 3 Tires."]').attr("label", "Mount & Balance 3 Tires");
		e.prev().insertAfter(e);
	});
}

function parseRO(ro) {
	let mileage = parseInt($('div#customer-data dd').eq(8).text().replace(/\,/g, ''));
	let inspectionsResults = $("li[id*='-ed11-8379-00155dbf760b'][id*='result']");
	for (let opCode of ro[1]) {
		let opInfo = opCodeConverter[opCode]
		if (opInfo === undefined) {
			console.log("opCode: " + opCode + " Unknown");
			continue;
		} else if (opInfo == -1) continue;
		else{
			console.log("opInfo: " + opCode + " : " + opInfo);
		}
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