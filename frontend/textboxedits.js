window.convertToHTML = function(text) {
    const patterns = [
      {
        type: "deletion",
        regex: /\[~~((?:(?!\[~~|@@]).)*)~~\]/, // Matches [~~...~~] where ... does not contain [~~ or @@]
      },
      {
        type: "addition", 
        regex: /\[@@((?:(?!\[~~|@@]).)*)\@@\]/, // Matches [@@...@@] where ... does not contain [~~ or @@]
      },
      {
        type: "edit",
        regex: /\[~~((?:(?!\[~~|@@]).)*)~~ @@((?:(?!\[~~|@@]).)*)\@@\]/, // Matches [~~...~~ @@...@@] where neither ... contains [~~ or @@]
      },
    ];
    // Use a loop to process all markers until none are left
    let prevText;
    let count = 0;
    let tabHintLabelAdded = false;
    do {
      prevText = text;
      let deleteId, addId, editId;
      // For each pattern in patterns array
      patterns.forEach((pattern) => {
        const match = text.match(pattern.regex);
        if (match) {
          const index = match.index;
          switch (pattern.type) {
            case "deletion":
              deleteId = index;
              break;
            case "addition":
              addId = index;
              break;
            case "edit":
              editId = index;
              break;
          }
        }
      });
      // Find the pattern with the earliest occurrence
      let minIndex = Infinity;
      let selectedPattern = null;
  
      if (deleteId !== undefined && deleteId < minIndex) {
        minIndex = deleteId;
        selectedPattern = patterns[0]; // deletion pattern
      }
      if (addId !== undefined && addId < minIndex) {
        minIndex = addId;
        selectedPattern = patterns[1]; // addition pattern
      }
      if (editId !== undefined && editId < minIndex) {
        minIndex = editId;
        selectedPattern = patterns[2]; // edit pattern
      }
  
      // If no patterns were found, break the loop
      if (!selectedPattern) {
        break;
      }
  
      pattern = selectedPattern;
  
      text = text.replace(pattern.regex, function () {
        const args = Array.from(arguments);
        const p1 = args[1]; // first capture group
        const p2 = args[2]; // second capture group (if any)
        let replacement;
  
        switch (pattern.type) {
          case "deletion":
            replacement =
              '<span style="color: #FFFFFF; opacity: 0.8; background-color: #511C22; " id="' +
              count +
              'o">' +
              p1 +
              "</span>";
            if (!tabHintLabelAdded) {
              replacement += tabHintLabel.outerHTML;
              tabHintLabelAdded = true;
            }
            return replacement;
          case "addition":
            replacement =
              '<span style="color: #FFFFFF; background-color: #296227;" id="' +
              count +
              'n">' +
              p1 +
              "</span>";
            if (!tabHintLabelAdded) {
              replacement += tabHintLabel.outerHTML;
              tabHintLabelAdded = true;
            }
            return replacement;
          case "edit":
            replacement =
              '<span style="color: #FFFFFF; opacity: 0.8; background-color: #511C22; " id="' +
              count +
              'o">' +
              p1 +
              "</span>" +
              '<span style="color: #FFFFFF; background-color: #296227;" id="' +
              count +
              'n">' +
              p2 +
              "</span>";
            if (!tabHintLabelAdded) {
              replacement += tabHintLabel.outerHTML;
              tabHintLabelAdded = true;
            }
            return replacement;
  
          default:
            return args[0];
        }
      });
      count += 1;
    } while (prevText !== text); // Continue until no changes are made
  
    return text;
  }
  
  window.findNextSpan = function(element) {
    const spans = element.getElementsByTagName("span");
    let firstEditId = null;
    for (const span of spans) {
      const id = span.id;
      // Check if ID ends with 'o' or 'n' and remove that suffix
      if (id.endsWith("o") || id.endsWith("n")) {
        const numericId = id.slice(0, -1);
        if (!isNaN(numericId) && Number.isInteger(Number(numericId))) {
          firstEditId = id;
          break;
        }
      }
    }
    return firstEditId;
  }
  
  window.acceptFirstEdit = function(html) {
    let element = html;
    if (typeof html === "string") {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      element = doc.body;
    }
    const firstEditId = findNextSpan(element);
    if (firstEditId) {
      const firstEditNumericalId = Number(firstEditId.slice(0, -1));
      return acceptEdit(html, firstEditNumericalId);
    }
    return html;
  }
  window.acceptEdit = function(html, n) {
    let element = html;
    if (typeof html === "string") {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      element = doc.body;
    }
    // Remove existing tab hint if present
    const existingTabHint = element.querySelector('[id="tab-hint"]');
    if (existingTabHint) {
      existingTabHint.remove();
    }
    // Convert html string to DOM element if needed
  
    // Get the old and new spans for this edit number
    // Escape the number in the selector to handle numbers starting with digits
    const oldSpan = element.querySelector(`[id="${n}o"]`);
    const newSpan = element.querySelector(`[id="${n}n"]`);
  
    // Handle case where spans aren't found
    if (!oldSpan && !newSpan) {
      return element.outerHTML;
    }
    var nextId;
    // Handle deletion case (only oldSpan exists)
    if (oldSpan && !newSpan) {
      oldSpan.remove();
      nextId = findNextSpan(element);
      if (nextId) {
        const nextSpan = element.querySelector(`[id="${nextId}"]`);
        if (nextSpan) {
          nextSpan.parentNode.insertBefore(tabHintLabel, nextSpan.nextSibling);
        }
      }
      return element.outerHTML;
    }
  
    // Handle addition case (only newSpan exists)
    if (!oldSpan && newSpan) {
      const newText = newSpan.textContent;
      newSpan.style = "";
      newSpan.id = "";
      newSpan.innerHTML = newText.replaceAll("\\n", "<br/>");
      nextId = findNextSpan(element);
      if (nextId) {
        const nextSpan = element.querySelector(`[id="${nextId}"]`);
        if (nextSpan) {
          nextSpan.parentNode.insertBefore(tabHintLabel, nextSpan.nextSibling);
        }
      }
      return element.outerHTML;
    }
  
    // Handle edit case (both spans exist)
    oldSpan.remove();
    const newText = newSpan.textContent;
    newSpan.style = "";
    newSpan.id = "";
    newSpan.innerHTML = newText.replaceAll("\\n", "<br/>");
    nextId = findNextSpan(element);
    if (nextId) {
      const nextSpan = element.querySelector(`[id="${nextId}"]`);
      if (nextSpan) {
        nextSpan.parentNode.insertBefore(tabHintLabel, nextSpan.nextSibling);
      }
    }
    return element.outerHTML;
  }