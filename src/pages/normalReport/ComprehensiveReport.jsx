import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  TrendingUp,
  Wallet,
  DollarSign,
  Truck,
  Package,
  CreditCard,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
} from "lucide-react";
import api from "../../services/api";

const ComprehensiveReport = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // الفلاتر
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/reports/comprehensive", {
        params: { dateFrom, dateTo },
      });
      if (response.data?.success) {
        setData(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching comprehensive report:", err);
      setError("حدث خطأ أثناء جلب بيانات التقرير الشامل");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchReport();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500 font-semibold">
        جاري تحميل التقرير الشامل...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-center">
        {error}
      </div>
    );
  }

  const {
    monthlySummary,
    collections,
    goodsSummary,
    chequesSummary,
    traderAccounts,
    financials,
  } = data || {};

  return (
    <div className="p-6 bg-slate-50 min-h-screen text-slate-800 space-y-6" dir="rtl">
      {/* 1. Header & Date Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">التقرير الشامل (Overview Dashboard)</h1>
          <p className="text-sm text-slate-500 mt-1">
            ملخص الأداء المالي، النقلات، البضاعة، الشيكات وحسابات التجار في مكان واحد.
          </p>
        </div>

        <form onSubmit={handleFilterSubmit} className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-lg border border-slate-200 text-xs">
            <Calendar size={16} className="text-slate-500" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-transparent outline-none text-slate-700"
            />
            <span className="text-slate-400">إلى</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-transparent outline-none text-slate-700"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-medium transition"
          >
            <Filter size={14} /> تصفية
          </button>
        </form>
      </div>

      {/* 2. Top Summary Cards (كروت الملخص العلوي) */}
      <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-1 gap-4">
        {/* إجمالي قيمة النقلات */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">إجمالي قيمة النقلات</p>
            <h3 className="text-xl font-bold text-slate-900 mt-1">
              {monthlySummary?.totalDeliveryValue?.toLocaleString()} ج.م
            </h3>
            <p className="text-xs text-slate-400 mt-1">عدد النقلات: {monthlySummary?.deliveriesCount}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Truck size={24} />
          </div>
        </div>

        {/* المبالغ المحصلة */}
        {/* <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">إجمالي النقدية المحصلة</p>
            <h3 className="text-xl font-bold text-emerald-600 mt-1">
              {monthlySummary?.totalCollectedAmount?.toLocaleString()} ج.م
            </h3>
            <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
              <ArrowUpRight size={14} /> النقدية المدفوعة
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Wallet size={24} />
          </div>
        </div> */}

        {/* المتبقي ليد التجار */}
        {/* <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">المتبقي على النقلات</p>
            <h3 className="text-xl font-bold text-amber-600 mt-1">
              {monthlySummary?.netRemainingBalance?.toLocaleString()} ج.م
            </h3>
            <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
              <Clock size={14} /> آجـل / مستحق
            </p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <DollarSign size={24} />
          </div>
        </div> */}

        {/* النتيجة الصافية */}
        {/* <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">الصافي بعد المصاريف</p>
            <h3 className="text-xl font-bold text-indigo-600 mt-1">
              {financials?.netPeriodResult?.toLocaleString()} ج.م
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              المصاريف: {financials?.totalExpenses?.toLocaleString()} ج.م
            </p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <TrendingUp size={24} />
          </div>
        </div> */}
      </div>

      {/* 3. Main Grid (التحصيلات، البضاعة، الشيكات، التجار) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 3.1 جدول التحصيلات حسب طريقة الدفع */}
        {/* <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CreditCard size={18} className="text-emerald-600" /> طرق التحصيل والإيداعات
            </h2>
            <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">
              إجمالي: {collections?.totalCollected?.toLocaleString()} ج.م
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right text-slate-600">
              <thead className="text-xs text-slate-400 bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">طريقة الدفع</th>
                  <th className="py-2.5 px-3">المبلغ</th>
                  <th className="py-2.5 px-3 text-left">النسبة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {collections?.list?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 font-medium text-slate-800">{item.method}</td>
                    <td className="py-3 px-3">{item.amount?.toLocaleString()} ج.م</td>
                    <td className="py-3 px-3 text-left">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full"
                            style={{ width: `${Math.min(item.percentage, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-semibold text-slate-500">{item.percentage}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div> */}

        {/* 3.2 حركة البضاعة والأصناف */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Package size={18} className="text-blue-600" /> ملخص حركة البضاعة (الأصناف)
            </h2>
            <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
              وزن: {goodsSummary?.totalWeight?.toLocaleString()} كجم
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right text-slate-600">
              <thead className="text-xs text-slate-400 bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">الصنف</th>
                  <th className="py-2.5 px-3">الوزن الإجمالي</th>
                  <th className="py-2.5 px-3 text-left">القيمة الإجمالية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {goodsSummary?.items?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 font-medium text-slate-800">{item.itemName}</td>
                    <td className="py-3 px-3">{item.totalWeight?.toLocaleString()} كجم</td>
                    <td className="py-3 px-3 text-left font-semibold text-slate-800">
                      {item.totalPrice?.toLocaleString()} ج.م
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3.3 حالة وموقف الشيكات */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CreditCard size={18} className="text-amber-600" /> ملخص الشيكات
            </h2>
            <span className="text-xs text-slate-400">إجمالي العدد: {chequesSummary?.totalCount}</span>
          </div>

          <div className="space-y-3">
            {chequesSummary?.breakdown?.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  {item.status.includes("حصلها") ? (
                    <CheckCircle className="text-emerald-500" size={18} />
                  ) : item.status.includes("تحت") ? (
                    <Clock className="text-amber-500" size={18} />
                  ) : (
                    <XCircle className="text-red-500" size={18} />
                  )}
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{item.status}</p>
                    <p className="text-xs text-slate-400">{item.count} شيك</p>
                  </div>
                </div>
                <span className="font-bold text-slate-800 text-sm">
                  {item.totalAmount?.toLocaleString()} ج.م
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3.4 حسابات ومواقف التجار (عملاء وموردين) */}
        <div className="bg-white w-full p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users size={18} className="text-indigo-600" /> حسابات ومواقف التجار
            </h2>
            <span className="text-xs text-slate-400">
              إجمالي التجار: {traderAccounts?.activeTradersCount}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
              <p className="text-xs text-emerald-700 font-medium">مستحقات لنا (عند العملاء)</p>
              <p className="text-lg font-bold text-emerald-800 mt-1">
                {traderAccounts?.totalDueToUs?.toLocaleString()} ج.م
              </p>
            </div>

            
      
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-xs text-red-700 font-medium">مستحقات علينا ( للعملاء)</p>
              <p className="text-lg font-bold text-red-800 mt-1">
                {traderAccounts?.totalBalanceDueToCustomer?.toLocaleString()} ج.م
              </p>
            </div>

            
            {/* <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-xs text-red-700 font-medium">مستحقات علينا (للموردين)</p>
              <p className="text-lg font-bold text-red-800 mt-1">
                {traderAccounts?.totalDueFromUs?.toLocaleString()} ج.م
              </p>
            </div> */}
          </div>

          {/* <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">صافي موقف السوق (لنا / علينا):</span>
            <span
              className={`text-sm font-bold ${
                traderAccounts?.netPosition >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {traderAccounts?.netPosition?.toLocaleString()} ج.م
            </span>
          </div> */}
        </div>

      </div>
    </div>
  );
};

export default ComprehensiveReport;