// Create and inject the floating bar
function createFloatingBar() {
    // Add margin transition to body
    const style = document.createElement('style');
    style.textContent = `
        body {
            transition: margin-right 0.3s ease;
        }
    `;
    document.head.appendChild(style);

    const bar = document.createElement('div');
    bar.id = 'textbox-monitor-bar';
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
    const toggleButton = document.createElement('button');
    toggleButton.id = 'textbox-monitor-toggle';
    toggleButton.innerHTML = '◀';
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

    const content = document.createElement('div');
    content.id = 'textbox-content';
    // content.textContent = 'No editable text field selected';

    bar.appendChild(toggleButton);
    bar.appendChild(content);
    document.body.appendChild(bar);

    // Update toggle functionality
    let isOpen = false;
    toggleButton.addEventListener('click', () => {
        console.log('Toggle button clicked!');
        isOpen = !isOpen;
        bar.style.right = isOpen ? '0' : '-200px';
        toggleButton.innerHTML = isOpen ? '▶' : '◀';
        // Add margin to body when panel is open
        document.body.style.marginRight = isOpen ? '200px' : '0';
    });

    const generateButton = document.createElement('button');
    generateButton.id = 'generate-btn';
    generateButton.textContent = 'Optimize Text';
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


    generateButton.addEventListener('click', () => {
        console.log('Green button clicked!');
    });
    content.appendChild(generateButton);

    return content;
}

// Monitor for active element changes
function monitorActiveElement() {
    const contentDiv = createFloatingBar();
    let lastActiveElement = null;
    let isGenerating = false; // Flag to prevent multiple calls

    async function generateResponse(userText) {
        try {
            console.log('Sending text to API:', userText);
            const response = await fetch('https://deep-stable-gorilla.ngrok-free.app/api/optimize_prompt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "prompt": userText
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Received response from API:', data);
            return { success: true, data };
        } catch (error) {
            console.error('API Error:', error);
            return {
                success: false,
                error: 'Failed to generate response. Please try again.'
            };
        } finally {
            isGenerating = false; // Reset flag after response is handled
        }
    }

    function updateContent() {
        const activeElement = document.activeElement;

        // Update lastActiveElement only when focusing on a text field
        if (activeElement &&
            (activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.isContentEditable)) {
            lastActiveElement = activeElement;
        }

        // Use lastActiveElement instead of activeElement for the display

        const currentText = lastActiveElement.value || lastActiveElement.textContent;

        // Add current text display
        var textDisplay = document.getElementById('textdisplay');
        if (!textDisplay) {
            textDisplay = document.createElement('div');
            textDisplay.id = "textdisplay"
            textDisplay.style.marginBottom = '10px';
        }

        if (lastActiveElement) {
            textDisplay.textContent = `Current text: ${currentText}`;
        } else {
            textDisplay.textContent = "No editable text"
        }
        contentDiv.appendChild(textDisplay);

        // Add generate button if not already present
        // Update click event to actually call generateResponse
        var generateButton = document.getElementById("generate-btn");
        generateButton.addEventListener('click', async () => {
            if (isGenerating) return; // Prevent multiple calls
            isGenerating = true; // Set flag to indicate generation in progress

            console.log('Button clicked!');
            generateButton.style.background = '#ff0000';

            // Get current text and call generateResponse
            const currentText = lastActiveElement.value || lastActiveElement.textContent;
            const result = await generateResponse(currentText);

            if (result.success) {
                // Update the text field with the optimized text
                if (lastActiveElement.value !== undefined) {
                    lastActiveElement.value = result.data.optimized_prompt;
                } else {
                    lastActiveElement.textContent = result.data.optimized_prompt;
                }
                console.log('Text optimized successfully:', result.data.optimized_prompt);
            } else {
                console.error('Failed to optimize text:', result.error);
            }

            // Reset button color
            setTimeout(() => {
                generateButton.style.background = '#4CAF50';
            }, 1000);
        });


    }
    // Add editable text area
    const editableDiv = document.createElement('div');
    editableDiv.id = 'editable-area';
    editableDiv.contentEditable = true;
    editableDiv.style.cssText = `
        width: 100%;
        min-height: 100px;
        border: 1px solid #ccc;
        border-radius: 26px;
        padding: .375rem .625rem;
        margin-bottom: 10px;
        overflow-y: auto;
        background: #A9A9A9;
        transition: .15s cubic-bezier(.4,0,.2,1);
        display: flex;
        flex-direction: column;
        gap: .375rem;
    `;

    // Track cursor position and content
    let lastSelection = null;
    editableDiv.addEventListener('keyup', (e) => {
        lastSelection = window.getSelection().getRangeAt(0);
    });

    editableDiv.addEventListener('blur', () => {
        // Save selection before blur
        if (window.getSelection().rangeCount > 0) {
            lastSelection = window.getSelection().getRangeAt(0);
        }
    });

    editableDiv.addEventListener('focus', () => {
        // Restore cursor position on focus
        if (lastSelection) {
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(lastSelection);
        }
    });

    const activeElement = getElementByXpath("/html/body/div[1]/div[1]/main/div[1]/div[1]/div/div[2]/div/div/div/div[4]/form/div");
    activeElement.parentNode.insertBefore(editableDiv, activeElement.nextSibling);
    const testButton = document.createElement('button');
    testButton.id = 'test-btn';
    testButton.textContent = 'Make box gone';
    testButton.style.cssText = `
        margin-top: 10px;
        padding: 5px 10px;
        background: #4CAF50;
        color: blue;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        width: 100%;
    `;
    testButton.addEventListener('click', () => {
        const activeElement = getElementByXpath("/html/body/div[1]/div[1]/main/div[1]/div[1]/div/div[2]/div/div/div/div[4]/form/div");
        activeElement.style.display = 'none';
    });
    const submitButton = getElementByXpath('//*[@id="composer-background"]/div/div[2]/span/button');
    const acceptButton = document.createElement('button');
    acceptButton.id = 'accept-btn';
    acceptButton.textContent = 'Accept Button';
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
    acceptButton.addEventListener('click', () => {
        console.log('Accept button clicked!');
        var new_text = acceptEdit(lastActiveElement.value || lastActiveElement.textContent);
        if (lastActiveElement.value !== undefined) {
            lastActiveElement.value = new_text;
        } else {
            lastActiveElement.textContent = new_text;
        }
    });
    contentDiv.appendChild(acceptButton);
    contentDiv.appendChild(testButton);
    // Listen for focus events on the document
    document.addEventListener('focus', updateContent, true);
    document.addEventListener('input', updateContent, true);
}

function acceptEdit(text) {
    // Patterns for edits, additions, deletions
    const patterns = [
        { type: 'edit', regex: /\[~~(.*?)~~ \*\*(.*?)\*\*\]/g },
        { type: 'addition', regex: /\[\*\*(.*?)\*\*\]/g },
        { type: 'deletion', regex: /\[~~(.*?)~~\]/g }
    ];

    // Find the earliest suggestion
    let earliestMatchIndex = text.length;
    let matchFound = null;
    let matchType = null;

    patterns.forEach(pattern => {
        pattern.regex.lastIndex = 0; // Reset regex index
        let match = pattern.regex.exec(text);
        if (match && match.index < earliestMatchIndex) {
            earliestMatchIndex = match.index;
            matchFound = match;
            matchType = pattern.type;
        }
    });

    if (!matchFound) {
        // No suggestion found, return original text
        return text;
    }

    let startIndex = matchFound.index;
    let matchLength = matchFound[0].length;
    let endIndex = startIndex + matchLength;

    let textBefore = text.substring(0, startIndex);
    let textAfter = text.substring(endIndex);

    switch (matchType) {
        case 'edit':
            let newText = matchFound[2];
            // Replace the suggestion with newText
            return textBefore + newText + textAfter;
        case 'addition':
            let addition = matchFound[1];
            // Insert the addition
            return textBefore + addition + textAfter;
        case 'deletion':
            // Remove the deleted text
            return textBefore + textAfter;
        default:
            return text;
    }
}

function getElementByXpath(path) {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

// Start monitoring
monitorActiveElement(); 

// Please provide a coherent sentence or question that you would likessistanceth.

// [**Ple**]a[**s**]e[** pr**]o[**v**]i[~~fj~~ **de **]a [~~w~~ **coh**]e[~~o;ifwj~~ **rent**] [~~ofijw ofjw~~ **sentenc**]e o[**r quest**]i[**on that you **]w[**ould lik**]e[~~j~~] [~~f~~]a[~~o~~ **ss**]i[**stanc**]e[~~wj~~] [~~foa~~]wi[~~ejf awoi faowiejf aoewij foewijf oweij f~~ **th.**]

// This function doesn't output the expected result when given the following input. Debug it

// Input:  [**Ple**]a[**s**]e[** pr**]o[**v**]i[~~fj~~ **de **]a [~~w~~ **coh**]e[~~o;ifwj~~ **rent**] [~~ofijw ofjw~~ **sentenc**]e o[**r quest**]i[**on that you **]w[**ould lik**]e[~~j~~] [~~f~~]a[~~o~~ **ss**]i[**stanc**]e[~~wj~~] [~~foa~~]wi[~~ejf awoi faowiejf aoewij foewijf oweij f~~ **th.**]

// Expected output after applying multiple times: Please provide a coherent sentence or question that you would like assistance with.

// Actual output: Please provide a coherent sentence or question that you would likessistanceth. 
