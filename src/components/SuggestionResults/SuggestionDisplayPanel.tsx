import type { SuggestionGenerationResponse } from '@/api/suggestionGeneration';
import { useState } from 'react';
import CoverLetterSuggestion from './CoverLetterSuggestion';
import ResumeSuggestions from './ResumeSuggestions';

type SuggestionDisplayPanelProps = {
	results: SuggestionGenerationResponse | null;
	onClose: () => void;
};

const SuggestionDisplayPanel = ({ results, onClose }: SuggestionDisplayPanelProps) => {
	const [activeTab, setActiveTab] = useState<'resume' | 'coverLetter'>('resume');

	if (!results) return null;

	return (
		<div className='fixed inset-0 z-50 flex justify-end'>
			{/* Backdrop */}
			<div className='fixed inset-0 bg-black/20' onClick={onClose} />

			{/* Results Panel */}
			<div className='relative flex h-full w-[350px] flex-col bg-white shadow-xl animate-in slide-in-from-right'>
				{/* Header */}
				<div className='border-b p-4'>
					<h2 className='text-xl font-semibold'>Tailored Suggestions</h2>
					<p className='text-sm text-gray-500'>Generated just for you</p>
				</div>

				{/* Tabs */}
				<div className='flex border-b'>
					<button
						className={`flex-1 py-3 text-sm font-medium ${activeTab === 'resume' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
						onClick={() => setActiveTab('resume')}
					>
						Resume Suggestions
					</button>
					<button
						className={`flex-1 py-3 text-sm font-medium ${activeTab === 'coverLetter' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
						onClick={() => setActiveTab('coverLetter')}
					>
						Cover Letter
					</button>
				</div>

				{/* Content */}
				<div className='flex-1 overflow-y-auto p-4'>
					{activeTab === 'resume' ? (
						<ResumeSuggestions suggestions={results.resume_suggestions} />
					) : (
						<CoverLetterSuggestion coverLetter={results.cover_letter} />
					)}
				</div>
			</div>
		</div>
	);
};

export default SuggestionDisplayPanel;
