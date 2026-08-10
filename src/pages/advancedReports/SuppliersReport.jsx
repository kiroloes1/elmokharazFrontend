import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  UserGroupIcon,
  DocumentTextIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  BanknotesIcon,
  XMarkIcon,
  ArrowUpRightIcon,
} from "@heroicons/react/24/outline";
import api from "../../services/api";

// قم بتعديل مسار API حسب إعدادات Axios في مشروعك
const API_BASE_URL = "/advancedReports/suppliers";

export default function SuppliersReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // بيانات التقرير الرئيسي
  const [suppliers, setSuppliers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1,
    totalItems: 0,
  });

  // الفلاتر
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    name: "",
    sortBy: "balance",
    sortOrder: "desc",
    dateFrom: "",
    dateTo: "",
  });

  // كشف حساب المورد (Modal)
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [statementData, setStatementData] = useState([]);
  const [statementLoading, setStatementLoading] = useState(false);
  const [statementPagination, setStatementPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  });
  const [statementFilters, setStatementFilters] = useState({
    dateFrom: "",
    dateTo: "",
  });

  const trans=(value)=>{
      if(value=="partial"){
        return "جزئي"
      }
      if(value=="paid"){
         return "مدفوع"
      }
       if(value=="unpaid"){
         return "غير مدفوع"
      }
  }

  // جلب التقرير العام للموردين
  const fetchSuppliersReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const cleanParams = Object.fromEntries(
        Object.entries(filters).filter(([_, val]) => val !== "" && val !== null)
      );

      const response = await api.get(API_BASE_URL, { params: cleanParams });

      if (response.data?.success) {
        setSuppliers(response.data.data || []);
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
        err.response?.data?.message || "حدث خطأ أثناء جلب تقرير الموردين"
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // جلب كشف حساب مورد محدد
  const fetchSupplierStatement = useCallback(async (supplierId, page = 1) => {
    setStatementLoading(true);

    try {
      const cleanParams = Object.fromEntries(
        Object.entries({ ...statementFilters, page, limit: statementPagination.limit }).filter(
          ([_, val]) => val !== "" && val !== null
        )
      );

      const response = await api.get(`${API_BASE_URL}/${supplierId}/transactions`, {
        params: cleanParams,
      });

      if (response.data?.success) {
        setStatementData(response.data.data || []);
        if (response.data.pagination) {
          setStatementPagination({
            page: response.data.pagination.page,
            limit: response.data.pagination.limit,
            totalPages: response.data.pagination.totalPages,
            totalItems: response.data.pagination.totalItems,
          });
        }
      }
    } catch (err) {
      console.error("خطأ جلب كشف الحساب:", err);
    } finally {
      setStatementLoading(false);
    }
  }, [statementFilters, statementPagination.limit]);

  useEffect(() => {
    fetchSuppliersReport();
  }, [fetchSuppliersReport]);

  useEffect(() => {
    if (selectedSupplier) {
      fetchSupplierStatement(selectedSupplier._id, 1);
    }
  }, [selectedSupplier, statementFilters, fetchSupplierStatement]);

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

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters((prev) => ({ ...prev, page: newPage }));
    }
  };

  // ترجمة موديول الفاتورة بلغة عربي واضحة
  const getModuleName = (moduleKey) => {
    const modules = {
      bag: "شكاير",
      equipment: "معدات",
      equipment_supply: "مستلزمات معدات",
      maintenance: "صيانة",
      wire: "سلك",
    };
    return modules[moduleKey] || moduleKey;
  };

  // لون شارة حالة الدفع
  const getStatusBadge = (status) => {
    switch (status) {
      case "PAID":
      case "خالص":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "PARTIAL":
      case "جزئي":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-rose-50 text-rose-700 border-rose-200";
    }
  };

  return (
    <div className="p-4 md:p-6 bg-ligth min-h-screen text-dark space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-brown/20 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-dark flex items-center gap-2">
            <UserGroupIcon className="w-8 h-8 text-accent" />
            تقارير وتجّار الموردين
          </h1>
          <p className="text-xs text-brown mt-1">
            متابعة ديون الموردين، أنشط التجار، وإجمالي المشتريات من كافة القطاعات.
          </p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-brown/10 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-dark flex items-center gap-2">
            <FunnelIcon className="w-4 h-4 text-accent" />
            تصفية الموردين
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
          {/* بحث باسم المورد */}
          <div>
            <label className="block text-brown font-medium mb-1">اسم المورد</label>
            <input
              type="text"
              name="name"
              value={filters.name}
              onChange={handleFilterChange}
              placeholder="ابحث باسم المورد..."
              className="w-full px-3 py-2 border border-brown/20 rounded-lg focus:outline-none focus:border-accent bg-ligth/50"
            />
          </div>

          {/* ترتيب حسب */}
          <div>
            <label className="block text-brown font-medium mb-1">ترتيب حسب</label>
            <select
              name="sortBy"
              value={filters.sortBy}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-brown/20 rounded-lg focus:outline-none focus:border-accent bg-ligth/50"
            >
              <option value="balance">المديونية (الرصيد)</option>
              <option value="totalPurchased">إجمالي المشتريات</option>
              <option value="transactionsCount">عدد العمليات (أنشط تاجر)</option>
              <option value="name">أبجديًا (الاسم)</option>
            </select>
          </div>

          {/* اتجاه الترتيب */}
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

          {/* فلاتر تاريخ المشتريات */}
          <div>
            <label className="block text-brown font-medium mb-1">من تاريخ الشراء</label>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-brown/20 rounded-lg focus:outline-none focus:border-accent bg-ligth/50"
            />
          </div>

          <div>
            <label className="block text-brown font-medium mb-1">إلى تاريخ الشراء</label>
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

      {/* رسالة الخطأ */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <ExclamationTriangleIcon className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* الجدول الرئيسي للموردين */}
      <div className="bg-white rounded-xl shadow-sm border border-brown/10 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-brown text-sm flex flex-col items-center gap-3">
            <ArrowPathIcon className="w-8 h-8 animate-spin text-accent" />
            جاري تحميل البيانات...
          </div>
        ) : suppliers.length === 0 ? (
          <div className="p-12 text-center text-brown/70 text-sm">
            لا يوجد موردون مطابقون للشروط الحالية.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-ligth text-dark font-bold border-b border-brown/10">
                <tr>
                  <th className="p-3">اسم المورد</th>
                  <th className="p-3">رقم الهاتف</th>
                  <th className="p-3">المديونية الحالية (الرصيد)</th>
                  <th className="p-3">إجمالي المشتريات</th>
                  <th className="p-3">عدد المعاملات</th>
                  <th className="p-3">تاريخ آخر معاملة</th>
                  <th className="p-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brown/10">
                {suppliers.map((supplier) => (
                  <tr key={supplier._id} className="hover:bg-ligth/30 transition-colors">
                    <td className="p-3 font-bold text-dark">{supplier.name}</td>
                    <td className="p-3 text-brown dir-ltr text-right">
                      {supplier.phone ? (
                        <span className="flex items-center gap-1">
                          <PhoneIcon className="w-3.5 h-3.5 text-brown" />
                          {supplier.phone}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`font-bold px-2.5 py-1 rounded-full text-xs ${
                          supplier.balance > 0
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : supplier.balance < 0
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {supplier.balance?.toLocaleString()} ج.م
                      </span>
                    </td>
                    <td className="p-3 font-bold text-accent text-sm">
                      {supplier.totalPurchased?.toLocaleString()} ج.م
                    </td>
                    <td className="p-3 font-semibold text-dark">
                      {supplier.transactionsCount} عملية
                    </td>
                    <td className="p-3 text-brown">
                      {supplier.lastTransactionDate
                        ? new Date(supplier.lastTransactionDate).toLocaleDateString("ar-EG")
                        : "—"}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setSelectedSupplier(supplier)}
                        className="px-3 py-1.5 bg-dark text-white rounded-lg hover:bg-brown transition-colors font-semibold flex items-center gap-1 mx-auto text-[11px]"
                      >
                        <DocumentTextIcon className="w-3.5 h-3.5" />
                        كشف حساب
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && suppliers.length > 0 && (
          <div className="p-4 bg-ligth/40 border-t border-brown/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-brown">
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

      {/* Modal كشف حساب المورد التفصيلي */}
      {selectedSupplier && (
        <div className="fixed inset-0 z-50 bg-dark/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-brown/20 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-dark text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BanknotesIcon className="w-6 h-6 text-accent" />
                <div>
                  <h3 className="font-bold text-sm md:text-base">
                    كشف حساب المورد: {selectedSupplier.name}
                  </h3>
                  <p className="text-[11px] text-ligth/70">
                    الرصيد الحالي: {selectedSupplier.balance?.toLocaleString()} ج.م
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSupplier(null)}
                className="p-1 text-ligth/70 hover:text-white rounded-lg hover:bg-white/10"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Filter */}
            <div className="p-3 bg-ligth/50 border-b border-brown/10 flex flex-wrap gap-3 items-center text-xs">
              <span className="font-bold text-dark">تصفية الفترة:</span>
              <input
                type="date"
                value={statementFilters.dateFrom}
                onChange={(e) =>
                  setStatementFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
                }
                className="px-2 py-1 border border-brown/20 rounded bg-white"
              />
              <span>إلى</span>
              <input
                type="date"
                value={statementFilters.dateTo}
                onChange={(e) =>
                  setStatementFilters((prev) => ({ ...prev, dateTo: e.target.value }))
                }
                className="px-2 py-1 border border-brown/20 rounded bg-white"
              />
              {(statementFilters.dateFrom || statementFilters.dateTo) && (
                <button
                  onClick={() => setStatementFilters({ dateFrom: "", dateTo: "" })}
                  className="text-accent text-[11px] underline"
                >
                  إلغاء التصفية
                </button>
              )}
            </div>

            {/* Modal Content Table */}
            <div className="p-4 overflow-y-auto flex-1">
              {statementLoading ? (
                <div className="py-12 text-center text-brown text-xs flex flex-col items-center gap-2">
                  <ArrowPathIcon className="w-6 h-6 animate-spin text-accent" />
                  جاري جلب الفواتير والمعاملات...
                </div>
              ) : statementData.length === 0 ? (
                <div className="py-12 text-center text-brown/70 text-xs">
                  لا توجد معاملات مسجلة لهذا المورد في الفترة المحددة.
                </div>
              ) : (
                <table className="w-full text-right text-xs">
                  <thead className="bg-ligth text-dark font-bold sticky top-0 border-b border-brown/10">
                    <tr>
                      <th className="p-2.5">التاريخ</th>
                      <th className="p-2.5">رقم الفاتورة</th>
                      <th className="p-2.5">القطاع / الموديول</th>
                      <th className="p-2.5">الإجمالي</th>
                      <th className="p-2.5">المدفوع</th>
                      <th className="p-2.5">المتبقي</th>
                      <th className="p-2.5">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brown/10">
                    {statementData.map((trx, idx) => (
                      <tr key={idx} className="hover:bg-ligth/30 transition-colors">
                        <td className="p-2.5 text-brown">
                          {trx.purchaseDate
                            ? new Date(trx.purchaseDate).toLocaleDateString("ar-EG")
                            : "—"}
                        </td>
                        <td className="p-2.5  font-semibold text-dark">
                          {trx.invoiceNumber || "—"}
                        </td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 bg-brown/10 text-brown font-semibold rounded text-[11px]">
                            {getModuleName(trx.module)}
                          </span>
                        </td>
                        <td className="p-2.5 font-bold text-dark">
                          {trx.totalAmount?.toLocaleString()} ج.م
                        </td>
                        <td className="p-2.5 text-emerald-700 font-semibold">
                          {(trx.paidAmount || 0).toLocaleString()} ج.م
                        </td>
                        <td className="p-2.5 text-rose-700 font-semibold">
                          {(trx.remainingAmount || 0).toLocaleString()} ج.م
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(
                              trx.paymentStatus
                            )}`}
                          >
                            { trans(trx.paymentStatus) || "غير محدد"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Pagination Footer */}
            {statementPagination.totalPages > 1 && (
              <div className="p-3 bg-ligth/40 border-t border-brown/10 flex items-center justify-between text-xs text-brown">
                <span>
                  صفحة {statementPagination.page} من {statementPagination.totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      fetchSupplierStatement(selectedSupplier._id, statementPagination.page - 1)
                    }
                    disabled={statementPagination.page === 1}
                    className="p-1 rounded border border-brown/20 disabled:opacity-40 hover:bg-white"
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      fetchSupplierStatement(selectedSupplier._id, statementPagination.page + 1)
                    }
                    disabled={statementPagination.page === statementPagination.totalPages}
                    className="p-1 rounded border border-brown/20 disabled:opacity-40 hover:bg-white"
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}