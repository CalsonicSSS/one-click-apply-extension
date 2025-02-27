export const MAX_SUPPORTING_DOCS = 4; // Total 5 files max (1 resume + 4 supporting)

// these are MIME types. browser environment will automatically detect the file type based on the MIME type when file is uploaded
export const ALLOWED_FILE_TYPES = [
	'application/pdf',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'text/plain',
];

// 1kb = 1024 bytes, 1MB = 1024kb
export const MAX_ALLOWED_TOTAL_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes this is cap to max crhome.storage.local limit
