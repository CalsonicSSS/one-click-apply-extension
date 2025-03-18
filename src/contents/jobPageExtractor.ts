import type { PlasmoCSConfig } from 'plasmo';

// Automatically RUNS on every matching page (if specified in manifest.json).
// This script is injected into the page and runs in the context of the page itself. It has the DOM access of current page automatically.
// you can also specific when to auto run this script in the manifest.json file
export const config: PlasmoCSConfig = {
	matches: ['<all_urls>'],
	all_frames: false, // Keep this as false to avoid unnecessary complexity
};

// Set maximum content length to 300,000 characters
const MAX_CONTENT_LENGTH = 300000;

// Function to extract meaningful content from an element
function extractMeaningfulContent(element: HTMLElement): string {
	// Remove non-essential tags
	const tagsToRemove = ['script', 'style', 'noscript', 'object', 'embed', 'svg', 'canvas', 'meta', 'link'];
	tagsToRemove.forEach((tag) => {
		element.querySelectorAll(tag).forEach((el) => el.remove());
	});

	// Return the cleaned inner HTML
	return element.innerHTML;
}

// Truncate content to stay within maximum allowed length
function truncateContent(content: string): string {
	if (!content || content.length <= MAX_CONTENT_LENGTH) {
		return content;
	}

	// If content exceeds max length, truncate it
	const truncated = content.substring(0, MAX_CONTENT_LENGTH);
	return truncated + '\n\n[Content truncated due to length limitations]';
}

// Function to extract content from the main page and meaningful iframes
function extractPageContent(): string {
	try {
		let content = '';

		// Extract content from the main page
		const mainContent = extractMeaningfulContent(document.body);
		content += mainContent;

		// Extract content from meaningful iframes
		document.querySelectorAll('iframe').forEach((iframe) => {
			try {
				// Check if the iframe has a meaningful document
				if (
					iframe.contentDocument &&
					iframe.contentDocument.body &&
					iframe.contentDocument.body.textContent?.trim() // Ensure iframe has non-empty text
				) {
					const iframeContent = extractMeaningfulContent(iframe.contentDocument.body);
					content += '\n\n' + iframeContent; // Append iframe content
				}
			} catch (error) {
				console.warn('Error accessing iframe content:', error);
			}
		});

		// Truncate content if necessary
		return truncateContent(content);
	} catch (error) {
		console.error('Error extracting page content:', error);
		throw new Error(`Error extracting page content: ${error}`);
	}
}

// Listen for messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	console.log('Message received in content script:', message);

	if (message.action === 'getPageContent') {
		try {
			const pageContent = extractPageContent();
			sendResponse({
				success: true,
				pageContent: pageContent,
				url: window.location.href,
			});
		} catch (error) {
			console.error('Error processing page content extraction:', error);
			sendResponse({
				success: false,
				errorMessage: error.message,
				url: window.location.href,
			});
		}
	}

	// Return true to indicate we will send a response asynchronously
	return true;
});
