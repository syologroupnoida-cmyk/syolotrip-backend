import React, { useState } from 'react';

export const AppDownloadBanner: React.FC = () => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSendLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileNumber || mobileNumber.length < 10) {
      setStatusMessage('Please enter a valid 10-digit mobile number.');
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    setStatusMessage(`App download link sent successfully to +91 ${mobileNumber}!`);
    setMobileNumber('');
    setTimeout(() => setStatusMessage(null), 4000);
  };

  return (
    <section 
      aria-label="Download App Now"
      className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-100 p-6 sm:p-8 mb-8"
    >
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
        
        {/* ── LEFT: PHONE ILLUSTRATION + HEADING + FORM ── */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-5 flex-1">
          {/* Phone Graphic with Download Badge & Gift Box */}
          <div className="relative shrink-0 w-16 h-18 sm:w-20 sm:h-22 flex items-center justify-center">
            {/* Phone outline */}
            <div className="w-12 h-18 sm:w-14 sm:h-20 border-[2.5px] border-[#2b3342] rounded-2xl bg-white shadow-md flex flex-col items-center justify-between p-1.5 relative overflow-hidden">
              <div className="w-4 h-1 bg-gray-300 rounded-full mt-0.5" />
              <div className="flex flex-col items-center">
                <span className="text-[13px] font-black text-[#e41d27] tracking-tighter italic">my</span>
                <div className="w-6 h-0.5 bg-gray-200 rounded-full mt-0.5" />
              </div>
              <div className="w-2.5 h-2.5 rounded-full border border-gray-300 mb-0.5" />
            </div>

            {/* Top-Left Download Badge (Amber circle with down arrow) */}
            <div className="absolute top-0 -left-1 w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 border-2 border-white shadow-md flex items-center justify-center text-white">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
            </div>

            {/* Bottom-Right Gift Box Badge */}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-gradient-to-tr from-rose-500 to-amber-500 border-2 border-white shadow-md flex items-center justify-center text-white">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.65-.5-.65C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1h-2l1-1.35c.23-.39.63-.65 1-.65zm-6 0c.37 0 .77.26 1 .65L11 6H9c-.55 0-1-.45-1-1s.45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76V12h2V8.76L15.38 12 17 10.83 14.92 8H20v6z"/>
              </svg>
            </div>
          </div>

          {/* Heading & Mobile Input */}
          <div className="text-center md:text-left flex-1">
            <h3 className="text-2xl sm:text-[26px] font-black text-gray-900 tracking-tight">
              Download App Now !
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Use code <strong className="font-extrabold text-gray-900">WELCOMEMMT</strong> and get{' '}
              <strong className="font-extrabold text-gray-900">FLAT 25% OFF*</strong> on your first Hotel booking
            </p>

            {/* Mobile Number Input Bar */}
            <form onSubmit={handleSendLink} className="mt-4 flex flex-col sm:flex-row items-stretch max-w-[490px]">
              <div className="flex items-center bg-white border border-gray-300 rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none px-3.5 py-2 flex-1 focus-within:border-[#008cff] focus-within:ring-1 focus-within:ring-[#008cff] transition">
                <span className="text-base mr-2 select-none">🇮🇳</span>
                <span className="text-xs font-bold text-gray-700 mr-2 whitespace-nowrap">+91 —</span>
                <input
                  type="tel"
                  maxLength={10}
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter Mobile number"
                  className="w-full text-xs font-semibold text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
                />
              </div>
              <button
                type="submit"
                className="bg-white hover:bg-[#008cff] text-[#008cff] hover:text-white border border-[#008cff] font-black text-xs uppercase px-7 py-3 sm:py-0 rounded-b-lg sm:rounded-r-lg sm:rounded-bl-none transition-all duration-200 tracking-wider cursor-pointer shrink-0 shadow-xs active:scale-95"
              >
                GET APP LINK
              </button>
            </form>

            {statusMessage && (
              <p className={`text-xs mt-2 font-bold ${
                statusMessage.includes('valid') ? 'text-rose-600' : 'text-emerald-600'
              }`}>
                {statusMessage}
              </p>
            )}
          </div>
        </div>

        {/* ── RIGHT: STORE BUTTONS & QR CODE ── */}
        <div className="flex items-center gap-5 sm:gap-6 shrink-0 border-t lg:border-t-0 lg:border-l border-gray-100 pt-5 lg:pt-0 lg:pl-8">
          
          {/* App Store / Google Play Pills */}
          <div className="flex flex-col gap-2.5">
            {/* Google Play Store Badge */}
            <a 
              href="https://play.google.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 bg-black hover:bg-gray-800 text-white px-3.5 py-2 rounded-lg transition-transform hover:scale-105 shadow-sm border border-gray-700 w-[148px]"
            >
              {/* Google Play Icon */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M3.6 1.4L13.8 12 3.6 22.6c-.4-.4-.6-1-.6-1.7V3.1c0-.7.2-1.3.6-1.7z" />
                <path fill="#FBBC04" d="M17.1 8.7l-3.3 3.3 3.3 3.3 3.8-2.2c1.3-.8 1.3-2 0-2.8l-3.8-1.6z" />
                <path fill="#34A853" d="M3.6 22.6l10.2-10.6 3.3 3.3-11.6 6.7c-.7.4-1.4.3-1.9-.4z" />
                <path fill="#EA4335" d="M3.6 1.4c.5-.7 1.2-.8 1.9-.4l11.6 6.7-3.3 3.3L3.6 1.4z" />
              </svg>
              <div className="leading-none text-left">
                <span className="block text-[8px] uppercase tracking-wider text-gray-300 font-medium">GET IT ON</span>
                <span className="block text-xs font-bold text-white tracking-tight">Google play</span>
              </div>
            </a>

            {/* Apple App Store Badge */}
            <a 
              href="https://apple.com/app-store" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 bg-black hover:bg-gray-800 text-white px-3.5 py-2 rounded-lg transition-transform hover:scale-105 shadow-sm border border-gray-700 w-[148px]"
            >
              {/* Apple Icon */}
              <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.66-.82 1.11-1.96.99-3.1-.96.04-2.12.65-2.8 1.45-.6.7-1.12 1.83-.98 2.94 1.07.08 2.14-.54 2.79-1.29z"/>
              </svg>
              <div className="leading-none text-left">
                <span className="block text-[8px] uppercase tracking-wider text-gray-300 font-medium">Download on the</span>
                <span className="block text-xs font-bold text-white tracking-tight">App Store</span>
              </div>
            </a>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center">
            <div className="w-22 h-22 sm:w-24 sm:h-24 p-1.5 bg-white border border-gray-200 rounded-xl shadow-xs flex items-center justify-center">
              <svg 
                viewBox="0 0 100 100" 
                className="w-full h-full fill-gray-900" 
                shapeRendering="crispEdges"
              >
                {/* Authentic QR Pattern */}
                {/* Top-Left Finder */}
                <rect x="5" y="5" width="28" height="28" />
                <rect x="9" y="9" width="20" height="20" fill="white" />
                <rect x="13" y="13" width="12" height="12" />

                {/* Top-Right Finder */}
                <rect x="67" y="5" width="28" height="28" />
                <rect x="71" y="9" width="20" height="20" fill="white" />
                <rect x="75" y="13" width="12" height="12" />

                {/* Bottom-Left Finder */}
                <rect x="5" y="67" width="28" height="28" />
                <rect x="9" y="71" width="20" height="20" fill="white" />
                <rect x="13" y="75" width="12" height="12" />

                {/* Data Matrix Modules */}
                <rect x="37" y="9" width="6" height="6" />
                <rect x="49" y="9" width="6" height="6" />
                <rect x="43" y="19" width="6" height="6" />
                <rect x="55" y="19" width="6" height="6" />
                <rect x="37" y="27" width="6" height="6" />
                
                <rect x="9" y="37" width="6" height="6" />
                <rect x="21" y="37" width="6" height="6" />
                <rect x="37" y="37" width="8" height="8" />
                <rect x="49" y="37" width="6" height="6" />
                <rect x="61" y="37" width="6" height="6" />
                <rect x="73" y="37" width="6" height="6" />
                <rect x="85" y="37" width="6" height="6" />

                <rect x="15" y="47" width="6" height="6" />
                <rect x="27" y="47" width="6" height="6" />
                <rect x="43" y="47" width="6" height="6" />
                <rect x="55" y="47" width="6" height="6" />
                <rect x="67" y="47" width="6" height="6" />
                <rect x="79" y="47" width="6" height="6" />

                <rect x="9" y="55" width="6" height="6" />
                <rect x="37" y="55" width="6" height="6" />
                <rect x="49" y="55" width="8" height="8" />
                <rect x="63" y="55" width="6" height="6" />
                <rect x="85" y="55" width="6" height="6" />

                <rect x="37" y="67" width="6" height="6" />
                <rect x="49" y="67" width="6" height="6" />
                <rect x="67" y="67" width="8" height="8" />
                <rect x="81" y="67" width="6" height="6" />

                <rect x="43" y="79" width="6" height="6" />
                <rect x="55" y="79" width="6" height="6" />
                <rect x="73" y="79" width="6" height="6" />
                <rect x="85" y="79" width="6" height="6" />

                <rect x="37" y="87" width="6" height="6" />
                <rect x="61" y="87" width="6" height="6" />
                <rect x="79" y="87" width="6" height="6" />
              </svg>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default AppDownloadBanner;
