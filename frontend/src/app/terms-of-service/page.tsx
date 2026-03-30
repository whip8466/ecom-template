import type { Metadata } from 'next';
import { SitePageView } from '@/components/site-page-view';
import { getSitePage } from '@/lib/site-pages-server';

export const metadata: Metadata = {
  title: 'Terms of Service | Dhidi',
  description: 'Terms and conditions for using Dhidi.',
};

export default async function TermsOfServicePage() {
  const page = await getSitePage('terms-of-service');
  return <SitePageView page={page} fallbackTitle="Terms of Service" />;
}
