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
            // Request optimized audio stream for low latency
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    // Low latency optimizations
                    sampleRate: 48000, // Higher sample rate for better quality
                    channelCount: 1, // Mono for smaller file size and faster processing
                }
            });
            
            // Use the best available mime type with low latency preference
            let mimeType = 'audio/webm';
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                mimeType = 'audio/webm;codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
                mimeType = 'audio/ogg;codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                mimeType = 'audio/mp4';
            }
            
            // Optimize for low latency - lower bitrate, faster encoding
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType,
                audioBitsPerSecond: 64000, // Lower bitrate for faster encoding (still good quality for speech)
            });

            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            // Collect data more frequently for lower latency (250ms chunks)
            // This allows faster processing and better responsiveness
            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };
            
            // Start with smaller timeslice for lower latency (250ms instead of 1000ms)
            // This makes the recording feel more responsive
            mediaRecorder.start(250);

            mediaRecorder.onstop = async () => {
                // Stop stream immediately to free resources
                stream.getTracks().forEach((track) => track.stop());
                
                // Create blob efficiently
                const audioBlob = new Blob(chunksRef.current, { type: mimeType });
                
                // Clear chunks to free memory
                chunksRef.current = [];
                
                // Transcribe in background (non-blocking)
                transcribeAudio(audioBlob).catch((error) => {
                    console.error('Transcription error:', error);
                    alert('Failed to transcribe audio. Please try again.');
                });
            };

            setIsRecording(true);
            setTranscribed(false);
            setDuration(0);

            // Start duration counter with more frequent updates for smoother UI
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
            // Stop immediately for lower latency
            mediaRecorderRef.current.stop();
            setIsRecording(false);

            // Clear timer immediately
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            
            // Request final data chunk immediately
            if (mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.requestData();
            }
        }
    };

    const transcribeAudio = async (audioBlob: Blob) => {
        setIsTranscribing(true);

        try {
            // Use AbortController for timeout handling
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

            const formData = new FormData();
            // Use appropriate file extension based on mime type
            const extension = audioBlob.type.includes('webm') ? 'webm' : 
                             audioBlob.type.includes('ogg') ? 'ogg' : 'mp4';
            formData.append('audio', audioBlob, `recording.${extension}`);

            const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || `Transcription failed: ${response.status}`);
            }

            const data = await response.json();

            onTranscriptionComplete(data.text);
            setTranscribed(true);
        } catch (error: any) {
            console.error('Transcription error:', error);
            
            // Don't show alert if it was aborted (timeout)
            if (error.name !== 'AbortError') {
                alert('Failed to transcribe audio. Please try again.');
            }
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
