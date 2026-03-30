import type { Metadata } from 'next';
import { SitePageView } from '@/components/site-page-view';
import { getSitePage } from '@/lib/site-pages-server';

export const metadata: Metadata = {
  title: 'Privacy Policy | Dhidi',
  description: 'How we handle your data.',
};

export default async function PrivacyPolicyPage() {
  const page = await getSitePage('privacy-policy');
  return <SitePageView page={page} fallbackTitle="Privacy Policy" />;
}
