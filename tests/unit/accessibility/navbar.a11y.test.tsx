import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { Navbar } from '@/components/navbar';

// Mock the auth context
const mockUseAuth = vi.fn();
vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock Logo component
vi.mock('@/components/logo', () => ({
  Logo: () => <div>SteadyLetters</div>,
}));

describe('Navbar Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authenticated State', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { email: 'test@example.com' },
        loading: false,
        signOut: vi.fn(),
      });
    });

    it('should not have accessibility violations', async () => {
      const { container } = render(<Navbar />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA labels on mobile menu toggle', () => {
      const { getByLabelText } = render(<Navbar />);
      const menuButton = getByLabelText('Toggle menu');
      expect(menuButton).toBeInTheDocument();
    });

    it('mobile menu overlay has aria-hidden when visible', () => {
      const { container } = render(<Navbar />);
      // The overlay should exist in the DOM
      const overlay = container.querySelector('[aria-hidden="true"]');
      expect(overlay).toBeTruthy();
    });
  });

  describe('Unauthenticated State', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signOut: vi.fn(),
      });
    });

    it('should not have accessibility violations', async () => {
      const { container } = render(<Navbar />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Loading State', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        signOut: vi.fn(),
      });
    });

    it('should not have accessibility violations during loading', async () => {
      const { container } = render(<Navbar />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
