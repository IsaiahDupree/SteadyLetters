import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VoiceRecorder } from '@/components/voice-recorder';

describe('VoiceRecorder Component', () => {
  const mockOnTranscriptionComplete = vi.fn();

  beforeEach(() => {
    mockOnTranscriptionComplete.mockClear();
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('Initial Rendering', () => {
    it('renders initial state correctly', () => {
      render(<VoiceRecorder onTranscriptionComplete={mockOnTranscriptionComplete} />);

      // Check for initial text
      expect(screen.getByText('Speak your letter context')).toBeInTheDocument();

      // Check for initial help text
      expect(
        screen.getByText('Click the microphone button and speak clearly')
      ).toBeInTheDocument();
    });

    it('shows microphone button in initial state', () => {
      render(<VoiceRecorder onTranscriptionComplete={mockOnTranscriptionComplete} />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Visual Elements', () => {
    it('has appropriate touch target size for mobile', () => {
      render(<VoiceRecorder onTranscriptionComplete={mockOnTranscriptionComplete} />);

      const button = screen.getByRole('button');

      // Button should have h-16 w-16 classes (64px x 64px) which exceeds 44px minimum
      expect(button).toHaveClass('h-16');
      expect(button).toHaveClass('w-16');
    });

    it('button has rounded-full class for circular appearance', () => {
      render(<VoiceRecorder onTranscriptionComplete={mockOnTranscriptionComplete} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('rounded-full');
    });

    it('renders in a Card component', () => {
      const { container } = render(
        <VoiceRecorder onTranscriptionComplete={mockOnTranscriptionComplete} />
      );

      // Should be wrapped in a card
      expect(container.querySelector('.border-dashed')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('button is keyboard accessible', () => {
      render(<VoiceRecorder onTranscriptionComplete={mockOnTranscriptionComplete} />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();

      // Button should be focusable
      button.focus();
      expect(document.activeElement).toBe(button);
    });

    it('provides descriptive help text at all times', () => {
      render(<VoiceRecorder onTranscriptionComplete={mockOnTranscriptionComplete} />);

      // There should always be help text
      const helpTexts = [
        'Click the microphone button and speak clearly',
        'Click the square button to stop recording',
        'Click the microphone to record again',
      ];

      const hasHelpText = helpTexts.some((text) =>
        screen.queryByText(text, { exact: false })
      );

      expect(hasHelpText).toBe(true);
    });
  });

  describe('Component Props', () => {
    it('accepts onTranscriptionComplete callback', () => {
      const customCallback = vi.fn();
      render(<VoiceRecorder onTranscriptionComplete={customCallback} />);

      // Component should render without errors
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('has centered flex layout', () => {
      const { container } = render(
        <VoiceRecorder onTranscriptionComplete={mockOnTranscriptionComplete} />
      );

      const layout = container.querySelector('.flex.flex-col.items-center.justify-center');
      expect(layout).toBeInTheDocument();
    });

    it('has appropriate spacing', () => {
      const { container } = render(
        <VoiceRecorder onTranscriptionComplete={mockOnTranscriptionComplete} />
      );

      // Should have space-y-4 for vertical spacing
      const spacingContainer = container.querySelector('.space-y-4');
      expect(spacingContainer).toBeInTheDocument();
    });
  });

  describe('Button Variants', () => {
    it('renders large size button', () => {
      render(<VoiceRecorder onTranscriptionComplete={mockOnTranscriptionComplete} />);

      const button = screen.getByRole('button');

      // Should use lg size
      expect(button).toHaveClass('h-16');
      expect(button).toHaveClass('w-16');
    });
  });
});
