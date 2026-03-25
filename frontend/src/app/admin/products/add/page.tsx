import { redirect } from 'next/navigation';

/** @deprecated Use `/admin/product/new` */
export default function LegacyAddProductRedirect() {
  redirect('/admin/product/new');
}
