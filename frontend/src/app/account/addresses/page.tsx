'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import type { Address } from '@/lib/types';

const emptyForm = {
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

export default function AddressesPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  async function loadAddresses() {
    if (!token) return;
    const response = await apiRequest<{ data: Address[] }>('/api/user/addresses', { token });
    setAddresses(response.data);
  }

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    const run = async () => {
      try {
        const response = await apiRequest<{ data: Address[] }>('/api/user/addresses', { token });
        setAddresses(response.data);
      } catch {
        setError('Failed to load addresses');
      }
    };

    run();
  }, [router, token]);

  async function saveAddress() {
    if (!token) return;

    try {
      const path = editingId ? `/api/user/addresses/${editingId}` : '/api/user/addresses';
      await apiRequest(path, {
        method: editingId ? 'PUT' : 'POST',
        token,
        body: JSON.stringify(form),
      });
      setForm(emptyForm);
      setEditingId(null);
      setError('');
      await loadAddresses();
    } catch (e) {
      setError((e as Error).message || 'Failed to save address');
    }
  }

  async function deleteAddress(id: number) {
    if (!token) return;
    await apiRequest(`/api/user/addresses/${id}`, { method: 'DELETE', token });
    await loadAddresses();
  }

  async function markDefault(id: number) {
    if (!token) return;
    await apiRequest(`/api/user/addresses/${id}/default`, { method: 'PATCH', token });
    await loadAddresses();
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">My addresses</h1>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-medium">{editingId ? 'Edit address' : 'Add address'}</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Object.entries(form).map(([key, value]) => {
            if (key === 'isDefault') {
              return (
                <label key={key} className="col-span-1 flex items-center gap-2 text-sm sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                  />
                  Mark as default
                </label>
              );
            }
            return (
              <input
                key={key}
                className="rounded-md border border-slate-300 px-3 py-2"
                placeholder={key}
                value={value as string}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            );
          })}
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-3 flex gap-2">
          <button className="rounded-md bg-slate-900 px-4 py-2 text-white" onClick={saveAddress}>
            {editingId ? 'Update' : 'Add'} address
          </button>
          {editingId && (
            <button
              className="rounded-md border border-slate-300 px-4 py-2"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {addresses.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
            No addresses saved yet.
          </div>
        )}

        {addresses.map((address) => (
          <div key={address.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="font-medium">
              {address.fullName} {address.isDefault && <span className="text-xs text-emerald-700">(Default)</span>}
            </p>
            <p className="text-sm text-slate-600">
              {address.addressLine1}, {address.city}, {address.state} {address.postalCode}, {address.country}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                onClick={() => {
                  setEditingId(address.id);
                  setForm({
                    fullName: address.fullName,
                    phone: address.phone,
                    addressLine1: address.addressLine1,
                    addressLine2: address.addressLine2 || '',
                    city: address.city,
                    state: address.state,
                    postalCode: address.postalCode,
                    country: address.country,
                    isDefault: address.isDefault,
                  });
                }}
              >
                Edit
              </button>
              <button className="rounded-md border border-slate-300 px-3 py-1.5 text-sm" onClick={() => deleteAddress(address.id)}>
                Delete
              </button>
              {!address.isDefault && (
                <button className="rounded-md border border-slate-300 px-3 py-1.5 text-sm" onClick={() => markDefault(address.id)}>
                  Make default
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
