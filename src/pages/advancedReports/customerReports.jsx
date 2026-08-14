import React, { useState, useEffect, useCallback } from "react";
import {
  UserGroupIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  XMarkIcon,
  DocumentTextIcon,
  PhoneIcon,
  PrinterIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";
import api from "../../services/api";
import html2pdf from "html2pdf.js";

const API_BASE_URL = "/advancedReports/customers";

export default function CustomersReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sharing, setSharing] = useState(false);

  // بيانات تقرير التجار الرئيسي
  const [customersData, setCustomersData] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1,
    totalItems: 0,
  });

  // حالة الفلاتر
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    name: "",
    sortBy: "balance",
    sortOrder: "desc",
    dateFrom: "",
    dateTo: "",
  });

  // حالة كشف الحساب التفصيلي (التاجر المحدد)
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [transactionsData, setTransactionsData] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txPagination, setTxPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  });
  const [txDateFrom, setTxDateFrom] = useState("");
  const [txDateTo, setTxDateTo] = useState("");

  // 1. جلب التقرير الشامل للتجار
  const fetchCustomersReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(filters).filter(([_, val]) => val !== "" && val !== null)
      );

      const response = await api.get(API_BASE_URL, { params: cleanParams });

      if (response.data?.success) {
        setCustomersData(response.data.data || []);
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
        err.response?.data?.message || "حدث خطأ أثناء جلب تقرير التجار"
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCustomersReport();
  }, [fetchCustomersReport]);

  // 2. جلب كشف الحساب التفصيلي لتاجر محدد
  const fetchCustomerTransactions = useCallback(
    async (customerId, page = 1) => {
      setTxLoading(true);
      try {
        const params = {
          page,
          limit: txPagination.limit,
          ...(txDateFrom && { dateFrom: txDateFrom }),
          ...(txDateTo && { dateTo: txDateTo }),
        };

        const response = await api.get(
          `${API_BASE_URL}/${customerId}/transactions`,
          { params }
        );

        if (response.data?.success) {
          setTransactionsData(response.data.data || []);
          if (response.data.pagination) {
            setTxPagination({
              page: response.data.pagination.page,
              limit: response.data.pagination.limit,
              totalPages: response.data.pagination.totalPages,
              totalItems: response.data.pagination.totalItems,
            });
          }
        }
      } catch (err) {
        console.error("خطأ في جلب تفاصيل النقلات:", err);
      } finally {
        setTxLoading(false);
      }
    },
    [txPagination.limit, txDateFrom, txDateTo]
  );

  // فتح شاشة كشف الحساب
  const handleOpenDetails = (customer) => {
    setSelectedCustomer(customer);
    setTxDateFrom("");
    setTxDateTo("");
    fetchCustomerTransactions(customer._id, 1);
  };

  // تغيير الفلاتر العامة
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const resetFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      name: "",
      sortBy: "balance",
      sortOrder: "desc",
      dateFrom: "",
      dateTo: "",
    });
  };

  // معالجة تصدير ومشاركة الـ PDF
  const handleSharePDF = async (targetId, title) => {
    const element = document.getElementById(targetId);
    if (!element) return;

    const fileName = `${title}.pdf`;

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
          title: title,
          text: `مرفق ${title}`,
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
            <UserGroupIcon className="w-8 h-8 text-accent print:hidden" />
            تقرير التجار والمبيعات
          </h1>
          <p className="text-xs text-brown mt-1 print:text-black">
            متابعة المديونيات الحالية، حركات النقل، وكشوفات الحساب التفصيلية لكل تاجر.
          </p>
        </div>

        {/* أزرار الطباعة والمشاركة الرئيسية */}
        <div className="flex items-center gap-2 w-full md:w-auto print:hidden">
          <button
            onClick={() => window.print()}
            className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-all text-xs flex items-center justify-center gap-1.5 flex-1 md:flex-none shadow-sm"
          >
            <PrinterIcon className="w-4 h-4" />
            طباعة التقرير
          </button>
          <button
            onClick={() =>
              handleSharePDF("customers-report-capture", "تقرير_التجار_والمبيعات")
            }
            disabled={sharing}
            className="bg-green-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-800 transition-all text-xs flex items-center justify-center gap-1.5 flex-1 md:flex-none shadow-sm disabled:opacity-50"
          >
            <ShareIcon className="w-4 h-4" />
            {sharing ? "جاري التجهيز..." : "مشاركة كـ PDF"}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block text-brown font-medium mb-1">اسم التاجر</label>
            <input
              type="text"
              name="name"
              value={filters.name}
              onChange={handleFilterChange}
              placeholder="ابحث باسم التاجر..."
              className="w-full px-3 py-2 border border-brown/20 rounded-lg focus:outline-none focus:border-accent bg-ligth/50"
            />
          </div>

          <div>
            <label className="block text-brown font-medium mb-1">ترتيب حسب</label>
            <select
              name="sortBy"
              value={filters.sortBy}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-brown/20 rounded-lg focus:outline-none focus:border-accent bg-ligth/50"
            >
              <option value="balance">المديونية الحالية</option>
              <option value="totalSold">إجمالي المبيعات</option>
              <option value="transactionsCount">عدد النقلات</option>
              <option value="name">اسم التاجر</option>
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
            <label className="block text-brown font-medium mb-1">من تاريخ النقلة</label>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-brown/20 rounded-lg focus:outline-none focus:border-accent bg-ligth/50"
            />
          </div>

          <div>
            <label className="block text-brown font-medium mb-1">إلى تاريخ النقلة</label>
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

      {/* Main Customers Table Area */}
      <div
        id="customers-report-capture"
        className={`bg-white rounded-xl shadow-sm border border-brown/10 overflow-hidden print:border-none print:shadow-none ${
          selectedCustomer ? "print:hidden" : ""
        }`}
      >
        {loading ? (
          <div className="p-12 text-center text-brown text-sm flex flex-col items-center gap-3">
            <ArrowPathIcon className="w-8 h-8 animate-spin text-accent" />
            جاري تحميل تقرير التجار...
          </div>
        ) : customersData.length === 0 ? (
          <div className="p-12 text-center text-brown/70 text-sm">
            لا يوجد تجار مطبقين لخيارات البحث الحالية.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs print:text-[11px]">
              <thead className="bg-ligth text-dark font-bold border-b border-brown/10 print:bg-gray-100 print:border-black">
                <tr>
                  <th className="p-3">اسم التاجر</th>
                  <th className="p-3">رقم الهاتف</th>
                  <th className="p-3">المديونية الحالية</th>
                  <th className="p-3">إجمالي المبيعات</th>
                  <th className="p-3">المبلغ المدفوع</th>
                  <th className="p-3">المبلغ المتبقي</th>
                  <th className="p-3">عدد النقلات</th>
                  <th className="p-3">آخر نقلة</th>
                  <th className="p-3 text-center print:hidden">كشف الحساب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brown/10 print:divide-gray-300">
                {customersData.map((customer) => (
                  <tr
                    key={customer._id}
                    className="hover:bg-ligth/30 transition-colors"
                  >
                    <td className="p-3 font-bold text-dark">{customer.name}</td>
                    <td className="p-3 text-brown print:text-black">
                      {customer.phone || "—"}
                    </td>
                    <td className="p-3 font-bold">
                      <span
                        className={`px-2 py-0.5 rounded print:border-none ${
                          customer.balance > 0
                            ? "bg-rose-50 text-rose-700 print:text-black"
                            : customer.balance < 0
                            ? "bg-emerald-50 text-emerald-700 print:text-black"
                            : "bg-gray-100 text-gray-700 print:text-black"
                        }`}
                      >
                        {customer.balance?.toLocaleString()} ج.م
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-dark">
                      {customer.totalSold?.toLocaleString()} ج.م
                    </td>
                    <td className="p-3 text-emerald-700 print:text-black font-medium">
                      {customer.totalPaid?.toLocaleString()} ج.م
                    </td>
                    <td className="p-3 text-amber-700 print:text-black font-medium">
                      {customer.totalRemaining?.toLocaleString()} ج.م
                    </td>
                    <td className="p-3 font-bold text-dark">
                      {customer.transactionsCount}
                    </td>
                    <td className="p-3 text-brown print:text-black">
                      {customer.lastTransactionDate
                        ? new Date(customer.lastTransactionDate).toLocaleDateString(
                            "ar-EG"
                          )
                        : "—"}
                    </td>
                    <td className="p-3 text-center print:hidden">
                      <button
                        onClick={() => handleOpenDetails(customer)}
                        className="px-3 py-1 bg-dark text-white rounded-lg hover:bg-dark/80 transition-all text-[11px] font-semibold inline-flex items-center gap-1 shadow-sm"
                      >
                        <EyeIcon className="w-3.5 h-3.5" />
                        عرض التفاصيل
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Main Pagination - مخفي عند الطباعة */}
        {!loading && customersData.length > 0 && (
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
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
                }
                disabled={pagination.page === 1}
                className="p-1.5 rounded-lg border border-brown/20 disabled:opacity-40 hover:bg-white text-dark transition-all"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
              <span className="font-bold text-dark px-2">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                }
                disabled={pagination.page === pagination.totalPages}
                className="p-1.5 rounded-lg border border-brown/20 disabled:opacity-40 hover:bg-white text-dark transition-all"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal / Drawer: كشف حساب التاجر التفصيلي */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-dark/50 backdrop-blur-sm flex items-center justify-center p-4 print:static print:bg-white print:p-0">
          <div
            id="customer-statement-capture"
            className="bg-white rounded-2xl shadow-xl border border-brown/20 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden print:max-h-none print:border-none print:shadow-none print:w-full"
          >
            {/* Modal Header */}
            <div className="p-4 bg-ligth border-b border-brown/10 flex items-center justify-between print:bg-white print:border-b-2 print:border-black">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-xl text-accent print:hidden">
                  <DocumentTextIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-dark print:text-lg">
                    كشف حساب التاجر: {selectedCustomer.name}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-brown mt-0.5 print:text-black">
                    {selectedCustomer.phone && (
                      <span className="flex items-center gap-1">
                        <PhoneIcon className="w-3 h-3 print:hidden" />
                        هاتف: {selectedCustomer.phone}
                      </span>
                    )}
                    <span>
                      المديونية الحالية:{" "}
                      <strong className="text-rose-600 print:text-black">
                        {selectedCustomer.balance?.toLocaleString()} ج.م
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* أزرار التحكم بداخل النافذة المنبثقة */}
              <div className="flex items-center gap-2 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="p-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-xs flex items-center gap-1"
                  title="طباعة كشف الحساب"
                >
                  <PrinterIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">طباعة</span>
                </button>
                <button
                  onClick={() =>
                    handleSharePDF(
                      "customer-statement-capture",
                      `كشف_حساب_${selectedCustomer.name}`
                    )
                  }
                  disabled={sharing}
                  className="p-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors text-xs flex items-center gap-1 disabled:opacity-50"
                  title="مشاركة PDF"
                >
                  <ShareIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {sharing ? "..." : "مشاركة"}
                  </span>
                </button>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-2 text-brown hover:text-dark hover:bg-brown/10 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Filters - مخفي عند الطباعة */}
            <div className="p-3 bg-white border-b border-brown/10 flex flex-wrap items-center gap-3 text-xs print:hidden">
              <div className="flex items-center gap-2">
                <label className="text-brown font-medium">من تاريخ:</label>
                <input
                  type="date"
                  value={txDateFrom}
                  onChange={(e) => setTxDateFrom(e.target.value)}
                  className="px-2 py-1 border border-brown/20 rounded-md bg-ligth/50 focus:outline-none focus:border-accent"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-brown font-medium">إلى تاريخ:</label>
                <input
                  type="date"
                  value={txDateTo}
                  onChange={(e) => setTxDateTo(e.target.value)}
                  className="px-2 py-1 border border-brown/20 rounded-md bg-ligth/50 focus:outline-none focus:border-accent"
                />
              </div>
              <button
                onClick={() => fetchCustomerTransactions(selectedCustomer._id, 1)}
                className="px-3 py-1 bg-accent text-white rounded-md hover:bg-accent/90 transition-all font-semibold flex items-center gap-1"
              >
                <FunnelIcon className="w-3.5 h-3.5" />
                تطبيق الفلتر
              </button>
            </div>

            {/* Transactions List */}
            <div className="p-4 overflow-y-auto flex-1 print:overflow-visible">
              {txLoading ? (
                <div className="p-8 text-center text-brown text-xs flex flex-col items-center gap-2">
                  <ArrowPathIcon className="w-6 h-6 animate-spin text-accent" />
                  جاري تحميل تفاصيل النقلات...
                </div>
              ) : transactionsData.length === 0 ? (
                <div className="p-8 text-center text-brown/70 text-xs">
                  لا توجد نقلات مسجلة لهذا التاجر في الفترة المحددة.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs print:text-[11px]">
                      <thead className="bg-ligth text-dark font-bold border-b border-brown/10 print:bg-gray-100 print:border-black">
                        <tr>
                          <th className="p-2.5">تاريخ النقلة</th>
                          <th className="p-2.5">إجمالي المبلغ</th>
                          <th className="p-2.5">المدفوع</th>
                          <th className="p-2.5">المتبقي</th>
                          <th className="p-2.5">المستلم بواسطة</th>
                          <th className="p-2.5">ملاحظات / التفاصيل</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brown/10 print:divide-gray-300">
                        {transactionsData.map((tx) => (
                          <tr key={tx._id} className="hover:bg-ligth/30">
                            <td className="p-2.5 text-brown print:text-black font-medium">
                              {tx.deliveryDate
                                ? new Date(tx.deliveryDate).toLocaleDateString("ar-EG")
                                : "—"}
                            </td>
                            <td className="p-2.5 font-bold text-dark">
                              {tx.totalAmount?.toLocaleString()} ج.م
                            </td>
                            <td className="p-2.5 text-emerald-700 print:text-black font-semibold">
                              {tx.paidAmount?.toLocaleString()} ج.م
                            </td>
                            <td className="p-2.5 text-rose-600 print:text-black font-semibold">
                              {tx.remainingAmount?.toLocaleString()} ج.م
                            </td>
                            <td className="p-2.5 text-brown print:text-black">
                              {tx.receivedBy?.username || "—"}
                            </td>
                            <td className="p-2.5 text-brown/80 print:text-black max-w-xs truncate print:whitespace-normal">
                              {tx.notes || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Pagination - مخفي عند الطباعة */}
            {!txLoading && transactionsData.length > 0 && (
              <div className="p-3 bg-ligth/40 border-t border-brown/10 flex items-center justify-between text-xs text-brown print:hidden">
                <span>
                  إجمالي النقلات:{" "}
                  <strong className="text-dark">{txPagination.totalItems}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      fetchCustomerTransactions(
                        selectedCustomer._id,
                        txPagination.page - 1
                      )
                    }
                    disabled={txPagination.page === 1}
                    className="p-1 rounded border border-brown/20 disabled:opacity-40 hover:bg-white text-dark"
                  >
                    <ChevronRightIcon className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold text-dark">
                    {txPagination.page} / {txPagination.totalPages}
                  </span>
                  <button
                    onClick={() =>
                      fetchCustomerTransactions(
                        selectedCustomer._id,
                        txPagination.page + 1
                      )
                    }
                    disabled={txPagination.page === txPagination.totalPages}
                    className="p-1 rounded border border-brown/20 disabled:opacity-40 hover:bg-white text-dark"
                  >
                    <ChevronLeftIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
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