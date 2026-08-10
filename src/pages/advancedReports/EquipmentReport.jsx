import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  WrenchScrewdriverIcon,
  CubeIcon,
  ChartPieIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  CogIcon,
} from "@heroicons/react/24/outline";
import api from "../../services/api";

// قم بتعديل المسار الأساسي حسب إعدادات Axios في مشروعك
const API_BASE_URL = "/advancedReports/equipment";

export default function EquipmentReport() {
  const [activeTab, setActiveTab] = useState("maintenance"); // 'maintenance' | 'supplies' | 'summary'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // البيانات المتلقاة من API
  const [reportData, setReportData] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1,
    totalItems: 0,
  });

  // حالة الفلاتر الموحدة
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    equipmentName: "",
    sortBy: "breakdownsCount",
    sortOrder: "desc",
    dateFrom: "",
    dateTo: "",
  });

  // جلب البيانات حسب التبويب النشط
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let endpoint = `${API_BASE_URL}/maintenance`;
      if (activeTab === "supplies") endpoint = `${API_BASE_URL}/supplies`;
      if (activeTab === "summary") endpoint = `${API_BASE_URL}/consumption-summary`;

      // تنظيف الفلاتر الفارغة قبل إرسال الطلب
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
        err.response?.data?.message || "حدث خطأ أثناء جلب تقرير المعدات"
      );
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // تحديث التبويب النشط وتصفير الفلاتر الافتراضية المناسبة لكل تبويب
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    let defaultSortBy = "breakdownsCount";
    if (tab === "supplies") defaultSortBy = "totalCost";
    if (tab === "summary") defaultSortBy = "totalConsumption";

    setFilters({
      page: 1,
      limit: 20,
      equipmentName: "",
      sortBy: defaultSortBy,
      sortOrder: "desc",
      dateFrom: "",
      dateTo: "",
    });
  };

  // تحديث قيم الفلاتر
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const resetFilters = () => {
    let defaultSortBy = "breakdownsCount";
    if (activeTab === "supplies") defaultSortBy = "totalCost";
    if (activeTab === "summary") defaultSortBy = "totalConsumption";

    setFilters({
      page: 1,
      limit: 20,
      equipmentName: "",
      sortBy: defaultSortBy,
      sortOrder: "desc",
      dateFrom: "",
      dateTo: "",
    });
  };

  // تغيير رقم الصفحة
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters((prev) => ({ ...prev, page: newPage }));
    }
  };

  return (
    <div className="p-4 md:p-6 bg-ligth min-h-screen text-dark space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-brown/20 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-dark flex items-center gap-2">
            <WrenchScrewdriverIcon className="w-8 h-8 text-accent" />
            تقارير المعدات والتكاليف
          </h1>
          <p className="text-xs text-brown mt-1">
            متابعة صيانة الأعطال، استهلاك المستلزمات، والتكلفة الإجمالية لكل معدة.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-white rounded-lg p-1 shadow-sm border border-brown/10 self-start md:self-auto">
          <button
            onClick={() => handleTabChange("maintenance")}
            className={`px-3 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === "maintenance"
                ? "bg-dark text-white shadow-md"
                : "text-brown hover:text-dark hover:bg-ligth"
            }`}
          >
            <WrenchScrewdriverIcon className="w-4 h-4" />
            أعطال وصيانة
          </button>
          <button
            onClick={() => handleTabChange("supplies")}
            className={`px-3 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === "supplies"
                ? "bg-dark text-white shadow-md"
                : "text-brown hover:text-dark hover:bg-ligth"
            }`}
          >
            <CubeIcon className="w-4 h-4" />
            قطع غيار ومستلزمات
          </button>
          <button
            onClick={() => handleTabChange("summary")}
            className={`px-3 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === "summary"
                ? "bg-dark text-white shadow-md"
                : "text-brown hover:text-dark hover:bg-ligth"
            }`}
          >
            <ChartPieIcon className="w-4 h-4" />
            ملخص الاستهلاك
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-brown/10 space-y-4">
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
          {/* بحث باسم المعدة */}
          <div>
            <label className="block text-brown font-medium mb-1">اسم المعدة</label>
            <input
              type="text"
              name="equipmentName"
              value={filters.equipmentName}
              onChange={handleFilterChange}
              placeholder="ابحث باسم المعدة..."
              className="w-full px-3 py-2 border border-brown/20 rounded-lg focus:outline-none focus:border-accent bg-ligth/50"
            />
          </div>

          {/* ترتيب حسب (يختلف حسـب التبويب) */}
          {activeTab !== "summary" && (
            <div>
              <label className="block text-brown font-medium mb-1">ترتيب حسب</label>
              <select
                name="sortBy"
                value={filters.sortBy}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-brown/20 rounded-lg focus:outline-none focus:border-accent bg-ligth/50"
              >
                {activeTab === "maintenance" && (
                  <>
                    <option value="breakdownsCount">عدد الأعطال (المرّات)</option>
                    <option value="totalCost">إجمالي تكلفة الصيانة</option>
                  </>
                )}
                {activeTab === "supplies" && (
                  <>
                    <option value="totalCost">إجمالي التكلفة</option>
                    <option value="ordersCount">عدد طلبات الشراء</option>
                  </>
                )}
              </select>
            </div>
          )}

          {/* اتجاه الترتيب */}
          {activeTab !== "summary" && (
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
          )}

          {/* فلاتر التواريخ */}
          <div>
            <label className="block text-brown font-medium mb-1">من تاريخ الشراء/الصيانة</label>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-brown/20 rounded-lg focus:outline-none focus:border-accent bg-ligth/50"
            />
          </div>

          <div>
            <label className="block text-brown font-medium mb-1">إلى تاريخ الشراء/الصيانة</label>
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
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <ExclamationTriangleIcon className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-brown/10 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-brown text-sm flex flex-col items-center gap-3">
            <ArrowPathIcon className="w-8 h-8 animate-spin text-accent" />
            جاري تحميل البيانات...
          </div>
        ) : reportData.length === 0 ? (
          <div className="p-12 text-center text-brown/70 text-sm">
            لا توجد بيانات صيانة أو استهلاك مطابقة لخيارات البحث المحددة.
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Table 1: تقرير صيانة الأعطال */}
            {activeTab === "maintenance" && (
              <table className="w-full text-right text-xs">
                <thead className="bg-ligth text-dark font-bold border-b border-brown/10">
                  <tr>
                    <th className="p-3">اسم المعدة</th>
                    <th className="p-3">عدد مرّات الصيانة (الأعطال)</th>
                    <th className="p-3">قطع الغيار المستبدلة</th>
                    <th className="p-3">إجمالي تكلفة الصيانة</th>
                    <th className="p-3">تاريخ آخر صيانة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brown/10">
                  {reportData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-ligth/30 transition-colors">
                      <td className="p-3 font-bold text-dark flex items-center gap-2">
                        <CogIcon className="w-4 h-4 text-brown shrink-0" />
                        {item.displayName || "غير محدد"}
                      </td>
                      <td className="p-3">
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-bold">
                          {item.breakdownsCount} مرّات
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-brown">
                        {item.totalPartsReplaced || 0} قطعة
                      </td>
                      <td className="p-3 font-bold text-accent text-sm">
                        {item.totalCost?.toLocaleString()} ج.م
                      </td>
                      <td className="p-3 text-brown">
                        {item.lastMaintenanceDate
                          ? new Date(item.lastMaintenanceDate).toLocaleDateString("ar-EG")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Table 2: تقرير المستلزمات وقطع الغيار */}
            {activeTab === "supplies" && (
              <table className="w-full text-right text-xs">
                <thead className="bg-ligth text-dark font-bold border-b border-brown/10">
                  <tr>
                    <th className="p-3">اسم المعدة</th>
                    <th className="p-3">عدد طلبات الشراء/المستلزمات</th>
                    <th className="p-3">إجمالي التكلفة</th>
                    <th className="p-3">تاريخ آخر طلب</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brown/10">
                  {reportData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-ligth/30 transition-colors">
                      <td className="p-3 font-bold text-dark flex items-center gap-2">
                        <CubeIcon className="w-4 h-4 text-brown shrink-0" />
                        {item.equipmentName || "غير محدد"}
                      </td>
                      <td className="p-3">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full font-bold">
                          {item.ordersCount} طلبات
                        </span>
                      </td>
                      <td className="p-3 font-bold text-accent text-sm">
                        {item.totalCost?.toLocaleString()} ج.م
                      </td>
                      <td className="p-3 text-brown">
                        {item.lastOrderDate
                          ? new Date(item.lastOrderDate).toLocaleDateString("ar-EG")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Table 3: ملخص الاستهلاك الشامل */}
            {activeTab === "summary" && (
              <table className="w-full text-right text-xs">
                <thead className="bg-ligth text-dark font-bold border-b border-brown/10">
                  <tr>
                    <th className="p-3">اسم المعدة</th>
                    <th className="p-3">تكلفة الصيانة (الأعطال)</th>
                    <th className="p-3">تكلفة المستلزمات</th>
                    <th className="p-3">إجمالي الاستهلاك المالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brown/10">
                  {reportData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-ligth/30 transition-colors">
                      <td className="p-3 font-bold text-dark uppercase">
                        {item.equipmentName}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-dark">
                          {item.maintenanceCost?.toLocaleString()} ج.م
                        </div>
                        <div className="text-[10px] text-brown">
                          ({item.maintenanceCount} صيانة)
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-dark">
                          {item.suppliesCost?.toLocaleString()} ج.م
                        </div>
                        <div className="text-[10px] text-brown">
                          ({item.suppliesCount} توريد)
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg font-bold text-sm inline-block">
                          {item.totalConsumption?.toLocaleString()} ج.م
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && reportData.length > 0 && (
          <div className="p-4 bg-ligth/40 border-t border-brown/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-brown">
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
    </div>
  );
}