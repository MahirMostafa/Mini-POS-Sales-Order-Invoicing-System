import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  Calendar,
  Search,
  ArrowRight,
  FileSpreadsheet,
  Clock,
  Layers
} from 'lucide-react';
import ReportHeader from '../../components/ReportHeader';

export default function DayBookReport() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [dayBook, setDayBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const currency = '৳';

  const fetchDayBook = async () => {
    setLoading(true);
    try {
      const res = await api.get('/accounting/day-book', {
        params: {
          date: selectedDate,
          search: search || undefined
        }
      });
      if (res.data.success) {
        setDayBook(res.data.day_book);
      }
    } catch (err) {
      console.error('Failed to load day book', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDayBook();
  }, [selectedDate]);

  const entries = dayBook?.entries || [];

  return (
    <div className="space-y-6">
      <ReportHeader
        title="Day Book Report"
        subtitle="Daily chronological double-entry journal records, transactions, and total flow for a selected business day."
        icon={Calendar}
        requiredPermission={['view-day-book', 'view-accounting-dashboard']}
        showDateFilter={false}
        onRefresh={fetchDayBook}
        loading={loading}
      >
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold text-slate-600 px-2 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Select Day:</span>
          </span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </ReportHeader>

      {/* Day Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Day Vouchers</div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
            {dayBook?.total_entries || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Vouchers posted on {selectedDate}</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Total Debit Volume</div>
          <div className="mt-2 text-2xl font-black text-emerald-700 font-mono">
            {currency}{Number(dayBook?.total_debit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-emerald-600 mt-1">Total debited across all heads</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Total Credit Volume</div>
          <div className="mt-2 text-2xl font-black text-indigo-700 font-mono">
            {currency}{Number(dayBook?.total_credit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-indigo-600 mt-1">Total credited across all heads</p>
        </div>
      </div>

      {/* Vouchers Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900">
            Journal Vouchers Posted on {selectedDate} ({entries.length})
          </h3>
        </div>

        {loading ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 text-xs">
            Loading Day Book records...
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 text-xs">
            No journal entries recorded on {selectedDate}.
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-xs text-indigo-600 px-2.5 py-1 bg-indigo-50 rounded-lg">
                    {entry.entry_number}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-slate-800">{entry.description}</div>
                    <div className="text-[11px] text-slate-400">
                      Ref: {entry.reference_type || 'Manual'} #{entry.reference_id || '—'}
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {entry.entry_date}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] text-slate-400 font-bold uppercase bg-slate-50/40 border-b border-slate-100">
                    <tr>
                      <th className="py-2 px-4">Account Code</th>
                      <th className="py-2 px-4">Account Name</th>
                      <th className="py-2 px-4">Narration / Details</th>
                      <th className="py-2 px-4 text-right">Debit</th>
                      <th className="py-2 px-4 text-right">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(entry.items || []).map((item, i) => (
                      <tr key={i} className="hover:bg-slate-50/40">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-600">
                          {item.account?.code || item.account_code || '—'}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          {item.account?.name || item.account_name || '—'}
                        </td>
                        <td className="py-2.5 px-4 text-slate-500">
                          {item.narration || '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                          {Number(item.debit) > 0 ? `${currency}${Number(item.debit).toFixed(2)}` : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                          {Number(item.credit) > 0 ? `${currency}${Number(item.credit).toFixed(2)}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
