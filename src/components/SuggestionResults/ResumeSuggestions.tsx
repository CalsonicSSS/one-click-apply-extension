import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { FullResumeGenerationResponse, ResumeSuggestion } from '@/types/suggestionGeneration';
import { handleDownloadResumeDocx, handleDownloadResumePdf } from '@/utils/resumeFormatDownload';
import { CheckCircle, Copy, Download, FileDown } from 'lucide-react';
import { useState } from 'react';

type ResumeSuggestionsProps = {
	suggestions: ResumeSuggestion[];
	fullResume: FullResumeGenerationResponse;
	jobTitle: string;
};

const ResumeSuggestions = ({ suggestions, fullResume, jobTitle }: ResumeSuggestionsProps) => {
	const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
	// const [copied, setCopied] = useState(false);
	const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
	const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);

	const handleCopySuggestion = (text: string, index: number) => {
		navigator.clipboard.writeText(text);
		setCopiedIndex(index);
		setTimeout(() => setCopiedIndex(null), 2000);
	};

	const onDownloadDocx = async () => {
		if (!fullResume) return;

		setIsDownloadingDocx(true);
		try {
			await handleDownloadResumeDocx({ fullResume, jobTitle });
		} finally {
			setIsDownloadingDocx(false);
		}
	};

	const onDownloadPdf = async () => {
		if (!fullResume) return;

		setIsDownloadingPdf(true);
		try {
			await handleDownloadResumePdf({ fullResume, jobTitle });
		} finally {
			setIsDownloadingPdf(false);
		}
	};

	return (
		<div className=''>
			{/* Full Resume Download Section */}
			{fullResume && (
				<div className='mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4'>
					<div className='mb-3 flex items-center justify-between'>
						<h3 className='text-sm font-medium'>Download Full Tailored Resume</h3>
						<div className='flex space-x-2'>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<button className='flex items-center rounded-md bg-white p-1.5 text-xs hover:bg-gray-100'>
										<Download className='mr-1 h-3.5 w-3.5' />
										<span>Download</span>
									</button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align='end' className='w-[200px]'>
									<DropdownMenuItem
										onClick={onDownloadDocx}
										disabled={isDownloadingDocx}
										className='cursor-pointer'
									>
										{isDownloadingDocx ? (
											<>
												<span className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600'></span>
												<span>Downloading...</span>
											</>
										) : (
											<>
												<FileDown className='mr-2 h-4 w-4' />
												<span className='hover:font-medium'>Raw Word (.docx)</span>
											</>
										)}
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={onDownloadPdf}
										disabled={isDownloadingPdf}
										className='cursor-pointer'
									>
										{isDownloadingPdf ? (
											<>
												<span className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600'></span>
												<span>Downloading...</span>
											</>
										) : (
											<>
												<FileDown className='mr-2 h-4 w-4' />
												<span className='hover:font-medium'>Formatted PDF (.pdf)</span>
											</>
										)}
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>
					<p className='text-xs text-gray-600'>
						Use these buttons to download a complete, tailored resume ready for submission.
					</p>
				</div>
			)}

			{/* Individual Suggestions */}
			<h3 className='mb-3 text-sm font-medium'>Suggested Improvements</h3>
			{suggestions.map((suggestion, index) => (
				<div key={index} className='mb-8 overflow-hidden rounded-lg border border-gray-200'>
					{/* Location in resume */}
					<div className='border-b bg-gray-50 px-4 py-2'>
						<h3 className='text-sm font-medium'>Resume location:</h3>
						<p className='text-xs text-gray-600'>{suggestion.where}</p>
					</div>

					{/* Suggested change */}
					<div className='border-b px-4 py-3'>
						<div className='mb-2 flex items-start justify-between'>
							<h3 className='mb-1 text-sm font-medium'>Suggested change:</h3>
							<button
								className='rounded-full p-1 text-gray-500 hover:text-blue-600'
								onClick={() => handleCopySuggestion(suggestion.suggestion, index)}
							>
								{copiedIndex === index ? (
									<CheckCircle className='h-4 w-4 text-green-500' />
								) : (
									<Copy className='h-4 w-4' />
								)}
							</button>
						</div>
						<p className='mb-2 rounded-md border border-blue-100 bg-blue-50 p-2 text-sm'>
							{suggestion.suggestion}
						</p>
					</div>

					{/* Reason */}
					<div className='bg-gray-50 px-4 py-3'>
						<h3 className='mb-1 text-sm font-medium'>Reason:</h3>
						<p className='text-xs text-gray-600'>{suggestion.reason}</p>
					</div>
				</div>
			))}
		</div>
	);
};

export default ResumeSuggestions;
