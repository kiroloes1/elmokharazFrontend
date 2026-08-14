import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { showAlert } from "../../services/alert";
import { 
  Users, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Loader2,
  ArrowLeft,
  RefreshCw,
  UserCheck,
  UserX,
  DollarSign,
  PiggyBank,
  CreditCard,
  BarChart3
} from "lucide-react";

const MoneyDashboard = ({ onBack }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchMoneyData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reports/dashboard/money');
      if (response.data.success) {
        setData(response.data.data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      showAlert({ 
        title: "خطأ في تحميل بيانات الماليات", 
        icon: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMoneyData();
  }, []);

  if (loading && !data) return (
    <div className="min-h-screen bg-[#F5FBE6] flex items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin text-green" />
    </div>
  );

  if (!data) return null;

  const { customers, suppliers } = data;

  return (
    <div className="min-h-screen p-4 md:p-8" dir="rtl">
      
      {/* Header with Back Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 bg-white rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 transition-all active:scale-95"
          >
            <ArrowLeft size={20} className="text-dark" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-dark">الماليات</h1>
            <p className="text-gray-500 font-bold text-sm">
              نظرة عامة على المبالغ المستحقة للتجار والتجار
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-400 font-bold">
              آخر تحديث: {lastUpdated.toLocaleTimeString('ar-EG')}
            </span>
          )}
          <button
            onClick={fetchMoneyData}
            disabled={loading}
            className="flex items-center gap-2 bg-green text-white px-4 py-2 rounded-xl font-bold hover:bg-opacity-90 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            تحديث
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* التجار */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users size={24} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-dark">التجار</h3>
              <p className="text-sm text-gray-400 font-bold">إجمالي التجار: {customers.total}</p>
            </div>
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
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-orange-100 rounded-xl">
              <Users size={24} className="text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-dark">التجار</h3>
              <p className="text-sm text-gray-400 font-bold">إجمالي التجار: {suppliers.total}</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Customers Detailed Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-6">
            <Wallet size={20} className="text-blue-600" />
            <h3 className="text-lg font-black text-dark">تفاصيل التجار</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-bold text-gray-600">إجمالي التجار</span>
              <span className="font-black text-dark">{customers.total}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100">
              <div className="flex items-center gap-2">
                <UserCheck size={16} className="text-green-600" />
                <span className="font-bold text-green-700">تجار لهم فلوس</span>
              </div>
              <div className="text-left">
                <span className="font-black text-green-600 block">{customers.haveMoneyCount}</span>
                <span className="text-xs text-green-500">{customers.haveMoneyAmount.toLocaleString()} ج.م</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center gap-2">
                <UserX size={16} className="text-red-600" />
                <span className="font-bold text-red-700">تجار عليهم فلوس</span>
              </div>
              <div className="text-left">
                <span className="font-black text-red-600 block">{customers.debtCount}</span>
                <span className="text-xs text-red-500">{customers.debtAmount.toLocaleString()} ج.م</span>
              </div>
            </div>
          </div>
        </div>

        {/* Suppliers Detailed Card */}
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
                <span className="font-bold text-green-700">موردين لهم فلوس</span>
              </div>
              <div className="text-left">
                <span className="font-black text-green-600 block">{suppliers.haveMoneyCount}</span>
                <span className="text-xs text-green-500">{suppliers.haveMoneyAmount.toLocaleString()} ج.م</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center gap-2">
                <UserX size={16} className="text-red-600" />
                <span className="font-bold text-red-700">موردين عليهم فلوس</span>
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

export default MoneyDashboard;