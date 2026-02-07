/**
 * API Endpoint: Generate Letter Preview PDF
 * POST /api/preview/letter-pdf
 *
 * Generates a PDF preview of a letter based on provided data
 * Returns PDF as downloadable file
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { prisma } from '@/lib/prisma';
import { jsPDF } from 'jspdf';

interface LetterPreviewRequest {
  recipientId: string;
  message: string;
  handwritingStyle?: string;
  handwritingColor?: string;
  frontImageUrl?: string;
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser();

    // Parse request body
    const body: LetterPreviewRequest = await req.json();

    // Validate required fields
    if (!body.recipientId || !body.message) {
      return NextResponse.json(
        { error: 'recipientId and message are required' },
        { status: 400 }
      );
    }

    // Get recipient details
    const recipient = await prisma.recipient.findUnique({
      where: { id: body.recipientId },
    });

    if (!recipient || recipient.userId !== user.id) {
      return NextResponse.json(
        { error: 'Recipient not found or unauthorized' },
        { status: 404 }
      );
    }

    // Generate PDF
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

    // Font settings
    doc.setFont('helvetica');
    doc.setFontSize(12);

    // Add title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Letter Preview', margin, margin + 0.3);

    // Add handwriting style info
    let currentY = margin + 0.6;
    if (body.handwritingStyle) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Handwriting Style: ${body.handwritingStyle}`, margin, currentY);
      currentY += 0.25;
    }

    if (body.handwritingColor) {
      doc.setFontSize(10);
      doc.text(`Ink Color: ${body.handwritingColor}`, margin, currentY);
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
    doc.text(recipient.name, margin + 0.3, currentY);
    currentY += 0.2;
    doc.text(recipient.address1, margin + 0.3, currentY);
    currentY += 0.2;
    if (recipient.address2) {
      doc.text(recipient.address2, margin + 0.3, currentY);
      currentY += 0.2;
    }
    doc.text(`${recipient.city}, ${recipient.state} ${recipient.zip}`, margin + 0.3, currentY);
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

    // Split message into lines
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    const lines = doc.splitTextToSize(body.message, contentWidth);

    // Add each line with page breaks
    const lineHeight = 0.25;
    for (const line of lines) {
      if (currentY + lineHeight > pageHeight - margin) {
        doc.addPage();
        currentY = margin + 0.5;
      }

      doc.text(line, margin, currentY);
      currentY += lineHeight;
    }

    // Add footer
    const timestamp = new Date().toLocaleString();
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Preview generated on ${timestamp}`, margin, pageHeight - 0.4);
    doc.text('This is a preview only. Actual letter will be handwritten by Thanks.io', margin, pageHeight - 0.25);

    // Add note if image is included
    if (body.frontImageUrl) {
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text('Note: Custom front image will be included in final letter', margin, pageHeight - 0.6);
    }

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    // Return PDF as downloadable file
    const filename = `letter-preview-${recipient.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });

  } catch (error) {
    console.error('Error generating letter preview PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF preview' },
      { status: 500 }
    );
  }
}
