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
  Sparkles,
  Zap
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
        setLogs(res.data.logs.data || []);
        setPagination({
          current_page: res.data.logs.current_page,
          last_page: res.data.logs.last_page,
          total: res.data.logs.total,
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
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-400" />
            Queued Audit & Activity Logs
          </h1>
          <p className="text-xs text-slate-400">
            Asynchronously queued activity records with entity snapshots, user accountability, and diff tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Processed by Background Queue Worker
          </span>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action / Event</th>
                <th className="py-3 px-4">Entity & Target ID</th>
                <th className="py-3 px-4">Performed By</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-center">Diff Inspector</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500">Loading audit logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500">No audit activity logged yet. Place an order to see background audit records!</td></tr>
              ) : (
                logs.map((log) => {
                  const isCreated = log.event === 'created';
                  const isCompleted = log.event === 'order_completed';
                  const isStatus = log.event === 'status_changed';

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        {new Date(log.created_at).toLocaleString()}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isCompleted
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : isCreated
                              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {log.event.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-200">
                          {log.auditable_type.split('\\').pop()}
                        </span>{' '}
                        <span className="font-mono text-indigo-400">#{log.auditable_id}</span>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-200">
                        {log.user?.name || 'System / Auto'}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        {log.ip_address || '127.0.0.1'}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                        >
                          View Changes
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.last_page > 1 && (
          <div className="p-3 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing page {pagination.current_page} of {pagination.last_page} ({pagination.total} logs)
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={pagination.current_page === 1}
                onClick={() => fetchLogs(pagination.current_page - 1)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={pagination.current_page === pagination.last_page}
                onClick={() => fetchLogs(pagination.current_page + 1)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Diff Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 relative">
            <h3 className="text-base font-bold text-slate-100 mb-1">
              Audit Record Details (#{selectedLog.id})
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Action: <strong className="text-indigo-400">{selectedLog.event}</strong> on {selectedLog.auditable_type} #{selectedLog.auditable_id}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-1">Previous Values (Snapshot)</span>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 max-h-64 overflow-y-auto">
                  {selectedLog.old_values ? JSON.stringify(selectedLog.old_values, null, 2) : 'null (Created)'}
                </pre>
              </div>

              <div>
                <span className="text-xs font-bold text-indigo-400 block mb-1">New Values (Snapshot)</span>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-indigo-300 max-h-64 overflow-y-auto">
                  {selectedLog.new_values ? JSON.stringify(selectedLog.new_values, null, 2) : 'null (Deleted)'}
                </pre>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
