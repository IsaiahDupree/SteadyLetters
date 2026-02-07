import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { HandwritingStyleSelector } from '@/components/handwriting-style-selector';

// Mock fetch globally
global.fetch = vi.fn();

describe('HandwritingStyleSelector Component', () => {
  const mockOnValueChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should display loading state initially', () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() =>
      new Promise(() => {}) // Never resolves to keep loading state
    );

    render(
      <HandwritingStyleSelector
        value="1"
        onValueChange={mockOnValueChange}
      />
    );

    expect(screen.getByText('Handwriting Style')).toBeInTheDocument();
    // Loading spinner should be visible
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should fetch and display handwriting styles from API', async () => {
    const mockStyles = [
      { id: '1', name: 'Casual Script', style: 'Handwritten' },
      { id: '2', name: 'Formal Cursive', style: 'Elegant' },
      { id: '3', name: 'Architect', style: 'Technical' },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ styles: mockStyles }),
    } as Response);

    render(
      <HandwritingStyleSelector
        value="1"
        onValueChange={mockOnValueChange}
      />
    );

    // Wait for styles to load
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/handwriting-styles');
    });

    // Check that select is rendered
    await waitFor(() => {
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });
  });

  it('should display fallback styles when API fails', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('API Error')
    );

    render(
      <HandwritingStyleSelector
        value="1"
        onValueChange={mockOnValueChange}
      />
    );

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText('Using default styles')).toBeInTheDocument();
    });

    // Fallback styles should be available
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });

  it('should use custom label when provided', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ styles: [] }),
    } as Response);

    render(
      <HandwritingStyleSelector
        value="1"
        onValueChange={mockOnValueChange}
        label="Choose Style"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Choose Style')).toBeInTheDocument();
    });
  });

  it('should be disabled when disabled prop is true', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ styles: [{ id: '1', name: 'Style 1' }] }),
    } as Response);

    render(
      <HandwritingStyleSelector
        value="1"
        onValueChange={mockOnValueChange}
        disabled={true}
      />
    );

    await waitFor(() => {
      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });
  });

  it('should set default value when no value is provided and styles load', async () => {
    const mockStyles = [
      { id: 'default-1', name: 'Default Style' },
      { id: '2', name: 'Style 2' },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ styles: mockStyles }),
    } as Response);

    render(
      <HandwritingStyleSelector
        value=""
        onValueChange={mockOnValueChange}
      />
    );

    await waitFor(() => {
      expect(mockOnValueChange).toHaveBeenCalledWith('default-1');
    });
  });
});
