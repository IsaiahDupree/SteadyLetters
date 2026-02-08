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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { HandwritingStyleSelector } from '@/components/handwriting-style-selector';
import { HOLIDAY_TEMPLATES } from '@/lib/holiday-templates';
import { createHolidayTemplates } from '@/app/actions/templates';
import { AlertCircle, Loader2 } from 'lucide-react';

interface HolidayTemplatesGalleryProps {
    onSuccess?: () => void;
}

export function HolidayTemplatesGallery({ onSuccess }: HolidayTemplatesGalleryProps) {
    const [open, setOpen] = useState(false);
    const [selectedStyle, setSelectedStyle] = useState('1');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAddAllTemplates = async () => {
        setLoading(true);
        setError(null);

        const result = await createHolidayTemplates(selectedStyle);

        setLoading(false);

        if (result.success) {
            setOpen(false);
            onSuccess?.();
        } else {
            setError(result.error || 'Failed to add templates');
        }
    };

    return (
        <>
            <Button variant="outline" onClick={() => setOpen(true)}>
                Browse Holiday Templates
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Holiday Template Library</DialogTitle>
                        <DialogDescription>
                            Choose a pre-built template for major holidays and occasions
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        {HOLIDAY_TEMPLATES.map((template) => (
                            <Card key={template.occasion}>
                                <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
                                    {template.frontImageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={template.frontImageUrl}
                                            alt={template.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-muted-foreground">
                                            No Image
                                        </div>
                                    )}
                                </div>
                                <CardHeader>
                                    <CardTitle className="text-lg">{template.name}</CardTitle>
                                    <CardDescription>{template.occasion}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground line-clamp-3">
                                        {template.message}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="border-t pt-4 space-y-4">
                        <div>
                            <Label htmlFor="handwriting-style" className="text-base">
                                Apply Handwriting Style
                            </Label>
                            <p className="text-sm text-muted-foreground mb-2">
                                Select which handwriting style to use for all templates
                            </p>
                            <HandwritingStyleSelector
                                value={selectedStyle}
                                onValueChange={setSelectedStyle}
                                label=""
                            />
                        </div>

                        {error && (
                            <div className="flex gap-2 text-destructive text-sm">
                                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                <p>{error}</p>
                            </div>
                        )}

                        <p className="text-sm text-muted-foreground">
                            Adding all {HOLIDAY_TEMPLATES.length} templates to your library. You can edit or delete any of them later.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddAllTemplates}
                            disabled={loading || !selectedStyle}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loading ? 'Adding Templates...' : `Add All ${HOLIDAY_TEMPLATES.length} Templates`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
