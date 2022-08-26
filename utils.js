/**
 * Retrieves Tab from the current webpage.
 * @returns Tab
 */
export async function getActiveTabUrl(){
  let queryOptions = {active: true, currentWindow: true};
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}
/**
 * Retrieves all technicians full name.
 * @param {string} htmlString 
 * @returns {array} Array containing technician's full name
 */
export function getAllTechnicians(htmlString){
  var techs = htmlString.split(`<select name="technicianSelect"`)[1];
  techs = techs.slice(techs.indexOf('>')+1, techs.indexOf("</select>"));
  techs = techs.split(`<option label="`);
  techs = techs.filter(tech=>{return tech.length> 5 && !(tech.includes("><"))})
  .map(tech=>{return tech.split(`\" value`)[0]});
  chrome.storage.sync.set({"availTechs":techs});
  return techs;
}
/**
 * Executes script in current webpage to send all the HTML in a message "getSource".
 * To retrieve message set up an onMessage.addListener then verify action is getSource.
 * @param {tabId} activeTab 
 */
export async function sendTabHTMLMessage(activeTab){
  try{
    chrome.scripting.executeScript({ 
      target: {
        tabId: activeTab.id
      },
        func: ()=>
        {
          
          var s = document.documentElement.outerHTML;
          //alert(s);
          chrome.runtime.sendMessage({action: "getSource", source: s});
        }
      }
    );
    }catch(e){
    alert("Error" + e.message);
    }
}