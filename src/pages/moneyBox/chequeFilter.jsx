import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import html2pdf from "html2pdf.js";
import { Share2, Eye, X } from "lucide-react";
import { useSystemSettings } from '../../context/shareInfo';

// دالة مساعدة للحصول على التاريخ الحالي بصيغة YYYY-MM-DD
const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const ChequeBoxAuditPrint = () => {
    const [cheques, setCheques] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sharing, setSharing] = useState(false);
    const [currState, setCurrState] = useState("يومي");
    const [openingBalance, setOpeningBalance] = useState(0);
    
    // حالة للتحكم في النافذة الممتدة (Modal) لتفاصيل الحركة
    const [selectedCheque, setSelectedCheque] = useState(null);

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [filters, setFilters] = useState({
        moneyFlow: '', // 'incoming' أو 'outgoing'
        status: '',    // 'under_collection', 'due_today', 'collected', 'returned', 'cancelled'
        dueFrom: getLocalDateString(today),
        dueTo: getLocalDateString(tomorrow),
        chequeNumber: '',
        bankName: '',
        searchTerm: ''
    });

    const fetchCheques = async () => {
        setLoading(true);
        try {
            const params = {
                moneyFlow: filters.moneyFlow || undefined,
                status: filters.status || undefined,
                dueFrom: filters.dueFrom || undefined,
                dueTo: filters.dueTo || undefined,
                chequeNumber: filters.chequeNumber || undefined,
                bankName: filters.bankName || undefined,
                page: 1,
                limit: 1000 // جلب كل الشيكات الخاصة بالتقرير
            };

            const res = await api.get('/cheque', { params });
            const fetchedCheques = res.data.cheques || [];
            
            setCheques(fetchedCheques);
            // رصيد الشيكات السابق
            setOpeningBalance(res.data.openingBalance || 0);
        } catch (err) {
            console.error("خطأ في جلب بيانات خزنة الشيكات:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCheques();
    }, [filters.moneyFlow, filters.status, filters.dueFrom, filters.dueTo, filters.chequeNumber, filters.bankName]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
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
            dueFrom: getLocalDateString(fromDate),
            dueTo: getLocalDateString(toDate)
        });
    };

    const handleResetFilters = () => {
        const rToday = new Date();
        const rTomorrow = new Date(rToday);
        setCurrState("يومي");
        rTomorrow.setDate(rTomorrow.getDate() + 1);

        setFilters({
            moneyFlow: '',
            status: '',
            dueFrom: getLocalDateString(rToday),
            dueTo: getLocalDateString(rTomorrow),
            chequeNumber: '',
            bankName: '',
            searchTerm: ''
        });
    };

    // التصفية المحلية بالبحث السريع
    const filteredCheques = cheques.filter(c => {
        const search = filters.searchTerm.toLowerCase();
        const partyName = (c.customer?.name || c.supplier?.name || "").toLowerCase();
        const chequeNum = (c.chequeNumber || "").toLowerCase();
        const bank = (c.bankName || "").toLowerCase();
        const notes = (c.notes || "").toLowerCase();

        return partyName.includes(search) || chequeNum.includes(search) || bank.includes(search) || notes.includes(search);
    });

    // حساب إجمالي الشيكات الداخلة والخارجة في الفترة
    const totalIncoming = filteredCheques.reduce((acc, curr) => {
        return curr.moneyFlow === "incoming" ? acc + curr.amount : acc;
    }, 0);

    const totalOutgoing = filteredCheques.reduce((acc, curr) => {
        return curr.moneyFlow === "outgoing" ? acc + curr.amount : acc;
    }, 0);

    // رصيد خزنة الشيكات الحالي
    const activeChequesBalance = filteredCheques.reduce((acc, curr) => {
        const isPending = ["under_collection", "due_today"].includes(curr.status);
        if (!isPending) return acc;
        return curr.moneyFlow === "incoming" ? acc + curr.amount : acc - curr.amount;
    }, 0);

    const { settings } = useSystemSettings();

    const handleManualPrint = () => {
        window.print();
    };

    const handleSharePDF = async () => {
        const element = document.getElementById("invoice-capture");
        if (!element) return;

        const fileName = "cheque_box_report.pdf";
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
                    title: "تقرير خزنة الشيكات",
                    text: "مرفق تقرير حركة خزنة الشيكات"
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

    // مصفوفة مترجمة لحالات الشيك
    const statusMap = {
        under_collection: "تحت التحصيل",
        due_today: "مستحق اليوم",
        collected: "تم التحصيل",
        returned: "مرتجع",
        cancelled: "ملغي"
    };

    return (
        <div id='invoice' className="p-4 md:p-8 min-h-screen bg-gray-50" dir="rtl">
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

            {/* الجزء العلوي - الأزرار الهيدر */}
            <div className="no-print flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-normal">خزنة الشيكات</h2>
                    <p className="text-gray-500">عرض حركة وخزنة الشيكات والتحكم بالطباعة</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleSharePDF}
                        disabled={sharing}
                        className="flex items-center gap-2 bg-emerald-600 text-white p-2 rounded-md shadow-md text-xl font-bold disabled:opacity-50 hover:bg-emerald-700 cursor-pointer"
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
                        <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-bold">
                            {currState} البحث الآن
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-600 mr-1">البحث السريع</label>
                        <input
                            type="text"
                            name="searchTerm"
                            placeholder="اسم العميل/المورد، رقم الشيك..."
                            value={filters.searchTerm}
                            onChange={handleFilterChange}
                            className="border p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-600 mr-1">حالة الشيك</label>
                        <select name="status" value={filters.status} onChange={handleFilterChange} className="border p-2 rounded-lg outline-none">
                            <option value="">كل الحالات</option>
                            <option value="under_collection">تحت التحصيل</option>
                            <option value="due_today">مستحق اليوم</option>
                            <option value="collected">تم التحصيل</option>
                            <option value="returned">مرتجع</option>
                            <option value="cancelled">ملغي</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-blue-700 mr-1">استحقاق من تاريخ</label>
                        <input type="date" name="dueFrom" value={filters.dueFrom} onChange={handleFilterChange} className="border p-2 rounded-lg border-blue-300 bg-blue-50/30" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-blue-700 mr-1">استحقاق إلى تاريخ</label>
                        <input type="date" name="dueTo" value={filters.dueTo} onChange={handleFilterChange} className="border p-2 rounded-lg border-blue-300 bg-blue-50/30" />
                    </div>
                </div>
            </div>

            {/* منطقة الطباعة والتقرير */}
            <div className="printable-area bg-white p-4 rounded-xl shadow-sm">
                
                {/* ترويسة التقرير (تظهر فقط عند الطباعة) */}
                <div className="print-only text-center mb-6">
                    <h1 className="text-3xl font-normal text-black mb-3">{settings?.invoiceFactoryName || "المنشأة"}</h1>
                    <div className='border-b-2 border-black my-3'></div>
                    <h3 className="text-2xl font-bold pb-2">تقرير حركة خزنة الشيكات</h3>
                    <div className="flex justify-between mt-4 font-bold">
                        <span>استحقاق من: {filters.dueFrom}</span>
                        <span>إلى: {filters.dueTo}</span>
                    </div>
                </div>

                <div id="invoice-capture" dir="rtl" className="p-2">
                    {/* كروت الملخص */}
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="border p-4 rounded-lg text-center bg-blue-50 print:bg-white print:border-black">
                            <p className="text-xs font-bold text-gray-500 print:text-black">رصيد الشيكات السابق</p>
                            <p className="text-lg font-normal text-blue-700 print:text-black">{openingBalance?.toLocaleString()} ج.م</p>
                        </div>
                        <div className="border p-4 rounded-lg text-center bg-emerald-50 print:bg-white print:border-black">
                            <p className="text-xs font-bold text-gray-500 print:text-black">شيكات داخلة بالفترة</p>
                            <p className="text-lg font-normal text-emerald-700 print:text-black">{totalIncoming?.toLocaleString()} ج.م</p>
                        </div>
                        <div className="border p-4 rounded-lg text-center bg-red-50 print:bg-white print:border-black">
                            <p className="text-xs font-bold text-gray-500 print:text-black">شيكات خارجة بالفترة</p>
                            <p className="text-lg font-normal text-red-700 print:text-black">{totalOutgoing?.toLocaleString()} ج.م</p>
                        </div>
                        <div className="border p-4 rounded-lg text-center bg-gray-800 text-white print:bg-white print:text-black print:border-black">
                            <p className="text-xs font-bold opacity-80">رصيد خزنة الشيكات الحالي</p>
                            <p className="text-lg font-normal">{activeChequesBalance?.toLocaleString()} ج.م</p>
                        </div>
                    </div>

                    {/* جدول الشيكات الرئيسي */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border">
                            <thead className="bg-gray-800 text-white print:bg-gray-200 print:text-black">
                                <tr>
                                    <th className="p-3 border">تاريخ الاستلام</th>
                                    <th className="p-3 border">رقم الشيك</th>
                                    <th className="p-3 border">التاجر</th>
                                    <th className="p-3 border">البنك</th>
                                    <th className="p-3 border">تاريخ الاستحقاق</th>
                                    <th className="p-3 border">النوع</th>
                                    <th className="p-3 border">القيمة</th>
                                    <th className="p-3 border">الحالة</th>
                                    <th className="p-3 border">ملاحظات</th>
                                    <th className="p-3 border no-print">تفاصيل الحركه</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="10" className="text-center p-4">جاري تحميل البيانات...</td>
                                    </tr>
                                ) : filteredCheques.length === 0 ? (
                                    <tr>
                                        <td colSpan="10" className="text-center p-4">لا توجد شيكات تطابق الفلاتر المحددة لهذه الفترة</td>
                                    </tr>
                                ) : (
                                    filteredCheques.map((cheque, index) => (
                                        <tr key={cheque._id || index} className="border hover:bg-gray-50">
                                            <td className="p-3 border text-sm font-bold">{new Date(cheque.receiveDate || cheque.createdAt)?.toLocaleDateString('ar-EG')}</td>
                                            <td className="p-3 border text-sm font-bold">{cheque.chequeNumber}</td>
                                            <td className="p-3 border text-sm font-semibold text-gray-900">
                                                {cheque.customer?.name || cheque.supplier?.name || cheque.name || "غير محدد"}
                                            </td>
                                            <td className="p-3 border text-sm">{cheque.bankName}</td>
                                            <td className="p-3 border text-sm">
                                                {new Date(cheque.dueDate).toLocaleDateString('ar-EG')}
                                            </td>
                                            <td className="p-3 border text-sm font-bold">
                                                <span className={cheque.moneyFlow === 'incoming' ? 'text-emerald-600' : 'text-red-600 print:text-black'}>
                                                    {cheque.moneyFlow === 'incoming' ? 'داخل' : 'خارج'}
                                                </span>
                                            </td>
                                            <td className="p-3 border text-sm font-normal text-blue-900 print:text-black">
                                                {cheque.amount?.toLocaleString()} ج
                                            </td>
                                            <td className="p-3 border text-xs font-semibold">
                                                <span className={`px-2 py-1 rounded-md ${
                                                    cheque.status === 'collected' ? 'bg-emerald-100 text-emerald-800' :
                                                    cheque.status === 'returned' ? 'bg-red-100 text-red-800' :
                                                    cheque.status === 'cancelled' ? 'bg-gray-200 text-gray-800' :
                                                    'bg-amber-100 text-amber-800'
                                                }`}>
                                                    {statusMap[cheque.status] || cheque.status}
                                                </span>
                                            </td>
                                            <td className="p-3 border text-xs text-gray-600 print:text-black min-w-[130px]">
                                                {cheque.notes || "-"}
                                            </td>
                                            <td className="p-3 border text-center no-print">
                                                <button
                                                    onClick={() => setSelectedCheque(cheque)}
                                                    title="تفاصيل الحركة"
                                                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal: تفاصيل الحركة */}
            {selectedCheque && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 no-print">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
                        {/* الهيدر */}
                        <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                {/* <Eye className="w-5 h-5 text-blue-400" /> */}
                                <h3 className="text-xl font-bold">تفاصيل الحركة</h3>
                            </div>
                            <button
                                onClick={() => setSelectedCheque(null)}
                                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* محتوى التفاصيل */}
                        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-3 rounded-lg border">
                                    <span className="text-gray-500 block text-xs">رقم الشيك</span>
                                    <span className="font-bold text-gray-800 text-base">{selectedCheque.chequeNumber || "-"}</span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg border">
                                    <span className="text-gray-500 block text-xs">اسم البنك</span>
                                    <span className="font-bold text-gray-800 text-base">{selectedCheque.bankName || "-"}</span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg border">
                                    <span className="text-gray-500 block text-xs">التاجر</span>
                                    <span className="font-bold text-gray-800 text-base">
                                        {selectedCheque.customer?.name || selectedCheque.supplier?.name || selectedCheque.name || "غير محدد"}
                                    </span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg border">
                                    <span className="text-gray-500 block text-xs">القيمة المالية</span>
                                    <span className="font-bold text-blue-700 text-base">{selectedCheque.amount?.toLocaleString()} ج.م</span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg border">
                                    <span className="text-gray-500 block text-xs">نوع التدفق (اتجاه الشيك)</span>
                                    <span className={`font-bold ${selectedCheque.moneyFlow === 'incoming' ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {selectedCheque.moneyFlow === 'incoming' ? 'داخل (وارد)' : 'خارج (صادر)'}
                                    </span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg border">
                                    <span className="text-gray-500 block text-xs">نوع الشيك</span>
                                    <span className="font-semibold text-gray-800">{selectedCheque.chequeType=="normal"? "عادي" :"مقاصه" || "عادي"}</span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg border">
                                    <span className="text-gray-500 block text-xs">حالة الشيك الحالية</span>
                                    <span className="font-bold text-amber-700">
                                        {statusMap[selectedCheque.status] || selectedCheque.status}
                                    </span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg border">
                                    <span className="text-gray-500 block text-xs">مكان الشيك (الموقع)</span>
                                    <span className="font-semibold text-gray-800">
                                        {selectedCheque.location === 'with_me' ? 'في الخزنة (معي)' : selectedCheque.location || "-"}
                                    </span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg border">
                                    <span className="text-gray-500 block text-xs">تاريخ الاستلام</span>
                                    <span className="font-semibold text-gray-800">
                                        {new Date(selectedCheque.receiveDate || selectedCheque.createdAt)?.toLocaleDateString('ar-EG')}
                                    </span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg border">
                                    <span className="text-gray-500 block text-xs">تاريخ الاستحقاق</span>
                                    <span className="font-semibold text-gray-800">
                                        {new Date(selectedCheque.dueDate)?.toLocaleDateString('ar-EG')}
                                    </span>
                                </div>
                            </div>

                            {/* الملاحظات */}
                            <div className="bg-gray-50 p-3 rounded-lg border">
                                <span className="text-gray-500 block text-xs">الملاحظات</span>
                                <p className="text-gray-800 font-medium mt-1">{selectedCheque.notes || "لا توجد ملاحظات مدونة."}</p>
                            </div>
                        </div>

                        {/* الفوتر */}
                        <div className="bg-gray-100 p-4 flex justify-end">
                            <button
                                onClick={() => setSelectedCheque(null)}
                                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold transition-colors cursor-pointer"
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

export default ChequeBoxAuditPrint;