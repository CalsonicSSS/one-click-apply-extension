import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFileManagement } from '@/hooks/useFileManagement';
import { useSuggestionGenerationProcess } from '@/hooks/useSuggestionGeneration';
import { GenerationStage } from '@/types/progressTracking';
import { useEffect, useState } from 'react';
import ProfileTab from './tabs/ProfileTab';
import SuggestionTab from './tabs/SuggestionTab';

const SidePanelMain = () => {
	const [activeTab, setActiveTab] = useState<string>('profile');

	const {
		storedFilesObj,
		isLoading: filesLoading,
		uploadAndStoreFile,
		removeFile,
		fileHandlingErrorMessage,
	} = useFileManagement();

	const {
		suggestionCreditUsagePercentage,
		usedSuggestionCredits,
		lastSuggestionAndCreditUsedLoadingErrMessage,
		lastSuggestion,
		currentTabId,
		generationProgress,
		mutation: {
			isError: isSuggestionGenerationError,
			error: suggestionGenerationError,
			isPending: isSuggestionGenerationPending,
			data: suggestionGeneratedData,
			mutate: suggestionGenerationMutate,
		},
	} = useSuggestionGenerationProcess(storedFilesObj);

	// Switch to suggestion tab when new results are available
	useEffect(() => {
		if (suggestionGeneratedData && generationProgress?.stagePercentage === GenerationStage.COMPLETED) {
			// Add a small delay before switching to the suggestion tab
			const timer = setTimeout(() => {
				setActiveTab('suggestion');
			}, 800);

			// Clean up timer if component unmounts
			return () => clearTimeout(timer);
		}
	}, [suggestionGeneratedData, generationProgress]);

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

	// Determine what to show in the suggestion tab
	const suggestionResults = suggestionGeneratedData || lastSuggestion;

	return (
		<div className='flex h-screen w-full flex-col bg-white'>
			{/* Header */}
			<div className='p-4'>
				<h1 className='text-2xl font-bold text-gray-900'>Wise Craft</h1>
				<p className='text-sm text-gray-500'>Your tailored resume & CV, just one click away</p>
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
						lastSuggestionAndCreditUsedLoadingErrMessage={lastSuggestionAndCreditUsedLoadingErrMessage}
						suggestionCreditUsagePercentage={suggestionCreditUsagePercentage}
						usedSuggestionCredits={usedSuggestionCredits}
						uploadAndStoreFile={uploadAndStoreFile}
						removeFile={removeFile}
						isSuggestionGenerationError={isSuggestionGenerationError}
						suggestionGenerationError={suggestionGenerationError}
						isSuggestionGenerationPending={isSuggestionGenerationPending}
						onGenerateSuggestions={handleGenerateSuggestions}
						generationProgress={generationProgress}
					/>
				</TabsContent>

				<TabsContent value='suggestion' className='flex-1 overflow-auto py-4'>
					<SuggestionTab suggestionResults={suggestionResults} />
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default SidePanelMain;
