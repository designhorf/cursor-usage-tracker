// content.js - Extracts data from Cursor dashboard
console.log('Cursor Usage Tracker: Content script loaded');

function extractCursorData() {
  const data = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    extracted: false
  };

  try {
    if (window.location.href.includes('cursor.com')) {
      const planElements = document.querySelectorAll('[class*="plan"], [class*="subscription"], [data-testid*="plan"]');
      planElements.forEach(el => {
        const text = el.textContent.toLowerCase();
        if (text.includes('pro') || text.includes('business') || text.includes('free')) {
          data.plan = {
            name: el.textContent.trim(),
            element: el.className
          };
        }
      });

      const usageElements = document.querySelectorAll('[class*="usage"], [class*="billing"], [class*="token"], [class*="request"]');
      data.usageElements = [];
      
      usageElements.forEach(el => {
        const text = el.textContent.trim();
        if (text && (text.includes('$') || text.includes('token') || text.includes('request') || /\d+/.test(text))) {
          data.usageElements.push({
            text: text,
            className: el.className,
            tagName: el.tagName
          });
        }
      });

      const bodyText = document.body.innerText;
      
      const dollarMatches = bodyText.match(/\$[\d,]+\.?\d*/g);
      if (dollarMatches) {
        data.dollarAmounts = dollarMatches;
      }

      const tokenMatches = bodyText.match(/[\d,]+\s*tokens?/gi);
      if (tokenMatches) {
        data.tokenCounts = tokenMatches;
      }

      const requestMatches = bodyText.match(/[\d,]+\s*requests?/gi);
      if (requestMatches) {
        data.requestCounts = requestMatches;
      }

      const progressElements = document.querySelectorAll('[role="progressbar"], [class*="progress"], [class*="percentage"]');
      data.progressData = [];
      progressElements.forEach(el => {
        const value = el.getAttribute('aria-valuenow') || el.getAttribute('value');
        const max = el.getAttribute('aria-valuemax') || el.getAttribute('max');
        if (value && max) {
          data.progressData.push({
            value: parseInt(value),
            max: parseInt(max),
            percentage: Math.round((parseInt(value) / parseInt(max)) * 100)
          });
        }
      });

      const tables = document.querySelectorAll('table');
      data.tableData = [];
      tables.forEach(table => {
        const rows = Array.from(table.querySelectorAll('tr')).map(row => 
          Array.from(row.cells).map(cell => cell.textContent.trim())
        );
        if (rows.length > 0) {
          data.tableData.push(rows);
        }
      });

      data.extracted = true;
      console.log('Cursor Usage Tracker: Data extracted successfully', data);
    }
  } catch (error) {
    console.error('Cursor Usage Tracker: Error extracting data', error);
    data.error = error.message;
  }

  return data;
}

function sendDataToExtension() {
  const extractedData = extractCursorData();
  
  chrome.runtime.sendMessage({
    action: 'dataExtracted',
    data: extractedData
  });

  chrome.storage.local.set({
    cursorData: extractedData,
    lastUpdated: new Date().toISOString()
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', sendDataToExtension);
} else {
  sendDataToExtension();
}

const observer = new MutationObserver((mutations) => {
  let shouldUpdate = false;
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      shouldUpdate = true;
    }
  });
  
  if (shouldUpdate) {
    setTimeout(sendDataToExtension, 2000);
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractData') {
    const data = extractCursorData();
    sendResponse(data);
  }
});