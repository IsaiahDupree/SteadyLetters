'use client';

import { useState, useRef } from 'react';
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
import { createBulkOrderFromCSV } from '@/app/actions/orders';
import { Loader2, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

type ParsedRow = {
    rowNumber: number;
    isValid: boolean;
    data: {
        name: string;
        address1: string;
        address2?: string;
        city: string;
        state: string;
        zip: string;
        country?: string;
        message?: string;
    };
    errors: string[];
};

type ParseResult = {
    valid: ParsedRow[];
    invalid: ParsedRow[];
    totalRows: number;
};

export function CsvLetterUploadForm() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [parseResult, setParseResult] = useState<ParseResult | null>(null);
    const [productType, setProductType] = useState<'postcard' | 'letter' | 'greeting'>('postcard');
    const [handwritingStyle, setHandwritingStyle] = useState('1');
    const [handwritingColor, setHandwritingColor] = useState('blue');
    const [globalMessage, setGlobalMessage] = useState('');
    const [useGlobalMessage, setUseGlobalMessage] = useState(true);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            toast.error('Please select a CSV file');
            return;
        }

        setCsvFile(file);
        setUploading(true);

        try {
            const text = await file.text();
            const result = await parseCSV(text);
            setParseResult(result);

            if (result.invalid.length > 0) {
                toast.warning(
                    `CSV parsed with ${result.invalid.length} invalid row(s). Review errors below.`
                );
            } else {
                toast.success(`CSV parsed successfully. ${result.valid.length} valid row(s).`);
            }
        } catch (error: any) {
            console.error('Failed to parse CSV:', error);
            toast.error(error.message || 'Failed to parse CSV file');
            setCsvFile(null);
            setParseResult(null);
        } finally {
            setUploading(false);
        }
    };

    const parseCSV = async (csvText: string): Promise<ParseResult> => {
        const { parseCSV: parseCSVImpl } = await import('@/lib/csv-parser-impl.js');
        return parseCSVImpl(csvText) as ParseResult;
    };

    const downloadTemplate = () => {
        const headers = [
            'name',
            'address1',
            'address2',
            'city',
            'state',
            'zip',
            'country',
            'message',
        ];
        const exampleRow = [
            'John Doe',
            '123 Main St',
            'Apt 4B',
            'New York',
            'NY',
            '10001',
            'US',
            'Dear John, Happy Birthday! Best wishes, Your friend',
        ];

        const csv = [headers.join(','), exampleRow.join(',')].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bulk-letters-template.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!parseResult || parseResult.valid.length === 0) {
            toast.error('Please upload a valid CSV file with at least one recipient');
            return;
        }

        if (useGlobalMessage && !globalMessage.trim()) {
            toast.error('Please enter a message or use messages from CSV');
            return;
        }

        setSubmitting(true);

        try {
            const recipients = parseResult.valid.map((row) => ({
                name: row.data.name,
                address1: row.data.address1,
                address2: row.data.address2,
                city: row.data.city,
                state: row.data.state,
                zip: row.data.zip,
                country: row.data.country || 'US',
                message: useGlobalMessage ? globalMessage : row.data.message || '',
            }));

            const result = await createBulkOrderFromCSV({
                recipients,
                productType,
                handwritingStyle,
                handwritingColor,
            });

            if (result.success) {
                toast.success(
                    `Successfully sent ${result.summary?.successful} of ${result.summary?.total} letters. ${result.summary?.failed || 0} failed.`
                );
                router.push('/orders');
            } else {
                toast.error(result.error || 'Failed to send letters');
            }
        } catch (error) {
            console.error('Failed to send bulk letters:', error);
            toast.error('An unexpected error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload CSV File</CardTitle>
                            <CardDescription>
                                Upload a CSV file with recipient data and optional message per recipient
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>CSV File</Label>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="flex-1"
                                    >
                                        {uploading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Parsing...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="mr-2 h-4 w-4" />
                                                {csvFile ? csvFile.name : 'Choose File'}
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={downloadTemplate}
                                    >
                                        <FileText className="mr-2 h-4 w-4" />
                                        Template
                                    </Button>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Required columns: name, address1, city, state, zip
                                    <br />
                                    Optional columns: address2, country, message
                                </p>
                            </div>

                            {parseResult && (
                                <div className="space-y-3">
                                    {parseResult.valid.length > 0 && (
                                        <Alert>
                                            <CheckCircle className="h-4 w-4" />
                                            <AlertDescription>
                                                {parseResult.valid.length} valid recipient(s) ready to send
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {parseResult.invalid.length > 0 && (
                                        <Alert variant="destructive">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>
                                                {parseResult.invalid.length} invalid row(s) will be skipped
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {parseResult.invalid.length > 0 && (
                                        <div className="rounded-md border p-3 max-h-[200px] overflow-y-auto">
                                            <h4 className="text-sm font-semibold mb-2">Validation Errors:</h4>
                                            <div className="space-y-2">
                                                {parseResult.invalid.map((row) => (
                                                    <div
                                                        key={row.rowNumber}
                                                        className="text-sm text-muted-foreground"
                                                    >
                                                        <span className="font-medium">Row {row.rowNumber}:</span>{' '}
                                                        {row.errors.join(', ')}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Letter Settings</CardTitle>
                            <CardDescription>
                                Configure product type and styling for all letters
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="messageOption">Message Source</Label>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant={useGlobalMessage ? 'default' : 'outline'}
                                        onClick={() => setUseGlobalMessage(true)}
                                        className="flex-1"
                                    >
                                        Same Message
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={!useGlobalMessage ? 'default' : 'outline'}
                                        onClick={() => setUseGlobalMessage(false)}
                                        className="flex-1"
                                    >
                                        From CSV
                                    </Button>
                                </div>
                            </div>

                            {useGlobalMessage && (
                                <div className="space-y-2">
                                    <Label htmlFor="message">Message for All Recipients</Label>
                                    <Textarea
                                        id="message"
                                        value={globalMessage}
                                        onChange={(e) => setGlobalMessage(e.target.value)}
                                        placeholder="Enter message to send to all recipients..."
                                        rows={6}
                                        required
                                    />
                                </div>
                            )}

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
                                <span className="text-muted-foreground">Valid Recipients:</span>
                                <span className="font-medium">{parseResult?.valid.length || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Invalid Recipients:</span>
                                <span className="font-medium text-destructive">
                                    {parseResult?.invalid.length || 0}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Product:</span>
                                <span className="font-medium capitalize">{productType}</span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                                <span className="font-medium">Usage:</span>
                                <span className="font-medium">
                                    {parseResult?.valid.length || 0} letter(s)
                                </span>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={submitting || !parseResult || parseResult.valid.length === 0}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    `Send ${parseResult?.valid.length || 0} Letter(s)`
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </form>
    );
}
