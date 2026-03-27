import { fetchPromoBannersForStore } from '@/lib/fetch-promo-banners';
import { HomePageClient } from './home-page-client';

export default async function Page() {
  const promoBanners = await fetchPromoBannersForStore();
  return <HomePageClient initialPromoBanners={promoBanners} />;
}
