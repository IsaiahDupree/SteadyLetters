import { SendForm } from '@/features/send/send-form';

export default function SendPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Send Letter</h1>
            <SendForm />
        </div>
    );
}
