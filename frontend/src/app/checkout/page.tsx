'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
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

  useEffect(() => {
    if (!token) {
      router.push('/login');
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
      router.push('/login');
      return;
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
        })),
      };

      const response = await apiRequest<{ data: { id: number } }>('/api/orders', {
        method: 'POST',
        token,
        body: JSON.stringify(payload),
      });

      clearCart();
      router.push(`/order-success/${response.data.id}`);
    } catch (e) {
      setError((e as Error).message || 'Checkout failed');
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Checkout</h1>
      {!token && <p className="text-sm text-slate-600">Please login to continue.</p>}
      {token && (
        <>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="font-medium">Shipping address</h2>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <button
                type="button"
                className={`rounded-md border px-3 py-1.5 ${!useNewAddress ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300'}`}
                onClick={() => setUseNewAddress(false)}
              >
                Use saved address
              </button>
              <button
                type="button"
                className={`rounded-md border px-3 py-1.5 ${useNewAddress ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300'}`}
                onClick={() => setUseNewAddress(true)}
              >
                Add new address
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {!useNewAddress &&
                addresses.map((address) => (
                  <label key={address.id} className="flex cursor-pointer gap-3 rounded-md border border-slate-200 p-3">
                    <input
                      type="radio"
                      checked={selectedAddressId === address.id}
                      onChange={() => setSelectedAddressId(address.id)}
                    />
                    <span className="text-sm">
                      {address.fullName}, {address.addressLine1}, {address.city}, {address.state}, {address.country} {address.postalCode}
                    </span>
                  </label>
                ))}

              {!useNewAddress && addresses.length === 0 && (
                <p className="text-sm text-slate-500">
                  No saved addresses. Add one from <Link className="text-blue-600" href="/account/addresses">Address page</Link> or use &quot;Add new address&quot;.
                </p>
              )}

              {useNewAddress && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {Object.entries(newAddress).map(([key, value]) => {
                    if (key === 'isDefault') {
                      return (
                        <label key={key} className="col-span-1 flex items-center gap-2 text-sm sm:col-span-2">
                          <input
                            type="checkbox"
                            checked={Boolean(value)}
                            onChange={(e) => setNewAddress((prev) => ({ ...prev, isDefault: e.target.checked }))}
                          />
                          Save as default address
                        </label>
                      );
                    }

                    return (
                      <input
                        key={key}
                        className="rounded-md border border-slate-300 px-3 py-2"
                        placeholder={key}
                        value={String(value)}
                        onChange={(e) => setNewAddress((prev) => ({ ...prev, [key]: e.target.value }))}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            disabled={placing || items.length === 0}
            onClick={placeOrder}
            className="rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
          >
            {placing ? 'Placing order...' : 'Place order'}
          </button>
        </>
      )}
    </div>
  );
}
