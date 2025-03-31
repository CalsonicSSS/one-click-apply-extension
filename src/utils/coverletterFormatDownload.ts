import { Document, Packer, Paragraph, TextRun } from 'docx';
import jsPDF from 'jspdf';

type docFormatAndDownload = {
	coverLetter: string;
	applicant_name: string;
	jobTitle: string;
};

export const handleDownloadDocx = async ({ coverLetter, applicant_name, jobTitle }: docFormatAndDownload) => {
	try {
		// Split the cover letter into lines
		const lines = coverLetter.split('\n');

		// Create a new Document
		const doc = new Document({
			sections: [
				{
					properties: {},
					children: lines.map((line) => {
						// Skip empty lines
						if (line.trim() === '') {
							return new Paragraph({});
						}

						// Create a normal paragraph with the line's text
						return new Paragraph({
							children: [
								new TextRun({
									text: line.trim(),
								}),
							],
						});
					}),
				},
			],
		});

		// Generate the document as a blob
		const blob = await Packer.toBlob(doc);

		// Create a URL for the blob
		const url = URL.createObjectURL(blob);

		// Create a temporary anchor element and trigger download
		const a = document.createElement('a');
		a.href = url;
		a.download = `${applicant_name}_CoverLetter_${jobTitle}.docx`;
		a.click();

		// Clean up
		URL.revokeObjectURL(url);

		return true;
	} catch (error) {
		console.error('Error generating DOCX:', error);
		return false;
	}
};

export const handleDownloadPdf = async ({ coverLetter, applicant_name, jobTitle }: docFormatAndDownload) => {
	try {
		// Create new PDF document
		const doc = new jsPDF({
			orientation: 'portrait',
			unit: 'mm',
			format: 'a4',
		});

		// PDF dimensions and margins
		const pageWidth = doc.internal.pageSize.getWidth();
		const margin = 25; // mm
		const contentWidth = pageWidth - margin * 2;

		// Parse the cover letter content
		const lines = coverLetter.split('\n');
		let yPos = margin;

		// Extract applicant name for later use in signature
		let applicantName = '';
		if (lines.length > 0 && lines[0].trim() !== '') {
			applicantName = lines[0].trim();
		}

		// --- 1. Process header section (applicant info) ---
		let headerLines = [];
		let i = 0;

		// Collect header lines (usually first 3-5 non-empty lines)
		while (i < lines.length && headerLines.length < 3) {
			const line = lines[i].trim();
			if (line === '') {
				i++;
				continue;
			}

			// Check if we've reached the date section
			if (
				line.toLowerCase() === 'date' ||
				line.match(
					/^(january|february|march|april|may|june|july|august|september|october|november|december)/i,
				) ||
				line.match(/^\d{1,2}\/\d{1,2}\/\d{4}/)
			) {
				break;
			}

			headerLines.push(line);
			i++;
		}

		// Print centered header
		if (headerLines.length > 0) {
			// Name (first line) in bold and larger font
			doc.setFont('Helvetica', 'bold');
			doc.setFontSize(14);
			doc.text(headerLines[0], pageWidth / 2, yPos, { align: 'center' });
			yPos += 7;

			// Remaining contact info
			doc.setFontSize(11);
			doc.setFont('Helvetica', 'normal');
			for (let j = 1; j < headerLines.length; j++) {
				doc.text(headerLines[j], pageWidth / 2, yPos, { align: 'center' });
				yPos += 5;
			}

			yPos += 5; // Extra space after header
		}

		// --- 2. Process date ---
		const today = new Date();
		const formattedDate = today.toLocaleDateString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric',
		});

		// Skip any empty lines
		while (i < lines.length && lines[i].trim() === '') i++;

		// Handle date line
		if (
			i < lines.length &&
			(lines[i].trim().toLowerCase() === 'date' ||
				lines[i].match(
					/^(january|february|march|april|may|june|july|august|september|october|november|december)/i,
				) ||
				lines[i].match(/^\d{1,2}\/\d{1,2}\/\d{4}/))
		) {
			// Rather than just printing "DATE", use the actual formatted date
			doc.text(formattedDate, margin, yPos);
			yPos += 8;
			i++;
		} else {
			// If no date line found, add it anyway
			doc.text(formattedDate, margin, yPos);
			yPos += 8;
		}

		// --- 3. Process recipient info ---
		// Skip any empty lines
		while (i < lines.length && lines[i].trim() === '') i++;

		let recipientLines = [];

		// Collect recipient info until we reach the greeting
		while (i < lines.length) {
			const line = lines[i].trim();
			if (line === '') {
				i++;
				continue;
			}

			// Stop when we reach the greeting
			if (line.startsWith('Dear') || line.startsWith('To ')) {
				break;
			}

			recipientLines.push(line);
			i++;
		}

		// Print recipient info
		if (recipientLines.length > 0) {
			doc.setFont('Helvetica', 'bold');
			recipientLines.forEach((line) => {
				doc.text(line, margin, yPos);
				yPos += 5;
			});
			yPos += 3;
		}

		// --- 4. Process greeting ---
		// Skip any empty lines
		while (i < lines.length && lines[i].trim() === '') i++;

		// Handle greeting line
		if (i < lines.length && (lines[i].trim().startsWith('Dear') || lines[i].trim().startsWith('To '))) {
			doc.setFont('Helvetica', 'normal');
			doc.text(lines[i].trim(), margin, yPos);
			yPos += 10; // Extra space after greeting
			i++;
		}

		// --- 5. Process body content ---
		// Skip any empty lines
		while (i < lines.length && lines[i].trim() === '') i++;

		const bulletIndent = 8; // mm for bullet indentation

		// Process body paragraphs and bullet points
		let paragraphs = [];
		let closingIndex = -1;

		// First, collect all paragraphs and find where the closing starts
		for (let j = i; j < lines.length; j++) {
			const line = lines[j].trim();

			// Skip empty lines
			if (line === '') continue;

			// Check for closing line (Sincerely, etc.)
			if (
				line.includes('Sincerely,') ||
				line.startsWith('Sincerely') ||
				(line.includes('Thank you for') && line.includes('application')) ||
				line.includes('Best regards')
			) {
				closingIndex = j;
				break;
			}

			paragraphs.push(lines[j]);
		}

		// Process regular paragraphs
		for (let p = 0; p < paragraphs.length; p++) {
			const paragraph = paragraphs[p].trim();

			if (paragraph === '') {
				yPos += 3;
				continue;
			}

			// Handle bullet points - indent both bullet and text
			if (paragraph.startsWith('•') || paragraph.startsWith('-') || paragraph.startsWith('*')) {
				// Handle the entire bullet point with indentation
				const bulletChar = '•';
				const textAfterBullet = paragraph.substring(1).trim();

				// Wrap text with proper indentation
				const bulletTextWidth = contentWidth - bulletIndent;
				const wrappedText = doc.splitTextToSize(textAfterBullet, bulletTextWidth);

				// Draw the bullet point and text with indentation
				doc.text(bulletChar, margin + bulletIndent, yPos);
				doc.text(wrappedText, margin + bulletIndent + 5, yPos);

				// Move position for next line
				yPos += 5 * wrappedText.length + 2;
			}
			// Regular paragraph
			else {
				const wrappedText = doc.splitTextToSize(paragraph, contentWidth);
				doc.text(wrappedText, margin, yPos);
				yPos += 5 * wrappedText.length + 2;
			}

			// Check if we need to add a new page
			if (yPos > doc.internal.pageSize.getHeight() - margin) {
				doc.addPage();
				yPos = margin;
			}
		}

		// --- 6. Process closing section ---
		yPos += 3; // Extra space before closing

		// Handle closing and signature if found
		if (closingIndex >= 0) {
			// Find all closing text (everything from "Thank you" to before "Sincerely")
			let closingText = '';
			let j = closingIndex;

			while (j < lines.length) {
				const line = lines[j].trim();

				if (line === '') {
					j++;
					continue;
				}

				if (line.startsWith('Sincerely') || line.includes('Sincerely,')) {
					break;
				}

				if (closingText) closingText += ' ';
				closingText += line;
				j++;
			}

			// Add closing paragraph if found
			if (closingText) {
				const wrappedClosing = doc.splitTextToSize(closingText, contentWidth);
				doc.text(wrappedClosing, margin, yPos);
				yPos += 5 * wrappedClosing.length + 10; // Extra space after closing paragraph
			}

			// Add "Sincerely,"
			doc.text('Sincerely,', margin, yPos);
			yPos += 15; // Space for signature

			// Add applicant name
			if (applicantName) {
				doc.setFont('Helvetica', 'bold');
				doc.text(applicantName, margin, yPos);
				doc.setFont('Helvetica', 'normal');
			}
		} else {
			// Default closing if not found
			doc.text('Thank you for considering my application.', margin, yPos);
			yPos += 10;
			doc.text('Sincerely,', margin, yPos);
			yPos += 15;

			// Add applicant name
			if (applicantName) {
				doc.setFont('Helvetica', 'bold');
				doc.text(applicantName, margin, yPos);
				doc.setFont('Helvetica', 'normal');
			}
		}

		// Save the PDF
		doc.save(`${applicant_name}_CoverLetter_${jobTitle}.pdf`);
		return true;
	} catch (error) {
		console.error('Error generating PDF:', error);
		return false;
	}
};
