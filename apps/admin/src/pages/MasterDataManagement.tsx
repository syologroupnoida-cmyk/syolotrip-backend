import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Database, Plane, Train, Bus, Globe, MapPin, Plus, 
  RefreshCw, Trash2, Edit3, X, Download, Upload, Eye, CheckCircle2, 
  AlertTriangle, Search, FileSpreadsheet
} from 'lucide-react';
import { 
  getAdminServiceItems, createAdminServiceItem, 
  updateAdminServiceItemRecord, patchAdminServiceItemStatus, 
  deleteAdminServiceItemRecord, previewAdminImport, executeAdminImport
} from '../services/api';

type MasterEntity = 'airports' | 'stations' | 'terminals' | 'destinations' | 'countries';

const ENTITY_CONFIGS: Record<MasterEntity, { title: string; singular: string; icon: any; color: string; fields: string[] }> = {
  airports: {
    title: 'Airports Directory',
    singular: 'Airport',
    icon: Plane,
    color: 'text-sky-400',
    fields: ['code', 'name', 'city', 'country', 'is_international', 'latitude', 'longitude']
  },
  stations: {
    title: 'Railway Stations',
    singular: 'Railway Station',
    icon: Train,
    color: 'text-amber-400',
    fields: ['station_code', 'station_name', 'city', 'state', 'zone', 'division']
  },
  terminals: {
    title: 'Bus Terminals & Stops',
    singular: 'Bus Terminal',
    icon: Bus,
    color: 'text-emerald-400',
    fields: ['terminal_name', 'city', 'state', 'address']
  },
  destinations: {
    title: 'Cities & Destinations',
    singular: 'Destination',
    icon: MapPin,
    color: 'text-purple-400',
    fields: ['name', 'city', 'state', 'country', 'is_popular', 'tags']
  },
  countries: {
    title: 'Countries & Jurisdictions',
    singular: 'Country',
    icon: Globe,
    color: 'text-cyan-400',
    fields: ['name', 'iso2', 'iso3', 'currency', 'phone_code', 'visa_required_for_indians']
  }
};

export const MasterDataManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<MasterEntity>('airports');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [inspectItem, setInspectItem] = useState<any | null>(null);
  const [deleteItem, setDeleteItem] = useState<any | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Import flow
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importSuccess, setImportSuccess] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState<Record<string, any>>({});

  const conf = ENTITY_CONFIGS[activeTab];
  const Icon = conf.icon;

  // Query records
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['adminMasterData', activeTab, page, searchTerm],
    queryFn: () => getAdminServiceItems(activeTab, {
      page,
      limit: 25,
      search: searchTerm || undefined,
    }),
  });

  const items = data?.items || [];
  const total = data?.total || 0;

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => createAdminServiceItem(activeTab, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMasterData', activeTab] });
      setShowAddModal(false);
      setFormData({});
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => 
      updateAdminServiceItemRecord(activeTab, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMasterData', activeTab] });
      setEditItem(null);
      setFormData({});
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => 
      patchAdminServiceItemStatus(activeTab, id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMasterData', activeTab] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminServiceItemRecord(activeTab, id),
    onSuccess: (res: any) => {
      if (res?.success === false) {
        setDeleteError(res.message || 'Cannot delete master reference item: referenced by existing catalog entities');
      } else {
        queryClient.invalidateQueries({ queryKey: ['adminMasterData', activeTab] });
        setDeleteItem(null);
        setDeleteError(null);
      }
    },
    onError: (err: any) => {
      setDeleteError(err?.response?.data?.message || 'Deletion blocked due to foreign key relationships');
    },
  });

  const handleOpenAdd = () => {
    const defaults: Record<string, any> = {};
    conf.fields.forEach((f) => {
      if (f.startsWith('is_')) defaults[f] = true;
      else if (f === 'latitude') defaults[f] = 28.5562;
      else if (f === 'longitude') defaults[f] = 77.1000;
      else defaults[f] = '';
    });
    setFormData(defaults);
    setShowAddModal(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditItem(item);
    setFormData({ ...item });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportLoading(true);
    setImportPreview(null);
    setImportSuccess(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string)?.split(',')[1];
        const res = await previewAdminImport(activeTab, {
          file_data: base64,
          file_name: file.name
        });
        setImportPreview(res);
        setImportLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      alert('Error parsing file: ' + (err.message || 'Unknown error'));
      setImportLoading(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!importPreview?.valid_rows || importPreview.valid_rows.length === 0) {
      alert('No valid rows available to import.');
      return;
    }
    setImportLoading(true);
    try {
      const res = await executeAdminImport(activeTab, {
        rows: importPreview.valid_rows,
        file_name: importFile?.name
      });
      setImportSuccess(res);
      queryClient.invalidateQueries({ queryKey: ['adminMasterData', activeTab] });
      setImportPreview(null);
      setImportFile(null);
    } catch (err: any) {
      alert('Import execution failed: ' + (err.message || 'Unknown error'));
    } finally {
      setImportLoading(false);
    }
  };

  const downloadTemplate = (format: 'xlsx' | 'csv') => {
    const url = `/api/v1/admin/io/${activeTab}/template?format=${format}`;
    window.open(url, '_blank');
  };

  const exportRecords = (format: 'xlsx' | 'csv') => {
    const url = `/api/v1/admin/io/${activeTab}/export?format=${format}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
            <Database className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Master Reference Datasets
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                Discovery Infrastructure
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Authoritative normalized tables powering global multi-service autocomplete and destination searches.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Export Buttons */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => exportRecords('xlsx')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
              title="Export database records to Excel"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>XLSX</span>
            </button>
            <button
              onClick={() => exportRecords('csv')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
              title="Export database records to CSV"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>CSV</span>
            </button>
          </div>

          {/* Quick Import Button */}
          <button
            onClick={() => { setShowImportModal(true); setImportPreview(null); setImportSuccess(null); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-brand-400" />
            <span>Batch Import</span>
          </button>

          {/* Add Record Button */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add {conf.singular}</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {(Object.keys(ENTITY_CONFIGS) as MasterEntity[]).map((tab) => {
          const TabIcon = ENTITY_CONFIGS[tab].icon;
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPage(1); setSearchTerm(''); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              <span>{ENTITY_CONFIGS[tab].title}</span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder={`Search ${conf.title.toLowerCase()} by code, name, city...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>{total} total records in database</span>
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition cursor-pointer"
            title="Refresh records"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-16 text-center text-slate-500 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-500" />
            <p className="text-xs">Loading {conf.title.toLowerCase()} from PostgreSQL...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center text-slate-500 space-y-3">
            <AlertTriangle className="w-8 h-8 text-amber-500/80 mx-auto" />
            <div className="text-sm font-semibold text-slate-300">No {conf.title} Found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No master data records match your query. You can add one manually or batch import from template.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Identifier / Code</th>
                  <th className="py-3 px-4">Primary Name</th>
                  <th className="py-3 px-4">Location / Region</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {items.map((row: any) => {
                  const id = row.id || row.code || row.station_code || row.iso2;
                  const isActive = row.is_active !== false;
                  const code = row.code || row.station_code || row.iso2 || row.iso3 || row.id?.substring(0, 8);
                  const name = row.name || row.station_name || row.terminal_name || row.title;
                  const loc = row.city 
                    ? `${row.city}${row.state ? ', ' + row.state : ''}${row.country ? ' (' + row.country + ')' : ''}`
                    : row.country || row.region || 'Pan India';

                  return (
                    <tr key={id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-sky-400">
                        {code}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {name}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {loc}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleStatusMutation.mutate({ id, is_active: !isActive })}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {isActive ? 'ACTIVE' : 'INACTIVE'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setInspectItem(row)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                            title="Inspect details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(row)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-sky-400 transition cursor-pointer"
                            title="Edit record"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => { setDeleteItem(row); setDeleteError(null); }}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                            title="Delete record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 25 && (
          <div className="flex items-center justify-between p-3.5 border-t border-slate-800 text-xs text-slate-400">
            <div>Showing {items.length} of {total} records</div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <span className="px-2">Page {page}</span>
              <button
                disabled={page * 25 >= total}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inspect Item Modal */}
      {inspectItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Icon className={`w-5 h-5 ${conf.color}`} />
                <h3 className="text-sm font-bold text-white">Master Record Inspection — {conf.singular}</h3>
              </div>
              <button
                onClick={() => setInspectItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-sky-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(inspectItem, null, 2)}
              </pre>
            </div>
            <div className="p-3 border-t border-slate-800 text-right">
              <button
                onClick={() => setInspectItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {(showAddModal || editItem) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Icon className={`w-5 h-5 ${conf.color}`} />
                <h3 className="text-sm font-bold text-white">
                  {editItem ? `Edit ${conf.singular}` : `Create ${conf.singular}`}
                </h3>
              </div>
              <button
                onClick={() => { setShowAddModal(false); setEditItem(null); }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {Object.keys(formData).map((key) => {
                  if (['id', 'created_at', 'updated_at'].includes(key)) return null;
                  const val = formData[key];
                  const isBoolean = typeof val === 'boolean' || key.startsWith('is_') || key.startsWith('visa_');
                  const isNumber = typeof val === 'number';

                  return (
                    <div key={key} className={key === 'address' || key === 'tags' ? 'sm:col-span-2' : ''}>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                        {key.replace(/_/g, ' ')}
                      </label>
                      {isBoolean ? (
                        <select
                          value={formData[key] ? 'true' : 'false'}
                          onChange={(e) => setFormData({ ...formData, [key]: e.target.value === 'true' })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                        >
                          <option value="true">True / Active</option>
                          <option value="false">False / Inactive</option>
                        </select>
                      ) : (
                        <input
                          type={isNumber ? 'number' : 'text'}
                          value={formData[key] ?? ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            [key]: isNumber ? parseFloat(e.target.value) || 0 : e.target.value
                          })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => { setShowAddModal(false); setEditItem(null); }}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editItem) {
                    const id = editItem.id || editItem.code || editItem.station_code || editItem.iso2;
                    updateMutation.mutate({ id, payload: formData });
                  } else {
                    createMutation.mutate(formData);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer"
              >
                {editItem ? 'Save Changes' : 'Create Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal with Dependency Warning */}
      {deleteItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Delete Master Record?</h3>
                <p className="text-xs text-slate-400">Verifying integrity against live services.</p>
              </div>
            </div>

            {deleteError ? (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Deletion Prevented</span>
                </div>
                <p>{deleteError}</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  This location is actively referenced by inventory routes or past bookings. Deactivating it is recommended instead.
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-300">
                Are you sure you want to delete this master record? If foreign keys depend on this location, the operation will be rejected.
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => { setDeleteItem(null); setDeleteError(null); }}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              {!deleteError && (
                <button
                  onClick={() => {
                    const id = deleteItem.id || deleteItem.code || deleteItem.station_code || deleteItem.iso2;
                    deleteMutation.mutate(id);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
                >
                  Confirm Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Universal Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-bold text-white">Batch Import {conf.title}</h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-white">Download Standard Master Template</div>
                  <div className="text-[11px] text-slate-400">
                    Use our standardized Excel/CSV template with official columns and sample records.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadTemplate('xlsx')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-600/30 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Template (.xlsx)</span>
                  </button>
                  <button
                    onClick={() => downloadTemplate('csv')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-semibold hover:bg-blue-600/30 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Template (.csv)</span>
                  </button>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-800 rounded-2xl p-6 text-center hover:border-slate-700 transition">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  id="master-file-upload"
                  className="hidden"
                />
                <label htmlFor="master-file-upload" className="cursor-pointer space-y-2 block">
                  <Upload className="w-8 h-8 text-sky-400 mx-auto" />
                  <div className="text-xs font-bold text-white">
                    {importFile ? importFile.name : 'Click or drop master reference file to preview'}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Accepts .xlsx and .csv. Performs row validation and duplicate prevention.
                  </p>
                </label>
              </div>

              {importLoading && (
                <div className="p-8 text-center text-slate-500 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-500" />
                  <p className="text-xs">Validating master reference data...</p>
                </div>
              )}

              {importPreview && (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-slate-400 text-[10px]">Total Rows</div>
                      <div className="text-base font-bold text-white">{importPreview.total_rows}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-emerald-500/30">
                      <div className="text-emerald-400 text-[10px]">Valid</div>
                      <div className="text-base font-bold text-emerald-400">{importPreview.valid_count}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-rose-500/30">
                      <div className="text-rose-400 text-[10px]">Invalid</div>
                      <div className="text-base font-bold text-rose-400">{importPreview.invalid_count}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-amber-500/30">
                      <div className="text-amber-400 text-[10px]">Duplicates</div>
                      <div className="text-base font-bold text-amber-400">{importPreview.duplicates_count}</div>
                    </div>
                  </div>

                  {importPreview.invalid_count > 0 && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs max-h-36 overflow-y-auto space-y-1">
                      <div className="font-bold">Errors:</div>
                      {importPreview.invalid_rows.slice(0, 5).map((err: any, idx: number) => (
                        <div key={idx} className="text-[11px]">
                          • Row {err.row}: {err.errors.join(', ')}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {importSuccess && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Master Reference Ingestion Succeeded!</span>
                  </div>
                  <p>
                    Imported {importSuccess.data?.imported_count ?? 0} records into PostgreSQL. Job ID: {importSuccess.data?.job_id}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              {importPreview && importPreview.valid_count > 0 && (
                <button
                  disabled={importLoading}
                  onClick={handleExecuteImport}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
                >
                  Import {importPreview.valid_count} Records
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

