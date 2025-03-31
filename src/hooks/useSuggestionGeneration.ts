import {
	evaluateJobPostingPageRequest,
	generateCoverLetterRequest,
	generateResumeSuggestionRequest,
} from '@/api/suggestionGeneration';
import { getUserCredits } from '@/api/user';
import type { FilesStorageState } from '@/types/fileManagement';
import { GenerationStage, type GenerationProgress } from '@/types/progressTracking';
import type { FullSuggestionGeneration } from '@/types/suggestionGeneration';
import { generateBrowserId } from '@/utils/browser';
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
// the useSuggestionGeneration mainly responsible for handling states of allSuggestions and tabSpecificLatestFullSuggestion and suggestion generation process
// which also involves other highly related state: currentTabId, credits, browserId (for user identification), generationProgress
// we directly instansitate and manage here as they are working with the whole suggestion gen process here
// we will also pass along the browserId and credit as well to credit manager component directly

export const useSuggestionGeneration = (storedFilesObj: FilesStorageState) => {
	const [tabSpecificLatestFullSuggestion, setTabSpecificLatestFullSuggestion] = useState<
		FullSuggestionGeneration | null | undefined
	>(null);
	const [currentTabId, setCurrentTabId] = useState<number | null>(null);
	const [credits, setCredits] = useState<number | null>(null);
	const [sugguestionHandlingErrorMessage, setSugguestionHandlingErrorMessage] = useState<string>('');
	const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
	const [browserId, setBrowserId] = useState<string | null>(null);

	const fetchAndSetUserCredits = async () => {
		if (!browserId) return;
		try {
			const currentCredits = await getUserCredits(browserId);
			setCredits(currentCredits);
		} catch (error) {
			console.error('Error fetching user credits:', error);
			setSugguestionHandlingErrorMessage('Failed to fetch your credits');
		}
	};

	// get current browserID upon initial
	useEffect(() => {
		const getBrowserId = async () => {
			const browserIdResultPair = await chrome.storage.local.get('browserId');
			const browserId = browserIdResultPair.browserId;
			if (!browserId) {
				const browserId = generateBrowserId();
				await chrome.storage.local.set({ browserId });
				setBrowserId(browserId);
			} else {
				setBrowserId(browserId);
			}
		};
		getBrowserId();
	}, []);

	// fetch user credit upon initial
	useEffect(() => {
		if (browserId) {
			fetchAndSetUserCredits();
		}
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

	// Load tab-specific initial latest generation results
	useEffect(() => {
		const loadTabSpecificSuggestion = async () => {
			if (!currentTabId) return;

			try {
				const allSuggestionsResultPair = await chrome.storage.local.get('allSuggestions');
				if (!allSuggestionsResultPair.allSuggestions) {
					setTabSpecificLatestFullSuggestion(null);
				} else {
					setTabSpecificLatestFullSuggestion(allSuggestionsResultPair.allSuggestions[currentTabId]);
				}
			} catch (err) {
				console.error('Error loading tab-specific suggestion:', err);
				setSugguestionHandlingErrorMessage('Failed to load your suggestions for this job');
			}
		};

		loadTabSpecificSuggestion();
	}, [currentTabId]);

	const handleGenerateSuggestionsProcess = async () => {
		// Reset error message
		setSugguestionHandlingErrorMessage(null);

		try {
			if (!currentTabId) {
				throw new Error('No active tab found');
			}

			if (!browserId) {
				throw new Error('No user/browser Id created or found');
			}

			if (!credits) {
				throw new Error('No user credits available found');
			}

			if (credits < 1) {
				throw new Error('No more credits, lets purchase more!');
			}

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

			// after the entire process, we will call the setUserCredits to get the new currentCreditsCount to update usedCredits
			fetchAndSetUserCredits();

			// Update allSuggestions storage and tabSpecificLatestFullSuggestion states directly
			const allSuggestionsResultPair = await chrome.storage.local.get('allSuggestions');
			const allSuggestions =
				(allSuggestionsResultPair.allSuggestions as Record<string, FullSuggestionGeneration>) || {};
			allSuggestions[currentTabId] = newFullSuggestedResult;
			await chrome.storage.local.set({ allSuggestions });

			setTabSpecificLatestFullSuggestion(newFullSuggestedResult);

			return newFullSuggestedResult;
		} catch (error) {
			// Reset progress on error
			setGenerationProgress(null);
			throw error; // Re-throw to be handled by the mutation
		}
	};

	const mutation = useMutation({
		mutationFn: handleGenerateSuggestionsProcess,
	});

	return {
		mutation,
		credits,
		sugguestionHandlingErrorMessage,
		tabSpecificLatestFullSuggestion,
		generationProgress,
		browserId,
	};
};
