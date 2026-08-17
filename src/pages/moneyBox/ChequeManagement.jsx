import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  FiSearch,
  FiFilter,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiEdit,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiX,
} from "react-icons/fi";
import api from "../../services/api";
import { FaMoneyBill } from "react-icons/fa";
import { FiPrinter } from "react-icons/fi";
import { Eye, EyeIcon, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { showAlert } from "../../services/alert";
import { showAlertConfirm } from "../../services/alertConfirm";

const ChequeManagement = () => {
  // === States ===
  const [cheques, setCheques] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState({
    summary: { dueToday: 0, late: 0, upcoming: 0 },
    notifications: { dueToday: [], lateCheques: [], upcoming: [] },
  });

  const [viewCheque, setViewCheque] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [totalAmounts, setTotalAmounts] = useState(0);

  // === مودال تفاصيل الكروت (مستحقة اليوم / متأخرة / قادمة / إجمالي القائم) ===
  const [detailsModal, setDetailsModal] = useState({
    isOpen: false,
    title: "",
    list: [],
  });
  const [pendingDetailsLoading, setPendingDetailsLoading] = useState(false);

  const navigation = useNavigate();
  // الترقيم الصفحي
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCheques: 0,
    limit: 10,
  });

  // الفلاتر
  const [filters, setFilters] = useState({
    chequeNumber: "",
    status: "",
    location: "",
    chequeType: "",
    bankName: "",
    dueFrom: "",
    dueTo: "",
  });

  // التعديل (Modal State)
  const [selectedCheque, setSelectedCheque] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    status: "",
    location: "",
    bankName: "",
    chequeType: "",
    notes: "",
    dueDate: "",
    receiveDate: "",
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleOpenModal = (cheque) => {
    setViewCheque(cheque);
    setIsViewModalOpen(true);
  };

  // === مودال التفاصيل العام ===
  const openDetailsModal = (title, list) => {
    setDetailsModal({ isOpen: true, title, list: list || [] });
  };

  const closeDetailsModal = () => {
    setDetailsModal({ isOpen: false, title: "", list: [] });
  };

  // كارت "إجمالي الشيكات القائمة" — تفاصيل الشيكات المكوّنة للإجمالي
  // عبر نفس /cheque الموجود بالفعل (بدون أي تعديل بالباك):
  // under_collection + due_today فقط، وده هو تعريف "القائمة" المطلوب.
  const fetchPendingDetails = async () => {
    setPendingDetailsLoading(true);
    try {
      const [res1, res2] = await Promise.all([
        api.get("/cheque", { params: { status: "under_collection", limit: 1000 } }),
        api.get("/cheque", { params: { status: "due_today", limit: 1000 } }),
      ]);

      const merged = [
        ...(res1.data.cheques || []),
        ...(res2.data.cheques || []),
      ].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

      openDetailsModal("الشيكات القائمة (تحت التحصيل)", merged);
    } catch (err) {
      console.error("خطأ في جلب تفاصيل الإجمالي:", err);
      showAlert({ title: "حدث خطأ أثناء جلب التفاصيل", icon: "error" });
    } finally {
      setPendingDetailsLoading(false);
    }
  };

  // === Fetch Notifications ===
  const fetchNotifications = async () => {
    try {
      const res = await api.get("/cheque/notification");
      setNotifications(res.data);
    } catch (err) {
      console.error("خطأ في جلب التنبيهات:", err);
    }
  };

  // === Fetch Cheques ===
  const fetchCheques = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.currentPage,
        limit: pagination.limit,
        ...filters,
      };

      // تنظيف الخصائص الفارغة
      Object.keys(params).forEach(
        (key) => !params[key] && delete params[key]
      );

      const res = await api.get("/cheque", { params });
      setCheques(res.data.cheques);
      setTotalAmounts(res.data.totalAmounts.pending.amount);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error("خطأ في جلب الشيكات:", err);
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.limit, filters]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    fetchCheques();
  }, [fetchCheques]);

  // === Handlers ===
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const resetFilters = () => {
    setFilters({
      chequeNumber: "",
      status: "",
      location: "",
      chequeType: "",
      bankName: "",
      dueFrom: "",
      dueTo: "",
    });
  };

  const handleOpenUpdateModal = (cheque) => {
    setSelectedCheque(cheque);
    setUpdateForm({
      status: cheque.status || "",
      location: cheque.location || "",
      bankName: cheque.bankName || "",
      chequeType: cheque.chequeType || "",
      notes: cheque.notes || "",
      dueDate: cheque.dueDate ? cheque.dueDate.split("T")[0] : "",
      receiveDate: cheque.receiveDate ? cheque.receiveDate.split("T")[0] : "",
    });
    setErrorMessage("");
    setSuccessMessage("");
    setIsModalOpen(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await api.put(`/cheque/${selectedCheque._id}`, updateForm);
      setSuccessMessage(res.data.message || "تم التحديث بنجاح");

      // تحديث البيانات في الجدول والتنبيهات
      fetchCheques();
      fetchNotifications();

      setTimeout(() => {
        setIsModalOpen(false);
      }, 1200);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || "حدث خطأ أثناء تحديث الشيك"
      );
    } finally {
      setUpdateLoading(false);
    }
  };

  const Info = ({ title, value }) => (
    <div className="border rounded-lg p-3 bg-gray-50">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="font-semibold">{value || "-"}</div>
    </div>
  );

  // === Dictionaries & Helpers ===
  const statusBadges = {
    under_collection: { label: "تحت التحصيل", bg: "bg-amber-100 text-amber-800 border-amber-300" },
    due_today: { label: "مستحق اليوم", bg: "bg-blue-100 text-blue-800 border-blue-300" },
    collected: { label: "تم التحصيل", bg: "bg-emerald-100 text-emerald-800 border-emerald-300" },
    returned: { label: "مرتجع", bg: "bg-rose-100 text-rose-800 border-rose-300" },
    cancelled: { label: "ملغى", bg: "bg-gray-100 text-gray-700 border-gray-300" },
  };

  const locationBadges = {
    with_me: "في الخزينة (معي)",
    bank: "في البنك",
    collector: "مع المحصل",
    delivered: "تم تسليمه",
    archived: "مؤرشف",
  };

  // حذف عملية ماليّة
  const deletePaymentHistory = async (cheque, paymentId, supplierId) => {
    const isCollected = cheque.status === "collected";

    // 1. تأكيد الحذف الأساسي
    const confirmDelete = await showAlertConfirm({
      title: "حذف الشيك",
      text: isCollected
        ? "هل أنت متأكد من حذف هذا الشيك؟"
        : "هذا الشيك ليس محصّلاً بعد. سيتم إلغاؤه أولاً ثم حذفه. هل تريد المتابعة؟",
      icon: "warning",
      confirmButtonText: "نعم",
      cancelButtonText: "إلغاء",
    });

    if (!confirmDelete.isConfirmed) return;

    try {
      await api.delete(
        `/customers/deletePaymentHistory/${paymentId}/${supplierId}`
      );

      showAlert({ title: "تم حذف الشيك بنجاح", icon: "success" });

      fetchCheques();
      fetchNotifications();
    } catch (err) {
      showAlert({
        title: err.response?.data?.message || "حدث خطأ أثناء الحذف",
        icon: "error",
      });
    }
  };

  return (
    <div id="invoice" className="p-4 md:p-6 bg-ligth min-h-screen text-dark " dir="rtl">
      <style>{`
                @media print {
                    @page { margin: 1cm; size: A4; }
                    body { background: white !important; color: black !important; }
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    .printable-area { width: 100% !important; border: none !important; }
                    table { width: 100% !important; border-collapse: collapse !important; margin-top: 20px; }
                    th, td { border: 1px solid #000 !important; padding: 8px !important; color: #000 !important; font-size: 12px !important; }
                    th { background-color: #f2f2f2 !important; -webkit-print-color-adjust: exact; }
                }
                .print-only { display: none; }
            `}</style>
      {/* 1. Header & Quick Summary (Notifications Bar) */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-dark">إدارة الشيكات</h1>
            <p className="text-sm text-brown mt-1">
              متابعة، تحصيل، وتحديث حالات الشيكات
            </p>
          </div>

          <div className="flex gap-2 no-print">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg"
            >
              <FiPrinter />
              طباعة
            </button>
            <button
              onClick={() => { fetchCheques(); fetchNotifications(); }}
              className="flex no-print items-center gap-2 bg-dark text-ligth px-4 py-2 rounded-lg hover:opacity-90 transition shadow"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
              تحديث البيانات
            </button>
          </div>
        </div>

        {/* Notification Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4">
          {/* مستحقة اليوم */}
          <div className="bg-white p-4 rounded-lg border-2 border-dark -500 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">مستحقة اليوم</p>
              <h3 className="text-2xl font-bold text-dark mt-1">
                {notifications.summary.dueToday}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  openDetailsModal("الشيكات المستحقة اليوم", notifications.notifications.dueToday)
                }
                title="عرض التفاصيل"
                className="p-1.5 text-gray-400 hover:text-dark hover:bg-gray-100 rounded-full transition"
              >
                <Eye size={18} />
              </button>
              <div className="p-3 bg-amber-50 rounded-full text-amber-600">
                <FiClock size={24} />
              </div>
            </div>
          </div>

          {/* متأخرة عن الموعد */}
          <div className="bg-white p-4 rounded-lg border-2 border-rose-500 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">متأخرة عن الموعد</p>
              <h3 className="text-2xl font-bold text-rose-600 mt-1">
                {notifications.summary.late}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  openDetailsModal("الشيكات المتأخرة", notifications.notifications.lateCheques)
                }
                title="عرض التفاصيل"
                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-gray-100 rounded-full transition"
              >
                <Eye size={18} />
              </button>
              <div className="p-3 bg-rose-50 rounded-full text-rose-600">
                <FiAlertCircle size={24} />
              </div>
            </div>
          </div>

          {/* قادمة خلال 3 أيام */}
          <div className="bg-white p-4 rounded-lg border-2 border-accent flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">قادمة (خلال 3 أيام)</p>
              <h3 className="text-2xl font-bold text-dark mt-1">
                {notifications.summary.upcoming}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  openDetailsModal("الشيكات القادمة (خلال 3 أيام)", notifications.notifications.upcoming)
                }
                title="عرض التفاصيل"
                className="p-1.5 text-gray-400 hover:text-accent hover:bg-gray-100 rounded-full transition"
              >
                <Eye size={18} />
              </button>
              <div className="p-3 bg-blue-50 rounded-full text-accent">
                <FiCheckCircle size={24} />
              </div>
            </div>
          </div>

          {/* اجمالي الشيكات القائمة فقط */}
          <div className="bg-white p-4 rounded-lg border-2 border-green-500 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium"> اجمالي الشيكات</p>
              <h3 className="text-2xl font-bold text-dark mt-1">
                {totalAmounts}ج.م
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchPendingDetails}
                disabled={pendingDetailsLoading}
                title="عرض التفاصيل"
                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-gray-100 rounded-full transition disabled:opacity-40"
              >
                {pendingDetailsLoading ? (
                  <FiRefreshCw className="animate-spin" size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
              <div className="p-3 bg-green-50 rounded-full text-green-600">
                <FaMoneyBill size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filter Section */}
      <div className="no-print bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-100">
        <div className="flex items-center gap-2 mb-4 text-brown font-semibold border-b pb-2">
          <FiFilter />
          <span>خيارات البحث والفلترة</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* رقم الشيك */}
          <div className="relative">
            <input
              type="text"
              name="chequeNumber"
              placeholder="رقم الشيك..."
              value={filters.chequeNumber}
              onChange={handleFilterChange}
              className="w-full pr-9 pl-3 py-2 text-sm bg-ligth border border-gray-200 rounded-lg focus:outline-none focus:border-accent"
            />
            <FiSearch className="absolute right-3 top-2.5 text-gray-400" />
          </div>

          {/* البنك */}
          <input
            type="text"
            name="bankName"
            placeholder="اسم البنك..."
            value={filters.bankName}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 text-sm bg-ligth border border-gray-200 rounded-lg focus:outline-none focus:border-accent"
          />

          {/* الحالة */}
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 text-sm bg-ligth border border-gray-200 rounded-lg focus:outline-none focus:border-accent text-dark"
          >
            <option value="">جميع الحالات</option>
            <option value="under_collection">تحت التحصيل</option>
            <option value="due_today">مستحق اليوم</option>
            <option value="collected">تم التحصيل</option>
            <option value="returned">مرتجع</option>
            <option value="cancelled">ملغى</option>
          </select>

          {/* مكان الشيك */}
          <select
            name="location"
            value={filters.location}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 text-sm bg-ligth border border-gray-200 rounded-lg focus:outline-none focus:border-accent text-dark"
          >
            <option value="">جميع الأماكن</option>
            <option value="with_me">في الخزينة (معي)</option>
            <option value="bank">في البنك</option>
            <option value="collector">مع المحصل</option>
            <option value="delivered">تم تسليمه</option>
            <option value="archived">مؤرشف</option>
          </select>

          {/* نوع الشيك */}
          <select
            name="chequeType"
            value={filters.chequeType}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 text-sm bg-ligth border border-gray-200 rounded-lg focus:outline-none focus:border-accent text-dark"
          >
            <option value="">جميع الأنواع</option>
            <option value="normal">عادي (Normal)</option>
            <option value="clearing">مقاصة (Clearing)</option>
          </select>

          {/* تاريخ الاستحقاق من */}
          <div>
            <label className="text-[10px] text-gray-400 block mb-1">استحقاق من:</label>
            <input
              type="date"
              name="dueFrom"
              value={filters.dueFrom}
              onChange={handleFilterChange}
              className="w-full px-3 py-1.5 text-xs bg-ligth border border-gray-200 rounded-lg focus:outline-none focus:border-accent"
            />
          </div>

          {/* تاريخ الاستحقاق إلى */}
          <div>
            <label className="text-[10px] text-gray-400 block mb-1">استحقاق إلى:</label>
            <input
              type="date"
              name="dueTo"
              value={filters.dueTo}
              onChange={handleFilterChange}
              className="w-full px-3 py-1.5 text-xs bg-ligth border border-gray-200 rounded-lg focus:outline-none focus:border-accent"
            />
          </div>

          {/* إعادة ضبط */}
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="w-full py-2 text-xs text-brown bg-gray-100 hover:bg-gray-200 rounded-lg transition font-medium"
            >
              إلغاء الفلاتر
            </button>
          </div>
        </div>
      </div>

      {/* 3. Cheques Table */}
      <div className="print bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-dark text-ligth text-xs font-medium">
                <th className="p-3">رقم الشيك</th>
                <th className="p-3">العميل</th>
                <th className="p-3">البنك / النوع</th>
                <th className="p-3">المبلغ</th>
                <th className="p-3">تاريخ الاستلام</th>
                <th className="p-3">تاريخ الاستحقاق</th>
                <th className="p-3">المكان الحالي</th>
                <th className="p-3">الحالة</th>
                <th className="p-3 no-print text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-gray-400">
                    جاري تحميل البيانات...
                  </td>
                </tr>
              ) : cheques.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-gray-400">
                    لا توجد شيكات مطابقة للبحث.
                  </td>
                </tr>
              ) : (
                cheques.map((item) => (
                  <tr key={item._id} className="hover:bg-ligth/50 transition">
                    <td className="p-3 font-semibold text-dark">
                      {item.chequeNumber}
                    </td>
                    <td className="p-3 text-brown">
                      {item.customer?.name || item.supplier?.name || "غير محدد"}
                    </td>
                    <td className="p-3">
                      <div className="text-xs font-medium">{item.bankName}</div>
                      <div className="text-[10px] text-gray-400">
                        {item.chequeType === "clearing" ? "مقاصة" : "عادي"}
                      </div>
                    </td>
                    <td className="p-3 font-bold text-accent">
                      {item.amount?.toLocaleString()} ج.م
                    </td>
                    <td className="p-3 text-xs text-gray-500">
                      {new Date(item.receiveDate).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="p-3 text-xs text-gray-500">
                      {new Date(item.dueDate).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="p-3 text-xs">
                      {locationBadges[item.location] || item.location}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2.5 py-1 text-[11px] font-semibold rounded-full border ${
                          statusBadges[item.status]?.bg ||
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {statusBadges[item.status]?.label || item.status}
                      </span>
                    </td>
                    <td className="p-3 no-print text-center">
                      <button
                        onClick={() => handleOpenUpdateModal(item)}
                        title="تحديث الشيك"
                        className="p-1.5 text-dark hover:bg-gray-100 rounded-lg transition"
                      >
                        <FiEdit size={16} />
                      </button>

                      <button
                        onClick={() => handleOpenModal(item)}
                        title=" الشيك"
                        className="p-1.5 text-dark hover:bg-gray-100 rounded-lg transition"
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        className="p-1.5 text-dark hover:bg-gray-100 rounded-lg transition"
                      >
                        <Trash2
                          size={16}
                          className="text-red-700 cursor-pointer hover:text-red-500"
                          onClick={() => {
                            deletePaymentHistory(item, item?._id, item?.customer?._id);
                          }}
                          title={"حذف"}
                        />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className=" no-print p-4 bg-white border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-gray-500">
            إجمالي الشيكات: {pagination.totalCheques} | الصفحة{" "}
            {pagination.currentPage} من {pagination.totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={pagination.currentPage === 1}
              onClick={() =>
                setPagination((p) => ({ ...p, currentPage: p.currentPage - 1 }))
              }
              className="p-2 border rounded-md disabled:opacity-40 hover:bg-ligth transition"
            >
              <FiChevronRight />
            </button>
            <span className="px-3 font-bold text-dark">
              {pagination.currentPage}
            </span>
            <button
              disabled={pagination.currentPage >= pagination.totalPages}
              onClick={() =>
                setPagination((p) => ({ ...p, currentPage: p.currentPage + 1 }))
              }
              className="p-2 border rounded-md disabled:opacity-40 hover:bg-ligth transition"
            >
              <FiChevronLeft />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Update Modal */}
      {isModalOpen && selectedCheque && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden border border-gray-100">
            {/* Modal Header */}
            <div className="bg-dark text-ligth px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">
                تحديث الشيك رقم: {selectedCheque.chequeNumber}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-300 hover:text-white transition"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUpdateSubmit} className="p-5 space-y-4">
              {errorMessage && (
                <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="p-3 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
                  {successMessage}
                </div>
              )}

              {/* تفاصيل ثابتة */}
              <div className="bg-ligth p-3 rounded-lg text-xs space-y-1">
                <p>
                  <span className="font-semibold text-brown">العميل:</span>{" "}
                  {selectedCheque.customer?.name}
                </p>
                <p>
                  <span className="font-semibold text-brown">المبلغ:</span>{" "}
                  {selectedCheque.amount?.toLocaleString()} ج.م
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* الحالة الجديدة */}
                <div>
                  <label className="block text-xs font-medium text-dark mb-1">
                    الحالة الجديدة
                  </label>
                  <select
                    value={updateForm.status}
                    onChange={(e) =>
                      setUpdateForm({ ...updateForm, status: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-accent"
                  >
                    {selectedCheque?.moneyFlow === "outgoing" ? (
                      /* خيارات الشيكات الصادرة (المرسلة / مدفوعات) */
                      <>
                        <option value="under_collection">تحت الصرف / الدفع</option>
                        <option value="due_today">مستحق اليوم</option>
                        <option value="collected">تم الصرف / السداد (خصم من الخزنة/البنك)</option>
                        <option value="returned">مرتجع (تعديل رصيد التاجر)</option>
                        <option value="cancelled">ملغى (تعديل رصيد التاجر)</option>
                      </>
                    ) : (
                      /* خيارات الشيكات الواردة (المستلمة / مقبوضات) */
                      <>
                        <option value="under_collection">تحت التحصيل</option>
                        <option value="due_today">مستحق اليوم</option>
                        <option value="collected">تم التحصيل (إيداع بالخزنة/البنك)</option>
                        <option value="returned">مرتجع (تعديل رصيد العميل)</option>
                        <option value="cancelled">ملغى (تعديل رصيد العميل)</option>
                      </>
                    )}
                  </select>
                </div>

                {/* المكان */}
                <div>
                  <label className="block text-xs font-medium text-dark mb-1">
                    مكان الشيك
                  </label>
                  <select
                    value={updateForm.location}
                    onChange={(e) =>
                      setUpdateForm({ ...updateForm, location: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-accent"
                  >
                    <option value="with_me">في الخزينة (معي)</option>
                    <option value="bank">في البنك</option>
                    <option value="collector">مع المحصل</option>
                    <option value="delivered">تم تسليمه</option>
                    <option value="archived">مؤرشف</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* اسم البنك */}
                <div>
                  <label className="block text-xs font-medium text-dark mb-1">
                    البنك
                  </label>
                  <input
                    type="text"
                    value={updateForm.bankName}
                    onChange={(e) =>
                      setUpdateForm({ ...updateForm, bankName: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-accent"
                  />
                </div>

                {/* نوع الشيك */}
                <div>
                  <label className="block text-xs font-medium text-dark mb-1">
                    النوع
                  </label>
                  <select
                    value={updateForm.chequeType}
                    onChange={(e) =>
                      setUpdateForm({ ...updateForm, chequeType: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-accent"
                  >
                    <option value="normal">عادي</option>
                    <option value="clearing">مقاصة</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* تاريخ الاستلام */}
                <div>
                  <label className="block text-xs font-medium text-dark mb-1">
                    تاريخ الاستلام
                  </label>
                  <input
                    type="date"
                    value={updateForm.receiveDate}
                    onChange={(e) =>
                      setUpdateForm({ ...updateForm, receiveDate: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-accent"
                  />
                </div>

                {/* تاريخ الاستحقاق */}
                <div>
                  <label className="block text-xs font-medium text-dark mb-1">
                    تاريخ الاستحقاق
                  </label>
                  <input
                    type="date"
                    value={updateForm.dueDate}
                    onChange={(e) =>
                      setUpdateForm({ ...updateForm, dueDate: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* الملاحظات */}
              <div>
                <label className="block text-xs font-medium text-dark mb-1">
                  ملاحظات
                </label>
                <textarea
                  rows="3"
                  value={updateForm.notes}
                  onChange={(e) =>
                    setUpdateForm({ ...updateForm, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-accent resize-none"
                  placeholder="أي ملاحظات إضافية..."
                ></textarea>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="px-4 py-2 text-xs text-ligth bg-dark hover:opacity-90 rounded-lg transition disabled:opacity-50 font-semibold"
                >
                  {updateLoading ? "جاري الحفظ..." : "حفظ التغيرات"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. مودال تفاصيل الشيك (زر العين في الجدول) */}
      {isViewModalOpen && viewCheque && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
            {/* Header */}
            <div className="bg-dark text-white p-4 flex justify-between items-center">
              <h2 className="font-bold text-lg">تفاصيل الشيك</h2>

              <button onClick={() => setIsViewModalOpen(false)}>
                <FiX size={22} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <Info title="رقم الشيك" value={viewCheque.chequeNumber} />

                <Info title="العميل" value={viewCheque.customer?.name} />

                <Info title="البنك" value={viewCheque.bankName} />

                <Info
                  title="النوع"
                  value={viewCheque.chequeType === "clearing" ? "مقاصة" : "عادي"}
                />

                <Info
                  title="المبلغ"
                  value={`${viewCheque.amount?.toLocaleString()} ج.م`}
                />

                <Info
                  title="الحالة"
                  value={statusBadges[viewCheque.status]?.label}
                />

                <Info
                  title="المكان الحالي"
                  value={locationBadges[viewCheque.location]}
                />

                <Info
                  title="تاريخ الاستلام"
                  value={new Date(viewCheque.receiveDate).toLocaleDateString("ar-EG")}
                />

                <Info
                  title="تاريخ الاستحقاق"
                  value={new Date(viewCheque.dueDate).toLocaleDateString("ar-EG")}
                />

                <Info
                  title="تاريخ الإنشاء"
                  value={new Date(viewCheque.createdAt).toLocaleString("ar-EG")}
                />
              </div>

              <div className="mt-5">
                <h3 className="font-bold mb-2">الملاحظات</h3>

                <div className="bg-gray-100 rounded-lg p-3 min-h-[70px]">
                  {viewCheque.notes || "لا توجد ملاحظات"}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t p-4 flex justify-end">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="bg-dark text-white px-5 py-2 rounded-lg"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. مودال تفاصيل الكروت (مستحقة اليوم / متأخرة / قادمة / إجمالي القائم) */}
      {detailsModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-dark text-white px-5 py-4 flex justify-between items-center shrink-0">
              <h2 className="font-bold text-base">
                {detailsModal.title} ({detailsModal.list.length})
              </h2>
              <button onClick={closeDetailsModal}>
                <FiX size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 overflow-y-auto flex-1">
              {detailsModal.list.length === 0 ? (
                <div className="text-center text-gray-400 py-10 text-sm">
                  لا توجد شيكات لعرضها.
                </div>
              ) : (
                <table className="w-full text-right text-xs border-collapse">
                  <thead>
                    <tr className="bg-ligth text-brown">
                      <th className="p-2">رقم الشيك</th>
                      <th className="p-2">العميل / المورد</th>
                      <th className="p-2">البنك</th>
                      <th className="p-2">المبلغ</th>
                      <th className="p-2">تاريخ الاستحقاق</th>
                      <th className="p-2">الحالة</th>
                      <th className="p-2">المكان</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {detailsModal.list.map((item) => (
                      <tr key={item._id}>
                        <td className="p-2 font-semibold">{item.chequeNumber}</td>
                        <td className="p-2 text-brown">
                          {item.customer?.name || item.supplier?.name || "غير محدد"}
                        </td>
                        <td className="p-2">{item.bankName}</td>
                        <td className="p-2 font-bold text-accent">
                          {item.amount?.toLocaleString()} ج.م
                        </td>
                        <td className="p-2 text-gray-500">
                          {new Date(item.dueDate).toLocaleDateString("ar-EG")}
                        </td>
                        <td className="p-2">
                          <span
                            className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                              statusBadges[item.status]?.bg || "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {statusBadges[item.status]?.label || item.status}
                          </span>
                        </td>
                        <td className="p-2">
                          {locationBadges[item.location] || item.location}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="border-t p-4 flex justify-between items-center shrink-0 bg-gray-50">
              <span className="text-xs text-gray-500">
                الإجمالي:{" "}
                <span className="font-bold text-dark">
                  {detailsModal.list
                    .reduce((acc, c) => acc + (c.amount || 0), 0)
                    .toLocaleString()}{" "}
                  ج.م
                </span>
              </span>
              <button
                onClick={closeDetailsModal}
                className="bg-dark text-white px-5 py-2 rounded-lg text-sm"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChequeManagement;
