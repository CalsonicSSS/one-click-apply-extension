export type FileCategoryType = 'resume' | 'supporting';

export type StoredFile = {
	id: string;
	name: string;
	fileCategory: FileCategoryType;
	fileType: string; // e.g., 'application/pdf'
	base64Content: string;
	base64Size: number;
	uploadedAt: string;
};

export type FilesStorageState = {
	resume: StoredFile | null;
	supportingDocs: StoredFile[];
};
