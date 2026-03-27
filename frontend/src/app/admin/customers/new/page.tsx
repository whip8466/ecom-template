import Link from 'next/link';

export default function AdminAddCustomerPage() {
  return (
    <div className="mx-auto max-w-lg rounded-admin-card border border-[#e3e6ed] bg-white p-8 text-center shadow-sm">
      <h1 className="text-lg font-semibold text-[#31374a]">Add customer</h1>
      <p className="mt-2 text-sm text-[#6e7891]">Customer creation from the admin panel is not configured yet.</p>
      <Link href="/admin/customers" className="mt-6 inline-block text-sm font-medium text-[#3874ff] hover:underline">
        ← Back to Customers
      </Link>
    </div>
  );
}
