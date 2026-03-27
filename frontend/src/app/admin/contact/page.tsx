'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminPageShell } from '@/components/admin-shell';
import { apiRequest } from '@/lib/api';
import type { ContactMessageRow, ContactSettings } from '@/lib/contact-settings';
import { useAuthStore } from '@/store/auth-store';

type FormState = {
  headline: string;
  primaryEmail: string;
  supportEmail: string;
  phone: string;
  addressLine: string;
  mapEmbedUrl: string;
  facebookUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
};

const emptyForm: FormState = {
  headline: '',
  primaryEmail: '',
  supportEmail: '',
  phone: '',
  addressLine: '',
  mapEmbedUrl: '',
  facebookUrl: '',
  twitterUrl: '',
  linkedinUrl: '',
};

function toForm(s: ContactSettings): FormState {
  return {
    headline: s.headline,
    primaryEmail: s.primaryEmail,
    supportEmail: s.supportEmail,
    phone: s.phone,
    addressLine: s.addressLine,
    mapEmbedUrl: s.mapEmbedUrl ?? '',
    facebookUrl: s.facebookUrl ?? '',
    twitterUrl: s.twitterUrl ?? '',
    linkedinUrl: s.linkedinUrl ?? '',
  };
}

export default function AdminContactPage() {
  const token = useAuthStore((s) => s.token);
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ContactMessageRow[]>([]);
  const [msgPage, setMsgPage] = useState(1);
  const [msgPagination, setMsgPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [msgLoading, setMsgLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadSettings = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ data: ContactSettings }>('/api/contact-settings', { token });
      if (res.data) setForm(toForm(res.data));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadMessages = useCallback(async () => {
    if (!token) return;
    setMsgLoading(true);
    try {
      const params = new URLSearchParams({ page: String(msgPage), limit: '20' });
      const res = await apiRequest<{
        data: ContactMessageRow[];
        pagination: typeof msgPagination;
      }>(`/api/admin/contact-messages?${params}`, { token });
      setMessages(Array.isArray(res.data) ? res.data : []);
      setMsgPagination(res.pagination);
    } catch {
      setMessages([]);
    } finally {
      setMsgLoading(false);
    }
  }, [token, msgPage]);

  useEffect(() => {
    if (!mounted || !token) return;
    void loadSettings();
  }, [mounted, token, loadSettings]);

  useEffect(() => {
    if (!mounted || !token) return;
    void loadMessages();
  }, [mounted, token, loadMessages]);

  const save = async () => {
    if (!token) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const payload = {
        headline: form.headline.trim(),
        primaryEmail: form.primaryEmail.trim(),
        supportEmail: form.supportEmail.trim(),
        phone: form.phone.trim(),
        addressLine: form.addressLine.trim(),
        mapEmbedUrl: form.mapEmbedUrl.trim() || null,
        facebookUrl: form.facebookUrl.trim() || null,
        twitterUrl: form.twitterUrl.trim() || null,
        linkedinUrl: form.linkedinUrl.trim() || null,
      };
      const res = await apiRequest<{ data: ContactSettings }>('/api/admin/contact-settings', {
        method: 'PUT',
        body: JSON.stringify(payload),
        token,
      });
      if (res.data) setForm(toForm(res.data));
      setMessage('Contact details saved.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const patch = (p: Partial<FormState>) => setForm((prev) => ({ ...prev, ...p }));

  if (!mounted) {
    return (
      <AdminPageShell breadcrumbs={[{ label: 'Home', href: '/admin' }, { label: 'Contact page' }]} title="Contact page" description="Storefront contact content and inbound messages.">
        <p className="text-sm text-[#64748b]">Loading…</p>
      </AdminPageShell>
    );
  }

  if (!token) {
    return (
      <AdminPageShell breadcrumbs={[{ label: 'Home', href: '/admin' }, { label: 'Contact page' }]} title="Contact page" description="Storefront contact content and inbound messages.">
        <p className="text-sm text-[#64748b]">Sign in as admin to edit contact settings.</p>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      breadcrumbs={[
        { label: 'Home', href: '/admin' },
        { label: 'Contact page' },
      ]}
      title="Contact page"
      description="Edit the public contact page (headline, emails, phone, address, map embed URL, social links). Messages from the contact form appear below."
      actions={
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || loading}
          className="rounded-admin bg-[#3874ff] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d5fd6] disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      }
    >
      <div className="space-y-10">
        {loading ? <p className="text-xs text-[#60759b]">Loading settings…</p> : null}
        {message ? <p className="text-sm text-green-700">{message}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="max-w-2xl space-y-4 rounded-admin border border-[#e3e6ed] bg-white p-6 shadow-sm">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Page headline</span>
            <input
              type="text"
              value={form.headline}
              onChange={(e) => patch({ headline: e.target.value })}
              className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#31374a]"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Primary email (sidebar)</span>
            <input
              type="email"
              value={form.primaryEmail}
              onChange={(e) => patch({ primaryEmail: e.target.value })}
              className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#31374a]"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Support email (footer / secondary)</span>
            <input
              type="email"
              value={form.supportEmail}
              onChange={(e) => patch({ supportEmail: e.target.value })}
              className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#31374a]"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Phone</span>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => patch({ phone: e.target.value })}
              className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#31374a]"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Address (one line)</span>
            <textarea
              value={form.addressLine}
              onChange={(e) => patch({ addressLine: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#31374a]"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Map embed URL</span>
            <p className="mt-0.5 text-xs text-[#94a3b8]">Paste the iframe src URL from Google Maps (Share → Embed a map).</p>
            <textarea
              value={form.mapEmbedUrl}
              onChange={(e) => patch({ mapEmbedUrl: e.target.value })}
              rows={3}
              placeholder="https://www.google.com/maps/embed?..."
              className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 font-mono text-xs text-[#31374a]"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Facebook URL</span>
              <input
                type="url"
                value={form.facebookUrl}
                onChange={(e) => patch({ facebookUrl: e.target.value })}
                className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#31374a]"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">X / Twitter URL</span>
              <input
                type="url"
                value={form.twitterUrl}
                onChange={(e) => patch({ twitterUrl: e.target.value })}
                className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#31374a]"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">LinkedIn URL</span>
              <input
                type="url"
                value={form.linkedinUrl}
                onChange={(e) => patch({ linkedinUrl: e.target.value })}
                className="mt-1 w-full rounded-admin border border-[#e3e6ed] px-3 py-2 text-sm text-[#31374a]"
              />
            </label>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#101828]">Inbound messages</h2>
          <p className="mt-1 text-sm text-[#64748b]">Submissions from the storefront contact form.</p>
          {msgLoading && messages.length === 0 ? (
            <p className="mt-4 text-xs text-[#60759b]">Loading…</p>
          ) : null}
          <div className="mt-4 overflow-x-auto rounded-admin border border-[#e3e6ed] bg-white">
            <table className="min-w-full text-left text-sm text-[#31374a]">
              <thead className="border-b border-[#e3e6ed] bg-[#f9fafb] text-xs font-semibold uppercase tracking-wide text-[#6e7891]">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">From</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Message</th>
                </tr>
              </thead>
              <tbody>
                {messages.length === 0 && !msgLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-[#6e7891]">
                      No messages yet.
                    </td>
                  </tr>
                ) : (
                  messages.map((m) => (
                    <tr key={m.id} className="border-b border-[#f0f2f5] align-top last:border-0">
                      <td className="whitespace-nowrap px-4 py-3 text-[#6e7891]">
                        {new Date(m.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{m.name}</div>
                        <div className="text-xs text-[#6e7891]">{m.email}</div>
                      </td>
                      <td className="max-w-[200px] px-4 py-3">{m.subject}</td>
                      <td className="max-w-md px-4 py-3 text-[#475467]">
                        <span className="line-clamp-4 whitespace-pre-wrap">{m.body}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {msgPagination.totalPages > 1 ? (
            <div className="mt-3 flex items-center justify-between text-sm text-[#64748b]">
              <span>
                Page {msgPagination.page} of {msgPagination.totalPages} ({msgPagination.total} total)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={msgPage <= 1 || msgLoading}
                  onClick={() => setMsgPage((p) => Math.max(1, p - 1))}
                  className="rounded-admin border border-[#e3e6ed] bg-white px-3 py-1.5 text-[#31374a] disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={msgPage >= msgPagination.totalPages || msgLoading}
                  onClick={() => setMsgPage((p) => p + 1)}
                  className="rounded-admin border border-[#e3e6ed] bg-white px-3 py-1.5 text-[#31374a] disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </AdminPageShell>
  );
}
