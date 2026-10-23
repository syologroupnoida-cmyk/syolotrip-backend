import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Search, RefreshCw, Shield, User, CheckCircle, Mail, Phone } from 'lucide-react';
import { getAdminUsers } from '../services/api';

export const UsersManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'CUSTOMER'>('ALL');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => getAdminUsers({ limit: 100 }),
  });

  const users = data?.items || [];

  const filteredUsers = users.filter((u: any) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const name = (u.full_name || u.fullName || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const phone = (u.phone || '').toLowerCase();
    return name.includes(term) || email.includes(term) || phone.includes(term);
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-400" />
            Users & Customer Accounts
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage registered travelers, administrative roles, and customer profiles.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
          <span className="text-slate-500 text-[11px] font-medium mr-1">Role:</span>
          {(['ALL', 'ADMIN', 'CUSTOMER'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                roleFilter === r
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              {r === 'ALL' ? 'All Roles' : r === 'ADMIN' ? 'Administrators' : 'Customers'}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="p-12 text-center rounded-2xl bg-slate-950 border border-slate-800 text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
          Loading user records...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-950 border border-slate-800 text-slate-500">
          No users match the search criteria.
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-bold">User</th>
                  <th className="py-3.5 px-4 font-bold">Email</th>
                  <th className="py-3.5 px-4 font-bold">Phone</th>
                  <th className="py-3.5 px-4 font-bold">Role</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          u.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {(u.full_name || u.fullName || u.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-white block">{u.full_name || u.fullName || 'Anonymous'}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{u.id?.slice(0, 8)}...</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        {u.email}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {u.phone ? (
                        <span className="flex items-center gap-1.5 text-slate-300">
                          <Phone className="w-3 h-3 text-slate-500" />
                          {u.phone}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {u.role === 'ADMIN' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          <Shield className="w-3 h-3" />
                          Administrator
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                          <User className="w-3 h-3" />
                          Customer
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Active
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-500">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Active'}
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
