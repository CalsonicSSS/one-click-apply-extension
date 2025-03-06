export enum GenerationStage {
	ANALYZING_JOB_POSTING = 0,
	GENERATING_RESUME_SUGGESTIONS = 30,
	CREATING_COVER_LETTER = 60,
	COMPLETED = 100,
}

export type GenerationProgress = {
	stagePercentage: GenerationStage | 0;
	message: string;
};
