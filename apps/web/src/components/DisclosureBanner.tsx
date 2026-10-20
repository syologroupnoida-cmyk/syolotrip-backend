import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const DisclosureBanner: React.FC = () => {
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-900 font-medium flex items-center justify-center gap-2">
      <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
      <span>
        <strong>Simulated Travel Demo:</strong> All flights, hotels, buses, prices, and bookings on this platform are demonstration mocks. No real airline tickets or payment charges are issued.
      </span>
    </div>
  );
};
