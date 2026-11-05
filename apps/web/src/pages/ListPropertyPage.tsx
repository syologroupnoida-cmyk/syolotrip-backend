import React, { useState } from 'react';
import { ScreenType } from '../components/Header';
import { 
  CheckCircle2, 
  ShieldCheck, 
  TrendingUp, 
  Headphones, 
  Percent, 
  Wallet, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight, 
  Users, 
  Globe2, 
  Star, 
  Calendar, 
  Sparkles,
  Building2,
  Home,
  Check,
  CreditCard,
  Sliders,
  BellRing
} from 'lucide-react';

interface ListPropertyPageProps {
  onNavigate: (screen: ScreenType) => void;
}

export const ListPropertyPage: React.FC<ListPropertyPageProps> = ({ onNavigate }) => {
  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleApplyClick = () => {
    onNavigate('vendor-register');
  };

  const partnerBenefits = [
    {
      icon: <Percent className="w-6 h-6 text-emerald-500" />,
      title: "0% Commission for 30 Days",
      desc: "Enjoy zero platform commission on all completed bookings during your first 30 days of listing."
    },
    {
      icon: <CheckCircle2 className="w-6 h-6 text-blue-500" />,
      title: "Instant Booking Confirmations",
      desc: "Real-time reservation alerts sent directly via SMS, email, and your dedicated Partner Extranet."
    },
    {
      icon: <Calendar className="w-6 h-6 text-indigo-500" />,
      title: "Real-Time Inventory Sync",
      desc: "Effortlessly manage room inventory, block seasonal dates, and prevent overbooking with 1-click controls."
    },
    {
      icon: <Users className="w-6 h-6 text-purple-500" />,
      title: "Dedicated Relationship Manager",
      desc: "A dedicated hospitality expert assigned to your property to optimize your pricing, photos, and rank."
    },
    {
      icon: <Wallet className="w-6 h-6 text-amber-500" />,
      title: "Guaranteed Flexible Payouts",
      desc: "Automated direct bank deposits on weekly or bi-weekly cycles with transparent GST reconciliation."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-teal-500" />,
      title: "Verified Guest Network",
      desc: "Welcome trusted, identity-verified domestic and international travelers across leisure and corporate segments."
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-rose-500" />,
      title: "Dynamic Revenue Tools",
      desc: "Leverage intelligent rate recommendations, surge pricing multipliers, and custom seasonal discounts."
    },
    {
      icon: <Headphones className="w-6 h-6 text-cyan-500" />,
      title: "24/7 Dedicated Partner Care",
      desc: "Priority toll-free support line and round-the-clock desk support for urgent guest or booking assistance."
    }
  ];

  const onboardingSteps = [
    {
      step: "01",
      title: "Quick Registration",
      desc: "Fill the simple 2-minute online form with your basic property and contact details."
    },
    {
      step: "02",
      title: "Submit KYC Documents",
      desc: "Upload standard identity, business, and property verification documents safely."
    },
    {
      step: "03",
      title: "Fast-Track Admin Review",
      desc: "Our verification team audits your KYC submission within 24 to 48 business hours."
    },
    {
      step: "04",
      title: "Add Property & Rooms",
      desc: "Set room categories, high-resolution photography, amenities, and starting base rates."
    },
    {
      step: "05",
      title: "Listing Quality Audit",
      desc: "We ensure your photography and room descriptions meet SS Journey quality standards."
    },
    {
      step: "06",
      title: "Go Live on SS Journey",
      desc: "Your property immediately appears across search results for millions of travelers."
    },
    {
      step: "07",
      title: "Receive Confirmed Bookings",
      desc: "Accept instant, pre-paid reservations and manage guest arrivals seamlessly."
    },
    {
      step: "08",
      title: "Automated Bank Payouts",
      desc: "Receive prompt payouts directly into your bank account with complete invoice breakdowns."
    }
  ];

  const managementFeatures = [
    {
      icon: <Sliders className="w-5 h-5 text-[#008cff]" />,
      title: "Live Inventory & Calendar",
      desc: "Block dates, update allotment, and manage room statuses across all room types."
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-emerald-500" />,
      title: "Dynamic Seasonal Pricing",
      desc: "Adjust rates for weekends, festive seasons, and high-demand events instantly."
    },
    {
      icon: <BellRing className="w-5 h-5 text-indigo-500" />,
      title: "Direct Inquiries & Bookings",
      desc: "Access guest contact details, special check-in requests, and voucher downloads."
    },
    {
      icon: <CreditCard className="w-5 h-5 text-amber-500" />,
      title: "Payouts & Financial Invoices",
      desc: "Download complete tax invoices, commission receipts, and settlement transaction logs."
    },
    {
      icon: <Star className="w-5 h-5 text-purple-500" />,
      title: "Guest Reviews & Ratings",
      desc: "Monitor customer ratings, respond to verified guest feedback, and build trust."
    },
    {
      icon: <Percent className="w-5 h-5 text-rose-500" />,
      title: "Flash Deals & Coupons",
      desc: "Run promotional offers, early-bird deals, and weekend discounts to boost occupancy."
    }
  ];

  const eligibleCategories = [
    {
      title: "Hotels & Luxury Resorts",
      icon: <Building2 className="w-8 h-8 text-[#008cff]" />,
      types: ["Luxury 5-Star Resorts", "Boutique Heritage Hotels", "Business & City Hotels", "Budget Stays & Inns", "Beachfront Resorts"],
      desc: "Ideal for registered hotels with multiple room categories, front desk operations, and daily housekeeping."
    },
    {
      title: "Homestays, Villas & Cottages",
      icon: <Home className="w-8 h-8 text-emerald-500" />,
      types: ["Private Luxury Villas", "Scenic Mountain Cottages", "Heritage Farmhouses", "Estate Bungalows", "Serviced Apartments"],
      desc: "Perfect for independent property owners offering personalized hospitality, local culture, and private retreats."
    }
  ];

  const faqs = [
    {
      q: "What documents are required to complete KYC verification?",
      a: "You will need: (1) Identity Proof of owner (Aadhaar or Passport), (2) Business Registration or Trade License (optional for homestays), (3) Address proof of property (Electricity Bill or Property Tax Receipt), and (4) Bank account details (Cancelled Cheque or Bank Statement) for payout settlements."
    },
    {
      q: "How long does the KYC and property approval process take?",
      a: "Our dedicated partner onboarding team reviews and approves submitted KYC applications within 24 to 48 business hours. Once KYC is approved, your property listing is reviewed and can go live within the same day."
    },
    {
      q: "What is the platform commission rate on SS Journey?",
      a: "All new property partners enjoy 0% commission for their first 30 days! Afterwards, our standard competitive commission ranges between 10% to 15%, which includes payment gateway charges and full customer marketing coverage."
    },
    {
      q: "When and how do I receive booking payouts?",
      a: "Payouts are transferred directly to your registered bank account via NEFT/RTGS. You can choose between weekly or bi-weekly settlement cycles, and all payouts come with downloadable GST-compliant invoices."
    },
    {
      q: "Can I list multiple properties or different room categories under one account?",
      a: "Yes! Your SS Journey Vendor Dashboard allows you to manage multiple properties, various room tiers (Deluxe, Suite, Standard), and multiple rate plans from a single unified portal."
    },
    {
      q: "Is there any registration fee or setup cost to join?",
      a: "No. Partner registration, listing creation, and onboarding support on SS Journey are 100% free with zero upfront setup fees."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-[#008cff] selection:text-white">
      {/* ── 1. HERO SECTION (NO EMBEDDED FORM - CLEAN EDUCATIONAL LANDING) ── */}
      <section className="relative overflow-hidden bg-slate-950 text-white min-h-[620px] flex items-center py-16 sm:py-24">
        {/* Background Image with Rich Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/assets/partner-hero-bg.jpg" 
            alt="Luxury Hotel Partner Hero" 
            className="w-full h-full object-cover object-center scale-105 animate-fade-in transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/85 to-slate-900/70" />
          <div className="absolute inset-0 bg-radial-at-c from-transparent via-slate-950/40 to-slate-950/90" />
        </div>

        <div className="relative z-10 max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-3xl space-y-6">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-white/10 text-emerald-400 border border-white/15 backdrop-blur-md shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>SS Journey Partner Network</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] text-white">
              Grow your hospitality business with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#008cff] via-sky-400 to-emerald-400">
                SS Journey
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl">
              List your hotel, luxury resort, homestay, or private villa on India's most trusted travel platform. Connect with millions of verified leisure and corporate travelers.
            </p>

            {/* Key Value Pills */}
            <div className="flex flex-wrap gap-2.5 sm:gap-3 pt-2">
              {[
                '0% Commission for 30 Days',
                'Fast 24-Hour Approval',
                'Guaranteed Weekly Payouts',
                'Real-Time Channel Extranet',
              ].map((pill, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-slate-200"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 stroke-[3]" />
                  <span>{pill}</span>
                </div>
              ))}
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-4">
              <button
                type="button"
                onClick={handleApplyClick}
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#008cff] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-black text-sm tracking-wide shadow-xl shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
              >
                <span>Become a Partner / Apply Now</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={handleApplyClick}
                className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 backdrop-blur-md transition cursor-pointer"
              >
                <span>Vendor Login &amp; Dashboard</span>
              </button>
            </div>

            {/* Bottom Proof Strip */}
            <div className="flex items-center gap-6 pt-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>100% Free Registration</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Globe2 className="w-4 h-4 text-sky-400" />
                <span>Pan-India &amp; Global Reach</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-400" />
                <span>4.8/5 Partner Satisfaction</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. WHY PARTNER WITH SS JOURNEY (8 VALUE PROPS) ── */}
      <section className="py-16 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#008cff]">
              Why Partner With Us
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Everything you need to maximize your occupancy and revenue
            </h2>
            <p className="text-sm text-slate-600">
              Designed for modern hoteliers and homestay hosts seeking maximum bookings without complicated extranet tools.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {partnerBenefits.map((b, idx) => (
              <div 
                key={idx}
                className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-[#008cff]/50 hover:bg-white hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {b.icon}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-[#008cff] transition-colors">
                    {b.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {b.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. HOW IT WORKS (8-STEP ONBOARDING JOURNEY) ── */}
      <section className="py-16 sm:py-24 bg-slate-900 text-white">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
              Step-by-Step Onboarding
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              From application to your first booking in 8 easy steps
            </h2>
            <p className="text-sm text-slate-400">
              Our streamlined onboarding process guarantees compliance, quality, and quick time-to-market.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {onboardingSteps.map((step, idx) => (
              <div 
                key={idx}
                className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-500 hover:bg-slate-800 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <span className="text-2xl font-black text-slate-500 font-mono block">
                    {step.step}
                  </span>
                  <h3 className="text-base font-bold text-white">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              type="button"
              onClick={handleApplyClick}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition cursor-pointer"
            >
              <span>Start Step 1: Register Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── 4. WHAT YOU CAN MANAGE (EXTRANET FEATURE SHOWCASE) ── */}
      <section className="py-16 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#008cff]">
              Vendor Control Panel
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              What you can manage from your dedicated Vendor Dashboard
            </h2>
            <p className="text-sm text-slate-600">
              Complete operational control over your rates, room inventory, customer reservations, and financials.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {managementFeatures.map((feat, idx) => (
              <div 
                key={idx}
                className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-lg transition space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                  {feat.icon}
                </div>
                <h3 className="text-base font-bold text-slate-900">{feat.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. ELIGIBLE PROPERTY TYPES (HOTEL & HOMESTAY) ── */}
      <section className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#008cff]">
              Eligibility
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Built for hotels, resorts, homestays and villas
            </h2>
            <p className="text-sm text-slate-600">
              Whether you manage a 100-key luxury resort or a private mountain chalet, SS Journey has customized tools for you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {eligibleCategories.map((cat, idx) => (
              <div 
                key={idx}
                className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all space-y-5"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    {cat.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">{cat.title}</h3>
                    <span className="text-xs text-slate-500">Full Extranet Management</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {cat.desc}
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Supported Categories:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {cat.types.map((t, tidx) => (
                      <span 
                        key={tidx}
                        className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. FAQ ACCORDION ── */}
      <section className="py-16 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#008cff]">
              Got Questions?
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-slate-600">
              Clear answers regarding KYC, commission, payments, and listing moderation.
            </p>
          </div>

          <div className="space-y-3.5">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div 
                  key={idx}
                  className="rounded-2xl border border-slate-200 overflow-hidden transition-all bg-white"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-5 text-left font-bold text-sm sm:text-base text-slate-900 hover:text-[#008cff] transition cursor-pointer gap-4"
                  >
                    <span>{faq.q}</span>
                    <span className="shrink-0 text-slate-400">
                      {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 7. FINAL CALL TO ACTION BANNER ── */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-blue-900 via-[#008cff] to-blue-700 text-white">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-white">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Join 5,000+ Property Partners Today</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-2xl mx-auto">
            Ready to increase your property's bookings and revenue?
          </h2>

          <p className="text-sm sm:text-base text-blue-100 max-w-xl mx-auto leading-relaxed">
            Apply in less than 2 minutes. Start with 0% commission for 30 days and get dedicated onboarding support.
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleApplyClick}
              className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-white hover:bg-slate-100 text-[#008cff] font-black text-sm tracking-wide shadow-2xl hover:scale-105 active:scale-95 transition cursor-pointer"
            >
              <span>Apply Now / Become a Partner</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
