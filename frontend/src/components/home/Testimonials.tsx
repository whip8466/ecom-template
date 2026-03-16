'use client';

const testimonials = [
  {
    quote: 'The quality and attention to detail are exceptional. I keep coming back for more.',
    author: 'Sarah M.',
    role: 'Lifestyle blogger',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
    rating: 5,
  },
  {
    quote: 'Finally, a store that gets it. Beautiful pieces that last. Highly recommend.',
    author: 'James K.',
    role: 'Interior designer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
    rating: 5,
  },
  {
    quote: 'From packaging to product—everything feels premium. Worth every penny.',
    author: 'Elena V.',
    role: 'Fashion enthusiast',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80',
    rating: 5,
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5 text-[var(--accent)]" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className="h-4 w-4" fill={i < count ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="border-b border-[var(--border)] bg-[var(--card-bg)] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
          Testimonials
        </p>
        <h2 className="mt-2 text-center font-display text-3xl font-semibold text-[var(--navy)] sm:text-4xl">
          Loved by thousands
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <blockquote
              key={i}
              className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--cream)] p-8 transition-premium hover:shadow-[var(--shadow)]"
            >
              <StarRating count={t.rating} />
              <p className="mt-4 flex-1 text-[var(--navy)]">&ldquo;{t.quote}&rdquo;</p>
              <footer className="mt-6 flex items-center gap-4">
                <div
                  className="h-12 w-12 flex-shrink-0 rounded-full bg-[var(--border)] bg-cover bg-center"
                  style={{ backgroundImage: `url(${t.avatar})` }}
                />
                <div>
                  <cite className="not-italic font-semibold text-[var(--navy)]">{t.author}</cite>
                  <p className="text-sm text-[var(--muted)]">{t.role}</p>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
