'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, PieChart, DollarSign, Package, Calendar } from 'lucide-react';

interface AnalyticsData {
    totalSpent: number;
    monthlySpent: number;
    averageCost: number;
    mostUsedProduct: string;
    productBreakdown: { type: string; count: number; cost: number }[];
    monthlyTrend: { month: string; amount: number }[];
}

export function OrderAnalytics() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const response = await fetch('/api/analytics/orders');
            if (response.ok) {
                const analytics = await response.json();
                setData(analytics);
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="animate-pulse">
                            <div className="h-4 bg-muted rounded w-1/2" />
                        </CardHeader>
                        <CardContent className="animate-pulse">
                            <div className="h-8 bg-muted rounded w-3/4" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (!data) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">No analytics data available</p>
                </CardContent>
            </Card>
        );
    }

    const maxProductCount = Math.max(...data.productBreakdown.map(p => p.count), 1);
    const maxMonthlyAmount = Math.max(...data.monthlyTrend.map(m => m.amount), 1);

    return (
        <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">This Month</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${data.monthlySpent.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Spent this month</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Cost</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${data.averageCost.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Per letter</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Most Used</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold capitalize">
                            {data.mostUsedProduct.replace('_', ' ')}
                        </div>
                        <p className="text-xs text-muted-foreground">Product type</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${data.totalSpent.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">All time</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Product Type Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart className="h-5 w-5" />
                            Product Type Breakdown
                        </CardTitle>
                        <CardDescription>Orders by product type</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.productBreakdown.map((product, index) => {
                                const percentage = (product.count / maxProductCount) * 100;
                                const colors = [
                                    'bg-blue-500',
                                    'bg-violet-500',
                                    'bg-purple-500',
                                    'bg-pink-500',
                                    'bg-indigo-500',
                                ];
                                const color = colors[index % colors.length];

                                return (
                                    <div key={product.type} className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium capitalize">
                                                {product.type.replace('_', ' ')}
                                            </span>
                                            <div className="flex items-center gap-4">
                                                <span className="text-muted-foreground">
                                                    {product.count} orders
                                                </span>
                                                <span className="font-bold">${product.cost.toFixed(2)}</span>
                                            </div>
                                        </div>
                                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${color} transition-all duration-500`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Monthly Spending Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Spending Trend
                        </CardTitle>
                        <CardDescription>Last 6 months</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.monthlyTrend.map((month, index) => {
                                const height = (month.amount / maxMonthlyAmount) * 100;
                                const isCurrentMonth = index === data.monthlyTrend.length - 1;

                                return (
                                    <div key={month.month} className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className={isCurrentMonth ? 'font-bold' : 'text-muted-foreground'}>
                                                {month.month}
                                            </span>
                                            <span className={isCurrentMonth ? 'font-bold' : ''}>
                                                ${month.amount.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="h-8 w-full bg-muted rounded overflow-hidden">
                                            <div
                                                className={`h-full ${isCurrentMonth
                                                        ? 'bg-gradient-to-r from-primary to-violet-600'
                                                        : 'bg-primary/60'
                                                    } transition-all duration-500`}
                                                style={{ width: `${height}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
