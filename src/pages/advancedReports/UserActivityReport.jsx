import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  UserIcon,
  ClockIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  CommandLineIcon,
  XMarkIcon,
  DocumentMagnifyingGlassIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";
import api from "../../services/api";

// قم بتعديل المسار الأساسي لـ API حسب إعدادات Axios في مشروعك
const API_BASE_URL = "/advancedReports/users";

export default function UserActivityReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // بيانات التقرير الرئيسي
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1,
    totalItems: 0,
  });

  // فلاتر التقرير الرئيسي
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    section: "",
    action: "",
    sortBy: "actionsCount",
    sortOrder: "desc",
    dateFrom: "",
    dateTo: "",
  });

  // حالة سجل نشاط يوزر معين (Modal)
  const [selectedUser, setSelectedUser] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityPagination, setActivityPagination] = useState({
    page: 1,
    limit: 15,
    totalPages: 1,
    totalItems: 0,
  });
  const [activityFilters, setActivityFilters] = useState({
    section: "",
    action: "",
    dateFrom: "",
    dateTo: "",
  });

  // جلب تقرير الأكثر نشاطاً
  const fetchMostActiveReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const cleanParams = Object.fromEntries(
        Object.entries(filters).filter(([_, val]) => val !== "" && val !== null)
      );

      const response = await api.get(`${API_BASE_URL}/most-active`, {
        params: cleanParams,
      });

      if (response.data?.success) {
        setUsers(response.data.data || []);
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
        err.response?.data?.message || "حدث خطأ أثناء جلب تقرير نشاط المستخدمين"
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // جلب سجلات النشاط التفصيلية لمستخدم محدد
  const fetchUserActivityDetails = useCallback(
    async (userId, page = 1) => {
      if (!userId) return;
      setActivityLoading(true);

      try {
        const cleanParams = Object.fromEntries(
          Object.entries({
            ...activityFilters,
            page,
            limit: activityPagination.limit,
          }).filter(([_, val]) => val !== "" && val !== null)
        );

        const response = await api.get(`${API_BASE_URL}/${userId}/activity`, {
          params: cleanParams,
        });

        if (response.data?.success) {
          setActivityLogs(response.data.data || []);
          if (response.data.pagination) {
            setActivityPagination({
              page: response.data.pagination.page,
              limit: response.data.pagination.limit,
              totalPages: response.data.pagination.totalPages,
              totalItems: response.data.pagination.totalItems,
            });
          }
        }
      } catch (err) {
        console.error("خطأ جلب سجل نشاط المستخدم:", err);
      } finally {
        setActivityLoading(false);
      }
    },
    [activityFilters, activityPagination.limit]
  );

  useEffect(() => {
    fetchMostActiveReport();
  }, [fetchMostActiveReport]);

  useEffect(() => {
    if (selectedUser?.userId) {
      fetchUserActivityDetails(selectedUser.userId, 1);
    }
  }, [selectedUser, activityFilters, fetchUserActivityDetails]);

  // تغيير الفلاتر الرئيسية
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const resetFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      section: "",
      action: "",
      sortBy: "actionsCount",
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

  // شارات الأقسام والإجراءات بألوان مناسبة
  const renderActionBadge = (act) => {
    const actionUpper = act?.toUpperCase() || "";
    if (actionUpper.includes("CREATE") || actionUpper.includes("ADD")) {
      return (
        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-bold text-[10px] inline-flex items-center gap-1">
          <PlusCircleIcon className="w-3 h-3" /> إضافة
        </span>
      );
    }
    if (actionUpper.includes("UPDATE") || actionUpper.includes("EDIT")) {
      return (
        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded font-bold text-[10px] inline-flex items-center gap-1">
          <PencilSquareIcon className="w-3 h-3" /> تعديل
        </span>
      );
    }
    if (actionUpper.includes("DELETE") || actionUpper.includes("REMOVE")) {
      return (
        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded font-bold text-[10px] inline-flex items-center gap-1">
          <TrashIcon className="w-3 h-3" /> حذف
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-bold text-[10px] inline-flex items-center gap-1">
        <CheckCircleIcon className="w-3 h-3" /> {act}
      </span>
    );
  };

  return (
    <div className="p-4 md:p-6 bg-ligth min-h-screen text-dark space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-brown/20 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-dark flex items-center gap-2">
            <CommandLineIcon className="w-8 h-8 text-accent" />
            تقرير نشاط المستخدمين والتحركات
          </h1>
          <p className="text-xs text-brown mt-1">
            متابعة حركة المستخدمين الأكثر تفاعلاً، الأقسام المغطاة، وسجل السجلات التفصيلي.
          </p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-brown/10 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-dark flex items-center gap-2">
            <FunnelIcon className="w-4 h-4 text-accent" />
            خيارات تصفية السجلات
          </h2>
          <button
            onClick={resetFilters}
            className="text-xs text-accent hover:underline flex items-center gap-1 font-semibold"
          >
            <ArrowPathIcon className="w-3.5 h-3.5" />
            إعادة ضبط
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          {/* قسم النظام */}
          <div>
            <label className="block text-brown font-medium mb-1">القسم / Section</label>
            <input
              type="text"
              name="section"
              value={filters.section}
              onChange={handleFilterChange}
              placeholder="مثال: customers, cheques..."
              className="w-full px-3 py-2 border border-brown/20 rounded-lg focus:outline-none focus:border-accent bg-ligth/50"
            />
          </div>

          {/* نوع العملية */}
          <div>
            <label className="block text-brown font-medium mb-1">نوع العملية / Action</label>
            <input
              type="text"
              name="action"
              value={filters.action}
              onChange={handleFilterChange}
              placeholder="مثال: create, update..."
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
              <option value="actionsCount">عدد العمليات (الأكثر نشاطاً)</option>
              <option value="lastActionDate">تاريخ آخر نشاط</option>
            </select>
          </div>

          {/* الاتجاه */}
          <div>
            <label className="block text-brown font-medium mb-1">الاتجاه</label>
            <select
              name="sortOrder"
              value={filters.sortOrder}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-brown/20 rounded-lg focus:outline-none focus:border-accent bg-ligth/50"
            >
              <option value="desc">تنازلي (الأحدث/الأكثر)</option>
              <option value="asc">تصاعدي (الأقدم/الأقل)</option>
            </select>
          </div>

          {/* فلاتر التواريخ */}
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

      {/* رسالة الخطأ */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <ExclamationTriangleIcon className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* الجدول الرئيسي للتقرير */}
      <div className="bg-white rounded-xl shadow-sm border border-brown/10 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-brown text-sm flex flex-col items-center gap-3">
            <ArrowPathIcon className="w-8 h-8 animate-spin text-accent" />
            جاري تحميل سجلات النشاط...
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-brown/70 text-sm">
            لا تتوفر سجلات نشاط مطابقة للمحددات الحالية.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-ligth text-dark font-bold border-b border-brown/10">
                <tr>
                  <th className="p-3">اسم المستخدم</th>
                  <th className="p-3">الدور الوظيفي (Role)</th>
                  <th className="p-3">إجمالي العمليات المسجلة</th>
                  <th className="p-3">الأقسام المتأثرة</th>
                  <th className="p-3">تاريخ آخر إجراء</th>
                  <th className="p-3 text-center">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brown/10">
                {users.map((item, idx) => (
                  <tr key={idx} className="hover:bg-ligth/30 transition-colors">
                    <td className="p-3 font-bold text-dark flex items-center gap-2">
                      <div className="p-1.5 bg-brown/10 rounded-full text-brown">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      {item.username || "غير معرّف"}
                    </td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 bg-brown/10 text-dark border border-brown/20 rounded-md font-semibold text-[11px] inline-flex items-center gap-1">
                        <ShieldCheckIcon className="w-3.5 h-3.5 text-accent" />
                        {item.role || "مستخدم"}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-bold">
                        {item.actionsCount?.toLocaleString()} إجراء
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {item.sectionsTouched && item.sectionsTouched.length > 0 ? (
                          item.sectionsTouched.map((sec, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-2 py-0.5 bg-ligth text-brown border border-brown/10 rounded text-[10px] "
                            >
                              {sec}
                            </span>
                          ))
                        ) : (
                          <span className="text-brown/50">—</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-brown">
                      {item.lastActionDate ? (
                        <div className="flex items-center gap-1">
                          <ClockIcon className="w-3.5 h-3.5 text-brown/70" />
                          <span>
                            {new Date(item.lastActionDate).toLocaleDateString("ar-EG")}{" "}
                            {new Date(item.lastActionDate).toLocaleTimeString("ar-EG", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setSelectedUser(item)}
                        className="px-3 py-1.5 bg-dark text-white rounded-lg hover:bg-brown transition-colors font-semibold flex items-center gap-1 mx-auto text-[11px]"
                      >
                        <DocumentMagnifyingGlassIcon className="w-3.5 h-3.5 text-accent" />
                        سجل التحركات
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && users.length > 0 && (
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

      {/* Modal سجل النشاط التفصيلي للمستخدم */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-dark/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-brown/20 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-dark text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CommandLineIcon className="w-6 h-6 text-accent" />
                <div>
                  <h3 className="font-bold text-sm md:text-base">
                    سجل نشاط المستخدم: {selectedUser.username || "غير معرّف"}
                  </h3>
                  <p className="text-[11px] text-ligth/70">
                    الدور: {selectedUser.role || "غير محدد"} | إجمالي العمليات المسجلة:{" "}
                    {selectedUser.actionsCount}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 text-ligth/70 hover:text-white rounded-lg hover:bg-white/10"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Filters */}
            <div className="p-3 bg-ligth/50 border-b border-brown/10 flex flex-wrap gap-2 items-center text-xs">
              <input
                type="text"
                placeholder="تصفية بقسم..."
                value={activityFilters.section}
                onChange={(e) =>
                  setActivityFilters((prev) => ({ ...prev, section: e.target.value }))
                }
                className="px-2.5 py-1 border border-brown/20 rounded bg-white"
              />
              <input
                type="text"
                placeholder="تصفية بإجراء..."
                value={activityFilters.action}
                onChange={(e) =>
                  setActivityFilters((prev) => ({ ...prev, action: e.target.value }))
                }
                className="px-2.5 py-1 border border-brown/20 rounded bg-white"
              />
              <input
                type="date"
                value={activityFilters.dateFrom}
                onChange={(e) =>
                  setActivityFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
                }
                className="px-2 py-1 border border-brown/20 rounded bg-white"
              />
              <span>إلى</span>
              <input
                type="date"
                value={activityFilters.dateTo}
                onChange={(e) =>
                  setActivityFilters((prev) => ({ ...prev, dateTo: e.target.value }))
                }
                className="px-2 py-1 border border-brown/20 rounded bg-white"
              />
              {(activityFilters.section ||
                activityFilters.action ||
                activityFilters.dateFrom ||
                activityFilters.dateTo) && (
                <button
                  onClick={() =>
                    setActivityFilters({
                      section: "",
                      action: "",
                      dateFrom: "",
                      dateTo: "",
                    })
                  }
                  className="text-accent text-[11px] underline font-semibold"
                >
                  إلغاء التصفية
                </button>
              )}
            </div>

            {/* Modal Table Content */}
            <div className="p-4 overflow-y-auto flex-1">
              {activityLoading ? (
                <div className="py-12 text-center text-brown text-xs flex flex-col items-center gap-2">
                  <ArrowPathIcon className="w-6 h-6 animate-spin text-accent" />
                  جاري جلب السجلات والتفاصيل...
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="py-12 text-center text-brown/70 text-xs">
                  لا توجد سجلات نشاط مطابقة للتصفية المحددة.
                </div>
              ) : (
                <table className="w-full text-right text-xs">
                  <thead className="bg-ligth text-dark font-bold sticky top-0 border-b border-brown/10">
                    <tr>
                      <th className="p-2.5">الوقت والتاريخ</th>
                      <th className="p-2.5">القسم (Section)</th>
                      <th className="p-2.5">العملية (Action)</th>
                      <th className="p-2.5">التفاصيل / ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brown/10">
                    {activityLogs.map((log, idx) => (
                      <tr key={idx} className="hover:bg-ligth/30 transition-colors">
                        <td className="p-2.5 text-brown whitespace-nowrap">
                          {log.createdAt
                            ? `${new Date(log.createdAt).toLocaleDateString("ar-EG")} ${new Date(
                                log.createdAt
                              ).toLocaleTimeString("ar-EG", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}`
                            : "—"}
                        </td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 bg-brown/10 text-dark  rounded text-[11px]">
                            {log.section || "عام"}
                          </span>
                        </td>
                        <td className="p-2.5">{renderActionBadge(log.action)}</td>
                        <td className="p-2.5 text-brown  text-[11px] max-w-xs break-all">
                          {log.details ? (
                            typeof log.details === "object" ? (
                              JSON.stringify(log.details)
                            ) : (
                              log.details
                            )
                          ) : (
                            <span className="text-brown/40">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Pagination Footer */}
            {activityPagination.totalPages > 1 && (
              <div className="p-3 bg-ligth/40 border-t border-brown/10 flex items-center justify-between text-xs text-brown">
                <span>
                  صفحة {activityPagination.page} من {activityPagination.totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      fetchUserActivityDetails(
                        selectedUser.userId,
                        activityPagination.page - 1
                      )
                    }
                    disabled={activityPagination.page === 1}
                    className="p-1 rounded border border-brown/20 disabled:opacity-40 hover:bg-white text-dark transition-all"
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      fetchUserActivityDetails(
                        selectedUser.userId,
                        activityPagination.page + 1
                      )
                    }
                    disabled={activityPagination.page === activityPagination.totalPages}
                    className="p-1 rounded border border-brown/20 disabled:opacity-40 hover:bg-white text-dark transition-all"
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