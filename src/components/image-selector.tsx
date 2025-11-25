'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Loader2, Check } from 'lucide-react';
import type { Tone, Occasion } from '@/lib/openai';

interface ImageSelectorProps {
    tone: Tone;
    occasion: Occasion;
    holiday?: string;
    onSelect: (imageUrl: string) => void;
}

export function ImageSelector({ tone, occasion, holiday, onSelect }: ImageSelectorProps) {
    const [images, setImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const handleGenerate = async () => {
        setLoading(true);
        setImages([]);
        setSelectedImage(null);

        try {
            const response = await fetch('/api/generate/images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ occasion, tone, holiday }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || 'Failed to generate images');
                return;
            }

            setImages(data.images);
        } catch (error) {
            alert('Failed to generate images');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectImage = (imageUrl: string) => {
        setSelectedImage(imageUrl);
        onSelect(imageUrl);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Generate Card Design</CardTitle>
                <CardDescription>
                    AI will create 4 unique card designs based on your occasion and tone
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {images.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
                        <p className="text-muted-foreground mb-4">
                            Click the button below to generate 4 card design options
                        </p>
                        <Button onClick={handleGenerate}>
                            Generate Card Designs
                        </Button>
                    </div>
                )}

                {loading && (
                    <div className="flex flex-col items-center justify-center min-h-[300px]">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Generating 4 unique designs...</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            This may take 30-60 seconds
                        </p>
                    </div>
                )}

                {images.length > 0 && (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            {images.map((imageUrl, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSelectImage(imageUrl)}
                                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImage === imageUrl
                                            ? 'border-primary ring-2 ring-primary ring-offset-2'
                                            : 'border-border hover:border-primary/50'
                                        }`}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={imageUrl}
                                        alt={`Card design option ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                    {selectedImage === imageUrl && (
                                        <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                                            <div className="bg-primary text-primary-foreground rounded-full p-2">
                                                <Check className="h-6 w-6" />
                                            </div>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={handleGenerate}
                                variant="outline"
                                className="flex-1"
                            >
                                Regenerate (4 more credits)
                            </Button>
                            {selectedImage && (
                                <Button className="flex-1">
                                    Use Selected Design
                                </Button>
                            )}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
