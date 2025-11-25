import { RecipientForm } from '@/features/recipients/recipient-form';
import { RecipientList } from '@/features/recipients/recipient-list';

export default function RecipientsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Recipients</h1>
                <RecipientForm />
            </div>
            <RecipientList />
        </div>
    );
}
