import { DEV_API_BASE_URL } from '@/constants/environments';
import type { SuggestionGenerationRequest, SuggestionGenerationResponse } from '@/types/apis/suggestionGeneration';
import type { FilesStorageState } from '@/types/fileManagement';

export const generateSuggestionsRequest = async ({
	pageContent,
	storedFilesObj,
}: {
	pageContent: string;
	storedFilesObj: FilesStorageState;
}): Promise<SuggestionGenerationResponse> => {
	// Create the request payload
	const requestPayload: SuggestionGenerationRequest = {
		raw_job_html_content: pageContent,
		resume_doc: {
			base64_content: storedFilesObj.resume!.base64Content,
			file_type: storedFilesObj.resume!.fileType,
			name: storedFilesObj.resume!.name,
		},
	};

	if (storedFilesObj.supportingDocs.length > 0) {
		requestPayload.supporting_docs = storedFilesObj.supportingDocs.map((doc) => ({
			base64_content: doc.base64Content,
			file_type: doc.fileType,
			name: doc.name,
		}));
	}

	const response = await fetch(`${DEV_API_BASE_URL}/api/v1/generation/cv-suggestions`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(requestPayload),
	});

	// Handle non-2xx responses
	if (!response.ok) {
		const error = await response.json();
		// directly throw the error, which will be caught later by the tanstack mutation process later
		// this detail directly comes from server side
		throw new Error(error.detail);
	}

	// Parse and return the response
	const responseData = await response.json();
	return responseData as SuggestionGenerationResponse;
};
