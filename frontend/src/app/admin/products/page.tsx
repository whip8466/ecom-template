import { redirect } from 'next/navigation';

/** @deprecated Use `/admin/product/list` */
export default function LegacyProductsListRedirect() {
  redirect('/admin/product/list');
}
