import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getOrderById } from '@/app/actions/orders';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow, format } from 'date-fns';
import { ArrowLeft, Mail, MapPin, Calendar, Package, FileText } from 'lucide-react';
import Link from 'next/link';
import { ReorderButton } from '@/features/orders/reorder-button';

// Force dynamic rendering to prevent static generation errors during build
export const dynamic = 'force-dynamic';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: any) {
                    cookieStore.set(name, value, options);
                },
                remove(name: string, options: any) {
                    cookieStore.delete(name);
                },
            },
        }
    );
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const order = await getOrderById(id);

    if (!order) {
        redirect('/orders');
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'queued': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'processing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'sent': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'delivered': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
            case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    const getStatusDescription = (status: string) => {
        switch (status) {
            case 'pending': return 'Order is being prepared';
            case 'queued': return 'Order is queued for printing';
            case 'processing': return 'Order is being printed and prepared for mailing';
            case 'sent': return 'Order has been sent to the mail carrier';
            case 'delivered': return 'Order has been delivered to the recipient';
            case 'failed': return 'Order failed to process';
            default: return 'Unknown status';
        }
    };

    return (
        <div className="container max-w-4xl py-10 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/orders">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">
                            Order Details
                        </h1>
                        <p className="text-muted-foreground">
                            View order information and status
                        </p>
                    </div>
                </div>
                <ReorderButton order={order} />
            </div>

            {/* Status Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Order Status</CardTitle>
                            <CardDescription>
                                {order.thanksIoOrderId && `Order #${order.thanksIoOrderId.substring(0, 12)}`}
                            </CardDescription>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                            {order.status}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        {getStatusDescription(order.status)}
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-sm font-medium">Created</p>
                                <p className="text-sm text-muted-foreground">
                                    {format(order.createdAt, 'PPP')}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(order.createdAt, { addSuffix: true })}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-sm font-medium">Last Updated</p>
                                <p className="text-sm text-muted-foreground">
                                    {format(order.updatedAt, 'PPP')}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(order.updatedAt, { addSuffix: true })}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Recipient Card */}
            {order.recipient && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-muted-foreground" />
                            <CardTitle>Recipient</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <p className="font-medium">{order.recipient.name}</p>
                            <div className="text-sm text-muted-foreground space-y-1">
                                <p>{order.recipient.address1}</p>
                                {order.recipient.address2 && <p>{order.recipient.address2}</p>}
                                <p>
                                    {order.recipient.city}, {order.recipient.state} {order.recipient.zip}
                                </p>
                                <p>{order.recipient.country}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Template Card */}
            {order.template && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <CardTitle>Template Used</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <p className="font-medium">{order.template.name}</p>
                            {order.template.message && (
                                <div className="rounded-lg bg-muted p-4 mt-3">
                                    <p className="text-sm whitespace-pre-wrap">{order.template.message}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Order ID Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <CardTitle>Order Information</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Internal Order ID:</span>
                            <span className="font-mono">{order.id}</span>
                        </div>
                        {order.thanksIoOrderId && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Thanks.io Order ID:</span>
                                <span className="font-mono">{order.thanksIoOrderId}</span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
