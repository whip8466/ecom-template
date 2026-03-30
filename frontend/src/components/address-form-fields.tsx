'use client';

import { useState, type Dispatch, type SetStateAction } from 'react';

export type AddressFormValues = {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

export const emptyAddressFormValues = (): AddressFormValues => ({
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
  isDefault: false,
});

function splitFullName(fullName: string): { first: string; last: string } {
  const t = fullName.trim();
  if (!t) return { first: '', last: '' };
  const i = t.indexOf(' ');
  if (i === -1) return { first: t, last: '' };
  return { first: t.slice(0, i), last: t.slice(i + 1).trim() };
}

const inputClass =
  'h-11 w-full rounded border border-[#d7e4f6] px-3 text-sm outline-none focus:border-[#0989ff]';
const labelClass = 'mb-1 block text-sm font-medium text-[#111827]';

type Props = {
  value: AddressFormValues;
  onChange: Dispatch<SetStateAction<AddressFormValues>>;
  variant?: 'checkout' | 'account';
  userEmail?: string | null;
};

export function AddressFormFields({ value, onChange, variant = 'account', userEmail }: Props) {
  const { first, last } = splitFullName(value.fullName);
  const [companyName, setCompanyName] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  const setFirst = (newFirst: string) => {
    onChange((prev) => {
      const lastPart = splitFullName(prev.fullName).last;
      return { ...prev, fullName: [newFirst.trim(), lastPart].filter(Boolean).join(' ') };
    });
  };

  const setLast = (newLast: string) => {
    onChange((prev) => {
      const firstPart = splitFullName(prev.fullName).first;
      return { ...prev, fullName: [firstPart, newLast.trim()].filter(Boolean).join(' ') };
    });
  };

  const defaultLabel =
    variant === 'checkout' ? 'Save as default address' : 'Mark as default address';

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label className={labelClass}>First Name *</label>
        <input
          className={inputClass}
          placeholder="First Name"
          value={first}
          onChange={(e) => setFirst(e.target.value)}
        />
      </div>
      <div>
        <label className={labelClass}>Last Name *</label>
        <input
          className={inputClass}
          placeholder="Last Name"
          value={last}
          onChange={(e) => setLast(e.target.value)}
        />
      </div>

      {variant === 'checkout' && (
        <div className="sm:col-span-2">
          <label className={labelClass}>Company name (optional)</label>
          <input
            className={inputClass}
            placeholder="Company"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>
      )}

      <div className="sm:col-span-2">
        <label className={labelClass}>Country / Region *</label>
        <input
          className={inputClass}
          placeholder="Country"
          value={value.country}
          onChange={(e) => onChange((prev) => ({ ...prev, country: e.target.value }))}
        />
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass}>Street address *</label>
        <input
          className={inputClass}
          placeholder="House number and street name"
          value={value.addressLine1}
          onChange={(e) => onChange((prev) => ({ ...prev, addressLine1: e.target.value }))}
        />
        <input
          className={`${inputClass} mt-2`}
          placeholder="Apartment, suite, unit, etc (optional)"
          value={value.addressLine2}
          onChange={(e) => onChange((prev) => ({ ...prev, addressLine2: e.target.value }))}
        />
      </div>
      <div>
        <label className={labelClass}>Town / City *</label>
        <input
          className={inputClass}
          placeholder="City"
          value={value.city}
          onChange={(e) => onChange((prev) => ({ ...prev, city: e.target.value }))}
        />
      </div>
      <div>
        <label className={labelClass}>State / County *</label>
        <input
          className={inputClass}
          placeholder="State"
          value={value.state}
          onChange={(e) => onChange((prev) => ({ ...prev, state: e.target.value }))}
        />
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass}>Postcode ZIP *</label>
        <input
          className={inputClass}
          placeholder="Postal code"
          value={value.postalCode}
          onChange={(e) => onChange((prev) => ({ ...prev, postalCode: e.target.value }))}
        />
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass}>Phone *</label>
        <input
          className={inputClass}
          placeholder="Phone"
          value={value.phone}
          onChange={(e) => onChange((prev) => ({ ...prev, phone: e.target.value }))}
        />
      </div>

      {variant === 'checkout' && (
        <>
          <div className="sm:col-span-2">
            <label className={labelClass}>Email address *</label>
            <input
              className={inputClass}
              placeholder={userEmail || 'Email address'}
              readOnly
              value={userEmail ?? ''}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Order notes (optional)</label>
            <textarea
              rows={5}
              className="w-full rounded border border-[#d7e4f6] px-3 py-2 text-sm outline-none focus:border-[#0989ff]"
              placeholder="Notes about your order"
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
            />
          </div>
        </>
      )}

      <label className="sm:col-span-2 flex items-center gap-2 text-sm text-[#475467]">
        <input
          type="checkbox"
          checked={value.isDefault}
          onChange={(e) => onChange((prev) => ({ ...prev, isDefault: e.target.checked }))}
        />
        {defaultLabel}
      </label>
    </div>
  );
}
