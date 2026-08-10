import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CashBoxAudit = () => {
    const [transactions, setTransactions] = useState([]);
    const [filters, setFilters] = useState({ type: '', from: '', to: '', searchTerm: '' });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const { type, from, to } = filters;
            const res = await api.get('/box/transaction/All', {
                params: { type, from, to }
            });
            setTransactions(res.data.transactions);
        } catch (err) {
            console.error("Error fetching transactions:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [filters.type, filters.from, filters.to]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    // 1. فلترة وتصفية البيانات أولاً لاستبعاد أي حركة إجمالية تساوي صفر
    const nonZeroTransactions = transactions.filter(tr => tr.totalAmount > 0);

    // 2. تطبيق فلترة البحث المحلي على الحركات النشطة فقط
    const filteredTransactions = nonZeroTransactions.filter(tr => {
        const supplierName = tr.supplierId?.name?.toLowerCase() || "";
        const note = tr.note?.toLowerCase() || "";
        const search = filters.searchTerm.toLowerCase();

        const hasTitle = tr.items?.some(item =>
            item.title?.toLowerCase().includes(search)
        );

        return (
            supplierName.includes(search) ||
            note.includes(search) ||
            hasTitle
        );
    });

    // حساب الإجماليات بناءً على الحركات المفلترة (والتي لا تحتوي على أصفار)
    const totalIncome = filteredTransactions.reduce((acc, curr) => {
        if (curr.type == "income") {
            acc += curr.totalAmount;
        }
        return acc;
    }, 0);

    const totalOutCome = filteredTransactions.reduce((acc, curr) => {
        if (curr.type != "income") {
            acc += curr.totalAmount;
        }
        return acc;
    }, 0);

    const translateCategory = (cat) => {
        const categories = {
            supplier: "تاجر",
            expense: "مصاريف عامة",
            delivery: "فلوس نقلة للتاجر",
            carPayment: "نولون",
            teaForWorker: "شاي العمال",
            AddHand: "إضافة فلوس يدوي",
            income: "استلام فلوس من العامل ",
            advance: "سلفة مالية",
            food: "مسحوبات وجبة",
            discount: "خصم",
            salary: "صرف رواتب العمال",
            other: "أخرى",
            cheque:"شيك",
              equipment:"شراء معدات",
                  import:"استيراد",
    export:"تصدير",
    maintenance:"صيانة",
        };
        return categories[cat] || cat;
    };

    return (
        <div className="p-4 md:p-8 min-h-screen max-w-[100vw]" dir="rtl">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h2 className="text-3xl font-black text-dark tracking-tight">جرد الخزنة</h2>
                    <p className="text-green opacity-70 font-medium tracking-wide">متابعة دقيقة لكافة الحركات التاجرين والمصاريف</p>
                </div>

                <div onClick={() => navigate("/treasury/print")} className='flex text-white bg-dark p-2 rounded-md shadow-md hover:bg-light hover:text-dark cursor-pointer items-center gap-x-2 text-xl font-bold'>
                    <span> <Printer size={20}/> </span>طباعه
                </div>

                <div className="bg-white px-6 py-3 rounded-xl text-dark font-bold -sm">
                    {new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white p-8 rounded-xl border -sm hover:-md transition-all flex flex-col items-center">
                    <span className="bg-green/10 text-green px-4 py-1 rounded-full text-xs font-bold mb-3">إجمالي الداخل</span>
                    <h3 className="text-4xl font-black text-green">{totalIncome?.toLocaleString()} <span className="text-sm font-bold text-dark/30 mr-1">ج.م</span></h3>
                </div>
                <div className="bg-white p-8 rounded-xl border -sm hover:-md transition-all flex flex-col items-center">
                    <span className="bg-orange/10 text-orange px-4 py-1 rounded-full text-xs font-bold mb-3">إجمالي الخارج</span>
                    <h3 className="text-4xl font-black text-orange">{totalOutCome?.toLocaleString()} <span className="text-sm font-bold text-dark/30 mr-1">ج.م</span></h3>
                </div>
                {filters.from == "" && filters.searchTerm == "" && filters.to == "" && filters.type == "" && (
                    <div className="bg-dark p-8 rounded-xl -lg hover:-xl transition-all flex flex-col items-center transform md:scale-105">
                        <span className="bg-white/10 text-light px-4 py-1 rounded-full text-xs font-bold mb-3">الرصيد الحالي</span>
                        <h3 className="text-4xl font-black text-white">{(totalIncome - totalOutCome)?.toLocaleString()} <span className="text-sm font-bold text-orange mr-1">ج.م</span></h3>
                    </div>
                )}
            </div>

            {/* Filter Section */}
            <div className="bg-white p-5 rounded-xl mb-8 -sm flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="text-[10px] font-black text-dark/40 uppercase mr-2 mb-1 block">بحث باسم التاجر / البيان</label>
                    <input 
                        type="text"
                        name="searchTerm"
                        placeholder="اكتب الاسم هنا..."
                        value={filters.searchTerm}
                        onChange={handleFilterChange}
                        className="w-full bg-light border-none rounded-xl p-3 text-dark font-bold text-sm focus:ring-2 focus:ring-green outline-none"
                    />
                </div>
                <div className="w-40">
                    <label className="text-[10px] font-black text-dark/40 uppercase mr-2 mb-1 block">نوع الحركة</label>
                    <select name="type" value={filters.type} onChange={handleFilterChange} className="w-full bg-light border-none rounded-xl p-3 text-dark font-bold text-sm focus:ring-2 focus:ring-green outline-none appearance-none cursor-pointer">
                        <option value="">الكل</option>
                        <option value="income">داخل</option>
                        <option value="expense">خارج</option>
                    </select>
                </div>
                <div className="w-44">
                    <label className="text-[10px] font-black text-dark/40 uppercase mr-2 mb-1 block">من تاريخ</label>
                    <input type="date" name="from" value={filters.from} onChange={handleFilterChange} className="w-full bg-light border-none rounded-xl p-3 text-dark font-bold text-sm outline-none" />
                </div>
                <div className="w-44">
                    <label className="text-[10px] font-black text-dark/40 uppercase mr-2 mb-1 block">إلى تاريخ</label>
                    <input type="date" name="to" value={filters.to} onChange={handleFilterChange} className="w-full bg-light border-none rounded-xl p-3 text-dark font-bold text-sm outline-none" />
                </div>
                <button onClick={() => setFilters({type: '', from: '', to: '', searchTerm: ''})} className="h-[46px] px-6 bg-orange/10 text-orange font-black text-xs rounded-xl hover:bg-orange hover:text-white transition-all">إعادة ضبط</button>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-xl -sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="bg-dark text-light">
                                <th className="p-6 font-bold text-xs">التاريخ والوقت</th>
                                <th className="p-6 font-bold text-xs">نوع الحركة</th>
                                <th className="p-6 font-bold text-xs">اسم التاجر / المستلم</th>
                                <th className="p-6 font-bold text-xs">القيمة</th>
                                <th className="p-6 font-bold text-xs">ملاحظات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-light">
                            {loading ? (
                                <tr><td colSpan="5" className="p-20 text-center text-green font-bold animate-pulse text-xl">جاري التحميل...</td></tr>
                            ) : filteredTransactions.length > 0 ? (
                                filteredTransactions.map((tr) => (
                                    <tr key={tr._id} className="hover:bg-light/20 transition-colors group">
                                        {/* التاريخ والوقت */}
                                        <td className="p-6">
                                            <div className="text-dark font-bold text-sm">{new Date(tr.date).toLocaleDateString('ar-EG')}</div>
                                            <div className="text-[10px] text-green font-medium">{new Date(tr.date).toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'})}</div>
                                        </td>
                                        {/* نوع الحركة */}
                                        <td className="p-6">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-black text-[11px] ${tr.type === 'income' ? 'bg-green/10 text-green' : 'bg-orange/10 text-orange'}`}>
                                                {tr.type === 'income' ? 'داخل ⬇' : 'خارج ⬆'}
                                            </div>
                                        </td>
                                        {/* اسم التاجر أو البيان */}
                                        <td className="p-6">
                                            {tr.supplierId ? (
                                                <div>
                                                    <div className="font-black text-dark text-sm">تاجر / {tr.supplierId.name}</div>
                                                    <div className="text-[10px] text-dark/40 font-bold tracking-widest">{tr.supplierId.phone}</div>
                                                </div>
                                            ) : tr.type !== 'income' ? (
                                                <div className="text-dark/50 font-bold text-sm italic">
                                                    {tr.items?.filter(e => e.amount > 0).map((e, index) => <span key={index}>{e.title} </span>)}
                                                </div>
                                            ) : (
                                                <div className="text-dark/50 font-bold text-sm italic">ادخال فلوس</div>
                                            )}
                                        </td>
                                        {/* القيمة الإجمالية */}
                                        <td className="p-6">
                                            <span className={`text-lg font-black ${tr.type === 'income' ? 'text-green' : 'text-orange'}`}>
                                                {tr.totalAmount.toLocaleString()} <span className="text-[10px] mr-1 opacity-50 text-dark">ج</span>
                                            </span>
                                        </td>
                                        {/* الملاحظات وتصنيف العناصر غير الصفرية */}
                                        <td className="p-6 max-w-xs">
                                            <div className="text-xs font-bold text-dark/70 mb-1">{tr.note || '---'}</div>
                                            <div className="flex flex-wrap gap-1">
                                                {tr.items?.filter(item => item.amount > 0).map((item, idx) => (
                                                    <span key={idx} className="bg-light text-[9px] px-2 py-0.5 rounded-md font-bold text-dark/60">
                                                        {item.title}: {item.amount}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="5" className="p-20 text-center text-dark/30 font-bold text-lg">لا توجد سجلات مطابقة للبحث</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CashBoxAudit;