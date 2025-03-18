import { DEV_API_BASE_URL } from '@/constants/environments';
import type { FilesStorageState } from '@/types/fileManagement';
import type {
	CoverLetterGenerationRequestInputs,
	CoverLetterGenerationResponse,
	ExtractedJobPostingDetails,
	JobPostingEvalResultResponse,
	ResumeSuggestionsResponse,
} from '@/types/suggestionGeneration';

export const evaluateJobPostingPageRequest = async (jobPostingPageContent: string) => {
	// create post request payload
	const requestPayload = {
		raw_job_html_content: jobPostingPageContent,
	};

	// all errors are handled on server side by fastapi
	const response = await fetch(`${DEV_API_BASE_URL}/api/v1/generation/job-posting/evaluate`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(requestPayload),
	});

	// Handle non-2xx responses
	if (!response.ok) {
		// fastapi will return a error json object with a "detail" key
		const error = await response.json();
		// directly throw the error, which will be caught later by the tanstack mutation process later
		throw new Error(error.detail);
	}
	// Parse and return the response
	const responseData = await response.json();
	return responseData as JobPostingEvalResultResponse;
};

export const generateResumeSuggestionRequest = async ({
	extractedJobPostingDetails,
	storedFilesObj,
}: {
	extractedJobPostingDetails: ExtractedJobPostingDetails;
	storedFilesObj: FilesStorageState;
}) => {
	const requestPayload = {
		extracted_job_posting_details: extractedJobPostingDetails,
		resume_doc: {
			base64_content: storedFilesObj.resume!.base64Content,
			file_type: storedFilesObj.resume!.fileType,
			name: storedFilesObj.resume!.name,
		},
	};

	const response = await fetch(`${DEV_API_BASE_URL}/api/v1/generation/resume/suggestions-generate`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(requestPayload),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.detail);
	}
	// Parse and return the response
	const responseData = await response.json();
	return responseData as ResumeSuggestionsResponse;
};

export const generateCoverLetterRequest = async ({
	extractedJobPostingDetails,
	storedFilesObj,
}: {
	extractedJobPostingDetails: ExtractedJobPostingDetails;
	storedFilesObj: FilesStorageState;
}) => {
	const requestPayload: CoverLetterGenerationRequestInputs = {
		extracted_job_posting_details: extractedJobPostingDetails,
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

	const response = await fetch(`${DEV_API_BASE_URL}/api/v1/generation/cover-letter/generate`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(requestPayload),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.detail);
	}

	const responseData = await response.json();
	return responseData as CoverLetterGenerationResponse;
};
