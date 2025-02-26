import { generateSuggestionsRequest } from '@/api/suggestionGeneration';
import type { FilesStorageState } from '@/types/fileManagement';
import { extractPageContentFromActiveTab } from '@/utils/tabContentExtractor';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

export const useSuggestionGenerationProcess = (storedFilesObj: FilesStorageState) => {
	const [showResults, setShowResults] = useState(false);

	const handleGenerateSuggestionsProcess = async () => {
		setShowResults(false);

		// Check if a resume is uploaded
		if (!storedFilesObj.resume) {
			throw new Error('Please upload your resume first before generating suggestions');
		}

		const pageExtractedResponse = await extractPageContentFromActiveTab();

		// Send generation request
		const suggestionGenerationResponse = await generateSuggestionsRequest({
			pageContent: pageExtractedResponse.pageContent,
			storedFilesObj: storedFilesObj,
		});

		setShowResults(true);
		return suggestionGenerationResponse;
	};

	const mutation = useMutation({
		mutationFn: handleGenerateSuggestionsProcess,
	});

	return { mutation, showResults, setShowResults };
};
