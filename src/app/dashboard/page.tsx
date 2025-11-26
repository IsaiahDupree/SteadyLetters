import { getDashboardStats } from '../actions/dashboard';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Force dynamic rendering to prevent static generation errors during build
// This page requires database access which isn't available at build time
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const stats = await getDashboardStats();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <Link href="/send">
                    <Button>Send Letter</Button>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Recipients
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.recipientCount}</div>
                        <p className="text-xs text-muted-foreground">
                            People in your address book
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Templates
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.templateCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Card designs ready to use
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Letters Sent
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.orderCount}</div>
                        <p className="text-xs text-muted-foreground">
                            All-time total
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Your latest letter orders</CardDescription>
                </CardHeader>
                <CardContent>
                    {stats.recentOrders.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            No orders yet. Send your first letter!
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Recipient</TableHead>
                                    <TableHead>Template</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stats.recentOrders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell>
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>{order.recipient.name}</TableCell>
                                        <TableCell>{order.template?.name || 'N/A'}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{order.status}</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
