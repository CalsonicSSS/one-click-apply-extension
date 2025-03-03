// Background script for side panel management
// background script in Chrome extensions is a single global instance that runs in the background of the whole browser
// There is only ONE instance of this background script running, not one per tab. It persists for the entire browser session while your extension is enabled
// Think of it as a "control tower" that can see and manage all tabs

// we are making the side panel feature to be tab specific instead of globally persistent
// we remove the {side_panel default_path} in the manifest setting at root level, which will be available across all tabs, overrides code to manage panels per-tab
// use the chrome.sidePanel.setOptions() API, you can control which pages/tabs the panel appears on.
export {};

// chrome.action refers to the extension's browser action (toolbar icon) | onClicked is an event triggered when the user clicks the extension icon.
// The callback function receives the currently active tab (tab) as an argument. includes the id of the active tab
// this becomes tab specific management now
chrome.action.onClicked.addListener((tab) => {
	if (!tab?.id) return;

	try {
		// chrome.sidePanel.setOptions() is a tab-specific API
		// Chrome internally centralizes and tracks the side panel state for all tabs as long as the browser is running (This happens at the browser level)
		// Maintains which tabs have panels enabled/disabled + Tracks panel configuration + Cleans up state when tabs are closed (at all time)
		chrome.sidePanel.setOptions({
			tabId: tab.id, // Enable side panel only for this tab
			path: 'sidepanel.html', // Defines the content (path) that will be displayed in side panel
			enabled: true, // Ensures the side panel is enabled for this tab
		});

		// also a tab-specific API for actually open side panel, you have to first use chrome.sidePanel.setOptions to setup before chrome.sidePanel.open
		chrome.sidePanel.open({ tabId: tab.id });
	} catch (error) {
		console.error('Error opening side panel:', error);
	}
});

// Initialize all tabs to have side panel disabled by default
chrome.runtime.onInstalled.addListener(() => {
	// This sets the default side panel state to disabled for all tabs for whole chrome app
	chrome.sidePanel.setOptions({
		enabled: false,
	});
});

// Make sure new tabs start with disabled side panel
chrome.tabs.onCreated.addListener((tab) => {
	if (tab.id) {
		chrome.sidePanel.setOptions({
			tabId: tab.id,
			enabled: false,
		});
	}
});
