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

// background.ts - FIXED VERSION with state persistence
// Service workers in MV3 are ephemeral - must use chrome.storage to persist state

let currentUrl: string = '';
let currentWindowId: number = -1;
let currentTabId: number = -1;

// Helper function to get the currently active tab across all windows
async function getCurrentActiveTab(): Promise<chrome.tabs.Tab | null> {
	try {
		const windows = await chrome.windows.getAll({ populate: true });
		const focusedWindow = windows.find((window) => window.focused);

		if (focusedWindow && focusedWindow.tabs) {
			const activeTab = focusedWindow.tabs.find((tab) => tab.active);
			if (activeTab && activeTab.url) {
				return activeTab;
			}
		}

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

async function updateCurrentUrl(): Promise<void> {
	const activeTab = await getCurrentActiveTab();
	if (activeTab && activeTab.url) {
		currentUrl = activeTab.url;
		currentWindowId = activeTab.windowId;
		currentTabId = activeTab.id || -1;
		console.log('Current URL:', currentUrl, 'Window:', currentWindowId, 'Tab:', currentTabId);
	}
}

// ============================================================================
// CRITICAL FIX: Initialize state from storage on startup
// ============================================================================

async function initializeSidePanelState() {
	try {
		// Get persisted state from storage
		const result = await chrome.storage.local.get(['activePanelTabs']);
		const activePanelTabs = result.activePanelTabs || {};

		// Disable side panel globally by default
		await chrome.sidePanel.setOptions({ enabled: false });

		// Re-enable for tabs that had it open
		for (const tabIdStr in activePanelTabs) {
			const tabId = parseInt(tabIdStr);
			if (activePanelTabs[tabIdStr]) {
				await chrome.sidePanel.setOptions({
					tabId: tabId,
					path: 'sidepanel.html',
					enabled: true,
				});
			}
		}

		console.log('Side panel state initialized from storage:', activePanelTabs);
	} catch (error) {
		console.error('Error initializing side panel state:', error);
	}
}

// ============================================================================
// LIFECYCLE LISTENERS - Register at top level (synchronously)
// ============================================================================

// Called when extension is first installed/updated
chrome.runtime.onInstalled.addListener(async () => {
	console.log('Extension installed/updated');
	await initializeSidePanelState();
	await updateCurrentUrl();
});

// CRITICAL: Called when browser starts - this was missing!
chrome.runtime.onStartup.addListener(async () => {
	console.log('Browser startup - restoring side panel state');
	await initializeSidePanelState();
	await updateCurrentUrl();
});

// Tab/window event listeners
chrome.tabs.onActivated.addListener(async (activeInfo) => {
	console.log('Tab activated:', activeInfo.tabId, 'in window:', activeInfo.windowId);
	await updateCurrentUrl();
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
	if (changeInfo.url && tab.active) {
		console.log('Tab URL updated:', tabId, changeInfo.url);
		await updateCurrentUrl();
	}
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
	if (windowId !== chrome.windows.WINDOW_ID_NONE) {
		console.log('Window focus changed to:', windowId);
		await updateCurrentUrl();
	}
});

// ============================================================================
// MESSAGE HANDLER
// ============================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.action === 'getCurrentUrl') {
		console.log('getCurrentUrl message request received');
		updateCurrentUrl()
			.then(() => {
				sendResponse({
					url: currentUrl,
					success: true,
					windowId: currentWindowId,
					tabId: currentTabId,
				});
			})
			.catch((error) => {
				sendResponse({
					url: '',
					success: false,
					error: error?.message || 'Unknown error',
				});
			});
		return true;
	}
	return false;
});

// ============================================================================
// SIDE PANEL MANAGEMENT - With State Persistence
// ============================================================================

chrome.action.onClicked.addListener((tab) => {
	if (!tab?.id) return;

	try {
		// CRITICAL: Must call setOptions and open() synchronously to preserve user gesture
		// Step 1: Configure the side panel for this specific tab
		chrome.sidePanel.setOptions({
			tabId: tab.id,
			path: 'sidepanel.html',
			enabled: true,
		});

		// Step 2: Open the side panel immediately (preserves user gesture)
		chrome.sidePanel
			.open({ tabId: tab.id })
			.then(() => {
				console.log(`Opened side panel for tab ${tab.id}`);

				// Step 3: Persist the state AFTER opening (async is ok here)
				return chrome.storage.local.get(['activePanelTabs']);
			})
			.then((result) => {
				const activePanelTabs = result.activePanelTabs || {};
				activePanelTabs[tab.id] = true;
				return chrome.storage.local.set({ activePanelTabs });
			})
			.then(() => {
				console.log(`Persisted side panel state for tab ${tab.id}`);
			})
			.catch((error) => {
				console.error('Error persisting side panel state:', error);
			});
	} catch (error) {
		console.error('Error opening side panel:', error);
	}
});

// Disable side panel for new tabs by default
chrome.tabs.onCreated.addListener(async (tab) => {
	if (tab.id) {
		await chrome.sidePanel.setOptions({
			tabId: tab.id,
			enabled: false,
		});
	}
});

// Clean up when tabs are removed
chrome.tabs.onRemoved.addListener(async (tabId) => {
	try {
		// Clean up tab-specific data
		const storageResult = await chrome.storage.local.get([
			'allSuggestions',
			'allAnsweredQuestions',
			'activePanelTabs',
		]);

		// Clean suggestions
		const allSuggestions = storageResult.allSuggestions || {};
		if (allSuggestions[tabId]) {
			delete allSuggestions[tabId];
		}

		// Clean answered questions
		const allAnsweredQuestions = storageResult.allAnsweredQuestions || {};
		if (allAnsweredQuestions[tabId]) {
			delete allAnsweredQuestions[tabId];
		}

		// Clean panel state
		const activePanelTabs = storageResult.activePanelTabs || {};
		if (activePanelTabs[tabId]) {
			delete activePanelTabs[tabId];
		}

		// Save all changes
		await chrome.storage.local.set({
			allSuggestions,
			allAnsweredQuestions,
			activePanelTabs,
		});

		console.log(`Cleaned up data for closed tab ${tabId}`);
	} catch (error) {
		console.error('Error cleaning up tab data:', error);
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
