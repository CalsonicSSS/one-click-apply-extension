// background script in Chrome extensions is a SINGLE global instance that runs in the background
// There is only ONE instance of this background script running, not one per tab basis. It persists for the entire browser session while your extension is enabled
// Think of it as a "control tower" that can see and manage all tabs
// it runs as long as:
// 1. Chrome Browser is Open → Even if you open multiple tabs or windows, the background script is shared across all.
// 2. The Extension is Installed & Enabled → The script will be available as long as the extension is added and not disabled.
// under manifest v3, background script is leveraged by service worker: only runs when needed (e.g., responding to events / messages). It gets unloaded when idle.

// we are making the side panel feature to be tab specific instead of globally persistent by default across all tabs.
// we remove the {side_panel default_path} in the manifest setting at root level (which will be available across all tabs), to manage side panels on per-tab basis
// use the chrome.sidePanel.setOptions() API, you can control which pages/tabs the panel appears on.

// Background script for side panel management with improved multi-window URL tracking
// No exports - background scripts communicate via message passing only

let currentUrl: string = '';
let currentWindowId: number = -1;
let currentTabId: number = -1;

// Helper function to get the currently active tab across all windows
async function getCurrentActiveTab(): Promise<chrome.tabs.Tab | null> {
	try {
		// Get all windows
		const windows = await chrome.windows.getAll({ populate: true });

		// Find the focused window first
		const focusedWindow = windows.find((window) => window.focused);

		if (focusedWindow && focusedWindow.tabs) {
			// Find active tab in focused window
			const activeTab = focusedWindow.tabs.find((tab) => tab.active);
			if (activeTab && activeTab.url) {
				return activeTab;
			}
		}

		// Fallback: if no focused window, get the last focused window
		const lastFocusedWindow = await chrome.windows.getLastFocused({ populate: true });
		if (lastFocusedWindow && lastFocusedWindow.tabs) {
			const activeTab = lastFocusedWindow.tabs.find((tab) => tab.active);
			if (activeTab && activeTab.url) {
				return activeTab;
			}
		}

		return null;
	} catch (error) {
		console.error('Error getting current active tab:', error);
		return null;
	}
}

// Helper function to update current URL tracking
async function updateCurrentUrl(): Promise<void> {
	const activeTab = await getCurrentActiveTab();
	if (activeTab && activeTab.url) {
		currentUrl = activeTab.url;
		currentWindowId = activeTab.windowId;
		currentTabId = activeTab.id || -1;
		console.log('current URL:', currentUrl, 'Window:', currentWindowId, 'Tab:', currentTabId);
	}
}

// Initialize current URL on startup
chrome.runtime.onStartup.addListener(async () => {
	console.log('Extension startup - initializing URL tracking');
	await updateCurrentUrl();
});

chrome.runtime.onInstalled.addListener(async () => {
	console.log('Extension installed - initializing URL tracking');
	await updateCurrentUrl();
});

// Fires when user switches tabs within a window
chrome.tabs.onActivated.addListener(async (activeInfo) => {
	console.log('Tab activated:', activeInfo.tabId, 'in window:', activeInfo.windowId);
	await updateCurrentUrl();
});

// Fires when tab URL is updated (e.g., navigation or reload)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
	// Only update if this is the active tab and URL changed
	if (changeInfo.url && tab.active) {
		console.log('Tab URL updated:', tabId, changeInfo.url);
		await updateCurrentUrl();
	}
});

// CRUCIAL: Fires when window focus changes between different browser windows
chrome.windows.onFocusChanged.addListener(async (windowId) => {
	if (windowId !== chrome.windows.WINDOW_ID_NONE) {
		console.log('Window focus changed to:', windowId);
		// This is what fixes your multi-window issue!
		await updateCurrentUrl();
	}
});

// MESSAGE LISTENER - This is the correct pattern for Chrome extensions
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
	console.log('Background received message:', message);

	if (message.action === 'getCurrentUrl') {
		try {
			// Always get fresh URL data when requested
			await updateCurrentUrl();

			console.log('Sending URL response from background script:', currentUrl);
			sendResponse({
				url: currentUrl,
				success: true,
				windowId: currentWindowId,
				tabId: currentTabId,
			});
		} catch (error) {
			console.error('Error getting current URL:', error);
			sendResponse({
				url: '',
				success: false,
				error: error.message,
			});
		}

		// IMPORTANT: Return true to keep message channel open for async response
		return true;
	}

	// Handle other message types...
	return false;
});

// ---------------------------------------------------------------------------------------------------------------------------------------------------------
// Side Panel Management (unchanged from original)

const activePanelTabs: Set<number> = new Set();

chrome.action.onClicked.addListener((tab) => {
	if (!tab?.id) return;

	try {
		chrome.sidePanel.setOptions({
			tabId: tab.id,
			path: 'sidepanel.html',
			enabled: true,
		});

		chrome.sidePanel.open({ tabId: tab.id });
		activePanelTabs.add(tab.id);
	} catch (error) {
		console.error('Error opening side panel:', error);
	}
});

// Initialize all tabs to have side panel disabled by default
chrome.runtime.onInstalled.addListener(() => {
	chrome.sidePanel.setOptions({
		enabled: false,
	});
});

chrome.tabs.onCreated.addListener((tab) => {
	if (tab.id) {
		chrome.sidePanel.setOptions({
			tabId: tab.id,
			enabled: false,
		});
	}
});

// Clean up tab-specific stored data
async function cleanupTabSpecificStoredGenData(tabId: number) {
	try {
		const storageResult = await chrome.storage.local.get(['allSuggestions', 'allAnsweredQuestions']);

		const allSuggestions = storageResult.allSuggestions || {};
		if (allSuggestions[tabId]) {
			delete allSuggestions[tabId];
			await chrome.storage.local.set({ allSuggestions });
		}

		const allAnsweredQuestions = storageResult.allAnsweredQuestions || {};
		if (allAnsweredQuestions[tabId]) {
			delete allAnsweredQuestions[tabId];
			await chrome.storage.local.set({ allAnsweredQuestions });
		}
	} catch (error) {
		console.error('Error cleaning up tab data:', error);
	}
}

chrome.tabs.onRemoved.addListener((tabId) => {
	if (activePanelTabs.has(tabId)) {
		cleanupTabSpecificStoredGenData(tabId);
		activePanelTabs.delete(tabId);
	}
});

// Listen for credit refresh messages from external pages
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
	if (message.action === 'refreshCredits') {
		chrome.runtime.sendMessage({
			action: 'creditUpdateRequired',
			timestamp: Date.now(),
		});
		return true;
	}
});
