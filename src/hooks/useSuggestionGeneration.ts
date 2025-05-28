import {
	evaluateJobPostingPageRequest,
	generateCoverLetterRequest,
	generateFullResumeRequest,
	generateResumeSuggestionRequest,
} from '@/api/suggestionGeneration';
import { getUserCredits } from '@/api/user';
import type { FilesStorageState } from '@/types/fileManagement';
import { GenerationStage, type GenerationProgress } from '@/types/progressTracking';
import type { FullSuggestionGeneration, JobPostingEvalResultResponse } from '@/types/suggestionGeneration';
import { generateBrowserId } from '@/utils/browser';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

export const useSuggestionGeneration = (storedFilesObj: FilesStorageState) => {
	const [tabSpecificLatestFullSuggestion, setTabSpecificLatestFullSuggestion] = useState<
		FullSuggestionGeneration | null | undefined
	>(null);
	const [currentTabId, setCurrentTabId] = useState<number | null>(null);
	const [credits, setCredits] = useState<number | null>(null);
	const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
	const [browserId, setBrowserId] = useState<string | null>(null);
	const [sugguestionAndCreditLoadingErrMsg, setSugguestionAndCreditLoadingErrMsg] = useState<string>('');
	const [jobPostingContent, setJobPostingContent] = useState<string | null>(null);

	const fetchAndSetUserCredits = async (browserId: string | null) => {
		if (!browserId) return;
		try {
			const currentCredits = await getUserCredits(browserId);
			setCredits(currentCredits);
		} catch (error) {
			console.error('Error fetching user credits:', error);
			setSugguestionAndCreditLoadingErrMsg('Failed to fetch your credits');
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
			fetchAndSetUserCredits(browserId);
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

	// Load tab-specific latest generation results
	useEffect(() => {
		const loadTabSpecificSuggestion = async () => {
			if (!currentTabId) return;

			try {
				// even before allSuggestions is set, "get" method will return {} by default from chrome
				// then allSuggestionsResultPair.allSuggestions will return undefined
				const allSuggestionsResultPair = await chrome.storage.local.get('allSuggestions');

				if (!allSuggestionsResultPair.allSuggestions) {
					setTabSpecificLatestFullSuggestion(null);
				} else if (
					allSuggestionsResultPair.allSuggestions &&
					allSuggestionsResultPair.allSuggestions[currentTabId]
				) {
					setTabSpecificLatestFullSuggestion(allSuggestionsResultPair.allSuggestions[currentTabId]);
				} else {
					setTabSpecificLatestFullSuggestion(null);
				}
			} catch (err) {
				console.error('Error loading tab-specific suggestion:', err);
				setSugguestionAndCreditLoadingErrMsg('Failed to load your suggestions for this job');
			}
		};

		loadTabSpecificSuggestion();
	}, [currentTabId]);

	// Listen for messages from the background script to refresh credits
	useEffect(() => {
		function handleCreditUpdate(message) {
			if (message.action === 'creditUpdateRequired' && browserId) {
				fetchAndSetUserCredits(browserId);
			}
		}

		chrome.runtime.onMessage.addListener(handleCreditUpdate);
		return () => {
			chrome.runtime.onMessage.removeListener(handleCreditUpdate);
		};
	}, [browserId]);

	const handleGenerateSuggestionsProcess = async () => {
		// Reset error message
		setSugguestionAndCreditLoadingErrMsg(null);

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
				throw new Error('No more credits, lets purchase more! 🚀');
			}

			// STEP 1: Extract page content
			setGenerationProgress({
				stagePercentage: GenerationStage.ANALYZING_JOB_POSTING,
				message: 'Analyzing job posting content...',
			});

			let jobPostingEvaluationResponseResult: JobPostingEvalResultResponse;

			// If jobPostingContent is set (manual input), use that
			if (jobPostingContent && jobPostingContent.trim()) {
				console.log('Using manual job posting content');
				jobPostingEvaluationResponseResult = await evaluateJobPostingPageRequest({
					jobPostingContent: jobPostingContent.trim(),
					browserId,
				});
			} else {
				// If no manual content, URL scraping
				console.log('Attempting to get current URL for scraping');

				const response = await chrome.runtime.sendMessage({
					action: 'getCurrentUrl',
				});

				jobPostingEvaluationResponseResult = await evaluateJobPostingPageRequest({
					websiteUrl: response.url,
					browserId,
				});
			}

			// STEP 2: Generate resume suggestions
			setGenerationProgress({
				stagePercentage: GenerationStage.GENERATING_RESUME_SUGGESTIONS,
				message: 'Generating tailored resume suggestions...',
			});

			const resumeSuggestionsResponseResult = await generateResumeSuggestionRequest({
				extractedJobPostingDetails: jobPostingEvaluationResponseResult.extracted_job_posting_details,
				storedFilesObj,
			});

			// STEP 3: Generate full resume
			setGenerationProgress({
				stagePercentage: GenerationStage.GENERATING_FULL_RESUME,
				message: 'Generating full tailored resume...',
			});

			const fullResumeResponseResult = await generateFullResumeRequest({
				extractedJobPostingDetails: jobPostingEvaluationResponseResult.extracted_job_posting_details,
				storedFilesObj,
			});

			// STEP 4: Generate cover letter
			setGenerationProgress({
				stagePercentage: GenerationStage.CREATING_COVER_LETTER,
				message: 'Generating tailored cover letter...',
			});

			const coverLetterResponseResult = await generateCoverLetterRequest({
				browserId,
				extractedJobPostingDetails: jobPostingEvaluationResponseResult.extracted_job_posting_details,
				storedFilesObj,
			});

			// STEP 5: Complete - combine all results
			setGenerationProgress({
				stagePercentage: GenerationStage.COMPLETED,
				message: 'Generation process complete!',
			});

			const newFullSuggestedResult: FullSuggestionGeneration = {
				job_title_name: coverLetterResponseResult.job_title_name,
				company_name: coverLetterResponseResult.company_name,
				applicant_name: coverLetterResponseResult.applicant_name,
				cover_letter: coverLetterResponseResult.cover_letter,
				location: coverLetterResponseResult.location,
				resume_suggestions: resumeSuggestionsResponseResult.resume_suggestions,
				extracted_job_posting_details: jobPostingEvaluationResponseResult.extracted_job_posting_details,
				full_resume: fullResumeResponseResult,
			};

			// Refresh credits after successful generation
			// backend already called "await consume_credit(browser_id)" to consume 1 credit for the user on the server side
			fetchAndSetUserCredits(browserId);

			// Update storage
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
			console.error('Generation process failed:', error);
			throw error;
		}
	};

	const mutation = useMutation({
		mutationFn: handleGenerateSuggestionsProcess,
	});

	return {
		mutation,
		credits,
		sugguestionAndCreditLoadingErrMsg,
		tabSpecificLatestFullSuggestion,
		generationProgress,
		browserId,
		jobPostingContent,
		setJobPostingContent,
	};
};
