import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useApplicationQuestions } from '@/hooks/useApplicationQuestions';
import type { FilesStorageState } from '@/types/fileManagement';
import type { ExtractedJobPostingDetails } from '@/types/suggestionGeneration';
import { CheckCircle, Copy, HelpCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';

type ApplicationQuestionsTabProps = {
	extractedJobPostingDetails: ExtractedJobPostingDetails;
	storedFilesObj: FilesStorageState;
};

const ApplicationQuestions = ({ extractedJobPostingDetails, storedFilesObj }: ApplicationQuestionsTabProps) => {
	const [copyStates, setCopyStates] = useState<{ [key: string]: boolean }>({});

	const {
		questionInput,
		setQuestionInput,
		additionalRequirementsInput,
		setAdditionalRequirementsInput,
		tabSpecificAnsweredQuestions,
		deleteQuestion,
		questionHandlingErrorMessage,
		mutation: { isError, error, isPending, mutate },
	} = useApplicationQuestions();

	// Handle copy to clipboard
	const handleCopy = (text: string, id: string) => {
		navigator.clipboard.writeText(text);
		setCopyStates((prev) => ({ ...prev, [id]: true }));
		setTimeout(() => {
			setCopyStates((prev) => ({ ...prev, [id]: false }));
		}, 2000);
	};

	return (
		<div className='space-y-6'>
			{/* Error Messages */}
			{questionHandlingErrorMessage && (
				<div className='mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600'>
					{questionHandlingErrorMessage}
				</div>
			)}

			{/* Question input form */}
			<div className='space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4'>
				<h3 className='text-sm font-medium'>Generate Answer for Application Questions</h3>

				<div className='space-y-2'>
					<div className='flex items-center justify-between'>
						<label htmlFor='question' className='text-xs font-medium text-gray-600'>
							Application Question *
						</label>
						<TooltipProvider delayDuration={300}>
							<Tooltip>
								<TooltipTrigger asChild>
									<HelpCircle className='h-4 w-4 text-gray-400' />
								</TooltipTrigger>
								<TooltipContent side='top' align='center'>
									<p className='max-w-xs text-xs'>
										Paste a question from the job application form that you need help answering.
									</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
					<Input id='question' value={questionInput} onChange={(e) => setQuestionInput(e.target.value)} />
				</div>

				<div className='space-y-2'>
					<div className='flex items-center justify-between'>
						<label htmlFor='requirements' className='text-xs font-medium text-gray-600'>
							Additional Requirements (Optional)
						</label>
						<TooltipProvider delayDuration={300}>
							<Tooltip>
								<TooltipTrigger asChild>
									<HelpCircle className='h-4 w-4 text-gray-400' />
								</TooltipTrigger>
								<TooltipContent side='top' align='center'>
									<p className='max-w-xs text-xs'>
										Add any specific requirements for how you want the answer to this question to be
										generated.
									</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
					<Input
						id='requirements'
						value={additionalRequirementsInput}
						onChange={(e) => setAdditionalRequirementsInput(e.target.value)}
					/>
				</div>

				<Button
					className='w-full'
					onClick={() =>
						mutate({
							questionInput,
							additionalRequirementsInput,
							extractedJobPostingDetails,
							storedFilesObj,
						})
					}
					disabled={isPending || !questionInput.trim()}
				>
					{isPending ? (
						<span className='flex items-center justify-center'>
							<span className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent'></span>
							Generating...
						</span>
					) : (
						'Generate Answer'
					)}
				</Button>

				{isError && (
					<div className='rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600'>
						{error instanceof Error ? error.message : 'An error occurred'}
					</div>
				)}
			</div>

			{/* show saved Questions and Answers */}
			{tabSpecificAnsweredQuestions.length > 0 && (
				<div className='space-y-4'>
					<h3 className='text-sm font-medium'>Your Saved Answers</h3>

					{tabSpecificAnsweredQuestions.map((item) => (
						<div key={item.id} className='rounded-lg border border-gray-200'>
							{/* Question header */}
							<div className='border-b bg-gray-50 p-3'>
								<div className='flex items-start justify-between'>
									<div>
										<h4 className='text-sm font-medium'>{item.question}</h4>
										<p className='mt-1 text-xs text-gray-500'>Generated on {item.createdAt}</p>
									</div>
									<Button
										variant='ghost'
										size='sm'
										onClick={() => deleteQuestion(item.id)}
										className='text-gray-500 hover:text-red-500'
									>
										<Trash2 className='h-4 w-4' />
									</Button>
								</div>
								{item.additionalRequirements && (
									<p className='mt-2 text-xs italic text-gray-500'>
										Requirements: {item.additionalRequirements}
									</p>
								)}
							</div>

							{/* Answer section */}
							<div className='p-3'>
								<div className='mb-2 flex items-center justify-between'>
									<h4 className='text-xs font-medium text-gray-500'>Generated Answer:</h4>
									<button
										className='rounded-full p-1 text-gray-500 hover:text-blue-600'
										onClick={() => handleCopy(item.answer || '', item.id)}
									>
										{copyStates[item.id] ? (
											<CheckCircle className='h-4 w-4 text-green-500' />
										) : (
											<Copy className='h-4 w-4' />
										)}
									</button>
								</div>
								<div className='whitespace-pre-line rounded-md border border-gray-200 bg-white p-3 text-sm'>
									{item.answer}
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Empty state */}
			{tabSpecificAnsweredQuestions.length === 0 && !isPending && (
				<div className='py-8 text-center text-gray-500'>
					<p className='text-sm'>No application questions answered yet</p>
					<p className='mt-1 text-xs'>Paste a question from your job application to get a tailored answer</p>
				</div>
			)}
		</div>
	);
};

export default ApplicationQuestions;
