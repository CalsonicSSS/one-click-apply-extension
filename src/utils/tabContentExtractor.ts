type PageExtractionResult = {
	success: boolean;
	pageContent?: string;
	url?: string;
	error?: string;
};

export const extractPageContentFromActiveTab = async (): Promise<PageExtractionResult> => {
	try {
		// Query for the active tab in the current window
		const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
		const activeTab = tabs[0];

		if (!activeTab || !activeTab.id) {
			return {
				success: false,
				error: 'No active tab found',
			};
		}

		// This sends a message to the content script running in a specific tab (identified by tabId).
		// specifically designed to send messages to content scripts in a specific tab.
		const response = await chrome.tabs.sendMessage(activeTab.id, { action: 'getPageContent' });
		return response;
	} catch (error) {
		console.error('Error extracting content from active tab:', error);
		throw new Error(`Error extracting content from active tab`);
	}
};
