'use client';

export default function AdminDashboardPage() {
  const totalOrdersData = [40, 65, 50, 75, 55, 60, 80];
  const newCustomersData = [30, 45, 35, 55, 40, 50, 60];
  const projectionData = [120, 140, 130, 160, 150, 170];
  const actualData = [100, 130, 125, 145, 140, 155];
  const returningRates = {
    second: [20, 22, 25, 28, 30, 32, 35, 38, 40],
    third: [12, 14, 16, 18, 20, 22, 24, 26, 28],
    fourth: [5, 6, 8, 9, 10, 12, 13, 14, 15],
  };
  const months = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Ecommerce Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Here&apos;s what&apos;s going on at your business right now</p>
      </div>

      {/* KPI row 1 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">57 new orders</p>
              <p className="text-xs text-gray-500">Awaiting processing</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 013 0v6m-9-1V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 013 0v6" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">5 orders</p>
              <p className="text-xs text-gray-500">On hold</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">15 products</p>
              <p className="text-xs text-gray-500">Out of stock</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Total orders</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">16,247</p>
          <div className="mt-2 flex h-12 items-end gap-0.5">
            {totalOrdersData.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-[#3874ff]"
                style={{ height: `${(h / 80) * 100}%`, minHeight: 4 }}
                title={String(h)}
              />
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-500">Last 7 days</p>
          <div className="mt-1 flex gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-[#1e3a8a]" /> Completed 52%
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-[#93c5fd]" /> Pending payment 48%
            </span>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">New customers</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">356</p>
          <div className="mt-2 flex h-12 items-end gap-0.5">
            {newCustomersData.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-[#3874ff]"
                style={{ height: `${(h / 60) * 100}%`, minHeight: 4 }}
              />
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-500">Last 7 days (Mar 01 - Mar 07)</p>
        </div>
      </div>

      {/* Second row: Total sells, Top coupons, Paying vs non-paying */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm lg:col-span-2">
          <h3 className="font-semibold text-gray-900">Total sells</h3>
          <p className="text-xs text-gray-500">Payments received across all channels</p>
          <div className="mt-4 flex h-32 items-end gap-1">
            {[65, 80, 55, 90, 70, 85, 75, 95, 82, 88].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-[#3874ff] opacity-90"
                style={{ height: `${h}%`, minHeight: 8 }}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">Mar 01 - 31, 2022</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900">Top coupons</h3>
          <p className="text-xs text-gray-500">Last 7 days</p>
          <div className="mt-4 flex items-center gap-6">
            <div className="relative h-24 w-24">
              <svg viewBox="0 0 36 36" className="h-24 w-24 -rotate-90">
                <circle cx="18" cy="18" r="16" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                <circle cx="18" cy="18" r="16" fill="none" stroke="#1e3a8a" strokeWidth="3" strokeDasharray="72 100" strokeLinecap="round" />
                <circle cx="18" cy="18" r="16" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray="12 100" strokeDashoffset="-72" strokeLinecap="round" />
                <circle cx="18" cy="18" r="16" fill="none" stroke="#93c5fd" strokeWidth="3" strokeDasharray="16 100" strokeDashoffset="-84" strokeLinecap="round" />
              </svg>
            </div>
            <ul className="text-sm">
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#1e3a8a]" /> Product discount 72%
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#3b82f6]" /> Fixed rate discount 12%
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#93c5fd]" /> Free account discount 16%
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900">Paying vs non paying</h3>
          <p className="text-xs text-gray-500">Last 7 days</p>
          <div className="mt-4 flex items-center gap-6">
            <div className="relative h-24 w-24">
              <svg viewBox="0 0 36 36" className="h-24 w-24 -rotate-90">
                <circle cx="18" cy="18" r="16" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                <circle cx="18" cy="18" r="16" fill="none" stroke="#1e3a8a" strokeWidth="3" strokeDasharray="60 100" strokeLinecap="round" />
                <circle cx="18" cy="18" r="16" fill="none" stroke="#93c5fd" strokeWidth="3" strokeDasharray="40 100" strokeDashoffset="-60" strokeLinecap="round" />
              </svg>
            </div>
            <ul className="text-sm">
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#1e3a8a]" /> Paying customer 60%
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#93c5fd]" /> Non-paying customer 40%
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Latest reviews */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Latest reviews</h3>
            <p className="text-xs text-gray-500">Payments received across all channels</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="search"
              placeholder="Search..."
              className="rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#3874ff]"
            />
            <button type="button" className="rounded border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Chat demo
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 font-medium text-gray-600">
                  <input type="checkbox" className="rounded border-gray-300" />
                </th>
                <th className="px-4 py-3 font-medium text-gray-600">PRODUCT</th>
                <th className="px-4 py-3 font-medium text-gray-600">CUSTOMER</th>
                <th className="px-4 py-3 font-medium text-gray-600">RATING</th>
                <th className="px-4 py-3 font-medium text-gray-600">REVIEW</th>
                <th className="px-4 py-3 font-medium text-gray-600">STATUS</th>
                <th className="px-4 py-3 font-medium text-gray-600">TIME</th>
              </tr>
            </thead>
            <tbody>
              {[
                { product: 'RBL Sigma Advance Smartwatch', customer: 'R Richard Dawson', rating: 5, review: 'Great product, fast delivery...', status: 'APPROVED', time: 'Just now' },
                { product: 'Minimal Lamp', customer: 'Jane Smith', rating: 4, review: 'Nice design, good quality.', status: 'PENDING', time: 'Nov 09, 12:29 A' },
                { product: 'Urban Sneaker', customer: 'John Doe', rating: 5, review: 'Very comfortable for daily wear.', status: 'APPROVED', time: 'Nov 08, 3:45 P' },
              ].map((row, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input type="checkbox" className="rounded border-gray-300" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 shrink-0 rounded bg-gray-200" />
                      <span className="font-medium text-gray-900">1 {row.product}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3874ff] text-xs font-medium text-white">
                        {row.customer.charAt(0)}
                      </div>
                      {row.customer}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex text-amber-400">
                      {Array.from({ length: row.rating }).map((_, j) => (
                        <span key={j}>★</span>
                      ))}
                    </span>
                  </td>
                  <td className="max-w-[180px] truncate px-4 py-3 text-gray-600">{row.review}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                        row.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-sm text-gray-500">
          <span>1 to 10 of 15</span>
          <div className="flex gap-2">
            <button type="button" className="rounded border border-gray-200 px-3 py-1 hover:bg-gray-50">Previous</button>
            <button type="button" className="rounded border border-gray-200 px-3 py-1 hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>

      {/* Top regions by revenue */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900">Top regions by revenue</h3>
              <p className="text-xs text-gray-500">Where you generated most of the revenue</p>
            </div>
            <div className="grid grid-cols-4 gap-4 border-b border-gray-200 px-4 py-3 text-center text-xs font-semibold uppercase text-gray-500">
              <span>Users (377,620)</span>
              <span>Transactions (236)</span>
              <span>Revenue ($15,758)</span>
              <span>Conv rate (10.32%)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-2 font-medium text-gray-600">#</th>
                    <th className="px-4 py-2 font-medium text-gray-600">Country</th>
                    <th className="px-4 py-2 font-medium text-gray-600">Users</th>
                    <th className="px-4 py-2 font-medium text-gray-600">Transactions</th>
                    <th className="px-4 py-2 font-medium text-gray-600">Revenue</th>
                    <th className="px-4 py-2 font-medium text-gray-600">Conv. rate</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { country: 'India', users: '28%', trans: '24%', revenue: '22%', conv: '8.12%' },
                    { country: 'China', users: '22%', trans: '20%', revenue: '18%', conv: '7.45%' },
                    { country: 'USA', users: '18%', trans: '16%', revenue: '20%', conv: '9.82%' },
                    { country: 'South Korea', users: '12%', trans: '14%', revenue: '15%', conv: '6.20%' },
                    { country: 'Vietnam', users: '10%', trans: '12%', revenue: '10%', conv: '5.50%' },
                  ].map((r, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="px-4 py-2 font-medium">{i + 1}.</td>
                      <td className="px-4 py-2">{r.country}</td>
                      <td className="px-4 py-2 text-gray-600">{r.users}</td>
                      <td className="px-4 py-2 text-gray-600">{r.trans}</td>
                      <td className="px-4 py-2 text-gray-600">{r.revenue}</td>
                      <td className="px-4 py-2 text-gray-600">{r.conv}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-2">
              <button type="button" className="text-sm text-gray-500 hover:text-gray-700">&lt; Previous</button>
              <button type="button" className="text-sm text-gray-500 hover:text-gray-700">Next &gt;</button>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex h-64 items-center justify-center rounded bg-gray-100 text-gray-400">
            World map placeholder
          </div>
        </div>
      </div>

      {/* Bottom charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900">Projection vs actual</h3>
          <p className="text-xs text-gray-500">Actual earnings vs projection earnings</p>
          <div className="mt-4 flex h-40 items-end gap-2">
            {projectionData.map((h, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full gap-0.5">
                  <div
                    className="flex-1 rounded-t bg-[#93c5fd]"
                    style={{ height: 24 + (h / 170) * 80, minHeight: 20 }}
                  />
                  <div
                    className="flex-1 rounded-t bg-[#1e3a8a]"
                    style={{ height: 24 + (actualData[i]! / 170) * 80, minHeight: 20 }}
                  />
                </div>
                <span className="text-xs text-gray-500">Mar {7 + i * 4}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-4 text-xs">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded bg-[#93c5fd]" /> Projected revenue
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded bg-[#1e3a8a]" /> Actual revenue
            </span>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900">Returning customer rate</h3>
          <p className="text-xs text-gray-500">Rate of customers returning to your shop over time</p>
          <div className="mt-4 flex h-36 items-end gap-1">
            {returningRates.second.map((_, i) => (
              <div key={i} className="flex flex-1 flex-col gap-0.5">
                <div
                  className="w-full rounded-t bg-[#1e3a8a]"
                  style={{ height: `${(returningRates.fourth[i]! / 40) * 100}%`, minHeight: 4 }}
                />
                <div
                  className="w-full rounded-t bg-[#3b82f6]"
                  style={{ height: `${(returningRates.third[i]! / 40) * 100}%`, minHeight: 4 }}
                />
                <div
                  className="w-full rounded-t bg-[#93c5fd]"
                  style={{ height: `${(returningRates.second[i]! / 40) * 100}%`, minHeight: 4 }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-xs">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded bg-[#93c5fd]" /> Second time
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded bg-[#3b82f6]" /> Third time
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded bg-[#1e3a8a]" /> Fourth time
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">{months.slice(0, 9).join(' ')}</p>
        </div>
      </div>
    </div>
  );
}
