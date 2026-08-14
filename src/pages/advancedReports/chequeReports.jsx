import React, { useState, useEffect, useCallback } from "react";
import {
  BuildingLibraryIcon,
  UserGroupIcon,
  DocumentCheckIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import api from "../../services/api";
import html2pdf from "html2pdf.js";

const API_BASE_URL = "/advancedReports/cheques";

export default function ChequesReport() {
  const [activeTab, setActiveTab] = useState("list"); // 'list' | 'by-bank' | 'by-trader'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sharing, setSharing] = useState(false);

  // البيانات المتلقاة من API
  const [reportData, setReportData] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  });

  // حالة الفلاتر الموحدة
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    bankName: "",
    status: "",
    module: "",
    moneyFlow: "",
    customerId: "",
    supplierId: "",
    dateFrom: "",
    dateTo: "",
    sortBy: "totalAmount",
    sortOrder: "desc",
  });

  // جلب البيانات من الـ Backend
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let endpoint = API_BASE_URL;
      if (activeTab === "by-bank") endpoint += "/by-bank";
      if (activeTab === "by-trader") endpoint += "/by-trader";

      const cleanParams = Object.fromEntries(
        Object.entries(filters).filter(([_, val]) => val !== "" && val !== null)
      );

      const response = await api.get(endpoint, { params: cleanParams });

      if (response.data?.success) {
        setReportData(response.data.data || []);
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
        err.response?.data?.message || "حدث خطأ أثناء جلب بيانات تقرير الشيكات"
      );
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const resetFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      bankName: "",
      status: "",
      module: "",
      moneyFlow: "",
      customerId: "",
      supplierId: "",
      dateFrom: "",
      dateTo: "",
      sortBy: "totalAmount",
      sortOrder: "desc",
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters((prev) => ({ ...prev, page: newPage }));
    }
  };

  const renderStatusBadge = (status) => {
    const styles = {
      under_collection: "bg-amber-100 text-amber-800 border-amber-300",
      due_today: "bg-blue-100 text-blue-800 border-blue-300",
      collected: "bg-emerald-100 text-emerald-800 border-emerald-300",
      returned: "bg-rose-100 text-rose-800 border-rose-300",
      cancelled: "bg-gray-100 text-gray-800 border-gray-300",
    };

    const labels = {
      under_collection: "تحت التحصيل / الصرف",
      due_today: "مستحق اليوم",
      collected: "تم الصرف / التحصيل",
      returned: "مرتجع",
      cancelled: "ملغى",
    };

    return (
      <span
        className={`px-2.5 py-1 text-xs font-semibold rounded-full border print:border-none ${
          styles[status] || "bg-gray-100 text-gray-700 border-gray-200"
        }`}
      >
        {labels[status] || status}
      </span>
    );
  };

  // معالجة تصدير ومشاركة الـ PDF
  const handleSharePDF = async () => {
    const element = document.getElementById("report-capture");
    if (!element) return;

    const reportTitle =
      activeTab === "by-bank"
        ? "تقرير الشيكات حسب البنك"
        : activeTab === "by-trader"
        ? "تقرير الشيكات حسب التاجر"
        : "قائمة الشيكات التفصيلية";

    const fileName = `${reportTitle}.pdf`;

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
          title: reportTitle,
          text: `مرفق ${reportTitle}`,
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
      {/* Header - إخفاء عناصر التحكم أثناء الطباعة */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-brown/20 pb-4 print:border-b-2 print:border-black">
        <div>
          <h1 className="text-2xl font-bold text-dark flex items-center gap-2 print:text-xl">
            <DocumentCheckIcon className="w-8 h-8 text-accent print:hidden" />
            تقارير الشيكات والعمليات المالية
          </h1>
          <p className="text-xs text-brown mt-1 print:text-black">
            متابعة حركة الشيكات، تحليلات البنوك، وتقارير التعاملات مع التجار.
          </p>
        </div>

        {/* أزرار الطباعة والمشاركة - مخفية عند الطباعة */}
        <div className="flex items-center gap-2 w-full md:w-auto print:hidden">
          <button
            onClick={() => window.print()}
            className="bg-black text-white px-5 py-2 rounded font-normal hover:bg-gray-800 transition-all text-sm flex-1 md:flex-none"
          >
            طباعة الكشف
          </button>
          <button
            onClick={handleSharePDF}
            disabled={sharing}
            className="bg-green-700 text-white px-5 py-2 rounded font-normal hover:bg-green-800 transition-all text-sm flex-1 md:flex-none disabled:opacity-50"
          >
            {sharing ? "جاري التجهيز..." : "مشاركة كـ PDF"}
          </button>
        </div>

        {/* Tab Navigation - مخفي عند الطباعة */}
        <div className="flex bg-white rounded-lg p-1 shadow-sm border border-brown/10 self-start md:self-auto print:hidden">
          <button
            onClick={() => {
              setActiveTab("list");
              resetFilters();
            }}
            className={`px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${
              activeTab === "list"
                ? "bg-dark text-white shadow-md"
                : "text-brown hover:text-dark hover:bg-ligth"
            }`}
          >
            <DocumentCheckIcon className="w-4 h-4" />
            قائمة الشيكات
          </button>
          <button
            onClick={() => {
              setActiveTab("by-bank");
              resetFilters();
            }}
            className={`px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${
              activeTab === "by-bank"
                ? "bg-dark text-white shadow-md"
                : "text-brown hover:text-dark hover:bg-ligth"
            }`}
          >
            <BuildingLibraryIcon className="w-4 h-4" />
            حسب البنك
          </button>
          <button
            onClick={() => {
              setActiveTab("by-trader");
              resetFilters();
            }}
            className={`px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${
              activeTab === "by-trader"
                ? "bg-dark text-white shadow-md"
                : "text-brown hover:text-dark hover:bg-ligth"
            }`}
          >
            <UserGroupIcon className="w-4 h-4" />
            حسب التاجر
          </button>
        </div>
      </div>

      {/* Filters Section - مخفي عند الطباعة */}
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
          {activeTab === "list" && (
            <div>
              <label className="block text-brown font-medium mb-1">اسم البنك</label>
              <input
                type="text"
                name="bankName"
                value={filters.bankName}
                onChange={handleFilterChange}
                placeholder="ابحث باسم البنك..."
                className="w-full px-3 py-2 border border-brown/20 rounded-lg focus:outline-none focus:border-accent bg-ligth/50"
              />
            </div>
          )}

          <div>
            <label className="block text-brown font-medium mb-1">حالة الشيك</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-brown/20 rounded-lg focus:outline-none focus:border-accent bg-ligth/50"
            >
              <option value="">جميع الحالات</option>
              <option value="under_collection">تحت التحصيل / الصرف</option>
              <option value="due_today">مستحق اليوم</option>
              <option value="collected">تم الصرف / التحصيل</option>
              <option value="returned">مرتجع</option>
              <option value="cancelled">ملغى</option>
            </select>
          </div>

          {activeTab !== "by-bank" && (
            <div>
              <label className="block text-brown font-medium mb-1">اتجاه الشيك</label>
              <select
                name="moneyFlow"
                value={filters.moneyFlow}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-brown/20 rounded-lg focus:outline-none focus:border-accent bg-ligth/50"
              >
                <option value="">الكل (ارسال و استلام)</option>
                <option value="incoming">استلام (مقبوضات)</option>
                <option value="outgoing">ارسال (مدفوعات)</option>
              </select>
            </div>
          )}

          {activeTab !== "list" && (
            <div>
              <label className="block text-brown font-medium mb-1">ترتيب حسب</label>
              <select
                name="sortBy"
                value={filters.sortBy}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-brown/20 rounded-lg focus:outline-none focus:border-accent bg-ligth/50"
              >
                <option value="totalAmount">إجمالي المبلغ</option>
                <option value="count">عدد الشيكات</option>
                {activeTab === "by-bank" && (
                  <option value="returnedCount">عدد الشيكات المرتجعة</option>
                )}
              </select>
            </div>
          )}

          <div>
            <label className="block text-brown font-medium mb-1">
              من تاريخ ({activeTab === "by-trader" ? "الاستلام" : "الاستحقاق"})
            </label>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-brown/20 rounded-lg focus:outline-none focus:border-accent bg-ligth/50"
            />
          </div>

          <div>
            <label className="block text-brown font-medium mb-1">
              إلى تاريخ ({activeTab === "by-trader" ? "الاستلام" : "الاستحقاق"})
            </label>
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

      {/* المنطقة المحددة للالتقاط والطباعة */}
      <div
        id="report-capture"
        className="bg-white rounded-xl shadow-sm border border-brown/10 overflow-hidden print:border-none print:shadow-none"
      >
        {loading ? (
          <div className="p-12 text-center text-brown text-sm flex flex-col items-center gap-3">
            <ArrowPathIcon className="w-8 h-8 animate-spin text-accent" />
            جاري تحميل البيانات...
          </div>
        ) : reportData.length === 0 ? (
          <div className="p-12 text-center text-brown/70 text-sm">
            لا توجد بيانات مطابقة لخيارات البحث المحددة.
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Table 1: قائمة الشيكات التفصيلية */}
            {activeTab === "list" && (
              <table className="w-full text-right text-xs print:text-[11px]">
                <thead className="bg-ligth text-dark font-bold border-b border-brown/10 print:bg-gray-100 print:border-black">
                  <tr>
                    <th className="p-3">رقم الشيك</th>
                    <th className="p-3">البنك</th>
                    <th className="p-3">الطرف الثاني (التاجر)</th>
                    <th className="p-3">الحركة</th>
                    <th className="p-3">المبلغ</th>
                    <th className="p-3">تاريخ الاستحقاق</th>
                    <th className="p-3">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brown/10 print:divide-gray-300">
                  {reportData.map((item) => {
                    const trader = item.customer || item.supplier;
                    return (
                      <tr key={item._id} className="hover:bg-ligth/30 transition-colors">
                        <td className="p-3 font-semibold text-dark">
                          {item.chequeNumber || "—"}
                        </td>
                        <td className="p-3 font-medium">{item.bankName || "—"}</td>
                        <td className="p-3">
                          {trader ? (
                            <div>
                              <p className="font-semibold text-dark">{trader.name}</p>
                              {trader.phone && (
                                <p className="text-[10px] text-brown print:text-gray-600">{trader.phone}</p>
                              )}
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.moneyFlow === "incoming"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {item.moneyFlow === "incoming" ? "استلام" : "ارسال"}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-dark">
                          {item.amount?.toLocaleString()} ج.م
                        </td>
                        <td className="p-3 text-brown print:text-black">
                          {item.dueDate
                            ? new Date(item.dueDate).toLocaleDateString("ar-EG")
                            : "—"}
                        </td>
                        <td className="p-3">{renderStatusBadge(item.status)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Table 2: تقرير حسب البنك */}
            {activeTab === "by-bank" && (
              <table className="w-full text-right text-xs print:text-[11px]">
                <thead className="bg-ligth text-dark font-bold border-b border-brown/10 print:bg-gray-100 print:border-black">
                  <tr>
                    <th className="p-3">اسم البنك</th>
                    <th className="p-3">إجمالي الشيكات</th>
                    <th className="p-3">إجمالي القيمة</th>
                    <th className="p-3">تم الصرف/التحصيل</th>
                    <th className="p-3">تحت التحصيل</th>
                    <th className="p-3">عدد المرتجع</th>
                    <th className="p-3">قيمة المرتجع</th>
                    <th className="p-3">نسبة الارتجاع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brown/10 print:divide-gray-300">
                  {reportData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-ligth/30 transition-colors">
                      <td className="p-3 font-bold text-dark">{item.bankName || "غير محدد"}</td>
                      <td className="p-3 font-semibold">{item.count}</td>
                      <td className="p-3 font-bold text-accent print:text-black">
                        {item.totalAmount?.toLocaleString()} ج.م
                      </td>
                      <td className="p-3 text-emerald-700 print:text-black">{item.collectedCount}</td>
                      <td className="p-3 text-amber-700 print:text-black">{item.underCollectionCount}</td>
                      <td className="p-3 text-rose-700 font-bold print:text-black">{item.returnedCount}</td>
                      <td className="p-3 text-rose-700 print:text-black">
                        {item.returnedAmount?.toLocaleString()} ج.م
                      </td>
                      <td className="p-3">
                        <span
                          className={`font-bold px-2 py-0.5 rounded ${
                            item.returnRate > 10
                              ? "bg-rose-100 text-rose-800"
                              : "bg-gray-100 text-dark"
                          }`}
                        >
                          {item.returnRate?.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Table 3: تقرير حسب التاجر */}
            {activeTab === "by-trader" && (
              <table className="w-full text-right text-xs print:text-[11px]">
                <thead className="bg-ligth text-dark font-bold border-b border-brown/10 print:bg-gray-100 print:border-black">
                  <tr>
                    <th className="p-3">اسم التاجر</th>
                    <th className="p-3">نوع التاجر</th>
                    <th className="p-3">عدد الشيكات</th>
                    <th className="p-3">إجمالي المبالغ</th>
                    <th className="p-3">عدد الشيكات المرتجعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brown/10 print:divide-gray-300">
                  {reportData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-ligth/30 transition-colors">
                      <td className="p-3 font-bold text-dark">
                        {item.traderName || "غير محدد"}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.traderType === "customer"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-purple-50 text-purple-700"
                          }`}
                        >
                          {item.traderType === "customer" ? "عميل" : "مورد"}
                        </span>
                      </td>
                      <td className="p-3 font-semibold">{item.count}</td>
                      <td className="p-3 font-bold text-accent print:text-black">
                        {item.totalAmount?.toLocaleString()} ج.م
                      </td>
                      <td className="p-3 font-bold text-rose-600 print:text-black">
                        {item.returnedCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Pagination Controls - مخفية عند الطباعة */}
        {!loading && reportData.length > 0 && (
          <div className="p-4 bg-ligth/40 border-t border-brown/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-brown print:hidden">
            <div>
              عرض الإدخالات من{" "}
              <span className="font-bold text-dark">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>{" "}
              إلى{" "}
              <span className="font-bold text-dark">
                {Math.min(
                  pagination.page * pagination.limit,
                  pagination.totalItems
                )}
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