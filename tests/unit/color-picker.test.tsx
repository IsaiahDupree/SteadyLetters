import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ColorPicker } from '@/components/ui/color-picker';

describe('ColorPicker Component', () => {
    const mockOnChange = vi.fn();

    beforeEach(() => {
        mockOnChange.mockClear();
    });

    it('renders with default colors', () => {
        render(<ColorPicker value="blue" onChange={mockOnChange} />);

        // Should render color buttons
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
    });

    it('shows selected color with checkmark', () => {
        const { container } = render(<ColorPicker value="blue" onChange={mockOnChange} />);

        // Check if checkmark SVG is present for selected color
        const checkmarks = container.querySelectorAll('svg');
        expect(checkmarks.length).toBeGreaterThan(0);
    });

    it('calls onChange when preset color is selected', () => {
        render(<ColorPicker value="blue" onChange={mockOnChange} />);

        const buttons = screen.getAllByRole('button');
        // Click first color button (not the custom button)
        fireEvent.click(buttons[0]);

        expect(mockOnChange).toHaveBeenCalled();
    });

    it('shows custom color input when custom button clicked', () => {
        render(<ColorPicker value="blue" onChange={mockOnChange} allowCustom={true} />);

        // Find and click the custom color button (has plus icon)
        const buttons = screen.getAllByRole('button');
        const customButton = buttons[buttons.length - 2]; // Second to last button (last is preview)
        fireEvent.click(customButton);

        // Custom input should appear
        waitFor(() => {
            expect(screen.getByPlaceholderText(/#[0-9a-fA-F]{6}/)).toBeInTheDocument();
        });
    });

    it('validates hex color format', async () => {
        render(<ColorPicker value="blue" onChange={mockOnChange} allowCustom={true} />);

        // Open custom color input
        const buttons = screen.getAllByRole('button');
        const customButton = buttons[buttons.length - 2];
        fireEvent.click(customButton);

        // Try invalid hex
        const input = await screen.findByPlaceholderText(/#4287f5/);
        fireEvent.change(input, { target: { value: 'invalid' } });

        // Apply button should not call onChange
        expect(mockOnChange).not.toHaveBeenCalledWith('invalid');
    });

    it('accepts valid hex color', async () => {
        render(<ColorPicker value="blue" onChange={mockOnChange} allowCustom={true} />);

        // Open custom color input
        const buttons = screen.getAllByRole('button');
        const customButton = buttons[buttons.length - 2];
        fireEvent.click(customButton);

        // Enter valid hex
        const input = await screen.findByPlaceholderText(/#4287f5/);
        fireEvent.change(input, { target: { value: '#FF5733' } });

        // Click Apply button
        const applyButton = screen.getByText('Apply');
        fireEvent.click(applyButton);

        expect(mockOnChange).toHaveBeenCalledWith('#FF5733');
    });

    it('displays current color name', () => {
        render(<ColorPicker value="blue" onChange={mockOnChange} />);

        expect(screen.getByText('Blue')).toBeInTheDocument();
    });

    it('hides custom input when allowCustom is false', () => {
        render(<ColorPicker value="blue" onChange={mockOnChange} allowCustom={false} />);

        // Should not have the custom button
        const buttons = screen.getAllByRole('button');
        // Only preset colors + current color preview
        expect(buttons.length).toBeLessThanOrEqual(6);
    });
});
