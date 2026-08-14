import React, { useState, useEffect, useCallback } from "react";
import {
  ArchiveBoxIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  PrinterIcon,
  ShareIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import api from "../../services/api";
import html2pdf from "html2pdf.js";

const API_BASE_URL = "/advancedReports/items";

export default function ItemsReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sharing, setSharing] = useState(false);

  const [itemsData, setItemsData] = useState([]);
  const [topItem, setTopItem] = useState(null);
  const [topItemLoading, setTopItemLoading] = useState(false);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1,
    totalItems: 0,
  });

  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    sortBy: "totalWeight",
    sortOrder: "desc",
    dateFrom: "",
    dateTo: "",
  });

  // 1. جلب تقرير الأصناف
  const fetchItemsReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(filters).filter(([_, val]) => val !== "" && val !== null)
      );

      const response = await api.get(API_BASE_URL, { params: cleanParams });

      if (response.data?.success) {
        setItemsData(response.data.data || []);
        if (response.data.pagination) {
          setPagination({
            page: response.data.pagination.page,
            limit: response.data.pagination.limit,
            totalPages: response.data.pagination.totalPages,
            totalItems: response.data.pagination.totalItems,
          });
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "حدث خطأ أثناء جلب تقرير الأصناف"
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // 2. جلب أكثر صنف وارد (كارت مستقل، بيراعي فلتر التاريخ فقط)
  const fetchTopItem = useCallback(async () => {
    setTopItemLoading(true);
    try {
      const params = {};
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;

      const response = await api.get(`${API_BASE_URL}/top`, { params });
      if (response.data?.success) {
        setTopItem(response.data.data || null);
      }
    } catch (err) {
      console.error("خطأ في جلب أكثر صنف وارد:", err);
    } finally {
      setTopItemLoading(false);
    }
  }, [filters.dateFrom, filters.dateTo]);

  useEffect(() => {
    fetchItemsReport();
  }, [fetchItemsReport]);

  useEffect(() => {
    fetchTopItem();
  }, [fetchTopItem]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const resetFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      sortBy: "totalWeight",
      sortOrder: "desc",
      dateFrom: "",
      dateTo: "",
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleSharePDF = async () => {
    const element = document.getElementById("items-report-capture");
    if (!element) return;

    const fileName = "تقرير_الأصناف.pdf";

    const options = {
      margin: [10, 10, 10, 10],
      filename: fileName,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        scrollX: 0,
        scrollY: 0,
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "landscape",
      },
    };

    try {
      setSharing(true);
      const pdfBlob = await html2pdf().set(options).from(element).output("blob");
      const file = new File([pdfBlob], fileName, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "تقرير الأصناف",
          text: "مرفق تقرير الأصناف",
        });
      } else {
        html2pdf().set(options).from(element).save();
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("حدث خطأ أثناء محاولة إنشاء أو مشاركة الملف.");
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="p-4 md:p-6 bg-ligth min-h-screen text-dark space-y-6 print:bg-white print:p-0 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-brown/20 pb-4 print:border-b-2 print:border-black">
        <div>
          <h1 className="text-2xl font-bold text-dark flex items-center gap-2 print:text-xl">
            <ArchiveBoxIcon className="w-8 h-8 text-accent print:hidden" />
            تقرير الأصناف
          </h1>
          <p className="text-xs text-brown mt-1 print:text-black">
            متابعة الأصناف الأكثر ورودًا، الكميات، الأوزان، والقيم الإجمالية لكل صنف.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto print:hidden">
          <button
            onClick={() => window.print()}
            className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-all text-xs flex items-center justify-center gap-1.5 flex-1 md:flex-none shadow-sm"
          >
            <PrinterIcon className="w-4 h-4" />
            طباعة التقرير
          </button>
          <button
            onClick={handleSharePDF}
            disabled={sharing}
            className="bg-green-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-800 transition-all text-xs flex items-center justify-center gap-1.5 flex-1 md:flex-none shadow-sm disabled:opacity-50"
          >
            <ShareIcon className="w-4 h-4" />
            {sharing ? "جاري التجهيز..." : "مشاركة كـ PDF"}
          </button>
        </div>
      </div>

      {/* كارت أكثر صنف وارد */}
      <div className="bg-gradient-to-l from-accent/10 to-white p-5 rounded-xl border border-accent/20 shadow-sm print:border print:border-black print:bg-white">
        <div className="flex items-center gap-2 mb-3 text-accent font-bold text-sm print:text-black">
          <TrophyIcon className="w-5 h-5 print:hidden" />
          أكثر صنف وارد {filters.dateFrom || filters.dateTo ? "(خلال الفترة المحددة)" : ""}
        </div>
        {topItemLoading ? (
          <div className="text-xs text-brown flex items-center gap-2">
            <ArrowPathIcon className="w-4 h-4 animate-spin" />
            جاري التحميل...
          </div>
        ) : topItem ? (
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="text-[11px] text-brown">اسم الصنف</p>
              <p className="text-lg font-black text-dark">{topItem.itemName}</p>
            </div>
            <div>
              <p className="text-[11px] text-brown">عدد مرات الورود</p>
              <p className="text-lg font-black text-dark">{topItem.deliveriesCount}</p>
            </div>
            <div>
              <p className="text-[11px] text-brown">إجمالي الوزن</p>
              <p className="text-lg font-black text-dark">
                {topItem.totalWeight?.toLocaleString()} كجم
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-brown/70">لا توجد بيانات كافية لعرض أكثر صنف وارد.</p>
        )}
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-brown/10 space-y-4 print:hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-dark flex items-center gap-2">
            <FunnelIcon className="w-4 h-4 text-accent" />
            خيارات تصفية البيانات
          </h2>
          <button
            onClick={resetFilters}
            className="text-xs text-accent hover:underline flex items-center gap-1 font-semibold"
          >
            <ArrowPathIcon className="w-3.5 h-3.5" />
            إعادة ضبط
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-brown font-medium mb-1">ترتيب حسب</label>
            <select
              name="sortBy"
              value={filters.sortBy}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-brown/20 rounded-lg focus:outline-none focus:border-accent bg-ligth/50"
            >
              <option value="totalWeight">إجمالي الوزن</option>
              <option value="totalQuantity">إجمالي الكمية</option>
              <option value="deliveriesCount">عدد مرات الورود</option>
              <option value="totalPrice">إجمالي القيمة</option>
            </select>
          </div>

          <div>
            <label className="block text-brown font-medium mb-1">الاتجاه</label>
            <select
              name="sortOrder"
              value={filters.sortOrder}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-brown/20 rounded-lg focus:outline-none focus:border-accent bg-ligth/50"
            >
              <option value="desc">تنازلي (الأعلى أولاً)</option>
              <option value="asc">تصاعدي (الأقل أولاً)</option>
            </select>
          </div>

          <div>
            <label className="block text-brown font-medium mb-1">من تاريخ</label>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-brown/20 rounded-lg focus:outline-none focus:border-accent bg-ligth/50"
            />
          </div>

          <div>
            <label className="block text-brown font-medium mb-1">إلى تاريخ</label>
            <input
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-brown/20 rounded-lg focus:outline-none focus:border-accent bg-ligth/50"
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 print:hidden">
          <ExclamationTriangleIcon className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Items Table */}
      <div
        id="items-report-capture"
        className="bg-white rounded-xl shadow-sm border border-brown/10 overflow-hidden print:border-none print:shadow-none"
      >
        {loading ? (
          <div className="p-12 text-center text-brown text-sm flex flex-col items-center gap-3">
            <ArrowPathIcon className="w-8 h-8 animate-spin text-accent" />
            جاري تحميل تقرير الأصناف...
          </div>
        ) : itemsData.length === 0 ? (
          <div className="p-12 text-center text-brown/70 text-sm">
            لا توجد أصناف مطابقة لخيارات البحث الحالية.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs print:text-[11px]">
              <thead className="bg-ligth text-dark font-bold border-b border-brown/10 print:bg-gray-100 print:border-black">
                <tr>
                  <th className="p-3">اسم الصنف</th>
                  <th className="p-3">عدد مرات الورود</th>
                  <th className="p-3">إجمالي الكمية</th>
                  <th className="p-3">إجمالي الوزن</th>
                  <th className="p-3">إجمالي المرتجع (كجم)</th>
                  <th className="p-3">متوسط سعر الكيلو</th>
                  <th className="p-3">إجمالي القيمة</th>
                  <th className="p-3">إجمالي الخصم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brown/10 print:divide-gray-300">
                {itemsData.map((item) => (
                  <tr key={item.itemId} className="hover:bg-ligth/30 transition-colors">
                    <td className="p-3 font-bold text-dark">{item.itemName}</td>
                    <td className="p-3 font-semibold">{item.deliveriesCount}</td>
                    <td className="p-3 text-brown print:text-black">
                      {item.totalQuantity?.toLocaleString()}
                    </td>
                    <td className="p-3 font-bold text-accent print:text-black">
                      {item.totalWeight?.toLocaleString()} كجم
                    </td>
                    <td className="p-3 text-rose-600 print:text-black">
                      {item.totalReturnWeight?.toLocaleString()} كجم
                    </td>
                    <td className="p-3 text-brown print:text-black">
                      {item.avgPricePerKg?.toLocaleString()} ج.م
                    </td>
                    <td className="p-3 font-bold text-dark">
                      {item.totalPrice?.toLocaleString()} ج.م
                    </td>
                    <td className="p-3 text-amber-700 print:text-black">
                      {item.totalDiscount?.toLocaleString()} ج.م
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && itemsData.length > 0 && (
          <div className="p-4 bg-ligth/40 border-t border-brown/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-brown print:hidden">
            <div>
              عرض الإدخالات من{" "}
              <span className="font-bold text-dark">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>{" "}
              إلى{" "}
              <span className="font-bold text-dark">
                {Math.min(pagination.page * pagination.limit, pagination.totalItems)}
              </span>{" "}
              من إجمالي <span className="font-bold text-dark">{pagination.totalItems}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-1.5 rounded-lg border border-brown/20 disabled:opacity-40 hover:bg-white text-dark transition-all"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
              <span className="font-bold text-dark px-2">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="p-1.5 rounded-lg border border-brown/20 disabled:opacity-40 hover:bg-white text-dark transition-all"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}
