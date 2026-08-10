import React from 'react';
import { formatCurrency, formatNumber } from './format';

/**
 * SummaryStrip: شريط ملخص ديناميكي يعتمد على ألوان Tailwind المخصصة في النظام.
 */
export default function SummaryStrip({ items = [] }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="flex flex-wrap rounded-lg border border-brown/30 bg-dark text-white overflow-hidden mb-5 shadow-md transition-all print:border-stone-400 print:bg-white print:text-stone-900">
      {items.map((item, idx) => (
        <div
          key={item.label || idx}
          className={`flex-1 min-w-[140px] px-4 py-3 transition-colors hover:bg-white/5 print:border-b print:last:border-b-0 ${
            idx !== 0 ? 'border-r border-brown/20 rtl:border-r-0 rtl:border-l' : ''
          }`}
        >
          {/* عنوان البند */}
          <div className="text-[11px] font-bold uppercase tracking-wider text-accent/80 mb-1 truncate">
            {item.label}
          </div>

          {/* قيمة البند */}
          <div
            className="text-lg font-bold  tabular-nums text-brown print:text-white -900 text-right rtl:text-left"
            dir="ltr"
          >
            {item.format === 'currency'
              ? formatCurrency(item.value)
              : item.format === 'number'
              ? formatNumber(item.value)
              : item.value ?? '—'}
          </div>
        </div>
      ))}
    </div>
  );
}