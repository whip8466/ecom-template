'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

/** Phoenix theme tokens */
const P = {
  primary: '#3874ff',
  primaryLight: '#b8d0ff',
  primarySoft: '#e8f0ff',
  border: '#e3e6ed',
  text: '#31374a',
  muted: '#6e7891',
  muted2: '#9aa3b8',
  orange: '#fa6238',
  surface: '#f9fafb',
  card: '#ffffff',
};

type OrderTabCounts = {
  all: number;
  pendingPayment: number;
  unfulfilled: number;
  completed: number;
  failed: number;
  cancelled: number;
  shipped: number;
};

const orderBars = [
  { completed: 85, pending: 15 },
  { completed: 70, pending: 30 },
  { completed: 90, pending: 10 },
  { completed: 65, pending: 35 },
  { completed: 95, pending: 5 },
  { completed: 80, pending: 20 },
  { completed: 88, pending: 12 },
];

const customerLinePoints = [30, 45, 40, 65, 55, 70, 90];
const totalSellsA = [20, 35, 28, 50, 45, 60, 55, 70, 78, 72, 85, 90];
const totalSellsB = [15, 28, 22, 40, 38, 50, 48, 58, 65, 60, 72, 78];

const topCoupons = [
  { name: 'Percentage discount', value: 72, color: '#3874ff' },
  { name: 'Fixed card discount', value: 18, color: '#6b9cff' },
  { name: 'Fixed product discount', value: 10, color: '#b8d0ff' },
];

const payingSplit = { paying: 30, nonPaying: 70 };

const reviews = [
  {
    product: 'Apple iPhone 13',
    productDesc: 'Phones',
    customer: 'Carry Anna',
    rating: 5,
    review: 'Great product, fast delivery and excellent packaging.',
    status: 'APPROVED' as const,
    time: 'Just now',
    img: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=80&h=80&fit=crop',
  },
  {
    product: 'MacBook Pro 14"',
    productDesc: 'Laptops',
    customer: 'Milind Mikuja',
    rating: 5,
    review: 'Solid build quality and amazing display.',
    status: 'APPROVED' as const,
    time: 'Nov 08, 8:53 AM',
    img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=80&h=80&fit=crop',
  },
  {
    product: 'Wireless Earbuds Pro',
    productDesc: 'Audio',
    customer: 'Sarah Miller',
    rating: 4,
    review: 'Good sound quality for the price.',
    status: 'PENDING' as const,
    time: '2 hours ago',
    img: 'https://images.unsplash.com/photo-1598331668826-20cecc596b86?w=80&h=80&fit=crop',
  },
  {
    product: 'Portable Bluetooth Speaker',
    productDesc: 'Audio',
    customer: 'James Wilson',
    rating: 5,
    review: 'Love it for outdoor use.',
    status: 'APPROVED' as const,
    time: '5 hours ago',
    img: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=80&h=80&fit=crop',
  },
  {
    product: 'Smart Home Hub',
    productDesc: 'Electronics',
    customer: 'Emily Brown',
    rating: 3,
    review: 'Setup was a bit tricky but works well now.',
    status: 'PENDING' as const,
    time: '1 day ago',
    img: 'https://images.unsplash.com/photo-1558002038-10559092a5d1?w=80&h=80&fit=crop',
  },
];

const regions = [
  { country: 'India', flag: '🇮🇳', users: '92,620', usersPct: '24.5%', transactions: '86', transPct: '36.4%', revenue: '$5,758', revPct: '36.5%', conv: '10.32%' },
  { country: 'China', flag: '🇨🇳', users: '81,250', usersPct: '21.5%', transactions: '62', transPct: '26.3%', revenue: '$4,258', revPct: '27.0%', conv: '8.12%' },
  { country: 'USA', flag: '🇺🇸', users: '64,830', usersPct: '17.2%', transactions: '42', transPct: '17.8%', revenue: '$2,845', revPct: '18.0%', conv: '6.48%' },
  { country: 'South Korea', flag: '🇰🇷', users: '42,150', usersPct: '11.2%', transactions: '28', transPct: '11.9%', revenue: '$1,658', revPct: '10.5%', conv: '6.64%' },
  { country: 'Vietnam', flag: '🇻🇳', users: '38,420', usersPct: '10.2%', transactions: '18', transPct: '7.6%', revenue: '$1,239', revPct: '7.9%', conv: '4.69%' },
];

/** Mar 15 – Mar 24 (Phoenix reference) */
const projectionData = [
  { date: '15', projected: 62, actual: 55 },
  { date: '16', projected: 58, actual: 62 },
  { date: '17', projected: 70, actual: 68 },
  { date: '18', projected: 65, actual: 72 },
  { date: '19', projected: 78, actual: 74 },
  { date: '20', projected: 72, actual: 80 },
  { date: '21', projected: 68, actual: 76 },
  { date: '22', projected: 82, actual: 85 },
  { date: '23', projected: 75, actual: 78 },
  { date: '24', projected: 88, actual: 82 },
];

/** Percent-style values 0–100 for Feb–Nov */
const returningLines = [
  { label: 'Fourth time', values: [22, 28, 32, 38, 42, 48, 52, 58, 62, 68], color: '#3874ff' },
  { label: 'Third time', values: [35, 40, 45, 50, 55, 58, 62, 68, 72, 76], color: '#6b9cff' },
  { label: 'Second time', values: [48, 52, 58, 62, 68, 72, 76, 80, 85, 90], color: '#b8d0ff' },
];
const returningMonths = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];

function cardClass() {
  return 'rounded-admin-card border border-[#e3e6ed] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';
}

function BarChart({ data, max = 100 }: { data: typeof orderBars; max?: number }) {
  return (
    <div className="flex h-16 items-end gap-1">
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col justify-end gap-0.5">
          <div
            className="w-full rounded-none"
            style={{ height: `${(d.completed / max) * 100}%`, minHeight: '4px', backgroundColor: P.primary }}
          />
          <div
            className="w-full rounded-none"
            style={{ height: `${(d.pending / max) * 100}%`, minHeight: '4px', backgroundColor: P.primaryLight }}
          />
        </div>
      ))}
    </div>
  );
}

function DualLineAreaChart({ a, b, height = 160 }: { a: number[]; b: number[]; height?: number }) {
  const w = 100;
  const pad = 4;
  const max = Math.max(...a, ...b, 1);
  const min = Math.min(...a, ...b, 0);
  const range = max - min || 1;
  const innerH = height - pad * 2;
  const step = w / (a.length - 1);

  const linePath = (pts: number[]) =>
    pts
      .map((p, i) => {
        const x = i * step;
        const y = pad + innerH - ((p - min) / range) * innerH;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

  const areaPath = (pts: number[]) => {
    const base = pad + innerH;
    const top = pts
      .map((p, i) => {
        const x = i * step;
        const y = pad + innerH - ((p - min) / range) * innerH;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
    return `${top} L ${w} ${base} L 0 ${base} Z`;
  };

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="h-48 w-full" preserveAspectRatio="none">
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <line
          key={t}
          x1={0}
          x2={w}
          y1={pad + innerH * (1 - t)}
          y2={pad + innerH * (1 - t)}
          stroke="#eef1f6"
          strokeWidth={0.5}
        />
      ))}
      <defs>
        <linearGradient id="phxDashArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={P.primary} />
          <stop offset="100%" stopColor={P.primary} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath(a)} fill="url(#phxDashArea)" opacity={0.28} />
      <path
        d={linePath(a)}
        fill="none"
        stroke={P.primary}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={linePath(b)}
        fill="none"
        stroke="#9db7ff"
        strokeWidth={1.1}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="5 4"
      />
    </svg>
  );
}

/** Radial gauge — dominant metric 72% (Phoenix “Top coupons”) */
function RadialCouponGauge({ percent }: { percent: number }) {
  const r = 38;
  const cx = 50;
  const cy = 50;
  const c = 2 * Math.PI * r;
  const dash = (percent / 100) * c;
  return (
    <div className="relative flex h-[120px] w-[120px] shrink-0 items-center justify-center">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#eef1f6" strokeWidth={9} />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={P.primary}
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      <span className="pointer-events-none absolute text-center">
        <span className="block text-2xl font-bold tabular-nums text-[#31374a]">{percent}%</span>
      </span>
    </div>
  );
}

/** Semi-circle doughnut — paying vs non-paying (Phoenix-style arc) */
function SemiDonutPaying({ paying, nonPaying }: { paying: number; nonPaying: number }) {
  const total = paying + nonPaying || 1;
  const sweep = (paying / total) * 180;
  return (
    <div className="relative mx-auto flex h-[120px] w-[200px] items-end justify-center">
      <div className="relative h-[100px] w-[200px] overflow-hidden">
        <div
          className="absolute inset-x-0 bottom-0 mx-auto h-[200px] w-[200px] rounded-full"
          style={{
            background: `conic-gradient(from 180deg at 50% 100%, ${P.primary} 0deg ${sweep}deg, #dbe6ff ${sweep}deg 180deg)`,
          }}
        />
        <div className="absolute left-1/2 top-1/2 h-[100px] w-[100px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[inset_0_0_0_1px_#e3e6ed]" />
      </div>
      <span className="absolute bottom-7 text-[15px] font-bold text-[#31374a]">{paying}%</span>
    </div>
  );
}

function WorldMapVisual() {
  const pins = [
    { x: 72, y: 42, c: '#fa6238' },
    { x: 48, y: 38, c: '#25c16f' },
    { x: 22, y: 36, c: '#3874ff' },
    { x: 78, y: 48, c: '#3874ff' },
    { x: 55, y: 52, c: '#fa6238' },
  ];
  return (
    <div
      className="relative flex h-64 items-center justify-center overflow-hidden rounded-admin-card border bg-linear-to-b from-[#f5f7fa] to-[#eef1f6]"
      style={{ borderColor: P.border }}
    >
      <svg viewBox="0 0 320 160" className="h-full w-full opacity-[0.95]" aria-hidden>
        <ellipse cx="160" cy="88" rx="138" ry="56" fill="#e8ecf2" opacity={0.85} />
        <path
          d="M38 78 Q95 52 150 68 Q210 58 268 75 Q295 82 305 96"
          fill="none"
          stroke="#d1d9e6"
          strokeWidth={1.2}
        />
        <path
          d="M48 98 Q120 112 175 102 Q240 92 288 88"
          fill="none"
          stroke="#d1d9e6"
          strokeWidth={0.9}
          opacity={0.85}
        />
        {pins.map((p, i) => (
          <g key={i} transform={`translate(${(p.x / 100) * 320}, ${(p.y / 100) * 160})`}>
            <circle r={11} fill={p.c} opacity={0.18} />
            <circle r={5.5} fill={p.c} />
          </g>
        ))}
      </svg>
      <p className="pointer-events-none absolute bottom-3 left-3 text-xs" style={{ color: P.muted2 }}>
        Revenue by region
      </p>
    </div>
  );
}

export function EcommerceDashboard() {
  const token = useAuthStore((s) => s.token);
  const [counts, setCounts] = useState<OrderTabCounts | null>(null);
  const [outOfStock, setOutOfStock] = useState<number | null>(null);

  const loadStats = useCallback(async () => {
    if (!token) {
      setCounts(null);
      setOutOfStock(null);
      return;
    }
    try {
      const [ordersRes, productsRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/orders?page=1&limit=1&view=all`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/api/products?page=1&limit=50&status=all`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const ordersJson = (await ordersRes.json()) as { counts?: OrderTabCounts };
      if (ordersRes.ok && ordersJson.counts) setCounts(ordersJson.counts);

      const productsJson = (await productsRes.json()) as {
        data?: { stock: number; variants?: { stock: number }[] }[];
      };
      if (productsRes.ok && Array.isArray(productsJson.data)) {
        const out = productsJson.data.filter((p) => {
          const variants = p.variants;
          if (variants && variants.length > 0) {
            return variants.every((v) => (v.stock ?? 0) <= 0);
          }
          return (p.stock ?? 0) <= 0;
        }).length;
        setOutOfStock(out);
      }
    } catch {
      setCounts(null);
      setOutOfStock(null);
    }
  }, [token]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const newOrders = counts?.pendingPayment ?? 57;
  const onHold = counts?.unfulfilled ?? 5;
  const stockOut = outOfStock ?? 15;

  const statusCards = [
    {
      title: `${newOrders} new orders`,
      sub: 'Awaiting processing',
      iconBg: 'bg-[#e8faf0] text-[#25c16f]',
      icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6z" />
        </svg>
      ),
    },
    {
      title: `${onHold} orders`,
      sub: 'On hold',
      iconBg: 'bg-[#fff5f0] text-[#fa6238]',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      title: `${stockOut} products`,
      sub: 'Out of stock',
      iconBg: 'bg-[#ffecec] text-[#e63838]',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
  ];

  const borderStyle = { borderColor: P.border };

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 pb-2 font-sans">
      <div>
        <h1 className="text-[1.375rem] font-bold tracking-tight text-[#31374a]">Ecommerce Dashboard</h1>
        <p className="mt-1 text-sm" style={{ color: P.muted }}>
          Here&apos;s what&apos;s going on at your business right now
        </p>
      </div>

      {/* Row 1: 3 status cards + 2 KPIs (Phoenix single band) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-12">
        {statusCards.map((card) => (
          <div
            key={card.title}
            className={`flex items-center justify-between gap-3 p-4 xl:col-span-2 ${cardClass()}`}
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-snug text-[#31374a]">{card.title}</p>
              <p className="mt-0.5 text-xs" style={{ color: P.muted }}>
                {card.sub}
              </p>
            </div>
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-admin ${card.iconBg}`}>{card.icon}</div>
          </div>
        ))}

        <div className="rounded-admin-card border border-[#e3e6ed] bg-white p-5 sm:col-span-1 xl:col-span-3">
          <p className="text-xs font-medium" style={{ color: P.muted }}>
            Total orders
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="rounded bg-[#fff5f0] px-1.5 py-0.5 text-xs font-semibold text-[#fa6238]">-0.9%</span>
          </div>
          <p className="mt-1 text-[1.65rem] font-bold tabular-nums leading-tight text-[#31374a]">16,247</p>
          <p className="mt-2 text-xs" style={{ color: P.muted2 }}>
            Last 7 days
          </p>
          <div className="mt-3">
            <BarChart data={orderBars} />
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs" style={{ color: P.muted }}>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-admin" style={{ backgroundColor: P.primary }} /> Completed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-admin" style={{ backgroundColor: P.primaryLight }} /> Pending payment
            </span>
          </div>
        </div>

        <div className="rounded-admin-card border border-[#e3e6ed] bg-white p-5 sm:col-span-1 xl:col-span-3">
          <p className="text-xs font-medium" style={{ color: P.muted }}>
            New customers
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="rounded bg-[#fff5f0] px-1.5 py-0.5 text-xs font-semibold text-[#fa6238]">+26.5%</span>
          </div>
          <p className="mt-1 text-[1.65rem] font-bold tabular-nums leading-tight text-[#31374a]">356</p>
          <p className="mt-2 text-xs" style={{ color: P.muted2 }}>
            Last 7 days
          </p>
          <div className="mt-3 h-14">
            <svg viewBox="0 0 100 48" className="h-full w-full" preserveAspectRatio="none">
              <path
                d={`M 0 ${48 - customerLinePoints[0] * 0.4} ${customerLinePoints
                  .map((p, i) => `L ${(i / (customerLinePoints.length - 1)) * 100} ${48 - p * 0.4}`)
                  .join(' ')}`}
                fill="none"
                stroke={P.primary}
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Middle: Total sells + coupons + paying */}
      <div className="grid gap-4 lg:grid-cols-12 lg:grid-rows-2">
        <div className="rounded-admin-card border bg-white p-5 lg:col-span-6 lg:row-span-2" style={borderStyle}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#31374a]">Total sells</h2>
              <p className="text-xs" style={{ color: P.muted2 }}>
                Payment received across all channels
              </p>
            </div>
            <div
              className="flex items-center gap-2 rounded-admin border bg-[#f5f7fa] px-3 py-1.5 text-xs font-medium"
              style={{ borderColor: P.border, color: P.muted }}
            >
              Mar 1 – 31, 2022
              <svg className="h-3.5 w-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <DualLineAreaChart a={totalSellsA} b={totalSellsB} />
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs" style={{ color: P.muted2 }}>
            <span className="flex items-center gap-2">
              <span className="h-2 w-4 rounded-admin" style={{ backgroundColor: P.primary }} /> Actual
            </span>
            <span className="flex items-center gap-2">
              <span className="h-0.5 w-4 border-t-2 border-dashed border-[#9db7ff]" /> Projection
            </span>
            <span>May 1 — 15 — 31</span>
          </div>
        </div>

        <div className="rounded-admin-card border bg-white p-5 lg:col-span-3" style={borderStyle}>
          <h2 className="text-base font-semibold text-[#31374a]">Top coupons</h2>
          <p className="text-xs" style={{ color: P.muted2 }}>
            Last 7 days
          </p>
          <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <RadialCouponGauge percent={72} />
            <ul className="min-w-0 flex-1 space-y-2.5 text-sm">
              {topCoupons.map((c) => (
                <li key={c.name} className="flex items-start gap-2">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="leading-snug" style={{ color: P.muted }}>
                    {c.name}{' '}
                    <span className="font-semibold text-[#31374a]">{c.value}%</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-admin-card border bg-white p-5 lg:col-span-3" style={borderStyle}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-[#31374a]">Paying vs non paying</h2>
              <p className="text-xs" style={{ color: P.muted2 }}>
                Last 7 days
              </p>
            </div>
            <span
              className="rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{ borderColor: P.border, color: P.muted }}
            >
              Customize
            </span>
          </div>
          <div className="mt-1 flex flex-col items-center gap-1 sm:flex-row sm:items-end sm:justify-between">
            <SemiDonutPaying paying={payingSplit.paying} nonPaying={payingSplit.nonPaying} />
            <ul className="space-y-2 text-sm sm:pb-2">
              <li className="flex items-center gap-2" style={{ color: P.muted }}>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: P.primary }} />
                Paying customer {payingSplit.paying}%
              </li>
              <li className="flex items-center gap-2" style={{ color: P.muted }}>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#dbe6ff' }} />
                Non-paying customer {payingSplit.nonPaying}%
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Latest reviews */}
      <div className="overflow-hidden rounded-admin-card border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]" style={borderStyle}>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b p-4 sm:p-5" style={{ borderColor: P.border }}>
          <div>
            <h2 className="text-base font-semibold text-[#31374a]">Latest reviews</h2>
            <p className="text-xs" style={{ color: P.muted2 }}>
              Customer feedback on recent purchases
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              placeholder="Search..."
              className="h-9 w-full min-w-[160px] rounded-admin border bg-[#f5f7fa] px-3 text-sm sm:w-48"
              style={{ borderColor: P.border, color: P.text }}
            />
            <button
              type="button"
              className="rounded-admin px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-95"
              style={{ backgroundColor: P.primary }}
            >
              Chat demo
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr
                className="border-b text-left text-xs font-semibold uppercase tracking-wider"
                style={{ borderColor: P.border, backgroundColor: P.surface, color: P.muted }}
              >
                <th className="w-10 p-3">
                  <input type="checkbox" className="rounded" style={{ borderColor: P.border }} aria-label="Select all" />
                </th>
                <th className="p-3">Product</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Rating</th>
                <th className="p-3">Review</th>
                <th className="p-3">Status</th>
                <th className="p-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r, i) => (
                <tr key={i} className="border-b transition hover:bg-[#f9fbff]" style={{ borderColor: P.border }}>
                  <td className="p-3">
                    <input type="checkbox" className="rounded" style={{ borderColor: P.border }} aria-label={`Row ${i + 1}`} />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img src={r.img} alt="" className="h-11 w-11 rounded-admin border object-cover" style={{ borderColor: P.border }} />
                      <div>
                        <button type="button" className="text-left font-medium hover:underline" style={{ color: P.primary }}>
                          {r.product}
                        </button>
                        <p className="text-xs" style={{ color: P.muted2 }}>
                          {r.productDesc}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                        style={{ backgroundColor: P.primarySoft, color: P.primary }}
                      >
                        {r.customer.charAt(0)}
                      </span>
                      <span className="text-[#344256]">{r.customer}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="flex gap-0.5 text-[#fa6238]" aria-label={`${r.rating} of 5`}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <span key={j}>{j < r.rating ? '★' : '☆'}</span>
                      ))}
                    </span>
                  </td>
                  <td className="max-w-[220px] truncate p-3" style={{ color: P.muted }}>
                    {r.review}
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        r.status === 'APPROVED' ? 'bg-[#e8faf0] text-[#14804a]' : 'bg-[#fff5f0] text-[#c45a12]'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap p-3" style={{ color: P.muted2 }}>
                    {r.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm"
          style={{ borderColor: P.border, color: P.muted }}
        >
          <span>1 to 6 items of 10</span>
          <div className="flex items-center gap-3">
            <button type="button" className="font-medium hover:underline" style={{ color: P.primary }}>
              View all
            </button>
            <div className="flex gap-1">
              <button
                type="button"
                className="rounded border px-2 py-1 text-[#31374a] hover:bg-[#f5f7fa]"
                style={{ borderColor: P.border }}
              >
                Previous
              </button>
              <button
                type="button"
                className="rounded border px-2 py-1 text-[#31374a] hover:bg-[#f5f7fa]"
                style={{ borderColor: P.border }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Regions + map */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-admin-card border bg-white p-5" style={borderStyle}>
          <h2 className="text-base font-semibold text-[#31374a]">Top regions by revenue</h2>
          <p className="text-xs" style={{ color: P.muted2 }}>
            Where you generated most of the revenue
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Users', value: '377,620' },
              { label: 'Transactions', value: '236' },
              { label: 'Revenue', value: '$15,758' },
              { label: 'Conv. rate', value: '10.32%' },
            ].map((k) => (
              <div key={k.label} className="rounded-admin px-3 py-2 text-center" style={{ backgroundColor: P.surface }}>
                <p className="text-sm font-bold text-[#31374a]">{k.value}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: P.muted2 }}>
                  {k.label}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-semibold uppercase" style={{ borderColor: P.border, color: P.muted2 }}>
                  <th className="py-2.5">Country</th>
                  <th className="py-2.5">Users</th>
                  <th className="py-2.5">Transactions</th>
                  <th className="py-2.5">Revenue</th>
                  <th className="py-2.5">Conv rate</th>
                </tr>
              </thead>
              <tbody>
                {regions.map((row, i) => (
                  <tr key={i} className="border-b last:border-0" style={{ borderColor: P.border }}>
                    <td className="py-2.5 font-medium text-[#31374a]">
                      {row.flag} {row.country}
                    </td>
                    <td className="py-2.5" style={{ color: P.muted }}>
                      {row.users} <span style={{ color: P.muted2 }}>({row.usersPct})</span>
                    </td>
                    <td className="py-2.5" style={{ color: P.muted }}>
                      {row.transactions} <span style={{ color: P.muted2 }}>({row.transPct})</span>
                    </td>
                    <td className="py-2.5" style={{ color: P.muted }}>
                      {row.revenue} <span style={{ color: P.muted2 }}>({row.revPct})</span>
                    </td>
                    <td className="py-2.5" style={{ color: P.muted }}>
                      {row.conv}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm" style={{ color: P.muted }}>
            <span>1 to 5 of 10</span>
            <div className="flex gap-1">
              <button type="button" className="rounded border px-2 py-1 hover:bg-[#f5f7fa]" style={{ borderColor: P.border }}>
                Previous
              </button>
              <button type="button" className="rounded border px-2 py-1 hover:bg-[#f5f7fa]" style={{ borderColor: P.border }}>
                Next
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-admin-card border bg-white p-5" style={borderStyle}>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#31374a]">World map</h2>
            <div className="flex gap-0.5 rounded-admin border p-0.5" style={{ borderColor: P.border, backgroundColor: P.surface }}>
              <button type="button" className="rounded px-2 py-0.5 text-sm hover:bg-white" style={{ color: P.muted }}>
                +
              </button>
              <button type="button" className="rounded px-2 py-0.5 text-sm hover:bg-white" style={{ color: P.muted }}>
                −
              </button>
            </div>
          </div>
          <div className="mt-4">
            <WorldMapVisual />
          </div>
        </div>
      </div>

      {/* Projection + returning */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-admin-card border bg-white p-5" style={borderStyle}>
          <h2 className="text-base font-semibold text-[#31374a]">Projection vs actual</h2>
          <p className="text-xs" style={{ color: P.muted2 }}>
            Actual earnings vs projection earnings
          </p>
          <div className="mt-6 flex h-44 items-end justify-between gap-1 px-0.5">
            {projectionData.map((d, i) => (
              <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex h-36 w-full max-w-[36px] items-end justify-center gap-0.5">
                  <div
                    className="w-1/2 max-w-[14px] rounded-none"
                    style={{ height: `${d.projected}%`, minHeight: '8%', backgroundColor: '#b8d0ff' }}
                  />
                  <div
                    className="w-1/2 max-w-[14px] rounded-none"
                    style={{ height: `${d.actual}%`, minHeight: '8%', backgroundColor: P.primary }}
                  />
                </div>
                <span className="text-[10px] font-medium" style={{ color: P.muted2 }}>
                  {d.date}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-1 text-center text-[10px] font-medium" style={{ color: P.muted2 }}>
            Mar 15 — Mar 24
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-6 text-xs" style={{ color: P.muted }}>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-admin" style={{ backgroundColor: '#b8d0ff' }} /> Projected revenue
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-admin" style={{ backgroundColor: P.primary }} /> Actual revenue
            </span>
          </div>
        </div>

        <div className="rounded-admin-card border bg-white p-5" style={borderStyle}>
          <h2 className="text-base font-semibold text-[#31374a]">Returning customer rate</h2>
          <p className="text-xs" style={{ color: P.muted2 }}>
            Rate of customers returning to your shop over time
          </p>
          <div className="relative mt-2 h-44">
            <svg viewBox="0 0 300 110" className="h-full w-full" preserveAspectRatio="none">
              {[0, 25, 50, 75, 100].map((pct) => (
                <g key={pct}>
                  <line
                    x1={28}
                    x2={292}
                    y1={10 + (100 - pct) * 0.75}
                    y2={10 + (100 - pct) * 0.75}
                    stroke="#eef1f6"
                    strokeWidth={0.6}
                  />
                  <text
                    x={22}
                    y={14 + (100 - pct) * 0.75}
                    textAnchor="end"
                    className="fill-[#9aa3b8] text-[8px]"
                    fontSize="8"
                  >
                    {pct}%
                  </text>
                </g>
              ))}
              {returningLines.map((line, idx) => {
                const coords = line.values.map((v, i) => {
                  const x = 28 + (i / (line.values.length - 1)) * 264;
                  const y = 10 + (100 - v) * 0.75;
                  return [x, y] as const;
                });
                const d = `M ${coords[0][0]} ${coords[0][1]}${coords.slice(1).map(([x, y]) => ` L ${x} ${y}`).join('')}`;
                return (
                  <path
                    key={line.label}
                    d={d}
                    fill="none"
                    stroke={line.color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={idx === 1 ? '6 4' : idx === 2 ? '3 3' : '0'}
                  />
                );
              })}
            </svg>
          </div>
          <div className="mt-1 flex flex-wrap justify-center gap-4 text-xs">
            {returningLines.map((l) => (
              <span key={l.label} className="flex items-center gap-1.5" style={{ color: P.muted }}>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
          <p className="mt-2 text-center text-xs" style={{ color: P.muted2 }}>
            {returningMonths.join(' — ')}
          </p>
        </div>
      </div>

      <footer
        className="flex flex-col gap-2 border-t pt-6 text-sm sm:flex-row sm:items-center sm:justify-between"
        style={{ borderColor: P.border, color: P.muted2 }}
      >
        <span>Thank you for creating with Phoenix Tailwind | 2023 © ThemeWagon</span>
        <span>v1.8.0</span>
      </footer>
    </div>
  );
}
