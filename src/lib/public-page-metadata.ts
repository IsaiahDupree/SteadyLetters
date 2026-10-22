import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site-url';

type PublicPageMetadataInput = {
  title: string;
  description: string;
  path: string;
};

const SOCIAL_IMAGE = {
  url: `${SITE_URL}/logo.png`,
  width: 1200,
  height: 630,
  alt: 'SteadyLetters',
};

/** Keep public page canonicals and share metadata tied to the same URL. */
export function publicPageMetadata({
  title,
  description,
  path,
}: PublicPageMetadataInput): Metadata {
  const canonical = new URL(path, SITE_URL).toString();

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      siteName: 'SteadyLetters',
      title,
      description,
      url: canonical,
      images: [SOCIAL_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [SOCIAL_IMAGE.url],
    },
  };
}
