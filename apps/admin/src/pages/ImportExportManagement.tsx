import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  FileSpreadsheet, Download, Upload, RefreshCw, CheckCircle2, 
  AlertTriangle, Clock
} from 'lucide-react';
import { 
  previewAdminImport, executeAdminImport, getAdminImportHistory 
} from '../services/api';

const ALL_ENTITIES = [
  // 10 Services
  { id: 'flights', label: 'Flights', category: 'Services' },
  { id: 'hotels', label: 'Hotels', category: 'Services' },
  { id: 'villas', label: 'Villas & Homestays', category: 'Services' },
  { id: 'packages', label: 'Holiday Packages', category: 'Services' },
  { id: 'trains', label: 'Trains', category: 'Services' },
  { id: 'buses', label: 'Buses', category: 'Services' },
  { id: 'cabs', label: 'Cabs', category: 'Services' },
  { id: 'tours', label: 'Tours & Attractions', category: 'Services' },
  { id: 'visa', label: 'Visa Requirements', category: 'Services' },
  { id: 'insurance', label: 'Travel Insurance', category: 'Services' },
  // 5 Master Data
  { id: 'airports', label: 'Airports Directory', category: 'Master Data' },
  { id: 'stations', label: 'Railway Stations', category: 'Master Data' },
  { id: 'terminals', label: 'Bus Terminals', category: 'Master Data' },
  { id: 'destinations', label: 'Cities & Destinations', category: 'Master Data' },
  { id: 'countries', label: 'Countries & Codes', category: 'Master Data' },
];

export const ImportExportManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedEntity, setSelectedEntity] = useState('packages');

  // File & preview state
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Import history query
  const { data: history, isLoading: historyLoading, refetch: refetchHistory } = useQuery({
    queryKey: ['adminImportHistory'],
    queryFn: getAdminImportHistory,
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setPreviewData(null);
    setImportResult(null);
    setImportError(null);
    setIsValidating(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string)?.split(',')[1];
        const res = await previewAdminImport(selectedEntity, {
          file_data: base64,
          file_name: uploadedFile.name,
        });
        setPreviewData(res);
        setIsValidating(false);
      };
      reader.readAsDataURL(uploadedFile);
    } catch (err: any) {
      setImportError(err.message || 'Failed to read file');
      setIsValidating(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!previewData?.valid_rows || previewData.valid_rows.length === 0) {
      alert('No valid rows available to import.');
      return;
    }

    setIsImporting(true);
    setImportError(null);

    try {
      const res = await executeAdminImport(selectedEntity, {
        rows: previewData.valid_rows,
        file_name: file?.name,
      });
      setImportResult(res);
      queryClient.invalidateQueries({ queryKey: ['adminImportHistory'] });
      queryClient.invalidateQueries({ queryKey: ['adminService', selectedEntity] });
      queryClient.invalidateQueries({ queryKey: ['adminMasterData', selectedEntity] });
      setPreviewData(null);
      setFile(null);
    } catch (err: any) {
      setImportError(err?.response?.data?.message || err.message || 'Batch import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = (format: 'xlsx' | 'csv') => {
    const url = `/api/v1/admin/io/${selectedEntity}/template?format=${format}`;
    window.open(url, '_blank');
  };

  const exportRecords = (format: 'xlsx' | 'csv') => {
    const url = `/api/v1/admin/io/${selectedEntity}/export?format=${format}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-6 h-6 text-brand-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Universal Import &amp; Export Center
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                15 Supported Entities
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Production data operations: bulk download templates, export snapshots, and upload Excel/CSV datasets with validation.
            </p>
          </div>
        </div>

        <button
          onClick={() => refetchHistory()}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh History</span>
        </button>
      </div>

      {/* Target Entity Selector */}
      <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            1. Select Target Platform Entity
          </h2>
          <span className="text-xs text-slate-400">
            Selected: <span className="font-bold text-brand-400">{ALL_ENTITIES.find(e => e.id === selectedEntity)?.label}</span>
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {ALL_ENTITIES.map((ent) => {
            const isSelected = selectedEntity === ent.id;
            return (
              <button
                key={ent.id}
                onClick={() => {
                  setSelectedEntity(ent.id);
                  setPreviewData(null);
                  setFile(null);
                  setImportResult(null);
                  setImportError(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-xs font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/80'
                }`}
              >
                <span>{ent.label}</span>
                <span className="text-[10px] opacity-60 ml-1.5">({ent.category})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Two Column Section: 2. Export & Templates + 3. Upload & Validate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Download Templates & Export Database Records */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              2. Download Templates &amp; Export Data
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Obtain exact spreadsheet schemas or dump live database records.
            </p>
          </div>

          {/* Blank Template Download */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Download Standard Blank Template</span>
              <span className="text-[10px] text-brand-400 font-mono">Sample Included</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Contains correct column headers, data type hints, and a pre-filled sample row to prevent schema mismatches.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => downloadTemplate('xlsx')}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-600/30 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download XLSX</span>
              </button>
              <button
                onClick={() => downloadTemplate('csv')}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-semibold hover:bg-blue-600/30 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV</span>
              </button>
            </div>
          </div>

          {/* Live Database Snapshot Export */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Export Live Database Snapshot</span>
              <span className="text-[10px] text-emerald-400 font-mono">Live PostgreSQL</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Download all existing records in PostgreSQL for {ALL_ENTITIES.find(e => e.id === selectedEntity)?.label}.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => exportRecords('xlsx')}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export to Excel (.xlsx)</span>
              </button>
              <button
                onClick={() => exportRecords('csv')}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>Export to CSV (.csv)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Upload & Validate Dataset */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              3. Batch Ingest &amp; Validate
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload spreadsheets to validate data types, foreign keys, and preview.
            </p>
          </div>

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-slate-800 rounded-2xl p-6 text-center hover:border-slate-700 transition">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              id="main-batch-file-upload"
              className="hidden"
            />
            <label htmlFor="main-batch-file-upload" className="cursor-pointer space-y-2 block">
              <Upload className="w-8 h-8 text-brand-400 mx-auto" />
              <div className="text-xs font-bold text-white">
                {file ? file.name : `Click or drag Excel/CSV file for ${ALL_ENTITIES.find(e => e.id === selectedEntity)?.label}`}
              </div>
              <p className="text-[11px] text-slate-500">
                Automatic row-level verification, duplicate detection, and format reconciliation.
              </p>
            </label>
          </div>

          {isValidating && (
            <div className="p-6 text-center text-slate-500 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-500" />
              <p className="text-xs">Parsing file and validating rows against database constraints...</p>
            </div>
          )}

          {importError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Import Failed</span>
              </div>
              <p>{importError}</p>
            </div>
          )}

          {importResult && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Batch Ingestion Completed Successfully</span>
              </div>
              <p>
                Imported {importResult.data?.imported_count ?? 0} records into PostgreSQL. Job ID: {importResult.data?.job_id}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Row Validation & Data Preview Table (When File is Uploaded) */}
      {previewData && (
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Validation Preview ({previewData.total_rows} Rows Processed)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Review the parsed payload before executing batch insertion into PostgreSQL.
              </p>
            </div>

            <button
              disabled={isImporting || previewData.valid_count === 0}
              onClick={handleExecuteImport}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold disabled:opacity-40 transition shadow-xs cursor-pointer"
            >
              {isImporting ? 'Executing Batch Import...' : `Execute Import (${previewData.valid_count} Valid Records)`}
            </button>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-slate-400 text-[10px]">Total Rows</div>
              <div className="text-xl font-bold text-white">{previewData.total_rows}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/30">
              <div className="text-emerald-400 text-[10px]">Valid &amp; Ready</div>
              <div className="text-xl font-bold text-emerald-400">{previewData.valid_count}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-rose-500/30">
              <div className="text-rose-400 text-[10px]">Invalid Rows</div>
              <div className="text-xl font-bold text-rose-400">{previewData.invalid_count}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/30">
              <div className="text-amber-400 text-[10px]">Duplicates Screened</div>
              <div className="text-xl font-bold text-amber-400">{previewData.duplicates_count}</div>
            </div>
          </div>

          {/* Invalid Rows List */}
          {previewData.invalid_count > 0 && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs max-h-40 overflow-y-auto space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Row-Level Errors Detected:</span>
              </div>
              {previewData.invalid_rows.slice(0, 8).map((err: any, idx: number) => (
                <div key={idx} className="text-[11px]">
                  • Row {err.row}: {err.errors.join(', ')}
                </div>
              ))}
              {previewData.invalid_rows.length > 8 && (
                <div className="text-[10px] text-slate-500">
                  ...and {previewData.invalid_rows.length - 8} additional invalid rows.
                </div>
              )}
            </div>
          )}

          {/* Table Preview */}
          <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-semibold sticky top-0 border-b border-slate-800">
                <tr>
                  {Object.keys(previewData.valid_rows?.[0] || {}).slice(0, 6).map((col) => (
                    <th key={col} className="p-2.5">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {(previewData.valid_rows || []).slice(0, 10).map((r: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-900/40">
                    {Object.values(r).slice(0, 6).map((val: any, j: number) => (
                      <td key={j} className="p-2.5 truncate max-w-[180px] font-mono text-[11px]">
                        {String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section 4: Audit & Batch Import History */}
      <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-400" />
              Batch Ingestion Audit Trail
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Historical record of all Excel and CSV files ingested into the platform.
            </p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
            AUDITED IN DB
          </span>
        </div>

        <div className="overflow-x-auto">
          {historyLoading ? (
            <div className="p-8 text-center text-slate-500">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-brand-500 mb-1" />
              Loading history...
            </div>
          ) : !history || history.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No historical batch import jobs found in database.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Job ID</th>
                  <th className="py-2.5 px-3">Entity</th>
                  <th className="py-2.5 px-3">File Name</th>
                  <th className="py-2.5 px-3">Total Rows</th>
                  <th className="py-2.5 px-3">Imported</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {history.map((job: any) => (
                  <tr key={job.id} className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                      {job.id.substring(0, 8)}...
                    </td>
                    <td className="py-2.5 px-3 font-bold text-white uppercase">
                      {job.entity}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300">
                      {job.file_name || 'manual_upload.xlsx'}
                    </td>
                    <td className="py-2.5 px-3 font-semibold">{job.total_rows}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-400">{job.success_count}</td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        job.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-400">
                      {new Date(job.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
