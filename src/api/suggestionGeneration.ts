import { DOMAIN_URL } from '@/constants/environments';
import type { FilesStorageState } from '@/types/fileManagement';
import type {
	ApplicationQuestionAnswerResponse,
	ApplicationQuestionGenerationRequestInputs,
	CoverLetterGenerationRequestInputs,
	CoverLetterGenerationResponse,
	ExtractedJobPostingDetails,
	FullResumeGenerationResponse,
	JobPostingEvalRequestInputs,
	JobPostingEvalResultResponse,
	ResumeGenerationRequestInputs,
	ResumeSuggestionsResponse,
} from '@/types/suggestionGeneration';

export const evaluateJobPostingPageRequest = async ({
	websiteUrl,
	jobPostingContent,
}: {
	websiteUrl?: string;
	jobPostingContent?: string;
}) => {
	// create post request payload
	const requestPayload: JobPostingEvalRequestInputs = {
		website_url: websiteUrl,
		job_posting_content: jobPostingContent,
	};

	// all errors are handled on server side by fastapi
	const response = await fetch(`${DOMAIN_URL}/api/v1/generation/job-posting/evaluate`, {
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

// ----------------------------------------------------------------------------------------

export const generateResumeSuggestionRequest = async ({
	extractedJobPostingDetails,
	storedFilesObj,
}: {
	extractedJobPostingDetails: ExtractedJobPostingDetails;
	storedFilesObj: FilesStorageState;
}) => {
	const requestPayload: ResumeGenerationRequestInputs = {
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

	const response = await fetch(`${DOMAIN_URL}/api/v1/generation/resume-suggestions/generate`, {
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

// ----------------------------------------------------------------------------------------

export const generateFullResumeRequest = async ({
	extractedJobPostingDetails,
	storedFilesObj,
}: {
	extractedJobPostingDetails: ExtractedJobPostingDetails;
	storedFilesObj: FilesStorageState;
}) => {
	const requestPayload: ResumeGenerationRequestInputs = {
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

	const response = await fetch(`${DOMAIN_URL}/api/v1/generation/resume/generate`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(requestPayload),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.detail);
	}

	const responseData = await response.json();
	return responseData as FullResumeGenerationResponse;
};

// ----------------------------------------------------------------------------------------

export const generateCoverLetterRequest = async ({
	extractedJobPostingDetails,
	storedFilesObj,
	browserId,
}: {
	extractedJobPostingDetails: ExtractedJobPostingDetails;
	storedFilesObj: FilesStorageState;
	browserId: string;
}) => {
	const requestPayload: CoverLetterGenerationRequestInputs = {
		browser_id: browserId,
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

	const response = await fetch(`${DOMAIN_URL}/api/v1/generation/cover-letter/generate`, {
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

// ----------------------------------------------------------------------------------------

export const generateApplicationQuestionAnswerRequest = async ({
	questionInput,
	additionalRequirementsInput,
	extractedJobPostingDetails,
	storedFilesObj,
}: {
	questionInput: string;
	additionalRequirementsInput?: string;
	extractedJobPostingDetails: ExtractedJobPostingDetails;
	storedFilesObj: FilesStorageState;
}) => {
	const requestPayload: ApplicationQuestionGenerationRequestInputs = {
		extracted_job_posting_details: extractedJobPostingDetails,
		resume_doc: {
			base64_content: storedFilesObj.resume!.base64Content,
			file_type: storedFilesObj.resume!.fileType,
			name: storedFilesObj.resume!.name,
		},
		question: questionInput,
	};

	// Add supporting documents if available
	if (storedFilesObj.supportingDocs.length > 0) {
		requestPayload.supporting_docs = storedFilesObj.supportingDocs.map((doc) => ({
			base64_content: doc.base64Content,
			file_type: doc.fileType,
			name: doc.name,
		}));
	}

	// Add additional requirements if provided
	if (additionalRequirementsInput) {
		requestPayload.additional_requirements = additionalRequirementsInput;
	}

	const response = await fetch(`${DOMAIN_URL}/api/v1/generation/application-question/answer`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(requestPayload),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.detail);
	}

	const responseData = await response.json();
	return responseData as ApplicationQuestionAnswerResponse;
};
