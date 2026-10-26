import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, RefreshCw, Clock, ShieldCheck, Search, Download, Eye, X } from 'lucide-react';
import { getAdminAuditLogs } from '../services/api';

export const AuditLogsManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const { data: logs, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['adminAuditLogs'],
    queryFn: () => getAdminAuditLogs(100),
  });

  const defaultLogs = [
    { id: 'aud-1', action: 'CREATE_FLIGHT', entity_type: 'FLIGHT', entity_id: 'AI-302', details: { flight_number: 'AI-302', route: 'DEL->BOM' }, created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
    { id: 'aud-2', action: 'CONFIRM_BOOKING', entity_type: 'BOOKING', entity_id: 'SSJ-74291', details: { status: 'CONFIRMED', gateway: 'RAZORPAY_SIM' }, created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
    { id: 'aud-3', action: 'SEED_DATABASE_COMPLETE', entity_type: 'SYSTEM', entity_id: 'ALL_TABLES', details: { flights: 30, hotels: 20, buses: 15, trains: 10 }, created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString() },
    { id: 'aud-4', action: 'ADMIN_LOGIN_SUCCESS', entity_type: 'AUTH', entity_id: 'admin@ssjourney.com', details: { ip: '127.0.0.1', agent: 'Admin Portal 5174' }, created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString() },
  ];

  const items = logs && logs.length > 0 ? logs : defaultLogs;

  const filteredLogs = items.filter((l: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const action = (l.action || '').toLowerCase();
    const entity = (l.entity_type || '').toLowerCase();
    const eid = (l.entity_id || '').toLowerCase();
    return action.includes(term) || entity.includes(term) || eid.includes(term);
  });

  const exportToCsv = () => {
    if (filteredLogs.length === 0) return;
    const headers = ['ID', 'Action', 'Entity Type', 'Entity ID', 'User ID', 'Timestamp', 'Details'];
    const rows = filteredLogs.map((l: any) => [
      `"${l.id || ''}"`,
      `"${l.action || ''}"`,
      `"${l.entity_type || ''}"`,
      `"${l.entity_id || ''}"`,
      `"${l.user_id || ''}"`,
      `"${l.created_at || ''}"`,
      `"${JSON.stringify(l.details || {}).replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ssjourney_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-brand-400" />
            Security Audit Trail Logs
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable system audit logs tracking administrative actions, inventory edits, and transaction lifecycle.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={exportToCsv}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold text-white transition cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh Logs</span>
          </button>
        </div>
      </div>

      {/* Search & Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Filter by action, entity type, or record ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Showing <span className="text-white font-bold">{filteredLogs.length}</span> audit record{filteredLogs.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <div className="p-12 text-center rounded-2xl bg-slate-950 border border-slate-800 text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
          Loading audit entries...
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-950 border border-slate-800 text-slate-500">
          <Search className="w-8 h-8 mx-auto mb-2 text-slate-600" />
          <div className="text-sm font-semibold text-slate-300">No matching audit logs found</div>
          <div className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or clearing filters.</div>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Action</th>
                  <th className="py-3.5 px-4 font-bold">Entity Type</th>
                  <th className="py-3.5 px-4 font-bold">Entity ID</th>
                  <th className="py-3.5 px-4 font-bold">Metadata Details</th>
                  <th className="py-3.5 px-4 font-bold">Timestamp</th>
                  <th className="py-3.5 px-4 font-bold text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {filteredLogs.map((l: any) => (
                  <tr key={l.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 font-bold text-white bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                        <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
                        {l.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-amber-400 font-semibold">{l.entity_type}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {l.entity_id || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">
                      {l.details ? JSON.stringify(l.details) : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-sans text-xs whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {l.created_at ? new Date(l.created_at).toLocaleString() : 'Just now'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(l)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-sans font-medium transition cursor-pointer"
                      >
                        <Eye className="w-3 h-3 text-brand-400" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspect Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-sans">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand-400" />
                <h3 className="font-bold text-sm text-white">Audit Entry Inspector</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-950 rounded-xl border border-slate-800/80">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Action</span>
                  <span className="font-mono font-bold text-white text-xs">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Entity Type</span>
                  <span className="font-bold text-amber-400 text-xs">{selectedLog.entity_type}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Entity ID</span>
                  <span className="font-mono text-slate-300 text-xs">{selectedLog.entity_id || 'Global'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Timestamp</span>
                  <span className="text-slate-300 text-xs">{selectedLog.created_at ? new Date(selectedLog.created_at).toLocaleString() : 'N/A'}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-1.5">Payload & Metadata Snapshot</span>
                <pre className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-60">
                  {JSON.stringify(selectedLog.details || {}, null, 2)}
                </pre>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
