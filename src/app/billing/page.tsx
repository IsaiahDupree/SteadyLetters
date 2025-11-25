'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Calendar, TrendingUp, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { UsageItem } from '@/components/usage-item';

interface UsageStats {
    letterGenerations: { used: number; limit: number; percentage: number };
    imageGenerations: { used: number; limit: number; percentage: number };
    lettersSent: { used: number; limit: number; percentage: number };
    voiceTranscriptions: { used: number; limit: number; percentage: number };
    imageAnalyses: { used: number; limit: number; percentage: number };
}

export default function BillingPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [subscription, setSubscription] = useState({
        tier: 'FREE',
        status: 'free',
        currentPeriodEnd: null as Date | null,
        stripePriceId: null as string | null,
    });
    const [usage, setUsage] = useState<UsageStats | null>(null);
    const [resetAt, setResetAt] = useState<Date | null>(null);

    useEffect(() => {
        if (user) {
            fetchUsageData();
        } else {
            setLoadingData(false);
        }
    }, [user]);

    const fetchUsageData = async () => {
        try {
            const response = await fetch('/api/billing/usage');
            if (response.ok) {
                const data = await response.json();

                // Map API response to state
                setSubscription({
                    tier: data.subscription.tier,
                    status: data.subscription.status,
                    currentPeriodEnd: data.subscription.currentPeriodEnd 
                        ? new Date(data.subscription.currentPeriodEnd) 
                        : null,
                    stripePriceId: data.subscription.stripePriceId,
                });

                setUsage(data.usage);
                setResetAt(data.resetAt ? new Date(data.resetAt) : null);
            }
        } catch (error) {
            console.error('Failed to fetch usage data:', error);
        } finally {
            setLoadingData(false);
        }
    };

    const handleManageBilling = async () => {
        if (!user) {
            window.location.href = '/login';
            return;
        }

        setLoading(true);
        try {
            // Create Stripe Customer Portal session
            const response = await fetch('/api/stripe/portal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await response.json();

            if (response.ok) {
                window.location.href = data.url;
            } else {
                alert(data.error || 'Failed to open billing portal');
            }
        } catch (error) {
            console.error('Billing portal error:', error);
            alert('Failed to open billing portal');
        } finally {
            setLoading(false);
        }
    };

    const formatLimit = (limit: number) => {
        return limit === -1 ? 'Unlimited' : limit.toString();
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Billing & Subscription</h1>

            <div className="grid gap-6 max-w-4xl">
                {/* Current Plan */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Current Plan
                        </CardTitle>
                        <CardDescription>Manage your subscription and billing</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {loadingData ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Plan</p>
                                        <p className="text-2xl font-bold">{subscription.tier}</p>
                                    </div>
                                    <Badge variant={subscription.tier === 'FREE' ? 'secondary' : 'default'}>
                                        {subscription.status}
                                    </Badge>
                                </div>
                            </>
                        )}

                        {!loadingData && subscription.currentPeriodEnd && (
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">
                                    <Calendar className="h-4 w-4 inline mr-1" />
                                    Next billing date
                                </p>
                                <p className="font-medium">
                                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                                </p>
                            </div>
                        )}

                        {!loadingData && resetAt && (
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">
                                    Usage resets on
                                </p>
                                <p className="font-medium">
                                    {resetAt.toLocaleDateString()}
                                </p>
                            </div>
                        )}

                        {subscription.tier !== 'FREE' && (
                            <div className="pt-4 border-t">
                                <Button onClick={handleManageBilling} disabled={loading} className="w-full">
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Manage Billing
                                </Button>
                                <p className="text-xs text-muted-foreground mt-2 text-center">
                                    Update payment method, view invoices, or cancel subscription
                                </p>
                            </div>
                        )}

                        {subscription.tier === 'FREE' && (
                            <div className="pt-4 border-t">
                                <Button asChild className="w-full">
                                    <a href="/pricing">Upgrade Plan</a>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Usage Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle>Usage This Month</CardTitle>
                        <CardDescription>Your current usage across all features</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loadingData ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : usage ? (
                            <div className="space-y-4">
                                <UsageItem
                                    label="Letter Generations"
                                    used={usage.letterGenerations.used}
                                    limit={usage.letterGenerations.limit}
                                    percentage={usage.letterGenerations.percentage}
                                />
                                <UsageItem
                                    label="Image Generations"
                                    used={usage.imageGenerations.used}
                                    limit={usage.imageGenerations.limit}
                                    percentage={usage.imageGenerations.percentage}
                                />
                                <UsageItem
                                    label="Letters Sent"
                                    used={usage.lettersSent.used}
                                    limit={usage.lettersSent.limit}
                                    percentage={usage.lettersSent.percentage}
                                />
                                <UsageItem
                                    label="Voice Transcriptions"
                                    used={usage.voiceTranscriptions.used}
                                    limit={usage.voiceTranscriptions.limit}
                                    percentage={usage.voiceTranscriptions.percentage}
                                />
                                <UsageItem
                                    label="Image Analyses"
                                    used={usage.imageAnalyses.used}
                                    limit={usage.imageAnalyses.limit}
                                    percentage={usage.imageAnalyses.percentage}
                                />
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No usage data available</p>
                        )}
                    </CardContent>
                </Card>

            {/* Plan Comparison */}
            <Card>
                <CardHeader>
                    <CardTitle>Compare Plans</CardTitle>
                    <CardDescription>See what's available at each tier</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="grid grid-cols-4 gap-4 pb-2 border-b font-semibold text-sm">
                            <div>Feature</div>
                            <div>Free</div>
                            <div>Pro</div>
                            <div>Business</div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>Letters/month</div>
                            <div>5</div>
                            <div>50</div>
                            <div className="text-primary">200</div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>Images/month</div>
                            <div>10</div>
                            <div>100</div>
                            <div className="text-primary">400</div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>Letters Sent/month</div>
                            <div>3</div>
                            <div>10</div>
                            <div className="text-primary">50</div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>Support</div>
                            <div>Community</div>
                            <div>Email</div>
                            <div className="text-primary">Priority</div>
                        </div>
                    </div>
                    <Button asChild variant="outline" className="w-full mt-6">
                        <a href="/pricing">View Full Pricing</a>
                    </Button>
                </CardContent>
            </Card>
            </div>
        </div>
    );
}
