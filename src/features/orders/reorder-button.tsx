'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { reorderOrder } from '@/app/actions/orders';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import type { Order, Recipient, Template } from '@prisma/client';

type OrderWithRelations = Order & {
    recipient: Recipient | null;
    template: Template | null;
};

export function ReorderButton({ order }: { order: OrderWithRelations }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleReorder = async () => {
        if (!order.recipient) {
            toast.error('Cannot reorder: recipient information is missing');
            return;
        }

        setIsLoading(true);

        try {
            const result = await reorderOrder(order.id);

            if (result.success) {
                toast.success('Order successfully resubmitted!', {
                    description: `Order ${result.thanksIoId?.substring(0, 12) || ''} has been queued for sending.`,
                    icon: <Check className="h-4 w-4" />,
                });
                setIsOpen(false);
                router.push('/orders');
                router.refresh();
            } else {
                toast.error('Failed to reorder', {
                    description: result.error || 'An unknown error occurred',
                });
            }
        } catch (error) {
            console.error('Reorder error:', error);
            toast.error('Failed to reorder', {
                description: 'An unexpected error occurred',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="default" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Reorder
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Reorder</DialogTitle>
                    <DialogDescription>
                        This will create a new order with the same details and send it to{' '}
                        <span className="font-semibold">{order.recipient?.name}</span>.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-4">
                    <div className="rounded-lg bg-muted p-4">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Recipient:</span>
                                <span className="font-medium">{order.recipient?.name}</span>
                            </div>
                            {order.template && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Template:</span>
                                    <span className="font-medium">{order.template.name}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Original Order:</span>
                                <span className="font-mono text-xs">{order.id.substring(0, 8)}</span>
                            </div>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        A new order will be created and will count against your monthly sending limit.
                    </p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleReorder} disabled={isLoading}>
                        {isLoading ? 'Reordering...' : 'Confirm Reorder'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
