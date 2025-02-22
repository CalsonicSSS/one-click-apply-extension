import { MAX_SUPPORTING_DOCS } from '@/constants/fileManagement';
import type {
	FileCategoryType,
	FilesStorageState,
	StoredFile,
} from '@/types/fileManagement';
import {
	createNewStoredFile,
	validateFileUpload,
} from '@/utils/fileManagement';
import { useEffect, useState } from 'react';

type UseFileManagementReturn = {
	storedFilesObj: FilesStorageState;
	isLoading: boolean;
	uploadAndStoreFile: (
		file: File,
		docCategoryType: FileCategoryType,
	) => Promise<void>;
	removeFile: (
		id: string,
		docCategoryType: FileCategoryType,
	) => Promise<void>;
	errorMessage: string | null;
};

export const useFileManagement = (): UseFileManagementReturn => {
	const [storedFilesObj, setStoredFilesObj] = useState<FilesStorageState>({
		resume: null,
		supportingDocs: [],
	});
	const [isLoading, setIsLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	useEffect(() => {
		const loadFiles = async () => {
			try {
				const result = await chrome.storage.local.get('fileStorage');
				if (result.fileStorage) {
					setStoredFilesObj(result.fileStorage);
				}
			} catch (err) {
				console.error('Error loading files upon onMount:', err);
				setErrorMessage('Failed to load saved files');
			} finally {
				setIsLoading(false);
			}
		};
		loadFiles();
	}, []);

	// this function will update both the local state and the chrome storage
	const updateFileStorageState = async (
		newFileStorageState: FilesStorageState,
	) => {
		await chrome.storage.local.set({ fileStorage: newFileStorageState });
		setStoredFilesObj(newFileStorageState);
	};

	const uploadAndStoreFile = async (
		file: File,
		fileCategory: FileCategoryType,
	): Promise<void> => {
		setErrorMessage(null);

		// Get current files array for size validation
		const currentStoredFiles: StoredFile[] = [
			...(storedFilesObj.resume ? [storedFilesObj.resume] : []),
			...storedFilesObj.supportingDocs,
		];

		// Validate file including total storage size check
		const validationErrorMessage = validateFileUpload(
			file,
			currentStoredFiles,
		);

		if (validationErrorMessage) {
			setErrorMessage(validationErrorMessage);
		}

		try {
			const newStoredFile = await createNewStoredFile(file, fileCategory);

			if (fileCategory === 'resume') {
				await updateFileStorageState({
					...storedFilesObj,
					resume: newStoredFile,
				});
			} else {
				if (
					storedFilesObj.supportingDocs.length >= MAX_SUPPORTING_DOCS
				) {
					setErrorMessage(
						'Maximum number of supporting documents reached',
					);
				}

				await updateFileStorageState({
					...storedFilesObj,
					supportingDocs: [
						...storedFilesObj.supportingDocs,
						newStoredFile,
					],
				});
			}
		} catch (err) {
			console.log('Failed to upload file:', err);
			setErrorMessage('Failed to upload file');
		}
	};

	const removeFile = async (
		id: string,
		type: FileCategoryType,
	): Promise<void> => {
		try {
			if (type === 'resume') {
				await updateFileStorageState({
					...storedFilesObj,
					resume: null,
				});
			} else {
				await updateFileStorageState({
					...storedFilesObj,
					supportingDocs: storedFilesObj.supportingDocs.filter(
						(doc) => doc.id !== id,
					),
				});
			}
		} catch (err) {
			console.log('Failed to remove file:', err);
			setErrorMessage('Failed to remove file');
		}
	};

	return {
		storedFilesObj,
		isLoading,
		uploadAndStoreFile,
		removeFile,
		errorMessage,
	};
};
