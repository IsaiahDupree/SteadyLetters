'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ImageSelector } from '@/components/image-selector';
import { VoiceRecorder } from '@/components/voice-recorder';
import { ImageUpload } from '@/components/image-upload';
import type { Tone, Occasion } from '@/lib/types';

const tones: { value: Tone; label: string }[] = [
    { value: 'formal', label: 'Formal' },
    { value: 'casual', label: 'Casual' },
    { value: 'warm', label: 'Warm' },
    { value: 'professional', label: 'Professional' },
    { value: 'friendly', label: 'Friendly' },
];

const occasions: { value: Occasion; label: string }[] = [
    { value: 'general', label: 'General' },
    { value: 'birthday', label: 'Birthday' },
    { value: 'holiday', label: 'Holiday' },
    { value: 'congratulations', label: 'Congratulations' },
    { value: 'thank-you', label: 'Thank You' },
    { value: 'sympathy', label: 'Sympathy' },
    { value: 'get-well-soon', label: 'Get Well Soon' },
];

const holidays = [
    'Christmas',
    'Thanksgiving',
    'New Year',
    'Valentine\'s Day',
    'Easter',
    'Halloween',
];

export function LetterGeneratorForm() {
    const [context, setContext] = useState('');
    const [tone, setTone] = useState<Tone>('warm');
    const [occasion, setOccasion] = useState<Occasion>('general');
    const [applyHoliday, setApplyHoliday] = useState(false);
    const [holiday, setHoliday] = useState('Christmas');
    const [loading, setLoading] = useState(false);
    const [generatedLetter, setGeneratedLetter] = useState('');
    const [selectedImage, setSelectedImage] = useState<string>('');
    const [voiceUsed, setVoiceUsed] = useState(false);
    const [imageAnalysis, setImageAnalysis] = useState('');
    const router = useRouter();

    const handleTranscription = (text: string) => {
        setContext(text);
        setVoiceUsed(true);
    };

    const handleImageAnalysis = (analysis: string) => {
        setImageAnalysis(analysis);
    };

    const handleGenerate = async () => {
        if (!context.trim()) {
            alert('Please provide some context for the letter');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/generate/letter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    context,
                    tone,
                    occasion,
                    holiday: applyHoliday ? holiday : undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || 'Failed to generate letter');
                return;
            }

            setGeneratedLetter(data.letter);
        } catch (error) {
            alert('Failed to generate letter');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTemplate = () => {
        // Navigate to templates page with generated content
        const params = new URLSearchParams({
            generated: 'true',
            content: generatedLetter,
            tone,
            occasion,
        });

        if (selectedImage) {
            params.append('image', selectedImage);
        }

        router.push(`/templates?${params.toString()}`);
    };

    return (
        <div className="grid gap-6">
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Generate Letter</CardTitle>
                        <CardDescription>
                            Let AI write a personalized letter for you
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Option 1: Speak Your Context</Label>
                            <VoiceRecorder onTranscriptionComplete={handleTranscription} />
                        </div>

                        <div className="space-y-2">
                            <Label>Option 2: Upload an Image</Label>
                            <ImageUpload onAnalysisComplete={handleImageAnalysis} />
                        </div>

                        <div className="flex items-center">
                            <div className="flex-1 border-t" />
                            <span className="px-3 text-xs text-muted-foreground">OR</span>
                            <div className="flex-1 border-t" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="context">
                                Option 3: Type Your Context
                                {voiceUsed && <span className="text-primary ml-2">✓ Voice transcription loaded</span>}
                            </Label>
                            <Textarea
                                id="context"
                                placeholder="E.g., Thank them for their support this year..."
                                value={context}
                                onChange={(e) => {
                                    setContext(e.target.value);
                                    setVoiceUsed(false);
                                }}
                                rows={5}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tone">Tone</Label>
                            <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
                                <SelectTrigger id="tone">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {tones.map((t) => (
                                        <SelectItem key={t.value} value={t.value}>
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="occasion">Occasion</Label>
                            <Select value={occasion} onValueChange={(v) => setOccasion(v as Occasion)}>
                                <SelectTrigger id="occasion">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {occasions.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="holiday"
                                checked={applyHoliday}
                                onCheckedChange={(checked) => setApplyHoliday(checked as boolean)}
                            />
                            <Label htmlFor="holiday" className="cursor-pointer">
                                Apply holiday theme
                            </Label>
                        </div>

                        {applyHoliday && (
                            <div className="space-y-2">
                                <Label htmlFor="holiday-select">Holiday</Label>
                                <Select value={holiday} onValueChange={setHoliday}>
                                    <SelectTrigger id="holiday-select">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {holidays.map((h) => (
                                            <SelectItem key={h} value={h}>
                                                {h}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <Button
                            onClick={handleGenerate}
                            disabled={loading || !context.trim()}
                            className="w-full"
                        >
                            {loading ? 'Generating...' : 'Generate Letter'}
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Generated Letter</CardTitle>
                        <CardDescription>
                            Preview and save your AI-generated content
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {generatedLetter ? (
                            <div className="space-y-4">
                                <div className="whitespace-pre-wrap rounded-lg border p-4 min-h-[300px]">
                                    {generatedLetter}
                                </div>
                                <Button onClick={handleSaveTemplate} className="w-full">
                                    Save as Template
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center min-h-[300px] text-muted-foreground">
                                Your generated letter will appear here
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {generatedLetter && (
                <ImageSelector
                    tone={tone}
                    occasion={occasion}
                    holiday={applyHoliday ? holiday : undefined}
                    onSelect={setSelectedImage}
                />
            )}
        </div>
    );
}
