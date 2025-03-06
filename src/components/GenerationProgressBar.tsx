import { cn } from '@/lib/utils'; // Assuming you have this utility from shadcn/ui
import type { GenerationProgress } from '@/types/progressTracking';

interface GenerationProgressBarProps {
	progress: GenerationProgress | null;
	className?: string;
}

const GenerationProgressBar = ({ progress, className }: GenerationProgressBarProps) => {
	if (!progress) return null;

	// Convert the enum value to a percentage for the progress bar width
	const progressPercentage = typeof progress.stagePercentage === 'number' ? progress.stagePercentage : 0;

	return (
		<div className={cn('w-full space-y-2', className)}>
			{/* Progress bar container */}
			<div className='h-2 w-full overflow-hidden rounded-full bg-gray-100'>
				{/* Progress bar fill */}
				<div
					className='h-full bg-emerald-500 transition-all duration-500 ease-out'
					style={{ width: `${progressPercentage}%` }}
				/>
			</div>

			{/* Progress message */}
			<div className='text-center text-xs font-medium text-gray-600'>{progress.message}</div>
		</div>
	);
};

export default GenerationProgressBar;
