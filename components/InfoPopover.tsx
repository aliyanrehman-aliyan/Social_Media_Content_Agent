import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface InfoPopoverProps {
  text: string;
  className?: string;
  panelClassName?: string;
}

const InfoPopover: React.FC<InfoPopoverProps> = ({ text, className = '', panelClassName = '' }) => {
  const [open, setOpen] = useState(false);

  const toggle = (event: React.MouseEvent | React.KeyboardEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setOpen(value => !value);
  };

  return (
    <span className={`relative inline-flex items-center ${className}`}>
      <span
        role="button"
        tabIndex={0}
        aria-label={text}
        aria-expanded={open}
        onClick={toggle}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') toggle(event);
        }}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 text-indigo-600 transition-colors hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
      >
        <Info className="h-3 w-3" />
      </span>
      {open && (
        <span
          role="tooltip"
          className={`absolute left-1/2 top-full z-50 mt-1.5 w-56 -translate-x-1/2 rounded-xl border border-slate-100 bg-white px-3 py-2 text-[11px] font-semibold leading-relaxed normal-case tracking-normal text-slate-600 shadow-xl shadow-slate-200 ${panelClassName}`}
          onClick={event => event.stopPropagation()}
        >
          {text}
        </span>
      )}
    </span>
  );
};

export default InfoPopover;
