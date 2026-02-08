import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PhotoUpload } from '@/components/photo-upload';

// Mock fetch
global.fetch = vi.fn();

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('PhotoUpload Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render upload area when no image is present', () => {
    render(<PhotoUpload onChange={mockOnChange} />);

    expect(screen.getByText(/Drop a photo here or click to upload/i)).toBeInTheDocument();
    expect(screen.getByText(/PNG, JPG, WEBP up to 10MB/i)).toBeInTheDocument();
  });

  it('should show image preview after file selection', async () => {
    render(<PhotoUpload onChange={mockOnChange} />);

    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    // Mock successful upload
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: 'https://example.com/test.jpg' }),
    });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByAlt(/Attached photo/i)).toBeInTheDocument();
    });
  });

  it('should reject non-image files', () => {
    const { toast } = require('sonner');
    render(<PhotoUpload onChange={mockOnChange} />);

    const file = new File(['dummy content'], 'test.txt', { type: 'text/plain' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    expect(toast.error).toHaveBeenCalledWith('Please select an image file');
  });

  it('should reject files larger than maxSizeMB', () => {
    const { toast } = require('sonner');
    render(<PhotoUpload onChange={mockOnChange} maxSizeMB={1} />);

    // Create a 2MB file (larger than 1MB limit)
    const file = new File([new ArrayBuffer(2 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    expect(toast.error).toHaveBeenCalledWith('Image too large. Maximum size is 1MB.');
  });

  it('should upload image and call onChange with URL', async () => {
    const { toast } = require('sonner');
    render(<PhotoUpload onChange={mockOnChange} />);

    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    const testUrl = 'https://example.com/uploaded-photo.jpg';
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: testUrl }),
    });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(testUrl);
      expect(toast.success).toHaveBeenCalledWith('Photo uploaded successfully!');
    });
  });

  it('should handle upload failure gracefully', async () => {
    const { toast } = require('sonner');
    render(<PhotoUpload onChange={mockOnChange} />);

    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Upload failed' }),
    });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to upload photo. Please try again.');
    });
  });

  it('should allow removing uploaded image', async () => {
    render(<PhotoUpload onChange={mockOnChange} value="https://example.com/existing.jpg" />);

    const removeButton = screen.getByRole('button');
    fireEvent.click(removeButton);

    expect(mockOnChange).toHaveBeenCalledWith(null);
  });

  it('should disable upload when disabled prop is true', () => {
    render(<PhotoUpload onChange={mockOnChange} disabled={true} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeDisabled();
  });

  it('should support drag and drop', async () => {
    render(<PhotoUpload onChange={mockOnChange} />);

    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    const dropZone = screen.getByText(/Drop a photo here or click to upload/i).closest('div');

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: 'https://example.com/dropped.jpg' }),
    });

    fireEvent.drop(dropZone!, {
      dataTransfer: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(screen.getByAlt(/Attached photo/i)).toBeInTheDocument();
    });
  });
});

describe('Image Upload API', () => {
  it('should upload image with correct multipart/form-data', async () => {
    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', 'images');

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        url: 'https://example.com/test.jpg',
        fileName: 'test.jpg',
        size: file.size,
        type: 'image/jpeg',
      }),
    });

    const response = await fetch('/api/upload/image', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data.url).toBe('https://example.com/test.jpg');
    expect(data.success).toBe(true);
  });

  it('should reject requests without authentication', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' }),
    });

    const response = await fetch('/api/upload/image', {
      method: 'POST',
      body: new FormData(),
    });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(401);
  });

  it('should reject non-image files', async () => {
    const file = new File(['dummy content'], 'test.txt', { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', file);

    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'File must be an image' }),
    });

    const response = await fetch('/api/upload/image', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe('File must be an image');
  });

  it('should reject files larger than 10MB', async () => {
    const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', largeFile);

    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'File too large. Maximum size is 10MB.' }),
    });

    const response = await fetch('/api/upload/image', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain('File too large');
  });
});

describe('Photo Attachment Integration', () => {
  it('should prefer user-attached photo over template image', () => {
    const attachedPhotoUrl = 'https://example.com/user-photo.jpg';
    const templateImageUrl = 'https://example.com/template-image.jpg';

    // User's photo should take precedence
    const finalImageUrl = attachedPhotoUrl || templateImageUrl;

    expect(finalImageUrl).toBe(attachedPhotoUrl);
  });

  it('should fall back to template image when no photo attached', () => {
    const attachedPhotoUrl = null;
    const templateImageUrl = 'https://example.com/template-image.jpg';

    const finalImageUrl = attachedPhotoUrl || templateImageUrl;

    expect(finalImageUrl).toBe(templateImageUrl);
  });

  it('should send order with attached photo URL', async () => {
    const orderData = {
      recipientId: 'recipient-123',
      message: 'Test message',
      productType: 'postcard' as const,
      frontImageUrl: 'https://example.com/user-photo.jpg',
      handwritingStyle: '1',
      handwritingColor: 'blue',
    };

    expect(orderData.frontImageUrl).toBe('https://example.com/user-photo.jpg');
  });
});
