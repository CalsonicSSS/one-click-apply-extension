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
					properties: {
						page: {
							margin: {
								top: 720, // Reduced margins for 1-page fit (0.5 inch = 720 twips)
								right: 720,
								bottom: 720,
								left: 720,
							},
						},
					},
					children: [
						// Name as header - LARGER, BOLD, CENTERED
						new Paragraph({
							text: fullResume.applicant_name,
							heading: HeadingLevel.HEADING_1,
							alignment: AlignmentType.CENTER,
							spacing: {
								after: 100, // Reduced spacing
							},
						}),

						// Contact info - CENTERED
						new Paragraph({
							text: fullResume.contact_info,
							alignment: AlignmentType.CENTER,
							spacing: {
								after: 300, // Reduced spacing
							},
						}),

						// SUMMARY Header
						new Paragraph({
							text: 'SUMMARY',
							heading: HeadingLevel.HEADING_2,
							spacing: {
								after: 100, // Reduced spacing
							},
							border: {
								bottom: {
									color: '#000000',
									space: 1,
									style: BorderStyle.SINGLE,
									size: 6,
								},
							},
						}),

						// Summary as paragraph (not bullet points)
						new Paragraph({
							text: fullResume.summary,
							spacing: {
								after: 100, // Reduced spacing
								line: 276, // Single line spacing
							},
						}),

						// Add extra space after summary section
						new Paragraph({
							spacing: {
								after: 200, // Reduced spacing
							},
						}),

						// SKILLS Header
						new Paragraph({
							text: 'SKILLS',
							heading: HeadingLevel.HEADING_2,
							spacing: {
								after: 100, // Reduced spacing
							},
							border: {
								bottom: {
									color: '#000000',
									space: 1,
									style: BorderStyle.SINGLE,
									size: 6,
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
															after: 80, // Reduced spacing
														},
														indent: {
															left: 120,
															hanging: 120,
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
															after: 80, // Reduced spacing
														},
														indent: {
															left: 120,
															hanging: 120,
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

						// Add extra space after skills section
						new Paragraph({
							spacing: {
								after: 200, // Reduced spacing
							},
						}),

						// Add all other sections (Professional Experience, Education, etc.)
						...fullResume.sections.flatMap((section) => {
							const sectionElements: Paragraph[] = [];

							// Section Header
							sectionElements.push(
								new Paragraph({
									text: section.title.toUpperCase(),
									heading: HeadingLevel.HEADING_2,
									spacing: {
										after: 100, // Reduced spacing
									},
									border: {
										bottom: {
											color: '#000000',
											space: 1,
											style: BorderStyle.SINGLE,
											size: 6,
										},
									},
								}),
							);

							const isWorkExperience = section.title.toLowerCase().includes('experience');
							const isEducation = section.title.toLowerCase().includes('education');

							// Handle Work Experience and Education with structured format
							if (isWorkExperience || isEducation) {
								const blocks = section.content.split(/\n\s*\n/);

								blocks.forEach((block, blockIndex) => {
									const lines = block.split('\n');

									let titleText = ''; // Job Title or Degree
									let entity = ''; // Company or Institution
									let timespan = '';

									if (lines.length > 0) {
										const parts = lines[0].split('|');
										if (parts.length > 1) {
											if (parts.length > 2) {
												entity = parts[0].trim();
												titleText = parts[1].trim();
												timespan = parts[2].trim();
											} else {
												entity = parts[0].trim();
												timespan = parts[1].trim();

												if (lines.length > 1) {
													titleText = lines[1].trim();
												}
											}
										} else {
											entity = lines[0].trim();
											if (lines.length > 1) {
												titleText = lines[1].trim();
											}
										}
									}

									// Add company/institution and timespan on the same line (BOLD)
									sectionElements.push(
										new Paragraph({
											children: [
												new TextRun({
													text: entity,
													bold: true,
												}),
												new TextRun({
													text: '\t' + timespan,
													bold: true,
												}),
											],
											spacing: {
												after: 80, // Reduced spacing
											},
											tabStops: [
												{
													type: 'right',
													position: 9000,
												},
											],
										}),
									);

									// Add job title/degree on next line (ITALIC)
									sectionElements.push(
										new Paragraph({
											children: [
												new TextRun({
													text: titleText,
													italics: true, // Made italic
												}),
											],
											spacing: {
												after: 100, // Reduced spacing
											},
										}),
									);

									// Add bullet points for responsibilities/achievements
									let startBullets = 1;
									if (entity && lines.length > 1 && lines[1].trim() === entity) {
										startBullets = 2;
									} else if (titleText && lines.length > 1 && lines[1].trim() === titleText) {
										startBullets = 2;
									}

									for (let i = startBullets; i < lines.length; i++) {
										const line = lines[i].trim();
										if (!line) continue;

										if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
											sectionElements.push(
												new Paragraph({
													text: line,
													spacing: {
														after: 120, // Bigger spacing between bullets
														line: 240, // Tighter spacing within bullet (wrapped lines)
													},
													indent: {
														left: 120,
														hanging: 120,
													},
												}),
											);
										} else {
											sectionElements.push(
												new Paragraph({
													children: [
														new TextRun({ text: '• ' }),
														new TextRun({ text: line }),
													],
													spacing: {
														after: 120, // Bigger spacing between bullets
														line: 240, // Tighter spacing within bullet (wrapped lines)
													},
													indent: {
														left: 120,
														hanging: 120,
													},
												}),
											);
										}
									}

									// Add spacing between entries (no separator line)
									if (blockIndex < blocks.length - 1) {
										sectionElements.push(
											new Paragraph({
												spacing: {
													after: 150, // Just spacing between job entries
												},
											}),
										);
									}
								});

								return sectionElements;
							} else {
								// For other sections (Achievements, Certifications, etc.), process normally
								const sectionContent = [
									...section.content.split('\n').map((line, lineIndex) => {
										const trimmedLine = line.trim();
										if (!trimmedLine) {
											return new Paragraph({
												spacing: { after: 50 },
											});
										}

										if (
											trimmedLine.startsWith('•') ||
											trimmedLine.startsWith('-') ||
											trimmedLine.startsWith('*')
										) {
											return new Paragraph({
												text: trimmedLine,
												spacing: { after: 80 }, // Reduced spacing
												indent: {
													left: 120,
													hanging: 120,
												},
											});
										} else {
											return new Paragraph({
												children: [
													new TextRun({ text: '• ' }),
													new TextRun({ text: trimmedLine }),
												],
												spacing: { after: 80 }, // Reduced spacing
												indent: {
													left: 120,
													hanging: 120,
												},
											});
										}
									}),
									// Add extra space after each section
									new Paragraph({
										spacing: {
											after: 200, // Reduced spacing
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

		// PDF dimensions and margins - REDUCED for 1-page fit
		const pageWidth = doc.internal.pageSize.getWidth();
		const pageHeight = doc.internal.pageSize.getHeight();
		const margin = 15; // Reduced from 20mm to 15mm
		const contentWidth = pageWidth - margin * 2;
		const halfWidth = contentWidth / 2 - 3;

		let yPos = margin;
		const bulletMargin = 2;
		const lineHeight = 4.5; // Reduced from 5 to 4.5 for tighter spacing

		// Add applicant name - CENTERED, BOLD, LARGER
		doc.setFont('Helvetica', 'bold');
		doc.setFontSize(18); // Increased from 16 for prominence
		doc.text(fullResume.applicant_name, pageWidth / 2, yPos, { align: 'center' });
		yPos += 6; // Reduced spacing

		// Add contact info - CENTERED
		doc.setFont('Helvetica', 'normal');
		doc.setFontSize(10);
		doc.text(fullResume.contact_info, pageWidth / 2, yPos, { align: 'center' });
		yPos += 10; // Reduced spacing

		// SUMMARY Section (now a paragraph, not bullets)
		doc.setFont('Helvetica', 'bold');
		doc.setFontSize(11); // Reduced from 12
		doc.text('SUMMARY', margin, yPos);

		// Add black line under section title
		yPos += 2;
		doc.setDrawColor(0);
		doc.setLineWidth(0.5);
		doc.line(margin, yPos, pageWidth - margin, yPos);
		yPos += 5; // Reduced spacing

		// Add summary as paragraph (not bullets)
		doc.setFont('Helvetica', 'normal');
		doc.setFontSize(10);
		const summaryLines = doc.splitTextToSize(fullResume.summary, contentWidth);
		summaryLines.forEach((line: string) => {
			if (yPos > pageHeight - margin) {
				doc.addPage();
				yPos = margin;
			}
			doc.text(line, margin, yPos);
			yPos += lineHeight;
		});
		yPos += 5; // Reduced spacing after summary

		// SKILLS Section
		doc.setFont('Helvetica', 'bold');
		doc.setFontSize(11);
		doc.text('SKILLS', margin, yPos);
		yPos += 2;
		doc.setDrawColor(0);
		doc.setLineWidth(0.5);
		doc.line(margin, yPos, pageWidth - margin, yPos);
		yPos += 5;

		// Format skills in two columns
		doc.setFont('Helvetica', 'normal');
		doc.setFontSize(10);
		const skills = fullResume.skills;
		const skillsCount = skills.length;
		const firstColumnCount = Math.ceil(skillsCount / 2);
		let leftColYPos = yPos;
		let rightColYPos = yPos;

		for (let i = 0; i < firstColumnCount; i++) {
			if (leftColYPos > pageHeight - margin) {
				doc.addPage();
				leftColYPos = margin;
				rightColYPos = margin;
			}
			const bulletSkill = '• ' + skills[i];
			const wrappedText = doc.splitTextToSize(bulletSkill, halfWidth);
			wrappedText.forEach((line: string, idx: number) => {
				doc.text(line, idx === 0 ? margin : margin + bulletMargin, leftColYPos);
				leftColYPos += lineHeight;
			});
		}

		for (let i = firstColumnCount; i < skillsCount; i++) {
			if (rightColYPos > pageHeight - margin) {
				doc.addPage();
				rightColYPos = margin;
			}
			const bulletSkill = '• ' + skills[i];
			const wrappedText = doc.splitTextToSize(bulletSkill, halfWidth);
			wrappedText.forEach((line: string, idx: number) => {
				doc.text(
					line,
					idx === 0 ? margin + halfWidth + 6 : margin + halfWidth + 6 + bulletMargin,
					rightColYPos,
				);
				rightColYPos += lineHeight;
			});
		}

		// Set yPos to the highest of the two columns and add spacing
		yPos = Math.max(leftColYPos, rightColYPos) + 6; // Reduced spacing

		// Add each section (Professional Experience, Education, etc.)
		for (const section of fullResume.sections) {
			if (yPos > pageHeight - margin) {
				doc.addPage();
				yPos = margin;
			}

			// Section title
			doc.setFont('Helvetica', 'bold');
			doc.setFontSize(11);
			doc.text(section.title.toUpperCase(), margin, yPos);
			yPos += 2;
			doc.setDrawColor(0);
			doc.setLineWidth(0.5);
			doc.line(margin, yPos, pageWidth - margin, yPos);
			yPos += 5;

			const isWorkExperience = section.title.toLowerCase().includes('experience');
			const isEducation = section.title.toLowerCase().includes('education');

			// Handle Work Experience and Education with structured format
			if (isWorkExperience || isEducation) {
				const blocks = section.content.split(/\n\s*\n/);
				for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
					const block = blocks[blockIndex];
					const lines = block.split('\n');

					let titleText = ''; // Job Title or Degree
					let entity = ''; // Company or Institution
					let timespan = '';

					if (lines.length > 0) {
						const parts = lines[0].split('|');
						if (parts.length > 1) {
							if (parts.length > 2) {
								entity = parts[0].trim(); // Company/Institution
								titleText = parts[1].trim(); // Job Title/Degree
								timespan = parts[2].trim(); // Timespan
							} else {
								entity = parts[0].trim();
								timespan = parts[1].trim();
								if (lines.length > 1) {
									titleText = lines[1].trim();
								}
							}
						} else {
							entity = lines[0].trim();
							if (lines.length > 1) {
								titleText = lines[1].trim();
							}
						}
					}

					if (yPos > pageHeight - margin) {
						doc.addPage();
						yPos = margin;
					}

					// Company/Institution on left (BOLD) and timespan on right (BOLD)
					doc.setFont('Helvetica', 'bold');
					doc.setFontSize(10); // Reduced from 11
					doc.text(entity, margin, yPos);
					const timespanWidth = doc.getTextWidth(timespan);
					doc.text(timespan, pageWidth - margin - timespanWidth, yPos);
					yPos += 4.5; // Reduced spacing

					// Job title/degree name (ITALIC for job title)
					doc.setFont('Helvetica', 'italic'); // Changed to italic
					doc.setFontSize(10);
					doc.text(titleText, margin, yPos);
					yPos += 5; // Reduced spacing

					// Determine where bullet points start
					let startBullets = 1;
					if (entity && lines.length > 1 && lines[1].trim() === entity) {
						startBullets = 2;
					} else if (titleText && lines.length > 1 && lines[1].trim() === titleText) {
						startBullets = 2;
					}

					// Add bullet points
					doc.setFont('Helvetica', 'normal');
					doc.setFontSize(10);
					for (let i = startBullets; i < lines.length; i++) {
						const line = lines[i].trim();
						if (!line) continue;

						if (yPos > pageHeight - margin) {
							doc.addPage();
							yPos = margin;
						}

						let formattedLine = line;
						if (!line.startsWith('•') && !line.startsWith('-') && !line.startsWith('*')) {
							formattedLine = '• ' + line;
						}

						const wrappedLines = doc.splitTextToSize(formattedLine, contentWidth);
						wrappedLines.forEach((txt: string, idx: number) => {
							doc.text(txt, idx === 0 ? margin : margin + bulletMargin, yPos);
							// Smaller spacing within wrapped lines (3.8), bigger spacing after bullet ends
							if (idx < wrappedLines.length - 1) {
								yPos += 3; // Smaller spacing within bullet (wrapped lines)
							} else {
								yPos += 6; // Bigger spacing between bullets
							}
						});
					}

					// Add separator between entries (lighter and thinner)
					if (blockIndex < blocks.length - 1) {
						yPos += 4; // Just spacing, no line
					}
				}
			} else {
				// Process other sections (Achievements, Certifications, etc.) normally
				doc.setFont('Helvetica', 'normal');
				doc.setFontSize(10);
				const contentLines = section.content.split('\n');
				for (let lineIndex = 0; lineIndex < contentLines.length; lineIndex++) {
					const line = contentLines[lineIndex];
					const trimmedLine = line.trim();
					if (!trimmedLine) {
						yPos += 2;
						continue;
					}
					if (yPos > pageHeight - margin) {
						doc.addPage();
						yPos = margin;
					}

					let formattedLine = trimmedLine;
					if (!trimmedLine.startsWith('•') && !trimmedLine.startsWith('-') && !trimmedLine.startsWith('*')) {
						formattedLine = '• ' + trimmedLine;
					}
					const wrappedLines = doc.splitTextToSize(formattedLine, contentWidth);
					wrappedLines.forEach((txt: string, idx: number) => {
						doc.text(txt, idx === 0 ? margin : margin + bulletMargin, yPos);
						yPos += lineHeight;
					});
				}
			}
			yPos += 6; // Reduced spacing between sections
		}

		// Save the PDF
		doc.save(`${fullResume.applicant_name}_Resume_${jobTitle}.pdf`);
		return true;
	} catch (error) {
		console.error('Error generating PDF:', error);
		return false;
	}
};
