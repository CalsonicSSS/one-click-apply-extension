import { generateSuggestionsRequest } from '@/api/suggestionGeneration';
import { TIER_ONE_USER_CREDIT_COUNT } from '@/constants/environments';
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

		// chrome.tabs.sendMessage specifically designed to send messages to content scripts in a specific tab, we need to have tabId.
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
	const [showResults, setShowResults] = useState(false);
	const [usedSuggestionCredits, setUsedSuggestionCredits] = useState<number>(0);
	const [usedSuggestionCreditsLoadingErrMessage, setUsedSuggestionCreditsLoadingErrMessage] = useState<string | null>(
		null,
	);

	useEffect(() => {
		const loadUsedSuggestionCreditCount = async () => {
			try {
				const result = await chrome.storage.local.get('usedSuggestionCreditsCount');
				if (result.usedSuggestionCreditsCount) {
					setUsedSuggestionCredits(result.usedSuggestionCreditsCount);
				}
			} catch (err) {
				console.error('Error loading suggestion credits count:', err);
				setUsedSuggestionCreditsLoadingErrMessage('Failed to load suggestion credit count');
			}
		};
		loadUsedSuggestionCreditCount();
	}, []);

	const handleGenerateSuggestionsProcess = async () => {
		setShowResults(false);
		setUsedSuggestionCreditsLoadingErrMessage(null);

		// Fetch current page content
		const pageExtractedResponse = await extractPageContentFromActiveTab();

		// Send generation request
		const suggestionGenerationResponse = await generateSuggestionsRequest({
			pageContent: pageExtractedResponse.pageContent,
			storedFilesObj: storedFilesObj,
		});

		// Update state and storage correctly
		setUsedSuggestionCredits((prevCredits: number) => {
			const updatedUsedSuggestionCreditsCount = prevCredits + 1;
			chrome.storage.local.set({ usedSuggestionCreditsCount: updatedUsedSuggestionCreditsCount });
			return updatedUsedSuggestionCreditsCount;
		});

		setShowResults(true);
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
		showResults,
		setShowResults,
		usedSuggestionCredits,
		usedSuggestionCreditsLoadingErrMessage,
		suggestionCreditUsagePercentage,
	};
};
