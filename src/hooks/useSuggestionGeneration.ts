import {
	evaluateJobPostingPageRequest,
	generateCoverLetterRequest,
	generateResumeSuggestionRequest,
} from '@/api/suggestionGeneration';
import { TIER_ONE_USER_CREDIT_COUNT } from '@/constants/environments';
import type { FilesStorageState } from '@/types/fileManagement';
import { GenerationStage, type GenerationProgress } from '@/types/progressTracking';
import type { FullSuggestionGeneration } from '@/types/suggestionGeneration';
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
	const [lastSuggestion, setLastSuggestion] = useState<FullSuggestionGeneration | null>(null);
	const [lastSuggestionAndCreditUsedLoadingErrMessage, setLastSuggestionAndCreditUsedLoadingErrMessage] = useState<
		string | null
	>(null);
	const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);

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

		// Reset error message
		setLastSuggestionAndCreditUsedLoadingErrMessage(null);

		try {
			// STEP 1: Extract page content
			setGenerationProgress({
				stagePercentage: GenerationStage.ANALYZING_JOB_POSTING,
				message: 'Analyzing job posting content...',
			});

			const pageExtractedResponse = await extractPageContentFromActiveTab();
			const jobPostingEvaluationResult = await evaluateJobPostingPageRequest(pageExtractedResponse.pageContent);

			// STEP 2: Generate resume suggestions
			setGenerationProgress({
				stagePercentage: GenerationStage.GENERATING_RESUME_SUGGESTIONS,
				message: 'Generating tailored resume suggestions...',
			});

			const resumeSuggestionsResult = await generateResumeSuggestionRequest({
				extractedJobPostingDetails: jobPostingEvaluationResult.extracted_job_posting_details,
				storedFilesObj,
			});

			// STEP 3: Generate cover letter
			setGenerationProgress({
				stagePercentage: GenerationStage.CREATING_COVER_LETTER,
				message: 'Generating tailored cover letter...',
			});

			const coverLetterResponseResult = await generateCoverLetterRequest({
				extractedJobPostingDetails: jobPostingEvaluationResult.extracted_job_posting_details,
				storedFilesObj,
			});

			// STEP 4: Complete - combine all results into FullSuggestionGeneration
			setGenerationProgress({
				stagePercentage: GenerationStage.COMPLETED,
				message: 'Generation process complete!',
			});

			// Combine results into a single object
			const combinedResults: FullSuggestionGeneration = {
				job_title_name: coverLetterResponseResult.job_title_name,
				company_name: coverLetterResponseResult.company_name,
				applicant_name: coverLetterResponseResult.applicant_name,
				cover_letter: coverLetterResponseResult.cover_letter,
				location: coverLetterResponseResult.location,
				resume_suggestions: resumeSuggestionsResult.resume_suggestions,
			};

			// Increment credit usage via background script to prevent race conditions
			const response = await chrome.runtime.sendMessage({ action: 'incrementCredits' });
			if (response && response.success) {
				setUsedSuggestionCredits(response.newCount);
			}

			// Store tab-specific suggestion
			const result = await chrome.storage.local.get('tabSuggestions');
			const tabSuggestions = result.tabSuggestions || {};
			tabSuggestions[currentTabId] = combinedResults;
			await chrome.storage.local.set({ tabSuggestions });

			return combinedResults;
		} catch (error) {
			// Reset progress on error
			setGenerationProgress(null);
			throw error; // Re-throw to be handled by the mutation
		}
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
		generationProgress, // Add this line to expose progress state
	};
};
