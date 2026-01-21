'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { getRecipients } from '@/app/actions/recipients';
import { getTemplates } from '@/app/actions/templates';
import { createBulkOrder } from '@/app/actions/orders';
import { Loader2 } from 'lucide-react';

type Recipient = {
    id: string;
    name: string;
    address1: string;
    city: string;
    state: string;
    zip: string;
};

type Template = {
    id: string;
    name: string;
    message: string;
    frontImageUrl: string | null;
    handwritingStyle: string;
};

export function BulkSendForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [productType, setProductType] = useState<'postcard' | 'letter' | 'greeting'>('postcard');
    const [message, setMessage] = useState('');
    const [handwritingStyle, setHandwritingStyle] = useState('1');
    const [handwritingColor, setHandwritingColor] = useState('blue');

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        // When template is selected, populate message
        if (selectedTemplate) {
            const template = templates.find((t) => t.id === selectedTemplate);
            if (template) {
                setMessage(template.message);
                setHandwritingStyle(template.handwritingStyle);
            }
        }
    }, [selectedTemplate, templates]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [recipientsData, templatesData] = await Promise.all([
                getRecipients(),
                getTemplates(),
            ]);
            setRecipients(recipientsData);
            setTemplates(templatesData);
        } catch (error) {
            console.error('Failed to load data:', error);
            toast.error('Failed to load recipients and templates');
        } finally {
            setLoading(false);
        }
    };

    const toggleRecipient = (recipientId: string) => {
        setSelectedRecipients((prev) =>
            prev.includes(recipientId)
                ? prev.filter((id) => id !== recipientId)
                : [...prev, recipientId]
        );
    };

    const selectAll = () => {
        setSelectedRecipients(recipients.map((r) => r.id));
    };

    const deselectAll = () => {
        setSelectedRecipients([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedRecipients.length === 0) {
            toast.error('Please select at least one recipient');
            return;
        }

        if (!message.trim()) {
            toast.error('Please enter or select a message');
            return;
        }

        setSubmitting(true);

        try {
            const template = templates.find((t) => t.id === selectedTemplate);

            const result = await createBulkOrder({
                recipientIds: selectedRecipients,
                templateId: selectedTemplate || undefined,
                message,
                productType,
                frontImageUrl: template?.frontImageUrl || undefined,
                handwritingStyle,
                handwritingColor,
            });

            if (result.success) {
                toast.success(`Successfully sent ${result.summary?.successful} of ${result.summary?.total} letters. ${result.summary?.failed || 0} failed.`);
                router.push('/orders');
            } else {
                toast.error(result.error || 'Failed to send letters');
            }
        } catch (error) {
            console.error('Failed to send bulk order:', error);
            toast.error('An unexpected error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Select Recipients</CardTitle>
                            <CardDescription>
                                Choose which recipients will receive this letter
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4 flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={selectAll}
                                >
                                    Select All
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={deselectAll}
                                >
                                    Deselect All
                                </Button>
                            </div>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                {recipients.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No recipients found. Add recipients first.
                                    </p>
                                ) : (
                                    recipients.map((recipient) => (
                                        <div
                                            key={recipient.id}
                                            className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-muted/50"
                                        >
                                            <Checkbox
                                                id={`recipient-${recipient.id}`}
                                                checked={selectedRecipients.includes(recipient.id)}
                                                onCheckedChange={() => toggleRecipient(recipient.id)}
                                            />
                                            <label
                                                htmlFor={`recipient-${recipient.id}`}
                                                className="flex-1 cursor-pointer space-y-0.5"
                                            >
                                                <div className="font-medium">{recipient.name}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {recipient.address1}, {recipient.city}, {recipient.state}{' '}
                                                    {recipient.zip}
                                                </div>
                                            </label>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <p className="text-sm text-muted-foreground">
                                {selectedRecipients.length} recipient(s) selected
                            </p>
                        </CardFooter>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Message</CardTitle>
                            <CardDescription>
                                Select a template or write a custom message
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="template">Template (Optional)</Label>
                                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                                    <SelectTrigger id="template">
                                        <SelectValue placeholder="Select a template" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None (Custom Message)</SelectItem>
                                        {templates.map((template) => (
                                            <SelectItem key={template.id} value={template.id}>
                                                {template.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">Message</Label>
                                <Textarea
                                    id="message"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Enter your message..."
                                    rows={8}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="productType">Product Type</Label>
                                <Select
                                    value={productType}
                                    onValueChange={(value: any) => setProductType(value)}
                                >
                                    <SelectTrigger id="productType">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="postcard">Postcard ($1.14)</SelectItem>
                                        <SelectItem value="letter">Letter ($1.20)</SelectItem>
                                        <SelectItem value="greeting">Greeting Card ($3.00)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="handwritingStyle">Handwriting Style</Label>
                                <Select
                                    value={handwritingStyle}
                                    onValueChange={setHandwritingStyle}
                                >
                                    <SelectTrigger id="handwritingStyle">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Style 1</SelectItem>
                                        <SelectItem value="2">Style 2</SelectItem>
                                        <SelectItem value="3">Style 3</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="handwritingColor">Handwriting Color</Label>
                                <Select
                                    value={handwritingColor}
                                    onValueChange={setHandwritingColor}
                                >
                                    <SelectTrigger id="handwritingColor">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="blue">Blue</SelectItem>
                                        <SelectItem value="black">Black</SelectItem>
                                        <SelectItem value="green">Green</SelectItem>
                                        <SelectItem value="purple">Purple</SelectItem>
                                        <SelectItem value="red">Red</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Recipients:</span>
                                <span className="font-medium">{selectedRecipients.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Product:</span>
                                <span className="font-medium capitalize">{productType}</span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                                <span className="font-medium">Usage:</span>
                                <span className="font-medium">
                                    {selectedRecipients.length} letter(s)
                                </span>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full" disabled={submitting}>
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    `Send to ${selectedRecipients.length} Recipient(s)`
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </form>
    );
}
