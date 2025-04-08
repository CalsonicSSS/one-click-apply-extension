export enum GenerationStage {
	ANALYZING_JOB_POSTING = 0,
	GENERATING_RESUME_SUGGESTIONS = 10,
	GENERATING_FULL_RESUME = 40,
	CREATING_COVER_LETTER = 70,
	COMPLETED = 100,
}

export type GenerationProgress = {
	stagePercentage: GenerationStage | 0;
	message: string;
};
