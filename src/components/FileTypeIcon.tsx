type FileIconProps = {
	fileType: string;
	className?: string;
};

const FileTypeIcon = ({ fileType, className = 'h-8 w-8' }: FileIconProps) => {
	// Determine which icon to show based on file type
	const getIconSrc = () => {
		if (fileType.includes('application/pdf')) {
			return chrome.runtime.getURL('assets/file_icons/file_pdf.svg');
		} else if (fileType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
			return chrome.runtime.getURL('assets/file_icons/file_doc.svg');
		} else if (fileType.includes('text/plain')) {
			return chrome.runtime.getURL('assets/file_icons/file_txt.svg');
		}
		// Default file icon
		return chrome.runtime.getURL('assets/file_icons/file_txt.svg');
	};

	return <img src={getIconSrc()} alt='File icon' className={className} />;
};

export default FileTypeIcon;
