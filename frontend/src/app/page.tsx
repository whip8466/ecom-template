import Link from 'next/link';

type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: string;
  oldPrice?: string;
  badge?: string;
  image: string;
};

const categoryItems = [
  { name: 'Headphones', count: '12 item', iconLabel: 'HP' },
  { name: 'Smart Watches', count: '08 item', iconLabel: 'SW' },
  { name: 'Speakers', count: '14 item', iconLabel: 'SP' },
  { name: 'Mouse', count: '09 item', iconLabel: 'MS' },
  { name: 'Phones', count: '22 item', iconLabel: 'PH' },
  { name: 'Cameras', count: '05 item', iconLabel: 'CM' },
];

const productCards: ProductCardData[] = [
  { id: '1', slug: 'headphones-wireless', name: 'Headphones Wireless', category: 'Headphone', price: '$249.00', oldPrice: '$289.00', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&q=80', badge: '-15%' },
  { id: '2', slug: 'gaming-headphone', name: 'Gaming Headphone', category: 'Audio', price: '$199.00', oldPrice: '$229.00', image: 'https://images.unsplash.com/photo-1545127398-14699f92334b?w=900&q=80' },
  { id: '3', slug: 'smart-watch-active', name: 'Smart Watch Active', category: 'Watch', price: '$399.00', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900&q=80', badge: 'New' },
  { id: '4', slug: 'cpu-air-cooler', name: 'CPU Air Cooler', category: 'Gaming', price: '$89.00', image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=900&q=80' },
  { id: '5', slug: 'samsung-tab-pro', name: 'Samsung Tab Pro', category: 'Phone', price: '$999.00', oldPrice: '$1099.00', image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=900&q=80', badge: '-10%' },
  { id: '6', slug: 'deepcool-air-cooler', name: 'DeepCool Air Cooler', category: 'Components', price: '$559.00', image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=900&q=80' },
  { id: '7', slug: 'apple-ipad-air', name: 'Apple iPad Air', category: 'Tablet', price: '$699.00', oldPrice: '$749.00', image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=900&q=80' },
  { id: '8', slug: 'bluetooth-earbuds', name: 'Bluetooth Earbuds', category: 'Gaming', price: '$89.00', image: 'https://images.unsplash.com/photo-1622297845775-5ff3fef71d13?w=900&q=80' },
];

const miniProducts = [
  { name: 'Headphone with Mic', slug: 'headphone-with-mic', price: '$99.00', image: 'https://images.unsplash.com/photo-1518444065439-e933c06ce9cd?w=500&q=80' },
  { name: 'Apple iPad Air', slug: 'apple-ipad-air', price: '$899.00', image: 'https://images.unsplash.com/photo-1678652197831-2d180705cd2c?w=500&q=80' },
  { name: 'Gaming Headphones', slug: 'gaming-headphone', price: '$129.00', image: 'https://images.unsplash.com/photo-1612444530582-fc66183b16f7?w=500&q=80' },
];

function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <article className="group rounded-md border border-[#e4ebf4] bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative overflow-hidden rounded-md bg-[#f3f7ff]">
          <div
            className="aspect-square bg-cover bg-center transition duration-300 group-hover:scale-105"
            style={{ backgroundImage: `url(${product.image})` }}
          />
          {product.badge && (
            <span className={`absolute left-2 top-2 rounded px-2 py-0.5 text-[10px] font-semibold text-white ${product.badge === 'New' ? 'bg-[#0989ff]' : 'bg-[#eb5757]'}`}>
              {product.badge}
            </span>
          )}
        </div>
      </Link>
      <p className="mt-3 text-[11px] uppercase tracking-wide text-[#7c8ea6]">{product.category}</p>
      <h3 className="mt-1 text-sm font-semibold text-[#1b2a4e]">
        <Link href={`/products/${product.slug}`} className="hover:text-[#0989ff]">{product.name}</Link>
      </h3>
      <p className="mt-2 text-xs text-[#f5a623]">★★★★★</p>
      <div className="mt-1 flex items-center gap-2 text-sm">
        <span className="font-semibold text-[#0989ff]">{product.price}</span>
        {product.oldPrice && <span className="text-[#7c8ea6] line-through">{product.oldPrice}</span>}
      </div>
    </article>
  );
}

function SmallListCard({ title }: { title: string }) {
  return (
    <article className="rounded-md border border-[#e4ebf4] bg-white p-4">
      <h3 className="text-base font-semibold text-[#1b2a4e]">{title}</h3>
      <div className="mt-4 space-y-3">
        {miniProducts.map((item) => (
          <Link key={`${title}-${item.name}`} href={`/products/${item.slug}`} className="flex items-center gap-3 rounded-md border border-[#edf2f8] p-2 transition hover:bg-[#f7fbff]">
            <div
              className="h-14 w-14 flex-none rounded bg-cover bg-center"
              style={{ backgroundImage: `url(${item.image})` }}
            />
            <div>
              <p className="text-xs text-[#1b2a4e]">{item.name}</p>
              <p className="text-xs font-semibold text-[#0989ff]">{item.price}</p>
            </div>
          </Link>
        ))}
      </div>
    </article>
  );
}

export default function HomePage() {
  return (
    <div className="bg-white">
      <section className="bg-[#0f6f8f]">
        <div className="mx-auto grid max-w-7xl items-center gap-6 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="text-white">
            <p className="text-xs uppercase tracking-[0.2em] text-white/80">New Arrival 2022</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
              The best tablet
              <br />
              Collection 2022
            </h1>
            <p className="mt-3 text-sm text-white/80">Exclusive offer this week - up to 30% off.</p>
            <Link href="/" className="mt-6 inline-flex rounded bg-white px-5 py-2.5 text-sm font-semibold text-[#0f6f8f]">
              Shop Now
            </Link>
          </div>
          <div className="justify-self-center lg:justify-self-end">
            <div
              className="h-52 w-52 rounded-lg bg-cover bg-center shadow-xl sm:h-64 sm:w-64"
              style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=900&q=80)' }}
            />
          </div>
        </div>
      </section>

      <section className="border-b border-[#e4ebf4] py-7">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 sm:grid-cols-3 sm:px-6 lg:grid-cols-6 lg:px-8">
          {categoryItems.map((item) => (
            <article key={item.name} className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f1f6ff] text-sm font-semibold tracking-wide text-[#0989ff]">
                {item.iconLabel}
              </div>
              <p className="mt-2 text-sm font-medium text-[#1b2a4e]">{item.name}</p>
              <p className="text-xs text-[#7c8ea6]">{item.count}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-[#1b2a4e]">Trending Products</h2>
            <div className="flex items-center gap-5 text-sm">
              <button type="button" className="font-semibold text-[#0989ff]">Top Sellers</button>
              <button type="button" className="text-[#6f829f]">Featured</button>
              <button type="button" className="text-[#6f829f]">New Arrival</button>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {productCards.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f7fbff] py-8">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:px-8">
          <article className="rounded-md border border-[#e4ebf4] bg-white p-6">
            <p className="text-xs font-semibold uppercase text-[#0989ff]">Weekend Sale</p>
            <h3 className="mt-2 text-2xl font-semibold text-[#1b2a4e]">Smartphone BLU G91 Pro 2022</h3>
            <Link href="/" className="mt-5 inline-block text-sm font-semibold text-[#0989ff]">Shop Now</Link>
          </article>
          <article className="rounded-md border border-[#d8e7ff] bg-[#eaf3ff] p-6">
            <p className="text-xs font-semibold uppercase text-[#0989ff]">Holiday Offer</p>
            <h3 className="mt-2 text-2xl font-semibold text-[#1b2a4e]">HyperX Cloud II Wireless</h3>
            <Link href="/" className="mt-5 inline-block text-sm font-semibold text-[#0989ff]">Shop Now</Link>
          </article>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-[#1b2a4e]">Deal of The Day</h2>
            <Link href="/" className="text-sm font-semibold text-[#0989ff]">View All</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {productCards.slice(0, 4).map((product) => (
              <ProductCard key={`deal-${product.id}`} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0d86f8] py-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="text-white">
            <p className="text-xs uppercase tracking-[0.2em] text-white/70">Mega Offer</p>
            <h3 className="mt-2 text-2xl font-semibold">Galaxy Tab S9 Plus Android Tablet</h3>
          </div>
          <Link href="/" className="rounded bg-white px-5 py-2.5 text-sm font-semibold text-[#0d86f8]">Shop Now</Link>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-[#1b2a4e]">Popular Products</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {productCards.map((product) => (
              <ProductCard key={`popular-${product.id}`} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f7fbff] py-10">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 md:grid-cols-3 sm:px-6 lg:px-8">
          <SmallListCard title="Discount Products" />
          <SmallListCard title="Featured Products" />
          <SmallListCard title="Selling Products" />
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-[#1b2a4e]">Latest News & Articles</h2>
            <Link href="/" className="text-sm font-semibold text-[#0989ff]">View All Blog</Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=900&q=80',
              'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&q=80',
              'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=900&q=80',
            ].map((image, index) => (
              <article key={image} className="overflow-hidden rounded-md border border-[#e4ebf4] bg-white">
                <div className="aspect-16/10 bg-cover bg-center" style={{ backgroundImage: `url(${image})` }} />
                <div className="p-4">
                  <p className="text-xs text-[#7c8ea6]">Jan 0{index + 1}, 2026</p>
                  <h3 className="mt-2 text-base font-semibold text-[#1b2a4e]">Latest smart gadgets for your daily setup</h3>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[#d8e7ff] bg-[#0d86f8] py-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-white">Subscribe our Newsletter and get updates every week</p>
          <form className="flex w-full max-w-md overflow-hidden rounded sm:w-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full bg-white px-4 py-2 text-sm text-[#1b2a4e] outline-none"
            />
            <button type="submit" className="bg-[#1b2a4e] px-4 py-2 text-sm font-semibold text-white">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
