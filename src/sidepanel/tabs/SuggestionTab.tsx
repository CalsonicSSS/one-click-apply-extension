import ApplicationQuestions from '@/components/SuggestionResults/ApplicationQuestion';
import CoverLetterSuggestion from '@/components/SuggestionResults/CoverLetterSuggestion';
import ResumeSuggestions from '@/components/SuggestionResults/ResumeSuggestions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApplicationQuestions } from '@/hooks/useApplicationQuestions';
import type { FilesStorageState } from '@/types/fileManagement';
import { type FullSuggestionGeneration } from '@/types/suggestionGeneration';
import { useState } from 'react';

type SuggestionTabProps = {
	fullSuggestionResults: FullSuggestionGeneration | null | undefined;
	storedFilesObj: FilesStorageState;
	currentTabId: number | null;
};

const SuggestionTab = ({ fullSuggestionResults, storedFilesObj, currentTabId }: SuggestionTabProps) => {
	const [innerTab, setInnerTab] = useState<'resume' | 'coverLetter' | 'applicationQuestions'>('resume');

	const {
		savedApplicationQuestions,
		saveQuestion,
		deleteQuestion,
		errorMessage: applicationQuestionsError,
	} = useApplicationQuestions(currentTabId);

	if (!fullSuggestionResults) {
		return (
			<div className='flex h-full items-center justify-center'>
				<p className='max-w-md text-center text-gray-500'>
					No suggestion results available yet. Generate suggestions from the Profile tab first.
				</p>
			</div>
		);
	}

	return (
		<div className='flex h-full flex-col'>
			<div className='mb-4'>
				<h2 className='text-base font-medium'>{fullSuggestionResults.job_title_name}</h2>
				<p className='text-sm text-gray-500'>Company: {fullSuggestionResults.company_name}</p>
			</div>

			<Tabs
				value={innerTab}
				onValueChange={(value) => setInnerTab(value as 'resume' | 'coverLetter' | 'applicationQuestions')}
				className='flex flex-1 flex-col'
			>
				<TabsList className='mb-4 grid w-full grid-cols-3 text-sm'>
					<TabsTrigger value='resume'>Resume</TabsTrigger>
					<TabsTrigger value='coverLetter'>Cover Letter</TabsTrigger>
					<TabsTrigger value='applicationQuestions'>Questions</TabsTrigger>
				</TabsList>

				<TabsContent value='resume' className='flex-1 overflow-auto'>
					<ResumeSuggestions suggestions={fullSuggestionResults.resume_suggestions} />
				</TabsContent>

				<TabsContent value='coverLetter' className='flex-1 overflow-auto'>
					<CoverLetterSuggestion
						coverLetter={fullSuggestionResults.cover_letter}
						applicant_name={fullSuggestionResults.applicant_name}
						jobTitle={fullSuggestionResults.job_title_name}
					/>
				</TabsContent>

				<TabsContent value='applicationQuestions' className='flex-1 overflow-auto'>
					{applicationQuestionsError && (
						<div className='mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600'>
							{applicationQuestionsError}
						</div>
					)}
					<ApplicationQuestions
						extractedJobPostingDetails={fullSuggestionResults.extracted_job_posting_details}
						storedFilesObj={storedFilesObj}
						savedApplicationQuestions={savedApplicationQuestions}
						onSaveQuestion={saveQuestion}
						onDeleteQuestion={deleteQuestion}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default SuggestionTab;
