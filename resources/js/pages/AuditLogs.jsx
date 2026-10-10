import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { 
  History, 
  Search, 
  Eye, 
  User, 
  Calendar, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Zap,
  RefreshCw,
  X,
  ShoppingCart,
  PackageCheck,
  Landmark,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  HandCoins,
  PlusCircle,
  TrendingUp,
  Trash2,
  Tag,
  Receipt,
  FileText,
  SlidersHorizontal,
  ShieldCheck,
  Clock,
  Layers
} from 'lucide-react';

const CATEGORY_TABS = [
  { id: 'all', label: 'All Activities', icon: Activity },
  { id: 'purchases', label: 'Purchases & GRN', icon: PackageCheck },
  { id: 'banking_cash', label: 'Bank & Cash Inflow/Outflow', icon: Landmark },
  { id: 'inventory_pricing', label: 'Products & Price Changes', icon: TrendingUp },
  { id: 'customers', label: 'Customer Dues & Accounts', icon: Receipt },
  { id: 'sales', label: 'POS & Sales Invoices', icon: ShoppingCart },
];

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async (page = 1, category = activeCategory, search = searchQuery) => {
    setLoading(true);
    try {
      const res = await api.get('/audit-logs', {
        params: {
          page,
          search: search.trim() || undefined,
        },
      });

      if (res.data.success) {
        const rawLogs = res.data.logs?.data || res.data.logs || [];
        setLogs(rawLogs);
        setPagination({
          current_page: res.data.logs?.current_page || 1,
          last_page: res.data.logs?.last_page || 1,
          total: res.data.logs?.total || 0,
        });
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1, activeCategory, searchQuery);
  }, []);

  // Filter logs by tab in UI or server
  const filteredLogs = logs.filter((log) => {
    if (activeCategory === 'all') return true;
    return log.event_category === activeCategory;
  });

  const getEventBadge = (event) => {
    const evt = (event || '').toLowerCase();

    if (evt.includes('purchase_created') || evt.includes('purchases.created')) {
      return {
        label: 'Purchase Placed',
        bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        icon: ShoppingCart,
      };
    }
    if (evt.includes('goods_received') || evt.includes('purchases.received')) {
      return {
        label: 'Goods Received (GRN)',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: PackageCheck,
      };
    }
    if (evt.includes('bank_created') || evt.includes('bank_accounts.created')) {
      return {
        label: 'Bank Created',
        bg: 'bg-sky-50 text-sky-700 border-sky-200',
        icon: Landmark,
      };
    }
    if (evt.includes('bank_deposit') || evt.includes('bank_accounts.deposit')) {
      return {
        label: 'Bank Deposit',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: ArrowDownRight,
      };
    }
    if (evt.includes('bank_withdraw') || evt.includes('bank_accounts.withdraw')) {
      return {
        label: 'Bank Withdrawal',
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: ArrowUpRight,
      };
    }
    if (evt.includes('cash_deposit') || evt.includes('cash.deposit')) {
      return {
        label: 'Cash Inflow',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: DollarSign,
      };
    }
    if (evt.includes('cash_withdraw') || evt.includes('cash.withdraw')) {
      return {
        label: 'Cash Outflow',
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: HandCoins,
      };
    }
    if (evt.includes('price_changed') || evt.includes('products.price_changed')) {
      return {
        label: 'Price Changed',
        bg: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: TrendingUp,
      };
    }
    if (evt.includes('product_created') || evt.includes('products.created')) {
      return {
        label: 'Product Added',
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: PlusCircle,
      };
    }
    if (evt.includes('product_deleted') || evt.includes('products.deleted')) {
      return {
        label: 'Product Deleted',
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: Trash2,
      };
    }
    if (evt.includes('category_')) {
      return {
        label: 'Category Action',
        bg: 'bg-teal-50 text-teal-700 border-teal-200',
        icon: Tag,
      };
    }
    if (evt.includes('customer_due_settled') || evt.includes('customers.balance_settled')) {
      return {
        label: 'Due Balance Settled',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: Receipt,
      };
    }
    if (evt.includes('customer_')) {
      return {
        label: 'Customer Action',
        bg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        icon: User,
      };
    }
    if (evt.includes('order_completed') || evt.includes('orders.completed')) {
      return {
        label: 'Order Invoiced',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: CheckCircle2,
      };
    }
    if (evt.includes('order_cancelled')) {
      return {
        label: 'Order Cancelled',
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: AlertCircle,
      };
    }
    if (evt.includes('order_created')) {
      return {
        label: 'Order Created',
        bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        icon: FileText,
      };
    }

    return {
      label: evt.replace(/[._]/g, ' '),
      bg: 'bg-slate-50 text-slate-700 border-slate-200',
      icon: Activity,
    };
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4" />
            <span>Comprehensive Enterprise Audit Trail</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">System Activity & Audit Logs</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time audit telemetry tracking purchases, goods received, bank deposits/withdrawals, cash in hand, product additions, price updates, and customer settlements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Tamper-Resistant Audit Trail</span>
          </span>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {CATEGORY_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search Bar & Refresh */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            fetchLogs(1, activeCategory, searchQuery);
          }}
          className="relative w-full sm:w-96"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search event, user name, IP, or entity ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-xs"
          />
        </form>

        <button
          type="button"
          onClick={() => fetchLogs(1, activeCategory, searchQuery)}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 shadow-xs transition-colors self-end sm:self-auto cursor-pointer"
          title="Refresh Audit Trail"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-6">Timestamp</th>
                <th className="py-3.5 px-6">Action / Event</th>
                <th className="py-3.5 px-6">Audit Description</th>
                <th className="py-3.5 px-6">Actor / User</th>
                <th className="py-3.5 px-6">IP Address</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading audit trail...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No activity logs found for this filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const badge = getEventBadge(log.event);
                  const Icon = badge.icon;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                        <div className="font-bold text-slate-800">
                          {new Date(log.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </div>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${badge.bg}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      <td className="py-4 px-6 max-w-xs">
                        <div className="font-semibold text-slate-800 line-clamp-2">
                          {log.description}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {log.auditable_type?.split('\\').pop()} #{log.auditable_id}
                        </div>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{log.user?.name || 'System Auto'}</div>
                        <div className="text-[10px] text-slate-400">{log.user?.roles?.[0]?.name || 'User'}</div>
                      </td>

                      <td className="py-4 px-6 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                        {log.ip_address || '127.0.0.1'}
                      </td>

                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 transition-colors font-bold text-xs inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {pagination.current_page} of {pagination.last_page} ({pagination.total} total log events)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.current_page <= 1}
                onClick={() => fetchLogs(pagination.current_page - 1, activeCategory, searchQuery)}
                className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={pagination.current_page >= pagination.last_page}
                onClick={() => fetchLogs(pagination.current_page + 1, activeCategory, searchQuery)}
                className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Diff Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                    Log #{selectedLog.id}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(selectedLog.created_at).toLocaleString()}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {selectedLog.description}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedLog(null)} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {/* Meta details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Actor</span>
                  <span className="font-bold text-slate-800">{selectedLog.user?.name || 'System'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Event Action</span>
                  <span className="font-mono font-bold text-indigo-600">{selectedLog.event}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Target Entity</span>
                  <span className="font-bold text-slate-800">{selectedLog.auditable_type?.split('\\').pop()} #{selectedLog.auditable_id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Client IP</span>
                  <span className="font-mono text-slate-700">{selectedLog.ip_address || '127.0.0.1'}</span>
                </div>
              </div>

              {/* State Diffs */}
              {selectedLog.old_values && Object.keys(selectedLog.old_values).length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <span>Previous State (Before Action)</span>
                  </span>
                  <pre className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 text-rose-950 font-mono text-[11px] overflow-x-auto leading-relaxed">
                    {JSON.stringify(selectedLog.old_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_values && Object.keys(selectedLog.new_values).length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <span>Updated State (Recorded Values)</span>
                  </span>
                  <pre className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 font-mono text-[11px] overflow-x-auto leading-relaxed">
                    {JSON.stringify(selectedLog.new_values, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
