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
import { toast } from 'sonner';
import { getRecipients } from '@/app/actions/recipients';
import { getTemplates } from '@/app/actions/templates';
import { createOrder } from '@/app/actions/orders';
import { generateAndDownloadLetterPDF } from '@/lib/letter-pdf';
import { Loader2, FileDown } from 'lucide-react';

type Recipient = {
    id: string;
    name: string;
    address1: string;
    address2: string | null;
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

export function SendForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedRecipient, setSelectedRecipient] = useState<string>('');
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

    const handlePreviewPDF = () => {
        if (!selectedRecipient) {
            toast.error('Please select a recipient first');
            return;
        }

        if (!message.trim()) {
            toast.error('Please enter or select a message');
            return;
        }

        const recipient = recipients.find((r) => r.id === selectedRecipient);
        if (!recipient) {
            toast.error('Recipient not found');
            return;
        }

        try {
            generateAndDownloadLetterPDF({
                recipientName: recipient.name,
                recipientAddress: recipient.address1,
                recipientCity: recipient.city,
                recipientState: recipient.state,
                recipientZip: recipient.zip,
                message,
                handwritingStyle,
                handwritingColor,
                frontImageUrl: templates.find((t) => t.id === selectedTemplate)?.frontImageUrl || undefined,
            });

            toast.success('PDF preview downloaded!');
        } catch (error) {
            console.error('Failed to generate PDF:', error);
            toast.error('Failed to generate PDF preview');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedRecipient) {
            toast.error('Please select a recipient');
            return;
        }

        if (!message.trim()) {
            toast.error('Please enter or select a message');
            return;
        }

        setSubmitting(true);

        try {
            const template = templates.find((t) => t.id === selectedTemplate);

            const result = await createOrder({
                recipientId: selectedRecipient,
                templateId: selectedTemplate || undefined,
                message,
                productType,
                frontImageUrl: template?.frontImageUrl || undefined,
                handwritingStyle,
                handwritingColor,
            });

            if (result.success) {
                toast.success('Letter sent successfully!');
                router.push('/orders');
            } else {
                toast.error(result.error || 'Failed to send letter');
            }
        } catch (error) {
            console.error('Failed to send letter:', error);
            toast.error('An unexpected error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    const template = templates.find((t) => t.id === selectedTemplate);
    const recipient = recipients.find((r) => r.id === selectedRecipient);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Send a Letter</CardTitle>
                    <CardDescription>
                        Choose a recipient and compose your message.
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
                            <Label htmlFor="template">Template (Optional)</Label>
                            <Select
                                value={selectedTemplate}
                                onValueChange={setSelectedTemplate}
                            >
                                <SelectTrigger id="template">
                                    <SelectValue placeholder="Select template or write custom" />
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

                        <div className="space-y-2">
                            <Label htmlFor="message">Message</Label>
                            <Textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Write your letter content here..."
                                rows={8}
                                className="resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="productType">Product Type</Label>
                            <Select
                                value={productType}
                                onValueChange={(value) => setProductType(value as typeof productType)}
                            >
                                <SelectTrigger id="productType">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="postcard">Postcard</SelectItem>
                                    <SelectItem value="letter">Letter</SelectItem>
                                    <SelectItem value="greeting">Greeting Card</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="handwritingColor">Ink Color</Label>
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
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="handwritingStyle">Style</Label>
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
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handlePreviewPDF}
                        disabled={!selectedRecipient || !message.trim()}
                        className="flex-1"
                    >
                        <FileDown className="mr-2 h-4 w-4" />
                        Preview PDF
                    </Button>
                    <Button
                        type="submit"
                        form="send-form"
                        disabled={submitting}
                        className="flex-1"
                    >
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Letter
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Preview</CardTitle>
                    <CardDescription>
                        {recipient ? `Sending to ${recipient.name}` : 'Select a recipient to preview'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recipient && (
                            <div className="rounded-lg border p-4 text-sm">
                                <p className="font-semibold">To:</p>
                                <p>{recipient.name}</p>
                                <p>{recipient.address1}</p>
                                {recipient.address2 && <p>{recipient.address2}</p>}
                                <p>{recipient.city}, {recipient.state} {recipient.zip}</p>
                            </div>
                        )}

                        {message && (
                            <div className="rounded-lg border p-4">
                                <p className="text-sm font-semibold mb-2">Message Preview:</p>
                                <p className="text-sm whitespace-pre-wrap">{message}</p>
                            </div>
                        )}

                        {template?.frontImageUrl && (
                            <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={template.frontImageUrl}
                                    alt={template.name}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        )}

                        {!recipient && !message && (
                            <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                                <span className="text-muted-foreground">Fill in the form to see preview</span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
