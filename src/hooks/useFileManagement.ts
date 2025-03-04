import { MAX_SUPPORTING_DOCS } from '@/constants/fileManagement';
import type { FileCategoryType, FilesStorageState, StoredFile } from '@/types/fileManagement';
import { createNewStoredFile, validateFileUpload } from '@/utils/fileManagement';
import { useEffect, useState } from 'react';

type UseFileManagementReturn = {
	storedFilesObj: FilesStorageState;
	isLoading: boolean;
	uploadAndStoreFile: (file: File, docCategoryType: FileCategoryType) => Promise<void>;
	removeFile: (id: string, docCategoryType: FileCategoryType) => Promise<void>;
	fileHandlingErrorMessage: string | null;
};

export const useFileManagement = (): UseFileManagementReturn => {
	const [storedFilesObj, setStoredFilesObj] = useState<FilesStorageState>({
		resume: null,
		supportingDocs: [],
	});
	const [isLoading, setIsLoading] = useState(true);
	const [fileHandlingErrorMessage, setFileHandlingErrorMessage] = useState<string | null>(null);

	// Load files on initial mount
	useEffect(() => {
		const loadFiles = async () => {
			try {
				const result = await chrome.storage.local.get('fileStorage');
				if (result.fileStorage) {
					setStoredFilesObj(result.fileStorage);
				}
			} catch (err) {
				console.error('Error loading files upon onMount:', err);
				setFileHandlingErrorMessage('Failed to load saved files');
			} finally {
				setIsLoading(false);
			}
		};
		loadFiles();
	}, []);

	// Add storage change listener for real-time synchronization
	useEffect(() => {
		const syncFileStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
			// Only react to changes in local storage
			if (areaName !== 'local') return;

			// Check if fileStorage changed
			if (changes.fileStorage && !isLoading) {
				const newValue = changes.fileStorage.newValue;
				if (newValue) {
					// Update local state to match storage
					setStoredFilesObj(newValue);
				}
			}
		};

		// Add the listener
		chrome.storage.onChanged.addListener(syncFileStorageChange);

		// Clean up the listener when the component unmounts
		return () => {
			chrome.storage.onChanged.removeListener(syncFileStorageChange);
		};
	}, [isLoading]); // Only re-add the listener if isLoading changes

	// This function will update both the local state and the chrome storage
	const updateFileStorageState = async (newFileStorageState: FilesStorageState) => {
		await chrome.storage.local.set({ fileStorage: newFileStorageState });
	};

	const uploadAndStoreFile = async (file: File, fileCategory: FileCategoryType): Promise<void> => {
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
				await updateFileStorageState({
					...storedFilesObj,
					resume: newStoredFile,
				});
			} else {
				if (storedFilesObj.supportingDocs.length >= MAX_SUPPORTING_DOCS) {
					setFileHandlingErrorMessage('Maximum number of supporting documents reached');
					return;
				}

				await updateFileStorageState({
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
				await updateFileStorageState({
					...storedFilesObj,
					resume: null,
				});
			} else {
				await updateFileStorageState({
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
		uploadAndStoreFile,
		removeFile,
		fileHandlingErrorMessage,
	};
};
