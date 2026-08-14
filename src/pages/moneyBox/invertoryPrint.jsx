import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import html2pdf from "html2pdf.js";
import { Share2 } from "lucide-react";
import { useSystemSettings } from '../../context/shareInfo';

// دالة مساعدة للحصول على التاريخ الحالي والمحلي بصيغة YYYY-MM-DD بدون ترحيل الساعات
const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};


const CashBoxAuditPrint = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sharing, setSharing] = useState(false);
     const [currState,setCurrState]=useState("يومي"); 
    const [openingBalance, setOpeningBalance] = useState(0);
    const [closingBalance, setClosingBalance] = useState(0);

    // تجهيز تاريخ اليوم وتاريخ الغد تلقائياً لحماية السيرفر وجعل البحث يومي فوراً
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [filters, setFilters] = useState({ 
        type: '', 
        from: getLocalDateString(today), // تاريخ اليوم الحالي
        to: getLocalDateString(tomorrow),  // تاريخ الغد (ليشمل كل حركات اليوم بالباك إند)
        searchTerm: '' 
    });

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const { type, from, to } = filters;
            const res = await api.get('/box/transactions2', { params: { type, from, to } });
            
            setTransactions(res.data.transactions || []);
            setOpeningBalance(res.data.openingBalance || 0);
            setClosingBalance(res.data.closingBalance || 0);
        } catch (err) { 
            console.error(err); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [filters.type, filters.from, filters.to]);

    const handleManualPrint = () => {
        window.print();
    };

    const setTimeRange = (range) => {
        const currentToday = new Date();
        let fromDate = new Date();

        if (range === 'today') {
            fromDate = new Date(currentToday);
            setCurrState("يومي");
        } else if (range === 'month') {
            fromDate = new Date(currentToday.getFullYear(), currentToday.getMonth(), 1);
            setCurrState("شهري");
        } else if (range === 'year') {
            fromDate = new Date(currentToday.getFullYear(), 0, 1);
            setCurrState("سنوي");
        }

        const toDate = new Date(currentToday);
        toDate.setDate(toDate.getDate() + 1); 

           
 
        setFilters({
            ...filters,
            from: getLocalDateString(fromDate),
            to: getLocalDateString(toDate)
        });
    };

    const handleFilterChange = (e) => {
            
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const { settings } = useSystemSettings();

    // عند الضغط على إعادة ضبط، يرجع الفلتر لليوم الحالي لحماية السيرفر بدلاً من إفراغ الحقول
    const handleResetFilters = () => {
        const rToday = new Date();
        const rTomorrow = new Date(rToday);
        setCurrState("يومي");
        rTomorrow.setDate(rTomorrow.getDate() + 1);

        setFilters({
            type: '',
            from: getLocalDateString(rToday),
            to: getLocalDateString(rTomorrow),
            searchTerm: ''
        });
    };

    // تفكيك الحركات وفصل العناصر مع استبعاد القيم الصفرية
    const explodedTransactions = [];
    transactions.forEach(tr => {
        if (tr.items && tr.items.length > 0) {
            tr.items.forEach(item => {
                if (item.amount === 0) return;

                const cleanItemTitle = item.title ? item.title.split('|')[0].trim() : '';
                
                explodedTransactions.push({
                    _id: item._id || tr._id,
                    parent_id: tr._id,
                    date: tr.date,
                    type: tr.type,
                    displayName: tr.supplierId?.name || cleanItemTitle || "مصروف عام",
                    amount: item.amount,
                    note: tr.note,
                    itemTitle: item.title
                });
            });
        } else {
            const currentAmount = tr.totalAmount || tr.amount || 0;
            if (currentAmount > 0) {
                explodedTransactions.push({
                    _id: tr._id,
                    parent_id: tr._id,
                    date: tr.date,
                    type: tr.type,
                    displayName: tr.supplierId?.name || "مصروف عام",
                    amount: currentAmount,
                    note: tr.note,
                    itemTitle: ""
                });
            }
        }
    });

    const filteredTransactions = explodedTransactions.filter(tr => {
        const search = filters.searchTerm.toLowerCase();
        return (
            (tr.displayName || "").toLowerCase().includes(search) || 
            (tr.note || "").toLowerCase().includes(search) ||
            (tr.itemTitle || "").toLowerCase().includes(search)
        );
    });

    const totalIncome = filteredTransactions.reduce((acc, curr) => {
        return curr.type === "income" ? acc + curr.amount : acc;
    }, 0);

    const totalOutCome = filteredTransactions.reduce((acc, curr) => {
        return curr.type !== "income" ? acc + curr.amount : acc;
    }, 0);

    const handleSharePDF = async () => {
        const element = document.getElementById("invoice-capture");
        if (!element) return;

        const fileName = "report.pdf";
        const options = {
            margin: 10,
            filename: fileName,
            image: { type: "jpeg", quality: 1 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
        };

        try {
            setSharing(true);
            const pdfBlob = await html2pdf().set(options).from(element).output("blob");
            const file = new File([pdfBlob], fileName, { type: "application/pdf" });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: "تقرير حركة الخزنة",
                    text: "مرفق تقرير حركة الخزنة"
                });
            } else {
                html2pdf().set(options).from(element).save();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSharing(false);
        }
    };

    return (
        <div id='invoice' className="p-4 md:p-8 min-h-screen bg-gray-50 " dir="rtl">
            
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

            {/* الجزء العلوي */}
            <div className="no-print flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-normal">جرد الخزنة</h2>
                    <p className="text-gray-500">تحكم كامل في الفلاتر والطباعة</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleSharePDF}
                        disabled={sharing}
                        className="flex items-center gap-2 bg-accent -600 text-white p-2 rounded-md shadow-md text-xl font-bold disabled:opacity-50"
                    >
                        <Share2 className="w-5 h-5" />
                        {sharing ? "جارٍ المشاركة..." : "مشاركة PDF"}
                    </button>

                    <button
                        onClick={handleManualPrint}
                        className="flex text-white bg-slate-800 p-2 rounded-md shadow-md hover:bg-slate-700 cursor-pointer items-center gap-x-2 text-xl font-bold"
                    >
                        🖨️ طباعة الجدول
                    </button>
                </div>
            </div>

            {/* أزرار الفلترة السريعة والبحث */}
            <div className="no-print bg-white p-4 rounded-xl shadow-sm mb-6 border border-gray-200">
                <div className="flex flex-wrap gap-2 mb-4 border-b pb-4 items-center justify-between">
                 <div className='flex gap-3'>
                    <button onClick={() => setTimeRange('today')} className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-sm font-bold">يومي (اليوم)</button>
                    <button onClick={() => setTimeRange('month')} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-bold">شهري</button>
                    <button onClick={() => setTimeRange('year')} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-bold">سنوي</button>
                    <button onClick={handleResetFilters} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold">إعادة ضبط اليوم</button>
                    
                 </div>

        <div>
  <span className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-sm font-bold">
    {currState} البحث الآن
  </span>
</div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-600 mr-1">البحث السريع</label>
                        <input type="text" name="searchTerm" placeholder="بحث بالاسم، البيان..." value={filters.searchTerm} onChange={handleFilterChange} className="border p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-600 mr-1">نوع الحركة</label>
                        <select name="type" value={filters.type} onChange={handleFilterChange} className="border p-2 rounded-lg outline-none">
                            <option value="">كل الحركات</option>
                            <option value="income">داخل</option>
                            <option value="expense">خارج</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-blue-700 mr-1">من تاريخ </label>
                        <input type="date" name="from" value={filters.from} onChange={handleFilterChange} className="border p-2 rounded-lg border-blue-300 bg-blue-50/30" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-blue-700 mr-1">إلى تاريخ </label>
                        <input type="date" name="to" value={filters.to} onChange={handleFilterChange} className="border p-2 rounded-lg border-blue-300 bg-blue-50/30" />
                    </div>
                </div>
            </div>

            {/* منطقة الطباعة */}
            <div className="printable-area bg-white p-4 rounded-xl shadow-sm">
                
                {/* ترويسة التقرير */}
                <div className="print-only text-center mb-6">
                    <h1 className="text-3xl font-normal text-black mb-3">{settings.invoiceFactoryName}</h1>
                    <div className='border-b-2 border-black my-3'></div>
                    <h3 className="text-2xl font-bold pb-2">تقرير حركة الخزينة المالي</h3>
                    <div className="flex justify-between mt-4 font-bold">
                        <span>من تاريخ: {filters.from}</span>
                        <span>إلى تاريخ: {filters.to}</span>
                    </div>
                </div>

                <div id="invoice-capture" dir="rtl" className="p-2">
                    {/* كروت الملخص */}
                    <div className="grid grid-cols-2 md:grid-col-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="border p-4 rounded-lg text-center bg-blue-50 print:bg-white print:border-black">
                            <p className="text-xs font-bold text-gray-500 print:text-black">الرصيد المرحل السابق</p>
                            <p className="text-lg font-normal text-blue-700 print:text-black">{openingBalance?.toLocaleString()} ج.م</p>
                        </div>
                        <div className="border p-4 rounded-lg text-center bg-accent-50 print:bg-white print:border-black">
                            <p className="text-xs font-bold text-gray-500 print:text-black">إجمالي الداخل بالفترة</p>
                            <p className="text-lg font-normal text-accent-700 print:text-black">{totalIncome?.toLocaleString()} ج.م</p>
                        </div>
                        <div className="border p-4 rounded-lg text-center bg-red-50 print:bg-white print:border-black">
                            <p className="text-xs font-bold text-gray-500 print:text-black">إجمالي الخارج بالفترة</p>
                            <p className="text-lg font-normal text-red-700 print:text-black">{totalOutCome?.toLocaleString()} ج.م</p>
                        </div>
                        <div className="border p-4 rounded-lg text-center bg-gray-800 text-white print:bg-white print:text-black print:border-black ">
                            <p className="text-xs font-bold opacity-80">الرصيد الصافي الحالي</p>
                            <p className="text-lg font-normal">{(openingBalance + totalIncome - totalOutCome)?.toLocaleString()} ج.م</p>
                        </div>
                    </div>

                    {/* الجدول الرئيسي */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border">
                            <thead className="bg-gray-800 text-white print:bg-gray-200 print:text-black">
                                <tr>
                                    <th className="p-3 border">التاريخ</th>
                                    <th className="p-3 border">النوع</th>
                                    <th className="p-3 border">البيان / الحساب</th>
                                    <th className="p-3 border">القيمة</th>
                                    <th className="p-3 border">تفاصيل الحركة المجمعة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="text-center p-4">جاري تحميل البيانات...</td>
                                    </tr>
                                ) : filteredTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center p-4">لا توجد عمليات تطابق الفلاتر المحددة لهذه الفترة اليومية</td>
                                    </tr>
                                ) : (
                                    filteredTransactions.map((tr, index) => (
                                        <tr key={tr._id + "-" + index} className="border hover:bg-gray-50">
                                            <td className="p-3 border text-sm">{new Date(tr.date).toLocaleDateString('ar-EG')}</td>
                                            <td className="p-3 border text-sm font-bold">
                                                <span className={tr.type === 'income' ? 'text-accent-600' : 'text-red-600 print:text-black'}>
                                                    {tr.type === 'income' ? 'داخل' : 'خارج'}
                                                </span>
                                            </td>
                                            <td className="p-3 border text-sm font-semibold text-gray-900">{tr.displayName}</td>
                                            <td className="p-3 border text-sm font-normal text-blue-900 print:text-black">{tr.amount.toLocaleString()} ج</td>
                                            <td className="p-3 border text-xs text-gray-600 print:text-black min-w-[150px]">
                                                {tr.itemTitle && <div className="font-medium">{tr.itemTitle}</div>}
                                                {tr.note && tr.note !== "مصروفات خارجه من الخزنه" && (
                                                    <div className="text-[10px] text-gray-400 mt-1">({tr.note})</div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default CashBoxAuditPrint;