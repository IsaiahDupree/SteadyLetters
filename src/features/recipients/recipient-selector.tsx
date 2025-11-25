'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, User, MapPin, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Recipient {
    id: string;
    name: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
}

interface RecipientSelectorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (recipients: Recipient[]) => void;
    loading?: boolean;
}

export function RecipientSelector({
    open,
    onOpenChange,
    onConfirm,
    loading = false,
}: RecipientSelectorProps) {
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingRecipients, setLoadingRecipients] = useState(false);

    // Fetch recipients when dialog opens
    useEffect(() => {
        if (open) {
            fetchRecipients();
        }
    }, [open]);

    const fetchRecipients = async () => {
        setLoadingRecipients(true);
        try {
            const response = await fetch('/api/recipients');
            if (response.ok) {
                const data = await response.json();
                setRecipients(data.recipients || []);
            }
        } catch (error) {
            console.error('Failed to fetch recipients:', error);
        } finally {
            setLoadingRecipients(false);
        }
    };

    const filteredRecipients = recipients.filter((recipient) => {
        const query = searchQuery.toLowerCase();
        return (
            recipient.name.toLowerCase().includes(query) ||
            recipient.address1.toLowerCase().includes(query) ||
            recipient.city.toLowerCase().includes(query) ||
            recipient.state.toLowerCase().includes(query) ||
            recipient.zip.includes(query)
        );
    });

    const toggleRecipient = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const selectAll = () => {
        if (selectedIds.size === filteredRecipients.length && filteredRecipients.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredRecipients.map(r => r.id)));
        }
    };

    const handleConfirm = () => {
        const selectedRecipients = recipients.filter(r => selectedIds.has(r.id));
        onConfirm(selectedRecipients);
        setSelectedIds(new Set()); // Reset selection
    };

    const allSelected = filteredRecipients.length > 0 && selectedIds.size === filteredRecipients.length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Select Recipients</DialogTitle>
                    <DialogDescription>
                        Choose one or more recipients to send your letter to
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, address, city..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    {/* Select All */}
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="select-all"
                                checked={allSelected}
                                onCheckedChange={selectAll}
                            />
                            <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                                Select All ({filteredRecipients.length} recipients)
                            </Label>
                        </div>
                        {selectedIds.size > 0 && (
                            <span className="text-sm text-muted-foreground">
                                {selectedIds.size} selected
                            </span>
                        )}
                    </div>

                    {/* Recipient List */}
                    <ScrollArea className="h-[300px] border rounded-lg">
                        {loadingRecipients ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    <span>Loading recipients...</span>
                                </div>
                            </div>
                        ) : filteredRecipients.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                                <User className="h-12 w-12 text-muted-foreground mb-3" />
                                <p className="text-sm font-medium">No recipients found</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {searchQuery ? 'Try a different search term' : 'Add recipients to get started'}
                                </p>
                            </div>
                        ) : (
                            <div className="p-2 space-y-1">
                                {filteredRecipients.map((recipient) => {
                                    const isSelected = selectedIds.has(recipient.id);
                                    return (
                                        <button
                                            key={recipient.id}
                                            onClick={() => toggleRecipient(recipient.id)}
                                            className={cn(
                                                'w-full p-3 rounded-lg border-2 transition-all text-left',
                                                isSelected
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-transparent hover:border-muted hover:bg-muted/50'
                                            )}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={cn(
                                                    'mt-0.5 flex h-5 w-5 items-center justify-center rounded border-2 transition-all',
                                                    isSelected
                                                        ? 'border-primary bg-primary text-primary-foreground'
                                                        : 'border-muted-foreground/30'
                                                )}>
                                                    {isSelected && <Check className="h-3 w-3" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                        <h4 className="font-medium truncate">{recipient.name}</h4>
                                                    </div>
                                                    <div className="flex items-start gap-2 mt-1">
                                                        <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                                                        <p className="text-xs text-muted-foreground">
                                                            {recipient.address1}
                                                            {recipient.address2 && `, ${recipient.address2}`}
                                                            <br />
                                                            {recipient.city}, {recipient.state} {recipient.zip}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </ScrollArea>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={selectedIds.size === 0 || loading}
                        className="bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90"
                    >
                        {loading ? (
                            <>
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                                Sending...
                            </>
                        ) : (
                            `Send to ${selectedIds.size} Recipient${selectedIds.size !== 1 ? 's' : ''}`
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
