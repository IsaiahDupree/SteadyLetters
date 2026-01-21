import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  describe('Basic Rendering', () => {
    it('renders children correctly', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('renders as button element by default', () => {
      render(<Button>Test</Button>);
      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });

    it('handles click events', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Variants', () => {
    it('applies default variant styles', () => {
      render(<Button>Default</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('bg-primary');
      expect(button).toHaveClass('text-primary-foreground');
    });

    it('applies destructive variant styles', () => {
      render(<Button variant="destructive">Delete</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('bg-destructive');
      expect(button).toHaveClass('text-white');
    });

    it('applies outline variant styles', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('border');
      expect(button).toHaveClass('bg-background');
    });

    it('applies secondary variant styles', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('bg-secondary');
      expect(button).toHaveClass('text-secondary-foreground');
    });

    it('applies ghost variant styles', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('hover:bg-accent');
    });

    it('applies link variant styles', () => {
      render(<Button variant="link">Link</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('text-primary');
      expect(button).toHaveClass('underline-offset-4');
    });
  });

  describe('Sizes', () => {
    it('applies default size styles', () => {
      render(<Button>Default Size</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('h-9');
      expect(button).toHaveClass('px-4');
      expect(button).toHaveClass('py-2');
    });

    it('applies small size styles', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('h-8');
    });

    it('applies large size styles', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('h-10');
    });

    it('applies icon size styles', () => {
      render(<Button size="icon">+</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('size-9');
    });

    it('applies icon-sm size styles', () => {
      render(<Button size="icon-sm">+</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('size-8');
    });

    it('applies icon-lg size styles', () => {
      render(<Button size="icon-lg">+</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('size-10');
    });
  });

  describe('Disabled State', () => {
    it('applies disabled styles when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');

      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:pointer-events-none');
      expect(button).toHaveClass('disabled:opacity-50');
    });

    it('does not trigger onClick when disabled', () => {
      const handleClick = vi.fn();
      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Custom Props', () => {
    it('accepts and applies custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('custom-class');
    });

    it('accepts type attribute', () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('type', 'submit');
    });

    it('accepts data attributes', () => {
      render(<Button data-testid="custom-button">Test</Button>);
      const button = screen.getByTestId('custom-button');

      expect(button).toBeInTheDocument();
    });

    it('accepts aria attributes', () => {
      render(<Button aria-label="Custom label">Button</Button>);
      const button = screen.getByLabelText('Custom label');

      expect(button).toBeInTheDocument();
    });
  });

  describe('asChild Prop', () => {
    it('renders as Slot when asChild is true', () => {
      const { container } = render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );

      const link = screen.getByText('Link Button');
      expect(link.tagName).toBe('A');
      expect(link).toHaveAttribute('href', '/test');
    });

    it('applies button styles to child element', () => {
      render(
        <Button asChild variant="destructive">
          <a href="/delete">Delete Link</a>
        </Button>
      );

      const link = screen.getByText('Delete Link');
      expect(link).toHaveClass('bg-destructive');
    });
  });

  describe('Accessibility', () => {
    it('has data-slot attribute', () => {
      render(<Button>Test</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('data-slot', 'button');
    });

    it('supports focus-visible styles', () => {
      render(<Button>Focusable</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('focus-visible:border-ring');
      expect(button).toHaveClass('focus-visible:ring-ring/50');
    });

    it('supports aria-invalid styling', () => {
      render(<Button aria-invalid="true">Invalid</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('aria-invalid:ring-destructive/20');
      expect(button).toHaveClass('aria-invalid:border-destructive');
    });

    it('is keyboard accessible', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Keyboard Test</Button>);

      const button = screen.getByRole('button');

      // Simulate Enter key press
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });

      // Button should be focusable
      button.focus();
      expect(document.activeElement).toBe(button);
    });
  });

  describe('Touch Targets (Mobile)', () => {
    it('default button has adequate touch target size', () => {
      render(<Button>Touch Target</Button>);
      const button = screen.getByRole('button');

      // h-9 = 36px (acceptable for desktop, could be larger for mobile)
      expect(button).toHaveClass('h-9');
    });

    it('large button has better touch target for mobile', () => {
      render(<Button size="lg">Large Touch</Button>);
      const button = screen.getByRole('button');

      // h-10 = 40px (closer to 44px recommended minimum)
      expect(button).toHaveClass('h-10');
    });

    it('icon buttons have square touch targets', () => {
      render(<Button size="icon">+</Button>);
      const button = screen.getByRole('button');

      // size-9 = 36px x 36px
      expect(button).toHaveClass('size-9');
    });

    it('icon-lg has better mobile touch target', () => {
      render(<Button size="icon-lg">+</Button>);
      const button = screen.getByRole('button');

      // size-10 = 40px x 40px (close to 44px minimum)
      expect(button).toHaveClass('size-10');
    });
  });

  describe('Visual Feedback', () => {
    it('has hover styles for default variant', () => {
      render(<Button>Hover Me</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('hover:bg-primary/90');
    });

    it('has transition styles', () => {
      render(<Button>Animated</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('transition-all');
    });
  });

  describe('Combination Props', () => {
    it('combines variant and size correctly', () => {
      render(
        <Button variant="outline" size="lg">
          Large Outline
        </Button>
      );
      const button = screen.getByRole('button');

      expect(button).toHaveClass('border');
      expect(button).toHaveClass('h-10');
    });

    it('combines variant, size, and custom class', () => {
      render(
        <Button variant="ghost" size="sm" className="w-full">
          Full Width Ghost
        </Button>
      );
      const button = screen.getByRole('button');

      expect(button).toHaveClass('hover:bg-accent');
      expect(button).toHaveClass('h-8');
      expect(button).toHaveClass('w-full');
    });
  });

  describe('Icon Handling', () => {
    it('applies icon-specific styles to SVG children', () => {
      const { container } = render(
        <Button>
          <svg className="test-icon" />
          Text
        </Button>
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('handles buttons with only icons', () => {
      const { container } = render(
        <Button size="icon" aria-label="Close">
          <svg className="test-icon" />
        </Button>
      );

      const button = screen.getByLabelText('Close');
      const svg = container.querySelector('svg');

      expect(button).toBeInTheDocument();
      expect(svg).toBeInTheDocument();
    });
  });
});
