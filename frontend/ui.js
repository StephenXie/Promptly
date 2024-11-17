window.createFloatingBar = function() {
    // Add margin transition to body
    const style = document.createElement("style");
    style.textContent = `
          body {
              transition: margin-right 0.3s ease;
          }
      `;
    document.head.appendChild(style);
  
    const bar = document.createElement("div");
    bar.id = "textbox-monitor-bar";
    bar.style.cssText = `
          position: fixed;
          top: 0;
          right: -200px; /* Reduced from 250px to account for button */
          width: 200px; /* Reduced from 250px */
          height: 100%;
          background-color: #f0f0f0; /* Changed to light grey */
          color: #333; /* Changed to dark grey */
          padding: 10px;
          font-family: 'Helvetica Neue', sans-serif; /* Changed to a more modern font */
          z-index: 10000;
          box-shadow: -2px 0 5px rgba(0,0,0,0.2);
          transition: right 0.3s ease;
      `;
  
    // Add toggle button
    const toggleButton = document.createElement("button");
    toggleButton.id = "textbox-monitor-toggle";
    toggleButton.innerHTML = "◀";
    toggleButton.style.cssText = `
          position: absolute;
          left: -30px;
          top: 50%;
          transform: translateY(-50%);
          background: #333;
          color: white;
          border: none;
          padding: 8px;
          cursor: pointer;
          border-radius: 4px 0 0 4px;
      `;
  
    const content = document.createElement("div");
    content.id = "textbox-content";
    // content.textContent = 'No editable text field selected';
  
    bar.appendChild(toggleButton);
    bar.appendChild(content);
    document.body.appendChild(bar);
  
    // Update toggle functionality
    let isOpen = false;
    toggleButton.addEventListener("click", () => {
      console.log("Toggle button clicked!");
      isOpen = !isOpen;
      bar.style.right = isOpen ? "0" : "-200px";
      toggleButton.innerHTML = isOpen ? "▶" : "◀";
      // Add margin to body when panel is open
      document.body.style.marginRight = isOpen ? "200px" : "0";
    });
  
    const generateButton = document.createElement("button");
    generateButton.id = "generate-btn";
    generateButton.textContent = "Optimize Text";
    generateButton.style.cssText = `
          margin-top: 10px;
          padding: 5px 10px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          width: 100%;
      `;
  
    generateButton.addEventListener("click", () => {
      console.log("Green button clicked!");
    });
    content.appendChild(generateButton);
  
    return content;
  }