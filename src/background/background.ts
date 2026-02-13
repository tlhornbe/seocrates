/// <reference types="chrome" />

// Enable opening the side panel when the extension action icon is clicked
chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

chrome.runtime.onInstalled.addListener(() => {
    console.log('SEOCrates installed.');
});
