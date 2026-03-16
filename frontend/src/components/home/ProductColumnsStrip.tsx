'use client';

import Link from 'next/link';

const sections = [
  {
    title: 'Discount Products',
    items: [
      'Headphones Wireless',
      'Gaming Headphone',
      'Galaxy Android Tablet',
    ],
  },
  {
    title: 'Featured Products',
    items: [
      'Headphone with Mic',
      'iPhone 14 Pro',
      'Apple iPad Air',
    ],
  },
  {
    title: 'Selling Products',
    items: [
      'Gaming Headphone',
      'Headphones Wireless',
      'Headphone with Mic',
    ],
  },
];

export function ProductColumnsStrip() {
  return (
    <section className="border-b border-[var(--border)] bg-[var(--cream)] py-12 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {sections.map((section) => (
            <article key={section.title} className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <h3 className="font-display text-xl font-semibold text-[var(--navy)]">{section.title}</h3>
              <div className="mt-4 space-y-3">
                {section.items.map((item) => (
                  <Link
                    key={item}
                    href="/"
                    className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3 text-sm transition-premium hover:border-[var(--accent)] hover:bg-[var(--cream)]"
                  >
                    <span className="text-[var(--navy)]">{item}</span>
                    <span className="font-semibold text-[var(--accent)]">$99</span>
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
