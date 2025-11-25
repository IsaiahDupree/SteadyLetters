import { LetterGeneratorForm } from '@/features/generate/letter-generator-form';

export default function GeneratePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">AI Letter Generator</h1>
                <p className="text-muted-foreground">
                    Create personalized letters with AI assistance
                </p>
            </div>
            <LetterGeneratorForm />
        </div>
    );
}
