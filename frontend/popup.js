console.log('This is a popup!');

// Function to get active element content
document.addEventListener('DOMContentLoaded', function() {
  // Query the active tab
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    // Execute script in the active tab
    chrome.scripting.executeScript({
      target: {tabId: tabs[0].id},
      function: getActiveElementContent
    }, (results) => {
      // Display results in the popup
      const contentDiv = document.getElementById('textbox-content');
      if (results && results[0].result) {
        contentDiv.textContent = `Current textbox content: ${results[0].result}`;
      } else {
        contentDiv.textContent = 'No editable text field selected';
      }
    });
  });
});

// Function that will be injected into the page
function getActiveElementContent() {
  const activeElement = document.activeElement;
  if (activeElement && 
      (activeElement.tagName === 'INPUT' || 
       activeElement.tagName === 'TEXTAREA' || 
       activeElement.isContentEditable)) {
    return activeElement.value || activeElement.textContent;
  }
  return null;
}