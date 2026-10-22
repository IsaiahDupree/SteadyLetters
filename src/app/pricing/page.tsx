import { publicPageMetadata } from '@/lib/public-page-metadata';
import PricingPageClient from './pricing-page-client';

export const metadata = publicPageMetadata({
    title: 'Pricing | SteadyLetters',
    description: 'Compare SteadyLetters plans for creating and sending personalized handwritten letters with AI assistance.',
    path: '/pricing',
});

export default function PricingPage() {
    return <PricingPageClient />;
}
