import React, { useState, useEffect } from "react";
import {
  Wallet, Building2, Mail, Calendar,
  ArrowUpRight, ArrowDownRight, Banknote,
  Shield, Lock, Unlock,
  Eye, EyeOff, Filter, Plus,
  RefreshCw, AlertCircle,
  Trash2,
  BanknoteIcon,
  Building,
  Edit,
  Hash,
  Clock,
  FileText
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { showAlert } from "../../services/alert";
import { showAlertConfirm } from "../../services/alertConfirm";
import axios from "axios";

const MoneyDashboard = () => {
  const navigate = useNavigate();

  // ===== States =====
  const [loading, setLoading] = useState(true);
  const [financialLocked, setFinancialLocked] = useState(true);
  const [financialPin, setFinancialPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState("");
  const [isPinLoading, setIsPinLoading] = useState(false);

  // Wallet Search States
  const [walletSearch, setWalletSearch] = useState("");
  const [showWalletList, setShowWalletList] = useState(false);
  const [suggestionWallets, setSuggestionWallets] = useState([]);

  // Dashboard Data
  // ملاحظة: تأكد إن الباك إند بيرجع نفس المفتاح "cheques" لكل بيانات الشيكات
  // (سواء ملخص الحالات أو استلام/إرسال) بدل التذبذب بين cheque و cheques.
  const [stats, setStats] = useState({
    incoming: 0,
    outgoing: 0,
    currentBalance: 0,
    wallets: { balance: 0, incoming: 0, outgoing: 0 },
    banks: { balance: 0, incoming: 0, outgoing: 0 },
    instapay: { balance: 0, incoming: 0, outgoing: 0 },
    mail: { balance: 0, incoming: 0, outgoing: 0 },
    cash: { balance: 0, incoming: 0, outgoing: 0 },
    cheques: {
      incoming: 0,
      outgoing: 0,
      underCollection: 0,
      collected: 0,
      returned: 0,
      dueToday: 0,
      cancelled: 0
    }
  });

  // Payments List
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false
  });
  const [filters, setFilters] = useState({
    paymentMethod: "",
    moneyFlow: "",
    module: "",
    startDate: "",
    endDate: "",
    search: ""
  });
  const [showFilters, setShowFilters] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [modules, setModules] = useState([]);
  const [moneyFlows, setMoneyFlows] = useState([]);

  // Transfer Modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({
    type: "import",
    amount: "",
    paymentMethod: "cash",
    transactionDate: new Date().toISOString().split("T")[0],
    notes: "",
    walletInfo: {
      provider: "",
      senderName: "",
      senderPhone: "",
      receiverName: "",
      receiverPhone: "",
      transactionReference: "",
      walletId: "",
      linkWallet: false
    },
    bankInfo: {
      bankName: "",
      transactionReference: "",
      accountNumber: "",
      accountHolder: ""
    },
    cheque: {
      chequeNumber: "",
      chequeType: "normal",
      bankName: "",
      receiveDate: "",
      dueDate: "",
      status: "under_collection"
    }
  });
  const [transferLoading, setTransferLoading] = useState(false);

  // ===== Module Labels =====
  const moduleLabels = {
    delivery: "نقلة",
    pay: "دفع عميل",
    debt: "إضافة مديونية",
    equipment_supply: "مستلزمات معدات",
    maintenance: "صيانة",
    equipment: "معدات",
    wire: "سلك",
    bag: "شكاير",
    export: "تصدير",
    import: "استيراد",
    collection: "تحصيل",
    purchase: "شراء",
    other: "أخرى"
  };

  // ===== Payment Method Labels =====
  const paymentMethodLabels = {
    cash: "نقدي",
    wallet: "محفظة إلكترونية",
    bank: "تحويل بنكي",
    instapay: "إنستا باي",
    mail: "بريد",
    cheque: "شيك",
    work: "شغل"
  };

  // ===== Money Flow Labels =====
  const moneyFlowLabels = {
    incoming: "استلام",
    outgoing: "ارسال"
  };

  const [editData, setEditData] = useState({
    id: "",
    module: "pay",
    moneyFlow: "outgoing",
    paymentMethod: "cash",
    amount: "",
    note: "",
    date: "",
    customer: {},
    bankInfo: { bankName: "", transactionReference: "" },
    walletInfo: {
      provider: "",
      senderName: "",
      senderPhone: "",
      receiverName: "",
      receiverPhone: "",
      transactionReference: "",
      linkWallet: false,
      walletId: ""
    },
    cheque: {
      chequeNumber: "",
      chequeType: "normal",
      bankName: "",
      receiveDate: "",
      dueDate: "",
      status: "under_collection"
    }
  });

  const [loading2, setLoading2] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showData, setShowData] = useState(false);

  // ===== Fetch Wallet Suggestions =====
  const fetchSuggestions = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/wallet/getSugg`, {
        headers: {
          "x-api-key": import.meta.env.VITE_API_X_API_KEY,
          "Content-Type": "application/json",
        },
      });

      if (res.data && res.data.wallets) {
        setSuggestionWallets(res.data.wallets);
      } else {
        setSuggestionWallets([]);
      }
    } catch (err) {
      console.error("❌ Error fetching wallet suggestions:", err);
      setSuggestionWallets([]);
    }
  };

  // ===== Check Financial Lock Status =====
  useEffect(() => {
    const token = localStorage.getItem("financialToken");
    if (token) {
      setFinancialLocked(false);
      fetchDashboardData();
      fetchPayments();
      fetchFilters();
      fetchSuggestions();
    } else {
      setLoading(false);
    }
  }, []);

  // ===== Fetch Dashboard Stats =====
  const fetchDashboardData = async () => {
    try {
      const res = await api.get("/payment/dashboardStats");
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      showAlert({ title: "حدث خطاء ما", icon: "error" });
      setFinancialLocked(true);
    }
  };

  // ===== Fetch Payments =====
  const fetchPayments = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        ...filters
      };
      Object.keys(params).forEach((key) => {
        if (!params[key]) delete params[key];
      });

      const res = await api.get("/payment/getPayments", { params });
      if (res.data.success) {
        setPayments(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error("Error fetching payments:", err);
      showAlert({ title: "خطأ في جلب البيانات", icon: "error" });
      setFinancialLocked(true);
    } finally {
      setLoading(false);
    }
  };

  // ===== Fetch Filters =====
  const fetchFilters = async () => {
    try {
      const res = await api.get("/payment/PaymentFilters");
      if (res.data.success) {
        setPaymentMethods(res.data.data.paymentMethods);
        setModules(res.data.data.modules);
        setMoneyFlows(res.data.data.moneyFlows);
      }
    } catch (err) {
      console.error("Error fetching filters:", err);
      setFinancialLocked(true);
    }
  };

  // ===== Financial Login =====
  const handleFinancialLogin = async (e) => {
    e.preventDefault();
    if (!financialPin) {
      setPinError("الرجاء إدخال الرقم السري");
      return;
    }

    setIsPinLoading(true);
    setPinError("");

    try {
      const res = await api.post("/payment/financialLogin", { financialPin });
      if (res.data.token) {
        localStorage.setItem("financialToken", res.data.token);
        setFinancialLocked(false);
        showAlert({ title: "تم فتح لوحة إدارة الأموال", icon: "success" });
        fetchDashboardData();
        fetchPayments();
        fetchFilters();
        fetchSuggestions();
      }
    } catch (err) {
      setPinError(err.response?.data?.message || "الرقم السري غير صحيح");
      showAlert({ title: "الرقم السري غير صحيح", icon: "error" });
    } finally {
      setIsPinLoading(false);
    }
  };

  // ===== Handle Transfer =====
  const handleTransfer = async () => {
    if (!transferData.amount || transferData.amount <= 0) {
      showAlert({ title: "الرجاء إدخال مبلغ صحيح", icon: "warning" });
      return;
    }

    if (transferData.paymentMethod === "wallet") {
      if (transferData.type === "import" && !transferData.walletInfo.senderPhone) {
        showAlert({ title: "الرجاء إدخال رقم المرسل للمحفظة", icon: "warning" });
        return;
      }
      if (transferData.type === "export" && !transferData.walletInfo.receiverPhone) {
        showAlert({ title: "الرجاء إدخال رقم المستلم للمحفظة", icon: "warning" });
        return;
      }
    }

    if ((transferData.paymentMethod === "bank" || transferData.paymentMethod === "instapay") && !transferData.bankInfo.bankName) {
      showAlert({ title: "الرجاء إدخال اسم البنك", icon: "warning" });
      return;
    }

    if (transferData.paymentMethod === "cheque" && !transferData.cheque.chequeNumber) {
      showAlert({ title: "الرجاء إدخال رقم الشيك", icon: "warning" });
      return;
    }

    setTransferLoading(true);
    try {
      const payload = {
        ...transferData,
        amount: Number(transferData.amount)
      };

      if (transferData.paymentMethod === "wallet" && transferData.walletInfo.linkWallet) {
        if (!transferData.walletInfo.walletId) {
          showAlert({ title: "الرجاء اختيار محفظة من القائمة", icon: "warning" });
          setTransferLoading(false);
          return;
        }
      }

      await api.post("/payment/financial/transfer", payload);
      showAlert({
        title: transferData.type === "import" ? "تم إضافة الإيراد بنجاح" : "تم تسجيل خروج الأموال بنجاح",
        icon: "success"
      });
      setShowTransferModal(false);
      resetTransferData();
      fetchDashboardData();
      fetchPayments(pagination.page);
    } catch (err) {
      showAlert({ title: err.response?.data?.message || "حدث خطأ", icon: "error" });
    } finally {
      setTransferLoading(false);
    }
  };

  // ===== Reset Transfer Data =====
  const resetTransferData = () => {
    setTransferData({
      type: "import",
      amount: "",
      paymentMethod: "cash",
      transactionDate: new Date().toISOString().split("T")[0],
      notes: "",
      walletInfo: {
        provider: "",
        senderName: "",
        senderPhone: "",
        receiverName: "",
        receiverPhone: "",
        transactionReference: "",
        walletId: "",
        linkWallet: false
      },
      bankInfo: {
        bankName: "",
        transactionReference: "",
        accountNumber: "",
        accountHolder: ""
      },
      cheque: {
        chequeNumber: "",
        chequeType: "normal",
        bankName: "",
        receiveDate: "",
        dueDate: "",
        status: "under_collection"
      }
    });
    setWalletSearch("");
    setShowWalletList(false);
  };

  // ===== Handle Logout =====
  const handleFinancialLogout = async () => {
    const confirm = await showAlertConfirm({
      title: "إغلاق لوحة الأموال",
      text: "سيتم إغلاق لوحة إدارة الأموال وسيطلب الرقم السري مرة أخرى عند فتحها",
      icon: "warning",
      confirmButtonText: "تأكيد",
      cancelButtonText: "إلغاء"
    });
    if (confirm.isConfirmed) {
      localStorage.removeItem("financialToken");
      setFinancialLocked(true);
      showAlert({ title: "تم إغلاق لوحة إدارة الأموال", icon: "success" });
    }
  };

  // ===== Format Currency =====
  const formatCurrency = (value) => {
    return Number(value || 0).toLocaleString() + " ج.م";
  };

  // ===== Get Translated Module Name =====
  const getModuleLabel = (moduleKey) => {
    return moduleLabels[moduleKey] || moduleKey || "غير معروف";
  };

  // ===== Payment Method Badge =====
  const getPaymentMethodBadge = (method) => {
    const badges = {
      cash: { label: "نقدي", bg: "bg-emerald-100 text-emerald-800" },
      wallet: { label: "محفظة", bg: "bg-amber-100 text-amber-800" },
      bank: { label: "بنك", bg: "bg-blue-100 text-blue-800" },
      instapay: { label: "إنستا باي", bg: "bg-purple-100 text-purple-800" },
      mail: { label: "بريد", bg: "bg-cyan-100 text-cyan-800" },
      cheque: { label: "شيك", bg: "bg-rose-100 text-rose-800" },
      work: { label: "شغل", bg: "bg-orange-100 text-orange-800" }
    };
    return badges[method] || { label: method, bg: "bg-gray-100 text-gray-800" };
  };

  // ===== Money Flow Badge =====
  const getMoneyFlowBadge = (flow) => {
    if (flow === "incoming") {
      return { label: "استلام", bg: "bg-emerald-100 text-emerald-800" };
    }
    return { label: "ارسال", bg: "bg-red-100 text-red-800" };
  };

  const formatDateForInput = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16);
  };

  // ===== Build edit-form data from a payment record (shared by edit & view modals) =====
  const buildEditDataFromPayment = (payment) => {
    let chequeData = {
      chequeNumber: "", chequeType: "normal", bankName: "",
      receiveDate: "", dueDate: "", status: "under_collection"
    };

    if (payment.cheque && typeof payment.cheque === "object") {
      chequeData = {
        chequeNumber: payment.cheque.chequeNumber || "",
        chequeType: payment.cheque.chequeType || "normal",
        bankName: payment.cheque.bankName || "",
        receiveDate: payment.cheque.receiveDate ? formatDateForInput(payment.cheque.receiveDate) : "",
        dueDate: payment.cheque.dueDate ? formatDateForInput(payment.cheque.dueDate) : "",
        status: payment.cheque.status || "under_collection"
      };
    }

    return {
      id: payment._id,
      module: payment.module || "pay",
      moneyFlow: payment.moneyFlow || "outgoing",
      paymentMethod: payment.paymentMethod || "cash",
      amount: payment.amount,
      note: payment.note || "",
      date: formatDateForInput(payment.transactionDate),
      bankInfo: payment.bankInfo || { bankName: "", transactionReference: "" },
      walletInfo: payment.walletInfo || {
        provider: "", senderName: "", senderPhone: "",
        receiverName: "", receiverPhone: "", transactionReference: "",
        linkWallet: false, walletId: ""
      },
      cheque: chequeData,
      customer: payment.customer || payment.supplier
    };
  };

  const editPaymentHistory = (payment) => {
    setEditData(buildEditDataFromPayment(payment));
    setShowEditModal(true);
  };

  const showPaymentHistory = (payment) => {
    setEditData(buildEditDataFromPayment(payment));
    setShowData(true);
  };

  // ===== Update payment =====
  const updatePaymentHistory = async (editData) => {
    try {
      setLoading2(true);
      const payload = {
        amount: Number(editData.amount),
        paymentMethod: editData.paymentMethod,
        type: editData.module,
        note: editData.note,
        date: editData.date,
      };

      if (editData.paymentMethod === "bank" || editData.paymentMethod === "instapay") {
        payload.bankInfo = editData.bankInfo;
      }
      if (editData.paymentMethod === "wallet") {
        payload.walletInfo = editData.walletInfo;
      }
      if (editData.paymentMethod === "cheque") {
        payload.cheque = { ...editData.cheque, amount: Number(editData.amount) };
      }

      await api.patch(
        `/customers/editPaymentHistory/${editData?.id}/${editData.customer?._id}`,
        payload
      );

      showAlert({ title: "تم التعديل بنجاح", icon: "success" });
      setShowEditModal(false);
      fetchDashboardData();
      fetchPayments();
      fetchFilters();
    } catch (err) {
      showAlert({
        title: err.response?.data?.message || "حدث خطأ أثناء التعديل",
        icon: "error"
      });
    } finally {
      setLoading2(false);
    }
  };

  // ===== Delete payment =====
  const deletePaymentHistory = async (paymentId, traderId) => {
    const confirm = await showAlertConfirm({
      title: "حذف العملية",
      text: "هل أنت متأكد من حذف هذه العملية الماليّة؟",
      icon: "warning",
      confirmButtonText: "نعم",
      cancelButtonText: "إلغاء"
    });

    if (!confirm.isConfirmed) return;

    try {
      await api.delete(`/customers/deletePaymentHistory/${paymentId}/${traderId}`);

      showAlert({
        title: "تم الحذف بنجاح",
        icon: "success"
      });

      fetchDashboardData();
      fetchPayments();
      fetchFilters();
    } catch (err) {
      showAlert({
        title: err.response?.data?.message || "حدث خطأ أثناء الحذف",
        icon: "error"
      });
    }
  };

  // ===== Render extra fields inside edit/view modal based on payment method =====
  const renderEditPaymentFields = () => {
    const method = editData.paymentMethod;

    if (method === "cheque") {
      return (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 mt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="text-right">
              <label className="text-[11px] font-black text-slate-500 block mb-1">
                <Hash size={12} className="inline ml-1" /> رقم الشيك
              </label>
              <input
                type="text"
                disabled={showData ? true : false}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:border-orange-500 outline-none"
                placeholder="رقم الشيك"
                value={editData.cheque?.chequeNumber || ""}
                onChange={(e) => setEditData({
                  ...editData,
                  cheque: { ...editData.cheque, chequeNumber: e.target.value }
                })}
              />
            </div>
            <div className="text-right">
              <label className="text-[11px] font-black text-slate-500 block mb-1">
                <Building size={12} className="inline ml-1" /> البنك المسحوب عليه
              </label>
              <input
                disabled={showData ? true : false}
                type="text"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:border-orange-500 outline-none"
                placeholder="اسم البنك"
                value={editData.cheque?.bankName || ""}
                onChange={(e) => setEditData({
                  ...editData,
                  cheque: { ...editData.cheque, bankName: e.target.value }
                })}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="text-right">
              <label className="text-[11px] font-black text-slate-500 block mb-1">
                <Calendar size={12} className="inline ml-1" /> تاريخ الاستلام
              </label>
              <input
                disabled={showData ? true : false}
                type="date"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:border-orange-500 outline-none"
                value={editData.cheque?.receiveDate || ""}
                onChange={(e) => setEditData({
                  ...editData,
                  cheque: { ...editData.cheque, receiveDate: e.target.value }
                })}
              />
            </div>
            <div className="text-right">
              <label className="text-[11px] font-black text-slate-500 block mb-1">
                <Clock size={12} className="inline ml-1" /> تاريخ الاستحقاق
              </label>
              <input
                disabled={showData ? true : false}
                type="date"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:border-orange-500 outline-none"
                value={editData.cheque?.dueDate || ""}
                onChange={(e) => setEditData({
                  ...editData,
                  cheque: { ...editData.cheque, dueDate: e.target.value }
                })}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="text-right">
              <label className="text-[11px] font-black text-slate-500 block mb-1">نوع الشيك</label>
              <select
                disabled={showData ? true : false}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:border-orange-500 outline-none"
                value={editData.cheque?.chequeType || "normal"}
                onChange={(e) => setEditData({
                  ...editData,
                  cheque: { ...editData.cheque, chequeType: e.target.value }
                })}
              >
                <option value="normal">عادي</option>
                <option value="clearing">مقاصة</option>
              </select>
            </div>
            <div className="text-right">
              <label className="text-[11px] font-black text-slate-500 block mb-1">حالة الشيك</label>
              <select
                disabled={showData ? true : false}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:border-orange-500 outline-none"
                value={editData.cheque?.status || "under_collection"}
                onChange={(e) => setEditData({
                  ...editData,
                  cheque: { ...editData.cheque, status: e.target.value }
                })}
              >
                <option value="under_collection">تحت التحصيل</option>
                <option value="due_today">مستحق اليوم</option>
                <option value="collected">تم التحصيل</option>
                <option value="returned">مرتجع</option>
                <option value="cancelled">ملغي</option>
              </select>
            </div>
          </div>
        </div>
      );
    }

    if (method === "bank" || method === "instapay") {
      return (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 mt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="text-right">
              <label className="text-[11px] font-black text-slate-500 block mb-1">
                <Building size={12} className="inline ml-1" /> اسم البنك / المنصة
              </label>
              <input
                disabled={showData ? true : false}
                type="text"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:border-orange-500 outline-none"
                placeholder={method === "instapay" ? "إنستا باي" : "اسم البنك"}
                value={editData.bankInfo?.bankName || ""}
                onChange={(e) => setEditData({
                  ...editData,
                  bankInfo: { ...editData.bankInfo, bankName: e.target.value }
                })}
              />
            </div>
            <div className="text-right">
              <label className="text-[11px] font-black text-slate-500 block mb-1">
                <FileText size={12} className="inline ml-1" /> رقم مرجع المعاملة
              </label>
              <input
                disabled={showData ? true : false}
                type="text"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:border-orange-500 outline-none"
                placeholder="رقم التحويل أو العملية"
                value={editData.bankInfo?.transactionReference || ""}
                onChange={(e) => setEditData({
                  ...editData,
                  bankInfo: { ...editData.bankInfo, transactionReference: e.target.value }
                })}
              />
            </div>
          </div>
        </div>
      );
    }

    if (method === "wallet") {
      return (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 mt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="text-right">
              <label className="text-[11px] font-black text-slate-500 block mb-1">رقم الراسل</label>
              <input
                disabled={showData ? true : false}
                type="text"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:border-orange-500 outline-none"
                placeholder="رقم هاتف الراسل"
                value={editData.walletInfo?.senderPhone || ""}
                onChange={(e) => setEditData({
                  ...editData,
                  walletInfo: { ...editData.walletInfo, senderPhone: e.target.value }
                })}
              />
            </div>
            <div className="text-right">
              <label className="text-[11px] font-black text-slate-500 block mb-1">اسم الراسل</label>
              <input
                disabled={showData ? true : false}
                type="text"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:border-orange-500 outline-none"
                placeholder="اسم الراسل"
                value={editData.walletInfo?.senderName || ""}
                onChange={(e) => setEditData({
                  ...editData,
                  walletInfo: { ...editData.walletInfo, senderName: e.target.value }
                })}
              />
            </div>
          </div>

          {!editData.walletInfo?.linkWallet && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="text-right">
                <label className="text-[11px] font-black text-slate-500 block mb-1">رقم المستلم</label>
                <input
                  disabled={showData ? true : false}
                  type="text"
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:border-orange-500 outline-none"
                  placeholder="رقم هاتف المستلم"
                  value={editData.walletInfo?.receiverPhone || ""}
                  onChange={(e) => setEditData({
                    ...editData,
                    walletInfo: { ...editData.walletInfo, receiverPhone: e.target.value }
                  })}
                />
              </div>
              <div className="text-right">
                <label className="text-[11px] font-black text-slate-500 block mb-1">اسم المستلم</label>
                <input
                  disabled={showData ? true : false}
                  type="text"
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:border-orange-500 outline-none"
                  placeholder="اسم المستلم"
                  value={editData.walletInfo?.receiverName || ""}
                  onChange={(e) => setEditData({
                    ...editData,
                    walletInfo: { ...editData.walletInfo, receiverName: e.target.value }
                  })}
                />
              </div>
            </div>
          )}

          {editData.walletInfo?.linkWallet && (
            <div className="relative text-right">
              <label className="text-[11px] font-black text-slate-500 block mb-1">المحفظة المستلمة</label>
              <input
                disabled={showData ? true : false}
                type="text"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:border-orange-500 outline-none"
                placeholder="ابحث بالاسم أو رقم المحفظة..."
                value={walletSearch}
                onFocus={() => setShowWalletList(true)}
                onChange={(e) => {
                  setWalletSearch(e.target.value);
                  setShowWalletList(true);
                }}
              />
              {showWalletList && walletSearch.length > 0 && (
                <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto bg-white rounded-xl border shadow-xl">
                  {suggestionWallets
                    .filter((w) =>
                      w.walletName?.toLowerCase().includes(walletSearch.toLowerCase()) ||
                      w.phoneNumber?.includes(walletSearch)
                    )
                    .map((wallet) => (
                      <div
                        key={wallet._id}
                        className="p-3 border-b hover:bg-slate-50 cursor-pointer transition"
                        onClick={() => {
                          setEditData({
                            ...editData,
                            walletInfo: {
                              ...editData.walletInfo,
                              walletId: wallet._id,
                              receiverName: wallet.walletName,
                              receiverPhone: wallet.phoneNumber,
                              provider: wallet.walletProvider
                            }
                          });
                          setWalletSearch(wallet.walletName);
                          setShowWalletList(false);
                        }}
                      >
                        <div className="font-black text-dark">{wallet.walletName}</div>
                        <div className="text-xs text-slate-500">{wallet.phoneNumber}</div>
                        <div className="text-xs text-green-600">{wallet.walletProvider}</div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {editData.walletInfo?.walletId && editData.walletInfo?.linkWallet && (
            <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded-lg border border-slate-200">
              <div className="text-right">
                <label className="text-[10px] font-black text-slate-400 block">اسم المستلم</label>
                <input
                  readOnly
                  value={editData.walletInfo.receiverName || ""}
                  className="w-full p-2 bg-slate-50 rounded-lg text-sm font-bold border border-slate-100"
                />
              </div>
              <div className="text-right">
                <label className="text-[10px] font-black text-slate-400 block">رقم المستلم</label>
                <input
                  readOnly
                  value={editData.walletInfo.receiverPhone || ""}
                  className="w-full p-2 bg-slate-50 rounded-lg text-sm font-bold border border-slate-100"
                />
              </div>
              <div className="text-right">
                <label className="text-[10px] font-black text-slate-400 block">شركة المحفظة</label>
                <input
                  readOnly
                  value={editData.walletInfo.provider || ""}
                  className="w-full p-2 bg-slate-50 rounded-lg text-sm font-bold border border-slate-100"
                />
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  // ===== Render Financial Lock Screen =====
  if (financialLocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ligth p-4" dir="rtl">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full border border-brown/20">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto bg-brown/10 rounded-2xl flex items-center justify-center mb-6">
              <Shield size={40} className="text-brown" />
            </div>
            <h2 className="text-2xl font-black text-dark mb-2">لوحة إدارة الأموال</h2>
            <p className="text-dark/60 text-sm mb-6">
              هذه اللوحة محمية برقم سري مالي لأمان البيانات
            </p>
          </div>

          <form onSubmit={handleFinancialLogin}>
            <div className="space-y-4">
              <div className="relative">
                <label className="block font-bold text-dark text-sm mb-2">الرقم السري المالي</label>
                <div className="relative">
                  <input
                    type={showPin ? "text" : "password"}
                    value={financialPin}
                    onChange={(e) => setFinancialPin(e.target.value)}
                    className={`w-full p-3 pl-12 bg-ligth/20 border rounded-xl outline-none font-bold text-dark focus:border-brown transition-all ${pinError ? "border-red-500" : "border-brown/10"
                      }`}
                    placeholder="أدخل الرقم السري..."
                    maxLength={6}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/40 hover:text-dark/70"
                  >
                    {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {pinError && (
                  <p className="text-red-500 text-xs mt-1">{pinError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isPinLoading}
                className="w-full bg-brown hover:bg-brown/90 text-white p-3 rounded-xl font-black flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isPinLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span> جاري التحقق...
                  </span>
                ) : (
                  <>
                    <Unlock size={18} /> فتح لوحة الأموال
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
            <p className="text-xs text-amber-700 flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>هذه اللوحة تحتوي على جميع حركات الأموال داخل السيستم. الرقم السري مشفر ولا يظهر لأي مستخدم.</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ===== Main Dashboard =====
  return (
    <div className="w-full min-h-screen p-4 lg:p-8 bg-ligth/10 font-[cairo]" dir="rtl">

      {/* ===== Header ===== */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-dark">لوحة إدارة الأموال</h1>
          <p className="text-dark/60 text-sm">المرجع المالي الحقيقي لسيستم المخرز</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-3">
          <button
            onClick={() => navigate("/customer/payments")}
            className="bg-brown hover:bg-brown/90 text-white px-5 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 shadow-md transition-all"
          >
            <Plus size={18} /> معاملات التجار
          </button>

          <button
            onClick={handleFinancialLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 shadow-md transition-all"
          >
            <Lock size={18} /> إغلاق اللوحة
          </button>
          <button
            onClick={() => { fetchDashboardData(); fetchPayments(pagination.page); }}
            className="bg-dark hover:bg-dark/90 text-white px-5 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 shadow-md transition-all"
          >
            <RefreshCw size={18} /> تحديث
          </button>
        </div>
      </div>

      {/* ===== Stats Cards ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-brown/20 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-dark/60">إجمالي الاستلام</span>
            <ArrowUpRight size={18} className="text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-emerald-600">{formatCurrency(stats.incoming)}</span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-brown/20 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-dark/60">إجمالي الارسال</span>
            <ArrowDownRight size={18} className="text-red-600" />
          </div>
          <span className="text-2xl font-black text-red-600">{formatCurrency(stats.outgoing)}</span>
        </div>
      </div>

      {/* ===== Wallet/Bank/Mail/Cash Cards ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-brown/20 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Wallet size={20} className="text-amber-700" />
            </div>
            <div>
              <p className="text-xs font-bold text-dark/60">المحافظ الإلكترونية</p>
            </div>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-emerald-600">استلام: {formatCurrency(stats.wallets?.incoming || 0)}</span>
            <span className="text-red-600">ارسال: {formatCurrency(stats.wallets?.outgoing || 0)}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-brown/20 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <BanknoteIcon size={20} className="text-amber-700" />
            </div>
            <div>
              <p className="text-xs font-bold text-dark/60">الشيكات</p>
            </div>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-emerald-600">استلام: {formatCurrency(stats.cheques?.incoming || 0)}</span>
            <span className="text-red-600">ارسال: {formatCurrency(stats.cheques?.outgoing || 0)}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-brown/20 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Building size={20} className="text-amber-700" />
            </div>
            <div>
              <p className="text-xs font-bold text-dark/60">انستاباي</p>
            </div>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-emerald-600">استلام: {formatCurrency(stats.instapay?.incoming || 0)}</span>
            <span className="text-red-600">ارسال: {formatCurrency(stats.instapay?.outgoing || 0)}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-brown/20 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Building2 size={20} className="text-blue-700" />
            </div>
            <div>
              <p className="text-xs font-bold text-dark/60">الحسابات البنكية</p>
            </div>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-emerald-600">استلام: {formatCurrency(stats.banks?.incoming || 0)}</span>
            <span className="text-red-600">ارسال: {formatCurrency(stats.banks?.outgoing || 0)}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-brown/20 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
              <Mail size={20} className="text-cyan-700" />
            </div>
            <div>
              <p className="text-xs font-bold text-dark/60">البريد</p>
            </div>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-emerald-600">استلام: {formatCurrency(stats.mail?.incoming || 0)}</span>
            <span className="text-red-600">ارسال: {formatCurrency(stats.mail?.outgoing || 0)}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-brown/20 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Banknote size={20} className="text-emerald-700" />
            </div>
            <div>
              <p className="text-xs font-bold text-dark/60">النقدي</p>
            </div>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-emerald-600">استلام: {formatCurrency(stats.cash?.incoming || 0)}</span>
            <span className="text-red-600">ارسال: {formatCurrency(stats.cash?.outgoing || 0)}</span>
          </div>
        </div>
      </div>

      {/* ===== Cheques Summary ===== */}
      <div className="bg-white p-5 rounded-2xl border border-brown/20 shadow-sm mb-8">
        <h3 className="font-black text-dark mb-4 flex items-center gap-2">
          <Shield size={18} className="text-brown" /> ملخص الشيكات
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center">
            <p className="text-xs text-amber-700">تحت التحصيل</p>
            <p className="font-black text-amber-700">{formatCurrency(stats.cheques?.underCollection || 0)}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
            <p className="text-xs text-emerald-700">تم تحصيلها</p>
            <p className="font-black text-emerald-700">{formatCurrency(stats.cheques?.collected || 0)}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-center">
            <p className="text-xs text-red-700">مرتجعة</p>
            <p className="font-black text-red-700">{formatCurrency(stats.cheques?.returned || 0)}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-center">
            <p className="text-xs text-blue-700">مستحقة اليوم</p>
            <p className="font-black text-blue-700">{formatCurrency(stats.cheques?.dueToday || 0)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-center">
            <p className="text-xs text-gray-700">ملغية</p>
            <p className="font-black text-gray-700">{formatCurrency(stats.cheques?.cancelled || 0)}</p>
          </div>
        </div>
      </div>

      {/* ===== Payments List ===== */}
      <div className="bg-white p-5 rounded-2xl border border-brown/20 shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
          <h3 className="font-black text-dark text-lg flex items-center gap-2">
            <Calendar size={18} className="text-brown" /> سجل حركة الأموال
          </h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-brown hover:text-dark font-bold text-sm flex items-center gap-1"
          >
            <Filter size={16} /> {showFilters ? "إخفاء الفلترة" : "فلترة"}
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-ligth/20 p-4 rounded-xl border border-brown/10 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="text-xs font-bold text-dark/60 block mb-1">وسيلة الدفع</label>
                <select
                  className="w-full p-2 rounded-lg border border-brown/10 bg-white font-bold text-sm"
                  value={filters.paymentMethod}
                  onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
                >
                  <option value="">الكل</option>
                  {paymentMethods.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-dark/60 block mb-1">النوع</label>
                <select
                  className="w-full p-2 rounded-lg border border-brown/10 bg-white font-bold text-sm"
                  value={filters.moneyFlow}
                  onChange={(e) => setFilters({ ...filters, moneyFlow: e.target.value })}
                >
                  <option value="">الكل</option>
                  {moneyFlows.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-dark/60 block mb-1">الوحدة</label>
                <select
                  className="w-full p-2 rounded-lg border border-brown/10 bg-white font-bold text-sm"
                  value={filters.module}
                  onChange={(e) => setFilters({ ...filters, module: e.target.value })}
                >
                  <option value="">الكل</option>
                  {modules.map((m) => (
                    <option key={m.value} value={m.value}>{moduleLabels[m.value] || m.value}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-dark/60 block mb-1">من تاريخ</label>
                <input
                  type="date"
                  className="w-full p-2 rounded-lg border border-brown/10 bg-white font-bold text-sm"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-dark/60 block mb-1">إلى تاريخ</label>
                <input
                  type="date"
                  className="w-full p-2 rounded-lg border border-brown/10 bg-white font-bold text-sm"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-dark/60 block mb-1">بحث</label>
                <input
                  type="text"
                  className="w-full p-2 rounded-lg border border-brown/10 bg-white font-bold text-sm"
                  placeholder="بحث عن التاجر..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => {
                  setFilters({
                    paymentMethod: "",
                    moneyFlow: "",
                    module: "",
                    startDate: "",
                    endDate: "",
                    search: ""
                  });
                  fetchPayments(1);
                }}
                className="text-dark/50 hover:text-dark font-bold text-sm"
              >
                مسح الكل
              </button>
              <button
                onClick={() => fetchPayments(1)}
                className="bg-brown text-white px-4 py-1.5 rounded-lg font-bold text-sm"
              >
                تطبيق
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-sm">
            <thead>
              <tr className="bg-ligth border-b border-brown/20">
                <th className="p-3 font-black rounded-r-xl">التاريخ</th>
                <th className="p-3 font-black">الوحدة</th>
                <th className="p-3 font-black">وسيلة الدفع</th>
                <th className="p-3 font-black">النوع</th>
                <th className="p-3 font-black">المبلغ</th>
                <th className="p-3 font-black">التاجر</th>
                <th className="p-3 font-black">الملاحظات</th>
                <th className="p-3 font-black rounded-l-xl">الأجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brown/10">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center">
                    <span className="animate-spin inline-block">⏳</span> جاري التحميل...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-dark/40">
                    لا توجد حركات مالية
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const methodBadge = getPaymentMethodBadge(p.paymentMethod);
                  const flowBadge = getMoneyFlowBadge(p.moneyFlow);
                  return (
                    <tr key={p._id} className="hover:bg-ligth/30">
                      <td className="p-3 font-bold">
                        {new Date(p.transactionDate).toLocaleDateString("ar-EG")}
                      </td>
                      <td className="p-3 text-dark/70">
                        {getModuleLabel(p.module)}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-lg text-xs font-black ${methodBadge.bg}`}>
                          {methodBadge.label}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-lg text-xs font-black ${flowBadge.bg}`}>
                          {flowBadge.label}
                        </span>
                      </td>
                      <td className={`p-3 font-black ${p.moneyFlow === "incoming" ? "text-emerald-600" : "text-red-600"}`}>
                        {formatCurrency(p.amount)}
                      </td>

                      <td className="p-3 text-dark/50 text-xs">{p?.supplier?.name || p?.customer?.name || "—"}</td>
                      <td className="p-3 text-dark/50 text-xs">{p.notes || "—"}</td>

                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {p?.cheque?.status !== "collected" && (
                            <button
                              onClick={() => deletePaymentHistory(p._id, p.customer?._id || p.supplier?._id)}
                              className="p-2 bg-red-50 text-red-600 hover:bg-red-800 hover:text-white rounded-xl transition-all"
                              title="حذف"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => editPaymentHistory(p)}
                            className="p-2 bg-slate-100 text-dark rounded-xl hover:bg-dark hover:text-white transition-all border border-slate-100"
                            title="تعديل البيانات"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => showPaymentHistory(p)}
                            className="p-2 bg-slate-100 text-dark rounded-xl hover:bg-dark hover:text-white transition-all border border-slate-100"
                            title="عرض البيانات"
                          >
                            <Eye size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-brown/10">
            <span className="text-xs text-dark/50">
              إجمالي {pagination.total} حركة
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => fetchPayments(pagination.page - 1)}
                disabled={!pagination.hasPrev}
                className="p-2 rounded-lg border border-brown/20 disabled:opacity-30 hover:bg-brown/10 transition"
              >
                السابق
              </button>
              <span className="px-3 py-2 font-bold text-brown">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchPayments(pagination.page + 1)}
                disabled={!pagination.hasNext}
                className="p-2 rounded-lg border border-brown/20 disabled:opacity-30 hover:bg-brown/10 transition"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>

      {/* مودال تعديل المعاملة الماليّة */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-xl w-[600px] max-w-[95vw] p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-6 text-slate-800">تعديل العملية المالية</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">الوحدة</label>
                <select
                  className="w-full border rounded-lg p-2 outline-none focus:border-dark"
                  value={editData.module}
                  onChange={(e) => setEditData({ ...editData, module: e.target.value })}
                >
                  <option value="pay">دفع (استلام فلوس من تاجر )</option>
                  <option value="debt">مديونية (دفع فلوس للتاجر )</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">المبلغ</label>
                <input
                  type="number"
                  className="w-full border rounded-lg p-2 outline-none focus:border-dark"
                  value={editData.amount}
                  onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">طريقة الدفع</label>
                <select
                  className="w-full border rounded-lg p-2 outline-none focus:border-dark"
                  value={editData.paymentMethod}
                  onChange={(e) => setEditData({ ...editData, paymentMethod: e.target.value })}
                >
                  <option value="cash">نقدي</option>
                  <option value="wallet">محفظة</option>
                  <option value="bank">تحويل بنكي</option>
                  <option value="instapay">أنستا باي</option>
                  <option value="mail">بريد</option>
                  <option value="cheque">شيك</option>
                  <option value="work">شغل</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">التاريخ</label>
                <input
                  type="datetime-local"
                  className="w-full border rounded-lg p-2 outline-none focus:border-dark"
                  value={editData.date}
                  onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">ملاحظات</label>
                <textarea
                  className="w-full border rounded-lg p-2 outline-none focus:border-dark"
                  rows={2}
                  value={editData.note}
                  onChange={(e) => setEditData({ ...editData, note: e.target.value })}
                />
              </div>

              {renderEditPaymentFields()}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  disabled={loading2}
                  onClick={() => updatePaymentHistory(editData)}
                  className="px-5 py-2 rounded-lg bg-dark text-white hover:bg-dark/90 font-bold disabled:opacity-50"
                >
                  {!loading2 ? "حفظ" : "جاري الحفظ"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مودال عرض تفاصيل المعاملة الماليّة (قراءة فقط) */}
      {showData && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-xl w-[600px] max-w-[95vw] p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-6 text-slate-800">العملية المالية</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">الوحدة</label>
                <select
                  disabled={true}
                  className="w-full border rounded-lg p-2 outline-none focus:border-dark"
                  value={editData.module}
                  onChange={(e) => setEditData({ ...editData, module: e.target.value })}
                >
                  <option value="pay">دفع (استلام فلوس من تاجر )</option>
                  <option value="debt">مديونية (دفع فلوس للتاجر )</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">المبلغ</label>
                <input
                  disabled={true}
                  type="number"
                  className="w-full border rounded-lg p-2 outline-none focus:border-dark"
                  value={editData.amount}
                  onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">طريقة الدفع</label>
                <select
                  disabled={true}
                  className="w-full border rounded-lg p-2 outline-none focus:border-dark"
                  value={editData.paymentMethod}
                  onChange={(e) => setEditData({ ...editData, paymentMethod: e.target.value })}
                >
                  <option value="cash">نقدي</option>
                  <option value="wallet">محفظة</option>
                  <option value="bank">تحويل بنكي</option>
                  <option value="instapay">أنستا باي</option>
                  <option value="mail">بريد</option>
                  <option value="cheque">شيك</option>
                  <option value="work">شغل</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">التاريخ</label>
                <input
                  disabled={true}
                  type="datetime-local"
                  className="w-full border rounded-lg p-2 outline-none focus:border-dark"
                  value={editData.date}
                  onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">ملاحظات</label>
                <textarea
                  disabled={true}
                  className="w-full border rounded-lg p-2 outline-none focus:border-dark"
                  rows={2}
                  value={editData.note}
                  onChange={(e) => setEditData({ ...editData, note: e.target.value })}
                />
              </div>

              {renderEditPaymentFields()}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowData(false)}
                  className="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 font-bold"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoneyDashboard;
