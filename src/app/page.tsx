import { Suspense } from 'react';
import { LandingPageContent } from '@/components/landing-page-content';

export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LandingPageContent />
    </Suspense>
  );
}
