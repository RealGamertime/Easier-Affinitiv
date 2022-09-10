
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
   console.log("Adding " + service);
   createServiceElement(service);
 }

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

$("#submit").click(function(e){
  e.preventDefault();
  var formValuepairs = $('#autoFillForm').serializeArray();;

  console.log(formValuepairs);
  
});
