import { generateApplicationQuestionAnswerRequest } from '@/api/suggestionGeneration';
import type { AnsweredQuestion, ApplicationQuestionAnswerResponse } from '@/types/suggestionGeneration';
import { formatDate } from '@/utils/datetime';
import { useStorage } from '@plasmohq/storage/hook';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

export const useApplicationQuestions = () => {
	const [currentTabId, setCurrentTabId] = useState<number | null>(null);
	const [questionInput, setQuestionInput] = useState('');
	const [additionalRequirementsInput, setAdditionalRequirementsInput] = useState('');
	// includes all answers from all different potentials tabs
	const [allAnsweredQuestions, setAllAnsweredQuestions] = useStorage<Record<string, AnsweredQuestion[]>>(
		'allAnsweredQuestions',
		{},
	);
	const [tabSpecificAnsweredQuestions, setTabSpecificAnsweredQuestions] = useState<AnsweredQuestion[]>();
	const [questionHandlingErrorMessage, setQuestionHandlingErrorMessage] = useState<string>('');

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
				setQuestionHandlingErrorMessage('Error getting current tab ID');
			}
		};
		getCurrentTabId();
	}, []);

	useEffect(() => {
		const loadTabSpecificQuestions = async () => {
			if (!currentTabId) return;

			try {
				// Get questions for the current tab
				setTabSpecificAnsweredQuestions(allAnsweredQuestions[currentTabId] || []);
			} catch (err) {
				console.error('Error loading application questions:', err);
				setQuestionHandlingErrorMessage('Failed to load saved application questions');
			}
		};

		loadTabSpecificQuestions();
	}, [currentTabId]);

	const saveQuestion = async (question: AnsweredQuestion): Promise<void> => {
		if (!currentTabId) return;

		try {
			const updatedTabQuestions = [question, ...tabSpecificAnsweredQuestions];
			setTabSpecificAnsweredQuestions(updatedTabQuestions);

			allAnsweredQuestions[currentTabId] = updatedTabQuestions;
			setAllAnsweredQuestions(allAnsweredQuestions);
		} catch (err) {
			console.error('Error saving application question:', err);
			setQuestionHandlingErrorMessage('Failed to save and update answered question');
		}
	};

	const deleteQuestion = async (id: string): Promise<void> => {
		if (!currentTabId) return;

		try {
			const updatedTabQuestions = tabSpecificAnsweredQuestions.filter((q) => q.id !== id);
			setTabSpecificAnsweredQuestions(updatedTabQuestions);

			allAnsweredQuestions[currentTabId] = updatedTabQuestions;
			setAllAnsweredQuestions(allAnsweredQuestions);
		} catch (err) {
			console.error('Error deleting application question:', err);
			setQuestionHandlingErrorMessage('Failed to delete answered question');
		}
	};

	// Generate answer mutation
	const mutation = useMutation({
		mutationFn: generateApplicationQuestionAnswerRequest,
		onSuccess: async (data: ApplicationQuestionAnswerResponse) => {
			const newAnsweredQuestion: AnsweredQuestion = {
				id: crypto.randomUUID(),
				question: data.question,
				additionalRequirements: additionalRequirementsInput.trim() || undefined,
				answer: data.answer,
				createdAt: formatDate(new Date()),
			};

			await saveQuestion(newAnsweredQuestion);
			setQuestionInput('');
			setAdditionalRequirementsInput('');
		},
		onError: (error) => {
			setQuestionHandlingErrorMessage(error.message);
		},
	});

	return {
		questionInput,
		setQuestionInput,
		additionalRequirementsInput,
		setAdditionalRequirementsInput,
		tabSpecificAnsweredQuestions,
		deleteQuestion,
		questionHandlingErrorMessage,
		mutation,
	};
};
