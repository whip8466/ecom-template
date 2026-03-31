import { Suspense } from 'react';
import type { Metadata } from 'next';
import { FaqClient } from '@/app/faq/faq-client';

export const metadata: Metadata = {
  title: 'FAQ | Dhidi',
  description: 'Frequently asked questions about shopping, orders, and more.',
};

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:pt-8">
      <Suspense
        fallback={
          <div className="py-20 text-center text-sm text-[var(--muted)]">Loading…</div>
        }
      >
        <FaqClient />
      </Suspense>
    </div>
  );
}
