import { useEffect, useState } from "react";
import api from "../../services/api";
import { showAlert } from "../../services/alert";
import {
  Search,
  FileSpreadsheet,
  Calendar,
  Clock,
  Activity,
  PlusCircle,
  Edit3,
  Trash2,
  CreditCard,
  CheckCircle2,
  RefreshCw,
  X,
  Eye,
  Filter,
} from "lucide-react";
import * as XLSX from "xlsx";

const ACTION_STYLE = {
  "إنشاء": {
    icon: PlusCircle,
    className: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  },
  "تعديل": {
    icon: Edit3,
    className: "bg-amber-100 text-amber-800 border border-amber-200",
  },
  "حذف": {
    icon: Trash2,
    className: "bg-rose-100 text-rose-800 border border-rose-200",
  },
  "استلام": {
    icon: CheckCircle2,
    className: "bg-purple-100 text-purple-800 border border-purple-200",
  },
  "سداد": {
    icon: CreditCard,
    className: "bg-blue-100 text-blue-800 border border-blue-200",
  },
  "تفعيل": {
    icon: CheckCircle2,
    className: "bg-green-100 text-green-800 border border-green-200",
  },
  "إلغاء التفعيل": {
    icon: X,
    className: "bg-red-100 text-red-800 border border-red-200",
  },
  "تغيير الصلاحية": {
    icon: RefreshCw,
    className: "bg-indigo-100 text-indigo-800 border border-indigo-200",
  },
};

const SECTIONS = [
  "المبيعات",
  "الشيكات",
  "المدفوعات",
  "المصاريف",
  "الإعدادات",
  "شراء الشكاير",
  "المعدات",
  "توريد المعدات",
  "الصيانة",
  "السلك",
];

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [actions, setActions] = useState([]);

  // Modal State للتفاصيل
  const [selectedDetails, setSelectedDetails] = useState(null);

  // States للحذف
  const [daysRange, setDaysRange] = useState(2);
  const [deleting, setDeleting] = useState(false);

  // Filters State
  const [search, setSearch] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
  });

  // ================= FETCH DATA =================
  const fetchLogs = async () => {
    try {
      setLoading(true);

      const [logsRes, actionsRes] = await Promise.all([
        api.get("/activationLog", {
          params: {
            page: currentPage,
            limit,
            search,
            section: selectedSection,
            action: selectedAction,
            fromDate,
            toDate,
          },
        }),
        api.get("/activationLog/actions"),
      ]);

      if (logsRes.data.success) {
        setLogs(logsRes.data.logs);
        setPagination(logsRes.data.pagination);
      }

      if (actionsRes.data.success) {
        setActions(actionsRes.data.actions);
      }
    } catch (error) {
      showAlert({
        title: "خطأ في جلب سجل النشاطات",
        text: error?.response?.data?.message || "تعذر الاتصال بالسيرفر",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, limit, selectedSection, selectedAction, fromDate, toDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLogs();
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedSection("");
    setSelectedAction("");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

  // ================= EXPORT ALL EXCEL =================
  const exportAllToExcel = async () => {
    try {
      setExporting(true);
      const res = await api.get("/activationLog/getActivityLogsToExcelSheets");

      if (!res.data.success || !res.data.logs.length) {
        return showAlert({ title: "لا توجد بيانات للتصدير", icon: "warning" });
      }

      const dataToExport = res.data.logs.map((log, index) => ({
        "#": index + 1,
        القسم: log.section,
        الإجراء: log.action,
        العنوان: log.title || "-",
        التفاصيل: log.details || "-",
        المستخدم: log.user?.username || "غير معروف",
        البريد: log.user?.email || "-",
        "التاريخ والوقت": new Date(log.createdAt).toLocaleString("ar-EG"),
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "سجل النشاطات الكامل");
      XLSX.writeFile(
        workbook,
        `full_activity_logs_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    } catch (error) {
      showAlert({
        title: "خطأ أثناء تصدير البيانات",
        text: error?.response?.data?.message || "تعذر التصدير",
        icon: "error",
      });
    } finally {
      setExporting(false);
    }
  };

  // ================= DELETE LOGS =================
  const handleDeleteAll = async () => {
    if (!window.confirm("هل أنت تأكد من إمكانية حذف جميع سجلات الحركة؟ لا يمكن التراجع عن هذا الإجراء!")) {
      return;
    }

    try {
      setDeleting(true);
      const res = await api.delete("/activationLog/deleteAll");
      if (res.data.success) {
        showAlert({
          title: "تم الحذف بنجاح",
          text: res.data.message,
          icon: "success",
        });
        fetchLogs();
      }
    } catch (error) {
      showAlert({
        title: "خطأ في عملية الحذف",
        text: error?.response?.data?.message || "تعذر حذف البيانات",
        icon: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteRange = async () => {
    if (!daysRange || daysRange <= 0) {
      return showAlert({
        title: "يرجى إدخال عدد أيام صحيح",
        icon: "warning",
      });
    }

    if (!window.confirm(`هل أنت تأكد من حذف جميع السجلات الأقدم من ${daysRange} يوم؟`)) {
      return;
    }

    try {
      setDeleting(true);
      const res = await api.delete("/activationLog/deleteWithinRange", {
        data: { range: Number(daysRange) },
      });

      if (res.data.success) {
        showAlert({
          title: "تم الحذف بنجاح",
          text: res.data.message,
          icon: "success",
        });
        fetchLogs();
      }
    } catch (error) {
      showAlert({
        title: "خطأ في عملية الحذف",
        text: error?.response?.data?.message || "تعذر حذف البيانات",
        icon: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  // شارة نوع الإجراء
  const renderActionBadge = (action) => {
    const item = ACTION_STYLE[action];

    if (!item) {
      return (
        <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
          {action}
        </span>
      );
    }

    const Icon = item.icon;

    return (
      <span
        className={`${item.className} px-3 py-1 rounded-full inline-flex items-center gap-1 text-xs font-bold`}
      >
        <Icon size={13} />
        {action}
      </span>
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-8" dir="rtl">
      <div className="mx-auto mb-8">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
              <Activity className="text-amber-700" size={32} />
              سجل الحركات والنشاطات
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              تتبع العمليات المنفذة على كافة أجزاء النظام
            </p>
          </div>

          <button
            onClick={exportAllToExcel}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md"
          >
            <FileSpreadsheet size={18} />
            {exporting ? "جاري التصدير..." : "تصدير الشيت الكامل (Excel)"}
          </button>
        </div>

        {/* DELETE CONTROLS SECTION */}
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
            <Trash2 size={20} className="text-rose-600" />
            <span>إدارة تنظيف وشطب السجلات:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-rose-200">
              <span className="text-xs font-bold text-slate-600">حذف أقدم من:</span>
              <input
                type="number"
                min="1"
                value={daysRange}
                onChange={(e) => setDaysRange(e.target.value)}
                className="w-16 p-1 text-center font-bold text-slate-900 bg-slate-50 rounded border border-slate-300 text-sm focus:outline-none"
              />
              <span className="text-xs font-bold text-slate-600">يوم</span>
              <button
                onClick={handleDeleteRange}
                disabled={deleting}
                className="mr-2 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-all disabled:opacity-50"
              >
                تنفيذ
              </button>
            </div>

            <button
              onClick={handleDeleteAll}
              disabled={deleting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              <Trash2 size={14} />
              مسح جميع السجلات
            </button>
          </div>
        </div>

        {/* QUICK STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-slate-100 rounded-xl text-slate-700">
              <Clock size={28} />
            </div>
            <div>
              <p className="text-slate-500 font-bold text-sm">إجمالي الحركات المطابقة</p>
              <h3 className="text-2xl font-black text-slate-800">{pagination.total}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <PlusCircle size={28} />
            </div>
            <div>
              <p className="text-slate-500 font-bold text-sm">عمليات الإنشاء (الصفحة الحالية)</p>
              <h3 className="text-2xl font-black text-emerald-600">
                {logs.filter((l) => l.action === "إنشاء").length}
              </h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <Edit3 size={28} />
            </div>
            <div>
              <p className="text-slate-500 font-bold text-sm">عمليات التعديل (الصفحة الحالية)</p>
              <h3 className="text-2xl font-black text-amber-600">
                {logs.filter((l) => l.action === "تعديل").length}
              </h3>
            </div>
          </div>
        </div>

        {/* FILTERS */}
        <div className="bg-slate-900 p-5 rounded-xl mb-8 text-white shadow-xl">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2 relative">
              <Search className="absolute right-3 top-3 text-slate-400" size={18} />
              <input
                placeholder="ابحث بالعنوان، التفاصيل، القسم..."
                className="w-full bg-slate-50 border-none text-slate-900 pr-10 py-2.5 rounded-xl focus:ring-2 focus:ring-amber-500 transition-all text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div>
              <select
                value={selectedSection}
                onChange={(e) => {
                  setSelectedSection(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border-none text-slate-900 p-2.5 rounded-xl focus:ring-2 focus:ring-amber-500 transition-all text-sm cursor-pointer"
              >
                <option value="">جميع الأقسام</option>
                {SECTIONS.map((sec, idx) => (
                  <option key={idx} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedAction}
                onChange={(e) => {
                  setSelectedAction(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border-none text-slate-900 p-2.5 rounded-xl focus:ring-2 focus:ring-amber-500 transition-all text-sm cursor-pointer"
              >
                <option value="">جميع الإجراءات</option>

                {actions.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border-none text-slate-900 p-2.5 rounded-xl focus:ring-2 focus:ring-amber-500 transition-all text-sm"
              />
            </div>

            <div>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border-none text-slate-900 p-2.5 rounded-xl focus:ring-2 focus:ring-amber-500 transition-all text-sm"
              />
            </div>
          </form>

          <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-700/50 text-xs text-slate-300">
            <span>عدد النتائج: {pagination.total}</span>
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 bg-slate-100 rounded-md p-2 text-slate-900 hover:bg-white font-bold transition-all"
            >
              <RefreshCw size={14} /> إعادة ضبط
            </button>
          </div>
        </div>

        {/* LOGS TABLE */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50 text-slate-700 border-b">
                <tr>
                  <th className="px-5 py-4 font-black">#</th>
                  <th className="px-5 py-4 font-black">القسم</th>
                  <th className="px-5 py-4 font-black">الإجراء</th>
                  <th className="px-5 py-4 font-black">العنوان</th>
                  <th className="px-5 py-4 font-black">التفاصيل</th>
                  <th className="px-5 py-4 font-black">المستخدم</th>
                  <th className="px-5 py-4 font-black">التاريخ والوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-slate-400 font-bold">
                      جاري تحميل بيانات السجل...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-slate-400 font-bold">
                      لا توجد حركات مسجلة تطابق خيارات البحث
                    </td>
                  </tr>
                ) : (
                  logs.map((log, index) => {
                    const isLongDetails = log.details && log.details.length > 20;
                    const truncatedDetails = isLongDetails
                      ? log.details.slice(0, 20) + "..."
                      : log.details || "-";

                    return (
                      <tr key={log._id || index} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4 font-bold text-slate-400 text-sm">
                          {(currentPage - 1) * limit + index + 1}
                        </td>

                        <td className="px-5 py-4">
                          <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded-lg text-sm font-black border border-slate-200">
                            {log.section}
                          </span>
                        </td>

                        <td className="px-5 py-4">{renderActionBadge(log.action)}</td>

                        <td className="px-5 py-4 font-bold text-slate-800 text-sm">
                          {log.title || "-"}
                        </td>

                        {/* DETAILS COLUMN WITH TRUNCATE & POPUP BUTTON */}
                        <td className="px-5 py-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <span>{truncatedDetails}</span>
                            {isLongDetails && (
                              <button
                                onClick={() =>
                                  setSelectedDetails({
                                    title: log.title || log.section,
                                    details: log.details,
                                    user: log.user?.username,
                                    date: log.createdAt,
                                  })
                                }
                                title="عرض التفاصيل الكاملة"
                                className="p-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-md transition-all font-bold text-xs flex items-center gap-0.5 border border-amber-200"
                              >
                                <Eye size={12} /> المزيد
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                              {log.user?.username?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                            <div>
                              <p className="font-black text-slate-800 text-sm">
                                {log.user?.username || "من سيستم المحافظ"}
                              </p>
                              <p className="text-xs text-slate-400 dir-ltr text-right">
                                {log.user?.email || ""}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 font-bold text-slate-600 text-sm">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-amber-600" />
                            {new Date(log.createdAt).toLocaleString("ar-EG", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION CONTROLS */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-xs font-bold text-slate-500">
              عرض الصفحة {currentPage} من {pagination.totalPages || 1}
            </div>

            <div className="flex gap-2">
              <button
                disabled={currentPage === 1 || loading}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="px-4 py-2 bg-white text-slate-800 border rounded-xl font-bold text-sm hover:bg-slate-100 disabled:opacity-50 transition-all"
              >
                السابق
              </button>

              <button
                disabled={currentPage >= pagination.totalPages || loading}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages))
                }
                className="px-4 py-2 bg-white text-slate-800 border rounded-xl font-bold text-sm hover:bg-slate-100 disabled:opacity-50 transition-all"
              >
                التالي
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* POPUP MODAL FOR DETAILS */}
      {selectedDetails && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative dir-rtl">
            <button
              onClick={() => setSelectedDetails(null)}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-100 transition-all"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
              <Activity className="text-amber-600" size={20} />
              تفاصيل الحركة
            </h3>
            <p className="text-xs text-slate-400 mb-4">{selectedDetails.title}</p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-800 font-medium text-sm leading-relaxed mb-4 max-h-60 overflow-y-auto whitespace-pre-wrap">
              {selectedDetails.details}
            </div>

            <div className="flex justify-between items-center text-xs text-slate-500 border-t pt-3">
              <span>المسؤول: {selectedDetails.user || "من سيستم المحافظ"}</span>
              <span>
                {new Date(selectedDetails.date).toLocaleString("ar-EG")}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}