'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { Textarea } from '@/components/ui/textarea';
import { HandwritingStyleSelector } from '@/components/handwriting-style-selector';
import { createTemplate } from '@/app/actions/templates';

export function TemplateForm() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedStyle, setSelectedStyle] = useState('1'); // Default to style ID '1'
    const router = useRouter();
    const searchParams = useSearchParams();

    // Pre-fill form from URL params if available
    useEffect(() => {
        if (searchParams.get('generated') === 'true') {
            const handwriting = searchParams.get('handwriting');
            if (handwriting) {
                setSelectedStyle(handwriting);
            }

            setOpen(true);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name') as string,
            frontImageUrl: formData.get('image') as string,
            message: formData.get('message') as string,
            handwritingStyle: selectedStyle,
        };

        const result = await createTemplate(data);

        if (result.success) {
            setOpen(false);
            setSelectedStyle('');
            // Clear query params after saving
            router.push('/templates');
            router.refresh();
        } else {
            alert(result.error);
        }

        setLoading(false);
    };

    const initialMessage = searchParams.get('content') || '';
    const initialImage = searchParams.get('frontImage') || searchParams.get('image') || '';
    const initialName = searchParams.get('occasion') ? `${searchParams.get('occasion')} Letter` : '';

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Create Template</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Create Template</DialogTitle>
                    <DialogDescription>
                        Design a new card template.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                name="name"
                                id="name"
                                className="col-span-3"
                                required
                                defaultValue={initialName}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="image" className="text-right">
                                Front Image URL
                            </Label>
                            <Input
                                name="image"
                                id="image"
                                className="col-span-3"
                                placeholder="https://..."
                                defaultValue={initialImage}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">
                                Handwriting
                            </Label>
                            <div className="col-span-3">
                                <HandwritingStyleSelector
                                    value={selectedStyle}
                                    onValueChange={setSelectedStyle}
                                    label=""
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="message" className="text-right pt-2">
                                Message
                            </Label>
                            <Textarea
                                name="message"
                                id="message"
                                className="col-span-3"
                                placeholder="Hello {{name}}, ..."
                                rows={5}
                                required
                                defaultValue={initialMessage}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading || !selectedStyle}>
                            {loading ? 'Saving...' : 'Save Template'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
