// popup.js - Simple working popup
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('open-dashboard').addEventListener('click', openDashboard);
    document.getElementById('extract-data').addEventListener('click', extractData);
}

async function openDashboard() {
    try {
        await chrome.runtime.sendMessage({ action: 'openDashboard' });
        window.close();
    } catch (error) {
        console.error('Error opening dashboard:', error);
    }
}

async function extractData() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab.url.includes('cursor.com')) {
            document.getElementById('status').textContent = '❌ Please visit cursor.com';
            return;
        }

        document.getElementById('status').textContent = '🔄 Extracting...';

        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: extractCursorDataFromPage
        });

        if (results[0].result) {
            await chrome.storage.local.set({
                cursorData: results[0].result,
                lastUpdated: new Date().toISOString()
            });
            document.getElementById('status').textContent = '✅ Data extracted!';
        }
        
    } catch (error) {
        console.error('Error extracting data:', error);
        document.getElementById('status').textContent = '❌ Extraction failed';
    }
}

function extractCursorDataFromPage() {
    const data = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        extracted: false
    };

    try {
        const bodyText = document.body.innerText;
        
        if (bodyText.includes('Pro Plan')) {
            data.plan = 'Pro Plan';
        }

        const dollarMatches = bodyText.match(/\$[\d,]+\.?\d*/g);
        if (dollarMatches) {
            data.dollarAmounts = dollarMatches;
        }

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
        return data;

    } catch (error) {
        console.error('Error extracting data:', error);
        data.error = error.message;
        return data;
    }
}