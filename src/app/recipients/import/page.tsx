import { CSVImportForm } from '@/features/recipients/csv-import-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function RecipientImportPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/recipients">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Recipients
                    </Button>
                </Link>
            </div>

            <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-600">
                    Import Recipients
                </h1>
                <p className="text-muted-foreground text-lg">
                    Bulk import recipients from a CSV file
                </p>
            </div>

            <CSVImportForm />
        </div>
    );
}
