// background.js - Professional window management
let dashboardWindowId = null;

// Listen for extension icon clicks
chrome.action.onClicked.addListener(async (tab) => {
    await openDashboard(tab);
});

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === 'openDashboard') {
        await openDashboard();
        sendResponse({ success: true });
    } else if (request.action === 'dataExtracted') {
        console.log('Background: Received extracted data', request.data);
        
        // Store the data
        await chrome.storage.local.set({
            cursorData: request.data,
            lastUpdated: new Date().toISOString()
        });
        
        // Update dashboard if open
        if (dashboardWindowId) {
            try {
                await chrome.tabs.sendMessage(dashboardWindowId, {
                    action: 'updateDashboard',
                    data: request.data
                });
            } catch (error) {
                console.log('Dashboard window not available for update');
            }
        }
        
        // Show success badge
        if (request.data.extracted) {
            chrome.action.setBadgeText({
                text: '✓',
                tabId: sender.tab?.id
            });
            chrome.action.setBadgeBackgroundColor({
                color: '#4ade80'
            });
        }
    }
});

async function openDashboard(currentTab = null) {
    try {
        // Check if dashboard window is already open
        if (dashboardWindowId) {
            try {
                const window = await chrome.windows.get(dashboardWindowId);
                // Focus existing window
                await chrome.windows.update(dashboardWindowId, { focused: true });
                return;
            } catch (error) {
                // Window was closed, reset the ID
                dashboardWindowId = null;
            }
        }

        // Create new dashboard window
        const window = await chrome.windows.create({
            url: chrome.runtime.getURL('dashboard.html'),
            type: 'popup',
            width: 900,
            height: 700,
            focused: true
        });

        dashboardWindowId = window.id;

        // Listen for window close
        chrome.windows.onRemoved.addListener((windowId) => {
            if (windowId === dashboardWindowId) {
                dashboardWindowId = null;
            }
        });

    } catch (error) {
        console.error('Error opening dashboard:', error);
    }
}

// Clear badge when tab changes
chrome.tabs.onActivated.addListener(() => {
    chrome.action.setBadgeText({ text: '' });
});

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('Cursor Usage Tracker installed');
    }
});