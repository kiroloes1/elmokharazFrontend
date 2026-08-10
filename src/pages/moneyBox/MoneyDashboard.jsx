import React, { useState, useEffect } from "react";
import { 
  Wallet, Building2, Mail, Calendar, 
  ArrowUpRight, ArrowDownRight, Banknote,
  Shield, Lock, Unlock,
  Eye, EyeOff, Search, Filter, Plus, X,
  RefreshCw, AlertCircle,
  Trash,
  Trash2,
  Trash2Icon,
  BanknoteIcon,
  Building
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
  const [stats, setStats] = useState({
    incoming: 0,
    outgoing: 0,
    currentBalance: 0,
    wallets: { balance: 0, incoming: 0, outgoing: 0 },
    banks: { balance: 0, incoming: 0, outgoing: 0 },
    mail: { balance: 0, incoming: 0, outgoing: 0 },
    cash: { balance: 0, incoming: 0, outgoing: 0 },
    cheques: {
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
        console.log("✅ تم جلب المحافظ:", res.data.wallets.length);
      } else {
        setSuggestionWallets([]);
         setFinancialLocked(true);
      }
    } catch (err) {
      console.error("❌ Error fetching wallet suggestions:", err);
      setSuggestionWallets([]);
       setFinancialLocked(true);
    }
  };

  // ===== Check Financial Lock Status =====
  useEffect(() => {
    const token = localStorage.getItem('financialToken');
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
        showAlert({title:"حدث خطاء ما" , icon:"error"})
       setFinancialLocked(true);
    }
  };

  const handleDeletePayment=async(paymentId)=>{

        const confirm=await showAlertConfirm({
          title:"حذف عمليه ",
          icon:"warning",
          text:"هل انت متأكد من ذلك لايمكن الرجوع في القرار بعد الموافقه",
          confirmButtonText:"موافق",
          cancelButtonText:"الغاء"
        })
        if(!confirm){
          return;
        }
         try{
          setLoading(true);
                 await api.delete(
            `/payment/deletePayment/${paymentId}`,      
            {
                params:{
                    remove:true
                }
            }
        ); 
        
        showAlert({
          title:"تم الحذف بنجاح",
          icon:"success"
        })
        setLoading(false);
       fetchDashboardData();
      fetchPayments();
      fetchFilters();

         }catch(err){
          showAlert({title: err?.data.message || "حدث خطاء ما" , icon:"error"})
          setLoading(false);
         }
  }
  // ===== Fetch Payments =====
  const fetchPayments = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        ...filters
      };
      Object.keys(params).forEach(key => {
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
        localStorage.setItem('financialToken', res.data.token);
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

    // التحقق من البيانات المطلوبة حسب طريقة الدفع
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

      // إذا كانت طريقة الدفع محفظة ومفعل الربط
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
      localStorage.removeItem('financialToken');
      setFinancialLocked(true);
      showAlert({ title: "تم إغلاق لوحة إدارة الأموال", icon: "success" });
    }
  };

  // ===== Format Currency =====
  const formatCurrency = (value) => {
    return Number(value).toLocaleString() + " ج.م";
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
                    className={`w-full p-3 pl-12 bg-ligth/20 border rounded-xl outline-none font-bold text-dark focus:border-brown transition-all ${
                      pinError ? "border-red-500" : "border-brown/10"
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
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowTransferModal(true)}
            className="bg-brown hover:bg-brown/90 text-white px-5 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 shadow-md transition-all"
          >
            <Plus size={18} /> عملية مالية جديدة
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
        {/* <div className="bg-white p-6 rounded-2xl border border-brown/20 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-dark/60">الرصيد الحالي</span>
            <Banknote size={18} className="text-brown" />
          </div>
          <span className="text-2xl font-black text-brown">{formatCurrency(stats.currentBalance)}</span>
        </div> */}
        {/* <div className="bg-white p-6 rounded-2xl border border-brown/20 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-dark/60">شيكات تحت التحصيل</span>
            <Shield size={18} className="text-amber-600" />
          </div>
          <span className="text-2xl font-black text-amber-600">{formatCurrency(stats.cheques?.underCollection || 0)}</span>
        </div> */}
      </div>

      {/* ===== Wallet/Bank/Mail/Cash Cards ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
              <p className="text-xs font-bold text-dark/60"> الشيكات</p>

            </div>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-emerald-600">استلام: {formatCurrency(stats.cheque?.incoming || 0)}</span>
            <span className="text-red-600">ارسال: {formatCurrency(stats.cheque?.outgoing || 0)}</span>
          </div>
        </div>

                     <div className="bg-white p-5 rounded-2xl border border-brown/20 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Building size={20} className="text-amber-700" />
            </div>
            <div>
              <p className="text-xs font-bold text-dark/60"> انستاباي</p>

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
                  placeholder="رقم المرجع..."
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
                <th className="p-3 font-black rounded-l-xl">الملاحظات</th>
                <th className="p-3 font-black rounded-l-xl">الأجراءات</th>

              </tr>
            </thead>
            <tbody className="divide-y divide-brown/10">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <span className="animate-spin inline-block">⏳</span> جاري التحميل...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-dark/40">
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
                        {new Date(p.transactionDate).toLocaleDateString('ar-EG')}
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
{ (p.module =="import" || p.module=="export" )  && <td className="p-3 text-dark/50 text-xs">
<Trash2Icon  onClick={()=>handleDeletePayment(p._id)} className="text-xs text-red-600 cursor-pointer hover:text-red-500" />
</td>}


                      
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

      {/* ===== Transfer Modal ===== */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <div className="p-6 border-b border-brown/10 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-3xl">
              <h3 className="text-xl font-black text-dark">عملية مالية جديدة</h3>
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  resetTransferData();
                }}
                className="text-dark/40 hover:text-dark"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-dark text-sm mb-1">نوع العملية</label>
                  <select
                    className="w-full p-3 rounded-xl border border-brown/10 bg-ligth/20 font-bold"
                    value={transferData.type}
                    onChange={(e) => {
                      setTransferData({ ...transferData, type: e.target.value });
                      // إعادة تعيين بيانات المحفظة عند تغيير النوع
                      setWalletSearch("");
                      setTransferData(prev => ({
                        ...prev,
                        walletInfo: {
                          ...prev.walletInfo,
                          walletId: "",
                          receiverName: "",
                          receiverPhone: "",
                          provider: "",
                          senderName: "",
                          senderPhone: ""
                        }
                      }));
                    }}
                  >
                    <option value="import">استيراد (استلام)</option>
                    <option value="export">تصدير (ارسال)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-dark text-sm mb-1">المبلغ</label>
                  <input
                    type="number"
                    className="w-full p-3 rounded-xl border border-brown/10 bg-ligth/20 font-bold"
                    placeholder="أدخل المبلغ..."
                    value={transferData.amount}
                    onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block font-bold text-dark text-sm mb-1">وسيلة الدفع</label>
                <select
                  className="w-full p-3 rounded-xl border border-brown/10 bg-ligth/20 font-bold"
                  value={transferData.paymentMethod}
                  onChange={(e) => setTransferData({ ...transferData, paymentMethod: e.target.value })}
                >
                  <option value="cash">نقدي</option>
                  <option value="wallet">محفظة إلكترونية</option>
                  <option value="bank">تحويل بنكي</option>
                  <option value="instapay">إنستا باي</option>
                  {/* <option value="cheque">شيك</option> */}
                </select>
              </div>

{/* Conditional Fields - Wallet */}
{transferData.paymentMethod === "wallet" && (
  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-3">
    <h4 className="font-black text-amber-800 text-sm flex items-center gap-2">
      <Wallet size={16} /> بيانات المحفظة
    </h4>

    {/* ربط العملية */}
    <div className="flex gap-3 items-center p-3 rounded-lg bg-amber-100/30">
      <input
        type="checkbox"
        checked={transferData.walletInfo.linkWallet || false}
        onChange={(e) => {
          const checked = e.target.checked;
          setTransferData({
            ...transferData,
            walletInfo: { 
              ...transferData.walletInfo, 
              linkWallet: checked,
              ...(checked ? {} : { 
                walletId: "", 
                receiverName: "", 
                receiverPhone: "", 
                provider: "",
                senderName: "",
                senderPhone: ""
              })
            }
          });
          if (!checked) {
            setWalletSearch("");
            setShowWalletList(false);
          }
        }}
        className="w-4 h-4 text-amber-600"
      />
      <span className="text-sm font-bold text-amber-800">ربط العملية بنظام المحافظ</span>
    </div>

    {/* في حالة الاستيراد: المحفظة مرسلة + بيانات المستلم يدوياً */}
    {transferData.type === "import" && (
      <>
        {/* بيانات المحفظة المرسلة (تظهر دائماً) */}
        <div className="flex gap-3 justify-between items-center w-full">
          <div className="w-full text-right">
            <label className="block mb-1 text-[11px] font-black text-amber-800">
              رقم المحفظة المرسلة
            </label>
            <input
              type="text"
              className="p-2 w-full text-sm font-bold rounded-lg border border-amber-200 bg-white"
              placeholder="رقم هاتف المرسل"
              value={transferData.walletInfo.senderPhone || ""}
              onChange={(e) => setTransferData({
                ...transferData,
                walletInfo: { ...transferData.walletInfo, senderPhone: e.target.value }
              })}
            />
          </div>
          <div className="w-full text-right">
            <label className="block mb-1 text-[11px] font-black text-amber-800">
              اسم المحفظة المرسلة
            </label>
            <input
              type="text"
              className="p-2 w-full text-sm font-bold rounded-lg border border-amber-200 bg-white"
              placeholder="اسم المرسل"
              value={transferData.walletInfo.senderName || ""}
              onChange={(e) => setTransferData({
                ...transferData,
                walletInfo: { ...transferData.walletInfo, senderName: e.target.value }
              })}
            />
          </div>
        </div>

        {/* بيانات المستلم (تدخل يدوياً) */}
        <div className="flex gap-3 justify-between items-center w-full">
          <div className="w-full text-right">
            <label className="block mb-1 text-[11px] font-black text-amber-800">
              رقم المستلم (صاحب السيستم)
            </label>
            <input
              type="text"
              className="p-2 w-full text-sm font-bold rounded-lg border border-amber-200 bg-white"
              placeholder="رقم هاتف المستلم"
              value={transferData.walletInfo.receiverPhone || ""}
              onChange={(e) => setTransferData({
                ...transferData,
                walletInfo: { ...transferData.walletInfo, receiverPhone: e.target.value }
              })}
            />
          </div>
          <div className="w-full text-right">
            <label className="block mb-1 text-[11px] font-black text-amber-800">
              اسم المستلم (صاحب السيستم)
            </label>
            <input
              type="text"
              className="p-2 w-full text-sm font-bold rounded-lg border border-amber-200 bg-white"
              placeholder="اسم المستلم"
              value={transferData.walletInfo.receiverName || ""}
              onChange={(e) => setTransferData({
                ...transferData,
                walletInfo: { ...transferData.walletInfo, receiverName: e.target.value }
              })}
            />
          </div>
        </div>

        {/* المزود */}
        <div className="w-full text-right">
          <label className="block mb-1 text-[11px] font-black text-amber-800">
            مزود المحفظة
          </label>
          <input
            type="text"
            className="p-2 w-full text-sm font-bold rounded-lg border border-amber-200 bg-white"
            placeholder="مثال: Vodafone Cash, Etisalat Wallet..."
            value={transferData.walletInfo.provider || ""}
            onChange={(e) => setTransferData({
              ...transferData,
              walletInfo: { ...transferData.walletInfo, provider: e.target.value }
            })}
          />
        </div>
      </>
    )}

    {/* في حالة التصدير: المحفظة مستلمة + بيانات المرسل يدوياً */}
    {transferData.type === "export" && (
      <>
        {/* بيانات المرسل (تدخل يدوياً) */}
        <div className="flex gap-3 justify-between items-center w-full">
          <div className="w-full text-right">
            <label className="block mb-1 text-[11px] font-black text-amber-800">
              رقم المرسل (صاحب السيستم)
            </label>
            <input
              type="text"
              className="p-2 w-full text-sm font-bold rounded-lg border border-amber-200 bg-white"
              placeholder="رقم هاتف المرسل"
              value={transferData.walletInfo.senderPhone || ""}
              onChange={(e) => setTransferData({
                ...transferData,
                walletInfo: { ...transferData.walletInfo, senderPhone: e.target.value }
              })}
            />
          </div>
          <div className="w-full text-right">
            <label className="block mb-1 text-[11px] font-black text-amber-800">
              اسم المرسل (صاحب السيستم)
            </label>
            <input
              type="text"
              className="p-2 w-full text-sm font-bold rounded-lg border border-amber-200 bg-white"
              placeholder="اسم المرسل"
              value={transferData.walletInfo.senderName || ""}
              onChange={(e) => setTransferData({
                ...transferData,
                walletInfo: { ...transferData.walletInfo, senderName: e.target.value }
              })}
            />
          </div>
        </div>

        {/* بيانات المحفظة المستلمة (تظهر دائماً) */}
        <div className="flex gap-3 justify-between items-center w-full">
          <div className="w-full text-right">
            <label className="block mb-1 text-[11px] font-black text-amber-800">
              رقم المحفظة المستلمة
            </label>
            <input
              type="text"
              className="p-2 w-full text-sm font-bold rounded-lg border border-amber-200 bg-white"
              placeholder="رقم هاتف المستلم"
              value={transferData.walletInfo.receiverPhone || ""}
              onChange={(e) => setTransferData({
                ...transferData,
                walletInfo: { ...transferData.walletInfo, receiverPhone: e.target.value }
              })}
            />
          </div>
          <div className="w-full text-right">
            <label className="block mb-1 text-[11px] font-black text-amber-800">
              اسم المحفظة المستلمة
            </label>
            <input
              type="text"
              className="p-2 w-full text-sm font-bold rounded-lg border border-amber-200 bg-white"
              placeholder="اسم المستلم"
              value={transferData.walletInfo.receiverName || ""}
              onChange={(e) => setTransferData({
                ...transferData,
                walletInfo: { ...transferData.walletInfo, receiverName: e.target.value }
              })}
            />
          </div>
        </div>

        {/* المزود */}
        <div className="w-full text-right">
          <label className="block mb-1 text-[11px] font-black text-amber-800">
            مزود المحفظة
          </label>
          <input
            type="text"
            className="p-2 w-full text-sm font-bold rounded-lg border border-amber-200 bg-white"
            placeholder="مثال: Vodafone Cash, Etisalat Wallet..."
            value={transferData.walletInfo.provider || ""}
            onChange={(e) => setTransferData({
              ...transferData,
              walletInfo: { ...transferData.walletInfo, provider: e.target.value }
            })}
          />
        </div>
      </>
    )}

    {/* البحث عن المحفظة (يظهر عند تفعيل الربط) */}
    {transferData.walletInfo.linkWallet && (
      <div className="relative text-right">
        <label className="block mb-1 text-[11px] font-black text-amber-800">
          {transferData.type === "import" ? "اختر المحفظة المرسلة من القائمة" : "اختر المحفظة المستلمة من القائمة"}
        </label>
        <input
          type="text"
          className="p-2 w-full text-sm font-bold rounded-lg border border-amber-200 bg-white"
          placeholder={transferData.type === "import" ? "ابحث باسم أو رقم المحفظة المرسلة..." : "ابحث باسم أو رقم المحفظة المستلمة..."}
          value={walletSearch}
          onFocus={() => setShowWalletList(true)}
          onChange={(e) => {
            setWalletSearch(e.target.value);
            setShowWalletList(true);
          }}
        />

        {/* قائمة اقتراحات المحافظ */}
        {showWalletList && walletSearch.length > 0 && (
          <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto bg-white rounded-xl border shadow-xl">
            {suggestionWallets
              .filter(
                (w) =>
                  w.walletName
                    ?.toLowerCase()
                    .includes(walletSearch.toLowerCase()) ||
                  w.phoneNumber?.includes(walletSearch) ||
                  w.ownerName?.toLowerCase().includes(walletSearch.toLowerCase())
              )
              .map((wallet) => (
                <div
                  key={wallet._id}
                  className="p-3 border-b transition cursor-pointer hover:bg-amber-50"
                  onClick={() => {
                    if (transferData.type === "import") {
                      // استيراد: تعيين بيانات المحفظة المرسلة
                      setTransferData({
                        ...transferData,
                        walletInfo: {
                          ...transferData.walletInfo,
                          walletId: wallet._id,
                          senderName: wallet.walletName,
                          senderPhone: wallet.phoneNumber,
                          provider: wallet.walletProvider,
                        }
                      });
                    } else {
                      // تصدير: تعيين بيانات المحفظة المستلمة
                      setTransferData({
                        ...transferData,
                        walletInfo: {
                          ...transferData.walletInfo,
                          walletId: wallet._id,
                          receiverName: wallet.walletName,
                          receiverPhone: wallet.phoneNumber,
                          provider: wallet.walletProvider,
                        }
                      });
                    }
                    setWalletSearch(wallet.walletName);
                    setShowWalletList(false);
                  }}
                >
                  <div className="font-black text-dark">{wallet.walletName}</div>
                  <div className="text-xs text-gray-500 flex gap-2">
                    <span>📱 {wallet.phoneNumber}</span>
                    <span>|</span>
                    <span>👤 {wallet.ownerName || 'غير محدد'}</span>
                  </div>
                  <div className="text-xs flex gap-3 mt-1">
                    <span className="text-amber-600 font-bold">{wallet.walletProvider}</span>
                    <span className="text-emerald-600">💰 {wallet.balance?.toLocaleString() || 0} ج.م</span>
                    <span className="text-blue-600">📊 متبقي: {wallet.remainingIncoming?.toLocaleString() || 0}</span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    )}

    {/* عرض بيانات المحفظة المختارة تلقائياً */}
    {transferData.walletInfo.walletId && transferData.walletInfo.linkWallet && (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <label className="block mb-1 text-[11px] font-black text-amber-800">
            {transferData.type === "import" ? "اسم المحفظة المرسلة" : "اسم المحفظة المستلمة"}
          </label>
          <input
            readOnly
            value={transferData.type === "import" 
              ? transferData.walletInfo.senderName || "" 
              : transferData.walletInfo.receiverName || ""}
            className="p-2 w-full text-sm font-bold bg-gray-100 rounded-lg border"
          />
        </div>

        <div>
          <label className="block mb-1 text-[11px] font-black text-amber-800">
            {transferData.type === "import" ? "رقم المحفظة المرسلة" : "رقم المحفظة المستلمة"}
          </label>
          <input
            readOnly
            value={transferData.type === "import" 
              ? transferData.walletInfo.senderPhone || "" 
              : transferData.walletInfo.receiverPhone || ""}
            className="p-2 w-full text-sm font-bold bg-gray-100 rounded-lg border"
          />
        </div>

        <div>
          <label className="block mb-1 text-[11px] font-black text-amber-800">شركة المحفظة</label>
          <input
            readOnly
            value={transferData.walletInfo.provider || ""}
            className="p-2 w-full text-sm font-bold bg-gray-100 rounded-lg border"
          />
        </div>
      </div>
    )}

    {/* رقم المرجع */}
    <div>
      <label className="block mb-1 text-[11px] font-black text-amber-800">رقم المرجع</label>
      <input
        type="text"
        className="p-2 w-full text-sm font-bold rounded-lg border border-amber-200 bg-white"
        placeholder="رقم مرجع المعاملة (اختياري)"
        value={transferData.walletInfo.transactionReference || ""}
        onChange={(e) => setTransferData({
          ...transferData,
          walletInfo: { ...transferData.walletInfo, transactionReference: e.target.value }
        })}
      />
    </div>
  </div>
)}

              {/* Conditional Fields - Bank & Instapay */}
              {(transferData.paymentMethod === "bank" || transferData.paymentMethod === "instapay") && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 space-y-3">
                  <h4 className="font-black text-blue-800 text-sm flex items-center gap-2">
                    <Building2 size={16} /> بيانات البنك
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block mb-1 text-[11px] font-black text-blue-800">اسم البنك</label>
                      <input
                        type="text"
                        className="p-2 w-full text-sm font-bold rounded-lg border border-blue-200 bg-white"
                        placeholder="مثال: البنك الأهلي المصري"
                        value={transferData.bankInfo.bankName}
                        onChange={(e) => setTransferData({
                          ...transferData,
                          bankInfo: { ...transferData.bankInfo, bankName: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-[11px] font-black text-blue-800">رقم الحساب</label>
                      <input
                        type="text"
                        className="p-2 w-full text-sm font-bold rounded-lg border border-blue-200 bg-white"
                        placeholder="رقم الحساب البنكي"
                        value={transferData.bankInfo.accountNumber || ""}
                        onChange={(e) => setTransferData({
                          ...transferData,
                          bankInfo: { ...transferData.bankInfo, accountNumber: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-[11px] font-black text-blue-800">صاحب الحساب</label>
                      <input
                        type="text"
                        className="p-2 w-full text-sm font-bold rounded-lg border border-blue-200 bg-white"
                        placeholder="اسم صاحب الحساب"
                        value={transferData.bankInfo.accountHolder || ""}
                        onChange={(e) => setTransferData({
                          ...transferData,
                          bankInfo: { ...transferData.bankInfo, accountHolder: e.target.value }
                        })}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block mb-1 text-[11px] font-black text-blue-800">رقم المرجع</label>
                      <input
                        type="text"
                        className="p-2 w-full text-sm font-bold rounded-lg border border-blue-200 bg-white"
                        placeholder="رقم مرجع المعاملة البنكية"
                        value={transferData.bankInfo.transactionReference}
                        onChange={(e) => setTransferData({
                          ...transferData,
                          bankInfo: { ...transferData.bankInfo, transactionReference: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Conditional Fields - Cheque */}
              {transferData.paymentMethod === "cheque" && (
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 space-y-3">
                  <h4 className="font-black text-rose-800 text-sm flex items-center gap-2">
                    <Shield size={16} /> بيانات الشيك
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 text-[11px] font-black text-rose-800">رقم الشيك</label>
                      <input
                        type="text"
                        className="p-2 w-full text-sm font-bold rounded-lg border border-rose-200 bg-white"
                        placeholder="رقم الشيك"
                        value={transferData.cheque.chequeNumber}
                        onChange={(e) => setTransferData({
                          ...transferData,
                          cheque: { ...transferData.cheque, chequeNumber: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-[11px] font-black text-rose-800">اسم البنك</label>
                      <input
                        type="text"
                        className="p-2 w-full text-sm font-bold rounded-lg border border-rose-200 bg-white"
                        placeholder="البنك المسحوب عليه"
                        value={transferData.cheque.bankName}
                        onChange={(e) => setTransferData({
                          ...transferData,
                          cheque: { ...transferData.cheque, bankName: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-[11px] font-black text-rose-800">نوع الشيك</label>
                      <select
                        className="p-2 w-full text-sm font-bold rounded-lg border border-rose-200 bg-white"
                        value={transferData.cheque.chequeType}
                        onChange={(e) => setTransferData({
                          ...transferData,
                          cheque: { ...transferData.cheque, chequeType: e.target.value }
                        })}
                      >
                        <option value="normal">عادي</option>
                        <option value="clearing">مقاصة</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-[11px] font-black text-rose-800">حالة الشيك</label>
                      <select
                        className="p-2 w-full text-sm font-bold rounded-lg border border-rose-200 bg-white"
                        value={transferData.cheque.status}
                        onChange={(e) => setTransferData({
                          ...transferData,
                          cheque: { ...transferData.cheque, status: e.target.value }
                        })}
                      >
                        <option value="under_collection">تحت التحصيل</option>
                        <option value="due_today">مستحق اليوم</option>
                        <option value="collected">تم تحصيله</option>
                        <option value="returned">مرتجع</option>
                        <option value="cancelled">ملغي</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-[11px] font-black text-rose-800">تاريخ الاستلام</label>
                      <input
                        type="date"
                        className="p-2 w-full text-sm font-bold rounded-lg border border-rose-200 bg-white"
                        value={transferData.cheque.receiveDate}
                        onChange={(e) => setTransferData({
                          ...transferData,
                          cheque: { ...transferData.cheque, receiveDate: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-[11px] font-black text-rose-800">تاريخ الاستحقاق</label>
                      <input
                        type="date"
                        className="p-2 w-full text-sm font-bold rounded-lg border border-rose-200 bg-white"
                        value={transferData.cheque.dueDate}
                        onChange={(e) => setTransferData({
                          ...transferData,
                          cheque: { ...transferData.cheque, dueDate: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Date & Notes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-dark text-sm mb-1">التاريخ</label>
                  <input
                    type="date"
                    className="w-full p-3 rounded-xl border border-brown/10 bg-ligth/20 font-bold"
                    value={transferData.transactionDate}
                    onChange={(e) => setTransferData({ ...transferData, transactionDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-dark text-sm mb-1">ملاحظات</label>
                  <input
                    type="text"
                    className="w-full p-3 rounded-xl border border-brown/10 bg-ligth/20 font-bold"
                    placeholder="اختياري..."
                    value={transferData.notes}
                    onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleTransfer}
                disabled={transferLoading}
                className="w-full bg-brown hover:bg-brown/90 text-white p-3 rounded-xl font-black flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {transferLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span> جاري التنفيذ...
                  </span>
                ) : (
                  <>
                    <Plus size={18} /> تنفيذ العملية المالية
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoneyDashboard;