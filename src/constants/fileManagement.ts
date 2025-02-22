export const MAX_SUPPORTING_DOCS = 4; // Total 5 files max (1 resume + 4 supporting)

// these are MIME types
// browser environment will automatically detect the file type based on the MIME type when file is uploaded
export const ALLOWED_FILE_TYPES = [
	'application/pdf',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'text/plain',
];

// this is to display the file type from matching MIME type in the UI and map to correct file type icon later
export const FILE_TYPE_EXTENSIONS = {
	'application/pdf': '.pdf',
	'application/msword': '.doc',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
		'.docx',
	'text/plain': '.txt',
};

// this is cap to max crhome.storage.local limit (typically the size calculated is based on bytes as base unit)
// 1kb = 1024 bytes, 1MB = 1024kb
export const MAX_TOTAL_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
