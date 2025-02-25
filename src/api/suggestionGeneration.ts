import type { FilesStorageState } from '@/types/fileManagement';

type SuggestionGenerationRequest = {
	raw_job_html_content: string;
	resume_doc: {
		base64_content: string;
		file_type: string;
		name: string;
	};
	supporting_docs?: {
		base64_content: string;
		file_type: string;
		name: string;
	}[];
};

export type ResumeSuggestion = {
	where: string;
	suggestion: string;
	reason: string;
};

export type SuggestionGenerationResponse = {
	resume_suggestions: ResumeSuggestion[];
	cover_letter: string;
};

const API_BASE_URL = 'http://localhost:8000';

export const generateSuggestionsRequest = async (
	pageContent: string,
	filesStorageObj: FilesStorageState,
): Promise<SuggestionGenerationResponse> => {
	try {
		// Create the request payload
		const requestPayload: SuggestionGenerationRequest = {
			raw_job_html_content: pageContent,
			resume_doc: {
				base64_content: filesStorageObj.resume!.base64Content,
				file_type: filesStorageObj.resume!.fileType,
				name: filesStorageObj.resume!.name,
			},
		};

		// Add supporting docs if available
		if (filesStorageObj.supportingDocs.length > 0) {
			requestPayload.supporting_docs = filesStorageObj.supportingDocs.map((doc) => ({
				base64_content: doc.base64Content,
				file_type: doc.fileType,
				name: doc.name,
			}));
		}

		// Send the request to the backend
		const response = await fetch(`${API_BASE_URL}/api/v1/generation/cv-suggestions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(requestPayload),
		});

		// Handle non-2xx responses
		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.detail);
		}

		// Parse and return the response
		const data = await response.json();
		return data as SuggestionGenerationResponse;
	} catch (error) {
		console.error('Failed to request suggestion generation:', error);
		throw error;
	}
};
