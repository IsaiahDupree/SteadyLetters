'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Calendar, TrendingUp } from 'lucide-react';

export default function BillingPage() {
    const [loading, setLoading] = useState(false);

    // TODO: Fetch real subscription data from user
    const subscription = {
        tier: 'FREE',
        status: 'active',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
    };

    const handleManageBilling = async () => {
        setLoading(true);
        try {
            // Create Stripe Customer Portal session
            const response = await fetch('/api/stripe/portal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: 'default-user' }),
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
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Plan</p>
                                <p className="text-2xl font-bold">{subscription.tier}</p>
                            </div>
                            <Badge variant={subscription.tier === 'FREE' ? 'secondary' : 'default'}>
                                {subscription.status}
                            </Badge>
                        </div>

                        {subscription.currentPeriodEnd && (
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
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Letter Generations</span>
                                <span className="font-medium">0 / 5</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Image Generations</span>
                                <span className="font-medium">0 / 10</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Letters Sent</span>
                                <span className="font-medium">0 / 3</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Voice Transcriptions</span>
                                <span className="font-medium">0 / 5</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Image Analyses</span>
                                <span className="font-medium">0 / 3</span>
                            </div>
                        </div>
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
                                <div className="text-primary">Unlimited</div>
                            </div>
                            <div className="grid grid-cols-4 gap-4 text-sm">
                                <div>Images/month</div>
                                <div>10</div>
                                <div>100</div>
                                <div className="text-primary">Unlimited</div>
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
