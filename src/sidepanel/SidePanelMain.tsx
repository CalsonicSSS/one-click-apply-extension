import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFileManagement } from '@/hooks/useFileManagement';
import { useSuggestionGeneration } from '@/hooks/useSuggestionGeneration';
import { GenerationStage } from '@/types/progressTracking';
import { useEffect, useState } from 'react';
import ProfileTab from './tabs/ProfileTab';
import SuggestionTab from './tabs/SuggestionTab';

const SidePanelMain = () => {
	const [activeTab, setActiveTab] = useState<string>('profile');

	const {
		storedFilesObj,
		isLoading: filesLoading,
		uploadFile,
		removeFile,
		fileHandlingErrorMessage,
	} = useFileManagement();

	const {
		usedCredits,
		sugguestionHandlingErrorMessage,
		suggestionCreditUsagePercentage,
		tabSpecificLatestFullSuggestion,
		generationProgress,
		browserId,
		mutation: {
			isError: isSuggestionGenerationError,
			error: suggestionGenerationError,
			isPending: isSuggestionGenerationPending,
			data: fullGeneratedSuggestionData,
			mutate: suggestionGenerationMutate,
		},
	} = useSuggestionGeneration(storedFilesObj);

	// Switch to suggestion tab when new results are available
	useEffect(() => {
		if (fullGeneratedSuggestionData && generationProgress?.stagePercentage === GenerationStage.COMPLETED) {
			// Add a small delay before switching to the suggestion tab
			const timer = setTimeout(() => {
				setActiveTab('suggestion');
			}, 800);

			// Clean up timer if component unmounts
			return () => clearTimeout(timer);
		}
	}, [fullGeneratedSuggestionData, generationProgress]);

	const handleGenerateSuggestions = () => {
		suggestionGenerationMutate();
	};

	if (filesLoading) {
		return (
			<div className='flex min-h-screen w-full items-center justify-center p-6'>
				<div className='animate-pulse text-gray-500'>Loading...</div>
			</div>
		);
	}

	return (
		<div className='flex h-screen w-full flex-col bg-white'>
			{/* Header */}
			<div className='p-4'>
				{/* current changing UI title name to "Ninja craft" */}
				<h1 className='text-2xl font-bold text-gray-900'>Ninja Craft</h1>
				<p className='text-sm text-gray-500'>Get tailored resume & CV, just one click away</p>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab} className='flex flex-1 flex-col overflow-hidden px-4'>
				<TabsList className='grid w-full grid-cols-2'>
					<TabsTrigger value='profile'>Profile</TabsTrigger>
					<TabsTrigger value='suggestion'>Suggestions</TabsTrigger>
				</TabsList>

				<TabsContent value='profile' className='flex-1 overflow-auto py-4'>
					<ProfileTab
						storedFilesObj={storedFilesObj}
						fileHandlingErrorMessage={fileHandlingErrorMessage}
						sugguestionHandlingErrorMessage={sugguestionHandlingErrorMessage}
						suggestionCreditUsagePercentage={suggestionCreditUsagePercentage}
						usedSuggestionCredits={usedCredits}
						uploadFile={uploadFile}
						removeFile={removeFile}
						isSuggestionGenerationError={isSuggestionGenerationError}
						suggestionGenerationError={suggestionGenerationError}
						isSuggestionGenerationPending={isSuggestionGenerationPending}
						onGenerateSuggestions={handleGenerateSuggestions}
						generationProgress={generationProgress}
						browserId={browserId}
					/>
				</TabsContent>

				<TabsContent value='suggestion' className='flex-1 overflow-auto py-4'>
					<SuggestionTab
						fullSuggestionResults={tabSpecificLatestFullSuggestion}
						storedFilesObj={storedFilesObj}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default SidePanelMain;
