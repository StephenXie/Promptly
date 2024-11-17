const tabHintLabel = document.createElement("span");
tabHintLabel.id = "tab-hint";
tabHintLabel.style.cssText = `
    font-size: 12px;
    color: #6B7280;
    margin-left: 4px;
    margin-right: 4px;
  `;
tabHintLabel.contentEditable = false;
tabHintLabel.style.userSelect = "none";
tabHintLabel.textContent = "Press Tab ⇥ to accept";
// Import CSS
const link = document.createElement("link");
link.rel = "stylesheet";
link.type = "text/css";
link.href = chrome.runtime.getURL("promptly.css");
document.head.appendChild(link);

// Monitor for active element changes
function monitorActiveElement() {
  const contentDiv = createFloatingBar();
  let lastActiveElement = null;
  let isGenerating = false; // Flag to prevent multiple calls

  const ogTextboxParent = getElementByXpath(
    '//*[@id="composer-background"]/div[1]/div/div'
  );
  const ogTextarea = getElementByXpath(
    '//*[@id="composer-background"]/div[1]/div/div[1]/textarea'
  );
  const ogTextbox = getElementByXpath('//*[@id="prompt-textarea"]');
  const userTextboxParent = ogTextboxParent.cloneNode(true);
  ogTextboxParent.style.display = "none";
  userTextboxParent.id = "optimized-textboxparent";
  userTextboxParent.innerHTML =
    '<textarea class="block h-10 w-full resize-none border-0 bg-transparent px-0 py-2 text-token-text-primary placeholder:text-token-text-secondary" placeholder="Message ChatGPT" style="display: none;" id="optimized-textboxarea"></textarea>';
  userTextboxParent.innerHTML +=
    '<script nonce="">window.__oai_logHTML?window.__oai_logHTML():window.__oai_SSR_HTML=window.__oai_SSR_HTML||Date.now();requestAnimationFrame((function(){window.__oai_logTTI?window.__oai_logTTI():window.__oai_SSR_TTI=window.__oai_SSR_TTI||Date.now()}))</script>';
  userTextboxParent.innerHTML +=
    '<div contenteditable="true" translate="no" class="ProseMirror ProseMirror-focused" id="optimized-textbox" spellcheck="false" data-placeholder="Message ChatGPT..."></div>';
  ogTextboxParent.parentNode.insertBefore(
    userTextboxParent,
    ogTextboxParent.nextSibling
  );
  const userTextbox = document.getElementById("optimized-textbox");
  //   userTextbox.innerHTML = "Type here...";
  var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (userTextbox.textContent == "") {
        userTextbox.innerHTML = "";
      }
    });
  });
  var config = { attributes: true, childList: true, characterData: true };
  observer.observe(userTextbox, config);
  function updateContent() {
    const activeElement = document.activeElement;

    // Update lastActiveElement only when focusing on a text field
    if (
      activeElement &&
      (activeElement.tagName === "INPUT" ||
        activeElement.tagName === "TEXTAREA" ||
        activeElement.isContentEditable)
    ) {
      lastActiveElement = activeElement;
    }
    // Use lastActiveElement instead of activeElement for the display
    const currentText = userTextbox.innerHTML;

    // Add current text display
    var textDisplay = document.getElementById("textdisplay");
    if (!textDisplay) {
      textDisplay = document.createElement("div");
      textDisplay.id = "textdisplay";
      textDisplay.style.marginBottom = "10px";
    }

    textDisplay.textContent = `Current text: ${currentText}`;
    contentDiv.appendChild(textDisplay);

    // Add generate button if not already present
    // Update click event to actually call generateResponse
    var generateButton = document.getElementById("generate-btn");
    if (generateButton) {
      generateButton.addEventListener("click", async () => {
        if (isGenerating) return; // Prevent multiple calls
        isGenerating = true; // Set flag to indicate generation in progress

        console.log("Button clicked!");
        generateButton.style.background = "#ff0000";

        // Get current text and call generateResponse
        const currentText =
          lastActiveElement.value || lastActiveElement.textContent;
        const result = await generateResponse(currentText);
        if (result.success) {
          // Update the text field with the optimized text
          const optimizedHTML = convertToHTML(result.data.optimized_prompt);

          userTextbox.innerHTML = optimizedHTML;

          console.log(
            "Text optimized successfully:",
            result.data.optimized_prompt
          );
        } else {
          console.error("Failed to optimize text:", result.error);
        }

        // Reset button color
        setTimeout(() => {
          generateButton.style.background = "#4CAF50";
        }, 1000);
      });
    }
  }
  // Start Generation Here
  // Add editable text area

  const acceptButton = document.createElement("button");
  acceptButton.id = "accept-btn";
  acceptButton.textContent = "Accept Button";
  acceptButton.style.cssText = `
        margin-top: 10px;
        padding: 5px 10px;
        background: #4CAF50;
        color: blue;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        width: 100%;
    `;
  acceptButton.addEventListener("click", () => {
    console.log("Accept button clicked!");
    // Find the first edit by looking for spans with numeric IDs
  });
  const autocompleteButton = document.createElement("button");
  autocompleteButton.id = "autocomplete-btn";
  autocompleteButton.textContent = "Autocomplete: On";
  autocompleteButton.style.cssText = `
        margin-top: 10px;
        padding: 5px 10px;
        background: #4CAF50;
        color: blue;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        width: 100%;
    `;

  let autocompleteEnabled = true;
  let typingTimer;

  autocompleteButton.addEventListener("click", () => {
    autocompleteEnabled = !autocompleteEnabled;
    autocompleteButton.textContent = `Autocomplete: ${
      autocompleteEnabled ? "On" : "Off"
    }`;
  });

  contentDiv.appendChild(acceptButton);
  contentDiv.appendChild(autocompleteButton);
  // Listen for focus events on the document
  document.addEventListener("focus", updateContent, true);

  // Add autocomplete toggle button

  // Add minimal tab hint label

  // Add input handler for autocomplete
  document.addEventListener("input", (e) => {
    if (!autocompleteEnabled) {
      return;
    }

    // Clear the existing timer
    clearTimeout(typingTimer);
    var text = userTextbox.textContent;
    if (ogTextbox) {
      ogTextbox.textContent = text;
    }
    if (text.trim() == "") {
      return;
    }
    // Start a new timer
    typingTimer = setTimeout(() => {
      generateResponse(text).then((response) => {
        userTextbox.innerHTML = convertToHTML(response.data.optimized_prompt);
        ogTextbox.textContent = userTextbox.textContent;
      });
    }, 2000); // 2 second delay
  });

  // Add tab key handler
  document.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      userTextbox.innerHTML = acceptFirstEdit(userTextbox.innerHTML);
      // Clean the text by removing tab hint label and other elements
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = userTextbox.innerHTML;
      const tabhint = tempDiv.querySelector('[id="tab-hint"]');
      if (tabhint) tabhint.remove();
      if (ogTextbox) {
        ogTextbox.textContent = tempDiv.textContent;
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      // Don't submit if the textbox only contains the placeholder text
      if (userTextbox.innerHTML === "Type here...") {
        return;
      }
      const submitButton = document.querySelector(
        'button[data-testid="send-button"]'
      );
      if (submitButton) {
        // Clear the textbox before submitting to prevent double-sends
        userTextbox.innerHTML = "";
        submitButton.click();
      } else {
        console.log("Submit button not found");
      }
    }
  });
}

const observer = new MutationObserver((mutations) => {
  var x = document.getElementById("optimized-textbox");
  if (!x) {
    monitorActiveElement();
  }
});

// Start observing just the chat input area for changes
observer.observe(document.body, {
  childList: true,
  subtree: true,
});
async function generateResponse(userText) {
  try {
    console.log("Sending text to API:", userText);
    const response = await fetch(
      "https://deep-stable-gorilla.ngrok-free.app/api/optimize_prompt",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: userText,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Received response from API:", data);
    return { success: true, data };
  } catch (error) {
    console.error("API Error:", error);
    return {
      success: false,
      error: "Failed to generate response. Please try again.",
    };
  } finally {
    isGenerating = false; // Reset flag after response is handled
  }
}
