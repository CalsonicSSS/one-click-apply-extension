import { CheckCircle, Copy, Download } from 'lucide-react';
import { useState } from 'react';

const CoverLetterSuggestion = ({ coverLetter }: { coverLetter: string }) => {
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		navigator.clipboard.writeText(coverLetter);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleDownload = () => {
		// Create a blob with the cover letter text
		const blob = new Blob([coverLetter], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);

		// Create a temporary anchor element and trigger download
		const a = document.createElement('a');
		a.href = url;
		a.download = 'Cover_Letter.txt';
		a.click();

		// Clean up
		URL.revokeObjectURL(url);
	};

	return (
		<div className='space-y-4'>
			<div className='mb-2 flex items-center justify-between'>
				<h3 className='font-medium'>Your Tailored Cover Letter</h3>
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
					<button
						className='flex items-center rounded-md bg-gray-100 p-1.5 text-xs hover:bg-gray-200'
						onClick={handleDownload}
					>
						<Download className='mr-1 h-3.5 w-3.5' />
						<span>Download</span>
					</button>
				</div>
			</div>

			<div className='max-h-[400px] overflow-y-auto whitespace-pre-line rounded-lg border border-gray-200 bg-white p-4'>
				{coverLetter}
			</div>
		</div>
	);
};

export default CoverLetterSuggestion;
