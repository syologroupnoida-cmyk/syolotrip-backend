import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  TrendingUp,
  Percent,
  Calculator,
  SlidersHorizontal,
  History,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Edit,
  ShieldCheck,
  Building2,
  Users2,
  Layers,
} from 'lucide-react';
import {
  getAdminPricingRules,
  createAdminPricingRule,
  updateAdminPricingRule,
  toggleAdminPricingRule,
  deleteAdminPricingRule,
  simulateAdminPricingQuote,
  getAdminPricingComparison,
  getAdminPricingAuditLogs,
  AdminPricingRule,
} from '../services/api';
import { useTheme } from '../context/ThemeContext';

export const PricingManagement: React.FC = () => {
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'rules' | 'simulator' | 'comparison' | 'history'>('rules');
  const [channelFilter, setChannelFilter] = useState<'ALL' | 'B2C' | 'B2B'>('ALL');
  const [serviceFilter, setServiceFilter] = useState<string>('ALL');

  // Modal State for Rule Creation / Editing
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AdminPricingRule | null>(null);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    channel: 'B2C' as 'B2C' | 'B2B' | 'ALL',
    service_type: 'FLIGHT',
    calculation_type: 'PERCENTAGE_MARKUP' as 'PERCENTAGE_MARKUP' | 'FIXED_MARKUP' | 'PERCENTAGE_DISCOUNT' | 'FIXED_DISCOUNT',
    value: 5.0,
    min_markup_amount: 0,
    max_markup_amount: '',
    priority: 50,
    is_active: true,
    description: '',
    reason: '',
  });

  // Simulator State
  const [simBaseFare, setSimBaseFare] = useState<number>(5499);
  const [simTaxes, setSimTaxes] = useState<number>(750);
  const [simChannel, setSimChannel] = useState<'B2C' | 'B2B'>('B2C');
  const [simService, setSimService] = useState<string>('FLIGHT');

  // Comparison State
  const [compBaseFare, setCompBaseFare] = useState<number>(6500);
  const [compTaxes, setCompTaxes] = useState<number>(850);
  const [compService, setCompService] = useState<string>('FLIGHT');

  // Fetch Pricing Rules
  const { data: rules = [], isLoading: isLoadingRules } = useQuery({
    queryKey: ['adminPricingRules', channelFilter, serviceFilter],
    queryFn: () =>
      getAdminPricingRules({
        channel: channelFilter === 'ALL' ? undefined : channelFilter,
        service_type: serviceFilter === 'ALL' ? undefined : serviceFilter,
      }),
  });

  // Fetch Simulator Quote
  const { data: simQuote, isLoading: isSimulating } = useQuery({
    queryKey: ['adminPricingSimulation', simBaseFare, simTaxes, simChannel, simService],
    queryFn: () =>
      simulateAdminPricingQuote({
        base_fare: simBaseFare,
        taxes: simTaxes,
        channel: simChannel,
        service_type: simService,
      }),
    enabled: simBaseFare > 0,
  });

  // Fetch Side-by-Side Comparison
  const { data: comparisonData, isLoading: isLoadingComparison } = useQuery({
    queryKey: ['adminPricingComparison', compBaseFare, compTaxes, compService],
    queryFn: () =>
      getAdminPricingComparison({
        base_fare: compBaseFare,
        taxes: compTaxes,
        service_type: compService,
      }),
  });

  // Fetch Audit Logs
  const { data: auditLogs = [], isLoading: isLoadingAudit } = useQuery({
    queryKey: ['adminPricingAuditLogs'],
    queryFn: () => getAdminPricingAuditLogs(60),
    enabled: activeTab === 'history',
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createAdminPricingRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPricingRules'] });
      queryClient.invalidateQueries({ queryKey: ['adminPricingAuditLogs'] });
      setIsRuleModalOpen(false);
      resetRuleForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateAdminPricingRule(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPricingRules'] });
      queryClient.invalidateQueries({ queryKey: ['adminPricingAuditLogs'] });
      setIsRuleModalOpen(false);
      setEditingRule(null);
      resetRuleForm();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: toggleAdminPricingRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPricingRules'] });
      queryClient.invalidateQueries({ queryKey: ['adminPricingAuditLogs'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminPricingRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPricingRules'] });
      queryClient.invalidateQueries({ queryKey: ['adminPricingAuditLogs'] });
    },
  });

  const resetRuleForm = () => {
    setRuleForm({
      name: '',
      channel: 'B2C',
      service_type: 'FLIGHT',
      calculation_type: 'PERCENTAGE_MARKUP',
      value: 5.0,
      min_markup_amount: 0,
      max_markup_amount: '',
      priority: 50,
      is_active: true,
      description: '',
      reason: '',
    });
    setEditingRule(null);
  };

  const openCreateModal = () => {
    resetRuleForm();
    setIsRuleModalOpen(true);
  };

  const openEditModal = (rule: AdminPricingRule) => {
    setEditingRule(rule);
    setRuleForm({
      name: rule.name,
      channel: rule.channel,
      service_type: rule.service_type,
      calculation_type: rule.calculation_type,
      value: rule.value,
      min_markup_amount: rule.min_markup_amount || 0,
      max_markup_amount: rule.max_markup_amount ? String(rule.max_markup_amount) : '',
      priority: rule.priority,
      is_active: rule.is_active,
      description: rule.description || '',
      reason: 'Administrator updated pricing configuration',
    });
    setIsRuleModalOpen(true);
  };

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...ruleForm,
      value: Number(ruleForm.value),
      min_markup_amount: Number(ruleForm.min_markup_amount || 0),
      max_markup_amount: ruleForm.max_markup_amount ? Number(ruleForm.max_markup_amount) : null,
      priority: Number(ruleForm.priority),
    };

    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const b2cRulesCount = rules.filter((r) => r.channel === 'B2C').length;
  const b2bRulesCount = rules.filter((r) => r.channel === 'B2B').length;

  return (
    <div className="space-y-6 font-sans">
      {/* ── TOP HEADER BANNER ── */}
      <div
        className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
          theme === 'dark'
            ? 'bg-slate-950 border-slate-800 text-white'
            : 'bg-white border-slate-200 text-slate-900 shadow-xs'
        }`}
      >
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight leading-tight">
                Dynamic B2B &amp; B2C Pricing Engine
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure centralized independent markup, discount, and fee rules for Retail (B2C) and myBiz Corporate (B2B).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#008cff] hover:bg-[#0070cc] text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Pricing Rule</span>
          </button>
        </div>
      </div>

      {/* ── KPI STATS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className={`p-4 rounded-xl border flex items-center justify-between ${
            theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              B2C Retail Rules
            </span>
            <span className="text-2xl font-black text-brand-400 mt-1 block">
              {b2cRulesCount} Active
            </span>
            <span className="text-[10px] text-slate-500">Consumer website &amp; mobile app</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Users2 className="w-5 h-5" />
          </div>
        </div>

        <div
          className={`p-4 rounded-xl border flex items-center justify-between ${
            theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              B2B Corporate Rules
            </span>
            <span className="text-2xl font-black text-amber-400 mt-1 block">
              {b2bRulesCount} Active
            </span>
            <span className="text-[10px] text-slate-500">myBiz corporate verified accounts</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div
          className={`p-4 rounded-xl border flex items-center justify-between ${
            theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Calculation Standard
            </span>
            <span className="text-xl font-black text-emerald-400 mt-1 block">
              Paise Precision
            </span>
            <span className="text-[10px] text-slate-500">Integer decimal arithmetic (No float drift)</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div
          className={`p-4 rounded-xl border flex items-center justify-between ${
            theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Categories Managed
            </span>
            <span className="text-2xl font-black text-purple-400 mt-1 block">
              6 Services
            </span>
            <span className="text-[10px] text-slate-500">Flights, Hotels, Trains, Buses, Cabs, Tours</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── TAB NAVIGATION BAR ── */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6 text-sm font-bold">
        {[
          { id: 'rules' as const, label: 'Pricing Rules & Markups', icon: SlidersHorizontal },
          { id: 'simulator' as const, label: 'Live Pricing Simulator', icon: Calculator },
          { id: 'comparison' as const, label: 'B2C vs B2B Comparison', icon: Percent },
          { id: 'history' as const, label: 'Audit Trail & Change History', icon: History },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 border-b-2 cursor-pointer transition ${
                isActive
                  ? 'border-[#008cff] text-[#008cff]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: PRICING RULES MANAGER ── */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div
            className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs font-semibold ${
              theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Channel:</span>
              {(['ALL', 'B2C', 'B2B'] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setChannelFilter(ch)}
                  className={`px-3 py-1 rounded-lg cursor-pointer transition ${
                    channelFilter === ch
                      ? 'bg-[#008cff] text-white font-bold'
                      : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {ch === 'ALL' ? 'All Channels' : ch === 'B2C' ? 'B2C Retail' : 'B2B myBiz'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Category:</span>
              {['ALL', 'FLIGHT', 'HOTEL', 'TRAIN', 'BUS', 'CAB', 'PACKAGE'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setServiceFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer transition ${
                    serviceFilter === cat
                      ? 'bg-slate-200 text-slate-900 font-bold dark:bg-slate-700 dark:text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Rules Table */}
          <div
            className={`rounded-2xl border overflow-hidden ${
              theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead
                  className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                    theme === 'dark' ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <tr>
                    <th className="py-3 px-4">Rule Name</th>
                    <th className="py-3 px-4">Channel</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Pricing Method</th>
                    <th className="py-3 px-4">Markup Value</th>
                    <th className="py-3 px-4">Constraints</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {isLoadingRules ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        Loading pricing engine rules...
                      </td>
                    </tr>
                  ) : rules.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No pricing rules found matching filters.
                      </td>
                    </tr>
                  ) : (
                    rules.map((rule) => {
                      const isPercentage = rule.calculation_type.includes('PERCENTAGE');
                      const isDiscount = rule.calculation_type.includes('DISCOUNT');

                      return (
                        <tr
                          key={rule.id}
                          className={`transition ${
                            theme === 'dark' ? 'hover:bg-slate-900/50' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-3 px-4 font-bold text-slate-100">
                            <div>{rule.name}</div>
                            {rule.description && (
                              <div className="text-[10px] text-slate-400 font-normal">{rule.description}</div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                rule.channel === 'B2B'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                  : rule.channel === 'B2C'
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                  : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                              }`}
                            >
                              {rule.channel}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-300">
                            {rule.service_type}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400">
                            {rule.calculation_type.replace(/_/g, ' ')}
                          </td>
                          <td className="py-3 px-4 font-bold text-base">
                            <span className={isDiscount ? 'text-rose-400' : 'text-emerald-400'}>
                              {isDiscount ? '-' : '+'}
                              {isPercentage ? `${rule.value}%` : `₹${rule.value.toLocaleString()}`}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400">
                            {rule.min_markup_amount || rule.max_markup_amount ? (
                              <span>
                                Min: ₹{rule.min_markup_amount || 0}
                                {rule.max_markup_amount ? ` · Max: ₹${rule.max_markup_amount}` : ''}
                              </span>
                            ) : (
                              <span className="text-slate-600">None</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400">
                            P{rule.priority}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => toggleMutation.mutate(rule.id)}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold cursor-pointer transition ${
                                rule.is_active
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {rule.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              <span>{rule.is_active ? 'ACTIVE' : 'DISABLED'}</span>
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(rule)}
                              className="p-1 rounded text-slate-400 hover:text-brand-400 hover:bg-slate-800 transition cursor-pointer"
                              title="Edit rule"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete rule "${rule.name}"?`)) {
                                  deleteMutation.mutate(rule.id);
                                }
                              }}
                              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                              title="Delete rule"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: LIVE PRICING SIMULATOR ── */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Input Controls */}
          <div
            className={`lg:col-span-5 p-6 rounded-2xl border space-y-4 ${
              theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-brand-400" />
              <span>Simulation Quote Inputs</span>
            </h2>
            <p className="text-xs text-slate-400">
              Enter any supplier price to inspect the exact calculations performed by the backend pricing engine.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Customer Channel
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['B2C', 'B2B'] as const).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setSimChannel(ch)}
                      className={`p-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        simChannel === ch
                          ? 'border-[#008cff] bg-blue-500/10 text-[#008cff]'
                          : 'border-slate-800 text-slate-400 hover:bg-slate-900'
                      }`}
                    >
                      {ch === 'B2C' ? 'B2C Retail Customer' : 'B2B myBiz Corporate'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Travel Category
                </label>
                <select
                  value={simService}
                  onChange={(e) => setSimService(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#008cff]"
                >
                  {['FLIGHT', 'HOTEL', 'TRAIN', 'BUS', 'CAB', 'PACKAGE'].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Supplier Base Fare (Original Trusted Price) (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 text-xs font-bold">₹</span>
                  <input
                    type="number"
                    value={simBaseFare}
                    onChange={(e) => setSimBaseFare(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-[#008cff]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Supplier Taxes &amp; Surcharges (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 text-xs font-bold">₹</span>
                  <input
                    type="number"
                    value={simTaxes}
                    onChange={(e) => setSimTaxes(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-[#008cff]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Live Calculation Output Card */}
          <div
            className={`lg:col-span-7 p-6 rounded-2xl border space-y-5 ${
              theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white">
                  Server-Side Calculation Breakdown
                </h3>
                <span className="text-[11px] text-slate-400">
                  Channel: <strong className="text-brand-400">{simChannel}</strong> · Category:{' '}
                  <strong className="text-amber-400">{simService}</strong>
                </span>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xs border border-emerald-500/20">
                Verified Backend Calculation
              </span>
            </div>

            {isSimulating ? (
              <div className="py-12 text-center text-slate-400 text-xs">Computing quote breakdown...</div>
            ) : simQuote ? (
              <div className="space-y-4">
                {/* Active Rule Pill */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">
                      Applied Rule
                    </span>
                    <span className="font-extrabold text-white">
                      {simQuote.rule_applied?.name || 'Default Fallback (0% Markup)'}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono text-[11px]">
                    Priority P{simQuote.rule_applied?.priority ?? 100}
                  </span>
                </div>

                {/* Step-by-Step Price List */}
                <div className="space-y-2 text-xs divide-y divide-slate-800/60">
                  <div className="flex justify-between py-2 text-slate-300">
                    <span>1. Supplier Base Fare (Original Cost)</span>
                    <span className="font-mono font-bold text-white">₹{simQuote.supplier_base_fare.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between py-2 text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <span>2. SS Journey Markup</span>
                      <span className="text-[10px] text-emerald-400 font-bold">
                        ({simQuote.markup_percentage}%)
                      </span>
                    </div>
                    <span className="font-mono font-bold text-emerald-400">
                      +₹{simQuote.markup_amount.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 text-slate-300 font-semibold">
                    <span>3. Selling Base Fare (Base + Markup)</span>
                    <span className="font-mono font-bold text-white">
                      ₹{simQuote.selling_base_fare.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 text-slate-300">
                    <span>4. Supplier Taxes &amp; Levies</span>
                    <span className="font-mono font-bold text-white">₹{simQuote.supplier_taxes.toLocaleString()}</span>
                  </div>

                  {/* Final Total Big Callout */}
                  <div className="flex justify-between items-center py-4 text-base font-extrabold bg-gradient-to-r from-blue-900/30 to-indigo-900/30 p-4 rounded-xl border border-blue-500/30">
                    <div>
                      <span className="text-white block">Final Selling Price to Customer</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        Amount sent to Razorpay &amp; persisted in booking snapshot
                      </span>
                    </div>
                    <span className="text-3xl font-black text-brand-400 font-mono">
                      ₹{simQuote.total_selling_price.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 text-xs text-slate-400">
                    <span>Expected Platform Net Margin</span>
                    <span className="font-mono font-bold text-emerald-400">
                      ₹{simQuote.platform_margin.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ── TAB 3: B2C VS B2B SIDE-BY-SIDE COMPARISON ── */}
      {activeTab === 'comparison' && (
        <div className="space-y-5">
          <div
            className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 text-xs font-semibold ${
              theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-slate-400">Test Base Fare:</span>
              <input
                type="number"
                value={compBaseFare}
                onChange={(e) => setCompBaseFare(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-bold w-28"
              />
              <span className="text-slate-400 ml-2">Taxes:</span>
              <input
                type="number"
                value={compTaxes}
                onChange={(e) => setCompTaxes(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-bold w-24"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Category:</span>
              {['FLIGHT', 'HOTEL', 'TRAIN', 'BUS', 'CAB', 'PACKAGE'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setCompService(s)}
                  className={`px-3 py-1 rounded-lg cursor-pointer transition ${
                    compService === s ? 'bg-[#008cff] text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {isLoadingComparison ? (
            <div className="py-12 text-center text-slate-400 text-xs">Computing comparative pricing...</div>
          ) : comparisonData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* B2C Retail Card */}
              <div
                className={`p-6 rounded-2xl border space-y-4 ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Users2 className="w-5 h-5 text-blue-400" />
                    <h3 className="font-extrabold text-base text-white">B2C Retail Channel</h3>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Consumer Website / App
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Applied Pricing Rule</span>
                    <span className="font-bold text-white">
                      {comparisonData.b2c.rule_applied?.name || 'No Markup (0%)'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Supplier Base Fare</span>
                    <span className="font-mono text-white">₹{comparisonData.b2c.supplier_base_fare.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Retail Markup</span>
                    <span className="font-mono font-bold text-emerald-400">
                      +₹{comparisonData.b2c.markup_amount.toLocaleString()} ({comparisonData.b2c.markup_percentage}%)
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Supplier Taxes</span>
                    <span className="font-mono text-white">₹{comparisonData.b2c.supplier_taxes.toLocaleString()}</span>
                  </div>
                  <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-sm font-bold text-white">
                    <span>B2C Final Selling Price</span>
                    <span className="text-2xl font-black text-brand-400 font-mono">
                      ₹{comparisonData.b2c.total_selling_price.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* B2B myBiz Corporate Card */}
              <div
                className={`p-6 rounded-2xl border space-y-4 ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-amber-400" />
                    <h3 className="font-extrabold text-base text-white">B2B myBiz Corporate Channel</h3>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Verified Business Accounts
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Applied Pricing Rule</span>
                    <span className="font-bold text-white">
                      {comparisonData.b2b.rule_applied?.name || 'Corporate Fallback'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Supplier Base Fare</span>
                    <span className="font-mono text-white">₹{comparisonData.b2b.supplier_base_fare.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Corporate Markup</span>
                    <span className="font-mono font-bold text-amber-400">
                      +₹{comparisonData.b2b.markup_amount.toLocaleString()} ({comparisonData.b2b.markup_percentage}%)
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Supplier Taxes</span>
                    <span className="font-mono text-white">₹{comparisonData.b2b.supplier_taxes.toLocaleString()}</span>
                  </div>
                  <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-sm font-bold text-white">
                    <span>B2B Final Corporate Price</span>
                    <span className="text-2xl font-black text-amber-400 font-mono">
                      ₹{comparisonData.b2b.total_selling_price.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Difference Banner */}
              <div className="md:col-span-2 p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    %
                  </div>
                  <div>
                    <h4 className="font-bold text-white">
                      Corporate Customer Benefit: ₹
                      {comparisonData.difference.total_price_difference.toLocaleString()} Cheaper
                    </h4>
                    <span className="text-slate-400 text-[11px]">
                      myBiz corporate customers save {comparisonData.difference.b2b_savings_percentage}% compared to retail customer pricing.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ── TAB 4: AUDIT TRAIL & PRICING CHANGE HISTORY ── */}
      {activeTab === 'history' && (
        <div
          className={`rounded-2xl border overflow-hidden ${
            theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <History className="w-4 h-4 text-brand-400" />
              <span>Immutable Pricing Audit Trail</span>
            </h3>
            <span className="text-xs text-slate-400">Records every administrator pricing modification</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                  theme === 'dark' ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Admin Email</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Rule Name</th>
                  <th className="py-3 px-4">Reason / Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {isLoadingAudit ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Loading pricing audit trail...
                    </td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No pricing changes recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr
                      key={log.id}
                      className={`transition ${theme === 'dark' ? 'hover:bg-slate-900/50' : 'hover:bg-slate-50'}`}
                    >
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-200">{log.admin_email}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            log.action === 'CREATE'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : log.action === 'UPDATE'
                              ? 'bg-blue-500/10 text-blue-400'
                              : log.action === 'DELETE'
                              ? 'bg-rose-500/10 text-rose-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-300">
                        {log.rule_name || log.new_state?.name || log.previous_state?.name || 'Rule'}
                      </td>
                      <td className="py-3 px-4 text-slate-400">{log.reason || 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CREATE / EDIT RULE MODAL ── */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div
            className={`w-full max-w-xl rounded-2xl border p-6 space-y-4 shadow-2xl ${
              theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-base">
                {editingRule ? 'Edit Pricing Engine Rule' : 'Create Dynamic Pricing Rule'}
              </h3>
              <button
                type="button"
                onClick={() => setIsRuleModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer Retail Flight Markup"
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#008cff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Channel</label>
                  <select
                    value={ruleForm.channel}
                    onChange={(e) => setRuleForm({ ...ruleForm, channel: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#008cff]"
                  >
                    <option value="B2C">B2C Retail (Consumer)</option>
                    <option value="B2B">B2B Corporate (myBiz)</option>
                    <option value="ALL">ALL (Global)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Travel Service</label>
                  <select
                    value={ruleForm.service_type}
                    onChange={(e) => setRuleForm({ ...ruleForm, service_type: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#008cff]"
                  >
                    <option value="FLIGHT">Flights</option>
                    <option value="HOTEL">Hotels</option>
                    <option value="TRAIN">Trains</option>
                    <option value="BUS">Buses</option>
                    <option value="CAB">Cabs</option>
                    <option value="PACKAGE">Holiday Packages</option>
                    <option value="ALL">ALL Services</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Calculation Method</label>
                  <select
                    value={ruleForm.calculation_type}
                    onChange={(e) => setRuleForm({ ...ruleForm, calculation_type: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#008cff]"
                  >
                    <option value="PERCENTAGE_MARKUP">Percentage Markup (%)</option>
                    <option value="FIXED_MARKUP">Fixed Amount Markup (₹)</option>
                    <option value="PERCENTAGE_DISCOUNT">Percentage Discount (%)</option>
                    <option value="FIXED_DISCOUNT">Fixed Amount Discount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">
                    Value {ruleForm.calculation_type.includes('PERCENTAGE') ? '(%)' : '(₹)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={ruleForm.value}
                    onChange={(e) => setRuleForm({ ...ruleForm, value: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-[#008cff]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Min Markup (₹)</label>
                  <input
                    type="number"
                    value={ruleForm.min_markup_amount}
                    onChange={(e) => setRuleForm({ ...ruleForm, min_markup_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#008cff]"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Max Markup (₹)</label>
                  <input
                    type="number"
                    placeholder="Optional"
                    value={ruleForm.max_markup_amount}
                    onChange={(e) => setRuleForm({ ...ruleForm, max_markup_amount: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#008cff]"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Priority (1-100)</label>
                  <input
                    type="number"
                    value={ruleForm.priority}
                    onChange={(e) => setRuleForm({ ...ruleForm, priority: parseInt(e.target.value, 10) || 50 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#008cff]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Reason for Change (Audit Trail)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 corporate rate revision approved by management"
                  value={ruleForm.reason}
                  onChange={(e) => setRuleForm({ ...ruleForm, reason: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#008cff]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-[#008cff] hover:bg-[#0070cc] text-white font-bold cursor-pointer transition shadow-md"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Pricing Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingManagement;
