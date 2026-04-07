'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { messageFromApiErrorPayload } from '@/lib/api-error';
import { handleInvalidTokenIfNeeded } from '@/lib/invalidate-session';
import { buildLoginRedirectHref } from '@/lib/auth-redirect';
import { withAuth } from '@/components/auth';
import { formatMoney } from '@/lib/format';
import type { Address } from '@/lib/types';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';
import Link from 'next/link';
import { AddressFormFields, emptyAddressFormValues } from '@/components/address-form-fields';

function CheckoutPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const refreshMe = useAuthStore((s) => s.refreshMe);
  const { items, clearCart } = useCartStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [addingAddress, setAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState(() => emptyAddressFormValues());
  const [savingAddress, setSavingAddress] = useState(false);
  const [billingError, setBillingError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);

  const refreshAddresses = useCallback(async () => {
    if (!token) return;
    const res = await apiRequest<{ data: Address[] }>('/api/user/addresses', { token });
    setAddresses(res.data);
    return res.data;
  }, [token]);

  useEffect(() => {
    if (token && !user) {
      void refreshMe();
    }
  }, [token, user, refreshMe]);

  useEffect(() => {
    if (!token) return;
    refreshAddresses()
      .then((list) => {
        if (list && list.length > 0) {
          setSelectedAddressId(list.find((a) => a.isDefault)?.id ?? list[0]?.id ?? null);
        }
      })
      .catch(() => setBillingError('Failed to load addresses'));
  }, [token, refreshAddresses]);

  async function saveNewAddress() {
    if (!token) return;

    const requiredFields = [
      newAddress.fullName,
      newAddress.phone,
      newAddress.addressLine1,
      newAddress.city,
      newAddress.state,
      newAddress.postalCode,
      newAddress.country,
    ];
    if (requiredFields.some((value) => !String(value).trim())) {
      setBillingError('Please complete all required fields');
      return;
    }

    try {
      setSavingAddress(true);
      setBillingError('');

      const res = await apiRequest<{ data: Address }>('/api/user/addresses', {
        method: 'POST',
        token,
        body: JSON.stringify(newAddress),
      });
      const created = res.data;

      await refreshAddresses();
      setSelectedAddressId(created.id);
      setAddingAddress(false);
      setNewAddress(emptyAddressFormValues());
    } catch (e) {
      setBillingError(e instanceof Error ? e.message : 'Could not save address');
    } finally {
      setSavingAddress(false);
    }
  }

  function startAddAddress() {
    setBillingError('');
    setNewAddress(emptyAddressFormValues());
    setAddingAddress(true);
  }

  function cancelAddAddress() {
    setAddingAddress(false);
    setNewAddress(emptyAddressFormValues());
    setBillingError('');
  }

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

    if (!selectedAddressId) {
      setError('Please select a delivery address or save a new one');
      return;
    }

    try {
      setPlacing(true);
      setError('');

      const payload = {
        addressId: selectedAddressId,
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
        await handleInvalidTokenIfNeeded(res.status, data);
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
        <Link href="/" className="hover:text-[var(--sf-btn-primary-bg)]">
          Home
        </Link>{' '}
        / Checkout
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card-bg)] p-6">
          <h2 className="text-3xl font-semibold text-[#0f1f40]">Billing Details</h2>

          <div className="mt-5 space-y-3">
            {addresses.map((address) => (
              <label
                key={address.id}
                className={`flex cursor-pointer gap-3 rounded border p-4 text-sm transition ${
                  selectedAddressId === address.id
                    ? 'border-[var(--sf-input-focus)] bg-[#f0f9ff]'
                    : 'border-[var(--border)] hover:border-[#b8d4f0]'
                }`}
              >
                <input
                  type="radio"
                  name="checkout-address"
                  className="mt-1 accent-[var(--sf-checkbox-accent)]"
                  checked={selectedAddressId === address.id}
                  onChange={() => setSelectedAddressId(address.id)}
                />
                <span className="text-[#475467]">
                  <span className="font-semibold text-[#0f1f40]">{address.fullName}</span>
                  {address.isDefault && (
                    <span className="ml-2 rounded bg-[#e0f2fe] px-2 py-0.5 text-xs font-medium text-[#0369a1]">
                      Default
                    </span>
                  )}
                  <br />
                  {address.phone}
                  <br />
                  {address.addressLine1}
                  {address.addressLine2 ? `, ${address.addressLine2}` : ''}
                  <br />
                  {address.city}, {address.state} {address.postalCode}
                  <br />
                  {address.country}
                </span>
              </label>
            ))}
          </div>

          {addresses.length === 0 && !addingAddress && (
            <p className="mt-5 text-sm text-[#7c8ea6]">No saved addresses yet. Add one below.</p>
          )}

          {billingError && (
            <p className="mt-4 text-sm text-red-600">{billingError}</p>
          )}

          {!addingAddress && (
            <div className="mt-5">
              <button
                type="button"
                onClick={startAddAddress}
                className="sf-btn-secondary rounded-md px-4 py-2.5 text-sm"
              >
                Add new address
              </button>
            </div>
          )}

          {addingAddress && (
            <div className="mt-6 border-t border-[var(--border)] pt-6">
              <p className="text-sm font-medium text-[#0f1f40]">New address</p>
              <div className="mt-4">
                <AddressFormFields
                  variant="checkout"
                  userEmail={user?.email}
                  value={newAddress}
                  onChange={setNewAddress}
                />
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={savingAddress}
                  onClick={saveNewAddress}
                  className="sf-btn-primary rounded-md px-6 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingAddress ? 'Saving…' : 'Save address'}
                </button>
                <button
                  type="button"
                  disabled={savingAddress}
                  onClick={cancelAddAddress}
                  className="sf-btn-secondary rounded-md px-6 py-2.5 text-sm disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>

        <aside className="h-fit rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card-bg)] p-5">
          <h2 className="text-3xl font-semibold text-[#0f1f40]">Your Order</h2>

          <div className="mt-4 border-b border-[var(--border)] pb-3 text-sm">
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
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>{formatMoney(item.priceCents * item.quantity)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-4 text-xl font-semibold text-[#0f1f40]">
            <span>Total</span>
            <span className="text-[var(--sf-btn-primary-bg)]">{formatMoney(subtotal)}</span>
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm text-[#475467]">
            <input
              type="checkbox"
              className="sf-checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
            />
            I have read and agree to the website terms.
          </label>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button
            disabled={placing || items.length === 0}
            onClick={placeOrder}
            className="sf-btn-primary mt-4 w-full py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {placing ? 'Placing order...' : 'Place Order'}
          </button>
        </aside>
      </div>
    </div>
  );
}

export default withAuth(CheckoutPage);
