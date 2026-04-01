'use client';

import Link from 'next/link';
import { type FormEvent, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import type { ContactSettings } from '@/lib/contact-settings';

/** Shared storefront form styles — tokens from Theme → Inputs (`sf-*` in `globals.css`). */
const fieldClass = 'sf-field h-11 disabled:cursor-not-allowed';
const textareaClass = 'sf-field disabled:cursor-not-allowed';

export default function ContactPage() {
  const [settings, setSettings] = useState<ContactSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [saveInfo, setSaveInfo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiRequest<{ data: ContactSettings }>('/api/contact-settings')
      .then((res) => {
        if (!cancelled) setSettings(res.data ?? null);
      })
      .catch(() => {
        if (!cancelled) setSettings(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setSubmitting(true);
    try {
      const res = await apiRequest<{ ok?: boolean; message?: string }>('/api/contact-messages', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          body: message.trim(),
          saveInfo,
        }),
      });
      setFeedback({ kind: 'ok', text: res.message || 'Message sent.' });
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setSaveInfo(false);
    } catch (err) {
      setFeedback({ kind: 'err', text: (err as Error).message || 'Something went wrong.' });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-[var(--muted)]">
        Loading…
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="py-20 text-center text-sm text-[var(--muted)]">
        Contact information is unavailable. Please try again later.
      </div>
    );
  }

  const headline = settings.headline || 'Keep In Touch with Us';

  return (
    <div className="pb-12 sm:pb-16">
      {/* Page intro — balanced scale, tight to content */}
      <header className="mb-6 text-center sm:mb-8 sm:text-left">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">Contact Us</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-[var(--navy)] sm:text-3xl">
          {headline}
        </h1>
        <nav className="mt-2 text-sm text-[var(--muted)] sm:inline-flex sm:items-center sm:gap-2">
          <Link href="/" className="text-[var(--accent)] transition-premium hover:underline">
            Home
          </Link>
          <span className="hidden sm:inline" aria-hidden>
            /
          </span>
          <span className="text-[var(--foreground)]">Contact Us</span>
        </nav>
      </header>

      {/* One surface: form | sidebar | map — borders match checkout Billing card */}
      <div className="overflow-hidden rounded-md border border-[#e5ecf6] bg-white shadow-[var(--shadow-sm)]">
        <div className="grid lg:grid-cols-[1fr_min(380px,38%)] lg:items-start">
          {/* Form — same control styles as checkout Billing Details */}
          <div className="border-b border-[#e5ecf6] p-6 sm:p-8 lg:border-b-0 lg:border-r lg:pb-10">
            <h2 className="text-3xl font-semibold text-[#0f1f40]">Send a message</h2>
            <p className="mt-2 text-sm text-[#7c8ea6]">We typically reply within one business day.</p>
            <form onSubmit={onSubmit} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-name" className="sf-label">
                  Your name *
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={submitting}
                  className={fieldClass}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="sf-label">
                  Your email *
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  className={fieldClass}
                  placeholder="you@example.com"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="contact-subject" className="sf-label">
                  Subject *
                </label>
                <input
                  id="contact-subject"
                  name="subject"
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={submitting}
                  className={fieldClass}
                  placeholder="How can we help?"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="contact-message" className="sf-label">
                  Your message *
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={submitting}
                  className={`${textareaClass} resize-y`}
                  placeholder="Write your message here…"
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-[#475467] sm:col-span-2">
                <input
                  type="checkbox"
                  checked={saveInfo}
                  onChange={(e) => setSaveInfo(e.target.checked)}
                  disabled={submitting}
                  className="sf-checkbox"
                />
                <span>Save my name and email in this browser for the next time I send a message.</span>
              </label>
              {feedback ? (
                <p
                  className={`text-sm sm:col-span-2 ${feedback.kind === 'ok' ? 'text-emerald-700' : 'text-red-600'}`}
                  role="status"
                >
                  {feedback.text}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={submitting}
                className="sf-btn-primary mt-1 w-full py-3 text-sm sm:col-span-2"
              >
                {submitting ? 'Sending…' : 'Send message'}
              </button>
            </form>
          </div>

          {/* Sidebar — aligns with checkout aside: white panel, #e5ecf6 border family */}
          <aside className="flex flex-col gap-0 bg-[#f8fafc] p-6 sm:p-8 lg:pb-10">
            <div className="flex gap-4 border-b border-[#e5ecf6] pb-6">
              <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#d7e4f6] bg-white text-[#0989ff] shadow-sm">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              <div className="min-w-0 text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-[#7c8ea6]">Email & phone</p>
                <a href={`mailto:${settings.primaryEmail}`} className="mt-1 block font-medium text-[#0f1f40] hover:text-[#0989ff]">
                  {settings.primaryEmail}
                </a>
                <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="mt-1 block text-[#475467] hover:text-[#0989ff]">
                  {settings.phone}
                </a>
                {settings.supportEmail !== settings.primaryEmail ? (
                  <p className="mt-2 text-xs text-[#7c8ea6]">
                    Support:{' '}
                    <a href={`mailto:${settings.supportEmail}`} className="text-[#475467] hover:text-[#0989ff]">
                      {settings.supportEmail}
                    </a>
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex gap-4 border-b border-[#e5ecf6] py-6">
              <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#d7e4f6] bg-white text-[#0989ff] shadow-sm">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              <div className="min-w-0 text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-[#7c8ea6]">Address</p>
                <p className="mt-1 leading-relaxed text-[#475467]">{settings.addressLine}</p>
              </div>
            </div>

            <div className="pt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-[#7c8ea6]">Find us on social</p>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {settings.facebookUrl ? (
                  <a
                    href={settings.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d7e4f6] bg-white text-[#475467] shadow-sm transition-premium hover:border-[#0989ff] hover:text-[#0989ff]"
                    aria-label="Facebook"
                  >
                    <svg className="h-[18px] w-[18px]" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                ) : null}
                {settings.twitterUrl ? (
                  <a
                    href={settings.twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d7e4f6] bg-white text-[#475467] shadow-sm transition-premium hover:border-[#0989ff] hover:text-[#0989ff]"
                    aria-label="X (Twitter)"
                  >
                    <svg className="h-[18px] w-[18px]" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
                ) : null}
                {settings.youtubeUrl ? (
                  <a
                    href={settings.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d7e4f6] bg-white text-[#475467] shadow-sm transition-premium hover:border-[#0989ff] hover:text-[#0989ff]"
                    aria-label="YouTube"
                  >
                    <svg className="h-[18px] w-[18px]" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </a>
                ) : null}
                {settings.instagramUrl ? (
                  <a
                    href={settings.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d7e4f6] bg-white text-[#475467] shadow-sm transition-premium hover:border-[#0989ff] hover:text-[#0989ff]"
                    aria-label="Instagram"
                  >
                    <svg className="h-[18px] w-[18px]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </a>
                ) : null}
                {settings.pinterestUrl ? (
                  <a
                    href={settings.pinterestUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d7e4f6] bg-white text-[#475467] shadow-sm transition-premium hover:border-[#0989ff] hover:text-[#0989ff]"
                    aria-label="Pinterest"
                  >
                    <svg className="h-[18px] w-[18px]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.372-12 12 0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.214 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.123.347 2.306.535 3.55.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/></svg>
                  </a>
                ) : null}
              </div>
            </div>
          </aside>
        </div>

        {settings.mapEmbedUrl ? (
          <div className="border-t border-[#e5ecf6] bg-[#f8fafc]">
            <p className="px-6 pt-4 text-xs font-medium uppercase tracking-wide text-[#7c8ea6] sm:px-8">Location</p>
            <div className="p-4 pt-2 sm:p-6 sm:pt-2">
              <div className="overflow-hidden rounded-md border border-[#e5ecf6] bg-white">
                <iframe
                  title="Location map"
                  src={settings.mapEmbedUrl}
                  className="h-[min(380px,45vh)] w-full border-0 sm:h-[400px]"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
