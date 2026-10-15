'use client';

import * as React from 'react';
import {
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  RotateCcw,
  Users,
  Tag,
  ArrowDownToLine,
  Calendar,
  Layers,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatRupees } from '@/lib/utils';
import { getAdminAnalyticsReportAction } from '@/actions/orders';

interface ReportsClientProps {
  initialReport: any;
}

export function AdminReportsClient({ initialReport }: ReportsClientProps) {
  const [period, setPeriod] = React.useState<'today' | '7d' | '30d' | 'ytd' | 'all'>(
    initialReport?.period || '30d'
  );
  const [report, setReport] = React.useState<any>(initialReport);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchPeriod = async (newPeriod: 'today' | '7d' | '30d' | 'ytd' | 'all') => {
    setPeriod(newPeriod);
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminAnalyticsReportAction(newPeriod);
      if ('error' in res && res.error) {
        setError(res.error);
      } else {
        setReport(res);
      }
    } catch {
      setError('Failed to fetch analytics report for selected period.');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!report?.summary) return;
    const s = report.summary;
    const csvContent = [
      ['Metric', 'Value'],
      ['Reporting Period', report.period],
      ['Start Date', report.startDate || 'Beginning of time'],
      ['End Date', report.endDate],
      ['Gross Paid Revenue (INR)', (s.grossPaidRevenuePaise / 100).toFixed(2)],
      ['Total Refunds (INR)', (s.refundTotalPaise / 100).toFixed(2)],
      ['Net Revenue (INR)', (s.netRevenuePaise / 100).toFixed(2)],
      ['Paid Orders Count', s.paidOrdersCount],
      ['Total Orders Placed', s.totalOrdersPlaced],
      ['Average Order Value (INR)', (s.averageOrderValuePaise / 100).toFixed(2)],
      ['New Customers Registered', s.newCustomersCount],
      ['Total Discounts Issued (INR)', (s.discountGivenPaise / 100).toFixed(2)],
      ['Orders with Coupons', s.ordersWithDiscountCount],
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ttrc_store_financial_report_${report.period}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summary = report?.summary || {
    grossPaidRevenuePaise: 0,
    refundTotalPaise: 0,
    netRevenuePaise: 0,
    paidOrdersCount: 0,
    averageOrderValuePaise: 0,
    totalOrdersPlaced: 0,
    newCustomersCount: 0,
    discountGivenPaise: 0,
    ordersWithDiscountCount: 0,
  };

  const periods: Array<{ id: 'today' | '7d' | '30d' | 'ytd' | 'all'; label: string }> = [
    { id: 'today', label: 'Today' },
    { id: '7d', label: 'Last 7 Days' },
    { id: '30d', label: 'Last 30 Days' },
    { id: 'ytd', label: 'Year to Date' },
    { id: 'all', label: 'All Time' },
  ];

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#14141A]">
            Financial & Operational Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative financial metrics and order reconciliation directly from MongoDB Atlas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            {periods.map((p) => (
              <button
                key={p.id}
                onClick={() => fetchPeriod(p.id)}
                disabled={loading}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  period === p.id
                    ? 'bg-white text-[#E3132A] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <Button
            onClick={exportCSV}
            variant="outline"
            className="border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl flex items-center gap-2"
          >
            <ArrowDownToLine size={15} /> Export CSV
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Revenue */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Net Revenue</span>
            <div className="p-2 rounded-xl bg-[#FDECEE] text-[#E3132A]">
              <IndianRupee size={18} />
            </div>
          </div>
          <p className="font-heading text-2xl font-black text-slate-900 mt-2">
            {formatRupees(summary.netRevenuePaise)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Gross Paid minus processed refunds
          </p>
        </div>

        {/* Gross Paid Revenue */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Gross Paid Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp size={18} />
            </div>
          </div>
          <p className="font-heading text-2xl font-black text-slate-900 mt-2">
            {formatRupees(summary.grossPaidRevenuePaise)}
          </p>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">
            {summary.paidOrdersCount} completed paid orders
          </p>
        </div>

        {/* Average Order Value */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Average Order Value (AOV)</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <ShoppingBag size={18} />
            </div>
          </div>
          <p className="font-heading text-2xl font-black text-slate-900 mt-2">
            {formatRupees(summary.averageOrderValuePaise)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Per verified paid transaction
          </p>
        </div>

        {/* Processed Refunds */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Refunds Processed</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <RotateCcw size={18} />
            </div>
          </div>
          <p className="font-heading text-2xl font-black text-slate-900 mt-2">
            {formatRupees(summary.refundTotalPaise)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Total refunded order value
          </p>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Layers size={14} /> Total Orders Placed
          </div>
          <p className="font-heading text-xl font-black text-slate-900 mt-1">
            {summary.totalOrdersPlaced}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">All statuses combined</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Users size={14} /> New Customers
          </div>
          <p className="font-heading text-xl font-black text-slate-900 mt-1">
            {summary.newCustomersCount}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Registered in period</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Tag size={14} /> Discounts Granted
          </div>
          <p className="font-heading text-xl font-black text-slate-900 mt-1">
            {formatRupees(summary.discountGivenPaise)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Coupon & promotional savings</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Calendar size={14} /> Orders with Coupons
          </div>
          <p className="font-heading text-xl font-black text-slate-900 mt-1">
            {summary.ordersWithDiscountCount}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Applied promo codes</p>
        </div>
      </div>

      {/* Order Status Distribution & Inventory Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Status Distribution */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h2 className="font-heading font-bold text-base text-[#14141A] flex items-center gap-2">
            <Layers size={18} className="text-[#E3132A]" /> Order Status Distribution
          </h2>
          <div className="space-y-2">
            {Object.keys(report?.statusDistribution || {}).length > 0 ? (
              Object.entries(report.statusDistribution).map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                >
                  <span className="font-semibold text-slate-700 capitalize">
                    {status.replace(/_/g, ' ')}
                  </span>
                  <span className="font-mono font-bold text-slate-900">{count as number}</span>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-xs text-slate-400">
                No orders placed in this period.
              </p>
            )}
          </div>
        </div>

        {/* Recent Inventory Movements */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h2 className="font-heading font-bold text-base text-[#14141A] flex items-center gap-2">
            <History size={18} className="text-[#E3132A]" /> Recent Inventory Movements
          </h2>
          {report?.inventoryMovements?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Timestamp</th>
                    <th className="pb-3">Product ID</th>
                    <th className="pb-3">Adjustment</th>
                    <th className="pb-3">New Stock</th>
                    <th className="pb-3">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.inventoryMovements.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-2.5 text-slate-500 font-mono text-[11px]">
                        {new Date(log.created_at).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5 font-mono text-slate-800 text-[11px]">
                        {log.productId?.slice(0, 8)}...
                      </td>
                      <td className="py-2.5 font-bold">
                        <span
                          className={
                            (log.metadata?.adjustment ?? 0) >= 0
                              ? 'text-emerald-600'
                              : 'text-red-600'
                          }
                        >
                          {(log.metadata?.adjustment ?? 0) > 0 ? '+' : ''}
                          {log.metadata?.adjustment ?? 0}
                        </span>
                      </td>
                      <td className="py-2.5 font-bold font-mono text-slate-900">
                        {log.metadata?.newStock ?? '—'}
                      </td>
                      <td className="py-2.5 text-slate-600 text-[11px]">
                        {log.metadata?.reason || 'Manual adjustment'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              No inventory adjustments recorded in this period.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
