import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Wallet, Receipt, Loader2, X, Info, Eye, Trash2, ArrowUpRight, ArrowDownLeft 
} from 'lucide-react';
import api from '../../services/api';
import { showAlert } from "../../services/alert";
import { showAlertConfirm } from "../../services/alertConfirm";

const MoneyBoxPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [selectedTx, setSelectedTx] = useState(null);
  const [balance, setBalance] = useState({ income: 0, expense: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(null);

  // خريطة ترجمة الفئات من الإنجليزية للعربية
  const categoryMap = {
    supplier: "تاجر مشتريات",
    	customer:"تاجر نقلات ",
    expense: "مصاريف عامة",
    delivery: " فلوس نقلة للتاجر",
    outdelivery: "   فلوس نقلة خارجية",
    carPayment: "نولون ",
    teaForWorker: "شاي العمال",
    AddHand: "إضافة فلوس يدوي",
     income: "استلام فلوس من العامل ",
     workerOut: "صرف فلوس للعامل",
    advance: "سلفة مالية",
    food: " اكل",
    discount: "خصم",
    salary: "صرف رواتب العمال",
    other: "أخرى",
    cheque:"شيك",
    equipment:"شراء معدات",
    import:"استيراد",
    export:"تصدير",
    maintenance:"صيانة",
  };

  const [formData, setFormData] = useState({
    type: 'income',
    note: '',
    items: [{ title: '', category: 'AddHand', amount: '' }]
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [balRes, txRes] = await Promise.all([
        api.get('/box/balance'),
        api.get('/box/transactions')
      ]);
      setBalance(balRes.data);
      setTransactions(txRes.data.transactions);
      if (txRes.data.transactions.length > 0) {
        fetchTransactionDetails(txRes.data.transactions[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionDetails = async (id) => {
    setDetailsLoading(true);
    try {
      const res = await api.get(`/box/transactions/${id}`);
      setSelectedTx(res.data.transaction);
    } catch (err) {
      showAlert({ title: "خطأ", text: "تعذر جلب التفاصيل", icon: "error" });
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const addItemRow = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { title: '', category: 'AddHand', amount: '' }]
    });
  };

  const removeItemRow = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData({ ...formData, items: newItems });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/box/transactions', formData);
      showAlert({ title: "تمت العملية بنجاح", icon: "success" });
      setShowAddModal(false);
      resetForm();
      fetchInitialData();
    } catch (err) {
      showAlert({ title: "خطأ", text: "تأكد من البيانات", icon: "error" });
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'income',
      note: '',
      items: [{ title: '', category: 'AddHand', amount: '' }]
    });
    setIsEditing(null);
  };

  const handleDelete = async (id) => {
    const confirm = await showAlertConfirm({ title: "حذف العملية؟", text: "سيتم حذف السجل نهائياً", icon: "warning" });
    if (confirm.isConfirmed) {
      try {
        await api.delete(`/box/transactions/${id}`);
        setSelectedTx(null);
        fetchInitialData();
      } catch (err) {
        showAlert({ title: "خطأ", icon: "error" });
      }
    }
  };

  return (
    <div className="min-h-screen max-w-[100vw] text-dark" dir="rtl">
      
      {/* 1. Header & Balance */}
      <div className="bg-dark text-light p-6 shadow-2xl">
        <div className=" mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-brown p-3 rounded-xl">
              <Wallet size={30} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black">خزنة المصنع</h1>
              <p className="text-light/50 text-xs">إدارة الداخل  والمصروفات</p>
            </div>
          </div>
          
          <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
             <BalanceMiniCard label="الرصيد الحالي" value={balance.balance} color="white" />
             <BalanceMiniCard label="الداخل " value={balance.income} color="white" />
             <BalanceMiniCard label="المصروف/الخارج" value={balance.expense} color="white" />
          </div>

          <button 
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="bg-brown hover:scale-105 active:scale-95 text-white px-6 py-3 rounded-xl font-black transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={20} /> إضافة فلوس
          </button>
        </div>
      </div>

      {/* 2. Navigation Bar (Horizontal Scroll with Eye Icon) */}
      <div className=" xl:max-w-[85vw] overflow-auto bg-white border-b border-accent/10 sticky top-0 z-10 shadow-sm">
        <div className=" mx-auto px-4 py-3">
          <div className="flex gap-3 cursor-pointer overflow-x-auto pb-2 no-scrollbar">
            {loading ? (
              <div className="flex gap-3 animate-pulse">
                {[1,2,3,4].map(i => <div key={i} className="h-16 w-48 bg-gray-100 rounded-xl"></div>)}
              </div>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx._id}
                  onClick={()=>fetchTransactionDetails(tx._id)}  
                  className={`flex-shrink-0 border-1 border-slate-200 w-52 p-3 rounded-xl border-2 transition-all relative group ${
                    selectedTx?._id === tx._id 
                    ? 'border-brown bg-brown/5' 
                    : 'border-transparent bg-light/40 hover:border-accent/20'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                      tx.type === 'income' ? 'bg-accent text-white' : 'bg-red-500 text-white'
                    }`}>
                      {tx.type === 'income' ? 'مدخلات' : 'مصاريف'}
                    </span>
                    {/* <button 
                      onClick={() => fetchTransactionDetails(tx._id)}
                      className={`p-1.5 rounded-lg transition-all ${selectedTx?._id === tx._id ? 'bg-brown text-white' : 'bg-dark/10 text-dark hover:bg-dark hover:text-white'}`}
                    >
                      <Eye size={14} />
                    </button> */}

                                <div className="font-black text-dark text-sm truncate">
                    {tx.totalAmount?.toLocaleString()} <small>ج.م</small>
                  </div>
                  </div>
      
                  <div className="text-[10px] text-dark/40 mt-1">{new Date(tx.date).toLocaleDateString('ar-EG')}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3. Details Area */}
      <div className=" mx-auto p-6 grid grid-cols-1 lg:grid-cols-1 gap-6">
        <div className="lg:col-span-2">
          {detailsLoading ? (
            <div className=" flex flex-col items-center justify-center bg-white rounded-2xl border-2 border-dashed border-accent/20">
              <Loader2 className="animate-spin text-brown mb-4" size={40} />
              <p className="text-accent font-bold italic">جاري تحميل البيانات...</p>
            </div>
          ) : selectedTx ? (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6  border border-2 shadow-sm relative overflow-hidden">

                
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-black text-dark mb-1">تفاصيل  </h2>
                  </div>
       {  selectedTx.type=="income"  && selectedTx.items[0].category =="AddHand"   &&    <button onClick={() => handleDelete(selectedTx._id)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all">
                    <Trash2 size={18} />
                  </button>}
                </div>

                <div className="">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="text-accent/50 text-[11px] font-black uppercase">
                        <th className="pb-4 border-b border-light pr-2">البند</th>
                        <th className="pb-4 border-b border-light">التصنيف</th>
                        <th className="pb-4 border-b border-light text-left pl-2">المبلغ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-light">
                      {selectedTx.items?.map((item, idx) => (
                       (typeof item.amount === 'number' && item.amount > 0) && (
                                <tr key={idx} className="group">
                          <td className="py-4 font-bold text-dark">{item.title || "بدون عنوان"}</td>
                          <td className="py-4">
                            <span className="text-[10px] bg-light px-2 py-1 rounded-md font-bold text-accent">
                              {categoryMap[item.category] || item.category}
                            </span>
                          </td>
                          <td className="py-4 text-left font-black text-dark">
                            {item.amount?.toLocaleString()} <small className="text-dark/30">ج.م</small>
                          </td>
                        </tr>
                      )))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="2" className="pt-6 font-black text-lg text-dark">الإجمالي النهائي</td>
                        <td className={`pt-6 text-left text-2xl font-black ${selectedTx.type === 'income' ? 'text-accent' : 'text-red-500'}`}>
                          {selectedTx.totalAmount?.toLocaleString()} <small className="text-sm">ج.م</small>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {selectedTx.note && (
                <div className="bg-brown/5 -4 border-brown p-4 rounded-xl flex gap-3 italic text-dark/70 text-sm">
                  <Info className="text-brown shrink-0" size={18} />
                  {selectedTx.note}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-dark/20 border-2 border-dashed border-dark/10 rounded-3xl">
              <Receipt size={60} strokeWidth={1} />
              <p className="mt-4 font-bold">يرجى الضغط على أيقونة العين بالأعلى</p>
            </div>
          )}
        </div>

        {/* الجانب الأيسر (معلومات إضافية) */}
        <div className="space-y-4">

           
           {selectedTx && (
             <div className="bg-white p-6 rounded-3xl border border-accent/10">
                <p className="text-[10px] font-black text-dark/30 mb-4 uppercase">سجل المراجعة</p>
                  <div className="space-y-4">
                    <InfoRow 
                      label="تاريخ السند" 
                      value={new Date(selectedTx.date).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })} 
                    />
                    <InfoRow 
                      label="وقت الإدخال" 
                      value={new Date(selectedTx.date).toLocaleTimeString('ar-EG', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true // يعرض صباحاً/مساءً بشكل صحيح، إذا كنت تفضل نظام 24 ساعة اجعلها false
                      })} 
                    />
                  </div>
             </div>
           )}
        </div>
      </div>

      {/* 4. Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-light border-b border-accent/5 flex justify-between items-center">
              <h2 className="text-xl font-black text-dark flex items-center gap-2">
                <Plus className="text-brown" /> إضافة فلوس 
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-dark/40 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-6 ">
              {/* <div className="grid grid-cols-1 gap-4 text-md"> */}
                {/* <TypeButton 
                  active={formData.type === 'income'} 
                  onClick={() => setFormData({...formData, type: 'income'})}
                  label=" دخل" 
                  disabled={true}
                  color="accent"
                  icon={<ArrowUpRight size={20}/>}
                /> */}
                {/* <TypeButton 
                  active={formData.type === 'expense'} 
                  onClick={() => setFormData({...formData, type: 'expense'})}
                  label=" مصروف" 
                  color="red-500"
                  icon={<ArrowDownLeft size={20}/>}
                /> */}
              {/* </div> */}

              <div className="space-y-4 max-h-[350px] overflow-y-auto pl-2 custom-scrollbar">
                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-end bg-light/30 p-4 rounded-xl border border-accent/5 group">
                    <div className="col-span-5 space-y-1">
                      <label className="text-[10px] font-black text-dark/40 mr-2">وصف البند</label>
                      <input 
                        required
                        className="w-full bg-white rounded-xl p-3 text-sm border-none focus:ring-2 focus:ring-brown shadow-sm"
                        placeholder=" اضف اسم البند"
                        value={item.title}
                        onChange={(e) => handleItemChange(index, 'title', e.target.value)}
                      />
                    </div>
                    {/* <div className="col-span-4 space-y-1">
                      <label className="text-[10px] font-black text-dark/40 mr-2">التصنيف</label>
                      <select 
                        className="w-full bg-white rounded-xl p-3 text-sm border-none focus:ring-2 focus:ring-brown shadow-sm font-bold"
                        value={item.category}
                        onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                      >
                        {Object.entries(categoryMap).map(([key, val]) => (
                          <option key={key} value={key}>{val}</option>
                        ))}
                      </select>
                    </div> */}
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] font-black text-dark/40 mr-2">المبلغ</label>
                      <input 
                        type="number"
                        required
                        placeholder='المبلغ'
                        className="w-full bg-white rounded-xl p-3 text-sm border-none focus:ring-2 focus:ring-brown shadow-sm font-black text-brown"
                        value={item.amount}
                        onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                      />
                    </div>
                    <div className="col-span-1">
                      {formData.items.length > 1 && (
                        <button type="button" onClick={() => removeItemRow(index)} className="p-3 text-red-400 hover:text-red-600 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button 
                type="button" 
                onClick={addItemRow}
                className="w-full py-3 border-2 border-dashed border-accent/20 rounded-xl text-accent font-black hover:bg-accent/5 transition-all text-sm"
              >
                + إضافة بند فرعي جديد
              </button>

              <div className="pt-4 flex gap-4">
                <button type="submit" className="flex-1 bg-dark text-white py-4 rounded-xl font-black hover:bg-black transition-all shadow-xl shadow-dark/20">
                  حفظ وتسجيل السند
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// مكونات صغيرة مساعدة
const BalanceMiniCard = ({ label, value, color }) => (
  <div className="bg-white/5 backdrop-blur-lg px-5 py-3 rounded-xl border border-white/10 flex-1 min-w-[140px] shadow-inner">
    <p className="text-[10px] font-black uppercase opacity-40 mb-1">{label}</p>
    <p className={`text-xl font-black text-${color}`}>
      {value?.toLocaleString()} <small className="text-[10px] opacity-60">ج.م</small>
    </p>
  </div>
);

const TypeButton = ({ active, onClick, label, icon, color }) => (
  <button 
    type="button"
    onClick={onClick}
    className={`p-4 rounded-xl border-2 transition-all font-black flex items-center justify-center gap-3 ${
      active ? `border-${color} bg-${color}/10 text-${color}` : 'border-light text-dark/30 hover:border-dark/10'
    }`}
  >
    {icon} {label}
  </button>
);

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-center text-xs border-b border-light pb-2">
    <span className="text-dark/40 font-bold">{label}</span>
    <span className="text-dark font-black">{value}</span>
  </div>
);

export default MoneyBoxPage;