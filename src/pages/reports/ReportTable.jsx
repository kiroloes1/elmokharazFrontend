import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { translateEnum } from '../../services/enumTranslations';

/**
 * Generic data table with loading / empty / error states and dynamic styled pagination footer.
 * column: { key, label, render?(row) }
 */
export default function ReportTable({
  columns = [],
  rows = [],
  loading = false,
  error = null,
  pagination = null,
  onPageChange,
}) {
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-4 text-sm font-medium text-center shadow-sm">
        {error}
      </div>
    );
  }

  const currentPage = Number(pagination?.page || 1);
  const totalPages = Number(
    pagination?.pages ||
      (pagination?.total && pagination?.limit ? Math.ceil(pagination.total / pagination.limit) : 1)
  );
  const totalRecords = pagination?.total || rows.length;

  return (
    <div className="w-full rounded-lg border border-brown/20 bg-white overflow-hidden shadow-sm transition-all">
      {/* جدول البيانات */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right border-collapse">
          <thead>
            <tr className="border-b border-brown/20 bg-dark text-ligth">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3.5 font-semibold whitespace-nowrap text-right"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-stone-400 font-medium"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full animate-ping bg-brown"></span>
                    <span>جاري تحميل البيانات...</span>
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-stone-400 font-medium"
                >
                  لا توجد بيانات متاحة حالياً
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={row._id || row.id || i}
                  className="transition-colors hover:bg-ligth/40 text-stone-800"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-4 py-3 whitespace-nowrap"
                    >
                      {col.render ? translateEnum( col.render(row)) : translateEnum( row[col.key]) ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ==================== Pagination Footer ==================== */}
{!loading && pagination && totalPages > 1 && (
  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-brown/20 bg-dark text-xs sm:text-sm print:hidden">
    {/* معلومات الصفحات والأرقام */}
    <div className="text-dark/60">
      الصفحة <span className="font-bold text-dark">{currentPage}</span> من{' '}
      <span className="font-bold text-dark">{totalPages}</span>
      {totalRecords > 0 && (
        <span className="mr-2 text-dark/40">
          ({totalRecords} إجمالي النتائج)
        </span>
      )}
    </div>

    {/* أزرار الصفحات والتنقل */}
    <div className="flex items-center gap-1.5">
      {/* زر السابق */}
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange && onPageChange(currentPage - 1)}
        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-brown/30 bg-white text-dark font-medium shadow-sm hover:bg-brown/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        <ChevronRight size={15} />
        <span>السابق</span>
      </button>

      {/* أرقام الصفحات الذكية */}
      <div className="flex items-center gap-1 px-1">
        {Array.from({ length: totalPages }, (_, index) => index + 1)
          .filter(
            (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1
          )
          .map((p, idx, arr) => {
            const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
            return (
              <React.Fragment key={p}>
                {showEllipsis && <span className="px-1 text-dark/40">...</span>}
                <button
                  type="button"
                  onClick={() => onPageChange && onPageChange(p)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-semibold transition-all ${
                    currentPage === p
                      ? 'bg-brown text-white shadow-md scale-105'
                      : 'text-dark hover:bg-brown/10'
                  }`}
                >
                  {p}
                </button>
              </React.Fragment>
            );
          })}
      </div>

      {/* زر التالي */}
      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange && onPageChange(currentPage + 1)}
        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-brown/30 bg-white text-dark font-medium shadow-sm hover:bg-brown/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        <span>التالي</span>
        <ChevronLeft size={15} />
      </button>
    </div>
  </div>
)}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}