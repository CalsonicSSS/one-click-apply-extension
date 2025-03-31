import { MAX_SUPPORTING_DOCS } from '@/constants/fileManagement';
import type { FileCategoryType, FilesStorageState, StoredFile } from '@/types/fileManagement';
import { createNewStoredFile, validateFileUpload } from '@/utils/fileManagement';
import { useStorage } from '@plasmohq/storage/hook';
import { useState } from 'react';

type UseFileManagementReturn = {
	storedFilesObj: FilesStorageState;
	isLoading: boolean;
	uploadFile: (file: File, docCategoryType: FileCategoryType) => Promise<void>;
	removeFile: (id: string, docCategoryType: FileCategoryType) => Promise<void>;
	fileHandlingErrorMessage: string | null;
};

export const useFileManagement = (): UseFileManagementReturn => {
	const [fileHandlingErrorMessage, setFileHandlingErrorMessage] = useState<string | null>(null);
	const [storedFilesObj, setStoredFilesObj, { isLoading }] = useStorage<FilesStorageState>('fileStorage', {
		resume: null,
		supportingDocs: [],
	});

	const uploadFile = async (file: File, fileCategory: FileCategoryType): Promise<void> => {
		setFileHandlingErrorMessage(null);

		// Get current files array for size validation
		const currentStoredFiles: StoredFile[] = [
			...(storedFilesObj.resume ? [storedFilesObj.resume] : []),
			...storedFilesObj.supportingDocs,
		];

		// Validate file including total storage size check
		const validationErrorMessage = validateFileUpload(file, currentStoredFiles);

		if (validationErrorMessage) {
			setFileHandlingErrorMessage(validationErrorMessage);
			return;
		}

		try {
			const newStoredFile = await createNewStoredFile(file, fileCategory);

			if (fileCategory === 'resume') {
				setStoredFilesObj({
					...storedFilesObj,
					resume: newStoredFile,
				});
			} else {
				if (storedFilesObj.supportingDocs.length >= MAX_SUPPORTING_DOCS) {
					setFileHandlingErrorMessage('Maximum number of supporting documents reached');
					return;
				}

				setStoredFilesObj({
					...storedFilesObj,
					supportingDocs: [...storedFilesObj.supportingDocs, newStoredFile],
				});
			}
		} catch (err) {
			console.error('Failed to upload file:', err);
			setFileHandlingErrorMessage('Failed to upload file');
		}
	};

	const removeFile = async (id: string, type: FileCategoryType): Promise<void> => {
		try {
			if (type === 'resume') {
				setStoredFilesObj({
					...storedFilesObj,
					resume: null,
				});
			} else {
				setStoredFilesObj({
					...storedFilesObj,
					supportingDocs: storedFilesObj.supportingDocs.filter((doc) => doc.id !== id),
				});
			}
		} catch (err) {
			console.error('Failed to remove file:', err);
			setFileHandlingErrorMessage('Failed to remove file');
		}
	};

	return {
		storedFilesObj,
		isLoading,
		uploadFile,
		removeFile,
		fileHandlingErrorMessage,
	};
};
