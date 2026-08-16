import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { showAlert } from "../../services/alert";
import {
  Truck,
  UsersRound,
  Calendar,
  RefreshCw,
  Loader2,
  Cloud,
  CheckCircle,
  CloudLightning,
  Settings,
  Receipt,
  AlertTriangle,
  Bell,
  TrendingUp,
  TrendingDown,
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
  const [moneyData, setMoneyData] = useState(null);
  const [loadingMoney, setLoadingMoney] = useState(false);
  const [isLastBackup, setIsLastBackup] = useState(true);
  const navigate = useNavigate();

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

  const MakeSureIsLastBackup = async () => {
    const res = await isLastBackupValid();
    setIsLastBackup(res);
  };

  useEffect(() => {
    MakeSureIsLastBackup();
    fetchMoneyData();
  }, []);

  useEffect(() => {
    if (filters.period !== 'custom') fetchDashboardData();
  }, [filters.period]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (!data) return (
    <div className="min-h-screen bg-ligth flex items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin text-accent" />
    </div>
  );

  const { greeting, summaryLine, cards, notifications } = data;
  const customers = moneyData?.customers;

  return (
    <div className="min-h-screen bg-ligth p-4 md:p-8" dir="rtl">

      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black text-dark">لوحة التحكم</h1>
          <p className="text-gray-500 font-bold">{greeting}</p>
        </div>

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

      {/* Quick summary line */}
      <div className="bg-white border border-[#E0E7D0] rounded-xl p-4 mb-8 flex items-center gap-3 shadow-sm">
        <div className="p-2 bg-[#215E6122] rounded-lg text-accent shrink-0">
          <Bell size={20} />
        </div>
        <p className="font-bold text-dark">{summaryLine}</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="تجار تم التعامل معهم"
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
          title="تجار لهم فلوس"
          value={loadingMoney ? "..." : `${(customers?.haveMoneyAmount || 0).toLocaleString()} ج.م`}
          count={loadingMoney ? null : `${customers?.haveMoneyCount || 0} تجار`}
          icon={<TrendingUp className="text-white" />}
          bgColor="bg-green-600"
          subtitle="إجمالي مستحقات التجار"
        />
        <StatCard
          title="تجار عليهم فلوس"
          value={loadingMoney ? "..." : `${(customers?.debtAmount || 0).toLocaleString()} ج.م`}
          count={loadingMoney ? null : `${customers?.debtCount || 0} تجار`}
          icon={<TrendingDown className="text-white" />}
          bgColor="bg-red-500"
          subtitle="إجمالي المديونيات"
        />
      </div>

      {/* Notifications Section - Compact & Side-by-side */}
      <div className="mb-8">
        <h2 className="text-lg font-black text-dark mb-3">التنبيهات</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NotificationList
            title="شيكات مستحقة اليوم"
            icon={<Receipt size={16} />}
            color="amber"
            items={notifications.chequesDueToday}
            emptyText="لا توجد شيكات مستحقة اليوم"
            renderItem={(c) => (
              <>
                <div className="flex items-center gap-2 truncate">
                  <span className="font-bold text-dark whitespace-nowrap">شيك #{c.chequeNumber}</span>
                  <span className="text-gray-400 text-xs truncate">({c.ownerName || 'غير محدد'})</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-black text-dark text-xs">{c.amount?.toLocaleString()} ج.م</span>
                  <button 
                    onClick={() => navigate(`/cheque/${c.id}`)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <EyeIcon size={16} />
                  </button>
                </div>
              </>
            )}
          />

          <NotificationList
            title="شيكات متأخرة"
            icon={<AlertTriangle size={16} />}
            color="red"
            items={notifications.chequesOverdue}
            emptyText="لا توجد شيكات متأخرة"
            renderItem={(c) => (
              <>
                <div className="flex items-center gap-2 truncate">
                  <span className="font-bold text-dark whitespace-nowrap">شيك #{c.chequeNumber}</span>
                  <span className="text-gray-400 text-xs truncate">({c.ownerName || 'غير محدد'})</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-black text-dark text-xs">{c.amount?.toLocaleString()} ج.م</span>
                  <button 
                    onClick={() => navigate(`/cheque/${c.id}`)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <EyeIcon size={16} />
                  </button>
                </div>
              </>
            )}
          />
        </div>
      </div>

      {/* Backup Status Card */}
      <div className='mt-8'>
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

    </div>
  );
};

// Sub-component for main stats
const StatCard = ({ title, value, count, icon, bgColor, subtitle }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-300 flex items-center gap-5 hover:translate-y-[-2px] transition-all duration-300">
    <div className={`p-4 ${bgColor} rounded-xl shadow-lg shrink-0`}>
      {React.cloneElement(icon, { size: 28 })}
    </div>
    <div className="text-right">
      <p className="text-gray-400 font-bold text-xs mb-1">{title}</p>
      <h3 className="text-xl font-black text-dark">{typeof value === 'number' ? value.toLocaleString() : value}</h3>
      {count && <p className="text-xs font-black text-accent mt-0.5">{count}</p>}
      {subtitle && <p className="text-[10px] text-brown font-bold mt-1">{subtitle}</p>}
    </div>
  </div>
);

// Sub-component for notification lists - Compact Version
const COLOR_MAP = {
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' },
  red: { bg: 'bg-red-50', text: 'text-red-600', badge: 'bg-red-100 text-red-700' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-700' },
};

const NotificationList = ({ title, icon, color, items = [], emptyText, renderItem }) => {
  const c = COLOR_MAP[color] || COLOR_MAP.amber;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-3.5 flex flex-col h-44">
      <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 ${c.bg} rounded-md ${c.text}`}>{icon}</div>
          <h4 className="font-black text-dark text-sm">{title}</h4>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${c.badge}`}>{items.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-400 font-bold text-xs">{emptyText}</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {items.map((item, idx) => (
              <div key={item.id || idx} className="flex items-center justify-between bg-ligth rounded-lg px-2.5 py-1.5 text-xs gap-2">
                {renderItem(item)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;