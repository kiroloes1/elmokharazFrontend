import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import FilterBar from './FilterBar';
import SummaryStrip from './SummaryStrip';
import ReportTable from './ReportTable';
import { useReport } from './useReport';
import { useSystemSettings } from '../../context/shareInfo';

/**
 * Shared layout for every model's report: title + filters + ledger summary + table + pagination.
 * Dynamic font & theme support from SystemSettingsContext.
 */
export default function ReportPage({
  title,
  endpoint,
  filterFields = [],
  columns,
  buildSummaryItems,
  initialFilters = {},
}) {
  const { settings } = useSystemSettings();
  const { filters, updateFilter, resetFilters, data, loading, error } = useReport(
    endpoint,
    initialFilters
  );

  const summaryItems = buildSummaryItems ? buildSummaryItems(data?.summary || {}) : [];

  // بيانات الترقيم المستخرجة من الـ Backend
  const currentPage = Number(data?.pagination?.page || filters?.page || 1);
  const totalPages = Number(
    data?.pagination?.pages ||
      (data?.pagination?.total ? Math.ceil(data.pagination.total / (data.pagination.limit || 10)) : 1)
  );
  const totalRecords = data?.pagination?.total || data?.detail?.length || 0;

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      updateFilter('page', newPage);
    }
  };

  return (
    <section
      dir="rtl"
      className="w-full mx-auto p-4 md:p-6 transition-all duration-200 overflow-auto"
      style={{
        fontFamily: settings?.systemFont ? `var(--system-font), sans-serif` : 'inherit',
      }}
    >
      {/* رأس الصفحة مع العنوان الدايناميكي */}
      {title && (
        <div className="mb-6 flex items-center justify-between border-b pb-3 border-stone-200/40 print:mb-4 print:pb-0">
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--primary)' }}>
            {title}
          </h2>
        </div>
      )}

      {/* شريط الفلاتر - إخفاء عند الطباعة */}
      <div className="mb-6 print:hidden">
        <FilterBar
          fields={filterFields}
          filters={filters}
          onChange={updateFilter}
          onReset={resetFilters}
        />
      </div>

      {/* ملخص الأرقام والتجمعات */}
      {summaryItems.length > 0 && (
        <div className="mb-6">
          <SummaryStrip items={summaryItems} />
        </div>
      )}

      {/* الجدول الرئيسي للبيانات */}
      <div className="bg-white/80 dark:bg-slate-900/40 rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden print:border-none print:shadow-none">
        <ReportTable
          columns={columns}
          rows={data?.detail || data?.data?.[0]?.items || []}
          loading={loading}
          error={error}
        />

        {/* ==================== Pagination Bar ==================== */}
        {!loading && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-stone-200/60 bg-dark text-sm print:hidden">
            <div className="text-light-600 dark:text-stone-400">
              عرض الصفحة <span className="font-semibold text-stone-900 dark:text-stone-200">{currentPage}</span> من{' '}
              <span className="font-semibold text-stone-900 dark:text-stone-200">{totalPages}</span>
              {totalRecords > 0 && (
                <span className="mr-2 text-xs opacity-100">({totalRecords} إجمالي السجلات)</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-slate-800 text-stone-700 dark:text-stone-200 hover:bg-brown-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronRight size={16} />
                <span>السابق</span>
              </button>

              <div className="flex items-center gap-1 px-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, index, array) => {
                    const isExtraEllipsis = index > 0 && p - array[index - 1] > 1;
                    return (
                      <React.Fragment key={p}>
                        {isExtraEllipsis && <span className="px-1 text-stone-400">...</span>}
                        <button
                          onClick={() => handlePageChange(p)}
                          className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                            currentPage === p
                              ? 'text-white shadow-md scale-105'
                              : 'text-stone-600 hover:bg-stone-200/60 dark:text-stone-300'
                          }`}
                          style={{
                            backgroundColor: currentPage === p ? 'var(--secondary)' : 'transparent',
                          }}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-slate-800 text-stone-700 dark:text-stone-200 hover:bg-brown-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <span>التالي</span>
                <ChevronLeft size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}