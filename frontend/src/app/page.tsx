'use client';

import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedCategories } from '@/components/home/FeaturedCategories';
import { BestsellingProducts } from '@/components/home/BestsellingProducts';
import { PromoBanner } from '@/components/home/PromoBanner';
import { SplitPromoCards } from '@/components/home/SplitPromoCards';
import { DealOfTheDay } from '@/components/home/DealOfTheDay';
import { NewArrivalsSection } from '@/components/home/NewArrivalsSection';
import { BrandBenefits } from '@/components/home/BrandBenefits';
import { ProductColumnsStrip } from '@/components/home/ProductColumnsStrip';
import { LatestArticles } from '@/components/home/LatestArticles';
import { InstagramStrip } from '@/components/home/InstagramStrip';
import { NewsletterSignup } from '@/components/home/NewsletterSignup';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedCategories />
      <BrandBenefits />
      <BestsellingProducts />
      <SplitPromoCards />
      <DealOfTheDay />
      <NewArrivalsSection />
      <PromoBanner />
      <ProductColumnsStrip />
      <LatestArticles />
      <InstagramStrip />
      <NewsletterSignup />
    </>
  );
}
