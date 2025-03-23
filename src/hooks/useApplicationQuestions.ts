// src/hooks/useApplicationQuestions.ts

import type { ApplicationQuestion } from '@/types/suggestionGeneration';
import { useEffect, useState } from 'react';

type UseApplicationQuestionsReturn = {
	savedApplicationQuestions: ApplicationQuestion[];
	saveQuestion: (question: ApplicationQuestion) => Promise<void>;
	deleteQuestion: (id: string) => Promise<void>;
	errorMessage: string | null;
};

export const useApplicationQuestions = (currentTabId: number | null): UseApplicationQuestionsReturn => {
	const [savedApplicationQuestions, setSavedApplicationQuestions] = useState<ApplicationQuestion[]>([]);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	// Load questions when the component mounts or tab ID changes
	useEffect(() => {
		const loadQuestions = async () => {
			if (!currentTabId) return;

			try {
				const result = await chrome.storage.local.get('tabApplicationQuestions');
				const tabQuestions = result.tabApplicationQuestions || {};

				// Get questions for the current tab
				setSavedApplicationQuestions(tabQuestions[currentTabId] || []);
			} catch (err) {
				console.error('Error loading application questions:', err);
				setErrorMessage('Failed to load saved application questions');
			}
		};

		loadQuestions();
	}, [currentTabId]);

	// Save a new question and also update state of the applicationQuestions for display
	const saveQuestion = async (question: ApplicationQuestion): Promise<void> => {
		if (!currentTabId) return;

		try {
			// Get current questions for all tabs
			const result = await chrome.storage.local.get('tabApplicationQuestions');
			const tabQuestions = result.tabApplicationQuestions || {};

			// Update questions for the current tab
			const currentTabQuestions = tabQuestions[currentTabId] || [];
			const updatedTabQuestions = [question, ...currentTabQuestions];

			// Update storage with the new questions
			tabQuestions[currentTabId] = updatedTabQuestions;
			await chrome.storage.local.set({ tabApplicationQuestions: tabQuestions });

			// Update local state
			setSavedApplicationQuestions(updatedTabQuestions);
		} catch (err) {
			console.error('Error saving application question:', err);
			setErrorMessage('Failed to save application question');
		}
	};

	// Delete a question also update state of the applicationQuestions for display
	const deleteQuestion = async (id: string): Promise<void> => {
		if (!currentTabId) return;

		try {
			// Get current questions for all tabs
			const result = await chrome.storage.local.get('tabApplicationQuestions');
			const tabQuestions = result.tabApplicationQuestions || {};

			// Filter out the deleted question for the current tab
			const currentTabQuestions = tabQuestions[currentTabId] || [];
			const updatedTabQuestions = currentTabQuestions.filter((q) => q.id !== id);

			// Update storage with the updated questions
			tabQuestions[currentTabId] = updatedTabQuestions;
			await chrome.storage.local.set({ tabApplicationQuestions: tabQuestions });

			// Update local state
			setSavedApplicationQuestions(updatedTabQuestions);
		} catch (err) {
			console.error('Error deleting application question:', err);
			setErrorMessage('Failed to delete application question');
		}
	};

	return {
		savedApplicationQuestions,
		saveQuestion,
		deleteQuestion,
		errorMessage,
	};
};
