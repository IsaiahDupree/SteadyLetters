'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export interface HandwritingStyle {
  id: string;
  name: string;
  style?: string;
}

interface HandwritingStyleSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
}

export function HandwritingStyleSelector({
  value,
  onValueChange,
  label = 'Handwriting Style',
  disabled = false,
}: HandwritingStyleSelectorProps) {
  const [styles, setStyles] = useState<HandwritingStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStyles();
  }, []);

  const loadStyles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/handwriting-styles');

      if (!response.ok) {
        throw new Error('Failed to fetch handwriting styles');
      }

      const data = await response.json();
      setStyles(data.styles || []);

      // Set default value if not already set
      if (!value && data.styles.length > 0) {
        onValueChange(data.styles[0].id);
      }
    } catch (err) {
      console.error('Error loading handwriting styles:', err);
      setError('Failed to load styles');
      // Set fallback styles
      setStyles([
        { id: '1', name: 'Style 1', style: 'Default' },
        { id: '2', name: 'Style 2', style: 'Cursive' },
        { id: '3', name: 'Style 3', style: 'Print' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center justify-center h-10 rounded-md border border-input bg-background">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="handwriting-style">{label}</Label>
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger id="handwriting-style">
          <SelectValue placeholder="Select style" />
        </SelectTrigger>
        <SelectContent>
          {styles.map((style) => (
            <SelectItem key={style.id} value={style.id}>
              <div className="flex flex-col">
                <span>{style.name}</span>
                {style.style && (
                  <span className="text-xs text-muted-foreground">
                    {style.style}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-xs text-muted-foreground">
          Using default styles
        </p>
      )}
    </div>
  );
}
