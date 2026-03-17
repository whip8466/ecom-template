'use client';

import { useState } from 'react';

const summaryCards = [
  { value: '57', label: 'new orders', sub: 'Awaiting processing', icon: '★', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { value: '5', label: 'orders', sub: 'On hold', icon: '✋', color: 'text-amber-600', bg: 'bg-amber-50' },
  { value: '15', label: 'products', sub: 'Out of stock', icon: '▣', color: 'text-red-600', bg: 'bg-red-50' },
];

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

const totalSellsPoints = [20, 35, 28, 50, 45, 60, 55, 70, 78, 72, 85, 90];
const totalSellsPoints2 = [15, 28, 22, 40, 38, 50, 48, 58, 65, 60, 72, 78];

const topCoupons = [
  { name: 'Promo BOGO discount', value: 72, color: '#246bfd' },
  { name: 'Fixed case discount', value: 18, color: '#5b7cff' },
  { name: 'Fixed amount discount', value: 10, color: '#1e5ae0' },
];

const payingVsNon = [
  { name: 'Paying customer', value: 79, color: '#1e5ae0' },
  { name: 'Non-paying customer', value: 21, color: '#91b4ff' },
];

const reviews = [
  { product: 'iBall Sense Advanced Smartwatch', productDesc: 'Smartwatch', customer: 'Richard Dawson', rating: 5, review: 'Great product, fast delivery...', status: 'APPROVED', time: 'Just now', img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&h=80&fit=crop' },
  { product: 'Wireless Earbuds Pro', productDesc: 'Audio', customer: 'Sarah Miller', rating: 4, review: 'Good sound quality...', status: 'PENDING', time: '2 hours ago', img: 'https://images.unsplash.com/photo-1598331668826-20cecc596b86?w=80&h=80&fit=crop' },
  { product: 'Portable Bluetooth Speaker', productDesc: 'Audio', customer: 'James Wilson', rating: 5, review: 'Love it for outdoor use...', status: 'APPROVED', time: '5 hours ago', img: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=80&h=80&fit=crop' },
  { product: 'Smart Home Hub', productDesc: 'Electronics', customer: 'Emily Brown', rating: 3, review: 'Setup was a bit tricky...', status: 'PENDING', time: '1 day ago', img: 'https://images.unsplash.com/photo-1558002038-10559092a5d1?w=80&h=80&fit=crop' },
  { product: 'Fitness Tracker Band', productDesc: 'Wearables', customer: 'Michael Davis', rating: 5, review: 'Accurate and comfortable...', status: 'APPROVED', time: '2 days ago', img: 'https://images.unsplash.com/photo-1576243345690-4e4b79b63288?w=80&h=80&fit=crop' },
];

const regions = [
  { country: 'India', flag: '🇮🇳', users: '92,620', usersPct: '24.5%', transactions: '86', transPct: '36.4%', revenue: '$5,758', revPct: '36.5%', conv: '10.32%' },
  { country: 'China', flag: '🇨🇳', users: '81,250', usersPct: '21.5%', transactions: '62', transPct: '26.3%', revenue: '$4,258', revPct: '27.0%', conv: '8.12%' },
  { country: 'USA', flag: '🇺🇸', users: '64,830', usersPct: '17.2%', transactions: '42', transPct: '17.8%', revenue: '$2,845', revPct: '18.0%', conv: '6.48%' },
  { country: 'South Korea', flag: '🇰🇷', users: '42,150', usersPct: '11.2%', transactions: '28', transPct: '11.9%', revenue: '$1,658', revPct: '10.5%', conv: '6.64%' },
  { country: 'Vietnam', flag: '🇻🇳', users: '38,420', usersPct: '10.2%', transactions: '18', transPct: '7.6%', revenue: '$1,239', revPct: '7.9%', conv: '4.69%' },
];

const projectionData = [
  { date: 'Mar 07', projected: 65, actual: 58 },
  { date: 'Mar 11', projected: 72, actual: 75 },
  { date: 'Mar 21', projected: 68, actual: 62 },
  { date: 'Mar 25', projected: 80, actual: 85 },
];

const returningLines = [
  { label: 'Fourth time', values: [8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28], color: '#246bfd' },
  { label: 'Third time', values: [15, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36], color: '#5b7cff' },
  { label: 'Second time', values: [25, 28, 30, 32, 35, 38, 40, 42, 45, 48, 50], color: '#91b4ff' },
];
const returningMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];

function BarChart({ data, max = 100, completedKey = 'completed', pendingKey = 'pending' }: { data: typeof orderBars; max?: number; completedKey?: string; pendingKey?: string }) {
  return (
    <div className="flex h-16 items-end gap-1">
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col gap-0.5">
          <div className="flex flex-1 flex-col justify-end gap-0.5">
            <div
              className="h-1.5 w-full rounded-sm bg-[#246bfd]"
              style={{ height: `${((d as Record<string, number>)[completedKey] / max) * 100}%` || '4px', minHeight: '4px' }}
            />
            <div
              className="h-1.5 w-full rounded-sm bg-[#91b4ff]"
              style={{ height: `${((d as Record<string, number>)[pendingKey] / max) * 100}%` || '4px', minHeight: '4px' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function SimpleLineChart({ points, color = '#246bfd', height = 48 }: { points: number[]; color?: string; height?: number }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const w = 100 / (points.length - 1);
  const path = points
    .map((p, i) => `${i * w},${height - ((p - min) / range) * (height - 4)}`)
    .join(' L ');
  return (
    <svg viewBox={`0 0 100 ${height}`} className="h-12 w-full" preserveAspectRatio="none">
      <path d={`M ${path}`} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DonutChart({ data, size = 120 }: { data: { value: number; color: string }[]; size?: number }) {
  let total = 0;
  data.forEach((d) => { total += d.value; });
  if (total === 0) total = 1;
  const r = 36;
  const cx = 50;
  const cy = 50;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg viewBox="0 0 100 100" className="shrink-0" width={size} height={size}>
      {data.map((s, i) => {
        const pct = s.value / total;
        const dash = circumference * pct;
        const gap = circumference - dash;
        const rot = (offset / circumference) * 360;
        offset += circumference * pct;
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={24}
            strokeDasharray={`${dash} ${gap}`}
            transform={`rotate(${-90 + rot} ${cx} ${cy})`}
          />
        );
      })}
    </svg>
  );
}

export default function AdminDashboardPage() {
  const [reviewPage, setReviewPage] = useState(1);
  const [regionPage, setRegionPage] = useState(1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1c2740]">Ecommerce Dashboard</h1>
        <p className="mt-1 text-sm text-[#60759b]">Here&apos;s what&apos;s going on at your business right now</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-[#e5ebf5] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#1c2740]">
                  {card.value} <span className="text-sm font-normal text-[#60759b]">{card.label}</span>
                </p>
                <p className="mt-1 text-xs text-[#8ea0bf]">{card.sub}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bg} text-lg ${card.color}`}>{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* KPI row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[#e5ebf5] bg-white p-5 shadow-sm">
          <p className="text-xs text-[#60759b]">Total orders -0.01%</p>
          <p className="mt-1 text-2xl font-bold text-[#1c2740]">16,247</p>
          <p className="mt-2 text-xs text-[#8ea0bf]">Last 7 days</p>
          <div className="mt-3 h-16">
            <BarChart data={orderBars} max={100} />
          </div>
          <div className="mt-2 flex gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#246bfd]" /> Completed</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#91b4ff]" /> Pending payment</span>
          </div>
        </div>
        <div className="rounded-xl border border-[#e5ebf5] bg-white p-5 shadow-sm">
          <p className="text-xs text-[#60759b]">New customers +20.50%</p>
          <p className="mt-1 text-2xl font-bold text-[#1c2740]">356</p>
          <p className="mt-2 text-xs text-[#8ea0bf]">Last 7 days</p>
          <div className="mt-3 h-12">
            <SimpleLineChart points={customerLinePoints} />
          </div>
        </div>
      </div>

      {/* Total sells + Top coupons + Paying vs non-paying */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-[#e5ebf5] bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold text-[#1c2740]">Total sells</h2>
              <p className="text-xs text-[#8ea0bf]">Payments received across all channels</p>
            </div>
            <div className="rounded-lg border border-[#e5ebf5] px-3 py-1.5 text-sm text-[#4f607f]">Mar 1 - 31, 2022</div>
          </div>
          <div className="mt-4 h-40">
            <SimpleLineChart points={totalSellsPoints} height={120} color="#246bfd" />
            <SimpleLineChart points={totalSellsPoints2} height={120} color="#91b4ff" />
          </div>
          <p className="mt-1 text-center text-xs text-[#8ea0bf]">03 May — 15 May — 28 May</p>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border border-[#e5ebf5] bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-[#1c2740]">Top coupons</h2>
            <p className="text-xs text-[#8ea0bf]">Last 7 days</p>
            <div className="mt-4 flex items-center gap-4">
              <DonutChart data={topCoupons} size={100} />
              <div className="space-y-1 text-sm">
                {topCoupons.map((c) => (
                  <div key={c.name} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="text-[#4f607f]">{c.name} {c.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-[#e5ebf5] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-[#1c2740]">Paying vs non-paying</h2>
                <p className="text-xs text-[#8ea0bf]">Last 7 days</p>
              </div>
              <button type="button" className="rounded border border-[#e5ebf5] px-2 py-1 text-xs font-medium text-[#4f607f] hover:bg-[#f4f7fc]">CUSTOMIZE</button>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <DonutChart data={payingVsNon} size={90} />
              <div className="space-y-1 text-sm">
                {payingVsNon.map((c) => (
                  <div key={c.name} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="text-[#4f607f]">{c.name} {c.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Latest reviews */}
      <div className="rounded-xl border border-[#e5ebf5] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5ebf5] p-4">
          <div>
            <h2 className="font-semibold text-[#1c2740]">Latest reviews</h2>
            <p className="text-xs text-[#8ea0bf]">Payments received across all channels</p>
          </div>
          <div className="flex items-center gap-2">
            <input type="search" placeholder="Search..." className="h-9 rounded-lg border border-[#e5ebf5] bg-[#f9fbff] px-3 text-sm placeholder:text-[#8ea0bf]" />
            <button type="button" className="rounded-lg bg-[#246bfd] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e5ae0]">Chat demo</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-[#e5ebf5] bg-[#f9fbff] text-left text-xs font-semibold uppercase tracking-wider text-[#8ea0bf]">
                <th className="p-3"><input type="checkbox" className="rounded border-[#c5d4ed]" /></th>
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
                <tr key={i} className="border-b border-[#e5ebf5] hover:bg-[#f9fbff]">
                  <td className="p-3"><input type="checkbox" className="rounded border-[#c5d4ed]" /></td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img src={r.img} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      <div>
                        <p className="font-medium text-[#1c2740]">{r.product}</p>
                        <p className="text-xs text-[#8ea0bf]">{r.productDesc}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef4ff] text-xs font-medium text-[#246bfd]">{r.customer.charAt(0)}</div>
                      {r.customer}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="flex gap-0.5 text-amber-500">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <span key={j}>{j < r.rating ? '★' : '☆'}</span>
                      ))}
                    </span>
                  </td>
                  <td className="max-w-[180px] truncate p-3 text-[#4f607f]">{r.review}</td>
                  <td className="p-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${r.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3 text-[#8ea0bf]">{r.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-[#e5ebf5] px-4 py-3 text-sm text-[#60759b]">
          <span>1 to 10 of 35</span>
          <div className="flex items-center gap-2">
            <button type="button" className="text-[#246bfd] hover:underline">View all</button>
            <button type="button" onClick={() => setReviewPage((p) => Math.max(1, p - 1))} className="rounded border border-[#e5ebf5] px-2 py-1 hover:bg-[#f4f7fc]">Previous</button>
            <button type="button" onClick={() => setReviewPage((p) => p + 1)} className="rounded border border-[#e5ebf5] px-2 py-1 hover:bg-[#f4f7fc]">Next</button>
          </div>
        </div>
      </div>

      {/* Top regions + Map + Projection + Returning */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[#e5ebf5] bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-[#1c2740]">Top regions by revenue</h2>
          <p className="text-xs text-[#8ea0bf]">Where you generated most of the revenue</p>
          <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
            <div><p className="font-semibold text-[#1c2740]">377,620</p><p className="text-[#8ea0bf]">USERS</p></div>
            <div><p className="font-semibold text-[#1c2740]">236</p><p className="text-[#8ea0bf]">TRANSACTIONS</p></div>
            <div><p className="font-semibold text-[#1c2740]">$15,758</p><p className="text-[#8ea0bf]">REVENUE</p></div>
            <div><p className="font-semibold text-[#1c2740]">10.32%</p><p className="text-[#8ea0bf]">CONV RATE</p></div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="border-b border-[#e5ebf5] text-left text-xs font-semibold uppercase text-[#8ea0bf]">
                  <th className="py-2">Country</th>
                  <th className="py-2">Users</th>
                  <th className="py-2">Transactions</th>
                  <th className="py-2">Revenue</th>
                  <th className="py-2">Conv rate</th>
                </tr>
              </thead>
              <tbody>
                {regions.map((row, i) => (
                  <tr key={i} className="border-b border-[#e5ebf5]">
                    <td className="py-2 font-medium text-[#1c2740]">{row.flag} {row.country}</td>
                    <td className="py-2 text-[#4f607f]">{row.users} <span className="text-[#8ea0bf]">({row.usersPct})</span></td>
                    <td className="py-2 text-[#4f607f]">{row.transactions} <span className="text-[#8ea0bf]">({row.transPct})</span></td>
                    <td className="py-2 text-[#4f607f]">{row.revenue} <span className="text-[#8ea0bf]">({row.revPct})</span></td>
                    <td className="py-2 text-[#4f607f]">{row.conv}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm text-[#60759b]">
            <span>1 to 5 of 10</span>
            <div className="flex gap-1">
              <button type="button" onClick={() => setRegionPage((p) => Math.max(1, p - 1))} className="rounded border border-[#e5ebf5] px-2 py-1 hover:bg-[#f4f7fc]">Previous</button>
              <button type="button" onClick={() => setRegionPage((p) => p + 1)} className="rounded border border-[#e5ebf5] px-2 py-1 hover:bg-[#f4f7fc]">Next</button>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-[#e5ebf5] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[#1c2740]">World map</h2>
            <div className="flex gap-1 rounded border border-[#e5ebf5] bg-white p-1">
              <button type="button" className="rounded px-2 py-0.5 text-sm text-[#4f607f] hover:bg-[#f4f7fc]">+</button>
              <button type="button" className="rounded px-2 py-0.5 text-sm text-[#4f607f] hover:bg-[#f4f7fc]">−</button>
            </div>
          </div>
          <div className="mt-4 flex h-64 items-center justify-center rounded-lg border border-[#e5ebf5] bg-[#f9fbff] text-[#8ea0bf]">
            Map placeholder (pins: 18, 19, …)
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[#e5ebf5] bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-[#1c2740]">Projection vs actual</h2>
          <p className="text-xs text-[#8ea0bf]">Actual earnings vs projection earnings</p>
          <div className="mt-4 flex h-40 items-end justify-around gap-2">
            {projectionData.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full flex-1 items-end justify-center gap-0.5">
                  <div className="w-1/2 rounded-t bg-[#91b4ff]" style={{ height: `${d.projected}%`, minHeight: '4px' }} />
                  <div className="w-1/2 rounded-t bg-[#246bfd]" style={{ height: `${d.actual}%`, minHeight: '4px' }} />
                </div>
                <span className="text-xs text-[#8ea0bf]">{d.date}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#91b4ff]" /> Projected revenue</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#246bfd]" /> Actual revenue</span>
          </div>
        </div>
        <div className="rounded-xl border border-[#e5ebf5] bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-[#1c2740]">Returning customer rate</h2>
          <p className="text-xs text-[#8ea0bf]">Rate of customers returning to your shop over time</p>
          <div className="mt-4 h-36">
            <svg viewBox="0 0 300 100" className="h-full w-full" preserveAspectRatio="none">
              {returningLines.map((line, idx) => {
                const max = Math.max(...line.values);
                const min = Math.min(...line.values);
                const range = max - min || 1;
                const pts = line.values.map((v, i) => {
                  const x = (i / (line.values.length - 1)) * 280 + 10;
                  const y = 90 - ((v - min) / range) * 70;
                  return `${x},${y}`;
                }).join(' L ');
                return (
                  <path key={idx} d={`M ${pts}`} fill="none" stroke={line.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={idx === 1 ? '4 2' : idx === 2 ? '2 2' : '0'} />
                );
              })}
            </svg>
          </div>
          <div className="mt-1 flex flex-wrap gap-4 text-xs">
            {returningLines.map((l) => (
              <span key={l.label} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
          <p className="mt-2 text-center text-xs text-[#8ea0bf]">{returningMonths.join(' — ')}</p>
        </div>
      </div>
    </div>
  );
}
