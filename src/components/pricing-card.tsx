'use client';

import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { STRIPE_PLANS } from '@/lib/pricing-tiers';

interface PricingCardProps {
    tier: 'FREE' | 'PRO' | 'BUSINESS';
    highlighted?: boolean;
    onSelect: () => void;
}

export function PricingCard({ tier, highlighted = false, onSelect }: PricingCardProps) {
    const plan = STRIPE_PLANS[tier];
    const isFreeTier = tier === 'FREE';

    return (
        <div
            className={`relative rounded-2xl p-8 ${highlighted
                ? 'border-2 border-primary shadow-2xl scale-105'
                : 'border border-border shadow-lg'
                } bg-card transition-all duration-300 hover:shadow-xl`}
        >
            {highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                </div>
            )}

            <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                </div>
            </div>

            <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                    </li>
                ))}
            </ul>

            <Button
                onClick={onSelect}
                variant={highlighted ? 'default' : 'outline'}
                className="w-full"
                disabled={isFreeTier}
            >
                {isFreeTier ? 'Current Plan' : `Get ${plan.name}`}
            </Button>
        </div>
    );
}
