import { Suspense } from 'react';
import type { Metadata } from 'next';
import { LandingPageContent } from '@/components/landing-page-content';
import { SITE_URL } from '@/lib/site-url';

export const metadata: Metadata = {
  title: 'Create and Mail Handwritten Letters | SteadyLetters',
  description:
    'Turn text, voice, or an image into an AI-assisted handwritten letter, then mail the printed letter with SteadyLetters.',
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: 'Create and Mail Handwritten Letters | SteadyLetters',
    description:
      'Turn text, voice, or an image into an AI-assisted handwritten letter, then mail the printed letter with SteadyLetters.',
    url: SITE_URL,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Create and Mail Handwritten Letters | SteadyLetters',
    description:
      'Turn text, voice, or an image into an AI-assisted handwritten letter, then mail the printed letter with SteadyLetters.',
  },
};

const homePageStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'SteadyLetters',
      url: SITE_URL,
      logo: new URL('/logo.png', SITE_URL).href,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: 'SteadyLetters',
      url: SITE_URL,
      publisher: { '@id': `${SITE_URL}/#organization` },
      description:
        'An online service for creating AI-assisted handwritten letters and mailing printed letters.',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#software`,
      name: 'SteadyLetters',
      url: SITE_URL,
      description:
        'Create a letter from text, voice, or an image, then send a printed handwritten letter by mail.',
      provider: { '@id': `${SITE_URL}/#organization` },
      featureList: [
        'Voice-to-letter transcription and writing',
        'Image-inspired card designs',
        'AI-assisted letter writing',
        'Printed letter delivery by mail',
      ],
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homePageStructuredData).replace(/</g, '\\u003c'),
        }}
      />
      <Suspense fallback={<div>Loading...</div>}>
        <LandingPageContent />
      </Suspense>
    </>
  );
}
