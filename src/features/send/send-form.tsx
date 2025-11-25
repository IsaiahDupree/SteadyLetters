'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// Mock data
const recipients = [
    { id: '1', name: 'Sarah Example' },
    { id: '2', name: 'John Doe' },
];

const templates = [
    { id: '1', name: 'Welcome Card', imageUrl: 'https://placehold.co/600x400' },
    { id: '2', name: 'Thank You', imageUrl: 'https://placehold.co/600x400' },
];

export function SendForm() {
    const [selectedRecipient, setSelectedRecipient] = useState<string>('');
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Sending letter...', { selectedRecipient, selectedTemplate });
    };

    const template = templates.find((t) => t.id === selectedTemplate);

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Send a Letter</CardTitle>
                    <CardDescription>
                        Choose a recipient and a template to send.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form id="send-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="recipient">Recipient</Label>
                            <Select
                                value={selectedRecipient}
                                onValueChange={setSelectedRecipient}
                            >
                                <SelectTrigger id="recipient">
                                    <SelectValue placeholder="Select recipient" />
                                </SelectTrigger>
                                <SelectContent>
                                    {recipients.map((r) => (
                                        <SelectItem key={r.id} value={r.id}>
                                            {r.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="template">Template</Label>
                            <Select
                                value={selectedTemplate}
                                onValueChange={setSelectedTemplate}
                            >
                                <SelectTrigger id="template">
                                    <SelectValue placeholder="Select template" />
                                </SelectTrigger>
                                <SelectContent>
                                    {templates.map((t) => (
                                        <SelectItem key={t.id} value={t.id}>
                                            {t.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </form>
                </CardContent>
                <CardFooter>
                    <Button type="submit" form="send-form" className="w-full">
                        Send Letter
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Preview</CardTitle>
                    <CardDescription>
                        This is how your letter will look.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                        {template ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={template.imageUrl}
                                alt={template.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <span className="text-muted-foreground">Select a template</span>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
