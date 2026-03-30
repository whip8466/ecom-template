'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { withAuth } from '@/components/auth';
import { AddressFormFields, emptyAddressFormValues, type AddressFormValues } from '@/components/address-form-fields';
import { useAuthStore } from '@/store/auth-store';
import type { Address } from '@/lib/types';

function addressToForm(a: Address): AddressFormValues {
  return {
    fullName: a.fullName,
    phone: a.phone,
    addressLine1: a.addressLine1,
    addressLine2: a.addressLine2 ?? '',
    city: a.city,
    state: a.state,
    postalCode: a.postalCode,
    country: a.country,
    isDefault: a.isDefault,
  };
}

function AddressesPage() {
  const { token } = useAuthStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState<AddressFormValues>(() => emptyAddressFormValues());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadAddresses = useCallback(async () => {
    if (!token) return;
    const response = await apiRequest<{ data: Address[] }>('/api/user/addresses', { token });
    setAddresses(response.data);
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const run = async () => {
      try {
        await loadAddresses();
      } catch {
        setError('Failed to load addresses');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [token, loadAddresses]);

  function resetFormState() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyAddressFormValues());
    setError('');
  }

  async function saveAddress() {
    if (!token) return;

    const required = [
      form.fullName,
      form.phone,
      form.addressLine1,
      form.city,
      form.state,
      form.postalCode,
      form.country,
    ];
    if (required.some((v) => !String(v).trim())) {
      setError('Please complete all required fields');
      return;
    }

    try {
      setError('');
      const path = editingId ? `/api/user/addresses/${editingId}` : '/api/user/addresses';
      await apiRequest(path, {
        method: editingId ? 'PUT' : 'POST',
        token,
        body: JSON.stringify(form),
      });
      resetFormState();
      await loadAddresses();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save address';
      setError(msg);
    }
  }

  async function deleteAddress(id: number) {
    if (!token) return;
    if (!window.confirm('Delete this address? This cannot be undone.')) return;
    try {
      await apiRequest(`/api/user/addresses/${id}`, { method: 'DELETE', token });
      await loadAddresses();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    }
  }

  async function markDefault(id: number) {
    if (!token) return;
    try {
      await apiRequest(`/api/user/addresses/${id}/default`, { method: 'PATCH', token });
      await loadAddresses();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update default');
    }
  }

  function openAddForm() {
    setEditingId(null);
    setForm(emptyAddressFormValues());
    setError('');
    setShowForm(true);
  }

  function openEditForm(address: Address) {
    setEditingId(address.id);
    setForm(addressToForm(address));
    setError('');
    setShowForm(true);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded bg-[#e8edf6]" />
        <div className="h-64 animate-pulse rounded bg-[#f1f5f9]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-4xl font-semibold text-[#0f1f40]">My addresses</h1>
          <p className="mt-2 text-sm text-[#7c8ea6]">
            <Link href="/" className="hover:text-[#0989ff]">
              Home
            </Link>{' '}
            / My addresses
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            className="inline-flex shrink-0 items-center justify-center rounded-md bg-[#0989ff] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0476df]"
            onClick={openAddForm}
          >
            Add address
          </button>
        )}
      </div>

      {error && !showForm && <p className="text-sm text-red-600">{error}</p>}

      <div className="space-y-4">
        {addresses.length > 0 && (
          <h2 className="text-lg font-semibold text-[#0f1f40]">Saved addresses</h2>
        )}
        {addresses.length === 0 && !showForm && (
          <div className="rounded-md border border-dashed border-[#dce6f4] bg-white p-10 text-center">
            <p className="text-sm text-[#64748b]">You don&apos;t have any saved addresses yet.</p>
          </div>
        )}

        {addresses.map((address) => (
          <div
            key={address.id}
            className="rounded-md border border-[#e5ecf6] bg-white p-5 shadow-sm"
          >
            <p className="font-semibold text-[#0f1f40]">
              {address.fullName}{' '}
              {address.isDefault && (
                <span className="ml-2 rounded bg-[#e0f2fe] px-2 py-0.5 text-xs font-medium text-[#0369a1]">
                  Default
                </span>
              )}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#475467]">
              {address.phone}
              <br />
              {address.addressLine1}
              {address.addressLine2 ? `, ${address.addressLine2}` : ''}
              <br />
              {address.city}, {address.state} {address.postalCode}
              <br />
              {address.country}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded border border-[#d7e4f6] px-3 py-1.5 text-sm font-medium text-[#344054] hover:bg-[#f8fafc]"
                onClick={() => openEditForm(address)}
              >
                Edit
              </button>
              <button
                type="button"
                className="rounded border border-[#d7e4f6] px-3 py-1.5 text-sm font-medium text-[#344054] hover:bg-[#f8fafc]"
                onClick={() => deleteAddress(address.id)}
              >
                Delete
              </button>
              {!address.isDefault && (
                <button
                  type="button"
                  className="rounded border border-[#d7e4f6] px-3 py-1.5 text-sm font-medium text-[#344054] hover:bg-[#f8fafc]"
                  onClick={() => markDefault(address.id)}
                >
                  Make default
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <section className="rounded-md border border-[#e5ecf6] bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-[#0f1f40] sm:text-3xl">
                {editingId ? 'Edit address' : 'Add a new address'}
              </h2>
              <p className="mt-1 text-sm text-[#64748b]">
                Use the same details as at checkout — full name, phone, and delivery address.
              </p>
            </div>
            <button
              type="button"
              className="text-sm font-medium text-[#64748b] hover:text-[#0989ff] sm:shrink-0"
              onClick={resetFormState}
            >
              Close
            </button>
          </div>

          <div className="mt-6">
            <AddressFormFields variant="account" value={form} onChange={setForm} />
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-md bg-[#0989ff] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#0476df]"
              onClick={saveAddress}
            >
              {editingId ? 'Update address' : 'Save address'}
            </button>
            <button
              type="button"
              className="rounded-md border border-[#d0d7e2] bg-white px-6 py-2.5 text-sm font-semibold text-[#0f1f40] hover:bg-[#f8fafc]"
              onClick={resetFormState}
            >
              Cancel
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default withAuth(AddressesPage);
