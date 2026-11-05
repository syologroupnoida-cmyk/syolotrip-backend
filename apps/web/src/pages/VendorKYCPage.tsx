import React, { useState, useEffect } from 'react';
import { ScreenType } from '../components/Header';
import { 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  CreditCard, 
  MapPin, 
  User, 
  ArrowRight,
  Clock
} from 'lucide-react';
import { getVendorKYCApi, submitVendorKYCApi } from '../services/api';

interface VendorKYCPageProps {
  onNavigate: (screen: ScreenType) => void;
}

export const VendorKYCPage: React.FC<VendorKYCPageProps> = ({ onNavigate }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingKYC, setExistingKYC] = useState<any | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  // 1. Personal & Business Details
  const [entityType, setEntityType] = useState('PROPRIETORSHIP');
  const [businessLegalName, setBusinessLegalName] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [gstin, setGstin] = useState('');

  // 2. Identity Proof
  const [idType, setIdType] = useState('AADHAAR');
  const [idNumber, setIdNumber] = useState('');
  const [idDocFileName, setIdDocFileName] = useState('');

  // 3. Address Proof
  const [addressDocType, setAddressDocType] = useState('ELECTRICITY_BILL');
  const [registeredAddress, setRegisteredAddress] = useState('');
  const [addressDocFileName, setAddressDocFileName] = useState('');

  // 4. Property Ownership Proof
  const [ownershipType, setOwnershipType] = useState('OWNED');
  const [ownershipDocType, setOwnershipDocType] = useState('PROPERTY_TAX_RECEIPT');
  const [ownershipDocFileName, setOwnershipDocFileName] = useState('');

  // 5. Bank Account for Payouts
  const [bankName, setBankName] = useState('HDFC Bank');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [chequeFileName, setChequeFileName] = useState('');

  useEffect(() => {
    getVendorKYCApi()
      .then((data) => {
        if (data && data.kyc) {
          setExistingKYC(data.kyc);
          if (data.kyc.business_legal_name) setBusinessLegalName(data.kyc.business_legal_name);
          if (data.kyc.pan_number) setPanNumber(data.kyc.pan_number);
          if (data.kyc.gstin) setGstin(data.kyc.gstin);
          if (data.kyc.bank_name) setBankName(data.kyc.bank_name);
          if (data.kyc.account_holder_name) setAccountHolderName(data.kyc.account_holder_name);
          if (data.kyc.account_number) setAccountNumber(data.kyc.account_number);
          if (data.kyc.ifsc_code) setIfscCode(data.kyc.ifsc_code);
        }
      })
      .catch((err) => {
        console.warn('Could not load existing KYC:', err);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!panNumber.trim() || !idNumber.trim() || !accountNumber.trim() || !ifscCode.trim()) {
      setStatusMessage({ type: 'error', text: 'Please complete all required fields.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitVendorKYCApi({
        personal_business: {
          entity_type: entityType,
          legal_name: businessLegalName || 'Property Entity',
          pan_number: panNumber.trim().toUpperCase(),
          gstin: gstin.trim().toUpperCase() || undefined,
        },
        identity_proof: {
          doc_type: idType,
          id_number: idNumber.trim(),
          file_url: idDocFileName ? `/uploads/kyc/${idDocFileName}` : '/uploads/kyc/identity_sample.pdf',
        },
        address_proof: {
          doc_type: addressDocType,
          address_text: registeredAddress || 'Registered Address',
          file_url: addressDocFileName ? `/uploads/kyc/${addressDocFileName}` : '/uploads/kyc/address_sample.pdf',
        },
        property_ownership: {
          ownership_type: ownershipType,
          doc_type: ownershipDocType,
          file_url: ownershipDocFileName ? `/uploads/kyc/${ownershipDocFileName}` : '/uploads/kyc/ownership_sample.pdf',
        },
        additional_docs: {
          bank_name: bankName,
          account_holder_name: accountHolderName || 'Account Holder',
          account_number: accountNumber.trim(),
          ifsc_code: ifscCode.trim().toUpperCase(),
          cheque_file_url: chequeFileName ? `/uploads/kyc/${chequeFileName}` : '/uploads/kyc/cheque_sample.pdf',
        },
      });

      setStatusMessage({ 
        type: 'success', 
        text: 'KYC application submitted successfully! It is now under review by our compliance team.' 
      });

      setTimeout(() => {
        onNavigate('vendor-dashboard');
      }, 1500);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to submit KYC application.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 selection:bg-[#008cff] selection:text-white">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => onNavigate('vendor-dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#008cff] transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Back to Vendor Dashboard</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-extrabold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full uppercase tracking-wider">
              {existingKYC?.status === 'APPROVED' ? 'KYC Verified' : 'KYC Verification Required'}
            </span>
          </div>
        </div>

        {/* Status Banner */}
        {existingKYC?.status === 'PENDING_REVIEW' && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">KYC Application Submitted — Under Review</p>
              <p className="text-amber-700 mt-0.5">
                Our verification team is reviewing your documents. Property creation will unlock immediately upon approval.
              </p>
            </div>
          </div>
        )}

        {statusMessage && (
          <div className={`p-4 rounded-2xl text-xs flex items-center gap-3 ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Main KYC Form Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-10 space-y-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Partner KYC Verification
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              In accordance with travel platform regulations and RBI payout compliance, please provide verified business and ownership proofs.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* ── SECTION 1: BUSINESS & LEGAL DETAILS ── */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#008cff]" />
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  1. Business &amp; Legal Details
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Entity Type
                  </label>
                  <select
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value)}
                    className="w-full text-xs font-bold px-3.5 py-3 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="PROPRIETORSHIP">Sole Proprietorship</option>
                    <option value="PARTNERSHIP">Partnership Firm</option>
                    <option value="PVT_LTD">Private Limited Company</option>
                    <option value="INDIVIDUAL">Individual Owner (Homestay)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Legal Business Name
                  </label>
                  <input
                    type="text"
                    required
                    value={businessLegalName}
                    onChange={(e) => setBusinessLegalName(e.target.value)}
                    placeholder="As registered in official tax docs"
                    className="w-full text-xs font-bold px-3.5 py-3 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Business / Owner PAN Card Number *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. ABCDE1234F"
                    className="w-full text-xs font-mono font-bold px-3.5 py-3 rounded-xl border border-slate-200 bg-white uppercase"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    GSTIN (Optional for Homestays)
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="e.g. 02AAAAA0000A1Z5"
                    className="w-full text-xs font-mono font-bold px-3.5 py-3 rounded-xl border border-slate-200 bg-white uppercase"
                  />
                </div>
              </div>
            </div>

            {/* ── SECTION 2: IDENTITY PROOF ── */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  2. Identity Verification
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Identity Document Type
                  </label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="w-full text-xs font-bold px-3.5 py-3 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="AADHAAR">Aadhaar Card (Masked)</option>
                    <option value="PASSPORT">Passport</option>
                    <option value="VOTER_ID">Voter ID Card</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    ID / Document Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="Enter document number"
                    className="w-full text-xs font-bold px-3.5 py-3 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 text-center space-y-1">
                <UploadCloud className="w-6 h-6 text-slate-400 mx-auto" />
                <label className="text-xs font-bold text-[#008cff] hover:underline cursor-pointer block">
                  <span>Upload Identity Document (PDF, JPG, PNG)</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={(e) => setIdDocFileName(e.target.files?.[0]?.name || '')}
                  />
                </label>
                <p className="text-[10px] text-slate-400">
                  {idDocFileName ? `Selected: ${idDocFileName}` : 'Max file size: 10MB. Mask first 8 digits of Aadhaar.'}
                </p>
              </div>
            </div>

            {/* ── SECTION 3: ADDRESS PROOF ── */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-600" />
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  3. Address Verification
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Address Proof Type
                  </label>
                  <select
                    value={addressDocType}
                    onChange={(e) => setAddressDocType(e.target.value)}
                    className="w-full text-xs font-bold px-3.5 py-3 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="ELECTRICITY_BILL">Electricity / Utility Bill</option>
                    <option value="TRADE_LICENSE">Trade License / Municipal Reg</option>
                    <option value="PROPERTY_TAX">Property Tax Bill</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Registered Property Address
                  </label>
                  <input
                    type="text"
                    required
                    value={registeredAddress}
                    onChange={(e) => setRegisteredAddress(e.target.value)}
                    placeholder="Full street address of property"
                    className="w-full text-xs font-bold px-3.5 py-3 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 text-center space-y-1">
                <UploadCloud className="w-6 h-6 text-slate-400 mx-auto" />
                <label className="text-xs font-bold text-[#008cff] hover:underline cursor-pointer block">
                  <span>Upload Address Proof Document</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={(e) => setAddressDocFileName(e.target.files?.[0]?.name || '')}
                  />
                </label>
                <p className="text-[10px] text-slate-400">
                  {addressDocFileName ? `Selected: ${addressDocFileName}` : 'Must be issued within the last 3 months.'}
                </p>
              </div>
            </div>

            {/* ── SECTION 4: PROPERTY OWNERSHIP PROOF ── */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-600" />
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  4. Property Ownership Proof
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Ownership Relationship
                  </label>
                  <select
                    value={ownershipType}
                    onChange={(e) => setOwnershipType(e.target.value)}
                    className="w-full text-xs font-bold px-3.5 py-3 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="OWNED">Property Owner</option>
                    <option value="LEASED">Lease / Rental Agreement</option>
                    <option value="AUTHORIZED_MANAGER">Authorized Management Agency</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Document Category
                  </label>
                  <select
                    value={ownershipDocType}
                    onChange={(e) => setOwnershipDocType(e.target.value)}
                    className="w-full text-xs font-bold px-3.5 py-3 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="PROPERTY_TAX_RECEIPT">Property Tax Receipt</option>
                    <option value="LEASE_AGREEMENT">Registered Lease Agreement</option>
                    <option value="TITLE_DEED">Title Deed / Sale Deed</option>
                  </select>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 text-center space-y-1">
                <UploadCloud className="w-6 h-6 text-slate-400 mx-auto" />
                <label className="text-xs font-bold text-[#008cff] hover:underline cursor-pointer block">
                  <span>Upload Ownership / Lease Document</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={(e) => setOwnershipDocFileName(e.target.files?.[0]?.name || '')}
                  />
                </label>
                <p className="text-[10px] text-slate-400">
                  {ownershipDocFileName ? `Selected: ${ownershipDocFileName}` : 'Proof showing authority to operate property.'}
                </p>
              </div>
            </div>

            {/* ── SECTION 5: BANK ACCOUNT FOR PAYOUTS ── */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  5. Bank Details for Automated Payouts
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    required
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. HDFC Bank, ICICI Bank, SBI"
                    className="w-full text-xs font-bold px-3.5 py-3 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    required
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    placeholder="As shown in bank passbook"
                    className="w-full text-xs font-bold px-3.5 py-3 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Bank Account Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Account Number"
                    className="w-full text-xs font-mono font-bold px-3.5 py-3 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    IFSC Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="e.g. HDFC0001234"
                    className="w-full text-xs font-mono font-bold px-3.5 py-3 rounded-xl border border-slate-200 bg-white uppercase"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 text-center space-y-1">
                <UploadCloud className="w-6 h-6 text-slate-400 mx-auto" />
                <label className="text-xs font-bold text-[#008cff] hover:underline cursor-pointer block">
                  <span>Upload Cancelled Cheque / Bank Statement</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={(e) => setChequeFileName(e.target.files?.[0]?.name || '')}
                  />
                </label>
                <p className="text-[10px] text-slate-400">
                  {chequeFileName ? `Selected: ${chequeFileName}` : 'Required for NEFT/RTGS automated payouts.'}
                </p>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-[#008cff] hover:bg-blue-600 disabled:opacity-50 text-white font-black text-sm tracking-wide shadow-lg shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.99] transition cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Submitting KYC Application...</span>
                ) : (
                  <>
                    <span>Submit Complete KYC Application for Review</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
