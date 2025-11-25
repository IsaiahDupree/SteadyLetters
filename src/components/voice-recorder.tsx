'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, Square, Loader2, Check } from 'lucide-react';

interface VoiceRecorderProps {
    onTranscriptionComplete: (text: string) => void;
}

export function VoiceRecorder({ onTranscriptionComplete }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcribed, setTranscribed] = useState(false);
    const [duration, setDuration] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm',
            });

            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
                stream.getTracks().forEach((track) => track.stop());
                await transcribeAudio(audioBlob);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setTranscribed(false);
            setDuration(0);

            // Start duration counter
            timerRef.current = setInterval(() => {
                setDuration((prev) => prev + 1);
            }, 1000);
        } catch (error) {
            console.error('Failed to start recording:', error);
            alert('Failed to access microphone. Please check permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);

            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    };

    const transcribeAudio = async (audioBlob: Blob) => {
        setIsTranscribing(true);

        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');

            const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Transcription failed');
            }

            onTranscriptionComplete(data.text);
            setTranscribed(true);
        } catch (error) {
            console.error('Transcription error:', error);
            alert('Failed to transcribe audio. Please try again.');
        } finally {
            setIsTranscribing(false);
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Card className="border-dashed">
            <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="text-center">
                        <p className="text-sm font-medium mb-2">
                            {isRecording
                                ? 'Recording...'
                                : isTranscribing
                                    ? 'Transcribing...'
                                    : transcribed
                                        ? 'Transcription complete!'
                                        : 'Speak your letter context'}
                        </p>
                        {isRecording && (
                            <p className="text-sm text-muted-foreground">
                                {formatDuration(duration)}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        {!isRecording && !isTranscribing && (
                            <Button
                                onClick={startRecording}
                                size="lg"
                                className="rounded-full h-16 w-16"
                                variant={transcribed ? 'outline' : 'default'}
                            >
                                {transcribed ? (
                                    <Check className="h-6 w-6" />
                                ) : (
                                    <Mic className="h-6 w-6" />
                                )}
                            </Button>
                        )}

                        {isRecording && (
                            <Button
                                onClick={stopRecording}
                                size="lg"
                                className="rounded-full h-16 w-16 bg-red-500 hover:bg-red-600"
                            >
                                <Square className="h-6 w-6" />
                            </Button>
                        )}

                        {isTranscribing && (
                            <div className="flex items-center justify-center h-16 w-16">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        )}
                    </div>

                    {isRecording && (
                        <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                                <div
                                    key={i}
                                    className="w-1 bg-red-500 rounded-full animate-pulse"
                                    style={{
                                        height: `${Math.random() * 20 + 10}px`,
                                        animationDelay: `${i * 0.1}s`,
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    <p className="text-xs text-muted-foreground text-center max-w-xs">
                        {isRecording
                            ? 'Click the square button to stop recording'
                            : transcribed
                                ? 'Click the microphone to record again'
                                : 'Click the microphone button and speak clearly'}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
