import type { Metadata } from 'next';
import { SitePageView } from '@/components/site-page-view';
import { getSitePage } from '@/lib/site-pages-server';

export const metadata: Metadata = {
  title: 'About Us | Dhidi',
  description: 'Learn more about Dhidi.',
};

export default async function AboutUsPage() {
  const page = await getSitePage('about-us');
  return <SitePageView page={page} fallbackTitle="About Us" />;
}
