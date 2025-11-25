'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
    onAnalysisComplete: (analysis: string) => void;
}

export function ImageUpload({ onAnalysisComplete }: ImageUploadProps) {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState('');

    const handleFileSelect = useCallback((file: File | null) => {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (20MB max for Vision API)
        if (file.size > 20 * 1024 * 1024) {
            alert('Image too large. Maximum size is 20MB.');
            return;
        }

        setImageFile(file);
        setAnalysis('');

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        handleFileSelect(file);
    }, [handleFileSelect]);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    }, []);

    const handleAnalyze = async () => {
        if (!imageFile) return;

        setIsAnalyzing(true);

        try {
            const formData = new FormData();
            formData.append('image', imageFile);

            const response = await fetch('/api/analyze-image', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Analysis failed');
            }

            setAnalysis(data.analysis);
            onAnalysisComplete(data.analysis);
        } catch (error) {
            console.error('Image analysis error:', error);
            alert('Failed to analyze image. Please try again.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleRemove = () => {
        setImageFile(null);
        setImagePreview('');
        setAnalysis('');
    };

    return (
        <Card className="border-dashed">
            <CardContent className="pt-6">
                {!imageFile ? (
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        className="flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => document.getElementById('image-upload')?.click()}
                    >
                        <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-sm font-medium mb-1">
                            Drop an image here or click to upload
                        </p>
                        <p className="text-xs text-muted-foreground">
                            PNG, JPG, WEBP, GIF up to 20MB
                        </p>
                        <input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                            className="hidden"
                        />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="relative">
                            <img
                                src={imagePreview}
                                alt="Uploaded preview"
                                className="w-full h-64 object-cover rounded-lg"
                            />
                            <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2"
                                onClick={handleRemove}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {!analysis && !isAnalyzing && (
                            <Button onClick={handleAnalyze} className="w-full">
                                <ImageIcon className="h-4 w-4 mr-2" />
                                Analyze Image
                            </Button>
                        )}

                        {isAnalyzing && (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                                <span className="text-sm text-muted-foreground">
                                    Analyzing image...
                                </span>
                            </div>
                        )}

                        {analysis && (
                            <div className="rounded-lg bg-muted p-4 space-y-2">
                                <p className="text-sm font-medium">AI Analysis:</p>
                                <p className="text-sm text-muted-foreground">{analysis}</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAnalyze}
                                    className="w-full mt-2"
                                >
                                    Re-analyze
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
