import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { handleDownloadCoverLetterDocx, handleDownloadCoverLetterPdf } from '@/utils/coverletterFormatDownload';
import { CheckCircle, Copy, Download, FileDown } from 'lucide-react';
import { useState } from 'react';

type CoverLetterSuggestionTabProps = {
	coverLetter: string;
	applicant_name: string;
	jobTitle: string;
};

const CoverLetterSuggestion = ({ coverLetter, applicant_name, jobTitle }: CoverLetterSuggestionTabProps) => {
	const [copied, setCopied] = useState(false);
	const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
	const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);

	const handleCopy = () => {
		navigator.clipboard.writeText(coverLetter);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const onDownloadDocx = async () => {
		setIsDownloadingDocx(true);
		try {
			await handleDownloadCoverLetterDocx({ coverLetter, applicant_name, jobTitle });
		} finally {
			setIsDownloadingDocx(false);
		}
	};

	const onDownloadPdf = async () => {
		setIsDownloadingPdf(true);
		try {
			await handleDownloadCoverLetterPdf({ coverLetter, applicant_name, jobTitle });
		} finally {
			setIsDownloadingPdf(false);
		}
	};

	return (
		<div className='space-y-4'>
			<div className='mb-2 flex items-center justify-between'>
				<h3 className='font-medium'>Tailored Cover Letter</h3>
				<div className='flex space-x-2'>
					<button
						className='flex items-center rounded-md bg-gray-100 p-1.5 text-xs hover:bg-gray-200'
						onClick={handleCopy}
					>
						{copied ? (
							<>
								<CheckCircle className='mr-1 h-3.5 w-3.5 text-green-500' />
								<span>Copied!</span>
							</>
						) : (
							<>
								<Copy className='mr-1 h-3.5 w-3.5' />
								<span>Copy</span>
							</>
						)}
					</button>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button className='flex items-center rounded-md bg-gray-100 p-1.5 text-xs hover:bg-gray-200'>
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

			<div className='max-h-[400px] overflow-y-auto whitespace-pre-line rounded-lg border border-gray-200 bg-white p-4'>
				{coverLetter}
			</div>
		</div>
	);
};

export default CoverLetterSuggestion;
