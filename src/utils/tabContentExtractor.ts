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
			throw new Error('No active job page found');
		}

		// This sends a message to the content script running in a specific tab (identified by tabId).
		// specifically designed to send messages to content scripts in a specific tab.
		const response = await chrome.tabs.sendMessage(activeTab.id, { action: 'getPageContent' });
		return response;
	} catch (error) {
		if (error.message === 'No active job page found') {
			console.error('Error extracting content from active tab:', error);
			throw error;
		} else {
			console.error('Error extracting content from active tab:', error);
			throw new Error(`Error extracting content: ${error}`);
		}
	}
};
