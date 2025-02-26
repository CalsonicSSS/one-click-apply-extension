import FileTypeIcon from '@/components/FileTypeIcon';
import SuggestionDisplayPanel from '@/components/SuggestionResults/SuggestionDisplayPanel';
import { Button } from '@/components/ui/button';
import { MAX_TOTAL_STORAGE_SIZE } from '@/constants/fileManagement';
import { useFileManagement } from '@/hooks/useFileManagement';
import { useSuggestionGenerationProcess } from '@/hooks/useSuggestionGeneration';
import { Trash2, Upload } from 'lucide-react';
import { useRef, type ChangeEvent } from 'react';
import '../globals.css';

const PopupMain = () => {
	const {
		storedFilesObj,
		isLoading,
		uploadAndStoreFile,
		removeFile,
		fileHandlingErrorMessage,
		totalStorageUsed,
		storagePercentage,
	} = useFileManagement();

	const {
		mutation: {
			isError: isSuggestionGenerationError,
			error: suggestionGenerationError,
			isPending: isSuggestionGenerationPending,
			data: suggestionGenerationData,
			mutate: suggestionGenerationMutate,
		},
		showResults,
		setShowResults,
	} = useSuggestionGenerationProcess(storedFilesObj);

	const handleFileChange = async (
		event: ChangeEvent<HTMLInputElement>,
		fileCategoryType: 'resume' | 'supporting',
	) => {
		const file = event.target.files?.[0];
		if (file) {
			await uploadAndStoreFile(file, fileCategoryType);
			event.target.value = '';
		}
	};

	const resumeInputRef = useRef<HTMLInputElement>(null);
	const supportingInputRef = useRef<HTMLInputElement>(null);

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	if (isLoading) {
		return (
			<div className='flex min-h-[500px] w-[400px] items-center justify-center p-6'>
				<div className='animate-pulse text-gray-500'>Loading...</div>
			</div>
		);
	}

	return (
		<div className='min-h-[500px] w-[500px] p-6'>
			<div className='flex flex-col'>
				{/* Header */}
				<div className='mb-6 flex items-center justify-between'>
					<div>
						<h1 className='text-2xl font-bold text-gray-900'>Wise Craft</h1>
						<p className='mt-1 w-[150px] text-sm text-gray-500'>Upload resume to start</p>
					</div>

					<div className='flex space-x-2'>
						<Button
							variant='outline'
							size='sm'
							className='flex items-center bg-blue-600 text-white hover:bg-blue-700'
							onClick={() => resumeInputRef.current?.click()}
						>
							<Upload className='mr-1 h-3.5 w-3.5' />
							Resume*
						</Button>

						<Button
							variant='outline'
							size='sm'
							className='flex items-center bg-blue-600 text-white hover:bg-blue-700'
							onClick={() => supportingInputRef.current?.click()}
						>
							<Upload className='mr-1 h-3.5 w-3.5' />
							Supporting
						</Button>

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
				</div>

				{/* File handling Error Message */}
				{fileHandlingErrorMessage && (
					<div className='mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600'>
						{fileHandlingErrorMessage}
					</div>
				)}

				{/* Storage capacity bar */}
				<div className='mb-4'>
					<div className='mb-1 flex justify-between text-xs text-gray-500'>
						<span>{Math.round(totalStorageUsed / 1024)} KB used</span>
						<span>{Math.round(MAX_TOTAL_STORAGE_SIZE / 1024 / 1024)} MB capacity</span>
					</div>
					<div className='h-1.5 w-full overflow-hidden rounded-full bg-gray-200'>
						<div
							className='h-full rounded-full bg-blue-600'
							style={{ width: `${storagePercentage}%` }}
						></div>
					</div>
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

				{isSuggestionGenerationError && (
					<div className='mb-2 mt-8 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600'>
						{suggestionGenerationError.message}
					</div>
				)}

				{/* Generate Button */}
				<div className={`${isSuggestionGenerationError ? 'mt-0' : 'mt-8'}`}>
					<Button
						variant='default'
						className='h-12 w-full bg-green-600 text-white hover:bg-green-700'
						onClick={() => {
							suggestionGenerationMutate();
						}}
						disabled={isSuggestionGenerationPending || !storedFilesObj.resume}
					>
						{isSuggestionGenerationPending ? (
							<span className='flex items-center justify-center'>
								<span className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent'></span>
								Generating...
							</span>
						) : (
							'Generate Suggestions & Cover Letter'
						)}
					</Button>
				</div>
			</div>

			{/* Results Display */}
			{showResults && suggestionGenerationData && (
				<SuggestionDisplayPanel
					results={suggestionGenerationData}
					onClose={() => {
						setShowResults(false);
					}}
				/>
			)}
		</div>
	);
};

export default PopupMain;
