import type { FullResumeGenerationResponse } from '@/types/suggestionGeneration';
import {
	AlignmentType,
	BorderStyle,
	Document,
	HeadingLevel,
	Packer,
	Paragraph,
	Table,
	TableCell,
	TableRow,
	TextRun,
	WidthType,
} from 'docx';
import jsPDF from 'jspdf';

export const handleDownloadResumeDocx = async ({
	fullResume,
	jobTitle,
}: {
	fullResume: FullResumeGenerationResponse;
	jobTitle: string;
}) => {
	try {
		// Get skills data ready for two-column format
		const skillsCount = fullResume.skills.length;
		const firstColumnCount = Math.ceil(skillsCount / 2);
		const firstColumnSkills = fullResume.skills.slice(0, firstColumnCount);
		const secondColumnSkills = fullResume.skills.slice(firstColumnCount);

		// Create a new Document
		const doc = new Document({
			sections: [
				{
					properties: {},
					children: [
						// Name as header
						new Paragraph({
							text: fullResume.applicant_name,
							heading: HeadingLevel.HEADING_1,
							alignment: AlignmentType.CENTER,
							spacing: {
								after: 200,
							},
						}),

						// Contact info
						new Paragraph({
							text: fullResume.contact_info,
							alignment: AlignmentType.CENTER,
							spacing: {
								after: 600, // Increased spacing after contact info
							},
						}),

						// Summary Header
						new Paragraph({
							text: 'PROFESSIONAL SUMMARY',
							heading: HeadingLevel.HEADING_2,
							spacing: {
								after: 200,
							},
							// Add border for all major section headers
							border: {
								bottom: {
									color: '#000000', // Black color for major section headers
									space: 1,
									style: BorderStyle.SINGLE,
									size: 1,
								},
							},
						}),

						// Summary as bullet points from array
						...fullResume.summary.map(
							(summaryPoint) =>
								new Paragraph({
									children: [
										new TextRun({
											text: '• ',
										}),
										new TextRun({
											text: summaryPoint,
										}),
									],
									spacing: {
										after: 120,
									},
								}),
						),

						// Add extra space after summary section
						new Paragraph({
							spacing: {
								after: 400, // Increased spacing after summary section
							},
						}),

						// Skills Header
						new Paragraph({
							text: 'SKILLS',
							heading: HeadingLevel.HEADING_2,
							spacing: {
								after: 200,
							},
							// Add border for all major section headers
							border: {
								bottom: {
									color: '#000000', // Black color for major section headers
									space: 1,
									style: BorderStyle.SINGLE,
									size: 1,
								},
							},
						}),

						// Skills in two columns using a table
						new Table({
							width: {
								size: 100,
								type: WidthType.PERCENTAGE,
							},
							borders: {
								top: { style: BorderStyle.NONE },
								bottom: { style: BorderStyle.NONE },
								left: { style: BorderStyle.NONE },
								right: { style: BorderStyle.NONE },
								insideHorizontal: { style: BorderStyle.NONE },
								insideVertical: { style: BorderStyle.NONE },
							},
							rows: [
								new TableRow({
									children: [
										new TableCell({
											children: firstColumnSkills.map(
												(skill) =>
													new Paragraph({
														children: [
															new TextRun({
																text: '• ',
															}),
															new TextRun({
																text: skill,
															}),
														],
														spacing: {
															after: 120,
														},
													}),
											),
											width: {
												size: 50,
												type: WidthType.PERCENTAGE,
											},
										}),
										new TableCell({
											children: secondColumnSkills.map(
												(skill) =>
													new Paragraph({
														children: [
															new TextRun({
																text: '• ',
															}),
															new TextRun({
																text: skill,
															}),
														],
														spacing: {
															after: 120,
														},
													}),
											),
											width: {
												size: 50,
												type: WidthType.PERCENTAGE,
											},
										}),
									],
								}),
							],
						}),

						// Add space after skills section
						new Paragraph({
							text: '',
							spacing: {
								after: 400, // Increased spacing after skills section
							},
						}),

						// Add each work experience section
						...fullResume.sections.flatMap((section, sectionIndex, allSections) => {
							// Check if this is the Work Experience section
							const isWorkExperience = section.title.toLowerCase().includes('experience');
							// Check if this is the Education section
							const isEducation = section.title.toLowerCase().includes('education');

							// First add the section header
							const sectionElements = [
								new Paragraph({
									text: section.title.toUpperCase(),
									heading: HeadingLevel.HEADING_2,
									spacing: {
										after: 200,
									},
									// Add black border for all section headers
									border: {
										bottom: {
											color: '#000000', // Black color for all section headers
											space: 1,
											style: BorderStyle.SINGLE,
											size: 1,
										},
									},
								}),
							];

							if (isWorkExperience) {
								// Split experience blocks and process each job
								const experienceBlocks = section.content.split(/\n\s*\n/);

								experienceBlocks.forEach((block, blockIndex) => {
									const lines = block.split('\n');

									// First line should have job and timespan
									let jobTitle = '';
									let company = '';
									let timespan = '';

									if (lines.length > 0) {
										// Try to extract job title and timespan from the first line
										// Assume format like "JOB TITLE | COMPANY | TIMESPAN" or similar
										const parts = lines[0].split('|');
										if (parts.length > 1) {
											jobTitle = parts[0].trim();

											// If there are 3 parts, the middle is company, last is timespan
											if (parts.length > 2) {
												company = parts[1].trim();
												timespan = parts[2].trim();
											} else {
												// If only 2 parts, second is timespan, try to extract company from next line
												timespan = parts[1].trim();
												if (lines.length > 1) {
													company = lines[1].trim();
												}
											}
										} else {
											// Fallback if no pipe separators
											jobTitle = lines[0].trim();
											if (lines.length > 1) {
												company = lines[1].trim();
											}
										}
									}

									// Add job title and timespan on the same line
									sectionElements.push(
										new Paragraph({
											children: [
												new TextRun({
													text: jobTitle,
													bold: true,
												}),
												new TextRun({
													text: ' ' + timespan,
													bold: true,
												}),
											],
											spacing: {
												after: 100,
											},
										}),
									);

									// Add company on next line
									sectionElements.push(
										new Paragraph({
											text: company,
											spacing: {
												after: 150,
											},
										}),
									);

									// Add bullet points for responsibilities/achievements
									// Skip the first 1-2 lines which were job title & company
									let startBullets = 1;
									if (company && !lines[1].includes(company)) {
										startBullets = 2;
									}

									for (let i = startBullets; i < lines.length; i++) {
										const line = lines[i].trim();
										if (!line) continue;

										// Check if it already starts with a bullet
										if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
											sectionElements.push(
												new Paragraph({
													text: line,
													spacing: {
														after: 120,
													},
												}),
											);
										} else {
											sectionElements.push(
												new Paragraph({
													children: [
														new TextRun({
															text: '• ',
														}),
														new TextRun({
															text: line,
														}),
													],
													spacing: {
														after: 120,
													},
												}),
											);
										}
									}

									// Add a separator between jobs except for the first one and the last one
									if (blockIndex < experienceBlocks.length - 1) {
										sectionElements.push(
											new Paragraph({
												spacing: {
													after: 200,
												},
												border: {
													bottom: {
														color: '#CCCCCC', // Light gray color for the line
														space: 1,
														style: BorderStyle.SINGLE,
														size: 1,
													},
												},
											}),
										);

										// Add extra space after the separator
										sectionElements.push(
											new Paragraph({
												spacing: {
													after: 200,
												},
											}),
										);
									}
								});

								return sectionElements;
							} else {
								// For other sections, process normally but without border
								const sectionContent = [
									...section.content.split('\n').map((line, lineIndex) => {
										const trimmedLine = line.trim();
										if (!trimmedLine) {
											return new Paragraph({
												spacing: {
													after: 50,
												},
											});
										}

										// For Education section, don't add bullets to school names (usually the first line of each entry)
										// This is a simple heuristic - we check if it's the education section and if the line
										// doesn't already have a bullet and doesn't start with common educational details
										const isSchoolName =
											isEducation &&
											!trimmedLine.startsWith('•') &&
											!trimmedLine.startsWith('-') &&
											!trimmedLine.startsWith('*') &&
											!trimmedLine.match(
												/^(bachelor|master|phd|doctor|associate|b\.s\.|m\.s\.|b\.a\.|m\.a\.|ph\.d\.|gpa|course|degree|certificate)/i,
											) &&
											(lineIndex === 0 ||
												section.content.split('\n')[lineIndex - 1].trim() === '');

										// Check if it already starts with a bullet or is a school name
										if (
											trimmedLine.startsWith('•') ||
											trimmedLine.startsWith('-') ||
											trimmedLine.startsWith('*') ||
											isSchoolName
										) {
											return new Paragraph({
												text: trimmedLine,
												spacing: {
													after: 120,
												},
											});
										} else {
											return new Paragraph({
												children: [
													new TextRun({
														text: '• ',
													}),
													new TextRun({
														text: trimmedLine,
													}),
												],
												spacing: {
													after: 120,
												},
											});
										}
									}),
									// Add extra space after each section
									new Paragraph({
										spacing: {
											after: 400, // Increased spacing after sections
										},
									}),
								];

								return [sectionElements[0], ...sectionContent];
							}
						}),
					],
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
		a.download = `${fullResume.applicant_name}_Resume_${jobTitle}.docx`;
		a.click();

		// Clean up
		URL.revokeObjectURL(url);

		return true;
	} catch (error) {
		console.error('Error generating DOCX:', error);
		return false;
	}
};

export const handleDownloadResumePdf = async ({
	fullResume,
	jobTitle,
}: {
	fullResume: FullResumeGenerationResponse;
	jobTitle: string;
}) => {
	try {
		// Create new PDF document
		const doc = new jsPDF({
			orientation: 'portrait',
			unit: 'mm',
			format: 'a4',
		});

		// PDF dimensions and margins
		const pageWidth = doc.internal.pageSize.getWidth();
		const pageHeight = doc.internal.pageSize.getHeight();
		const margin = 20; // mm
		const contentWidth = pageWidth - margin * 2;
		const halfWidth = contentWidth / 2 - 3; // half width minus spacing

		let yPos = margin;

		// Add applicant name
		doc.setFont('Helvetica', 'bold');
		doc.setFontSize(16);
		doc.text(fullResume.applicant_name, pageWidth / 2, yPos, { align: 'center' });
		yPos += 8;

		// Add contact info
		doc.setFont('Helvetica', 'normal');
		doc.setFontSize(10);
		doc.text(fullResume.contact_info, pageWidth / 2, yPos, { align: 'center' });
		yPos += 15; // Increased spacing after contact info

		// Professional Summary
		doc.setFont('Helvetica', 'bold');
		doc.setFontSize(12);
		doc.text('PROFESSIONAL SUMMARY', margin, yPos);

		// Add black line under section title
		yPos += 2;
		doc.setDrawColor(0); // Black color
		doc.setLineWidth(0.5);
		doc.line(margin, yPos, pageWidth - margin, yPos); // Full width line

		yPos += 6; // Increased spacing after section title

		// Add summary as bullet points
		doc.setFont('Helvetica', 'normal');
		doc.setFontSize(10);

		// Handle summary as an array of strings
		for (const summaryPoint of fullResume.summary) {
			// Check if we need a new page
			if (yPos > pageHeight - margin) {
				doc.addPage();
				yPos = margin;
			}

			const bulletText = '• ' + summaryPoint;
			const wrappedText = doc.splitTextToSize(bulletText, contentWidth);
			doc.text(wrappedText, margin, yPos);
			yPos += wrappedText.length * 5;
		}

		yPos += 8; // Increased spacing after summary section

		// Skills header
		doc.setFont('Helvetica', 'bold');
		doc.setFontSize(12);
		doc.text('SKILLS', margin, yPos);

		// Add black line under section title
		yPos += 2;
		doc.setDrawColor(0); // Black color
		doc.setLineWidth(0.5);
		doc.line(margin, yPos, pageWidth - margin, yPos); // Full width line

		yPos += 6; // Increased spacing after section title

		// Format skills in two columns
		doc.setFont('Helvetica', 'normal');
		doc.setFontSize(10);

		// Calculate how to split skills into two columns
		const skills = fullResume.skills;
		const skillsCount = skills.length;
		const firstColumnCount = Math.ceil(skillsCount / 2);

		// Keep track of the highest yPos for both columns
		let leftColYPos = yPos;
		let rightColYPos = yPos;

		// First column of skills
		for (let i = 0; i < firstColumnCount; i++) {
			if (leftColYPos > pageHeight - margin) {
				doc.addPage();
				leftColYPos = margin;
				rightColYPos = margin; // Reset right column too on new page
			}

			const bulletSkill = '• ' + skills[i];
			const wrappedText = doc.splitTextToSize(bulletSkill, halfWidth);
			doc.text(wrappedText, margin, leftColYPos);
			leftColYPos += wrappedText.length * 5;
		}

		// Second column of skills
		for (let i = firstColumnCount; i < skillsCount; i++) {
			if (rightColYPos > pageHeight - margin) {
				doc.addPage();
				rightColYPos = margin;
				// No need to reset left column as we've moved to second column
			}

			const bulletSkill = '• ' + skills[i];
			const wrappedText = doc.splitTextToSize(bulletSkill, halfWidth);
			doc.text(wrappedText, margin + halfWidth + 6, rightColYPos);
			rightColYPos += wrappedText.length * 5;
		}

		// Set yPos to the highest of the two columns
		yPos = Math.max(leftColYPos, rightColYPos) + 10; // Increased spacing after skills section

		// Add each section
		for (const section of fullResume.sections) {
			// Check if we need to add a new page
			if (yPos > pageHeight - margin) {
				doc.addPage();
				yPos = margin;
			}

			// Section title
			doc.setFont('Helvetica', 'bold');
			doc.setFontSize(12);
			doc.text(section.title.toUpperCase(), margin, yPos);

			// Add black line under section title
			yPos += 2;
			doc.setDrawColor(0); // Black color
			doc.setLineWidth(0.5);
			doc.line(margin, yPos, pageWidth - margin, yPos); // Full width line

			yPos += 6; // Consistent spacing after section title

			// Check if this is work experience to format specially
			const isWorkExperience = section.title.toLowerCase().includes('experience');
			const isEducation = section.title.toLowerCase().includes('education');

			if (isWorkExperience) {
				// Split into job blocks
				const experienceBlocks = section.content.split(/\n\s*\n/);

				for (let blockIndex = 0; blockIndex < experienceBlocks.length; blockIndex++) {
					const block = experienceBlocks[blockIndex];
					const lines = block.split('\n');

					// Extract job information
					let jobTitle = '';
					let company = '';
					let timespan = '';

					if (lines.length > 0) {
						// Try to extract job title and timespan from the first line
						const parts = lines[0].split('|');
						if (parts.length > 1) {
							jobTitle = parts[0].trim();

							// If there are 3 parts, the middle is company, last is timespan
							if (parts.length > 2) {
								company = parts[1].trim();
								timespan = parts[2].trim();
							} else {
								// If only 2 parts, second is timespan, try to extract company from next line
								timespan = parts[1].trim();
								if (lines.length > 1) {
									company = lines[1].trim();
								}
							}
						} else {
							// Fallback if no pipe separators
							jobTitle = lines[0].trim();
							if (lines.length > 1) {
								company = lines[1].trim();
							}
						}
					}

					// Add job title (left) and timespan (right)
					if (yPos > pageHeight - margin) {
						doc.addPage();
						yPos = margin;
					}

					doc.setFont('Helvetica', 'bold');
					doc.setFontSize(11);
					doc.text(jobTitle, margin, yPos);

					// Add timespan right-aligned
					const timespanWidth = doc.getTextWidth(timespan);
					doc.text(timespan, pageWidth - margin - timespanWidth, yPos);
					yPos += 5;

					// Add company
					doc.setFont('Helvetica', 'normal');
					doc.setFontSize(10);
					doc.text(company, margin, yPos);
					yPos += 6;

					// Process bullet points
					let startBullets = 1;
					if (company && !lines[1].includes(company)) {
						startBullets = 2;
					}

					for (let i = startBullets; i < lines.length; i++) {
						const line = lines[i].trim();
						if (!line) continue;

						// Check if we need a new page
						if (yPos > pageHeight - margin) {
							doc.addPage();
							yPos = margin;
						}

						// Add bulletpoint if not already there
						let bulletLine = line;
						if (!line.startsWith('•') && !line.startsWith('-') && !line.startsWith('*')) {
							bulletLine = '• ' + line;
						}

						const wrappedText = doc.splitTextToSize(bulletLine, contentWidth);
						doc.text(wrappedText, margin, yPos);
						yPos += wrappedText.length * 5;
					}

					// Add separator between jobs except for the last one
					// Only add light gray separator between jobs, not before the first one
					if (blockIndex < experienceBlocks.length - 1) {
						yPos += 4;

						// Add a light separator line
						if (yPos < pageHeight - margin) {
							// Only if there's room
							doc.setDrawColor(200); // Light gray color
							doc.setLineWidth(0.1);
							doc.line(margin, yPos, pageWidth - margin, yPos); // Full width line
						}

						yPos += 6; // Increased spacing between job entries
					}
				}
			} else {
				// For non-work experience sections, add content with bullet points
				doc.setFont('Helvetica', 'normal');
				doc.setFontSize(10);

				const contentLines = section.content.split('\n');
				let isFirstLineInEntry = true;

				for (let lineIndex = 0; lineIndex < contentLines.length; lineIndex++) {
					const line = contentLines[lineIndex];
					const trimmedLine = line.trim();

					if (!trimmedLine) {
						yPos += 2;
						isFirstLineInEntry = true; // Reset for next entry
						continue;
					}

					// Check if we need a new page
					if (yPos > pageHeight - margin) {
						doc.addPage();
						yPos = margin;
					}

					// Determine if this is a school name in education section
					// School names are typically at the start of an entry and don't have common educational terms
					const isSchoolName =
						isEducation &&
						isFirstLineInEntry &&
						!trimmedLine.startsWith('•') &&
						!trimmedLine.startsWith('-') &&
						!trimmedLine.startsWith('*') &&
						!trimmedLine.match(
							/^(bachelor|master|phd|doctor|associate|b\.s\.|m\.s\.|b\.a\.|m\.a\.|ph\.d\.|gpa|course|degree|certificate)/i,
						);

					// Add bulletpoint if not already there and not a school name
					let formattedLine = trimmedLine;
					if (
						!trimmedLine.startsWith('•') &&
						!trimmedLine.startsWith('-') &&
						!trimmedLine.startsWith('*') &&
						!isSchoolName
					) {
						formattedLine = '• ' + trimmedLine;
					}

					const wrappedLines = doc.splitTextToSize(formattedLine, contentWidth);
					doc.text(wrappedLines, margin, yPos);
					yPos += wrappedLines.length * 5;

					isFirstLineInEntry = false; // After processing a line, it's no longer the first line
				}
			}

			yPos += 10; // Increased spacing after each section
		}

		// Save the PDF
		doc.save(`${fullResume.applicant_name}_Resume_${jobTitle}.pdf`);
		return true;
	} catch (error) {
		console.error('Error generating PDF:', error);
		return false;
	}
};
