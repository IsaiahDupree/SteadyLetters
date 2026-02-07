/**
 * Letter PDF Generation Utility
 * Generates downloadable PDF previews of letters before sending via Thanks.io
 */

import { jsPDF } from 'jspdf';

export interface LetterData {
  recipientName: string;
  recipientAddress: string;
  recipientCity: string;
  recipientState: string;
  recipientZip: string;
  message: string;
  handwritingStyle?: string;
  handwritingColor?: string;
  frontImageUrl?: string;
}

/**
 * Generate a PDF preview of a letter
 * Returns the PDF as a Blob for download
 */
export function generateLetterPDF(data: LetterData): Blob {
  // Create new PDF document (standard letter size: 8.5 x 11 inches)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: 'letter',
  });

  // Page dimensions
  const pageWidth = 8.5;
  const pageHeight = 11;
  const margin = 0.75;
  const contentWidth = pageWidth - (2 * margin);

  // Font settings for handwritten style
  doc.setFont('helvetica');
  doc.setFontSize(12);

  // Add title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Letter Preview', margin, margin + 0.3);

  // Add handwriting style info if provided
  let currentY = margin + 0.6;
  if (data.handwritingStyle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Handwriting Style: ${data.handwritingStyle}`, margin, currentY);
    currentY += 0.25;
  }

  if (data.handwritingColor) {
    doc.setFontSize(10);
    doc.text(`Ink Color: ${data.handwritingColor}`, margin, currentY);
    currentY += 0.25;
  }

  // Add separator line
  currentY += 0.2;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 0.4;

  // Add recipient address
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('To:', margin, currentY);
  currentY += 0.25;

  doc.setFontSize(12);
  doc.text(data.recipientName, margin + 0.3, currentY);
  currentY += 0.2;
  doc.text(data.recipientAddress, margin + 0.3, currentY);
  currentY += 0.2;
  doc.text(`${data.recipientCity}, ${data.recipientState} ${data.recipientZip}`, margin + 0.3, currentY);
  currentY += 0.5;

  // Add separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 0.4;

  // Add letter content
  doc.setFontSize(11);
  doc.setFont('helvetica', 'italic');
  doc.text('Letter Content:', margin, currentY);
  currentY += 0.35;

  // Split message into lines that fit within the content width
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  const lines = doc.splitTextToSize(data.message, contentWidth);

  // Add each line, handling page breaks
  const lineHeight = 0.25;
  for (const line of lines) {
    // Check if we need a new page
    if (currentY + lineHeight > pageHeight - margin) {
      doc.addPage();
      currentY = margin + 0.5;
    }

    doc.text(line, margin, currentY);
    currentY += lineHeight;
  }

  // Add footer with timestamp and watermark
  const timestamp = new Date().toLocaleString();
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Preview generated on ${timestamp}`, margin, pageHeight - 0.4);
  doc.text('This is a preview only. Actual letter will be handwritten by Thanks.io', margin, pageHeight - 0.25);

  // Add note if image is included
  if (data.frontImageUrl) {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Note: Custom front image will be included in final letter', margin, pageHeight - 0.6);
  }

  // Return PDF as Blob
  return doc.output('blob');
}

/**
 * Download a PDF blob with a given filename
 */
export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate and download a letter preview PDF
 */
export function generateAndDownloadLetterPDF(data: LetterData): void {
  const pdf = generateLetterPDF(data);
  const filename = `letter-preview-${data.recipientName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;
  downloadPDF(pdf, filename);
}
