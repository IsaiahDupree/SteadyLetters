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
import { EnhancedLetterResult } from './enhanced-letter-result';
import type { Tone, Occasion } from '@/lib/types';
import { EXAMPLE_TEMPLATES, type ExampleTemplate } from '@/lib/example-templates';

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

const letterLengths = [
    { value: 'short', label: 'Short (50-100 words)', description: 'Quick note or greeting' },
    { value: 'medium', label: 'Medium (150-250 words)', description: 'Standard letter' },
    { value: 'long', label: 'Long (300-500 words)', description: 'Detailed message' },
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
    const [letterLength, setLetterLength] = useState<'short' | 'medium' | 'long'>('medium');
    const [step, setStep] = useState(1);
    const router = useRouter();

    const totalSteps = 2;
    const isStep1Valid = context.trim().length > 0;

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
                    length: letterLength,
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

    const handleNext = async () => {
        // If we're on step 1 and have context, generate the letter first
        if (step === 1 && context.trim() && !generatedLetter) {
            await handleGenerate();
            // Only move to step 2 if generation was successful
            if (generatedLetter) {
                setStep(2);
            }
        } else if (step < totalSteps) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
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
                <Card className="border-muted/40 shadow-xl shadow-primary/5 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
                    <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                            <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-600">
                                Generate Letter
                            </CardTitle>
                            <span className="text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                                Step {step} of {totalSteps}
                            </span>
                        </div>
                        <CardDescription className="text-base">
                            {step === 1 ? 'How should we write this letter?' : 'Customize the style and tone'}
                        </CardDescription>
                        {/* Progress Bar */}
                        <div className="h-1 w-full bg-muted rounded-full mt-4 overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-500 ease-in-out"
                                style={{ width: `${(step / totalSteps) * 100}%` }}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 relative min-h-[400px]">
                        {step === 1 && (
                            <div className="space-y-6 animate-in slide-in-from-left-4 fade-in duration-300">
                                {/* Example Templates */}
                                <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-violet-500/5 border border-primary/20">
                                    <Label className="text-base font-medium flex items-center gap-2">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">0</span>
                                        Load Example Template
                                    </Label>
                                    <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                                        {EXAMPLE_TEMPLATES.slice(0, 6).map((template) => (
                                            <Button
                                                key={template.id}
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setContext(template.context);
                                                    setTone(template.tone);
                                                    setOccasion(template.occasion);
                                                    setLetterLength(template.length);
                                                }}
                                                className="h-auto py-2 px-3 text-left justify-start hover:bg-primary/10 hover:border-primary/50 transition-all"
                                            >
                                                <div className="flex flex-col items-start gap-0.5">
                                                    <span className="text-xs font-medium">{template.name}</span>
                                                    <span className="text-[10px] text-muted-foreground line-clamp-1">{template.description}</span>
                                                </div>
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-muted/40 transition-colors hover:bg-muted/50 group">
                                    <Label className="text-base font-medium flex items-center gap-2">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">1</span>
                                        Speak Your Context
                                    </Label>
                                    <VoiceRecorder onTranscriptionComplete={handleTranscription} />
                                </div>

                                <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-muted/40 transition-colors hover:bg-muted/50 group">
                                    <Label className="text-base font-medium flex items-center gap-2">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">2</span>
                                        Upload an Image
                                    </Label>
                                    <ImageUpload onAnalysisComplete={handleImageAnalysis} />
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                                    <span className="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">OR</span>
                                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="context" className="text-base font-medium flex items-center gap-2">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">3</span>
                                        Type Your Context
                                        {voiceUsed && (
                                            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 animate-in fade-in zoom-in">
                                                ✓ Voice loaded
                                            </span>
                                        )}
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
                                        className="resize-none focus-visible:ring-primary/30 transition-shadow"
                                    />
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="tone">Tone</Label>
                                        <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
                                            <SelectTrigger id="tone" className="transition-all hover:border-primary/50">
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
                                            <SelectTrigger id="occasion" className="transition-all hover:border-primary/50">
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
                                </div>

                                <div className="flex items-center space-x-2 p-3 rounded-lg border border-transparent hover:bg-muted/30 transition-colors">
                                    <Checkbox
                                        id="holiday"
                                        checked={applyHoliday}
                                        onCheckedChange={(checked) => setApplyHoliday(checked as boolean)}
                                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                    />
                                    <Label htmlFor="holiday" className="cursor-pointer flex-1">
                                        Apply holiday theme
                                    </Label>
                                </div>

                                {applyHoliday && (
                                    <div className="space-y-2 animate-in slide-in-from-top-2 fade-in duration-200">
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

                                <div className="space-y-2">
                                    <Label htmlFor="length">Letter Length</Label>
                                    <Select value={letterLength} onValueChange={(v) => setLetterLength(v as 'short' | 'medium' | 'long')}>
                                        <SelectTrigger id="length" className="transition-all hover:border-primary/50">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {letterLengths.map((l) => (
                                                <SelectItem key={l.value} value={l.value}>
                                                    <div className="flex flex-col py-1">
                                                        <span className="font-medium">{l.label}</span>
                                                        <span className="text-xs text-muted-foreground">{l.description}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            {step > 1 && (
                                <Button
                                    variant="outline"
                                    onClick={handleBack}
                                    className="flex-1"
                                >
                                    Back
                                </Button>
                            )}
                            {step < totalSteps ? (
                                <Button
                                    onClick={handleNext}
                                    disabled={!isStep1Valid || loading}
                                    className="flex-1 bg-primary hover:bg-primary/90"
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                            Generating...
                                        </span>
                                    ) : (
                                        'Generate & Next Step'
                                    )}
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleGenerate}
                                    disabled={loading || !context.trim()}
                                    className="flex-1 h-10 text-base font-medium bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] hover:shadow-primary/30 disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                            Generating...
                                        </span>
                                    ) : (
                                        'Generate Letter'
                                    )}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {!generatedLetter ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Generated Letter</CardTitle>
                            <CardDescription>
                                Preview and save your AI-generated content
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center min-h-[300px] text-muted-foreground">
                                Your generated letter will appear here
                            </div>
                        </CardContent>
                    </Card>
                ) : null}
            </div>

            {generatedLetter && (
                <EnhancedLetterResult
                    initialLetter={generatedLetter}
                    onSave={(letter, options) => {
                        // Save with all options
                        const params = new URLSearchParams({
                            generated: 'true',
                            content: letter,
                            tone,
                            occasion,
                            handwriting: options.handwriting,
                            cardStyle: options.cardStyle,
                            envelope: options.envelope,
                        });

                        if (options.frontImage) {
                            params.append('frontImage', options.frontImage);
                        }

                        router.push(`/templates?${params.toString()}`);
                    }}
                    onSendNow={(letter, options) => {
                        // Navigate to send page with all options
                        const params = new URLSearchParams({
                            content: letter,
                            handwriting: options.handwriting,
                            cardStyle: options.cardStyle,
                            envelope: options.envelope,
                        });

                        if (options.frontImage) {
                            params.append('frontImage', options.frontImage);
                        }

                        router.push(`/send?${params.toString()}`);
                    }}
                />
            )}
        </div>
    );
}
