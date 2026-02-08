'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface PhotoUploadProps {
  value?: string; // Current photo URL
  onChange: (url: string | null) => void;
  maxSizeMB?: number;
  bucket?: string;
  disabled?: boolean;
}

export function PhotoUpload({
  value,
  onChange,
  maxSizeMB = 10,
  bucket = 'images',
  disabled = false,
}: PhotoUploadProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(value || '');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = useCallback(
    (file: File | null) => {
      if (!file || disabled) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        toast.error(`Image too large. Maximum size is ${maxSizeMB}MB.`);
        return;
      }

      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Auto-upload
      uploadImage(file);
    },
    [maxSizeMB, disabled]
  );

  const uploadImage = async (file: File) => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      onChange(data.url);
      toast.success('Photo uploaded successfully!');
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload photo. Please try again.');
      handleRemove();
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
    },
    [handleFileSelect, disabled]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleRemove = () => {
    setImageFile(null);
    setImagePreview('');
    onChange(null);
  };

  const hasImage = imagePreview || value;

  return (
    <Card className="border-dashed">
      <CardContent className="pt-6">
        {!hasImage ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={`flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center transition-colors ${
              disabled
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer hover:border-primary/50'
            }`}
            onClick={() => {
              if (!disabled) {
                document.getElementById('photo-upload')?.click();
              }
            }}
          >
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm font-medium mb-1">
              {isUploading
                ? 'Uploading...'
                : 'Drop a photo here or click to upload'}
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, WEBP up to {maxSizeMB}MB
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Optional - Adds a visual element to your letter
            </p>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
              className="hidden"
              disabled={disabled || isUploading}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview || value}
                alt="Attached photo"
                className="w-full h-64 object-cover rounded-lg"
              />
              {!disabled && !isUploading && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemove}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </div>
            <p className="text-xs text-center text-muted-foreground">
              This photo will be printed alongside your letter
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
