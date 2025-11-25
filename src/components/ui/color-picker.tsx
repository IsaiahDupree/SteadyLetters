'use client';

import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
    value: string;
    onChange: (color: string) => void;
    label?: string;
    colors?: string[];
    allowCustom?: boolean;
    className?: string;
}

const DEFAULT_COLORS = [
    { value: 'blue', label: 'Blue', hex: '#2563eb' },
    { value: 'black', label: 'Black', hex: '#000000' },
    { value: 'green', label: 'Green', hex: '#16a34a' },
    { value: 'purple', label: 'Purple', hex: '#9333ea' },
    { value: 'red', label: 'Red', hex: '#dc2626' },
];

export function ColorPicker({
    value,
    onChange,
    label = 'Color',
    colors = DEFAULT_COLORS.map(c => c.value),
    allowCustom = true,
    className,
}: ColorPickerProps) {
    const [customColor, setCustomColor] = useState('');
    const [showCustom, setShowCustom] = useState(false);

    const colorOptions = DEFAULT_COLORS.filter(c => colors.includes(c.value));

    const handleColorSelect = (color: string) => {
        onChange(color);
        setShowCustom(false);
    };

    const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const color = e.target.value;
        setCustomColor(color);
        if (color.match(/^#[0-9A-F]{6}$/i)) {
            onChange(color);
        }
    };

    const getDisplayColor = (colorValue: string) => {
        const predefinedColor = DEFAULT_COLORS.find(c => c.value === colorValue);
        if (predefinedColor) {
            return predefinedColor.hex;
        }
        // If it's a hex color, use it directly
        if (colorValue.startsWith('#')) {
            return colorValue;
        }
        // Default to the color name
        return colorValue;
    };

    const currentDisplayColor = getDisplayColor(value);

    return (
        <div className={cn('space-y-3', className)}>
            {label && <Label>{label}</Label>}

            <div className="flex items-center gap-2 flex-wrap">
                {/* Preset Color Buttons */}
                {colorOptions.map((color) => (
                    <button
                        key={color.value}
                        type="button"
                        onClick={() => handleColorSelect(color.value)}
                        className={cn(
                            'group relative w-10 h-10 rounded-full border-2 transition-all hover:scale-110',
                            value === color.value
                                ? 'border-primary ring-2 ring-primary/20'
                                : 'border-muted hover:border-primary/50'
                        )}
                        title={color.label}
                    >
                        <div
                            className="w-full h-full rounded-full"
                            style={{ backgroundColor: color.hex }}
                        />
                        {value === color.value && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <svg
                                    className="w-5 h-5 text-white drop-shadow-md"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={3}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>
                        )}
                    </button>
                ))}

                {/* Custom Color Button */}
                {allowCustom && (
                    <button
                        type="button"
                        onClick={() => setShowCustom(!showCustom)}
                        className={cn(
                            'w-10 h-10 rounded-full border-2 border-dashed transition-all hover:scale-110 flex items-center justify-center',
                            showCustom ? 'border-primary bg-muted' : 'border-muted hover:border-primary/50'
                        )}
                        title="Custom Color"
                    >
                        <svg
                            className="w-5 h-5 text-muted-foreground"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                    </button>
                )}

                {/* Current Color Preview */}
                <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
                    <div
                        className="w-6 h-6 rounded-full border border-muted-foreground/20"
                        style={{ backgroundColor: currentDisplayColor }}
                    />
                    <span className="text-sm font-medium">
                        {DEFAULT_COLORS.find(c => c.value === value)?.label || value}
                    </span>
                </div>
            </div>

            {/* Custom Color Input */}
            {showCustom && allowCustom && (
                <div className="space-y-2 animate-in slide-in-from-top-2 fade-in duration-200">
                    <Label htmlFor="custom-color" className="text-sm">Custom Hex Color</Label>
                    <div className="flex gap-2">
                        <Input
                            id="custom-color"
                            type="text"
                            placeholder="#4287f5"
                            value={customColor}
                            onChange={handleCustomColorChange}
                            maxLength={7}
                            className="font-mono"
                        />
                        {customColor && customColor.match(/^#[0-9A-F]{6}$/i) && (
                            <button
                                type="button"
                                onClick={() => handleColorSelect(customColor)}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                            >
                                Apply
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Enter a hex color code (e.g., #4287f5)
                    </p>
                </div>
            )}
        </div>
    );
}
