'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { messageFromApiErrorPayload } from '@/lib/api-error';
import { buildLoginRedirectHref } from '@/lib/auth-redirect';
import { formatMoney } from '@/lib/format';
import type { Address } from '@/lib/types';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';
import Link from 'next/link';

const emptyAddressForm = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  isDefault: false,
};

export default function CheckoutPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const { items, clearCart } = useCartStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState(emptyAddressForm);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [shippingMethod, setShippingMethod] = useState<'flat' | 'pickup' | 'free'>('flat');
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'check'>('bank');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
  const shippingCents =
    shippingMethod === 'flat' ? 2000 : shippingMethod === 'pickup' ? 2500 : 0;
  const total = subtotal + shippingCents;

  useEffect(() => {
    if (!token) {
      router.push(buildLoginRedirectHref('/checkout'));
      return;
    }
    apiRequest<{ data: Address[] }>('/api/user/addresses', { token })
      .then((res) => {
        setAddresses(res.data);
        setSelectedAddressId(res.data.find((a) => a.isDefault)?.id || res.data[0]?.id || null);
      })
      .catch(() => setError('Failed to load addresses'));
  }, [router, token]);

  async function placeOrder() {
    if (!token || !user) {
      router.push(buildLoginRedirectHref('/checkout'));
      return;
    }

    if (!agreeTerms) {
      setError('Please accept terms before placing the order');
      return;
    }

    if (items.length === 0) {
      setError('Your cart is empty');
      return;
    }

    if (!useNewAddress && !selectedAddressId) {
      setError('Please select a saved address or add a new one');
      return;
    }

    if (useNewAddress) {
      const requiredFields = [
        newAddress.fullName,
        newAddress.phone,
        newAddress.addressLine1,
        newAddress.city,
        newAddress.state,
        newAddress.postalCode,
        newAddress.country,
      ];
      if (requiredFields.some((value) => !value.trim())) {
        setError('Please complete all required billing fields');
        return;
      }
    }

    try {
      setPlacing(true);
      setError('');

      const payload = {
        addressId: !useNewAddress ? selectedAddressId ?? undefined : undefined,
        newAddress: useNewAddress ? newAddress : undefined,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          colorName: item.colorName,
          variantId: item.variantId,
        })),
      };

      const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      const res = await fetch(`${base}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(messageFromApiErrorPayload(data));
      }
      const response = data as { data: { id: number } };

      clearCart();
      router.push(`/order-success/${response.data.id}`);
    } catch (e) {
      setError((e as Error).message || 'Checkout failed');
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold text-[#0f1f40]">Checkout</h1>
      <p className="mt-2 text-sm text-[#7c8ea6]">
        <Link href="/" className="hover:text-[#0989ff]">Home</Link> / Checkout
      </p>

      {!token && <p className="mt-6 text-sm text-slate-600">Please login to continue.</p>}

      {token && (
        <>
          <div className="mt-6 space-y-2 text-sm">
            <div className="border-y border-[#e8edf6] py-3 text-[#475467]">
              Returning customer?{' '}
              <Link href="/login?redirect=%2Fcheckout" className="font-medium text-[#0989ff] hover:underline">Click here to login</Link>
            </div>
            <div className="border-b border-[#e8edf6] py-3 text-[#475467]">
              Have a coupon?{' '}
              <button type="button" className="font-medium text-[#0989ff] hover:underline">Click here to enter your code</button>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="rounded-md border border-[#e5ecf6] bg-white p-6">
              <h2 className="text-3xl font-semibold text-[#0f1f40]">Billing Details</h2>

              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                <button
                  type="button"
                  className={`rounded border px-3 py-1.5 ${
                    useNewAddress
                      ? 'border-[#0989ff] bg-[#0989ff] text-white'
                      : 'border-[#d7e4f6] text-[#344054]'
                  }`}
                  onClick={() => setUseNewAddress(true)}
                >
                  New Address
                </button>
                <button
                  type="button"
                  className={`rounded border px-3 py-1.5 ${
                    !useNewAddress
                      ? 'border-[#0989ff] bg-[#0989ff] text-white'
                      : 'border-[#d7e4f6] text-[#344054]'
                  }`}
                  onClick={() => setUseNewAddress(false)}
                >
                  Saved Address
                </button>
              </div>

              {!useNewAddress ? (
                <div className="mt-5 space-y-2">
                  {addresses.map((address) => (
                    <label key={address.id} className="flex cursor-pointer gap-3 rounded border border-[#dce6f4] p-3 text-sm">
                      <input
                        type="radio"
                        checked={selectedAddressId === address.id}
                        onChange={() => setSelectedAddressId(address.id)}
                      />
                      <span>
                        {address.fullName}, {address.addressLine1}, {address.city}, {address.state}, {address.country} {address.postalCode}
                      </span>
                    </label>
                  ))}
                  {addresses.length === 0 && (
                    <p className="text-sm text-[#7c8ea6]">
                      No saved addresses. Add one from{' '}
                      <Link className="text-[#0989ff]" href="/account/addresses">Address page</Link>.
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#111827]">First Name *</label>
                    <input
                      className="h-11 w-full rounded border border-[#d7e4f6] px-3 text-sm outline-none focus:border-[#0989ff]"
                      placeholder="First Name"
                      value={newAddress.fullName}
                      onChange={(e) => setNewAddress((prev) => ({ ...prev, fullName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#111827]">Last Name *</label>
                    <input className="h-11 w-full rounded border border-[#d7e4f6] px-3 text-sm outline-none focus:border-[#0989ff]" placeholder="Last Name" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-[#111827]">Company name (optional)</label>
                    <input className="h-11 w-full rounded border border-[#d7e4f6] px-3 text-sm outline-none focus:border-[#0989ff]" placeholder="Company" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-[#111827]">Country / Region *</label>
                    <input
                      className="h-11 w-full rounded border border-[#d7e4f6] px-3 text-sm outline-none focus:border-[#0989ff]"
                      placeholder="Country"
                      value={newAddress.country}
                      onChange={(e) => setNewAddress((prev) => ({ ...prev, country: e.target.value }))}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-[#111827]">Street address *</label>
                    <input
                      className="h-11 w-full rounded border border-[#d7e4f6] px-3 text-sm outline-none focus:border-[#0989ff]"
                      placeholder="House number and street name"
                      value={newAddress.addressLine1}
                      onChange={(e) => setNewAddress((prev) => ({ ...prev, addressLine1: e.target.value }))}
                    />
                    <input
                      className="mt-2 h-11 w-full rounded border border-[#d7e4f6] px-3 text-sm outline-none focus:border-[#0989ff]"
                      placeholder="Apartment, suite, unit, etc (optional)"
                      value={newAddress.addressLine2}
                      onChange={(e) => setNewAddress((prev) => ({ ...prev, addressLine2: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#111827]">Town / City *</label>
                    <input
                      className="h-11 w-full rounded border border-[#d7e4f6] px-3 text-sm outline-none focus:border-[#0989ff]"
                      placeholder="City"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress((prev) => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#111827]">State / County *</label>
                    <input
                      className="h-11 w-full rounded border border-[#d7e4f6] px-3 text-sm outline-none focus:border-[#0989ff]"
                      placeholder="State"
                      value={newAddress.state}
                      onChange={(e) => setNewAddress((prev) => ({ ...prev, state: e.target.value }))}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-[#111827]">Postcode ZIP *</label>
                    <input
                      className="h-11 w-full rounded border border-[#d7e4f6] px-3 text-sm outline-none focus:border-[#0989ff]"
                      placeholder="Postal code"
                      value={newAddress.postalCode}
                      onChange={(e) => setNewAddress((prev) => ({ ...prev, postalCode: e.target.value }))}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-[#111827]">Phone *</label>
                    <input
                      className="h-11 w-full rounded border border-[#d7e4f6] px-3 text-sm outline-none focus:border-[#0989ff]"
                      placeholder="Phone"
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-[#111827]">Email address *</label>
                    <input className="h-11 w-full rounded border border-[#d7e4f6] px-3 text-sm outline-none focus:border-[#0989ff]" placeholder={user?.email || 'Email address'} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-[#111827]">Order notes (optional)</label>
                    <textarea
                      rows={5}
                      className="w-full rounded border border-[#d7e4f6] px-3 py-2 text-sm outline-none focus:border-[#0989ff]"
                      placeholder="Notes about your order"
                    />
                  </div>
                  <label className="sm:col-span-2 flex items-center gap-2 text-sm text-[#475467]">
                    <input
                      type="checkbox"
                      checked={newAddress.isDefault}
                      onChange={(e) => setNewAddress((prev) => ({ ...prev, isDefault: e.target.checked }))}
                    />
                    Save as default address
                  </label>
                </div>
              )}
            </section>

            <aside className="h-fit rounded-md border border-[#e5ecf6] bg-white p-5">
              <h2 className="text-3xl font-semibold text-[#0f1f40]">Your Order</h2>

              <div className="mt-4 border-b border-[#edf2f8] pb-3 text-sm">
                <div className="flex items-center justify-between font-semibold text-[#111827]">
                  <span>Product</span>
                  <span>Total</span>
                </div>
                <div className="mt-3 space-y-2 text-[#475467]">
                  {items.length === 0 ? (
                    <p>No items in cart.</p>
                  ) : (
                    items.map((item, index) => (
                      <div key={`${item.productId}-${index}`} className="flex items-start justify-between gap-3">
                        <span>{item.name} × {item.quantity}</span>
                        <span>{formatMoney(item.priceCents * item.quantity)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-3 space-y-3 border-b border-[#edf2f8] pb-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#111827]">Subtotal</span>
                  <span className="font-semibold text-[#0989ff]">{formatMoney(subtotal)}</span>
                </div>
                <div>
                  <p className="mb-2 font-semibold text-[#111827]">Shipping</p>
                  <div className="space-y-1.5 text-[#475467]">
                    <label className="flex items-center gap-2">
                      <input type="radio" checked={shippingMethod === 'flat'} onChange={() => setShippingMethod('flat')} />
                      Flat rate: <span className="text-[#0989ff]">{formatMoney(2000)}</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" checked={shippingMethod === 'pickup'} onChange={() => setShippingMethod('pickup')} />
                      Local pickup: <span className="text-[#0989ff]">{formatMoney(2500)}</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" checked={shippingMethod === 'free'} onChange={() => setShippingMethod('free')} />
                      Free shipping
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xl font-semibold text-[#0f1f40]">
                <span>Total</span>
                <span>{formatMoney(total)}</span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-[#475467]">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={paymentMethod === 'bank'} onChange={() => setPaymentMethod('bank')} />
                  Direct Bank Transfer
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={paymentMethod === 'check'} onChange={() => setPaymentMethod('check')} />
                  Cheque Payment
                </label>
              </div>

              <label className="mt-4 flex items-center gap-2 border-t border-[#edf2f8] pt-4 text-sm text-[#475467]">
                <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />
                I have read and agree to the website terms.
              </label>

              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

              <button
                disabled={placing || items.length === 0}
                onClick={placeOrder}
                className="mt-4 w-full rounded bg-[#0989ff] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0476df] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {placing ? 'Placing order...' : 'Place Order'}
              </button>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
