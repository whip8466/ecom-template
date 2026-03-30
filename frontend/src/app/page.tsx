import { fetchDealOfDayForStore } from '@/lib/deal-of-day';
import { fetchPromoBannersForStore } from '@/lib/fetch-promo-banners';
import { HomePageClient } from './home-page-client';

export default async function Page() {
  const [promoBanners, initialDealOfDay] = await Promise.all([
    fetchPromoBannersForStore(),
    fetchDealOfDayForStore(),
  ]);
  return <HomePageClient initialPromoBanners={promoBanners} initialDealOfDay={initialDealOfDay} />;
}
