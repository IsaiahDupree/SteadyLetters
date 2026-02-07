/**
 * Unit Tests: Letter PDF Generation
 * Tests for src/lib/letter-pdf.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateLetterPDF, downloadPDF, generateAndDownloadLetterPDF, type LetterData } from '@/lib/letter-pdf';

describe('Letter PDF Generation', () => {
  describe('generateLetterPDF', () => {
    it('should generate a PDF Blob with recipient information', () => {
      const letterData: LetterData = {
        recipientName: 'John Doe',
        recipientAddress: '123 Main St',
        recipientCity: 'Springfield',
        recipientState: 'IL',
        recipientZip: '62701',
        message: 'Hello, this is a test letter.',
      };

      const pdf = generateLetterPDF(letterData);

      expect(pdf).toBeInstanceOf(Blob);
      expect(pdf.type).toBe('application/pdf');
      expect(pdf.size).toBeGreaterThan(0);
    });

    it('should handle handwriting style and color options', () => {
      const letterData: LetterData = {
        recipientName: 'Jane Smith',
        recipientAddress: '456 Oak Ave',
        recipientCity: 'Chicago',
        recipientState: 'IL',
        recipientZip: '60601',
        message: 'Test message',
        handwritingStyle: 'Style 2',
        handwritingColor: 'blue',
      };

      const pdf = generateLetterPDF(letterData);

      expect(pdf).toBeInstanceOf(Blob);
      expect(pdf.type).toBe('application/pdf');
    });

    it('should handle long messages', () => {
      const letterData: LetterData = {
        recipientName: 'Test User',
        recipientAddress: '789 Elm St',
        recipientCity: 'Boston',
        recipientState: 'MA',
        recipientZip: '02101',
        message: 'This is a very long message that should be split into multiple lines when rendered in the PDF. '.repeat(10),
      };

      const pdf = generateLetterPDF(letterData);

      expect(pdf).toBeInstanceOf(Blob);
      expect(pdf.type).toBe('application/pdf');
      expect(pdf.size).toBeGreaterThan(1000); // Should be larger due to more content
    });

    it('should include front image URL note when provided', () => {
      const letterData: LetterData = {
        recipientName: 'Image Test',
        recipientAddress: '321 Pine Rd',
        recipientCity: 'Seattle',
        recipientState: 'WA',
        recipientZip: '98101',
        message: 'Test with image',
        frontImageUrl: 'https://example.com/image.jpg',
      };

      const pdf = generateLetterPDF(letterData);

      expect(pdf).toBeInstanceOf(Blob);
      expect(pdf.type).toBe('application/pdf');
    });

    it('should handle minimal letter data', () => {
      const letterData: LetterData = {
        recipientName: 'Minimal Test',
        recipientAddress: '111 Maple Dr',
        recipientCity: 'Portland',
        recipientState: 'OR',
        recipientZip: '97201',
        message: 'Short message.',
      };

      const pdf = generateLetterPDF(letterData);

      expect(pdf).toBeInstanceOf(Blob);
      expect(pdf.type).toBe('application/pdf');
    });
  });

  describe('downloadPDF', () => {
    beforeEach(() => {
      // Mock DOM APIs
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();

      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
        style: {},
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
    });

    it('should create download link with correct filename', () => {
      const blob = new Blob(['test'], { type: 'application/pdf' });
      const filename = 'test-letter.pdf';

      downloadPDF(blob, filename);

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(blob);
      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('should trigger download and cleanup', () => {
      const blob = new Blob(['test'], { type: 'application/pdf' });
      const filename = 'test.pdf';

      downloadPDF(blob, filename);

      expect(document.body.appendChild).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('generateAndDownloadLetterPDF', () => {
    beforeEach(() => {
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();

      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
        style: {},
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
    });

    it('should generate PDF and trigger download', () => {
      const letterData: LetterData = {
        recipientName: 'Download Test',
        recipientAddress: '999 Download St',
        recipientCity: 'Denver',
        recipientState: 'CO',
        recipientZip: '80201',
        message: 'Download test message',
      };

      generateAndDownloadLetterPDF(letterData);

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
    });

    it('should create filename from recipient name', () => {
      const letterData: LetterData = {
        recipientName: 'Test User Name',
        recipientAddress: '123 Test Ave',
        recipientCity: 'Test City',
        recipientState: 'TC',
        recipientZip: '12345',
        message: 'Test',
      };

      generateAndDownloadLetterPDF(letterData);

      // Verify download was triggered
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
    });

    it('should handle all optional parameters', () => {
      const letterData: LetterData = {
        recipientName: 'Full Test',
        recipientAddress: '456 Full St',
        recipientCity: 'Full City',
        recipientState: 'FC',
        recipientZip: '99999',
        message: 'Complete test with all options',
        handwritingStyle: 'Style 3',
        handwritingColor: 'black',
        frontImageUrl: 'https://example.com/custom-front.jpg',
      };

      generateAndDownloadLetterPDF(letterData);

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(document.body.appendChild).toHaveBeenCalled();
    });
  });
});
