import type { PlasmoCSConfig } from 'plasmo';

// PlasmoCSConfig export is what identifies a file as SEPARATED content script be injected into matching pages for all the script file created under "contents".
// If a file in the contents directory does not export a PlasmoCSConfig object, Plasmo will not include it as a content script in your extension's manifest.
// This allows you to put helper files in the contents directory that won't be directly injected.
// So its better to put all the major full logics for content script in a singe file and refactor your code as much as possible in other folder / file.
export const config: PlasmoCSConfig = {
	matches: ['<all_urls>'],
	all_frames: false,
};

// Function to extract HTML content from the page - only called when requested
function extractPageContent(): string {
	try {
		// Get the entire body HTML content
		const bodyContent = document.body.innerHTML;
		return bodyContent;
	} catch (error) {
		console.error('Error extracting page content:', error);
		return '';
	}
}

// This listener is used to receive messages sent via chrome.tabs.sendMessage or chrome.runtime.sendMessage.
// chrome.runtime.onMessage is a general-purpose listener that can receive messages from many sources
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	console.log('Message received in content script:', message);

	// Only extract content when specifically requested
	if (message.action === 'getPageContent') {
		try {
			const pageContent = extractPageContent();
			console.log('Content extracted successfully');
			// sendResponse: the object we make here will be "response" object for sendMessage
			sendResponse({
				success: true,
				pageContent: pageContent,
				url: window.location.href,
			});
		} catch (error) {
			console.error('Error processing content extraction request:', error);
			sendResponse({
				success: false,
				error: `Failed to extract page content: ${error}`,
			});
		}
	}

	// Return true to indicate we will send a response asynchronously
	return true;
});

console.log('Job page detector script loaded and ready');
