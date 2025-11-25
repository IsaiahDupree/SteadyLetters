'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, Loader2, Camera, CheckCircle2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createRecipient } from '@/app/actions/recipients';
import { useRouter } from 'next/navigation';

interface ExtractedAddress {
    name?: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
}

export function AddressExtractor() {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractedAddress, setExtractedAddress] = useState<ExtractedAddress | null>(null);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState<ExtractedAddress>({});
    const router = useRouter();

    const handleFileSelect = useCallback((file: File | null) => {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (20MB max)
        if (file.size > 20 * 1024 * 1024) {
            alert('Image too large. Maximum size is 20MB.');
            return;
        }

        setImageFile(file);
        setExtractedAddress(null);

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        handleFileSelect(file);
    }, [handleFileSelect]);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    }, []);

    const handleExtract = async () => {
        if (!imageFile) return;

        setIsExtracting(true);

        try {
            const formData = new FormData();
            formData.append('image', imageFile);

            const response = await fetch('/api/extract-address', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Extraction failed');
            }

            if (data.address) {
                setExtractedAddress(data.address);
                setFormData(data.address);
                setShowAddDialog(true);
            } else {
                alert(data.message || 'No return address found in the image. Please try a different image.');
            }
        } catch (error: any) {
            console.error('Address extraction error:', error);
            alert(error.message || 'Failed to extract address. Please try again.');
        } finally {
            setIsExtracting(false);
        }
    };

    const handleAddRecipient = async () => {
        if (!extractedAddress || !extractedAddress.address1 || !extractedAddress.city || !extractedAddress.state || !extractedAddress.zip) {
            alert('Please fill in all required fields (Address, City, State, ZIP)');
            return;
        }

        setIsAdding(true);

        try {
            const result = await createRecipient({
                name: formData.name || 'Unknown',
                address1: formData.address1 || '',
                address2: formData.address2,
                city: formData.city || '',
                state: formData.state || '',
                zip: formData.zip || '',
                country: formData.country || 'US',
            });

            if (result.success) {
                setShowAddDialog(false);
                setImageFile(null);
                setImagePreview('');
                setExtractedAddress(null);
                router.refresh();
            } else {
                alert(result.error || 'Failed to add recipient');
            }
        } catch (error: any) {
            console.error('Failed to add recipient:', error);
            alert(error.message || 'Failed to add recipient');
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemove = () => {
        setImageFile(null);
        setImagePreview('');
        setExtractedAddress(null);
    };

    return (
        <>
            <Card className="border-dashed">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5" />
                        Take Photo & Add Recipient
                    </CardTitle>
                    <CardDescription>
                        Take a photo of a letter you received to automatically extract the return address
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!imageFile ? (
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            className="flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                            onClick={() => document.getElementById('address-photo-upload')?.click()}
                        >
                            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-sm font-medium mb-1">
                                Drop an image here or click to upload
                            </p>
                            <p className="text-xs text-muted-foreground">
                                PNG, JPG, WEBP, GIF up to 20MB
                            </p>
                            <input
                                id="address-photo-upload"
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                                className="hidden"
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="relative">
                                {imagePreview && (
                                    <img
                                        src={imagePreview}
                                        alt="Uploaded letter"
                                        className="w-full h-64 object-contain rounded-lg border bg-muted"
                                    />
                                )}
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2"
                                    onClick={handleRemove}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            {!extractedAddress && !isExtracting && (
                                <Button onClick={handleExtract} className="w-full">
                                    <Camera className="h-4 w-4 mr-2" />
                                    Extract Return Address
                                </Button>
                            )}

                            {isExtracting && (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                                    <span className="text-sm text-muted-foreground">
                                        Extracting address from image...
                                    </span>
                                </div>
                            )}

                            {extractedAddress && !showAddDialog && (
                                <div className="rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                                        <CheckCircle2 className="h-5 w-5" />
                                        <p className="text-sm font-medium">Return address found!</p>
                                    </div>
                                    <div className="text-sm text-muted-foreground space-y-1">
                                        {extractedAddress.name && <p><strong>Name:</strong> {extractedAddress.name}</p>}
                                        {extractedAddress.address1 && <p><strong>Address:</strong> {extractedAddress.address1}</p>}
                                        {extractedAddress.address2 && <p>{extractedAddress.address2}</p>}
                                        {extractedAddress.city && extractedAddress.state && (
                                            <p>{extractedAddress.city}, {extractedAddress.state} {extractedAddress.zip}</p>
                                        )}
                                    </div>
                                    <Button
                                        onClick={() => setShowAddDialog(true)}
                                        className="w-full mt-2"
                                    >
                                        Add as Recipient
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Add Recipient</DialogTitle>
                        <DialogDescription>
                            We found this return address. Review and add it as a recipient.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={formData.name || ''}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="col-span-3"
                                placeholder="Full name or organization"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="address1" className="text-right">
                                Address 1
                            </Label>
                            <Input
                                id="address1"
                                value={formData.address1 || ''}
                                onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="address2" className="text-right">
                                Address 2
                            </Label>
                            <Input
                                id="address2"
                                value={formData.address2 || ''}
                                onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="city" className="text-right">
                                City
                            </Label>
                            <Input
                                id="city"
                                value={formData.city || ''}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="state" className="text-right">
                                State
                            </Label>
                            <Input
                                id="state"
                                value={formData.state || ''}
                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                className="col-span-3"
                                required
                                maxLength={2}
                                placeholder="CA"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="zip" className="text-right">
                                ZIP
                            </Label>
                            <Input
                                id="zip"
                                value={formData.zip || ''}
                                onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                                className="col-span-3"
                                required
                                placeholder="90210"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowAddDialog(false)}
                            disabled={isAdding}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleAddRecipient} disabled={isAdding}>
                            {isAdding ? 'Adding...' : 'Add Recipient'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

