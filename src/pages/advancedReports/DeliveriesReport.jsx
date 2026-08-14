import React, { useState, useEffect, useCallback } from "react";
import {
  TruckIcon,
  UserGroupIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  PrinterIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";
import api from "../../services/api";
import html2pdf from "html2pdf.js";

const API_BASE_URL = "/advancedReports/deliveries";

export default function DeliveriesReport() {
  const [activeTab, setActiveTab] = useState("list"); // 'list' | 'by-supplier'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sharing, setSharing] = useState(false);

  const [deliveriesData, setDeliveriesData] = useState([]);
  const [summary, setSummary] = useState({
    deliveriesCount: 0,
    totalAmount: 0,
    totalPaid: 0,
    totalRemaining: 0,
    totalTeaForWorkers: 0,
    totalCarPayment: 0,
    avgAmountPerDelivery: 0,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  });

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    carName: "",
    dateFrom: "",
    dateTo: "",
    sortBy: "deliveryDate",
    sortOrder: "desc",
  });

  // جلب بيانات التقرير حسب التاب النشط
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let endpoint = API_BASE_URL;
      if (activeTab === "by-supplier") endpoint += "/by-supplier";

      const cleanParams = Object.fromEntries(
        Object.entries(filters).filter(([_, val]) => val !== "" && val !== null)
      );

      const response = await api.get(endpoint, { params: cleanParams });

      if (response.data?.success) {
        setDeliveriesData(response.data.data || []);

        if (response.data.summary) {
          setSummary(response.data.summary);
        }

        if (response.data.pagination) {
          setPagination({
            page: response.data.pagination.page,
            limit: response.data.pagination.limit,
            totalPages: response.data.pagination.totalPages,
            totalItems: response.data.pagination.totalItems,
          });
        } else {
          setPagination({ page: 1, limit: deliveriesData.length, totalPages: 1, totalItems: response.data.data?.length || 0 });
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "حدث خطأ أثناء جلب تقرير النقلات"
      );
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      carName: "",
      dateFrom: "",
      dateTo: "",
      sortBy: "deliveryDate",
      sortOrder: "desc",
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleSharePDF = async () => {
    const element = document.getElementById("deliveries-report-capture");
    if (!element) return;

    const tabLabels = { list: "قائمة_النقلات", "by-supplier": "تقرير_النقلات_حسب_التاجر" };
    const fileName = `${tabLabels[activeTab]}.pdf`;

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
          title: tabLabels[activeTab],
          text: `مرفق ${tabLabels[activeTab]}`,
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
            <TruckIcon className="w-8 h-8 text-accent print:hidden" />
            تقرير النقلات
          </h1>
          <p className="text-xs text-brown mt-1 print:text-black">
            متابعة النقلات المسجلة، إجمالي المبالغ، المدفوع، والمتبقي.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full md:w-auto print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-all text-xs flex items-center justify-center gap-1.5 flex-1 md:flex-none shadow-sm"
            >
              <PrinterIcon className="w-4 h-4" />
              طباعة
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

          {/* Tab Navigation */}
          <div className="flex bg-white rounded-lg p-1 shadow-sm border border-brown/10">
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
              <TruckIcon className="w-4 h-4" />
              قائمة النقلات
            </button>
            <button
              onClick={() => {
                setActiveTab("by-supplier");
                resetFilters();
              }}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${
                activeTab === "by-supplier"
                  ? "bg-dark text-white shadow-md"
                  : "text-brown hover:text-dark hover:bg-ligth"
              }`}
            >
              <UserGroupIcon className="w-4 h-4" />
              حسب التاجر
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards - قائمة النقلات فقط */}
      {activeTab === "list" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-3 rounded-xl border border-brown/20 text-center shadow-sm">
            <p className="text-[10px] text-brown">عدد النقلات</p>
            <p className="font-black text-dark">{summary.deliveriesCount}</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-brown/20 text-center shadow-sm">
            <p className="text-[10px] text-brown">إجمالي المبالغ</p>
            <p className="font-black text-accent">{summary.totalAmount?.toLocaleString()} ج.م</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-brown/20 text-center shadow-sm">
            <p className="text-[10px] text-brown">إجمالي المدفوع</p>
            <p className="font-black text-emerald-700">{summary.totalPaid?.toLocaleString()} ج.م</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-brown/20 text-center shadow-sm">
            <p className="text-[10px] text-brown">إجمالي المتبقي</p>
            <p className="font-black text-rose-700">{summary.totalRemaining?.toLocaleString()} ج.م</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-brown/20 text-center shadow-sm">
            <p className="text-[10px] text-brown">شاي العمال</p>
            <p className="font-black text-dark">{summary.totalTeaForWorkers?.toLocaleString()} ج.م</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-brown/20 text-center shadow-sm">
            <p className="text-[10px] text-brown">متوسط النقلة</p>
            <p className="font-black text-dark">{summary.avgAmountPerDelivery?.toLocaleString()} ج.م</p>
          </div>
        </div>
      )}

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
          {activeTab === "list" && (
            <div>
              <label className="block text-brown font-medium mb-1">اسم السائق / العربية</label>
              <input
                type="text"
                name="carName"
                value={filters.carName}
                onChange={handleFilterChange}
                placeholder="ابحث باسم السائق..."
                className="w-full px-3 py-2 border border-brown/20 rounded-lg focus:outline-none focus:border-accent bg-ligth/50"
              />
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
                <option value="totalAmount">إجمالي المبالغ</option>
                <option value="deliveriesCount">عدد النقلات</option>
                <option value="totalRemaining">إجمالي المتبقي</option>
              </select>
            </div>
          )}

          {activeTab === "list" && (
            <div>
              <label className="block text-brown font-medium mb-1">ترتيب حسب</label>
              <select
                name="sortBy"
                value={filters.sortBy}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-brown/20 rounded-lg focus:outline-none focus:border-accent bg-ligth/50"
              >
                <option value="deliveryDate">تاريخ النقلة</option>
                <option value="totalAmount">إجمالي المبلغ</option>
                <option value="remainingAmount">المبلغ المتبقي</option>
              </select>
            </div>
          )}

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

      {/* Data Table */}
      <div
        id="deliveries-report-capture"
        className="bg-white rounded-xl shadow-sm border border-brown/10 overflow-hidden print:border-none print:shadow-none"
      >
        {loading ? (
          <div className="p-12 text-center text-brown text-sm flex flex-col items-center gap-3">
            <ArrowPathIcon className="w-8 h-8 animate-spin text-accent" />
            جاري تحميل بيانات النقلات...
          </div>
        ) : deliveriesData.length === 0 ? (
          <div className="p-12 text-center text-brown/70 text-sm">
            لا توجد بيانات مطابقة لخيارات البحث الحالية.
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* جدول 1: قائمة النقلات */}
            {activeTab === "list" && (
              <table className="w-full text-right text-xs print:text-[11px]">
                <thead className="bg-ligth text-dark font-bold border-b border-brown/10 print:bg-gray-100 print:border-black">
                  <tr>
                    <th className="p-3">رقم النقلة</th>
                    <th className="p-3">التاجر</th>
                    <th className="p-3">السائق / العربية</th>
                    <th className="p-3">تاريخ النقلة</th>
                    <th className="p-3">إجمالي المبلغ</th>
                    <th className="p-3">المدفوع</th>
                    <th className="p-3">المتبقي</th>
                    <th className="p-3">المستلم بواسطة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brown/10 print:divide-gray-300">
                  {deliveriesData.map((d) => (
                    <tr key={d._id} className="hover:bg-ligth/30 transition-colors">
                      <td className="p-3 font-semibold text-dark">{d.delveryNumber || "—"}</td>
                      <td className="p-3">
                        <p className="font-semibold text-dark">{d.supplier?.name || "غير محدد"}</p>
                        {d.supplier?.phone && (
                          <p className="text-[10px] text-brown">{d.supplier.phone}</p>
                        )}
                      </td>
                      <td className="p-3 text-brown print:text-black">{d.carName || "—"}</td>
                      <td className="p-3 text-brown print:text-black">
                        {d.deliveryDate
                          ? new Date(d.deliveryDate).toLocaleDateString("ar-EG")
                          : "—"}
                      </td>
                      <td className="p-3 font-bold text-dark">
                        {d.totalAmount?.toLocaleString()} ج.م
                      </td>
                      <td className="p-3 text-emerald-700 print:text-black font-medium">
                        {d.paidAmount?.toLocaleString()} ج.م
                      </td>
                      <td className="p-3 text-rose-600 print:text-black font-medium">
                        {d.remainingAmount?.toLocaleString()} ج.م
                      </td>
                      <td className="p-3 text-brown print:text-black">
                        {d.receivedBy?.name || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* جدول 2: تقرير حسب التاجر */}
            {activeTab === "by-supplier" && (
              <table className="w-full text-right text-xs print:text-[11px]">
                <thead className="bg-ligth text-dark font-bold border-b border-brown/10 print:bg-gray-100 print:border-black">
                  <tr>
                    <th className="p-3">اسم التاجر</th>
                    <th className="p-3">رقم الهاتف</th>
                    <th className="p-3">عدد النقلات</th>
                    <th className="p-3">إجمالي المبالغ</th>
                    <th className="p-3">إجمالي المدفوع</th>
                    <th className="p-3">إجمالي المتبقي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brown/10 print:divide-gray-300">
                  {deliveriesData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-ligth/30 transition-colors">
                      <td className="p-3 font-bold text-dark">{item.supplierName || "غير محدد"}</td>
                      <td className="p-3 text-brown print:text-black">{item.supplierPhone || "—"}</td>
                      <td className="p-3 font-semibold">{item.deliveriesCount}</td>
                      <td className="p-3 font-bold text-accent">
                        {item.totalAmount?.toLocaleString()} ج.م
                      </td>
                      <td className="p-3 text-emerald-700 print:text-black">
                        {item.totalPaid?.toLocaleString()} ج.م
                      </td>
                      <td className="p-3 text-rose-700 print:text-black">
                        {item.totalRemaining?.toLocaleString()} ج.م
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Pagination - قائمة النقلات فقط (تقرير التاجر مش مقسم صفحات في الباك إند) */}
        {activeTab === "list" && !loading && deliveriesData.length > 0 && (
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
