import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Shield, Check, X, RefreshCw, KeyRound
} from 'lucide-react';
import { getAdminRoles, updateAdminUserRole } from '../services/api';

const PERMISSION_COLUMNS = [
  'Dashboard & Metrics',
  '10 Services Inventory',
  'Master Data Tables',
  'Bulk Import & Export',
  'Pricing & Markups',
  'Coupons & Campaigns',
  'Customer Suspensions',
  'RBAC Role Assignment',
];

const ROLE_PERMISSIONS: Record<string, boolean[]> = {
  SUPER_ADMIN: [true, true, true, true, true, true, true, true],
  OPERATIONS_ADMIN: [true, true, true, true, false, false, true, false],
  INVENTORY_MANAGER: [true, true, true, true, false, false, false, false],
  FINANCE_ADMIN: [true, false, false, false, true, false, false, false],
  MARKETING_ADMIN: [true, false, false, false, false, true, false, false],
  SUPPORT_ADMIN: [true, false, false, false, false, false, false, false],
};

export const RolesManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [newRole, setNewRole] = useState<string>('ADMIN');

  // Query roles & users
  const { data: rolesData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['adminRoles'],
    queryFn: getAdminRoles,
  });

  // Role mutation
  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      updateAdminUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRoles'] });
      setSelectedUser(null);
    },
  });

  const adminUsers = rolesData?.users || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-brand-400" />
            Role-Based Access Control (RBAC)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enforce granular operational authority: assign Super Admin, Operations, Inventory, Finance, and Support privileges.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Refresh Roles</span>
        </button>
      </div>

      {/* Role Definitions & Permission Matrix */}
      <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Permission Matrix &amp; Role Hierarchies
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational boundary matrix enforcing least-privilege administrative governance.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Role Tier</th>
                {PERMISSION_COLUMNS.map((col) => (
                  <th key={col} className="py-2.5 px-3 text-center">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {Object.keys(ROLE_PERMISSIONS).map((roleKey) => (
                <tr key={roleKey} className="hover:bg-slate-900/40">
                  <td className="py-3 px-3 font-bold text-white">
                    <span className="font-mono text-xs">{roleKey}</span>
                  </td>
                  {ROLE_PERMISSIONS[roleKey].map((allowed, idx) => (
                    <td key={idx} className="py-3 px-3 text-center">
                      {allowed ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-800 text-slate-600 flex items-center justify-center mx-auto">
                          <X className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Personnel List */}
      <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Assigned Administrative Personnel
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Active staff members with elevated platform capabilities in PostgreSQL.
            </p>
          </div>
          <span className="text-xs text-slate-400">
            {adminUsers.length} Staff Accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-500" />
              <p className="text-xs">Loading admin credentials...</p>
            </div>
          ) : adminUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No elevated administrative personnel found.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Admin Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {adminUsers.map((user: any) => (
                  <tr key={user.id} className="hover:bg-slate-900/40">
                    <td className="py-3 px-4 font-semibold text-white">
                      {user.full_name || 'System Administrator'}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                      {user.email}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-500/15 text-brand-400 border border-brand-500/30">
                        <KeyRound className="w-3 h-3" />
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold text-emerald-400">
                        ACTIVE
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setNewRole(user.role || 'ADMIN');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition cursor-pointer"
                      >
                        Modify Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modify Role Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Modify User Access Role</h3>
                <p className="text-xs text-slate-400">{selectedUser.email}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase">
                Assign Administrative Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 cursor-pointer"
              >
                <option value="ADMIN">ADMIN (Full Access)</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN (Executive Authority)</option>
                <option value="OPERATIONS_ADMIN">OPERATIONS_ADMIN (Bookings &amp; Operations)</option>
                <option value="INVENTORY_MANAGER">INVENTORY_MANAGER (Catalog &amp; Master Data)</option>
                <option value="FINANCE_ADMIN">FINANCE_ADMIN (Settlement &amp; Reconciliation)</option>
                <option value="MARKETING_ADMIN">MARKETING_ADMIN (Coupons &amp; Packages)</option>
                <option value="SUPPORT_ADMIN">SUPPORT_ADMIN (Customer Service)</option>
                <option value="CUSTOMER">Demote to Standard CUSTOMER</option>
              </select>
            </div>

            <p className="text-[11px] text-slate-400">
              This action will be logged in the immutable audit trail.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={roleMutation.isPending}
                onClick={() => {
                  roleMutation.mutate({
                    userId: selectedUser.id,
                    role: newRole,
                  });
                }}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                {roleMutation.isPending ? 'Updating Role...' : 'Save Role Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
