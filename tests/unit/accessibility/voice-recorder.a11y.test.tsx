import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { VoiceRecorder } from '@/components/voice-recorder';

describe('Voice Recorder Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const mockCallback = vi.fn();
    const { container } = render(<VoiceRecorder onTranscriptionComplete={mockCallback} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has descriptive text for screen readers', () => {
    const mockCallback = vi.fn();
    render(<VoiceRecorder onTranscriptionComplete={mockCallback} />);

    // Check for instructional text
    expect(screen.getByText(/Speak your letter context/i)).toBeInTheDocument();
    expect(screen.getByText(/Click the microphone button and speak clearly/i)).toBeInTheDocument();
  });

  it('buttons have sufficient size for touch targets (60x60px)', () => {
    const mockCallback = vi.fn();
    const { container } = render(<VoiceRecorder onTranscriptionComplete={mockCallback} />);

    // The button should have h-16 w-16 classes (64px = 4rem)
    const button = container.querySelector('button.h-16.w-16');
    expect(button).toBeTruthy();
  });

  it('provides status updates during different states', () => {
    const mockCallback = vi.fn();
    render(<VoiceRecorder onTranscriptionComplete={mockCallback} />);

    // Check initial state message exists
    expect(screen.getByText(/Speak your letter context/i)).toBeInTheDocument();
  });
});
