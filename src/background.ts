// Background script for side panel management
// background script in Chrome extensions is a SINGLE global instance that runs in the background
// There is only ONE instance of this background script running, not one per tab basis. It persists for the entire browser session while your extension is enabled
// Think of it as a "control tower" that can see and manage all tabs
// it runs as long as:
// 1. Chrome Browser is Open → Even if you open multiple tabs or windows, the background script is shared across all.
// 2. The Extension is Installed & Enabled → The script will be available as long as the extension is added and not disabled.
// under manifest v3, background script is leveraged by service worker: only runs when needed (e.g., responding to events / messages). It gets unloaded when idle.

// we are making the side panel feature to be tab specific instead of globally persistent
// we remove the {side_panel default_path} in the manifest setting at root level (which will be available across all tabs), to manage side panels on per-tab basis
// use the chrome.sidePanel.setOptions() API, you can control which pages/tabs the panel appears on.
export { currentUrl };

// we will keep track of which tabs have the side panel enabled (later is used for the purpose of data-cleanup when specific tabs are closed on the chrome browser)
const activePanelTabs: Set<number> = new Set();

let currentUrl: string | undefined = undefined;

// chrome.action refers to the extension's browser action (toolbar icon) | onClicked is an event triggered when the user clicks the extension icon.
// The callback function receives the currently active tab (tab) as an argument. includes the id of the active tab
// this becomes tab specific management now
chrome.action.onClicked.addListener((tab) => {
	if (!tab?.id) return;

	try {
		// chrome.sidePanel.setOptions() is a tab-specific API
		// chrome.sidePanel internally centralizes & tracks EACH side panel state in EACH of all tabs when the browser is running (This happens at the browser level)
		// Maintains which tabs have panels enabled/disabled + Tracks panel configuration + Cleans up state when tabs are closed (at all time)
		chrome.sidePanel.setOptions({
			tabId: tab.id, // Enable side panel only for this tab only by tab id
			path: 'sidepanel.html', // Defines the content (path) that will be displayed in side panel
			enabled: true, // Ensures the side panel is enabled for this tab
		});

		// also a tab-specific API for actually open side panel, you have to first use chrome.sidePanel.setOptions to setup before chrome.sidePanel.open
		chrome.sidePanel.open({ tabId: tab.id });
		activePanelTabs.add(tab.id);
	} catch (error) {
		console.error('Error opening side panel:', error);
	}
});

// ---------------------------------------------------------------------------------------------------------------------------------------------------------

// Initialize all tabs to have side panel disabled by default
// onInstalled: listens for when the extension is installed, updated, or when Chrome is updated to a new version.
// typically to perform setup or initalized related tasks like initializing storage, default starting setting.
chrome.runtime.onInstalled.addListener(() => {
	// This sets the default side panel state to disabled for ALL tabs for WHOLE chrome app (since you dont specific tabId property)
	chrome.sidePanel.setOptions({
		enabled: false,
	});
});

// ---------------------------------------------------------------------------------------------------------------------------------------------------------

// Make sure new tabs start with disabled side panel
chrome.tabs.onCreated.addListener((tab) => {
	if (tab.id) {
		chrome.sidePanel.setOptions({
			tabId: tab.id,
			enabled: false,
		});
	}
});

// ---------------------------------------------------------------------------------------------------------------------------------------------------------

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
	currentUrl = tabs[0].url;
});

// this is to clean up tabSuggestions / tabApplicationQuestions data stored in current specific tab
// fileStorage and used creadit count are user specific and should persist even if the tab is closed (the CRUD are handled directly by user interaction)
async function cleanupTabSpecificStoredGenData(tabId: number) {
	try {
		// {tabSuggestions: tabId: {...}, tabId: {...}, }
		const storageResult = await chrome.storage.local.get(['allSuggestions', 'allAnsweredQuestions']);

		// Handle allSuggestions cleanup
		const allSuggestions = storageResult.allSuggestions || {};
		if (allSuggestions[tabId]) {
			delete allSuggestions[tabId];
			await chrome.storage.local.set({ allSuggestions });
		}

		// Handle allAnsweredQuestions cleanup
		const allAnsweredQuestions = storageResult.allAnsweredQuestions || {};
		if (allAnsweredQuestions[tabId]) {
			delete allAnsweredQuestions[tabId];
			await chrome.storage.local.set({ allAnsweredQuestions });
		}
	} catch (error) {
		console.error('Error cleaning up tab data:', error);
	}
}

// Clean up panel stored data when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
	// If this tab had an active panel, clean up its data
	if (activePanelTabs.has(tabId)) {
		cleanupTabSpecificStoredGenData(tabId);
		activePanelTabs.delete(tabId);
	}
});

// ---------------------------------------------------------------------------------------------------------------------------------------------------------

// Listen for the refreshCredits message from the success page
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
	if (message.action === 'refreshCredits') {
		// Simply broadcast to all extension components
		chrome.runtime.sendMessage({
			action: 'creditUpdateRequired',
			timestamp: Date.now(),
		});
		return true;
	}
});
