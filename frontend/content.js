// Create and inject the floating bar
function createFloatingBar() {
    const bar = document.createElement('div');
    bar.id = 'textbox-monitor-bar';
    bar.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background-color: #333;
        color: white;
        padding: 10px;
        font-family: Arial, sans-serif;
        z-index: 10000;
        box-shadow: 0 -2px 5px rgba(0,0,0,0.2);
    `;
    
    const content = document.createElement('div');
    content.id = 'textbox-content';
    content.textContent = 'No editable text field selected';
    bar.appendChild(content);
    
    document.body.appendChild(bar);
    return content;
}

// Monitor for active element changes
function monitorActiveElement() {
    const contentDiv = createFloatingBar();
    
    // Function to update content
    function updateContent() {
        const activeElement = document.activeElement;
        if (activeElement && 
            (activeElement.tagName === 'INPUT' || 
             activeElement.tagName === 'TEXTAREA' || 
             activeElement.isContentEditable)) {
            contentDiv.textContent = `Current textbox content: ${activeElement.value || activeElement.textContent}`;
        } else {
            contentDiv.textContent = 'No editable text field selected';
        }
    }

    // Listen for focus events on the document
    document.addEventListener('focus', updateContent, true);
    document.addEventListener('input', updateContent, true);
}

// Start monitoring
monitorActiveElement(); 