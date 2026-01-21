import { BulkSendForm } from '@/features/send/bulk-send-form';

export default function BulkSendPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Bulk Send</h1>
                <p className="mt-2 text-muted-foreground">
                    Send the same letter to multiple recipients at once
                </p>
            </div>
            <BulkSendForm />
        </div>
    );
}
