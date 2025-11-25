'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { createTemplate } from '@/app/actions/templates';

// Mock styles for now - we'll fetch these from Thanks.io later
const handwritingStyles = [
    { id: '1', name: 'Casual Script' },
    { id: '2', name: 'Formal Cursive' },
    { id: '3', name: 'Architect' },
];

export function TemplateForm() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedStyle, setSelectedStyle] = useState('');
    const router = useRouter();

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
            router.refresh();
        } else {
            alert(result.error);
        }

        setLoading(false);
    };

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
                            <Input name="name" id="name" className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="image" className="text-right">
                                Front Image URL
                            </Label>
                            <Input name="image" id="image" className="col-span-3" placeholder="https://..." />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="style" className="text-right">
                                Handwriting
                            </Label>
                            <Select value={selectedStyle} onValueChange={setSelectedStyle} required>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select a style" />
                                </SelectTrigger>
                                <SelectContent>
                                    {handwritingStyles.map((style) => (
                                        <SelectItem key={style.id} value={style.name}>
                                            {style.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
