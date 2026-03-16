import { ShopGridClient } from '@/components/shop/ShopGridClient';

type ShopPageProps = {
  searchParams?: Promise<{ q?: string; category?: string }>;
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  return (
    <ShopGridClient
      initialQuery={(params?.q || '').trim()}
      initialCategory={(params?.category || '').trim()}
    />
  );
}
