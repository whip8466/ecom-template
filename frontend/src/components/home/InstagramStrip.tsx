'use client';

const images = [
  'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=300&q=80',
  'https://images.unsplash.com/photo-1511556820780-d912e42b4980?w=300&q=80',
  'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=300&q=80',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80',
  'https://images.unsplash.com/photo-1518444065439-e933c06ce9cd?w=300&q=80',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80',
];

export function InstagramStrip() {
  return (
    <section className="border-b border-[var(--border)] bg-[var(--card-bg)] py-10">
      <div className="mx-auto grid max-w-7xl grid-cols-3 gap-3 px-4 sm:grid-cols-6 sm:px-6 lg:px-8">
        {images.map((src, i) => (
          <a
            key={i}
            href="#"
            className="group block aspect-square overflow-hidden rounded-xl border border-[var(--border)]"
          >
            <div
              className="h-full w-full bg-cover bg-center transition-premium group-hover:scale-105"
              style={{ backgroundImage: `url(${src})` }}
            />
          </a>
        ))}
      </div>
    </section>
  );
}
