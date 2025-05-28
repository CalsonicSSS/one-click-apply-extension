import { CreditManager } from '@/components/CreditManager';
import FileTypeIcon from '@/components/FileTypeIcon';
import GenerationProgressBar from '@/components/GenerationProgressBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { FilesStorageState } from '@/types/fileManagement';
import { GenerationStage, type GenerationProgress } from '@/types/progressTracking';
import { Trash2, Upload } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';

type ProfileTabProps = {
	storedFilesObj: FilesStorageState;
	fileHandlingErrorMessage: string | null;
	sugguestionAndCreditLoadingErrMsg: string | null;
	uploadFile: (file: File, docCategoryType: 'resume' | 'supporting') => Promise<void>;
	removeFile: (id: string, docCategoryType: 'resume' | 'supporting') => Promise<void>;
	isSuggestionGenerationError: boolean;
	suggestionGenerationError: Error;
	isSuggestionGenerationPending: boolean;
	handleGenerateSuggestions: () => void;
	generationProgress: GenerationProgress | null;
	browserId: string | null;
	credits: null | number;
	jobPostingContent: string;
	setJobPostingContent: React.Dispatch<React.SetStateAction<string>>;
};

const ProfileTab = ({
	storedFilesObj,
	fileHandlingErrorMessage,
	sugguestionAndCreditLoadingErrMsg,
	uploadFile,
	removeFile,
	isSuggestionGenerationError,
	suggestionGenerationError,
	isSuggestionGenerationPending,
	handleGenerateSuggestions,
	generationProgress,
	browserId,
	credits,
	jobPostingContent,
	setJobPostingContent,
}: ProfileTabProps) => {
	const [isUserInputNeeded, setIsUserInputNeeded] = useState<boolean>(false);
	const [isPersistingUserInputNeeded, setIsPersistingUserInputNeeded] = useState<boolean>(false);
	const resumeInputRef = useRef<HTMLInputElement>(null);
	const supportingInputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = async (
		event: ChangeEvent<HTMLInputElement>,
		fileCategoryType: 'resume' | 'supporting',
	) => {
		const file = event.target.files?.[0];
		if (file) {
			await uploadFile(file, fileCategoryType);
			event.target.value = '';
		}
	};

	const showProgressBar =
		isSuggestionGenerationPending || generationProgress?.stagePercentage === GenerationStage.COMPLETED;

	useEffect(() => {
		if (
			isSuggestionGenerationError &&
			(suggestionGenerationError?.message === 'firecrawl error' ||
				suggestionGenerationError?.message === 'No content error')
		) {
			setIsUserInputNeeded(true);
		}
	}, [isSuggestionGenerationError, suggestionGenerationError]);

	useEffect(() => {
		if (jobPostingContent !== null) {
			setIsPersistingUserInputNeeded(true);
		}
	}, [jobPostingContent]);

	return (
		<div className='flex h-full flex-col space-y-6'>
			{/* Error messages */}
			{fileHandlingErrorMessage && (
				<div className='rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600'>
					{fileHandlingErrorMessage}
				</div>
			)}
			{sugguestionAndCreditLoadingErrMsg && (
				<div className='rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600'>
					{sugguestionAndCreditLoadingErrMsg}
				</div>
			)}
			{/* File upload buttons */}
			<div className='grid w-full grid-cols-2 gap-x-3'>
				<Button
					variant='default'
					size='sm'
					className='items-center hover:opacity-90'
					onClick={() => resumeInputRef.current?.click()}
				>
					<Upload className='mr-1 h-3.5 w-3.5' />
					{'Resume *'}
				</Button>
				<TooltipProvider delayDuration={300}>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant='default'
								size='sm'
								className='items-center hover:opacity-90'
								onClick={() => supportingInputRef.current?.click()}
							>
								<Upload className='mr-1 h-3.5 w-3.5' />
								Additional
							</Button>
						</TooltipTrigger>
						<TooltipContent
							side='top'
							align='center'
							className='w-[180px] rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-lg'
						>
							<p className='text-center'>
								Add more details like a base cover letter or other relevant context for better results.
							</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>

				{/* Hidden file inputs */}
				<input
					ref={resumeInputRef}
					type='file'
					className='hidden'
					onChange={(e) => handleFileChange(e, 'resume')}
					accept='.pdf,.docx,.txt'
				/>
				<input
					ref={supportingInputRef}
					type='file'
					className='hidden'
					onChange={(e) => handleFileChange(e, 'supporting')}
					accept='.pdf,.docx,.txt'
				/>
			</div>
			{/* Files Section */}
			<div className='space-y-2'>
				{/* Resume File */}
				{storedFilesObj.resume && (
					<div className='flex items-center justify-between rounded-lg bg-gray-50 p-3'>
						<div className='flex items-center space-x-3'>
							<FileTypeIcon fileType={storedFilesObj.resume.fileType} />
							<div>
								<p className='text-sm font-medium text-gray-900'>{storedFilesObj.resume.name}</p>
								<p className='text-xs text-gray-500'>Resume • {storedFilesObj.resume.uploadedAt}</p>
							</div>
						</div>
						<Button
							variant='ghost'
							size='sm'
							onClick={() => removeFile(storedFilesObj.resume!.id, 'resume')}
							className='text-gray-500 hover:text-red-500'
						>
							<Trash2 className='h-4 w-4' />
						</Button>
					</div>
				)}

				{/* Supporting Documents */}
				{storedFilesObj.supportingDocs.map((doc) => (
					<div key={doc.id} className='flex items-center justify-between rounded-lg bg-gray-50 p-3'>
						<div className='flex items-center space-x-3'>
							<FileTypeIcon fileType={doc.fileType} />
							<div>
								<p className='text-sm font-medium text-gray-900'>{doc.name}</p>
								<p className='text-xs text-gray-500'>Supporting Document • {doc.uploadedAt}</p>
							</div>
						</div>
						<Button
							variant='ghost'
							size='sm'
							onClick={() => removeFile(doc.id, 'supporting')}
							className='text-gray-500 hover:text-red-500'
						>
							<Trash2 className='h-4 w-4' />
						</Button>
					</div>
				))}

				{/* Empty state if no files */}
				{!storedFilesObj.resume && storedFilesObj.supportingDocs.length === 0 && (
					<div className='py-10 text-center text-gray-500'>
						<p className='text-sm'>No documents uploaded yet</p>
						<p className='mt-1 font-bold'>Upload your base resume to get started</p>
					</div>
				)}
			</div>

			{/* isUserInputNeeded: handle firecrawl error and let user to copy paste job posting content directly with error message */}
			{(isUserInputNeeded || isPersistingUserInputNeeded) && (
				<div className='space-y-2'>
					<div className='mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-500'>
						We can't auto access this site yet 🥺 Let's paste the job posting content below 💪
					</div>
					<Input
						id='job content'
						value={jobPostingContent ?? ''}
						placeholder='Paste the job posting detail here...'
						className='resize-none rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-0 focus-visible:outline-none'
						onChange={(e) => setJobPostingContent(e.target.value)}
					/>
				</div>
			)}

			{/* Generate Button */}
			<Button
				variant='default'
				className='h-12 w-full hover:opacity-90'
				onClick={handleGenerateSuggestions}
				disabled={isSuggestionGenerationPending || !storedFilesObj.resume || credits === null || credits === 0}
			>
				{isSuggestionGenerationPending ? (
					<div className='flex items-center justify-center'>
						<span className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
						Generating...
					</div>
				) : (
					'Generate Suggestions'
				)}
			</Button>

			{/* Suggestion generation error (For non firecrawl related error) */}
			{isSuggestionGenerationError && suggestionGenerationError?.message !== 'firecrawl error' && (
				<div className='rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-500'>
					{suggestionGenerationError?.message}
				</div>
			)}

			{/* Add progress bar below the button */}
			{showProgressBar && <GenerationProgressBar progress={generationProgress} className='mt-2' />}

			{/* This will take up remaining space */}
			<div className='flex-grow'></div>

			{/* user credits section */}
			<div>
				{/* purchase more credit message */}

				{credits === 0 && (
					<div className='mb-6 rounded-lg border border-yellow-300 bg-yellow-100 p-3 text-sm text-yellow-600'>
						Lets supercharge and get more credits 🏃‍♂️💨
					</div>
				)}

				{/* Credit Manager components */}
				{credits !== null ? (
					<CreditManager browserId={browserId} credits={credits} />
				) : (
					<div className='flex h-10 items-center justify-center'>
						<div className='h-5 w-5 animate-spin rounded-full border-2 border-gray-500 border-t-transparent' />
						<p className='ml-5 text-sm'>loading your credits</p>
					</div>
				)}
			</div>

			{/* Your Feedback & Rant Button at the very bottom */}
			<Button
				variant='default'
				className='h-12 w-full bg-[#6D28D9] hover:opacity-90'
				onClick={() =>
					window.open(
						'https://docs.google.com/forms/d/e/1FAIpQLSe_-b3fbDMQbN4UB68wKA-VlRsle28grwBbG3CgxyqO_Uiylg/viewform?usp=header',
						'_blank',
					)
				}
			>
				{' Your Feedback & Rant 🥶💥☢️'}
			</Button>
		</div>
	);
};

export default ProfileTab;
