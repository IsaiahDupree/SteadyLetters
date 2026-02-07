import { CsvLetterUploadForm } from '@/features/send/csv-letter-upload-form';

export default function CsvLetterUploadPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Bulk Letter Upload</h1>
                <p className="mt-2 text-muted-foreground">
                    Upload a CSV file with recipient data and letter content to send letters in bulk
                </p>
            </div>
            <CsvLetterUploadForm />
        </div>
    );
}
