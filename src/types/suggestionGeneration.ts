export type UploadedDocument = {
	base64_content: string;
	file_type: string;
	name: string;
};

// ----------------------------------------------------------------------------------------

export type ExtractedJobPostingDetails = {
	job_title: string;
	company_name: string;
	job_description: string;
	responsibilities: string[];
	requirements: string[];
	location: string;
	other_additional_details: string;
};

export type JobPostingEvalRequestInputs = {
	// job_posting_content: string;
	browser_id: string;
	website_url: string;
};

export type JobPostingEvalResultResponse = {
	is_job_posting: boolean;
	extracted_job_posting_details: ExtractedJobPostingDetails;
};

// ----------------------------------------------------------------------------------------

export type ResumeGenerationRequestInputs = {
	extracted_job_posting_details: ExtractedJobPostingDetails;
	resume_doc: UploadedDocument;
	supporting_docs?: UploadedDocument[];
};

export type ResumeSuggestion = {
	where: string;
	suggestion: string;
	reason: string;
};

export type ResumeSuggestionsResponse = {
	resume_suggestions: ResumeSuggestion[];
};

export type ResumeSection = {
	title: string;
	content: string;
};

export type FullResumeGenerationResponse = {
	applicant_name: string;
	contact_info: string;
	summary: string;
	skills: string[];
	sections: ResumeSection[];
	full_resume_text: string;
};

// ----------------------------------------------------------------------------------------

export type CoverLetterGenerationRequestInputs = {
	extracted_job_posting_details: ExtractedJobPostingDetails;
	resume_doc: UploadedDocument;
	supporting_docs?: UploadedDocument[];
};

export type CoverLetterGenerationResponse = {
	job_title_name: string;
	company_name: string;
	applicant_name: string;
	cover_letter: string;
	location: string;
};

// ----------------------------------------------------------------------------------------

export type AnsweredQuestion = {
	id: string;
	question: string;
	additionalRequirements?: string;
	answer: string;
	createdAt: string;
};

export type ApplicationQuestionGenerationRequestInputs = {
	extracted_job_posting_details: ExtractedJobPostingDetails;
	resume_doc: UploadedDocument;
	supporting_docs?: UploadedDocument[];
	additional_requirements?: string;
	question: string;
};

export type ApplicationQuestionAnswerResponse = {
	question: string;
	answer: string;
};

// ----------------------------------------------------------------------------------------

export type FullSuggestionGeneration = {
	job_title_name: string;
	company_name: string;
	applicant_name: string;
	cover_letter: string;
	location: string;
	resume_suggestions: ResumeSuggestion[];
	extracted_job_posting_details: ExtractedJobPostingDetails;
	full_resume: FullResumeGenerationResponse;
};
