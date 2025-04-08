import { CreditManager } from '@/components/CreditManager';
import FileTypeIcon from '@/components/FileTypeIcon';
import GenerationProgressBar from '@/components/GenerationProgressBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { FilesStorageState } from '@/types/fileManagement';
import { GenerationStage, type GenerationProgress } from '@/types/progressTracking';
import { HelpCircle, Trash2, Upload } from 'lucide-react';
import { useRef, type ChangeEvent } from 'react';

type ProfileTabProps = {
	storedFilesObj: FilesStorageState;
	fileHandlingErrorMessage: string | null;
	sugguestionAndCreditLoadingErrMsg: string | null;
	uploadFile: (file: File, docCategoryType: 'resume' | 'supporting') => Promise<void>;
	removeFile: (id: string, docCategoryType: 'resume' | 'supporting') => Promise<void>;
	isSuggestionGenerationError: boolean;
	suggestionGenerationError: Error;
	isSuggestionGenerationPending: boolean;
	onGenerateSuggestions: () => void;
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
	onGenerateSuggestions,
	generationProgress,
	browserId,
	credits,
	jobPostingContent,
	setJobPostingContent,
}: ProfileTabProps) => {
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
						<p className='mt-1 font-bold'>Upload your resume to get started</p>
					</div>
				)}
			</div>

			{/* Job posting input content by user */}
			{/* <div className='space-y-2'>
				<div className='flex items-center justify-between'>
					<label htmlFor='job content' className='text-xs font-medium text-gray-600'>
						Job Posting Content *
					</label>
					<TooltipProvider delayDuration={300}>
						<Tooltip>
							<TooltipTrigger asChild>
								<HelpCircle className='h-4 w-4 text-gray-400' />
							</TooltipTrigger>
							<TooltipContent side='top' align='center'>
								<p className='max-w-xs text-xs'>Paste job content here to get started! 🚀</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
				<Input
					id='job content'
					value={jobPostingContent}
					onChange={(e) => setJobPostingContent(e.target.value)}
				/>
			</div> */}
			{/* Generate Button */}
			<Button
				variant='default'
				className='h-12 w-full hover:opacity-90'
				onClick={onGenerateSuggestions}
				disabled={isSuggestionGenerationPending || !storedFilesObj.resume}
			>
				{isSuggestionGenerationPending ? (
					<span className='flex items-center justify-center'>
						<span className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent'></span>
						Generating...
					</span>
				) : (
					'Generate Suggestions'
				)}
			</Button>

			{/* Suggestion generation error */}
			{isSuggestionGenerationError && (
				<div className='rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600'>
					{suggestionGenerationError.message}
				</div>
			)}

			{/* Add progress bar below the button */}
			{showProgressBar && <GenerationProgressBar progress={generationProgress} className='mt-2' />}

			{/* This will take up remaining space */}
			<div className='flex-grow'></div>

			{/* Credit Manager */}
			<CreditManager browserId={browserId} credits={credits} />

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
