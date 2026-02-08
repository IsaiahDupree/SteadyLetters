'use client';

import { useState } from 'react';
import { CSVImportForm } from '@/features/recipients/csv-import-form';
import { VCardImportForm } from '@/features/recipients/vcard-import-form';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, FileText, Users } from 'lucide-react';
import Link from 'next/link';

export default function RecipientImportPage() {
    const [activeTab, setActiveTab] = useState('csv');

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
                    Bulk import recipients from CSV or vCard files
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="csv" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        CSV Import
                    </TabsTrigger>
                    <TabsTrigger value="vcard" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        vCard Import
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="csv" className="space-y-6">
                    <CSVImportForm />
                </TabsContent>

                <TabsContent value="vcard" className="space-y-6">
                    <VCardImportForm />
                </TabsContent>
            </Tabs>
        </div>
    );
}
