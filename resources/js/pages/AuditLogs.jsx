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
  X
} from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/audit-logs?page=${page}&search=${encodeURIComponent(searchQuery)}`);
      if (res.data.success) {
        setLogs(res.data.logs?.data || res.data.logs || []);
        setPagination({
          current_page: res.data.logs?.current_page || 1,
          last_page: res.data.logs?.last_page || 1,
          total: res.data.logs?.total || 0,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4" />
            <span>Asynchronous Audit Queue</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">System Audit & Activity Logs</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Queued audit logs recording who created, updated, or completed orders with old vs new diff snapshots.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold shadow-xs">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Queued Job Dispatch (Redis / Database)</span>
          </span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search event, user, entity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchLogs(1)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-xs"
          />
        </div>

        <button
          type="button"
          onClick={() => fetchLogs(1)}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 shadow-xs transition-colors self-end sm:self-auto"
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
                <th className="py-3.5 px-6">Entity Target</th>
                <th className="py-3.5 px-6">Actor / User</th>
                <th className="py-3.5 px-6">IP Address</th>
                <th className="py-3.5 px-6 text-right">Audit Diff</th>
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
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No activity logs recorded yet. Place orders to generate audit events.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isCreated = log.event === 'created';
                  const isCompleted = log.event === 'order_completed';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6 font-mono text-slate-500 text-[11px]">
                        {new Date(log.created_at).toLocaleString()}
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : isCreated
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          }`}
                        >
                          <span className="capitalize">{log.event?.replace('_', ' ')}</span>
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900">
                          {log.auditable_type?.split('\\').pop() || 'Entity'}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">ID #{log.auditable_id}</div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900">{log.user?.name || 'System Auto'}</div>
                        <div className="text-[10px] text-slate-400">{log.user?.roles?.[0]?.name || 'User'}</div>
                      </td>

                      <td className="py-4 px-6 font-mono text-slate-500 text-[11px]">
                        {log.ip_address || '127.0.0.1'}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="px-3 py-1 rounded-lg border border-slate-200 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 transition-colors font-bold text-[11px] inline-flex items-center gap-1 shadow-xs"
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
                onClick={() => fetchLogs(pagination.current_page - 1)}
                className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                disabled={pagination.current_page >= pagination.last_page}
                onClick={() => fetchLogs(pagination.current_page + 1)}
                className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
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
                <h3 className="text-base font-bold text-slate-900">
                  Audit Snapshot #{selectedLog.id}
                </h3>
                <p className="text-xs text-slate-400">
                  Event: <span className="font-bold text-indigo-600">{selectedLog.event}</span> • Entity: {selectedLog.auditable_type} #{selectedLog.auditable_id}
                </p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="font-bold text-slate-800 mb-1">Audit Description:</div>
                <div className="text-slate-600">{selectedLog.description}</div>
              </div>

              {selectedLog.old_values && Object.keys(selectedLog.old_values).length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Previous State (Old Values)
                  </span>
                  <pre className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 font-mono text-[11px] overflow-x-auto">
                    {JSON.stringify(selectedLog.old_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_values && Object.keys(selectedLog.new_values).length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Updated State (New Values)
                  </span>
                  <pre className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-mono text-[11px] overflow-x-auto">
                    {JSON.stringify(selectedLog.new_values, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
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
