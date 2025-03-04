import { generateSuggestionsRequest } from '@/api/suggestionGeneration';
import { TIER_ONE_USER_CREDIT_COUNT } from '@/constants/environments';
import type { SuggestionGenerationResponse } from '@/types/apis/suggestionGeneration';
import type { FilesStorageState } from '@/types/fileManagement';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

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

		// chrome.tabs.sendMessage specifically designed to send messages to content scripts in a specific tab
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

export const useSuggestionGenerationProcess = (storedFilesObj: FilesStorageState) => {
	const [currentTabId, setCurrentTabId] = useState<number | null>(null);
	const [usedSuggestionCredits, setUsedSuggestionCredits] = useState<number>(0);
	const [lastSuggestion, setLastSuggestion] = useState<SuggestionGenerationResponse | null>(null);
	const [lastSuggestionAndCreditUsedLoadingErrMessage, setLastSuggestionAndCreditUsedLoadingErrMessage] = useState<
		string | null
	>(null);

	// Get the current tab ID when the hook initializes
	useEffect(() => {
		const getCurrentTabId = async () => {
			try {
				const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
				if (tabs[0]?.id) {
					setCurrentTabId(tabs[0].id);
				}
			} catch (err) {
				console.error('Error getting current tab ID:', err);
			}
		};
		getCurrentTabId();
	}, []);

	// Load credits and tab-specific generation results
	useEffect(() => {
		const loadData = async () => {
			if (!currentTabId) return;

			try {
				const result = await chrome.storage.local.get(['usedSuggestionCreditsCount', 'tabSuggestions']);

				setUsedSuggestionCredits(result.usedSuggestionCreditsCount || 0);

				// Get tab-specific suggestion if available
				const tabSuggestions = result.tabSuggestions || {};
				if (tabSuggestions[currentTabId]) {
					setLastSuggestion(tabSuggestions[currentTabId]);
				} else {
					setLastSuggestion(null);
				}
			} catch (err) {
				console.error('Error loading tab-specific data:', err);
				setLastSuggestionAndCreditUsedLoadingErrMessage('Failed to load suggestion and credit count data');
			}
		};

		loadData();
	}, [currentTabId]);

	useEffect(() => {
		const syncUsedCreditSuggestionCountChange = (
			changes: { [key: string]: chrome.storage.StorageChange },
			areaName: string,
		) => {
			// Only react to changes in local storage
			if (areaName !== 'local') return;

			// Update credit usage if it changed
			if (changes.usedSuggestionCreditsCount) {
				const newValue = changes.usedSuggestionCreditsCount.newValue;
				if (newValue !== undefined) {
					setUsedSuggestionCredits(newValue);
				}
			}
		};

		// Add the listener
		chrome.storage.onChanged.addListener(syncUsedCreditSuggestionCountChange);

		// Clean up the listener when the component unmounts
		return () => {
			chrome.storage.onChanged.removeListener(syncUsedCreditSuggestionCountChange);
		};
	}, [currentTabId]);

	const handleGenerateSuggestionsProcess = async () => {
		if (!currentTabId) {
			throw new Error('No active tab found');
		}

		setLastSuggestionAndCreditUsedLoadingErrMessage(null);

		// Fetch current page content
		const pageExtractedResponse = await extractPageContentFromActiveTab();

		// Send generation request
		const suggestionGenerationResponse = await generateSuggestionsRequest({
			pageContent: pageExtractedResponse.pageContent,
			storedFilesObj: storedFilesObj,
		});

		// Increment credit usage via background script to prevent race conditions
		const response = await chrome.runtime.sendMessage({ action: 'incrementCredits' });
		if (response && response.success) {
			setUsedSuggestionCredits(response.newCount);
		}

		// Store tab-specific suggestion
		const result = await chrome.storage.local.get('tabSuggestions');
		const tabSuggestions = result.tabSuggestions || {};

		// Update this tab's suggestion
		tabSuggestions[currentTabId] = suggestionGenerationResponse;

		// Save to storage
		await chrome.storage.local.set({ tabSuggestions });

		return suggestionGenerationResponse;
	};

	const suggestionCreditUsagePercentage = Math.min(
		100,
		Math.round((usedSuggestionCredits / TIER_ONE_USER_CREDIT_COUNT) * 100),
	);

	const mutation = useMutation({
		mutationFn: handleGenerateSuggestionsProcess,
	});

	return {
		mutation,
		usedSuggestionCredits,
		lastSuggestionAndCreditUsedLoadingErrMessage,
		suggestionCreditUsagePercentage,
		lastSuggestion,
		currentTabId,
	};
};
