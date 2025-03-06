import type { PlasmoCSConfig } from 'plasmo';

// PlasmoCSConfig export is what identifies a file as SEPARATED content script be injected into matching pages for all the script file created under "contents".
// If a file in the contents directory does not export a PlasmoCSConfig object, Plasmo will not include it as a content script in your extension's manifest.
// This allows you to put helper files in the contents directory that won't be directly injected.
// So its better to put all the major full logics for content script in a singe file and refactor your code as much as possible in other folder / file.
export const config: PlasmoCSConfig = {
	matches: ['<all_urls>'],
	all_frames: false,
};

// Maximum content length in characters to prevent token overflow
// Setting to approximately 50,000 characters which is roughly around 12,500 tokens
// This gives a safe margin below the 200,000 token limit
const MAX_CONTENT_LENGTH = 500000;

/**
 * Intelligently extracts job-related content from the page
 * Uses multiple strategies to find relevant content while keeping size manageable
 */
function extractJobContent(): string {
	try {
		// Strategy 1: Try to find common job description containers
		const jobContent = findJobDescriptionContent();
		if (jobContent && jobContent.length > 0) {
			return truncateContent(jobContent);
		}

		// Strategy 2: Extract just the main content area
		const mainContent = extractMainContent();
		if (mainContent && mainContent.length > 0) {
			return truncateContent(mainContent);
		}

		// Strategy 3: Fallback to a more aggressive cleaning approach
		return truncateContent(cleanAndExtractVisibleText());
	} catch (error) {
		console.error('Error extracting job content:', error);
		return '';
	}
}

/**
 * Attempts to locate job description content using common selectors and patterns
 */
function findJobDescriptionContent(): string {
	// Create an array of common job description container selectors
	const jobSelectors = [
		// Common class/id names for job descriptions across various sites
		'[class*="job-description"]',
		'[class*="jobDescription"]',
		'[class*="job_description"]',
		'[id*="job-description"]',
		'[id*="jobDescription"]',
		'[id*="job_description"]',
		// Common containers
		'[class*="description"]',
		'[class*="details"]',
		'[class*="posting"]',
		'[class*="content"]',
		'[class*="position"]',
		'[class*="opportunity"]',
		// LinkedIn specific
		'[class*="show-more-less-html"]',
		// Indeed specific
		'#jobDescriptionText',
		// Glassdoor specific
		'[class*="jobDescriptionContent"]',
		// ZipRecruiter specific
		'[class*="job_description"]',
		// Monster specific
		'.job-description',
		// General article/content containers that might contain job descriptions
		'article',
		'.article',
		'main',
		'#main',
		'.main-content',
		'#main-content',
	];

	// Try each selector to find content
	for (const selector of jobSelectors) {
		const elements = document.querySelectorAll(selector);
		if (elements.length) {
			// Take the longest content among matching elements (likely the most detailed)
			let longestContent = '';
			elements.forEach((el) => {
				const content = el.textContent || '';
				if (content.length > longestContent.length && content.length > 100) {
					longestContent = content;
				}
			});

			if (longestContent.length > 200) {
				// If we found substantial content, return it
				return longestContent;
			}
		}
	}

	return '';
}

/**
 * Extracts the main content area of the page, removing navigations, footers, etc.
 */
function extractMainContent(): string {
	// Clone the body to avoid modifying the actual page
	const clonedBody = document.body.cloneNode(true) as HTMLElement;

	// Elements to remove that are unlikely to contain job information
	const elementsToRemove = [
		// Navigation elements
		'header',
		'nav',
		'[class*="nav"]',
		'[class*="header"]',
		'[class*="menu"]',
		// Footer elements
		'footer',
		'[class*="footer"]',
		// Sidebar elements
		'aside',
		'[class*="sidebar"]',
		'[class*="aside"]',
		// Advertisement elements
		'[class*="ad"]',
		'[class*="advertisement"]',
		'[id*="ad-"]',
		// Social media elements
		'[class*="social"]',
		'[class*="share"]',
		// Comments and user interaction elements
		'[class*="comment"]',
		'[class*="review"]',
		// Non-visible elements
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
		// Other non-relevant elements
		'[class*="cookie"]',
		'[class*="popup"]',
		'[class*="modal"]',
		'[class*="banner"]',
	];

	// Remove all the identified elements
	elementsToRemove.forEach((selector) => {
		clonedBody.querySelectorAll(selector).forEach((el) => el.remove());
	});

	// Extract text content only, with some structural information
	let content = '';
	const contentElements = clonedBody.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, td, th, dt, dd');
	contentElements.forEach((el) => {
		const text = el.textContent?.trim();
		if (text && text.length > 0) {
			if (el.tagName.toLowerCase().startsWith('h')) {
				content += `\n${text}\n`;
			} else {
				content += `${text}\n`;
			}
		}
	});

	return content;
}

/**
 * Cleans the document and extracts only visible text content
 */
function cleanAndExtractVisibleText(): string {
	// Clone the body to avoid modifying the actual page
	const clonedBody = document.body.cloneNode(true) as HTMLElement;

	// Function to check if an element is visible
	const isVisible = (element: HTMLElement): boolean => {
		if (!element) return false;

		const style = window.getComputedStyle(element);
		return (
			style.display !== 'none' &&
			style.visibility !== 'hidden' &&
			element.offsetWidth > 0 &&
			element.offsetHeight > 0
		);
	};

	// Remove hidden elements
	const allElements = clonedBody.getElementsByTagName('*');
	for (let i = allElements.length - 1; i >= 0; i--) {
		const el = allElements[i] as HTMLElement;
		if (!isVisible(el)) {
			el.parentNode?.removeChild(el);
		}
	}

	// Extract page metadata that might be useful
	const pageTitle = document.title || '';
	const pageUrl = window.location.href;
	const pageMetaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';

	// Extract text content in a structured way
	let textContent = `Page Title: ${pageTitle}\nURL: ${pageUrl}\n`;
	if (pageMetaDescription) {
		textContent += `Meta Description: ${pageMetaDescription}\n\n`;
	}

	// Extract headings and paragraphs to maintain some structure
	const contentElements = clonedBody.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, td, th');
	contentElements.forEach((el) => {
		const text = el.textContent?.trim();
		if (text && text.length > 0) {
			if (el.tagName.toLowerCase().startsWith('h')) {
				textContent += `\n${text}\n`;
			} else {
				textContent += `${text}\n`;
			}
		}
	});

	return textContent;
}

/**
 * Truncates content to stay within the maximum allowed length
 */
function truncateContent(content: string): string {
	if (content.length <= MAX_CONTENT_LENGTH) {
		return content;
	}

	// If content exceeds max length, truncate it
	// Try to truncate at a paragraph break if possible
	const truncated = content.substring(0, MAX_CONTENT_LENGTH);
	const lastParagraphBreak = truncated.lastIndexOf('\n\n');

	if (lastParagraphBreak > MAX_CONTENT_LENGTH * 0.8) {
		// If we can find a paragraph break in the last 20% of the content, break there
		return truncated.substring(0, lastParagraphBreak) + '\n\n[Content truncated due to length limitations]';
	}

	// Otherwise just truncate at the max length
	return truncated + '\n\n[Content truncated due to length limitations]';
}

// chrome.runtime.onMessage is a general-purpose listener that can receive messages from many sources (through runtime or tab)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	console.log('Message received in content script:', message);

	if (message.action === 'getPageContent') {
		try {
			const pageContent = extractJobContent();
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
