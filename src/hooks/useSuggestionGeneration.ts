import {
	evaluateJobPostingPageRequest,
	generateCoverLetterRequest,
	generateResumeSuggestionRequest,
} from '@/api/suggestionGeneration';
import { getUserCredits } from '@/api/user';
import { FREE_TIER_USER_CREDIT_COUNT } from '@/constants/environments';
import type { FilesStorageState } from '@/types/fileManagement';
import { GenerationStage, type GenerationProgress } from '@/types/progressTracking';
import type { FullSuggestionGeneration } from '@/types/suggestionGeneration';
import { generateBrowserId } from '@/utils/browser';
import { useStorage } from '@plasmohq/storage/hook';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

type PageExtractionResult = {
	success: boolean;
	pageContent?: string;
	url: string;
	errorMessage?: string;
};

export const extractPageContentFromActiveTab = async (): Promise<PageExtractionResult> => {
	// Query for the active tab in the current window
	const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
	const activeTab = tabs[0];

	if (!activeTab || !activeTab.id) {
		throw new Error('No active job page found');
	}

	// chrome.tabs.sendMessage specifically designed to send messages to content scripts in a specific tab
	const response = await chrome.tabs.sendMessage(activeTab.id, { action: 'getPageContent' });
	if (response.success) {
		return response;
	} else {
		throw new Error(response.errorMessage);
	}
};

// -----------------------------------------------------------------------------------------------------------------------

export const useSuggestionGeneration = (storedFilesObj: FilesStorageState) => {
	const [currentTabId, setCurrentTabId] = useState<number | null>(null);
	// includes all suggestions from all different potentials tabs
	const [allSuggestions, setAllSuggestions] = useStorage<Record<string, FullSuggestionGeneration>>(
		'allSuggestions',
		{},
	);
	const [tabSpecificLatestFullSuggestion, setTabSpecificLatestFullSuggestion] =
		useState<FullSuggestionGeneration | null>(null);

	const [usedCredits, setUsedCredits] = useState<number>(0);
	const [sugguestionHandlingErrorMessage, setSugguestionHandlingErrorMessage] = useState<string>('');
	const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
	const [browserId, setBrowserId, { isLoading }] = useStorage('browserId');

	const getUserCurrentUsedCreditCount = async () => {
		if (!browserId) {
			return;
		}
		const currentCredits = await getUserCredits(browserId);
		setUsedCredits(FREE_TIER_USER_CREDIT_COUNT - currentCredits);
	};

	// get user current credit count and then calculate the used credit
	useEffect(() => {
		if (!isLoading && !browserId) {
			setBrowserId(generateBrowserId());
		}
		getUserCurrentUsedCreditCount();
	}, [browserId]);

	// Get the current tab ID
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

	// Load tab-specific latest generation results
	useEffect(() => {
		const loadTabSpecificSuggestion = async () => {
			if (!currentTabId) return;

			try {
				setTabSpecificLatestFullSuggestion(allSuggestions[currentTabId] || null);
			} catch (err) {
				console.error('Error loading tab-specific last suggestion & credit count data:', err);
				setSugguestionHandlingErrorMessage('Failed to load your suggestion');
			}
		};

		loadTabSpecificSuggestion();
	}, [currentTabId]);

	const handleGenerateSuggestionsProcess = async () => {
		if (!currentTabId) {
			throw new Error('No active tab found');
		}

		if (!browserId) {
			throw new Error('No user/browser Id created or found yet');
		}

		const currentCreditsCount = await getUserCredits(browserId);
		if (currentCreditsCount < 1) {
			throw new Error('No more credits, lets purchase more!');
		}

		// Reset error message
		setSugguestionHandlingErrorMessage(null);

		try {
			// STEP 1: Extract page content
			setGenerationProgress({
				stagePercentage: GenerationStage.ANALYZING_JOB_POSTING,
				message: 'Analyzing job posting content...',
			});

			const pageExtractedContent = await extractPageContentFromActiveTab();
			const jobPostingEvaluationResponseResult = await evaluateJobPostingPageRequest({
				jobPostingPageContent: pageExtractedContent.pageContent,
				browserId,
			});

			// STEP 2: Generate resume suggestions
			setGenerationProgress({
				stagePercentage: GenerationStage.GENERATING_RESUME_SUGGESTIONS,
				message: 'Generating tailored resume suggestions...',
			});

			const resumeSuggestionsResponseResult = await generateResumeSuggestionRequest({
				extractedJobPostingDetails: jobPostingEvaluationResponseResult.extracted_job_posting_details,
				storedFilesObj,
			});

			// STEP 3: Generate cover letter
			setGenerationProgress({
				stagePercentage: GenerationStage.CREATING_COVER_LETTER,
				message: 'Generating tailored cover letter...',
			});

			const coverLetterResponseResult = await generateCoverLetterRequest({
				extractedJobPostingDetails: jobPostingEvaluationResponseResult.extracted_job_posting_details,
				storedFilesObj,
			});

			// STEP 4: Complete - combine all results into FullSuggestionGeneration
			setGenerationProgress({
				stagePercentage: GenerationStage.COMPLETED,
				message: 'Generation process complete!',
			});

			// Combine coverLetterResponseResult and resumeSuggestionsResponseResult into a single object
			// we will also take "extracted_job_posting_details" from jobPostingEvaluationResponseResult to save them all together for now for convenience
			// this "extracted_job_posting_details" for application questions later
			const newFullSuggestedResult: FullSuggestionGeneration = {
				job_title_name: coverLetterResponseResult.job_title_name,
				company_name: coverLetterResponseResult.company_name,
				applicant_name: coverLetterResponseResult.applicant_name,
				cover_letter: coverLetterResponseResult.cover_letter,
				location: coverLetterResponseResult.location,
				resume_suggestions: resumeSuggestionsResponseResult.resume_suggestions,
				extracted_job_posting_details: jobPostingEvaluationResponseResult.extracted_job_posting_details,
			};

			// after the entire process, we will call the getUserCredits to get the new currentCreditsCount to update usedCredits
			getUserCurrentUsedCreditCount();

			// Update allSuggestions storage status and tabSpecificLatestFullSuggestion
			allSuggestions[currentTabId] = newFullSuggestedResult;
			setAllSuggestions(allSuggestions);
			setTabSpecificLatestFullSuggestion(newFullSuggestedResult);

			return newFullSuggestedResult;
		} catch (error) {
			// Reset progress on error
			setGenerationProgress(null);
			throw error; // Re-throw to be handled by the mutation
		}
	};

	const suggestionCreditUsagePercentage = Math.min(
		100,
		Math.round((usedCredits / FREE_TIER_USER_CREDIT_COUNT) * 100),
	);

	const mutation = useMutation({
		mutationFn: handleGenerateSuggestionsProcess,
	});

	return {
		mutation,
		usedCredits,
		sugguestionHandlingErrorMessage,
		suggestionCreditUsagePercentage,
		tabSpecificLatestFullSuggestion,
		generationProgress,
		browserId,
	};
};
