import CoverLetterSuggestion from '@/components/SuggestionResults/CoverLetterSuggestion';
import ResumeSuggestions from '@/components/SuggestionResults/ResumeSuggestions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type SuggestionGenerationResponse } from '@/types/suggestionGeneration';
import { useState } from 'react';

type SuggestionTabProps = {
	suggestionResults: SuggestionGenerationResponse | null | undefined;
};

const SuggestionTab = ({ suggestionResults }: SuggestionTabProps) => {
	const [innerTab, setInnerTab] = useState<'resume' | 'coverLetter'>('resume');

	if (!suggestionResults) {
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
				<h2 className='text-base font-medium'>{suggestionResults.job_title_name}</h2>
				<p className='text-sm text-gray-500'>Company: {suggestionResults.company_name}</p>
			</div>

			<Tabs
				value={innerTab}
				onValueChange={(value) => setInnerTab(value as 'resume' | 'coverLetter')}
				className='flex flex-1 flex-col'
			>
				<TabsList className='mb-4 grid w-full grid-cols-2 text-sm'>
					<TabsTrigger value='resume'>Resume Suggestions</TabsTrigger>
					<TabsTrigger value='coverLetter'>Cover Letter</TabsTrigger>
				</TabsList>

				<TabsContent value='resume' className='flex-1 overflow-auto'>
					<ResumeSuggestions suggestions={suggestionResults.resume_suggestions} />
				</TabsContent>

				<TabsContent value='coverLetter' className='flex-1 overflow-auto'>
					<CoverLetterSuggestion
						coverLetter={suggestionResults.cover_letter}
						applicant_name={suggestionResults.applicant_name}
						jobTitle={suggestionResults.job_title_name}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default SuggestionTab;
