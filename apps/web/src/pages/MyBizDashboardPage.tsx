import React, { useState, useEffect } from 'react';
import { ScreenType } from '../components/Header';
import {
  UserProfile,
  MyBizContext,
  MyBizCompany,
  MyBizEmployee,
  MyBizTravelPolicy,
  MyBizTripRequest,
  MyBizInvoice,
  MyBizReport,
  getMyBizCompanyApi,
  updateMyBizCompanyApi,
  getMyBizEmployeesApi,
  addMyBizEmployeeApi,
  deleteMyBizEmployeeApi,
  getMyBizPolicyApi,
  updateMyBizPolicyApi,
  getMyBizTripRequestsApi,
  createMyBizTripRequestApi,
  approveMyBizTripRequestApi,
  rejectMyBizTripRequestApi,
  getMyBizInvoicesApi,
  getMyBizReportsApi,
  getMyBizBookingsApi,
} from '../services/api';

interface MyBizDashboardPageProps {
  onNavigate: (screen: ScreenType) => void;
  user: UserProfile | null;
  bizContext: MyBizContext | null;
  onOpenAuth: () => void;
  initialTab?: string;
}

type DashboardTab = 'overview' | 'approvals' | 'employees' | 'policy' | 'invoices' | 'bookings' | 'settings';

export const MyBizDashboardPage: React.FC<MyBizDashboardPageProps> = ({
  onNavigate,
  user,
  bizContext: _bizContext,
  onOpenAuth,
  initialTab,
}) => {
  const mapInitialTab = (tab?: string): DashboardTab => {
    if (!tab) return 'overview';
    if (tab === 'bookings') return 'bookings';
    if (tab === 'employees' || tab === 'agents') return 'employees';
    if (tab === 'approvals') return 'approvals';
    if (tab === 'policy' || tab === 'travel-policies') return 'policy';
    if (tab === 'invoices' || tab === 'payments') return 'invoices';
    if (tab === 'settings' || tab === 'company-profile') return 'settings';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState<DashboardTab>(() => mapInitialTab(initialTab));

  useEffect(() => {
    if (initialTab) {
      setActiveTab(mapInitialTab(initialTab));
    }
  }, [initialTab]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [company, setCompany] = useState<MyBizCompany | null>(null);
  const [report, setReport] = useState<MyBizReport | null>(null);
  const [employees, setEmployees] = useState<MyBizEmployee[]>([]);
  const [policy, setPolicy] = useState<MyBizTravelPolicy | null>(null);
  const [tripRequests, setTripRequests] = useState<MyBizTripRequest[]>([]);
  const [invoices, setInvoices] = useState<MyBizInvoice[]>([]);
  const [companyBookings, setCompanyBookings] = useState<any[]>([]);

  // Modals & form state
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    email: '',
    full_name: '',
    department: 'Engineering',
    designation: 'Software Engineer',
    role: 'BIZ_EMPLOYEE',
  });

  const [showTripRequestModal, setShowTripRequestModal] = useState(false);
  const [newTripRequest, setNewTripRequest] = useState({
    service_type: 'FLIGHT',
    destination: '',
    trip_purpose: '',
    travel_date_from: '',
    travel_date_to: '',
    estimated_amount: 15000,
  });

  const [selectedInvoice, setSelectedInvoice] = useState<MyBizInvoice | null>(null);
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [policyEditMsg, setPolicyEditMsg] = useState<string | null>(null);

  // Company settings edit form
  const [companyForm, setCompanyForm] = useState<Partial<MyBizCompany>>({});
  const [companySaveMsg, setCompanySaveMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadAllData();
  }, [user]);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [compRes, repRes, empRes, polRes, tripRes, invRes, bookRes] = await Promise.all([
        getMyBizCompanyApi().catch(() => null),
        getMyBizReportsApi().catch(() => null),
        getMyBizEmployeesApi().catch(() => []),
        getMyBizPolicyApi().catch(() => null),
        getMyBizTripRequestsApi().catch(() => []),
        getMyBizInvoicesApi().catch(() => []),
        getMyBizBookingsApi().catch(() => []),
      ]);

      if (compRes) {
        setCompany(compRes);
        setCompanyForm(compRes);
      }
      if (repRes) setReport(repRes);
      setEmployees(empRes || []);
      if (polRes) setPolicy(polRes);
      setTripRequests(tripRes || []);
      setInvoices(invRes || []);
      setCompanyBookings(bookRes || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load corporate travel data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const added = await addMyBizEmployeeApi(newEmployee);
      setEmployees((prev) => [added, ...prev]);
      setShowAddEmployeeModal(false);
      setNewEmployee({
        email: '',
        full_name: '',
        department: 'Engineering',
        designation: 'Software Engineer',
        role: 'BIZ_EMPLOYEE',
      });
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || 'Failed to add employee');
    }
  };

  const handleDeleteEmployee = async (empId: string) => {
    if (!window.confirm('Are you sure you want to remove this employee from your business account?')) return;
    try {
      await deleteMyBizEmployeeApi(empId);
      setEmployees((prev) => prev.filter((e) => e.id !== empId));
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || 'Failed to remove employee');
    }
  };

  const handleCreateTripRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const req = await createMyBizTripRequestApi(newTripRequest);
      setTripRequests((prev) => [req, ...prev]);
      setShowTripRequestModal(false);
      alert('Trip approval request submitted to your travel manager!');
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || 'Failed to submit trip request');
    }
  };

  const handleApproveTrip = async (reqId: string) => {
    try {
      const updated = await approveMyBizTripRequestApi(reqId);
      setTripRequests((prev) => prev.map((r) => (r.id === reqId ? updated : r)));
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || 'Approval failed');
    }
  };

  const handleRejectTrip = async () => {
    if (!rejectingRequestId) return;
    try {
      const updated = await rejectMyBizTripRequestApi(rejectingRequestId, rejectionReason);
      setTripRequests((prev) => prev.map((r) => (r.id === rejectingRequestId ? updated : r)));
      setRejectingRequestId(null);
      setRejectionReason('');
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || 'Rejection failed');
    }
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policy) return;
    setPolicyEditMsg(null);
    try {
      const updated = await updateMyBizPolicyApi({
        name: policy.name,
        rules: policy.rules,
        is_active: policy.is_active,
      });
      setPolicy(updated);
      setPolicyEditMsg('Travel policy updated successfully!');
      setTimeout(() => setPolicyEditMsg(null), 3500);
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || 'Failed to update policy');
    }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompanySaveMsg(null);
    try {
      const updated = await updateMyBizCompanyApi(companyForm);
      setCompany(updated);
      setCompanySaveMsg('Company profile updated successfully!');
      setTimeout(() => setCompanySaveMsg(null), 3500);
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || 'Failed to update company');
    }
  };

  if (!user) {
    return (
      <div className="max-w-[1240px] mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4 font-black text-2xl">
          B
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Login to myBiz Business Account</h2>
        <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto">
          Please sign in to access your company travel management portal, employee directory, and GST invoices.
        </p>
        <button
          onClick={onOpenAuth}
          className="mt-6 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-sm shadow-md transition"
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-800 pb-20">
      {/* ── TOP BAR / COMPANY PROFILE STRIP ── */}
      <div className="bg-[#0a192f] text-white border-b border-slate-800">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center font-black text-xl text-white shadow-md shadow-orange-500/20">
                B
              </div>
              <div>
                <p className="text-[10px] text-amber-400 font-extrabold uppercase tracking-widest mb-0.5">
                  Syolo Travels myBiz Platform
                </p>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-black text-white tracking-tight">
                    {company?.name || 'My Company Business Account'}
                  </h1>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                    company?.account_type === 'AGENCY'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                      : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                  }`}>
                    {company?.account_type === 'AGENCY' ? 'Travel Agency' : 'Corporate'}
                  </span>
                  {company?.verification_status === 'VERIFIED' ? (
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-1">
                      <span className="material-symbols-outlined text-[14px]">verified</span>
                      <span>Verified</span>
                    </span>
                  ) : (
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-1">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      <span>Verification Pending</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-3 text-xs text-slate-300 mt-1">
                  <span>GSTIN: <strong className="text-slate-100">{company?.gstin || 'Not provided'}</strong></span>
                  <span>&bull;</span>
                  <span>{company?.account_type === 'AGENCY' ? 'Agents' : 'Employees'}: <strong className="text-slate-100">{employees.length}</strong></span>
                  <span>&bull;</span>
                  <span>Credit Limit: <strong className="text-emerald-300">₹{company?.credit_limit?.toLocaleString() || '0'}</strong></span>
                </div>
              </div>
            </div>

            {/* Quick Travel Booking Buttons */}
            <div className="flex items-center space-x-2.5">
              <button
                onClick={() => setShowTripRequestModal(true)}
                className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition flex items-center space-x-1.5"
              >
                <span>+ Submit Trip Request</span>
              </button>
              <button
                onClick={() => onNavigate('flights')}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs shadow-md transition flex items-center space-x-1.5"
              >
                <span>Book Corporate Flights &rarr;</span>
              </button>
            </div>
          </div>

          {/* ── NAVIGATION TABS ── */}
          <div className="flex items-center space-x-1 sm:space-x-2 mt-6 overflow-x-auto scrollbar-none border-b border-slate-700/60 pb-1">
            {[
              { id: 'overview', label: 'Overview & Analytics', icon: '📊' },
              { id: 'approvals', label: `Trip Approvals (${tripRequests.filter(r => r.status === 'PENDING').length})`, icon: '✍️' },
              { id: 'employees', label: `${company?.account_type === 'AGENCY' ? 'Agents & Staff' : 'Employees'} (${employees.length})`, icon: '👥' },
              { id: 'policy', label: 'Travel Policies', icon: '🛡️' },
              { id: 'invoices', label: `GST Invoices (${invoices.length})`, icon: '🧾' },
              { id: 'bookings', label: `Company Bookings (${companyBookings.length})`, icon: '✈️' },
              { id: 'settings', label: 'Company Profile', icon: '⚙️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as DashboardTab)}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-500">Loading your myBiz corporate portal...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold flex items-center justify-between">
            <span>{error}</span>
            <button onClick={loadAllData} className="underline text-xs">Retry</button>
          </div>
        ) : (
          <>
            {/* ══════════════ TAB 1: OVERVIEW ══════════════ */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Spend</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">
                      ₹{report?.total_spend?.toLocaleString('en-IN') || '0'}
                    </p>
                    <p className="text-[11px] text-emerald-600 font-semibold mt-1">Company-wide bookings</p>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">GST ITC Recovered</p>
                    <p className="text-2xl font-black text-emerald-600 mt-1">
                      ₹{report?.total_tax?.toLocaleString('en-IN') || '0'}
                    </p>
                    <p className="text-[11px] text-emerald-600 font-semibold mt-1">100% compliant credit</p>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Bookings</p>
                    <p className="text-2xl font-black text-blue-600 mt-1">
                      {report?.total_bookings || companyBookings.length}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">Flights, hotels & cabs</p>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Employees</p>
                    <p className="text-2xl font-black text-purple-600 mt-1">
                      {employees.length}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">Registered travelers</p>
                  </div>

                  <div className="col-span-2 md:col-span-1 bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Approvals</p>
                    <p className="text-2xl font-black text-amber-500 mt-1">
                      {tripRequests.filter((r) => r.status === 'PENDING').length}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">Awaiting review</p>
                  </div>
                </div>

                {/* Two-Column Spend Breakdowns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Service breakdown */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center justify-between">
                      <span>Spend by Service Category</span>
                      <span className="text-xs font-normal text-slate-500">YTD</span>
                    </h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Flights', key: 'FLIGHT', color: 'bg-blue-500' },
                        { label: 'Hotels', key: 'HOTEL', color: 'bg-emerald-500' },
                        { label: 'Cabs', key: 'CAB', color: 'bg-amber-500' },
                        { label: 'Buses & Trains', key: 'BUS', color: 'bg-purple-500' },
                      ].map((item) => {
                        const amount = report?.spend_by_service?.[item.key] || 0;
                        const total = report?.total_spend || 1;
                        const pct = Math.min(100, Math.round((amount / total) * 100));
                        return (
                          <div key={item.key}>
                            <div className="flex items-center justify-between text-xs font-medium mb-1">
                              <span className="text-slate-700">{item.label}</span>
                              <span className="font-bold text-slate-900">₹{amount.toLocaleString('en-IN')} ({pct}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div className={`${item.color} h-2 rounded-full`} style={{ width: `${Math.max(5, pct)}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Department breakdown */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center justify-between">
                      <span>Spend by Department</span>
                      <span className="text-xs font-normal text-slate-500">Cost Centers</span>
                    </h3>
                    <div className="space-y-3">
                      {Object.keys(report?.spend_by_department || {}).length > 0 ? (
                        Object.entries(report!.spend_by_department).map(([dept, amount]) => {
                          const total = report?.total_spend || 1;
                          const pct = Math.min(100, Math.round((amount / total) * 100));
                          return (
                            <div key={dept}>
                              <div className="flex items-center justify-between text-xs font-medium mb-1">
                                <span className="text-slate-700">{dept}</span>
                                <span className="font-bold text-slate-900">₹{amount.toLocaleString('en-IN')}</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div className="bg-slate-700 h-2 rounded-full" style={{ width: `${Math.max(5, pct)}%` }} />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-xs text-slate-400">
                          Department spend will automatically accumulate when employees book travel.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Trip Requests Quick View */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900">Recent Trip Approvals</h3>
                    <button
                      onClick={() => setActiveTab('approvals')}
                      className="text-xs font-bold text-amber-600 hover:text-amber-700"
                    >
                      View All &rarr;
                    </button>
                  </div>

                  {tripRequests.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      No trip requests submitted yet. Click "+ Submit Trip Request" to start.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                            <th className="py-2.5">Traveler</th>
                            <th>Service</th>
                            <th>Destination</th>
                            <th>Est. Amount</th>
                            <th>Status</th>
                            <th className="text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {tripRequests.slice(0, 5).map((req) => (
                            <tr key={req.id} className="hover:bg-slate-50/50">
                              <td className="py-2.5 font-medium text-slate-900">
                                {req.employee_name || req.employee_email || 'Employee'}
                              </td>
                              <td>
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                                  {req.service_type}
                                </span>
                              </td>
                              <td className="text-slate-600">{req.destination || 'Not specified'}</td>
                              <td className="font-bold text-slate-900">₹{req.estimated_amount.toLocaleString('en-IN')}</td>
                              <td>
                                <span
                                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                    req.status === 'APPROVED'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : req.status === 'REJECTED'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {req.status}
                                </span>
                              </td>
                              <td className="text-right">
                                {req.status === 'PENDING' && (
                                  <div className="flex items-center justify-end space-x-1.5">
                                    <button
                                      onClick={() => handleApproveTrip(req.id)}
                                      className="px-2 py-1 bg-emerald-600 text-white rounded font-bold text-[10px] hover:bg-emerald-700"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => setRejectingRequestId(req.id)}
                                      className="px-2 py-1 bg-slate-200 text-slate-700 rounded font-semibold text-[10px] hover:bg-rose-100 hover:text-rose-700"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══════════════ TAB 2: TRIP APPROVALS ══════════════ */}
            {activeTab === 'approvals' && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Corporate Trip Requests & Approval Queue</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Review itineraries requested by team members against your company travel policy before ticketing.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowTripRequestModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs rounded-xl shadow-sm"
                  >
                    + New Trip Request
                  </button>
                </div>

                {tripRequests.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 text-xl">
                      ✍️
                    </div>
                    <p className="text-sm font-bold text-slate-700">No Trip Requests Submitted</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Team members can create trip requests before booking flights or hotels to get manager approval.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tripRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {req.employee_name || req.employee_email}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              {req.service_type}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                req.status === 'APPROVED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : req.status === 'REJECTED'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {req.status}
                            </span>
                          </div>
                          <div className="flex items-center space-x-3 text-xs text-slate-500">
                            <span>Destination: <strong className="text-slate-700">{req.destination || 'N/A'}</strong></span>
                            <span>&bull;</span>
                            <span>Travel Dates: <strong className="text-slate-700">{req.travel_date_from || 'TBD'} to {req.travel_date_to || 'TBD'}</strong></span>
                            <span>&bull;</span>
                            <span>Estimated: <strong className="text-slate-900">₹{req.estimated_amount.toLocaleString('en-IN')}</strong></span>
                          </div>
                          {req.trip_purpose && (
                            <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg mt-1 italic">
                              "{req.trip_purpose}"
                            </p>
                          )}
                          {req.rejection_reason && (
                            <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg mt-1">
                              <strong>Rejection Reason:</strong> {req.rejection_reason}
                            </p>
                          )}
                        </div>

                        {req.status === 'PENDING' && (
                          <div className="flex items-center space-x-2 shrink-0">
                            <button
                              onClick={() => handleApproveTrip(req.id)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs"
                            >
                              Approve Trip
                            </button>
                            <button
                              onClick={() => setRejectingRequestId(req.id)}
                              className="px-4 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-lg font-semibold text-xs border border-slate-200"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ══════════════ TAB 3: EMPLOYEES ══════════════ */}
            {activeTab === 'employees' && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Corporate Employee Directory & Roles</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Manage team access, assign travel approval managers, and configure departmental designations.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddEmployeeModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs rounded-xl shadow-sm"
                  >
                    + Add Employee
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                        <th className="py-3">Name & Email</th>
                        <th>Role</th>
                        <th>Department</th>
                        <th>Designation</th>
                        <th>Status</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {employees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-slate-50/50">
                          <td className="py-3">
                            <p className="font-bold text-slate-900">{emp.full_name}</p>
                            <p className="text-slate-500 text-[11px]">{emp.email}</p>
                          </td>
                          <td>
                            <span className="px-2.5 py-1 rounded-md font-bold text-[10px] bg-slate-100 text-slate-800">
                              {emp.role === 'BIZ_ADMIN'
                                ? 'Admin'
                                : emp.role === 'BIZ_APPROVER'
                                ? 'Approver'
                                : 'Employee'}
                            </span>
                          </td>
                          <td className="text-slate-700">{emp.department || 'General'}</td>
                          <td className="text-slate-700">{emp.designation || 'Staff'}</td>
                          <td>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {emp.status}
                            </span>
                          </td>
                          <td className="text-right">
                            <button
                              onClick={() => handleDeleteEmployee(emp.id)}
                              className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ══════════════ TAB 4: TRAVEL POLICY ══════════════ */}
            {activeTab === 'policy' && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Corporate Travel Policy Guardrails</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Define spending caps, cabin classes, hotel star allowances, and advance booking rules to curb travel expenses.
                  </p>
                </div>

                {policyEditMsg && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                    {policyEditMsg}
                  </div>
                )}

                {policy && (
                  <form onSubmit={handleSavePolicy} className="space-y-6">
                    {/* Budget caps */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                        Maximum Budget Caps (Per Booking)
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Flight Max Budget (₹)
                          </label>
                          <input
                            type="number"
                            value={policy.rules?.flight_max_budget || 25000}
                            onChange={(e) =>
                              setPolicy({
                                ...policy,
                                rules: { ...policy.rules, flight_max_budget: Number(e.target.value) },
                              })
                            }
                            className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Hotel Per-Night Cap (₹)
                          </label>
                          <input
                            type="number"
                            value={policy.rules?.hotel_max_budget || 8000}
                            onChange={(e) =>
                              setPolicy({
                                ...policy,
                                rules: { ...policy.rules, hotel_max_budget: Number(e.target.value) },
                              })
                            }
                            className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Cab / Local Transit Cap (₹)
                          </label>
                          <input
                            type="number"
                            value={policy.rules?.cab_max_budget || 3000}
                            onChange={(e) =>
                              setPolicy({
                                ...policy,
                                rules: { ...policy.rules, cab_max_budget: Number(e.target.value) },
                              })
                            }
                            className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Booking rules */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                        Advance Booking & Approvals
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Advance Booking Window (Days in advance)
                          </label>
                          <input
                            type="number"
                            value={policy.rules?.advance_booking_days || 3}
                            onChange={(e) =>
                              setPolicy({
                                ...policy,
                                rules: { ...policy.rules, advance_booking_days: Number(e.target.value) },
                              })
                            }
                            className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                          <p className="text-[11px] text-slate-500 mt-1">Requires bookings to be placed at least N days before travel.</p>
                        </div>

                        <div className="space-y-3 pt-2">
                          <label className="flex items-center space-x-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={policy.rules?.requires_approval !== false}
                              onChange={(e) =>
                                setPolicy({
                                  ...policy,
                                  rules: { ...policy.rules, requires_approval: e.target.checked },
                                })
                              }
                              className="rounded text-amber-500 focus:ring-amber-400"
                            />
                            <span className="text-xs font-semibold text-slate-800">
                              Enforce manager approval for all employee bookings
                            </span>
                          </label>

                          <label className="flex items-center space-x-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={policy.rules?.international_requires_approval !== false}
                              onChange={(e) =>
                                setPolicy({
                                  ...policy,
                                  rules: { ...policy.rules, international_requires_approval: e.target.checked },
                                })
                              }
                              className="rounded text-amber-500 focus:ring-amber-400"
                            />
                            <span className="text-xs font-semibold text-slate-800">
                              Require executive approval for all international trips
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200">
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                      >
                        Save Policy Changes
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* ══════════════ TAB 5: GST INVOICES ══════════════ */}
            {activeTab === 'invoices' && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Corporate GST Invoices & ITC Reclaim</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Download tax-compliant GST invoices featuring your company GSTIN, base fares, and tax breakups.
                    </p>
                  </div>
                </div>

                {invoices.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 text-xl">
                      🧾
                    </div>
                    <p className="text-sm font-bold text-slate-700">No Invoices Available Yet</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      GST invoices are automatically created whenever an employee completes a booking with your business account.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                          <th className="py-3">Invoice Number</th>
                          <th>Booking ID</th>
                          <th>GSTIN</th>
                          <th>Base Fare</th>
                          <th>GST Tax</th>
                          <th>Total Amount</th>
                          <th className="text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {invoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-slate-50/50">
                            <td className="py-3 font-bold text-slate-900">{inv.invoice_number}</td>
                            <td className="text-slate-600">{inv.booking_id}</td>
                            <td className="font-mono text-slate-700">{inv.gstin || 'N/A'}</td>
                            <td>₹{inv.base_amount.toLocaleString('en-IN')}</td>
                            <td className="font-semibold text-emerald-600">₹{inv.tax_amount.toLocaleString('en-IN')}</td>
                            <td className="font-bold text-slate-900">₹{inv.total_amount.toLocaleString('en-IN')}</td>
                            <td className="text-right">
                              <button
                                onClick={() => setSelectedInvoice(inv)}
                                className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-lg text-xs"
                              >
                                View GST Invoice
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ══════════════ TAB 6: COMPANY BOOKINGS ══════════════ */}
            {activeTab === 'bookings' && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Company-Wide Travel Bookings</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Centralized log of all completed, confirmed, and cancelled corporate trips.
                  </p>
                </div>

                {companyBookings.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 text-xl">
                      ✈️
                    </div>
                    <p className="text-sm font-bold text-slate-700">No Corporate Bookings Yet</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      When employees book under your company profile, their full itinerary appears here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                          <th className="py-3">Booking ID</th>
                          <th>Service</th>
                          <th>Booker</th>
                          <th>Date</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {companyBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50/50">
                            <td className="py-3 font-mono font-bold text-slate-900">{b.booking_reference || b.id}</td>
                            <td>
                              <span className="px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-800 text-[10px]">
                                {b.service_type}
                              </span>
                            </td>
                            <td className="text-slate-700">{b.contact_email || 'Staff'}</td>
                            <td className="text-slate-500">{new Date(b.created_at).toLocaleDateString()}</td>
                            <td className="font-bold text-slate-900">₹{(b.total_amount || 0).toLocaleString('en-IN')}</td>
                            <td>
                              <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                                {b.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ══════════════ TAB 7: SETTINGS / PROFILE ══════════════ */}
            {activeTab === 'settings' && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Company Profile & GST Information</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update legal entity credentials used for automated corporate GST invoicing.
                  </p>
                </div>

                {companySaveMsg && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                    {companySaveMsg}
                  </div>
                )}

                <form onSubmit={handleSaveCompany} className="space-y-4 max-w-2xl">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Legal Company Name
                    </label>
                    <input
                      type="text"
                      value={companyForm.name || ''}
                      onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                      className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Company GSTIN
                      </label>
                      <input
                        type="text"
                        value={companyForm.gstin || ''}
                        onChange={(e) => setCompanyForm({ ...companyForm, gstin: e.target.value.toUpperCase() })}
                        className="w-full text-sm uppercase px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Company PAN
                      </label>
                      <input
                        type="text"
                        value={companyForm.pan || ''}
                        onChange={(e) => setCompanyForm({ ...companyForm, pan: e.target.value.toUpperCase() })}
                        className="w-full text-sm uppercase px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Registered Billing Address
                    </label>
                    <textarea
                      rows={2}
                      value={companyForm.billing_address || ''}
                      onChange={(e) => setCompanyForm({ ...companyForm, billing_address: e.target.value })}
                      className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                      <input
                        type="text"
                        value={companyForm.city || ''}
                        onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                        className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                      <input
                        type="text"
                        value={companyForm.state || ''}
                        onChange={(e) => setCompanyForm({ ...companyForm, state: e.target.value })}
                        className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Pincode</label>
                      <input
                        type="text"
                        value={companyForm.pincode || ''}
                        onChange={(e) => setCompanyForm({ ...companyForm, pincode: e.target.value })}
                        className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                    >
                      Update Company Details
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── MODAL: ADD EMPLOYEE ── */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200">
            <div className="px-6 py-4 bg-[#0a192f] text-white rounded-t-2xl flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Add Employee to Business Account</h3>
              <button onClick={() => setShowAddEmployeeModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <form onSubmit={handleAddEmployee} className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  placeholder="employee@company.com"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={newEmployee.full_name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, full_name: e.target.value })}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={newEmployee.department}
                    onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={newEmployee.designation}
                    onChange={(e) => setNewEmployee({ ...newEmployee, designation: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Access Role</label>
                <select
                  value={newEmployee.role}
                  onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="BIZ_EMPLOYEE">Employee (Book & Submit Requests)</option>
                  <option value="BIZ_APPROVER">Approver / Manager (Can Approve Trips)</option>
                  <option value="BIZ_ADMIN">Admin (Full Control)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddEmployeeModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-sm"
                >
                  Add Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE TRIP REQUEST ── */}
      {showTripRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200">
            <div className="px-6 py-4 bg-[#0a192f] text-white rounded-t-2xl flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Submit Corporate Trip Request</h3>
              <button onClick={() => setShowTripRequestModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateTripRequest} className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Service</label>
                <select
                  value={newTripRequest.service_type}
                  onChange={(e) => setNewTripRequest({ ...newTripRequest, service_type: e.target.value })}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="FLIGHT">Flight</option>
                  <option value="HOTEL">Hotel</option>
                  <option value="CAB">Cab</option>
                  <option value="BUS">Bus</option>
                  <option value="TRAIN">Train</option>
                  <option value="PACKAGE">Holiday Package</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Destination City</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bangalore, London, Tokyo"
                  value={newTripRequest.destination}
                  onChange={(e) => setNewTripRequest({ ...newTripRequest, destination: e.target.value })}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Travel From</label>
                  <input
                    type="date"
                    required
                    value={newTripRequest.travel_date_from}
                    onChange={(e) => setNewTripRequest({ ...newTripRequest, travel_date_from: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Travel To</label>
                  <input
                    type="date"
                    required
                    value={newTripRequest.travel_date_to}
                    onChange={(e) => setNewTripRequest({ ...newTripRequest, travel_date_to: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Budget (₹)</label>
                <input
                  type="number"
                  required
                  value={newTripRequest.estimated_amount}
                  onChange={(e) => setNewTripRequest({ ...newTripRequest, estimated_amount: Number(e.target.value) })}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Business Purpose / Client</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Client kick-off workshop, annual leadership conference"
                  value={newTripRequest.trip_purpose}
                  onChange={(e) => setNewTripRequest({ ...newTripRequest, trip_purpose: e.target.value })}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowTripRequestModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-lg shadow-sm"
                >
                  Send for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: REJECT TRIP REASON ── */}
      {rejectingRequestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Reject Trip Request</h3>
            <p className="text-xs text-slate-500">
              Please enter the reason for rejecting this employee trip request:
            </p>
            <textarea
              rows={3}
              required
              placeholder="e.g. Budget exceeds departmental cap, reschedule to next quarter"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full text-sm p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setRejectingRequestId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectTrip}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: GST INVOICE PREVIEW ── */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-300 p-8 my-8 print:p-0">
            {/* Invoice Header */}
            <div className="flex items-start justify-between pb-6 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white font-black text-xl flex items-center justify-center">
                  B
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">TAX INVOICE</h3>
                  <p className="text-xs text-slate-500">Syolo Travels &bull; myBiz Corporate Travel</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-700">Invoice #{selectedInvoice.invoice_number}</p>
                <p className="text-[11px] text-slate-500">Date: {new Date(selectedInvoice.created_at).toLocaleDateString()}</p>
                <p className="text-[11px] text-slate-500">Booking: {selectedInvoice.booking_id}</p>
              </div>
            </div>

            {/* Billed To */}
            <div className="grid grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs">
              <div>
                <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Billed To (Customer)</p>
                <p className="font-bold text-slate-900 text-sm">{selectedInvoice.company_name}</p>
                <p className="text-slate-600 mt-1">{selectedInvoice.billing_address || 'Registered Address'}</p>
                <p className="text-slate-900 font-mono font-bold mt-2">GSTIN: {selectedInvoice.gstin || 'UNREGISTERED'}</p>
              </div>
              <div>
                <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Issued By</p>
                <p className="font-bold text-slate-900 text-sm">Syolo Travels Global Pvt Ltd</p>
                <p className="text-slate-600 mt-1">Cyber City, DLF Phase 2, Gurugram, Haryana 122002</p>
                <p className="text-slate-900 font-mono font-bold mt-2">GSTIN: 06AAACS1234F1Z8</p>
              </div>
            </div>

            {/* Line Items */}
            <div className="py-6 border-b border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-2">Description</th>
                    <th className="text-right">Base Amount</th>
                    <th className="text-right">CGST (9%)</th>
                    <th className="text-right">SGST (9%)</th>
                    <th className="text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-3 font-medium text-slate-900">
                      Corporate Travel Booking &bull; {selectedInvoice.booking_id}
                    </td>
                    <td className="text-right">₹{selectedInvoice.base_amount.toLocaleString('en-IN')}</td>
                    <td className="text-right">₹{(selectedInvoice.tax_amount / 2).toLocaleString('en-IN')}</td>
                    <td className="text-right">₹{(selectedInvoice.tax_amount / 2).toLocaleString('en-IN')}</td>
                    <td className="text-right font-bold text-slate-900">
                      ₹{selectedInvoice.total_amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="pt-4 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                This is a computer-generated invoice with full input tax credit entitlement.
              </p>
              <div className="text-right">
                <span className="text-xs text-slate-500 mr-2">Grand Total:</span>
                <span className="text-xl font-black text-slate-900">
                  ₹{selectedInvoice.total_amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-8 pt-4 border-t border-slate-200 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center space-x-1.5"
              >
                <span>🖨️ Print / Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
