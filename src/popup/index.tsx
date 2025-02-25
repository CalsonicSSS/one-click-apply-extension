import { generateSuggestionsRequest, type SuggestionGenerationResponse } from '@/api/suggestionGeneration';
import { Button } from '@/components/ui/button';
import { useFileManagement } from '@/hooks/useFileManagement';
import { extractPageContentFromActiveTab } from '@/utils/tabContentExtractor';
import { FileIcon, Trash2, Upload } from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';
import '../globals.css';

const IndexPopup = () => {
	const { storedFilesObj, isLoading, uploadAndStoreFile, removeFile, fileHandlingErrorMessage } = useFileManagement();
	const resumeInputRef = useRef<HTMLInputElement>(null);
	const supportingInputRef = useRef<HTMLInputElement>(null);

	const [isGenerating, setIsGenerating] = useState(false);
	const [generationError, setGenerationError] = useState<string | null>(null);
	const [suggestionResults, setSuggestionResults] = useState<SuggestionGenerationResponse | null>(null);

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

	// Function to handle the "Generate Suggestions" button click
	const handleGenerateSuggestions = async () => {
		setGenerationError(null);
		setSuggestionResults(null); // Clear any previous results

		// Check if a resume is uploaded
		if (!storedFilesObj.resume) {
			setGenerationError('Please upload your resume first before generating suggestions');
			return;
		}

		try {
			setIsGenerating(true);

			// Extract content from the active tab
			const pageExtractedResult = await extractPageContentFromActiveTab();

			const suggestionGenerationResult = await generateSuggestionsRequest(
				pageExtractedResult.pageContent,
				storedFilesObj,
			);

			setSuggestionResults(suggestionGenerationResult);

			// TODO: In the next step, we'll add code here to send this to the backend API
		} catch (error) {
			console.error('Error during suggestion generation process:', error);
			setGenerationError(error.message);
		} finally {
			setIsGenerating(false);
		}
	};

	if (isLoading) {
		return (
			<div className='flex min-h-[500px] w-[400px] items-center justify-center p-6'>
				<div className='animate-pulse text-gray-500'>Loading...</div>
			</div>
		);
	}

	return (
		<div className='min-h-[500px] w-[400px] p-6'>
			<div className='flex flex-col'>
				{/* Header */}
				<div className='mb-6'>
					<h1 className='text-2xl font-bold text-gray-900'>Your Wise Craft</h1>
					<p className='mt-1 text-sm text-gray-500'>Upload your documents to get started</p>
				</div>

				{/* File handling Error Message */}
				{fileHandlingErrorMessage && (
					<div className='rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600'>
						{fileHandlingErrorMessage}
					</div>
				)}

				{generationError && (
					<div className='mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600'>
						{generationError}
					</div>
				)}

				{/* Resume Upload Buttons */}
				<div>
					<Button
						variant='outline'
						className='h-12 w-full bg-blue-600 text-white hover:bg-blue-700 hover:text-green-400'
						onClick={() => resumeInputRef.current?.click()}
					>
						<Upload className='mr-2 h-4 w-4' />
						Resume*
					</Button>

					<input
						ref={resumeInputRef}
						type='file'
						className='hidden'
						onChange={(e) => handleFileChange(e, 'resume')}
						accept='.pdf,.doc,.docx,.txt'
					/>
				</div>

				{/* resume file */}
				<div className='mb-8 mt-4'>
					{storedFilesObj.resume ? (
						<div className='rounded-lg bg-gray-100 px-4 py-3'>
							<div className='flex items-center justify-between'>
								<div className='flex items-center space-x-3'>
									<div className='rounded-md bg-white p-2 shadow-sm'>
										<FileIcon className='h-4 w-4 text-blue-500' />
									</div>
									<div>
										<p className='text-sm font-medium text-gray-900'>
											{storedFilesObj.resume.name}
										</p>
										<p className='text-xs text-gray-500'>Resume</p>
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
						</div>
					) : (
						<p className='flex items-center justify-center text-sm text-gray-500'>
							Please Submit your base resume
						</p>
					)}
				</div>

				{/* ---------------------------------------------------------------------------------------------------------- */}
				{/* supporting Upload Buttons */}

				<div>
					<Button
						variant='outline'
						className='h-12 w-full flex-1 bg-blue-600 text-white hover:bg-blue-700 hover:text-green-400'
						onClick={() => supportingInputRef.current?.click()}
					>
						<Upload className='mr-2 h-4 w-4' />
						Supporting Docs (optional)
					</Button>
					<input
						ref={supportingInputRef}
						type='file'
						className='hidden'
						onChange={(e) => handleFileChange(e, 'supporting')}
						accept='.pdf,.doc,.docx,.txt'
					/>
				</div>

				{/* Supporting Files */}
				{storedFilesObj.supportingDocs.length === 0 ? (
					<p className='mb-10 mt-4 text-center text-sm text-gray-500'>
						More documents to support your application <br />
						Better suggestions for you
					</p>
				) : (
					<div className='mt-4 space-y-4'>
						{storedFilesObj.supportingDocs.map((doc) => (
							<div key={doc.id} className='rounded-lg bg-gray-50 px-4 py-3'>
								<div className='flex items-center justify-between'>
									<div className='flex items-center space-x-3'>
										<div className='rounded-md bg-white p-2 shadow-sm'>
											<FileIcon className='h-4 w-4 text-green-500' />
										</div>
										<div>
											<p className='text-sm font-medium text-gray-900'>{doc.name}</p>
											<p className='text-xs text-gray-500'>Supporting Document</p>
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
							</div>
						))}
					</div>
				)}
				<div className='mt-8'>
					<Button
						variant='default'
						className='h-12 w-full bg-green-600 text-white hover:bg-green-700'
						onClick={handleGenerateSuggestions}
						disabled={isGenerating}
					>
						{isGenerating ? (
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
		</div>
	);
};

export default IndexPopup;
