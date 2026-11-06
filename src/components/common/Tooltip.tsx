import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-flex items-center group cursor-help"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children || <Info className="w-3.5 h-3.5 text-slate-400 hover:text-cyan-400 transition-colors" />}

      {isVisible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-slate-900 text-slate-200 text-[11px] leading-tight rounded-md border border-slate-700 shadow-xl z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="font-medium text-cyan-300 mb-0.5">Parameter Guide</div>
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-700" />
        </div>
      )}
    </div>
  );
};
