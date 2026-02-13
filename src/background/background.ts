/// <reference types="chrome" />

// Enable opening the side panel when the extension action icon is clicked
chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

chrome.runtime.onInstalled.addListener(() => {
    console.log('SEOCrates installed.');
});

// Inject content script when tab is updated (page load/reload)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // Only inject when page has finished loading and URL is valid
    if (changeInfo.status === 'complete' && tab.url) {
        // Skip chrome:// and other restricted URLs
        if (tab.url.startsWith('chrome://') || 
            tab.url.startsWith('chrome-extension://') || 
            tab.url.startsWith('about:') ||
            tab.url.startsWith('edge://') ||
            tab.url.startsWith('data:')) {
            return;
        }

        try {
            // Check if content script is already injected
            await chrome.tabs.sendMessage(tabId, { type: 'PING' });
            console.log('SEOCrates: Content script already active on tab', tabId);
        } catch (error) {
            // Content script not found, inject it
            try {
                await chrome.scripting.executeScript({
                    target: { tabId },
                    files: ['content.js']
                });
                console.log('SEOCrates: Content script injected into tab', tabId);
            } catch (injectError) {
                console.error('SEOCrates: Failed to inject content script:', injectError);
            }
        }
    }
});
