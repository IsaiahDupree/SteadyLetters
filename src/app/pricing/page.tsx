import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site-url';
import PricingPageClient from './pricing-page-client';

export const metadata: Metadata = {
    title: 'Pricing | SteadyLetters',
    description: 'Compare SteadyLetters plans for creating and sending personalized handwritten letters with AI assistance.',
    alternates: { canonical: `${SITE_URL}/pricing` },
};

export default function PricingPage() {
    return <PricingPageClient />;
}
