import React, { useEffect, useRef, useState } from 'react';
import api from '../../services/api';

/**
 * حقل بحث عن التاجر بالاسم — يعرض الاسم للمستخدم، لكن القيمة المخزّنة في الفلاتر هي الـ id فقط.
 * field: { key, label, placeholder }
 * value: الـ id المختار حالياً (أو '')
 * onChange: (key, id) => void
 */
export default function CustomerSearch({ field, value, onChange }) {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  // تحميل التجار مرة واحدة
  useEffect(() => {
    const getSuppliers = async () => {
      try {
        setLoading(true);
        const res = await api.get('/customers/getAllSupplierName');
        setSuppliers(res.data?.suppliers || res.data?.data || res.data || []);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
      } finally {
        setLoading(false);
      }
    };
    getSuppliers();
  }, []);

  // قفل القائمة عند الضغط بره الحقل
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // لو الفلاتر اتصفّرت من بره (resetFilters) نمسح النص المعروض كمان
  useEffect(() => {
    if (!value) setSearch('');
  }, [value]);

  const filteredSuppliers = suppliers.filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedSupplier = suppliers.find((s) => s._id === value);

  const handleSelect = (supplier) => {
    onChange(field.key, supplier._id); // الـ id فقط يتبعت للفلاتر
    setSearch(supplier.name);          // الاسم بس للعرض
    setOpen(false);
  };

  const handleClear = () => {
    onChange(field.key, '');
    setSearch('');
    setOpen(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block mb-2 text-sm font-medium">{field.label}</label>

      <div className="relative">
        <input
          type="text"
          value={selectedSupplier?.name || search}
          placeholder={field.placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
            if (value) onChange(field.key, ''); // غيّر الاسم يدوي => امسح الـ id القديم
          }}
          className="w-full px-3 py-2 rounded-xl border border-stone-300 outline-none focus:ring-2 focus:ring-brown"
        />

        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-red-500"
          >
            ×
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-stone-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {loading && <div className="p-3 text-sm text-stone-500">جاري تحميل التجار...</div>}

          {!loading && filteredSuppliers.length === 0 && (
            <div className="p-3 text-sm text-stone-500">لا يوجد تاجر بهذا الاسم</div>
          )}

          {!loading &&
            filteredSuppliers.map((supplier) => (
              <button
                key={supplier._id}
                type="button"
                onClick={() => handleSelect(supplier)}
                className="w-full text-right px-4 py-3 hover:bg-stone-100 transition"
              >
                <div className="font-medium text-stone-800">{supplier.name}</div>
                {supplier.phone && (
                  <div className="text-xs text-stone-500 mt-1">{supplier.phone}</div>
                )}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
