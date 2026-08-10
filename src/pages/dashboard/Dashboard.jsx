import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { showAlert } from "../../services/alert";
import {
  Truck,
  UsersRound,
  Wallet,
  Calendar,
  RefreshCw,
  Loader2,
  Cloud,
  CheckCircle,
  CloudLightning,
  Settings,
  Receipt,
  AlertTriangle,
  Wrench,
  FileWarning,
  Package,
  Cable,
  ShoppingBag,
  Boxes,
  Bell,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  UserCheck,
  UserX,
  DollarSign,
  PiggyBank,
  CreditCard,
  BarChart3,
  Eye,
  EyeIcon
} from "lucide-react";
import { isLastBackupValid } from '../../services/lastBackupNotification';
import { useNavigate } from 'react-router-dom';

// خيارات فترة العرض
const PERIOD_OPTIONS = [
  { value: 'today', label: 'اليوم' },
  { value: 'week', label: 'الأسبوع' },
  { value: 'month', label: 'الشهر' },
  { value: 'custom', label: 'فترة مخصصة' },
];

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showMoneyView, setShowMoneyView] = useState(false);
  const [moneyData, setMoneyData] = useState(null);
  const [loadingMoney, setLoadingMoney] = useState(false);
  const navigate=useNavigate()
  const [filters, setFilters] = useState({
    period: 'today',
    from: '',
    to: ''
  });

  // جلب بيانات الـ Dashboard الرئيسي
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { period, from, to } = filters;
      let url = `/dashboard?period=${period}`;
      if (period === 'custom' && from && to) {
        url += `&from=${from}&to=${to}`;
      }
      const response = await api.get(url);
      if (response.data.success) {
        setData(response.data);
      }
    } catch (error) {
      showAlert({ title: "خطأ في تحميل بيانات لوحة التحكم", icon: "error" });
    } finally {
      setLoading(false);
    }
  };

  // جلب بيانات الماليات
  const fetchMoneyData = async () => {
    setLoadingMoney(true);
    try {
      const response = await api.get('/dashboard/money');
      if (response.data.success) {
        setMoneyData(response.data.data);
      }
    } catch (error) {
      showAlert({ title: "خطأ في تحميل بيانات الماليات", icon: "error" });
    } finally {
      setLoadingMoney(false);
    }
  };

  const [isLastBackup, setIsLastBackup] = useState(true);

  const MakeSureIsLastBackup = async () => {
    const res = await isLastBackupValid();
    setIsLastBackup(res);
  };

  useEffect(() => {
    MakeSureIsLastBackup();
  }, []);

  useEffect(() => {
    if (filters.period !== 'custom') fetchDashboardData();
  }, [filters.period]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // عرض الماليات
  const handleShowMoney = () => {
    if (!showMoneyView && !moneyData) {
      fetchMoneyData();
    }
    setShowMoneyView(!showMoneyView);
  };

  if (!data) return (
    <div className="min-h-screen bg-ligth flex items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin text-accent" />
    </div>
  );

  const { greeting, summaryLine, cards, notifications } = data;

  return (
    <div className="min-h-screen bg-ligth p-4 md:p-8" dir="rtl">

      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black text-dark">لوحة التحكم</h1>
          <p className="text-gray-500 font-bold">{greeting}</p>
        </div>

        <div className="flex w-full grid grid-cols-1 md:grid-cols-2 justify-between gap-3">
          {/* زر الماليات */}
          <button
            onClick={handleShowMoney}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all active:scale-95 shadow-sm ${
              showMoneyView 
                ? 'bg-dark text-white hover:bg-opacity-90' 
                : 'bg-dark  text-white hover:bg-dark/10'
            }`}
          >
            {showMoneyView ? <ArrowLeft size={18} /> : <Wallet size={18} />}
            {showMoneyView ? 'العودة للرئيسية' : 'الماليات'}
          </button>

          <div className="flex flex-wrap gap-3 bg-white p-3 rounded-xl shadow-sm border border-[#E0E7D0] w-full lg:w-auto">
            <div className="flex items-center gap-2 bg-ligth px-3 rounded-xl border border-gray-300">
              <Calendar className="w-4 h-4 text-brown" />
              <select
                className="bg-transparent p-2 font-bold text-dark outline-none cursor-pointer"
                value={filters.period}
                onChange={(e) => setFilters({ ...filters, period: e.target.value })}
              >
                {PERIOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {filters.period === 'custom' && (
              <div className="flex gap-2">
                <input type="date" className="p-2 bg-ligth rounded-xl border-none font-bold text-xs" onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
                <input type="date" className="p-2 bg-ligth rounded-xl border-none font-bold text-xs" onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
                <button onClick={fetchDashboardData} className="bg-accent text-white px-3 rounded-xl">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conditional Rendering: Money View or Main Dashboard */}
      {showMoneyView ? (
        // ====== عرض الماليات ======
        <MoneyView 
          moneyData={moneyData} 
          loadingMoney={loadingMoney} 
          onRefresh={fetchMoneyData}
        />
      ) : (
        // ====== عرض الـ Dashboard الرئيسي ======
        <>
          {/* Quick summary line */}
          <div className="bg-white border border-[#E0E7D0] rounded-xl p-4 mb-8 flex items-center gap-3 shadow-sm">
            <div className="p-2 bg-[#215E6122] rounded-lg text-accent shrink-0">
              <Bell size={20} />
            </div>
            <p className="font-bold text-dark">{summaryLine}</p>
          </div>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6 mb-8">
            <StatCard
              title="عملاء تم التعامل معهم"
              value={cards.customersDealtWith}
              icon={<UsersRound className="text-white" />}
              bgColor="bg-dark"
              subtitle="خلال الفترة المختارة"
            />
            <StatCard
              title="النقلات"
              value={cards.deliveries}
              icon={<Truck className="text-white" />}
              bgColor="bg-accent"
              subtitle="خلال الفترة المختارة"
            />
            <StatCard
              title="التحصيلات"
              value={cards.collections}
              icon={<Wallet className="text-white" />}
              bgColor="bg-brown"
              subtitle="خلال الفترة المختارة"
            />
           <StatCard
              title="المدفوعات"
              value={cards.collectionsOut}
              icon={<Wallet className="text-white" />}
              bgColor="bg-brown"
              subtitle="خلال الفترة المختارة"
            />
            <StatCard
              title="شيكات مستحقة"
              value={cards.chequesDue}
              icon={<Receipt className="text-white" />}
              bgColor="bg-amber-500"
              subtitle="خلال الفترة المختارة"
            />
            <StatCard
              title="شيكات متأخرة"
              value={cards.chequesOverdue}
              icon={<AlertTriangle className="text-white" />}
              bgColor="bg-red-500"
              subtitle="تحتاج متابعة فورية"
            />
          </div>

          {/* Purchases Section */}
          <div className="mb-4">
            <h2 className="text-xl font-black text-dark mb-4">المشتريات خلال الفترة</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
              <PurchaseCard title="معدات" icon={<Package />} stats={cards.purchases?.equipment} />
              <PurchaseCard title="مستلزمات معدات" icon={<Boxes />} stats={cards.purchases?.equipmentSupply} />
              <PurchaseCard title="سلك" icon={<Cable />} stats={cards.purchases?.wire} />
              <PurchaseCard title="شكاير" icon={<ShoppingBag />} stats={cards.purchases?.bag} />
            </div>
          </div>

          {/* Notifications Section */}
          <div className="mb-4">
            <h2 className="text-xl font-black text-dark mb-4">التنبيهات</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <NotificationList
                title="شيكات مستحقة اليوم"
                icon={<Receipt size={20} />}
                color="amber"
                items={notifications.chequesDueToday}
                emptyText="لا توجد شيكات مستحقة اليوم"
                renderItem={(c) => (
                  <>
                    <span className="font-bold text-dark">شيك رقم {c.chequeNumber}</span>
                    <span className="text-gray-500">{c.ownerName || 'غير محدد'}</span>
                    <span className="font-black">{c.amount?.toLocaleString()} ج.م</span>
                    <span className='text-blue-400 cursor-pointer' onClick={ ()=>navigate(`/cheque/${c.id}`)}> <EyeIcon className="text-blue-700"/> </span>
                  </>
                )}
              />

              <NotificationList
                title="شيكات متأخرة"
                icon={<AlertTriangle size={20} />}
                color="red"
                items={notifications.chequesOverdue}
                emptyText="لا توجد شيكات متأخرة"
                renderItem={(c) => (
                  <>
                    <span className="font-bold text-dark">شيك رقم {c.chequeNumber}</span>
                    <span className="text-gray-500">{c.ownerName || 'غير محدد'}</span>
                    <span className="font-black">{c.amount?.toLocaleString()} ج.م</span>
                    <span className='text-blue-400 cursor-pointer' onClick={ ()=>navigate(`/cheque/${c.id}`)}> <EyeIcon className="text-blue-700"/> </span>
                  </>
                )}
              />

              {/* <NotificationList
                title="معدات تحت الصيانة"
                icon={<Wrench size={20} />}
                color="blue"
                items={notifications.maintenanceInProgress}
                emptyText="لا توجد معدات تحت الصيانة حاليًا"
                renderItem={(m) => (
                  <>
                    <span className="font-bold text-dark">{m.equipmentName || 'معدة غير مسماة'}</span>
                    <span className="text-gray-500">{m.maintenanceProvider}</span>
                    <span className="text-xs text-gray-400">{m.supplierName}</span>
                  </>
                )}
              /> */}

              {/* <NotificationList
                title="فواتير مشتريات غير مسددة"
                icon={<FileWarning size={20} />}
                color="orange"
                items={notifications.unpaidInvoices}
                emptyText="لا توجد فواتير متبقية"
                renderItem={(inv) => (
                  <>
                    <span className="font-bold text-dark">{inv.moduleLabel} {inv.invoiceNumber ? `#${inv.invoiceNumber}` : ''}</span>
                    <span className="text-gray-500">{inv.supplierName || inv.equipmentName || ''}</span>
                    <span className="font-black">متبقي {inv.remainingAmount?.toLocaleString()} ج.م</span>
                  </>
                )}
              /> */}
            </div>
          </div>

          {/* Backup Status Card */}
          <div className='mt-10'>
            <div className="bg-white p-8 rounded-[1.5rem] border border-gray-200 shadow-sm relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 ${isLastBackup ? 'bg-green-50' : 'bg-orange-50'} rounded-2xl`}>
                      <Cloud size={32} className={isLastBackup ? 'text-green-600' : 'text-orange-500'} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-dark">النسخ الاحتياطي السحابي</h3>
                      <p className="text-gray-400 font-bold text-sm">تأمين بيانات النظام على Cloud</p>
                    </div>
                  </div>
                  <span className={`px-4 py-1 rounded-full text-xs font-black ${isLastBackup ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {isLastBackup ? 'متصل وآمن' : 'غير متصل'}
                  </span>
                </div>

                {isLastBackup ? (
                  <div className="space-y-4">
                    <h2 className="text-4xl font-black text-dark mb-2">
                      البيانات محمية <span className="text-green-600">بنجاح</span>
                    </h2>
                    <div className="flex items-center gap-2 text-gray-500 font-bold bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-200">
                      <CheckCircle size={20} className="text-green-600" />
                      يتم رفع النسخ التلقائية يوميًا دون تدخل منك.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h2 className="text-4xl font-black text-red-600 mb-2">
                      تنبيه: حماية <span className="text-dark">معطلة</span>
                    </h2>
                    <p className="text-gray-500 font-bold text-sm leading-relaxed">
                      النظام لا يقوم بالنسخ الاحتياطي حاليًا. يرجى ربط حسابك لتجنب فقدان البيانات في حالة الطوارئ.
                    </p>
                    <a
                      href="/setting"
                      className="inline-flex items-center gap-2 bg-dark text-white px-6 py-3 rounded-xl font-black hover:bg-opacity-90 transition-all active:scale-95 shadow-lg shadow-gray-200"
                    >
                      <Settings size={18} />
                      ربط الحساب من الإعدادات
                    </a>
                  </div>
                )}
              </div>
              <CloudLightning
                className={`absolute -left-10 -bottom-10 w-48 h-48 opacity-5 ${isLastBackup ? 'text-green-600' : 'text-red-600'}`}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ===== مكون عرض الماليات =====
const MoneyView = ({ moneyData, loadingMoney, onRefresh }) => {
  if (loadingMoney && !moneyData) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-accent" />
      </div>
    );
  }

  if (!moneyData) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <p className="text-gray-400 font-bold">لا توجد بيانات مالية</p>
      </div>
    );
  }

  const { customers, suppliers } = moneyData;

  return (
    <div className="animate-fadeIn">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* العملاء */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <UsersRound size={24} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-dark">العملاء</h3>
                <p className="text-sm text-gray-400 font-bold">إجمالي: {customers.total}</p>
              </div>
            </div>
            <button 
              onClick={onRefresh}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw size={18} className="text-gray-400" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 p-4 rounded-xl border border-green-100">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={16} className="text-green-600" />
                <span className="text-xs font-bold text-green-700">لهم فلوس</span>
              </div>
              <p className="text-2xl font-black text-green-600">
                {customers.haveMoneyCount}
              </p>
              <p className="text-sm font-bold text-green-600 mt-1">
                {customers.haveMoneyAmount.toLocaleString()} ج.م
              </p>
            </div>
            
            <div className="bg-red-50 p-4 rounded-xl border border-red-100">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown size={16} className="text-red-600" />
                <span className="text-xs font-bold text-red-700">عليهم فلوس</span>
              </div>
              <p className="text-2xl font-black text-red-600">
                {customers.debtCount}
              </p>
              <p className="text-sm font-bold text-red-600 mt-1">
                {customers.debtAmount.toLocaleString()} ج.م
              </p>
            </div>
          </div>
        </div>

        {/* التجار */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-xl">
                <UsersRound size={24} className="text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-dark">التجار</h3>
                <p className="text-sm text-gray-400 font-bold">إجمالي: {suppliers.total}</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 p-4 rounded-xl border border-green-100">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={16} className="text-green-600" />
                <span className="text-xs font-bold text-green-700">لهم فلوس</span>
              </div>
              <p className="text-2xl font-black text-green-600">
                {suppliers.haveMoneyCount}
              </p>
              <p className="text-sm font-bold text-green-600 mt-1">
                {suppliers.haveMoneyAmount.toLocaleString()} ج.م
              </p>
            </div>
            
            <div className="bg-red-50 p-4 rounded-xl border border-red-100">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown size={16} className="text-red-600" />
                <span className="text-xs font-bold text-red-700">عليهم فلوس</span>
              </div>
              <p className="text-2xl font-black text-red-600">
                {suppliers.debtCount}
              </p>
              <p className="text-sm font-bold text-red-600 mt-1">
                {suppliers.debtAmount.toLocaleString()} ج.م
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Customers Detailed */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-6">
            <Wallet size={20} className="text-blue-600" />
            <h3 className="text-lg font-black text-dark">تفاصيل العملاء</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-bold text-gray-600">إجمالي العملاء</span>
              <span className="font-black text-dark">{customers.total}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100">
              <div className="flex items-center gap-2">
                <UserCheck size={16} className="text-green-600" />
                <span className="font-bold text-green-700">لهم فلوس</span>
              </div>
              <div className="text-left">
                <span className="font-black text-green-600 block">{customers.haveMoneyCount}</span>
                <span className="text-xs text-green-500">{customers.haveMoneyAmount.toLocaleString()} ج.م</span>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center gap-2">
                <UserX size={16} className="text-red-600" />
                <span className="font-bold text-red-700">عليهم فلوس</span>
              </div>
              <div className="text-left">
                <span className="font-black text-red-600 block">{customers.debtCount}</span>
                <span className="text-xs text-red-500">{customers.debtAmount.toLocaleString()} ج.م</span>
              </div>
            </div>
          </div>
        </div>

        {/* Suppliers Detailed */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-6">
            <Wallet size={20} className="text-orange-600" />
            <h3 className="text-lg font-black text-dark">تفاصيل التجار</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-bold text-gray-600">إجمالي التجار</span>
              <span className="font-black text-dark">{suppliers.total}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100">
              <div className="flex items-center gap-2">
                <UserCheck size={16} className="text-green-600" />
                <span className="font-bold text-green-700">لهم فلوس</span>
              </div>
              <div className="text-left">
                <span className="font-black text-green-600 block">{suppliers.haveMoneyCount}</span>
                <span className="text-xs text-green-500">{suppliers.haveMoneyAmount.toLocaleString()} ج.م</span>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center gap-2">
                <UserX size={16} className="text-red-600" />
                <span className="font-bold text-red-700">عليهم فلوس</span>
              </div>
              <div className="text-left">
                <span className="font-black text-red-600 block">{suppliers.debtCount}</span>
                <span className="text-xs text-red-500">{suppliers.debtAmount.toLocaleString()} ج.م</span>
              </div>
            </div>
          </div>
        </div>
      </div>

  
    </div>
  );
};

// ===== Sub-components =====

// Sub-component for main stats
const StatCard = ({ title, value, icon, bgColor, subtitle }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-300 flex items-center gap-5 hover:translate-y-[-5px] transition-all duration-300">
    <div className={`p-4 ${bgColor} rounded-xl shadow-lg`}>
      {React.cloneElement(icon, { size: 28 })}
    </div>
    <div className="text-right">
      <p className="text-gray-400 font-bold text-xs mb-1">{title}</p>
      <h3 className="text-2xl font-black text-dark">{(value ?? 0).toLocaleString()}</h3>
      {subtitle && <p className="text-[10px] text-brown font-bold mt-1">{subtitle}</p>}
    </div>
  </div>
);

// Sub-component for purchase category cards
const PurchaseCard = ({ title, icon, stats }) => {
  const count = stats?.count || 0;
  const totalAmount = stats?.totalAmount || 0;
  const remainingAmount = stats?.remainingAmount || 0;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-300">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-[#215E6122] rounded-lg text-accent">
          {React.cloneElement(icon, { size: 20 })}
        </div>
        <h4 className="font-black text-dark">{title}</h4>
      </div>
      <p className="text-3xl font-black text-dark mb-3">{count.toLocaleString()} <span className="text-xs font-bold text-gray-400">فاتورة</span></p>
      <div className="flex justify-between text-xs font-bold border-t border-dashed border-gray-200 pt-3">
        <span className="text-gray-500">الإجمالي:</span>
        <span className={'text-green-600'}>
          {totalAmount.toLocaleString()}ج.م
        </span>
      </div>
    </div>
  );
};

// Sub-component for notification lists
const COLOR_MAP = {
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' },
  red: { bg: 'bg-red-50', text: 'text-red-600', badge: 'bg-red-100 text-red-700' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-700' },
};

const NotificationList = ({ title, icon, color, items = [], emptyText, renderItem }) => {
  const c = COLOR_MAP[color] || COLOR_MAP.amber;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 ${c.bg} rounded-lg ${c.text}`}>{icon}</div>
          <h4 className="font-black text-dark">{title}</h4>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-black ${c.badge}`}>{items.length}</span>
      </div>

      {items.length === 0 ? (
        <p className="text-gray-400 font-bold text-sm text-center py-4">{emptyText}</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {items.map((item, idx) => (
            <div key={item.id || idx} className="flex items-center justify-between bg-ligth rounded-lg p-3 text-sm gap-2">
              {renderItem(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;