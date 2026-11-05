import React, { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Shield,
  Eye,
  RefreshCw,
  DollarSign,
  Briefcase,
} from 'lucide-react';
import {
  AdminBusinessCompany,
  AdminCompanyDetail,
  getAdminBusinessCompanies,
  getAdminBusinessCompanyById,
  verifyAdminBusinessCompany,
  rejectAdminBusinessCompany,
  suspendAdminBusinessCompany,
  updateAdminBusinessCompanyCredit,
} from '../services/api';
import { useTheme } from '../context/ThemeContext';

export const BusinessManagement: React.FC = () => {
  const { theme } = useTheme();
  const [companies, setCompanies] = useState<AdminBusinessCompany[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [accountTypeFilter, setAccountTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page] = useState(1);

  // Detail Modal
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [companyDetail, setCompanyDetail] = useState<AdminCompanyDetail | null>(null);
  const [_detailLoading, setDetailLoading] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'overview' | 'employees' | 'policy' | 'bookings' | 'invoices'>('overview');

  // Action Modals
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [newCreditLimit, setNewCreditLimit] = useState<number>(0);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, [search, accountTypeFilter, statusFilter, page]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const data = await getAdminBusinessCompanies({
        search: search.trim() || undefined,
        account_type: accountTypeFilter !== 'ALL' ? accountTypeFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        page,
        limit: 10,
      });
      setCompanies(data.companies || []);
      setTotalCount(data.total || 0);
    } catch (err: any) {
      console.error('Failed to fetch business companies', err);
    } finally {
      setLoading(false);
    }
  };

  const openCompanyDetail = async (id: string) => {
    setSelectedCompanyId(id);
    setDetailLoading(true);
    setActiveModalTab('overview');
    try {
      const detail = await getAdminBusinessCompanyById(id);
      setCompanyDetail(detail);
      setNewCreditLimit(detail.company.credit_limit || 0);
    } catch (err) {
      console.error('Failed to load company detail', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleVerify = async (id: string) => {
    if (!window.confirm('Are you sure you want to approve and verify this business account?')) return;
    setActionLoading(true);
    try {
      await verifyAdminBusinessCompany(id);
      await fetchCompanies();
      if (selectedCompanyId === id) openCompanyDetail(id);
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || 'Verification failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedCompanyId || !rejectionReason.trim()) return;
    setActionLoading(true);
    try {
      await rejectAdminBusinessCompany(selectedCompanyId, rejectionReason.trim());
      setRejectModalOpen(false);
      setRejectionReason('');
      await fetchCompanies();
      openCompanyDetail(selectedCompanyId);
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspendToggle = async (id: string, currentStatus: string) => {
    const isSuspended = currentStatus === 'SUSPENDED';
    const confirmMsg = isSuspended
      ? 'Do you want to unsuspend and reactivate this company?'
      : 'Are you sure you want to SUSPEND this company? Employees will not be able to book travel.';
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      await suspendAdminBusinessCompany(id, !isSuspended);
      await fetchCompanies();
      if (selectedCompanyId === id) openCompanyDetail(id);
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveCreditLimit = async () => {
    if (!selectedCompanyId) return;
    setActionLoading(true);
    try {
      await updateAdminBusinessCompanyCredit(selectedCompanyId, Number(newCreditLimit));
      setCreditModalOpen(false);
      await fetchCompanies();
      openCompanyDetail(selectedCompanyId);
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || 'Failed to update credit limit');
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics calculation
  const corporateCount = companies.filter((c) => c.account_type === 'CORPORATE').length;
  const agencyCount = companies.filter((c) => c.account_type === 'AGENCY').length;
  const pendingCount = companies.filter((c) => c.verification_status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Building2 className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight">SS Journey myBiz &bull; B2B Management</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review corporate enterprise accounts, travel agencies, credit terms, and KYC compliance.
          </p>
        </div>

        <button
          onClick={fetchCompanies}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* ── METRIC CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'} shadow-xs`}>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Total Accounts</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black mt-2 text-slate-900 dark:text-white">{totalCount}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Corporate &amp; Agencies</p>
        </div>

        <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'} shadow-xs`}>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Corporate Companies</span>
            <Briefcase className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black mt-2 text-amber-600 dark:text-amber-400">{corporateCount}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Internal Employee Travel</p>
        </div>

        <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'} shadow-xs`}>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Travel Agencies</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black mt-2 text-blue-600 dark:text-blue-400">{agencyCount}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">B2B Agent Console</p>
        </div>

        <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'} shadow-xs`}>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Pending Approvals</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black mt-2 text-amber-500">{pendingCount}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Awaiting Verification</p>
        </div>
      </div>

      {/* ── FILTER & SEARCH STRIP ── */}
      <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200'} flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs`}>
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search company, email, GSTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="flex items-center space-x-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={accountTypeFilter}
              onChange={(e) => setAccountTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs font-semibold focus:outline-hidden"
            >
              <option value="ALL">All Account Types</option>
              <option value="CORPORATE">Corporate Only</option>
              <option value="AGENCY">Agency Only</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs font-semibold focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* ── COMPANIES TABLE ── */}
      <div className={`rounded-2xl border ${theme === 'dark' ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200'} overflow-hidden shadow-xs`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/75 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Company &amp; Type</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">GSTIN &amp; PAN</th>
                <th className="py-3.5 px-4">Credit Terms</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading B2B accounts...</span>
                  </td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Building2 className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-50" />
                    <span>No business companies match the criteria</span>
                  </td>
                </tr>
              ) : (
                companies.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white ${
                          c.account_type === 'AGENCY' ? 'bg-blue-600' : 'bg-amber-600'
                        }`}>
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{c.name}</p>
                          <span className={`inline-block text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                            c.account_type === 'AGENCY'
                              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'
                              : 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'
                          }`}>
                            {c.account_type}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-900 dark:text-slate-200">{c.contact_person_name || 'N/A'}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{c.billing_email}</p>
                      {c.contact_person_phone && (
                        <p className="text-[10px] text-slate-400 font-mono">{c.contact_person_phone}</p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <p className="text-slate-700 dark:text-slate-300">{c.gstin || 'None'}</p>
                      <p className="text-slate-400 text-[10px]">{c.pan || ''}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">
                        ₹{(c.credit_limit || 0).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Used: ₹{(c.credit_used || 0).toLocaleString()}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      {c.verification_status === 'VERIFIED' && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300">
                          <CheckCircle className="w-3 h-3" />
                          <span>Verified</span>
                        </span>
                      )}
                      {c.verification_status === 'PENDING' && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Pending</span>
                        </span>
                      )}
                      {c.verification_status === 'REJECTED' && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300">
                          <XCircle className="w-3 h-3" />
                          <span>Rejected</span>
                        </span>
                      )}
                      {c.verification_status === 'SUSPENDED' && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          <Shield className="w-3 h-3" />
                          <span>Suspended</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => openCompanyDetail(c.id)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                        </button>

                        {c.verification_status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleVerify(c.id)}
                              className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition"
                            >
                              Verify
                            </button>
                            <button
                              onClick={() => {
                                setSelectedCompanyId(c.id);
                                setRejectModalOpen(true);
                              }}
                              className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── DETAIL MODAL ── */}
      {selectedCompanyId && companyDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className={`w-full max-w-4xl max-h-[90vh] rounded-3xl ${theme === 'dark' ? 'bg-slate-850 text-slate-100 border border-slate-700' : 'bg-white text-slate-900'} shadow-2xl overflow-hidden flex flex-col`}>
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-md ${
                  companyDetail.company.account_type === 'AGENCY' ? 'bg-blue-600' : 'bg-amber-600'
                }`}>
                  {companyDetail.company.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-black">{companyDetail.company.name}</h2>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      {companyDetail.company.account_type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {companyDetail.company.billing_email} &bull; Registered {new Date(companyDetail.company.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedCompanyId(null);
                  setCompanyDetail(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                &times;
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center space-x-2 px-6 pt-3 border-b border-slate-200 dark:border-slate-700 text-xs font-bold">
              {[
                { id: 'overview', label: 'Company Profile & KYC' },
                { id: 'employees', label: `Members (${companyDetail.employees?.length || 0})` },
                { id: 'policy', label: 'Travel Policies' },
                { id: 'bookings', label: `Bookings (${companyDetail.bookings?.length || 0})` },
                { id: 'invoices', label: `Invoices (${companyDetail.invoices?.length || 0})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveModalTab(tab.id as any)}
                  className={`pb-2.5 px-2 border-b-2 transition ${
                    activeModalTab === tab.id
                      ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {activeModalTab === 'overview' && (
                <div className="space-y-6">
                  {/* Actions & Verification Bar */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase text-slate-500">Verification Status</p>
                      <p className="text-sm font-black mt-0.5">{companyDetail.company.verification_status}</p>
                      {companyDetail.company.rejection_reason && (
                        <p className="text-rose-500 mt-1">Reason: {companyDetail.company.rejection_reason}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {companyDetail.company.verification_status !== 'VERIFIED' && (
                        <button
                          onClick={() => handleVerify(companyDetail.company.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                        >
                          Approve &amp; Verify
                        </button>
                      )}

                      {companyDetail.company.verification_status !== 'REJECTED' && (
                        <button
                          onClick={() => setRejectModalOpen(true)}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
                        >
                          Reject
                        </button>
                      )}

                      <button
                        onClick={() => handleSuspendToggle(companyDetail.company.id, companyDetail.company.verification_status)}
                        className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 font-bold hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        {companyDetail.company.verification_status === 'SUSPENDED' ? 'Unsuspend' : 'Suspend'}
                      </button>

                      <button
                        onClick={() => setCreditModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
                      >
                        Adjust Credit Limit
                      </button>
                    </div>
                  </div>

                  {/* Company Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <span className="text-slate-400 block">GSTIN</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{companyDetail.company.gstin || 'None'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">PAN</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{companyDetail.company.pan || 'None'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Contact Administrator</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">{companyDetail.company.contact_person_name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Phone</span>
                      <span className="font-mono text-slate-800 dark:text-slate-100">{companyDetail.company.contact_person_phone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Credit Limit</span>
                      <span className="font-bold text-emerald-600">₹{(companyDetail.company.credit_limit || 0).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Credit Used</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">₹{(companyDetail.company.credit_used || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeModalTab === 'employees' && (
                <div className="space-y-3">
                  <p className="text-slate-500">Registered employees and sub-agents for this account.</p>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400">
                        <th className="py-2">Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Department</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {companyDetail.employees?.map((e: any) => (
                        <tr key={e.id}>
                          <td className="py-2 font-bold">{e.full_name}</td>
                          <td>{e.email}</td>
                          <td><span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{e.role}</span></td>
                          <td>{e.department || '-'}</td>
                          <td>{e.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeModalTab === 'bookings' && (
                <div className="space-y-3">
                  <p className="text-slate-500">Corporate bookings made by members of this company.</p>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400">
                        <th className="py-2">Booking Ref</th>
                        <th>Service</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Travel Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {companyDetail.bookings?.map((b: any) => (
                        <tr key={b.id}>
                          <td className="py-2 font-mono font-bold">{b.booking_reference}</td>
                          <td>{b.service_type}</td>
                          <td className="font-bold">₹{b.total_amount?.toLocaleString()}</td>
                          <td>{b.status}</td>
                          <td>{b.travel_date ? new Date(b.travel_date).toLocaleDateString() : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeModalTab === 'invoices' && (
                <div className="space-y-3">
                  <p className="text-slate-500">GST Invoices issued for this company.</p>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400">
                        <th className="py-2">Invoice #</th>
                        <th>Billing Period</th>
                        <th>Total Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {companyDetail.invoices?.map((inv: any) => (
                        <tr key={inv.id}>
                          <td className="py-2 font-mono font-bold">{inv.invoice_number}</td>
                          <td>{inv.billing_period || '-'}</td>
                          <td className="font-bold">₹{inv.total_amount?.toLocaleString()}</td>
                          <td>{inv.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── REJECTION REASON MODAL ── */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-rose-600 flex items-center space-x-2">
              <XCircle className="w-5 h-5" />
              <span>Reject Business Application</span>
            </h3>
            <p className="text-xs text-slate-500">
              Please state the compliance or document reason for rejection. This will be visible to the company administrator.
            </p>
            <textarea
              required
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Invalid GSTIN certificate or address verification failure..."
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-hidden"
            />
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl border text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rejectionReason.trim() || actionLoading}
                onClick={handleReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREDIT LIMIT ADJUSTER MODAL ── */}
      {creditModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-amber-500 flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Adjust Corporate Credit Limit</span>
            </h3>
            <p className="text-xs text-slate-500">
              Set the maximum post-paid credit allowance for this enterprise or travel agency.
            </p>
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Credit Limit (₹)
              </label>
              <input
                type="number"
                min={0}
                step={5000}
                value={newCreditLimit}
                onChange={(e) => setNewCreditLimit(Number(e.target.value))}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 font-mono text-sm focus:outline-hidden"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setCreditModalOpen(false)}
                className="px-4 py-2 rounded-xl border text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleSaveCreditLimit}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-black disabled:opacity-50"
              >
                Save Credit Limit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
