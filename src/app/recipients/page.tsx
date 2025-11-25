import { RecipientForm } from '@/features/recipients/recipient-form';
import { RecipientList } from '@/features/recipients/recipient-list';
import { AddressExtractor } from '@/components/address-extractor';

export const dynamic = 'force-dynamic';

export default function RecipientsPage() {
    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-600">
                    Recipients
                </h1>
                <p className="text-muted-foreground text-lg">
                    Manage your mailing list and send personalized letters
                </p>
            </div>
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <AddressExtractor />
                <RecipientForm />
            </div>
            <RecipientList />
        </div>
    );
}
