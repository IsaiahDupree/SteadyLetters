import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';

// Mock form components that represent typical forms in the app
function MockRecipientForm() {
  return (
    <form>
      <div>
        <label htmlFor="name">Full Name</label>
        <input
          id="name"
          type="text"
          name="name"
          required
          aria-required="true"
          aria-describedby="name-help"
        />
        <p id="name-help">Enter the recipient's full name</p>
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          name="email"
          aria-describedby="email-help"
        />
        <p id="email-help">Optional: recipient's email address</p>
      </div>

      <div>
        <label htmlFor="address">Street Address</label>
        <input
          id="address"
          type="text"
          name="address"
          required
          aria-required="true"
        />
      </div>

      <div>
        <label htmlFor="city">City</label>
        <input id="city" type="text" name="city" required aria-required="true" />
      </div>

      <div>
        <label htmlFor="state">State</label>
        <input id="state" type="text" name="state" required aria-required="true" />
      </div>

      <div>
        <label htmlFor="zip">ZIP Code</label>
        <input
          id="zip"
          type="text"
          name="zip"
          required
          aria-required="true"
          pattern="[0-9]{5}"
        />
      </div>

      <button type="submit">Save Recipient</button>
    </form>
  );
}

function MockLetterGenerationForm() {
  return (
    <form>
      <fieldset>
        <legend>Letter Generation Options</legend>

        <div>
          <label htmlFor="occasion">Occasion</label>
          <select id="occasion" name="occasion" required aria-required="true">
            <option value="">Select an occasion</option>
            <option value="birthday">Birthday</option>
            <option value="thank-you">Thank You</option>
            <option value="sympathy">Sympathy</option>
          </select>
        </div>

        <div>
          <label htmlFor="context">Letter Context</label>
          <textarea
            id="context"
            name="context"
            rows={4}
            placeholder="Describe what you want to say..."
            aria-describedby="context-help"
          />
          <p id="context-help">Provide details about the letter you want to generate</p>
        </div>

        <div>
          <label htmlFor="tone">Tone</label>
          <select id="tone" name="tone">
            <option value="formal">Formal</option>
            <option value="casual">Casual</option>
            <option value="heartfelt">Heartfelt</option>
          </select>
        </div>
      </fieldset>

      <button type="submit">Generate Letter</button>
    </form>
  );
}

describe('Forms Accessibility', () => {
  describe('Recipient Form', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<MockRecipientForm />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('all inputs have associated labels', () => {
      const { container } = render(<MockRecipientForm />);
      const inputs = container.querySelectorAll('input');

      inputs.forEach((input) => {
        const id = input.getAttribute('id');
        const label = container.querySelector(`label[for="${id}"]`);
        expect(label).toBeTruthy();
      });
    });

    it('required fields have aria-required', () => {
      const { container } = render(<MockRecipientForm />);
      const requiredInputs = container.querySelectorAll('[required]');

      requiredInputs.forEach((input) => {
        expect(input.getAttribute('aria-required')).toBe('true');
      });
    });

    it('inputs with help text have aria-describedby', () => {
      const { container } = render(<MockRecipientForm />);
      const nameInput = container.querySelector('#name');
      expect(nameInput?.getAttribute('aria-describedby')).toBe('name-help');
    });
  });

  describe('Letter Generation Form', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<MockLetterGenerationForm />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('uses fieldset and legend for grouped fields', () => {
      const { container } = render(<MockLetterGenerationForm />);
      const fieldset = container.querySelector('fieldset');
      const legend = fieldset?.querySelector('legend');

      expect(fieldset).toBeTruthy();
      expect(legend).toBeTruthy();
      expect(legend?.textContent).toBe('Letter Generation Options');
    });

    it('select elements have labels', () => {
      const { container } = render(<MockLetterGenerationForm />);
      const selects = container.querySelectorAll('select');

      selects.forEach((select) => {
        const id = select.getAttribute('id');
        const label = container.querySelector(`label[for="${id}"]`);
        expect(label).toBeTruthy();
      });
    });

    it('textarea has label and help text', () => {
      const { container } = render(<MockLetterGenerationForm />);
      const textarea = container.querySelector('#context');
      const label = container.querySelector('label[for="context"]');

      expect(label).toBeTruthy();
      expect(textarea?.getAttribute('aria-describedby')).toBe('context-help');
    });
  });
});
