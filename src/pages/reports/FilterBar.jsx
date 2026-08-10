/**
 * Renders filter controls from a declarative field list.
 * field: { key, label, type: 'date' | 'text' | 'number' | 'select', options?, placeholder? }
 */

import CustomerSearch from './CustomerSearch';
import SupplierSearch from './SupplierSearch';


export default function FilterBar({ fields, filters, onChange, onReset }) {
  if (!fields || fields.length === 0) return null;



  return (
    <div className="flex flex-wrap items-end gap-3 mb-5 p-4 rounded-lg bg-white border border-stone-200">
      {fields.map((f) => (
        <div key={f.key} className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-stone-500">{f.label}</label>
          {f.type === 'select' ? (
            <select
              className="border border-stone-300 rounded-md px-2 py-1.5 text-sm min-w-[140px] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F5257]/40"
              value={filters[f.key] || ''}
              onChange={(e) => onChange(f.key, e.target.value)}
            >
              <option value="">الكل</option>
              {f.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) :
          f.type=="supplier-search"
          ?
              <SupplierSearch
      key={f.key}
      field={f}
      value={filters[f.key]}
      onChange={onChange}
    />

          :f.type=="customer-search"?
          
                        <CustomerSearch
      key={f.key}
      field={f}
      value={filters[f.key]}
      onChange={onChange}
    />
          

         : (
            <input
              type={f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text'}
              className="border border-stone-300 rounded-md px-2 py-1.5 text-sm min-w-[140px] focus:outline-none focus:ring-2 focus:ring-[#0F5257]/40"
              value={filters[f.key] || ''}
              placeholder={f.placeholder || ''}
              onChange={(e) => onChange(f.key, e.target.value)}
            />
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={onReset}
        className="text-sm text-stone-500 hover:text-[#B5651D] underline underline-offset-2 mb-1.5"
      >
        مسح الفلاتر
      </button>
    </div>
  );
}
