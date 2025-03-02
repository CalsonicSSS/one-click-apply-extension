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
		// Clone the body to avoid modifying the actual page
		const clonedBody = document.body.cloneNode(true) as HTMLElement;

		// Remove non-essential tags
		const tagsToRemove = [
			'script',
			'style',
			'noscript',
			'iframe',
			'object',
			'embed',
			'svg',
			'canvas',
			'meta',
			'link',
		];
		tagsToRemove.forEach((tag) => {
			clonedBody.querySelectorAll(tag).forEach((el) => el.remove());
		});

		// Return the cleaned inner HTML
		return clonedBody.innerHTML;
	} catch (error) {
		console.error('Error extracting page content:', error);
		return '';
	}
}

// chrome.runtime.onMessage is a general-purpose listener that can receive messages from many sources (through runtime or tab)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	console.log('Message received in content script:', message);

	if (message.action === 'getPageContent') {
		try {
			const pageContent = extractPageContent();
			// sendResponse is to make and send the object we make here as "response" object for the code that sends Message
			sendResponse({
				success: true,
				pageContent: pageContent,
				url: window.location.href,
			});
		} catch (error) {
			console.error('Error processing content extraction:', error);
			sendResponse({
				success: false,
				error: `Error processing content extraction: ${error}`,
			});
		}
	}

	// Return true to indicate we will send a response asynchronously
	return true;
});
