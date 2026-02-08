'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle2, XCircle, Download, Users } from 'lucide-react';
import { parseVCard, validateVCardContact, vCardToRecipient, type VCardContact } from '@/lib/vcard-parser';
import { bulkImportRecipients } from '@/app/actions/recipients';

export function VCardImportForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parseResult, setParseResult] = useState<{
    valid: VCardContact[];
    invalid: Array<{ line: number; error: string; raw: string }>;
    totalContacts: number;
  } | null>(null);
  const [error, setError] = useState<string>('');
  const [importResult, setImportResult] = useState<{
    success: boolean;
    imported: number;
    failed: number;
    errors?: Array<{ rowNumber: number; errors: string[] }>;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validExtensions = ['.vcf', '.vcard'];
      const fileName = selectedFile.name.toLowerCase();
      const isValid = validExtensions.some(ext => fileName.endsWith(ext));

      if (!isValid) {
        setError('Please upload a valid vCard file (.vcf or .vcard)');
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError('');
      setParseResult(null);
      setImportResult(null);
    }
  };

  const handleParse = async () => {
    if (!file) return;

    setParsing(true);
    setError('');
    setParseResult(null);

    try {
      const text = await file.text();
      const result = parseVCard(text);
      setParseResult(result);

      if (result.valid.length === 0) {
        setError('No valid contacts found in the vCard file');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse vCard file');
      console.error('vCard parse error:', err);
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (!parseResult || parseResult.valid.length === 0) return;

    setImporting(true);
    setError('');

    try {
      // Convert vCard contacts to recipient format and validate
      const recipientsToImport = parseResult.valid
        .map(contact => {
          const validationError = validateVCardContact(contact);
          if (validationError) {
            return { contact, error: validationError };
          }
          return { contact, recipient: vCardToRecipient(contact) };
        })
        .filter(item => 'recipient' in item)
        .map(item => (item as { recipient: ReturnType<typeof vCardToRecipient> }).recipient);

      if (recipientsToImport.length === 0) {
        setError('No valid recipients to import after validation');
        setImporting(false);
        return;
      }

      // Import recipients
      const result = await bulkImportRecipients(recipientsToImport);

      setImportResult(result);

      // If all successful, redirect after a short delay
      if (result.failed === 0) {
        setTimeout(() => {
          router.push('/recipients');
          router.refresh();
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import recipients');
      console.error('Import error:', err);
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const templateContent = `BEGIN:VCARD
VERSION:3.0
FN:John Doe
N:Doe;John;;;
ADR;TYPE=HOME:;;123 Main Street;Springfield;IL;62701;US
EMAIL:john.doe@example.com
TEL:+1-555-123-4567
END:VCARD
BEGIN:VCARD
VERSION:3.0
FN:Jane Smith
N:Smith;Jane;;;
ADR;TYPE=HOME:;;456 Oak Avenue;Portland;OR;97201;US
EMAIL:jane.smith@example.com
TEL:+1-555-987-6543
END:VCARD`;

    const blob = new Blob([templateContent], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vcard-template.vcf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">How to Import Contacts</h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>1. Export contacts from your contact manager:</p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li><strong>Google Contacts:</strong> More → Export → vCard format</li>
            <li><strong>Outlook:</strong> File → Open & Export → Import/Export → Export to a file → vCard</li>
            <li><strong>Apple Contacts:</strong> Select contacts → File → Export → Export vCard</li>
          </ul>
          <p className="mt-4">2. Upload the .vcf or .vcard file below</p>
          <p>3. Review the parsed contacts and import</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={downloadTemplate}
          className="mt-4"
        >
          <Download className="h-4 w-4 mr-2" />
          Download Template vCard
        </Button>
      </Card>

      {/* File Upload */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="vcard-upload"
              className="block text-sm font-medium mb-2"
            >
              Upload vCard File (.vcf or .vcard)
            </label>
            <div className="flex items-center gap-4">
              <label
                htmlFor="vcard-upload"
                className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </label>
              <input
                id="vcard-upload"
                type="file"
                accept=".vcf,.vcard"
                onChange={handleFileChange}
                className="hidden"
              />
              {file && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <FileText className="h-4 w-4 mr-2" />
                  {file.name}
                </div>
              )}
            </div>
          </div>

          {file && !parseResult && (
            <Button
              onClick={handleParse}
              disabled={parsing}
              className="w-full sm:w-auto"
            >
              {parsing ? 'Parsing...' : 'Parse vCard File'}
            </Button>
          )}
        </div>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Parse Results */}
      {parseResult && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Parse Results</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{parseResult.totalContacts}</div>
              <div className="text-sm text-muted-foreground">Total Contacts</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-600">{parseResult.valid.length}</div>
              <div className="text-sm text-muted-foreground">Valid</div>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
              <XCircle className="h-8 w-8 mx-auto mb-2 text-red-600" />
              <div className="text-2xl font-bold text-red-600">{parseResult.invalid.length}</div>
              <div className="text-sm text-muted-foreground">Invalid</div>
            </div>
          </div>

          {/* Valid Contacts Preview */}
          {parseResult.valid.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium mb-3">Valid Contacts ({parseResult.valid.length})</h3>
              <div className="max-h-64 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Address</th>
                      <th className="text-left p-2">City</th>
                      <th className="text-left p-2">State</th>
                      <th className="text-left p-2">ZIP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parseResult.valid.slice(0, 100).map((contact, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-2">{contact.name}</td>
                        <td className="p-2">{contact.address || '—'}</td>
                        <td className="p-2">{contact.city || '—'}</td>
                        <td className="p-2">{contact.state || '—'}</td>
                        <td className="p-2">{contact.zip || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parseResult.valid.length > 100 && (
                  <div className="p-2 text-center text-sm text-muted-foreground bg-muted">
                    + {parseResult.valid.length - 100} more contacts
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Invalid Contacts */}
          {parseResult.invalid.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium mb-3 text-red-600">Invalid Contacts ({parseResult.invalid.length})</h3>
              <div className="max-h-48 overflow-y-auto border border-red-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-red-50 dark:bg-red-950 sticky top-0">
                    <tr>
                      <th className="text-left p-2">Contact #</th>
                      <th className="text-left p-2">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parseResult.invalid.map((item, idx) => (
                      <tr key={idx} className="border-t border-red-100">
                        <td className="p-2">{item.line}</td>
                        <td className="p-2 text-red-600">{item.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Button */}
          {parseResult.valid.length > 0 && !importResult && (
            <Button
              onClick={handleImport}
              disabled={importing}
              className="w-full sm:w-auto"
            >
              {importing ? 'Importing...' : `Import ${parseResult.valid.length} Recipient${parseResult.valid.length > 1 ? 's' : ''}`}
            </Button>
          )}
        </Card>
      )}

      {/* Import Results */}
      {importResult && (
        <Alert variant={importResult.failed === 0 ? 'default' : 'destructive'}>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">Import Complete</div>
            <div>Successfully imported {importResult.imported} recipient{importResult.imported !== 1 ? 's' : ''}</div>
            {importResult.failed > 0 && (
              <div className="text-red-600 mt-2">
                Failed to import {importResult.failed} recipient{importResult.failed !== 1 ? 's' : ''}
                {importResult.errors && importResult.errors.length > 0 && (
                  <ul className="list-disc list-inside mt-1 text-sm">
                    {importResult.errors.slice(0, 5).map((err, idx) => (
                      <li key={idx}>Row {err.rowNumber}: {err.errors.join(', ')}</li>
                    ))}
                    {importResult.errors.length > 5 && <li>+ {importResult.errors.length - 5} more errors</li>}
                  </ul>
                )}
              </div>
            )}
            {importResult.failed === 0 && (
              <div className="text-sm text-muted-foreground mt-2">
                Redirecting to recipients page...
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
