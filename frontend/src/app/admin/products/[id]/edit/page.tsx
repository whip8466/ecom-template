import { redirect } from 'next/navigation';

type Props = { params: Promise<{ id: string }> };

/** @deprecated Use `/admin/product/edit/[productId]` */
export default async function LegacyEditProductRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/admin/product/edit/${id}`);
}
