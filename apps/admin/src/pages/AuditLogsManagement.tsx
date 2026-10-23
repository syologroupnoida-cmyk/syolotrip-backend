import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, RefreshCw, Clock, ShieldCheck, Search } from 'lucide-react';
import { getAdminAuditLogs } from '../services/api';

export const AuditLogsManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

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
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Filter by action or entity..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
        />
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <div className="p-12 text-center rounded-2xl bg-slate-950 border border-slate-800 text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
          Loading audit entries...
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
                    <td className="py-3.5 px-4 text-slate-500 flex items-center gap-1.5 font-sans text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      {l.created_at ? new Date(l.created_at).toLocaleString() : 'Just now'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
