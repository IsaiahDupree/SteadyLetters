'use client';

import { useState } from 'react';
import { PricingCard } from '@/components/pricing-card';
import { STRIPE_PLANS } from '@/lib/pricing-tiers';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { apiRequest } from '@/lib/api-config';

export default function PricingPage() {
    const [loading, setLoading] = useState<string | null>(null);
    const router = useRouter();
    const { user } = useAuth();

    const handleSelectPlan = async (tier: 'PRO' | 'BUSINESS') => {
        // Require authentication for paid plans
        if (!user) {
            router.push('/login?redirectTo=/pricing');
            return;
        }

        setLoading(tier);

        try {
            const priceId = STRIPE_PLANS[tier].priceId;

            const data = await apiRequest<{ url: string }>('stripe/checkout', {
                method: 'POST',
                body: JSON.stringify({ priceId }),
            });

            // Redirect to Stripe Checkout
            window.location.href = data.url;
        } catch (error) {
            // Only log in development
            if (process.env.NODE_ENV === 'development') {
                console.error('Checkout error:', error);
            }
            alert('Failed to start checkout. Please try again.');
            setLoading(null);
        }
    };

    return (
        <div className="container mx-auto px-4 py-16">
            <div className="text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                    Choose Your Plan
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Start free and upgrade as you grow. All plans include our core AI features.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
                <PricingCard
                    tier="FREE"
                    onSelect={() => router.push('/dashboard')}
                />
                <PricingCard
                    tier="PRO"
                    highlighted
                    onSelect={() => handleSelectPlan('PRO')}
                />
                <PricingCard
                    tier="BUSINESS"
                    onSelect={() => handleSelectPlan('BUSINESS')}
                />
            </div>

            {/* FAQ Section */}
            <div className="max-w-3xl mx-auto mt-20">
                <h2 className="text-3xl font-bold text-center mb-12">
                    Frequently Asked Questions
                </h2>
                <div className="space-y-6">
                    <div>
                        <h3 className="font-semibold text-lg mb-2">Can I change my plan later?</h3>
                        <p className="text-muted-foreground">
                            Yes! You can upgrade or downgrade your plan at any time from your billing settings.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg mb-2">What payment methods do you accept?</h3>
                        <p className="text-muted-foreground">
                            We accept all major credit cards through our secure payment processor, Stripe.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg mb-2">Can I cancel anytime?</h3>
                        <p className="text-muted-foreground">
                            Absolutely. There are no long-term contracts. You can cancel your subscription at any time.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg mb-2">Do you offer refunds?</h3>
                        <p className="text-muted-foreground">
                            We offer a 30-day money-back guarantee. If you're not satisfied, contact us for a full refund.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
