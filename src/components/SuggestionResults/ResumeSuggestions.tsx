import type { ResumeSuggestion } from '@/types/suggestionGeneration';
import { CheckCircle, Copy } from 'lucide-react';
import { useState } from 'react';

const ResumeSuggestions = ({ suggestions }: { suggestions: ResumeSuggestion[] }) => {
	const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

	const handleCopySuggestion = (text: string, index: number) => {
		navigator.clipboard.writeText(text);
		setCopiedIndex(index);
		setTimeout(() => setCopiedIndex(null), 2000);
	};

	return (
		<div className=''>
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
