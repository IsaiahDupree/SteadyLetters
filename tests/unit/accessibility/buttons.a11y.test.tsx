import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { Button } from '@/components/ui/button';

describe('Buttons Accessibility', () => {
  it('text button should not have violations', async () => {
    const { container } = render(<Button>Click Me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('icon-only button should have aria-label', async () => {
    const { container } = render(
      <button aria-label="Delete item">
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path d="M8 0L0 8l8 8 8-8z" />
        </svg>
      </button>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('disabled button has proper attributes', () => {
    const { container } = render(
      <Button disabled>
        Disabled Button
      </Button>
    );
    const button = container.querySelector('button');
    expect(button?.hasAttribute('disabled')).toBe(true);
  });

  it('loading button with aria-busy', async () => {
    const { container } = render(
      <button aria-busy="true" disabled>
        <span className="sr-only">Loading</span>
        Loading...
      </button>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('destructive button variant is accessible', async () => {
    const { container } = render(
      <Button variant="destructive">
        Delete
      </Button>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('button with icon has accessible text', async () => {
    const { container } = render(
      <Button>
        <span className="sr-only">Save changes</span>
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M8 0L0 8l8 8 8-8z" />
        </svg>
      </Button>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
