import { useEffect, useState } from "react";
import {
  AlertTriangle,
  FileSpreadsheet,
  Trash2,
  X,
  Database,
} from "lucide-react";
import * as XLSX from "xlsx";
import api from "../../services/api";
import { showAlert } from "../../services/alert";

export default function LogsCleanupModal() {
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupStep, setCleanupStep] = useState("prompt"); // "prompt" | "options"
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [daysRange, setDaysRange] = useState(2);

  // ================= CHECK 2 DAYS CLEANUP PROMPT =================
  useEffect(() => {
    const lastPrompt = localStorage.getItem("lastLogCleanupPromptDate");
    const twoDaysInMs = 2 * 24 * 60 * 60 * 1000; // 48 ساعة بالميللي ثانية
    const now = Date.now();

    if (!lastPrompt || now - Number(lastPrompt) >= twoDaysInMs) {
      setShowCleanupModal(true);
    }
  }, []);

  const handleCloseCleanupModal = () => {
    localStorage.setItem("lastLogCleanupPromptDate", Date.now().toString());
    setShowCleanupModal(false);
    setCleanupStep("prompt");
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

      showAlert({
        title: "تم تصدير النسخة بنجاح",
        text: "تم حفظ شيت الإكسيل الكامل لجميع الحركات.",
        icon: "success",
      });
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
    if (
      !window.confirm(
        "هل أنت متأكد من حذف جميع السجلات؟ نوصي بسحب نسخة إكسيل أولاً لتفادي ضياع البيانات."
      )
    ) {
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
        handleCloseCleanupModal();
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

    if (
      !window.confirm(
        `هل أنت متأكد من حذف السجلات الأقدم من ${daysRange} يوم؟`
      )
    ) {
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
        handleCloseCleanupModal();
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

  if (!showCleanupModal) return null;

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-200"
    >
      <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 text-right transform-gpu transition-all">
        <button
          onClick={handleCloseCleanupModal}
          type="button"
          className="absolute left-4 top-4 text-slate-400 hover:text-slate-800 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X size={20} />
        </button>

        {/* STEP 1: INITIAL PROMPT */}
        {cleanupStep === "prompt" && (
          <div>
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
              <AlertTriangle size={32} />
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-2">
              تذكير دوري: تنظيف سجل الحركات
            </h3>
            <p className="text-slate-600 font-medium text-sm leading-relaxed mb-6">
              سجلات الحركات تتزايد باستمرار وبسرعة. لتسريع استجابة النظام والحفاظ على سلاسة الأداء، يُفضل سحب نسخة إكسيل للاحتفاظ بها ثم تفريغ السجلات القديمة.
            </p>

            {/* EXPORT BUTTON IN PROMPT */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700 text-xs font-bold">
                <Database size={18} className="text-amber-600" />
                <span>تصدير نسخة احتياطية؟</span>
              </div>
              <button
                type="button"
                onClick={exportAllToExcel}
                disabled={exporting}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <FileSpreadsheet size={14} />
                {exporting ? "جاري التصدير..." : "تحميل Excel"}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setCleanupStep("options")}
                className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm transition-colors shadow-md text-center"
              >
                نعم، أريد بدء التنظيف الآن
              </button>

              <button
                type="button"
                onClick={handleCloseCleanupModal}
                className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors text-center"
              >
                تذكيري بعد يومين
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CLEANUP OPTIONS */}
        {cleanupStep === "options" && (
          <div>
            <h3 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-2">
              <Trash2 className="text-rose-600" size={24} />
              اختر طريقة الحذف
            </h3>
            <p className="text-slate-500 font-medium text-xs mb-6">
              حدد الخيار المناسب لتنظيف قاعدة البيانات:
            </p>

            <div className="space-y-4 mb-6">
              {/* OPTION A: DELETE OLDER THAN X DAYS */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                <h4 className="font-bold text-slate-800 text-sm mb-2">
                  1. الإبقاء على آخر السجلات وحذف القديم
                </h4>
                <p className="text-xs text-slate-500 mb-3">
                  سيتم الاحتفاظ بالأيام الأخيرة المحددة وحذف ما قبلها.
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">
                    الاحتفاظ بـآخر:
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={daysRange}
                    onChange={(e) => setDaysRange(e.target.value)}
                    className="w-20 p-2 text-center font-bold text-slate-900 bg-white rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-slate-700">يوم</span>
                  <button
                    type="button"
                    onClick={handleDeleteRange}
                    disabled={deleting}
                    className="mr-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-colors disabled:opacity-50"
                  >
                    {deleting ? "جاري الحذف..." : "حذف القديم"}
                  </button>
                </div>
              </div>

              {/* OPTION B: DELETE ALL */}
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl">
                <h4 className="font-bold text-rose-900 text-sm mb-1">
                  2. حذف جميع السجلات بالكامل
                </h4>
                <p className="text-xs text-rose-700/80 mb-3">
                  تفريغ كافة سجلات الحركات المسجلة بالكامل حتى الآن.
                </p>
                <button
                  type="button"
                  onClick={handleDeleteAll}
                  disabled={deleting}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} />
                  {deleting ? "جاري المسح الكامل..." : "مسح جميع السجلات الآن"}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCleanupStep("prompt")}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors text-center"
            >
              رجوع للخطوة السابقة
            </button>
          </div>
        )}
      </div>
    </div>
  );
}