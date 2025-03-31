import { MAX_SUPPORTING_DOCS } from '@/constants/fileManagement';
import type { FileCategoryType, FilesStorageState, StoredFile } from '@/types/fileManagement';
import { createNewStoredFile, validateFileUpload } from '@/utils/fileManagement';
import { useEffect, useState } from 'react';

export const useFileManagement = () => {
	const [fileHandlingErrorMessage, setFileHandlingErrorMessage] = useState<string | null>(null);
	const [storedFilesObj, setStoredFilesObj] = useState<FilesStorageState>({
		resume: null,
		supportingDocs: [],
	});

	useEffect(() => {
		const loadInitialFiles = async () => {
			try {
				// The chrome.storage.local.get('storedFiles') function returns an object that contains the key-value pair, not just the value.
				const storedFilesResultPair = await chrome.storage.local.get('storedFiles');
				const storedFiles = storedFilesResultPair.storedFiles as FilesStorageState | undefined;

				if (storedFiles) {
					setStoredFilesObj(storedFiles);
				}
			} catch (err) {
				console.error('Failed to load files from storage:', err);
				setFileHandlingErrorMessage('Failed to load your files');
			}
		};
		loadInitialFiles();

		// Set up storage change listener to sync state across all open instances
		const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
			if (areaName === 'local' && 'storedFiles' in changes) {
				const newStoredFiles = changes['storedFiles'].newValue as FilesStorageState | undefined;

				// Only update if there's a valid new value and it's different from current state
				if (newStoredFiles) {
					setStoredFilesObj(newStoredFiles);
				}
			}
		};

		// Add the listener
		chrome.storage.onChanged.addListener(handleStorageChange);

		// Return cleanup function to remove listener when component unmounts
		return () => {
			chrome.storage.onChanged.removeListener(handleStorageChange);
		};
	}, []);

	const uploadFile = async (file: File, fileCategory: FileCategoryType): Promise<void> => {
		setFileHandlingErrorMessage(null);

		// Get current total files in a array for below validation
		const currentStoredFiles: StoredFile[] = [
			...(storedFilesObj.resume ? [storedFilesObj.resume] : []),
			...storedFilesObj.supportingDocs,
		];

		// Validate file including file types and total storage size check
		const validationErrorMessage = validateFileUpload(file, currentStoredFiles);

		if (validationErrorMessage) {
			setFileHandlingErrorMessage(validationErrorMessage);
			return;
		}

		try {
			const newStoredFile = await createNewStoredFile(file, fileCategory);
			let updatedFiles: FilesStorageState;

			if (fileCategory === 'resume') {
				updatedFiles = {
					...storedFilesObj,
					resume: newStoredFile,
				};
			} else {
				if (storedFilesObj.supportingDocs.length >= MAX_SUPPORTING_DOCS) {
					setFileHandlingErrorMessage('Maximum number of supporting documents reached');
					return;
				}

				updatedFiles = {
					...storedFilesObj,
					supportingDocs: [...storedFilesObj.supportingDocs, newStoredFile],
				};
			}

			// Update Chrome storage first
			await chrome.storage.local.set({ storedFiles: updatedFiles });
		} catch (err) {
			console.error('Failed to upload file:', err);
			setFileHandlingErrorMessage('Failed to upload file');
		}
	};

	const removeFile = async (id: string, type: FileCategoryType): Promise<void> => {
		try {
			let updatedFiles: FilesStorageState;

			if (type === 'resume') {
				updatedFiles = {
					...storedFilesObj,
					resume: null,
				};
			} else {
				updatedFiles = {
					...storedFilesObj,
					supportingDocs: storedFilesObj.supportingDocs.filter((doc) => doc.id !== id),
				};
			}

			// Update Chrome storage first
			await chrome.storage.local.set({ storedFiles: updatedFiles });
		} catch (err) {
			console.error('Failed to remove file:', err);
			setFileHandlingErrorMessage('Failed to remove file');
		}
	};

	return {
		storedFilesObj,
		uploadFile,
		removeFile,
		fileHandlingErrorMessage,
	};
};
