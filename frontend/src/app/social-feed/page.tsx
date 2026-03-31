import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SocialFeedClient } from '@/app/social-feed/social-feed-client';

export const metadata: Metadata = {
  title: 'Social Feed | Dhidi',
  description:
    'Our journey in handmade products—videos, reels, stories, and tips from our community.',
};

export default function SocialFeedPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:pt-8">
      <Suspense
        fallback={
          <div className="py-20 text-center text-sm text-[var(--muted)]">Loading…</div>
        }
      >
        <SocialFeedClient />
      </Suspense>
    </div>
  );
}
