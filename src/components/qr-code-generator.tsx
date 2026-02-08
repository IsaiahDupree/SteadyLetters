'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, QrCode, Download } from 'lucide-react';
import { generateQRCodeDataUrl, isValidQRCodeUrl, QR_CODE_TEMPLATES } from '@/lib/qr-code';

interface QRCodeGeneratorProps {
  onQRCodeGenerated?: (dataUrl: string, value: string) => void;
}

export function QRCodeGenerator({ onQRCodeGenerated }: QRCodeGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [qrType, setQrType] = useState<keyof typeof QR_CODE_TEMPLATES>('website');
  const [inputValue, setInputValue] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateQRCode = async () => {
    setError(null);
    setLoading(true);

    try {
      if (!inputValue.trim()) {
        setError('Please enter a value');
        setLoading(false);
        return;
      }

      // Validate URL if it's a website type
      if (qrType === 'website' && !isValidQRCodeUrl(inputValue)) {
        setError('Please enter a valid URL');
        setLoading(false);
        return;
      }

      const template = QR_CODE_TEMPLATES[qrType];
      const qrData = qrType === 'text' ? inputValue : template(inputValue).data;

      const dataUrl = await generateQRCodeDataUrl(qrData);
      setQrDataUrl(dataUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (qrDataUrl && inputValue) {
      onQRCodeGenerated?.(qrDataUrl, inputValue);
      setOpen(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrDataUrl) return;

    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `qr-code-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      // Reset form when opening
      setQrType('website');
      setInputValue('');
      setQrDataUrl(null);
      setError(null);
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <QrCode className="w-4 h-4 mr-2" />
          Add QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate QR Code</DialogTitle>
          <DialogDescription>
            Create a QR code to embed in your letter. Readers can scan it with their phones.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="input" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="input">Create</TabsTrigger>
            <TabsTrigger value="preview" disabled={!qrDataUrl}>
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="input" className="space-y-4 py-4">
            <div>
              <Label htmlFor="qr-type">QR Code Type</Label>
              <Select value={qrType} onValueChange={(value: any) => setQrType(value)}>
                <SelectTrigger id="qr-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">Website URL</SelectItem>
                  <SelectItem value="email">Email Address</SelectItem>
                  <SelectItem value="phone">Phone Number</SelectItem>
                  <SelectItem value="sms">SMS Message</SelectItem>
                  <SelectItem value="text">Plain Text</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="qr-value">
                {qrType === 'website' && 'Website URL'}
                {qrType === 'email' && 'Email Address'}
                {qrType === 'phone' && 'Phone Number'}
                {qrType === 'sms' && 'Phone Number'}
                {qrType === 'text' && 'Text'}
              </Label>
              <Input
                id="qr-value"
                placeholder={
                  qrType === 'website'
                    ? 'https://example.com'
                    : qrType === 'email'
                    ? 'hello@example.com'
                    : qrType === 'phone'
                    ? '+1234567890'
                    : qrType === 'sms'
                    ? '+1234567890'
                    : 'Enter text'
                }
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    generateQRCode();
                  }
                }}
              />
            </div>

            {error && <div className="text-sm text-destructive">{error}</div>}

            <Button onClick={generateQRCode} disabled={loading || !inputValue} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Generating...' : 'Generate QR Code'}
            </Button>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4 py-4">
            {qrDataUrl && (
              <div className="flex flex-col items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="QR Code Preview" className="w-48 h-48 border" />
                <div className="text-sm text-muted-foreground text-center">
                  <p className="font-semibold mb-1">Data encoded:</p>
                  <p className="break-all">{inputValue}</p>
                </div>
                <Button variant="outline" onClick={downloadQRCode} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download QR Code
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={!qrDataUrl}>
            Add to Letter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
