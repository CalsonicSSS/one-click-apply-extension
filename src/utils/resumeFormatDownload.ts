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
								after: 600,
							},
						}),

						// Summary Header
						new Paragraph({
							text: 'PROFESSIONAL SUMMARY',
							heading: HeadingLevel.HEADING_2,
							spacing: {
								after: 200,
							},
							border: {
								bottom: {
									color: '#000000',
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
									indent: {
										left: 120,
										hanging: 120,
									},
								}),
						),

						// Add extra space after summary section
						new Paragraph({
							spacing: {
								after: 400,
							},
						}),

						// Skills Header
						new Paragraph({
							text: 'SKILLS',
							heading: HeadingLevel.HEADING_2,
							spacing: {
								after: 200,
							},
							border: {
								bottom: {
									color: '#000000',
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
															after: 120,
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

						// Add space after skills section
						new Paragraph({
							text: '',
							spacing: {
								after: 400,
							},
						}),

						// Add each work experience/other section
						...fullResume.sections.flatMap((section, sectionIndex, allSections) => {
							const isWorkExperience = section.title.toLowerCase().includes('experience');
							const isEducation = section.title.toLowerCase().includes('education');

							// First add the section header
							const sectionElements = [
								new Paragraph({
									text: section.title.toUpperCase(),
									heading: HeadingLevel.HEADING_2,
									spacing: {
										after: 200,
									},
									border: {
										bottom: {
											color: '#000000',
											space: 1,
											style: BorderStyle.SINGLE,
											size: 1,
										},
									},
								}),
							];

							if (isWorkExperience || isEducation) {
								// Split experience/education blocks and process each entry
								const blocks = section.content.split(/\n\s*\n/);

								blocks.forEach((block, blockIndex) => {
									const lines = block.split('\n');

									let titleText = ''; // Job Title or Degree
									let entity = ''; // Company or Institution
									let timespan = '';

									if (lines.length > 0) {
										const parts = lines[0].split('|');
										if (parts.length > 1) {
											// FIXED: Correct parsing order based on prompt format
											// Format: "Company | Job Title | Timespan" or "Institution | Degree | Timespan"
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
												after: 100,
											},
											tabStops: [
												{
													type: 'right',
													position: 9000,
												},
											],
										}),
									);

									// Add job title/degree on next line (NORMAL, slightly larger)
									sectionElements.push(
										new Paragraph({
											children: [
												new TextRun({
													text: titleText,
													size: 22, // Slightly larger than default (20)
												}),
											],
											spacing: {
												after: 150,
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

									let bulletPointCount = 0;
									for (let i = startBullets; i < lines.length; i++) {
										const line = lines[i].trim();
										if (!line) continue;

										bulletPointCount++;

										if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
											sectionElements.push(
												new Paragraph({
													text: line,
													spacing: { after: 120 },
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
													spacing: { after: 120 },
													indent: {
														left: 120,
														hanging: 120,
													},
												}),
											);
										}
									}

									// For Work Experience, ensure at least 3 bullet points
									if (isWorkExperience && bulletPointCount < 3) {
										for (let i = bulletPointCount; i < 3; i++) {
											sectionElements.push(
												new Paragraph({
													children: [
														new TextRun({ text: '• ' }),
														new TextRun({
															text: `Additional responsibility related to ${titleText} role.`,
														}),
													],
													spacing: { after: 120 },
													indent: {
														left: 120,
														hanging: 120,
													},
												}),
											);
										}
									}

									// Add separator between entries except for the last one
									if (blockIndex < blocks.length - 1) {
										sectionElements.push(
											new Paragraph({
												spacing: {
													after: 200,
												},
												border: {
													bottom: {
														color: '#CCCCCC',
														space: 1,
														style: BorderStyle.SINGLE,
														size: 1,
													},
												},
											}),
										);

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
												spacing: { after: 120 },
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
												spacing: { after: 120 },
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
											after: 400,
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
		const bulletMargin = 2; // additional indent for wrapped bullet lines
		const lineHeight = 5; // vertical spacing between lines

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
		doc.line(margin, yPos, pageWidth - margin, yPos);
		yPos += 6;

		// Add summary as bullet points (using hanging indent for wrapped lines)
		doc.setFont('Helvetica', 'normal');
		doc.setFontSize(10);
		for (const summaryPoint of fullResume.summary) {
			if (yPos > pageHeight - margin) {
				doc.addPage();
				yPos = margin;
			}
			const bulletText = '• ' + summaryPoint;
			const wrappedText = doc.splitTextToSize(bulletText, contentWidth);
			wrappedText.forEach((line, index) => {
				// First line with bullet; subsequent lines get indent
				doc.text(line, index === 0 ? margin : margin + bulletMargin, yPos);
				yPos += lineHeight;
			});
		}
		yPos += 8;

		// Skills header
		doc.setFont('Helvetica', 'bold');
		doc.setFontSize(12);
		doc.text('SKILLS', margin, yPos);
		yPos += 2;
		doc.setDrawColor(0);
		doc.setLineWidth(0.5);
		doc.line(margin, yPos, pageWidth - margin, yPos);
		yPos += 6;

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
			wrappedText.forEach((line, idx) => {
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
			wrappedText.forEach((line, idx) => {
				doc.text(
					line,
					idx === 0 ? margin + halfWidth + 6 : margin + halfWidth + 6 + bulletMargin,
					rightColYPos,
				);
				rightColYPos += lineHeight;
			});
		}

		// Set yPos to the highest of the two columns and add spacing
		yPos = Math.max(leftColYPos, rightColYPos) + 10;

		// Add each section (work experience, education, etc.)
		for (const section of fullResume.sections) {
			if (yPos > pageHeight - margin) {
				doc.addPage();
				yPos = margin;
			}
			// Section title
			doc.setFont('Helvetica', 'bold');
			doc.setFontSize(12);
			doc.text(section.title.toUpperCase(), margin, yPos);
			yPos += 2;
			doc.setDrawColor(0);
			doc.setLineWidth(0.5);
			doc.line(margin, yPos, pageWidth - margin, yPos);
			yPos += 6;

			const isWorkExperience = section.title.toLowerCase().includes('experience');
			const isEducation = section.title.toLowerCase().includes('education');

			// Handle both work experience and education with the corrected structured approach
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
							// FIXED: Correct the parsing order based on prompt format
							// Format: "Company | Job Title | Timespan" or "Institution | Degree | Timespan"
							if (parts.length > 2) {
								entity = parts[0].trim(); // Company/Institution (for bold display)
								titleText = parts[1].trim(); // Job Title/Degree (for normal display)
								timespan = parts[2].trim(); // Timespan
							} else {
								// If only 2 parts, assume "Entity | Timespan"
								entity = parts[0].trim();
								timespan = parts[1].trim();

								// Look for title/degree in next line
								if (lines.length > 1) {
									titleText = lines[1].trim();
								}
							}
						} else {
							// Fallback if no pipe separators
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
					doc.setFontSize(11);
					doc.text(entity, margin, yPos);
					const timespanWidth = doc.getTextWidth(timespan);
					doc.text(timespan, pageWidth - margin - timespanWidth, yPos);
					yPos += 5;

					// Job title/degree name (NORMAL, slightly larger font)
					doc.setFont('Helvetica', 'normal');
					doc.setFontSize(11); // Increased from 10 to 11 for better visibility
					doc.text(titleText, margin, yPos);
					yPos += 6;

					// Determine where to start looking for bullet points
					let startBullets = 1;
					// If entity is on second line, start bullets from third line
					if (entity && lines.length > 1 && lines[1].trim() === entity) {
						startBullets = 2;
					}
					// If entity is embedded in first line (part of pipe-separated header)
					else if (entity && lines[0].includes('|') && lines[0].includes(entity)) {
						startBullets = 1;
					}
					// If titleText is on second line, start bullets from third line
					else if (titleText && lines.length > 1 && lines[1].trim() === titleText) {
						startBullets = 2;
					}

					let bulletPointCount = 0;
					for (let i = startBullets; i < lines.length; i++) {
						const line = lines[i].trim();
						if (!line) continue;
						bulletPointCount++;

						if (yPos > pageHeight - margin) {
							doc.addPage();
							yPos = margin;
						}
						let bulletLine = line;
						if (!line.startsWith('•') && !line.startsWith('-') && !line.startsWith('*')) {
							bulletLine = '• ' + line;
						}

						// Set font back to normal size for bullet points
						doc.setFont('Helvetica', 'normal');
						doc.setFontSize(10);

						const wrappedText = doc.splitTextToSize(bulletLine, contentWidth);
						wrappedText.forEach((txt, idx) => {
							doc.text(txt, idx === 0 ? margin : margin + bulletMargin, yPos);
							yPos += lineHeight;
						});
					}

					// For Work Experience, ensure at least 3 bullet points
					if (isWorkExperience && bulletPointCount < 3) {
						// Add generic bullet points to reach minimum of 3
						for (let i = bulletPointCount; i < 3; i++) {
							if (yPos > pageHeight - margin) {
								doc.addPage();
								yPos = margin;
							}

							const genericBullet = `• Additional responsibility related to ${titleText} role.`;
							doc.setFont('Helvetica', 'normal');
							doc.setFontSize(10);
							const wrappedText = doc.splitTextToSize(genericBullet, contentWidth);
							wrappedText.forEach((txt, idx) => {
								doc.text(txt, idx === 0 ? margin : margin + bulletMargin, yPos);
								yPos += lineHeight;
							});
						}
					}

					// Add separator between entries except for the last one
					if (blockIndex < blocks.length - 1) {
						yPos += 4;
						if (yPos < pageHeight - margin) {
							doc.setDrawColor(200);
							doc.setLineWidth(0.1);
							doc.line(margin, yPos, pageWidth - margin, yPos);
						}
						yPos += 6;
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
					wrappedLines.forEach((txt, idx) => {
						doc.text(txt, idx === 0 ? margin : margin + bulletMargin, yPos);
						yPos += lineHeight;
					});
				}
			}
			yPos += 10;
		}

		// Save the PDF
		doc.save(`${fullResume.applicant_name}_Resume_${jobTitle}.pdf`);
		return true;
	} catch (error) {
		console.error('Error generating PDF:', error);
		return false;
	}
};
