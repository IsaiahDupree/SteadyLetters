'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Package, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Order {
    id: string;
    status: string;
    createdAt: string;
    recipientName: string;
    trackingNumber?: string;
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // TODO: Fetch real orders from Thanks.io API
        // Mock data for now
        const mockOrders: Order[] = [
            {
                id: '1',
                status: 'delivered',
                createdAt: new Date().toISOString(),
                recipientName: 'John Doe',
                trackingNumber: 'USPS1234567890',
            },
        ];

        setOrders(mockOrders);
        setLoading(false);
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'delivered':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'in_transit':
                return <Package className="h-5 w-5 text-blue-500" />;
            case 'processing':
                return <Clock className="h-5 w-5 text-yellow-500" />;
            default:
                return <XCircle className="h-5 w-5 text-red-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
            delivered: 'default',
            in_transit: 'secondary',
            processing: 'secondary',
            failed: 'destructive',
        };

        return <Badge variant={variants[status] || 'secondary'}>{status.replace('_', ' ')}</Badge>;
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <p>Loading orders...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Order History</h1>

            {orders.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No orders yet</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Send your first letter to see it here
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <Card key={order.id}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {getStatusIcon(order.status)}
                                        <div>
                                            <CardTitle>Letter to {order.recipientName}</CardTitle>
                                            <CardDescription className="flex items-center gap-2 mt-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    {getStatusBadge(order.status)}
                                </div>
                            </CardHeader>
                            {order.trackingNumber && (
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Tracking: <span className="font-mono">{order.trackingNumber}</span>
                                    </p>
                                </CardContent>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
