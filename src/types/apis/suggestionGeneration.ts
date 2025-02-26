export type SuggestionGenerationRequest = {
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
	company_name: string;
	job_title_name: string;
	resume_suggestions: ResumeSuggestion[];
	cover_letter: string;
};
