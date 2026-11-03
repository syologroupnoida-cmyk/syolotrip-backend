import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plane, Hotel, Bus, Compass, Train, Car, Plus, RefreshCw, 
  MapPin, Trash2, Edit3, X, Download, Upload, Eye, CheckCircle2, 
  AlertTriangle, Home, FileCheck2, ShieldCheck, FileSpreadsheet, Search
} from 'lucide-react';
import { 
  getAdminServiceItems, createAdminServiceItem, 
  updateAdminServiceItemRecord, patchAdminServiceItemStatus, 
  deleteAdminServiceItemRecord, previewAdminImport, executeAdminImport
} from '../services/api';

export interface UniversalServiceManagementProps {
  entity: 'flights' | 'hotels' | 'villas' | 'packages' | 'trains' | 'buses' | 'cabs' | 'tours' | 'visa' | 'insurance';
}

const SERVICE_META: Record<string, { title: string; singular: string; icon: any; color: string }> = {
  flights: { title: 'Flight Inventory', singular: 'Flight', icon: Plane, color: 'text-blue-400' },
  hotels: { title: 'Hotel Properties', singular: 'Hotel', icon: Hotel, color: 'text-indigo-400' },
  villas: { title: 'Villas & Homestays', singular: 'Villa', icon: Home, color: 'text-emerald-400' },
  packages: { title: 'Holiday Packages', singular: 'Package', icon: Compass, color: 'text-purple-400' },
  trains: { title: 'Train Routes', singular: 'Train', icon: Train, color: 'text-sky-400' },
  buses: { title: 'Intercity Buses', singular: 'Bus', icon: Bus, color: 'text-teal-400' },
  cabs: { title: 'Cab Fleets', singular: 'Cab', icon: Car, color: 'text-amber-400' },
  tours: { title: 'Tours & Attractions', singular: 'Tour', icon: MapPin, color: 'text-rose-400' },
  visa: { title: 'Visa Requirements', singular: 'Visa Rule', icon: FileCheck2, color: 'text-cyan-400' },
  insurance: { title: 'Travel Insurance Plans', singular: 'Insurance Plan', icon: ShieldCheck, color: 'text-green-400' },
};

export const UniversalServiceManagement: React.FC<UniversalServiceManagementProps> = ({ entity }) => {
  const queryClient = useQueryClient();
  const meta = SERVICE_META[entity] || { title: entity, singular: entity, icon: Compass, color: 'text-brand-400' };
  const Icon = meta.icon;

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [publicationFilter, setPublicationFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'>('ALL');
  const [page, setPage] = useState(1);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [inspectItem, setInspectItem] = useState<any | null>(null);
  const [deleteItem, setDeleteItem] = useState<any | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Import flow state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importSuccess, setImportSuccess] = useState<any | null>(null);

  // Form State for Adding / Editing
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Query service records
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['adminService', entity, page, searchTerm, statusFilter, publicationFilter],
    queryFn: () => getAdminServiceItems(entity, {
      page,
      limit: 25,
      search: searchTerm || undefined,
      is_active: statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
      publication_status: publicationFilter === 'ALL' ? undefined : publicationFilter,
    }),
  });

  const items = data?.items || [];
  const total = data?.total || 0;

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => createAdminServiceItem(entity, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminService', entity] });
      setShowAddModal(false);
      setFormData({});
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateAdminServiceItemRecord(entity, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminService', entity] });
      setEditItem(null);
      setFormData({});
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active, status }: { id: string; is_active?: boolean; status?: string }) => 
      patchAdminServiceItemStatus(entity, id, { is_active, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminService', entity] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminServiceItemRecord(entity, id),
    onSuccess: (res: any) => {
      if (res?.success === false) {
        setDeleteError(res.message || 'Cannot delete record: linked to existing customer bookings');
      } else {
        queryClient.invalidateQueries({ queryKey: ['adminService', entity] });
        setDeleteItem(null);
        setDeleteError(null);
      }
    },
    onError: (err: any) => {
      setDeleteError(err?.response?.data?.message || 'Deletion failed due to database constraints');
    },
  });

  // Handle Default Values per entity
  const getInitialForm = () => {
    switch (entity) {
      case 'flights':
        return {
          airline: 'Air India', airline_code: 'AI', flight_number: 'AI-204',
          aircraft: 'Airbus A320neo', origin_code: 'DEL', origin_city: 'New Delhi',
          destination_code: 'BOM', destination_city: 'Mumbai', departure_time: '10:00',
          arrival_time: '12:15', duration_minutes: 135, cabin_class: 'ECONOMY',
          available_seats: 120, base_fare: 4500, taxes: 650, total_price: 5150
        };
      case 'hotels':
        return {
          name: 'The Grand Heritage', property_type: 'HOTEL', star_rating: 5,
          user_rating: 4.8, city: 'Goa', country: 'India', starting_price: 6500,
          description: 'Premier seaside luxury resort.', check_in_time: '14:00',
          check_out_time: '11:00'
        };
      case 'villas':
        return {
          name: 'Seaside Villa Azure', destination: 'Goa', city: 'Calangute',
          country: 'India', bedrooms: 3, bathrooms: 3, max_guests: 8,
          price_per_night: 18000, private_pool: true, beach_access: true,
          overview: 'Private cliffside luxury villa with infinity pool.'
        };
      case 'packages':
        return {
          title: 'Enchanting Kerala Backwaters', destination: 'Kerala',
          duration_days: 5, duration_nights: 4, starting_price: 18999,
          package_type: 'Family', overview: 'Houseboat stays and tea plantations.'
        };
      case 'trains':
        return {
          train_number: '12952', train_name: 'Mumbai Rajdhani Express',
          train_type: 'Superfast', from_city: 'New Delhi', from_station_code: 'NDLS',
          to_city: 'Mumbai', to_station_code: 'MMCT', departure_time: '16:55',
          arrival_time: '08:35', duration_minutes: 940, train_class: '3A',
          available_seats: 50, base_fare: 2200
        };
      case 'buses':
        return {
          operator_name: 'IntrCity SmartBus', bus_type: 'AC Sleeper 2+1',
          from_city: 'Delhi', to_city: 'Manali', boarding_point: 'Kashmere Gate ISBT',
          dropping_point: 'Mall Road', departure_time: '20:30', arrival_time: '08:00',
          duration_minutes: 690, available_seats: 30, base_fare: 1250
        };
      case 'cabs':
        return {
          cab_type: 'Sedan', vehicle_model: 'Maruti Suzuki Dzire', city: 'Delhi',
          pickup_area: 'IGI Airport T3', drop_area: 'Gurgaon Cyber City',
          driver_name: 'Ramesh Singh', driver_rating: 4.9, capacity: 4, base_fare: 750
        };
      case 'tours':
        return {
          title: 'Taj Mahal Sunrise Guided Tour', destination_city: 'Agra',
          country: 'India', duration_hours: 4, starting_price: 1499,
          category: 'Cultural', overview: 'Fast-track morning entry with licensed guide.'
        };
      case 'visa':
        return {
          destination_country: 'United Arab Emirates', destination_country_code: 'ARE',
          citizen_country: 'India', citizen_country_code: 'IND',
          visa_type: 'Tourist eVisa 30 Days', entry_type: 'Single Entry',
          processing_days: 3, cost: 6500, currency: 'INR', review_status: 'VERIFIED'
        };
      case 'insurance':
        return {
          plan_code: 'SHIELD-GLO-01', plan_name: 'Global Wanderer Comprehensive',
          coverage_type: 'INTERNATIONAL', medical_coverage_limit: 5000000,
          daily_premium: 149, baggage_loss_limit: 50000, trip_cancellation_limit: 100000
        };
      default:
        return {};
    }
  };

  const handleOpenAdd = () => {
    setFormData(getInitialForm());
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
        const res = await previewAdminImport(entity, {
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
      const res = await executeAdminImport(entity, {
        rows: importPreview.valid_rows,
        file_name: importFile?.name
      });
      setImportSuccess(res);
      queryClient.invalidateQueries({ queryKey: ['adminService', entity] });
      setImportPreview(null);
      setImportFile(null);
    } catch (err: any) {
      alert('Import execution failed: ' + (err.message || 'Unknown error'));
    } finally {
      setImportLoading(false);
    }
  };

  const downloadTemplate = (format: 'xlsx' | 'csv') => {
    const url = `/api/v1/admin/io/${entity}/template?format=${format}`;
    window.open(url, '_blank');
  };

  const exportRecords = (format: 'xlsx' | 'csv') => {
    const url = `/api/v1/admin/io/${entity}/export?format=${format}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
            <Icon className={`w-6 h-6 ${meta.color}`} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              {meta.title}
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                {total} Records
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Full administrative control: create, inspect, modify, import, export, and soft delete.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Export Dropdown / Buttons */}
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
            <span>Add {meta.singular}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder={`Search ${meta.title.toLowerCase()} by title, code, city...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Active status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none cursor-pointer"
          >
            <option value="ALL">All States (Active &amp; Inactive)</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>

          {/* Publication status */}
          <select
            value={publicationFilter}
            onChange={(e) => setPublicationFilter(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Publication (Published/Draft)</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition cursor-pointer"
            title="Refresh records"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Records Table */}
      <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-16 text-center text-slate-500 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-500" />
            <p className="text-xs">Loading {meta.title.toLowerCase()} from PostgreSQL...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center text-slate-500 space-y-3">
            <AlertTriangle className="w-8 h-8 text-amber-500/80 mx-auto" />
            <div className="text-sm font-semibold text-slate-300">No {meta.title} Found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are no records matching your active filters. Try resetting search or adding a new record.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Primary Identification</th>
                  <th className="py-3 px-4">Routing / Location</th>
                  <th className="py-3 px-4">Commercials</th>
                  <th className="py-3 px-4">Status &amp; Visibility</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {items.map((row: any) => {
                  const id = row.id || row.package_id || row.rule_id || row.plan_code;
                  const isActive = row.is_active !== false;
                  const pubStatus = row.publication_status || (isActive ? 'PUBLISHED' : 'DRAFT');

                  return (
                    <tr key={id} className="hover:bg-slate-900/40 transition">
                      {/* Identification column */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">
                          {row.flight_number || row.name || row.title || row.train_number || row.operator_name || row.vehicle_model || row.destination_country || row.plan_name || id}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          ID: {id?.substring(0, 16)}
                        </div>
                      </td>

                      {/* Routing / Location column */}
                      <td className="py-3 px-4">
                        <div className="text-slate-200">
                          {row.origin_city && row.destination_city
                            ? `${row.origin_city} (${row.origin_code || ''}) → ${row.destination_city} (${row.destination_code || ''})`
                            : row.from_city && row.to_city
                              ? `${row.from_city} → ${row.to_city}`
                              : row.city || row.destination || row.destination_country || row.coverage_type || 'Pan India'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {row.airline || row.property_type || row.train_type || row.bus_type || row.cab_type || row.visa_type || row.plan_code || ''}
                        </div>
                      </td>

                      {/* Commercials column */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white tabular-nums">
                          ₹{(row.total_price || row.starting_price || row.price_per_night || row.base_fare || row.cost || row.daily_premium || 0).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {row.available_seats !== undefined ? `${row.available_seats} seats` : row.duration_days ? `${row.duration_days}D/${row.duration_nights}N` : 'Standard'}
                        </div>
                      </td>

                      {/* Status column */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleStatusMutation.mutate({ id, is_active: !isActive })}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer ${
                              isActive
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                            title="Toggle Active/Inactive"
                          >
                            {isActive ? 'ACTIVE' : 'INACTIVE'}
                          </button>

                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                            pubStatus === 'PUBLISHED'
                              ? 'bg-blue-500/10 text-blue-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {pubStatus}
                          </span>
                        </div>
                      </td>

                      {/* Actions column */}
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
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-brand-400 transition cursor-pointer"
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

        {/* Pagination bar */}
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
                <Icon className={`w-5 h-5 ${meta.color}`} />
                <h3 className="text-sm font-bold text-white">Record Inspection — {meta.singular}</h3>
              </div>
              <button
                onClick={() => setInspectItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-4">
              <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
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

      {/* Add / Edit Record Modal */}
      {(showAddModal || editItem) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Icon className={`w-5 h-5 ${meta.color}`} />
                <h3 className="text-sm font-bold text-white">
                  {editItem ? `Edit ${meta.singular}` : `Create New ${meta.singular}`}
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
                  if (['id', 'created_at', 'updated_at', 'created_by'].includes(key)) return null;
                  const val = formData[key];
                  const isNumber = typeof val === 'number';
                  const isBoolean = typeof val === 'boolean';

                  return (
                    <div key={key} className={['description', 'overview', 'address', 'amenities'].includes(key) ? 'sm:col-span-2' : ''}>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                        {key.replace(/_/g, ' ')}
                      </label>
                      {isBoolean ? (
                        <select
                          value={formData[key] ? 'true' : 'false'}
                          onChange={(e) => setFormData({ ...formData, [key]: e.target.value === 'true' })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
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
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
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
                    const id = editItem.id || editItem.package_id || editItem.rule_id || editItem.plan_code;
                    updateMutation.mutate({ id, payload: formData });
                  } else {
                    createMutation.mutate(formData);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold cursor-pointer"
              >
                {editItem ? 'Save Changes' : 'Create Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Record Confirmation Modal with Dependency Protection */}
      {deleteItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Delete {meta.singular}?</h3>
                <p className="text-xs text-slate-400">Dependency verification will be performed.</p>
              </div>
            </div>

            {deleteError ? (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Deletion Blocked</span>
                </div>
                <p>{deleteError}</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Instead of deleting, consider toggling status to <strong>INACTIVE</strong> or <strong>ARCHIVED</strong> to preserve customer booking history.
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-300">
                Are you sure you want to delete this record? If there are active customer bookings linked to it, deletion will be blocked automatically.
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
                    const id = deleteItem.id || deleteItem.package_id || deleteItem.rule_id || deleteItem.plan_code;
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
                <FileSpreadsheet className="w-5 h-5 text-brand-400" />
                <h3 className="text-sm font-bold text-white">Batch Import {meta.title}</h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {/* Step 1: Template Download */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-white">Need the official format?</div>
                  <div className="text-[11px] text-slate-400">
                    Download the pre-configured blank template with standard column headers.
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

              {/* Step 2: File Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-800 rounded-2xl p-6 text-center hover:border-slate-700 transition">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  id="import-file-upload"
                  className="hidden"
                />
                <label htmlFor="import-file-upload" className="cursor-pointer space-y-2 block">
                  <Upload className="w-8 h-8 text-brand-400 mx-auto" />
                  <div className="text-xs font-bold text-white">
                    {importFile ? importFile.name : 'Click or drag Excel / CSV file here to preview'}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Supports .xlsx and .csv files. Row validation and duplicates will be screened automatically.
                  </p>
                </label>
              </div>

              {/* Step 3: Validation Preview */}
              {importLoading && (
                <div className="p-8 text-center text-slate-500 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-500" />
                  <p className="text-xs">Analyzing and validating rows against database schema...</p>
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

                  {/* Errors display */}
                  {importPreview.invalid_count > 0 && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs max-h-36 overflow-y-auto space-y-1">
                      <div className="font-bold">Validation Errors Detected:</div>
                      {importPreview.invalid_rows.slice(0, 5).map((err: any, idx: number) => (
                        <div key={idx} className="text-[11px]">
                          • Row {err.row}: {err.errors.join(', ')}
                        </div>
                      ))}
                      {importPreview.invalid_rows.length > 5 && (
                        <div className="text-[10px] text-slate-500">
                          ...and {importPreview.invalid_rows.length - 5} more invalid rows.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Preview Table */}
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-900 text-slate-400 font-semibold sticky top-0">
                        <tr>
                          {Object.keys(importPreview.valid_rows?.[0] || {}).slice(0, 5).map((col) => (
                            <th key={col} className="p-2">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {(importPreview.valid_rows || []).slice(0, 6).map((r: any, i: number) => (
                          <tr key={i}>
                            {Object.values(r).slice(0, 5).map((val: any, j: number) => (
                              <td key={j} className="p-2 truncate max-w-[150px]">{String(val)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Step 4: Import Success Result */}
              {importSuccess && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Batch Import Succeeded!</span>
                  </div>
                  <p>
                    Imported {importSuccess.data?.imported_count ?? 0} records into PostgreSQL table. 
                    Audit job ID: <span className="font-mono text-slate-300">{importSuccess.data?.job_id}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Safe Transactional Upsert: conflicts are safely resolved.
              </span>
              <div className="flex items-center gap-2">
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
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
                  >
                    Import {importPreview.valid_count} Records
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
