import { ALLOWED_FILE_TYPES, MAX_ALLOWED_TOTAL_FILE_SIZE } from '@/constants/fileManagement';
import type { FileCategoryType, StoredFile } from '@/types/fileManagement';
import { formatDate } from './helpers';

export const convertFileToBase64String = (file: File): Promise<string> => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		// this will read the file as a data URL which is a base64 encoded string
		reader.readAsDataURL(file);
		// onload event is triggered when the file is read successfully from above readAsDataURL method
		reader.onload = () => {
			const base64String = reader.result as string;
			// Remove data URL prefix (e.g., "data:application/pdf;base64,")
			const base64Content = base64String.split(',')[1];
			resolve(base64Content);
		};
		// onerror event is triggered when there is an error reading the file
		reader.onerror = reject;
	});
};

export const calculateBase64Size = (file: File): number => {
	const size = Math.ceil(file.size * (4 / 3));
	return size; // gives the size of the file in bytes ((KB), (MB), (GB) and terabytes (TB) are byte-based.
};

export const validateFileUpload = (file: File, currentUploadedFiles: StoredFile[]): string | null => {
	if (!ALLOWED_FILE_TYPES.includes(file.type)) {
		return 'Invalid file type. Please upload PDF, DOCX, or TXT files only.';
	}

	// Calculate current total storage size
	const currentTotalSize = currentUploadedFiles.reduce((total, file) => {
		return total + file.base64Size;
	}, 0);

	// Calculate the expected Base64 size of the new file
	const newFileBase64Size = calculateBase64Size(file);

	// Check if adding new file would exceed storage limit
	if (currentTotalSize + newFileBase64Size > MAX_ALLOWED_TOTAL_FILE_SIZE) {
		return 'Total allowed file storage exceeded. Please remove some files before uploading new ones.';
	}

	return null;
};

export const createNewStoredFile = async (file: File, fileCategory: FileCategoryType): Promise<StoredFile> => {
	const base64Content = await convertFileToBase64String(file);

	return {
		id: crypto.randomUUID(),
		name: file.name,
		fileCategory,
		fileType: file.type,
		base64Content,
		base64Size: calculateBase64Size(file),
		uploadedAt: formatDate(new Date()),
	};
};
