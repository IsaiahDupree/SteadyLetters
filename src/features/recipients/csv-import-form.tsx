'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { parseCSV, generateCSVTemplate, type ParseResult } from '@/lib/csv-parser';
import { bulkImportRecipients, type BulkImportResult } from '@/app/actions/recipients';
import { Upload, Download, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CSVImportForm() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [parseResult, setParseResult] = useState<ParseResult | null>(null);
    const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setParseResult(null);
        setImportResult(null);
        setError(null);

        try {
            const text = await selectedFile.text();
            const result = parseCSV(text);
            setParseResult(result);
        } catch (err: any) {
            setError(err.message || 'Failed to parse CSV file');
            setFile(null);
        }
    };

    const handleImport = async () => {
        if (!parseResult || parseResult.valid.length === 0) return;

        setLoading(true);
        setError(null);

        try {
            const recipients = parseResult.valid.map(row => row.data);
            const result = await bulkImportRecipients(recipients);
            setImportResult(result);

            if (result.success) {
                // Redirect after successful import
                setTimeout(() => {
                    router.push('/recipients');
                }, 2000);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to import recipients');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadTemplate = () => {
        const template = generateCSVTemplate();
        const blob = new Blob([template], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'recipients-template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Import Recipients from CSV</CardTitle>
                    <CardDescription>
                        Upload a CSV file to import multiple recipients at once
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Download Template Button */}
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadTemplate}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download Template
                        </Button>
                        <p className="text-sm text-muted-foreground">
                            Use this template to format your CSV file correctly
                        </p>
                    </div>

                    {/* File Upload */}
                    <div className="space-y-2">
                        <label
                            htmlFor="csv-file"
                            className="block text-sm font-medium text-foreground"
                        >
                            Select CSV File
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                id="csv-file"
                                type="file"
                                accept=".csv,text/csv"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                            />
                            {file && (
                                <span className="text-sm text-muted-foreground">
                                    {file.name}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Parse Results */}
                    {parseResult && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-primary">
                                                {parseResult.totalRows}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Total Rows
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                <p className="text-2xl font-bold text-green-600">
                                                    {parseResult.valid.length}
                                                </p>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                Valid
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <XCircle className="h-5 w-5 text-red-600" />
                                                <p className="text-2xl font-bold text-red-600">
                                                    {parseResult.invalid.length}
                                                </p>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                Invalid
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Invalid Rows */}
                            {parseResult.invalid.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">
                                            Invalid Rows
                                        </CardTitle>
                                        <CardDescription>
                                            These rows have validation errors and will not be imported
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {parseResult.invalid.map((row) => (
                                                <div
                                                    key={row.rowNumber}
                                                    className="border rounded-lg p-3 space-y-1"
                                                >
                                                    <p className="text-sm font-medium">
                                                        Row {row.rowNumber}
                                                    </p>
                                                    <ul className="text-sm text-red-600 list-disc list-inside">
                                                        {row.errors.map((err, idx) => (
                                                            <li key={idx}>{err}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Import Button */}
                            {parseResult.valid.length > 0 && (
                                <Button
                                    onClick={handleImport}
                                    disabled={loading}
                                    className="w-full"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    {loading
                                        ? 'Importing...'
                                        : `Import ${parseResult.valid.length} Recipient${parseResult.valid.length === 1 ? '' : 's'}`}
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Import Results */}
                    {importResult && (
                        <Alert variant={importResult.success ? 'default' : 'destructive'}>
                            {importResult.success ? (
                                <CheckCircle2 className="h-4 w-4" />
                            ) : (
                                <XCircle className="h-4 w-4" />
                            )}
                            <AlertDescription>
                                {importResult.success ? (
                                    <>
                                        Successfully imported {importResult.imported} recipient
                                        {importResult.imported === 1 ? '' : 's'}! Redirecting...
                                    </>
                                ) : (
                                    <>
                                        Failed to import recipients. Please try again.
                                    </>
                                )}
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* CSV Format Instructions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">CSV Format Requirements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                        Your CSV file must include the following columns (header names are flexible):
                    </p>
                    <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                        <li>
                            <strong>name</strong>: Recipient full name
                        </li>
                        <li>
                            <strong>address1</strong>: Street address (alternatives: address, street)
                        </li>
                        <li>
                            <strong>address2</strong>: Apartment/Suite (optional)
                        </li>
                        <li>
                            <strong>city</strong>: City name
                        </li>
                        <li>
                            <strong>state</strong>: State/Province (2-letter code preferred)
                        </li>
                        <li>
                            <strong>zip</strong>: ZIP/Postal code (alternatives: zipcode, postal_code)
                        </li>
                        <li>
                            <strong>country</strong>: Country code (optional, defaults to US)
                        </li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
