import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import html2pdf from "html2pdf.js";
import { Share2, Eye, X, Printer, RefreshCw, Search } from "lucide-react";
import { useSystemSettings } from '../../context/shareInfo';

// دالة مساعدة للحصول على التاريخ الحالي بصيغة YYYY-MM-DD
const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// الحالات اللي معناها إن الشيك لسه معلق (متحصلش/متلغاش/مترجعش)
const PENDING_STATUSES = ['under_collection', 'due_today'];

const ChequeBoxAuditPrint = () => {
    const [cheques, setCheques] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sharing, setSharing] = useState(false);
    const [currState, setCurrState] = useState("يومي");
    const [openingBalance, setOpeningBalance] = useState(0);
    const [openingBalanceLoading, setOpeningBalanceLoading] = useState(false);

    // إحصائيات الباك إند
    const [backendStats, setBackendStats] = useState({
        pending: { amount: 0, count: 0 },
        returnedCancelled: { amount: 0, count: 0 },
        collected: { amount: 0, count: 0 }
    });

    // التحكم في modal تفاصيل الحركة
    const [selectedCheque, setSelectedCheque] = useState(null);

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [filters, setFilters] = useState({
        moneyFlow: '',
        status: '',
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
                limit: 1000
            };

            const res = await api.get('/cheque', { params });
            const fetchedCheques = res.data.cheques || [];

            setCheques(fetchedCheques);

            if (res.data.totalAmounts) {
                setBackendStats(res.data.totalAmounts);
            }
        } catch (err) {
            console.error("خطأ في جلب بيانات خزنة الشيكات:", err);
        } finally {
            setLoading(false);
        }
    };

    // -------------------------------------------------------------
    // الرصيد السابق (رصيد قديم)
    // = إجمالي قيمة الشيكات اللي لسه معلقة (تحت التحصيل / مستحقة اليوم)
    //   وتاريخ استحقاقها كان قبل بداية الفترة المختارة (dueFrom)
    // بنعمل نداء منفصل لأن جدول الشيكات المعروض بيجيب بس الشيكات
    // اللي استحقاقها جوه الفترة (dueFrom -> dueTo)
    // -------------------------------------------------------------
    const fetchOpeningBalance = async () => {
        if (!filters.dueFrom) {
            setOpeningBalance(0);
            return;
        }

        setOpeningBalanceLoading(true);
        try {
            const dayBeforePeriod = new Date(filters.dueFrom);
            dayBeforePeriod.setDate(dayBeforePeriod.getDate() - 1);

            const params = {
                dueTo: getLocalDateString(dayBeforePeriod),
                page: 1,
                limit: 5000
            };

            const res = await api.get('/cheque', { params });
            const oldCheques = res.data.cheques || [];

            const total = oldCheques
                .filter(c => PENDING_STATUSES.includes(c.status))
                .reduce((acc, c) => acc + (c.amount || 0), 0);

            setOpeningBalance(total);
        } catch (err) {
            console.error("خطأ في جلب الرصيد السابق لخزنة الشيكات:", err);
        } finally {
            setOpeningBalanceLoading(false);
        }
    };

    useEffect(() => {
        fetchCheques();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.moneyFlow, filters.status, filters.dueFrom, filters.dueTo, filters.chequeNumber, filters.bankName]);

    useEffect(() => {
        fetchOpeningBalance();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.dueFrom]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const setTimeRange = (range) => {
        const now = new Date();
        let fromDate, toDate;

        if (range === 'today') {
            fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            setCurrState("يومي");
        } else if (range === 'month') {
            fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
            toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            setCurrState("شهري");
        } else if (range === 'year') {
            fromDate = new Date(now.getFullYear(), 0, 1);
            toDate = new Date(now.getFullYear(), 11, 31);
            setCurrState("سنوي");
        }

        setFilters(prev => ({
            ...prev,
            dueFrom: getLocalDateString(fromDate),
            dueTo: getLocalDateString(toDate)
        }));
    };

    const handleResetFilters = () => {
        const now = new Date();
        setCurrState("يومي");

        setFilters({
            moneyFlow: '',
            status: '',
            dueFrom: getLocalDateString(now),
            dueTo: getLocalDateString(now),
            chequeNumber: '',
            bankName: '',
            searchTerm: ''
        });
    };

    // فلترة محلية لنص البحث
    const filteredCheques = cheques.filter(c => {
        const search = filters.searchTerm.toLowerCase();
        const partyName = (c.customer?.name || c.supplier?.name || c.name || "").toLowerCase();
        const chequeNum = (c.chequeNumber || "").toLowerCase();
        const bank = (c.bankName || "").toLowerCase();
        const notes = (c.notes || "").toLowerCase();

        return partyName.includes(search) || chequeNum.includes(search) || bank.includes(search) || notes.includes(search);
    });

    // 1. حساب (تحت التحصيل + مستحق)
    const pendingCheques = filteredCheques.filter(c => PENDING_STATUSES.includes(c.status));
    const totalPendingFiltered = pendingCheques.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // 2. حساب (تم التحصيل منفصلًا)
    const collectedCheques = filteredCheques.filter(c => c.status === 'collected');
    const totalCollectedFiltered = collectedCheques.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // 3. حساب (مرتجع + ملغي)
    const returnedCancelledStatuses = ['returned', 'cancelled'];
    const returnedCancelledCheques = filteredCheques.filter(c => returnedCancelledStatuses.includes(c.status));
    const totalReturnedCancelledFiltered = returnedCancelledCheques.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // 4. الرصيد الحالي الصافي = الرصيد السابق (شيكات معلقة قبل الفترة) + شيكات معلقة داخل الفترة
    const currentNetBalance = openingBalance + totalPendingFiltered;

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

    const statusMap = {
        under_collection: "تحت التحصيل",
        due_today: "مستحق اليوم",
        collected: "تم التحصيل",
        returned: "مرتجع",
        cancelled: "ملغي"
    };

    return (
        <div id='invoice' className="p-4 md:p-8 min-h-screen bg-gray-50 text-right" dir="rtl">
            <style>{`
                @media print {
                    @page { margin: 1cm; size: A4; }
                    body { background: white !important; color: black !important; }
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    .printable-area { width: 100% !important; border: none !important; box-shadow: none !important; }
                    table { width: 100% !important; border-collapse: collapse !important; margin-top: 20px; }
                    th, td { border: 1px solid #000 !important; padding: 8px !important; color: #000 !important; font-size: 12px !important; }
                    th { background-color: #f2f2f2 !important; -webkit-print-color-adjust: exact; }
                }
                .print-only { display: none; }
            `}</style>

            {/* الهيدر والأزرار */}
            <div className="no-print flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">خزنة الشيكات</h2>
                    <p className="text-gray-500 text-sm">عرض حركة وخزنة الشيكات والتحكم بالطباعة والمشاركة</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleSharePDF}
                        disabled={sharing}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-md text-base font-semibold disabled:opacity-50 hover:bg-emerald-700 transition-colors cursor-pointer"
                    >
                        <Share2 className="w-5 h-5" />
                        {sharing ? "جارٍ المشاركة..." : "مشاركة PDF"}
                    </button>

                    <button
                        onClick={handleManualPrint}
                        className="flex text-white bg-slate-800 px-4 py-2 rounded-lg shadow-md hover:bg-slate-700 transition-colors cursor-pointer items-center gap-2 text-base font-semibold"
                    >
                        <Printer className="w-5 h-5" />
                        طباعة الجدول
                    </button>
                </div>
            </div>

            {/* شريط الفلترة */}
            <div className="no-print bg-white p-5 rounded-xl shadow-sm mb-6 border border-gray-200">
                <div className="flex flex-wrap gap-2 mb-4 border-b pb-4 items-center justify-between">
                    <div className='flex flex-wrap gap-2'>
                        <button onClick={() => setTimeRange('today')} className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-sm font-bold transition-colors">يومي (اليوم)</button>
                        <button onClick={() => setTimeRange('month')} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-bold transition-colors">شهري</button>
                        <button onClick={() => setTimeRange('year')} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-bold transition-colors">سنوي</button>
                        <button onClick={handleResetFilters} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-bold transition-colors flex items-center gap-1">
                            <RefreshCw className="w-4 h-4" />
                            إعادة ضبط اليوم
                        </button>
                    </div>

                    <div>
                        <span className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-bold">
                            الوضع الحالي: {currState}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-600 mr-1">البحث السريع</label>
                        <div className="relative">
                            <input
                                type="text"
                                name="searchTerm"
                                placeholder="اسم العميل/المورد، رقم الشيك..."
                                value={filters.searchTerm}
                                onChange={handleFilterChange}
                                className="w-full border border-gray-300 p-2 pr-8 rounded-lg outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                            />
                            <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-3" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-600 mr-1">حالة الشيك</label>
                        <select name="status" value={filters.status} onChange={handleFilterChange} className="border border-gray-300 p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-400 text-sm">
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
                        <input type="date" name="dueFrom" value={filters.dueFrom} onChange={handleFilterChange} className="border p-2 rounded-lg border-blue-300 bg-blue-50/30 text-sm" />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-blue-700 mr-1">استحقاق إلى تاريخ</label>
                        <input type="date" name="dueTo" value={filters.dueTo} onChange={handleFilterChange} className="border p-2 rounded-lg border-blue-300 bg-blue-50/30 text-sm" />
                    </div>
                </div>
            </div>

            {/* منطقة التقرير والطباعة */}
            <div className="printable-area bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="print-only text-center mb-6">
                    <h1 className="text-3xl font-bold text-black mb-2">{settings?.invoiceFactoryName || "المنشأة"}</h1>
                    <div className='border-b-2 border-black my-2'></div>
                    <h3 className="text-xl font-bold pb-2">تقرير حركة خزنة الشيكات</h3>
                    <div className="flex justify-between mt-4 text-sm font-bold">
                        <span>استحقاق من: {filters.dueFrom}</span>
                        <span>إلى: {filters.dueTo}</span>
                    </div>
                </div>

                <div id="invoice-capture" dir="rtl" className="p-2">
                    {/* كروت الملخص المالي */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
                        <div className="border p-4 rounded-xl text-center bg-blue-50/50 print:bg-white print:border-black">
                            <p className="text-xs font-bold text-gray-500 print:text-black mb-1">الرصيد السابق</p>
                            <p className="text-lg font-bold text-blue-700 print:text-black">
                                {openingBalanceLoading ? "..." : `${openingBalance.toLocaleString()} ج.م`}
                            </p>
                        </div>

                        <div className="border p-4 rounded-xl text-center bg-amber-50/50 print:bg-white print:border-black">
                            <p className="text-xs font-bold text-gray-500 print:text-black mb-1">تحت التحصيل ومستحق</p>
                            <p className="text-lg font-bold text-amber-700 print:text-black">
                                {totalPendingFiltered.toLocaleString()} ج.م
                            </p>
                            <span className="text-[10px] text-gray-400">
                                ({pendingCheques.length} شيكات)
                            </span>
                        </div>

                        <div className="border p-4 rounded-xl text-center bg-emerald-50/50 print:bg-white print:border-black">
                            <p className="text-xs font-bold text-gray-500 print:text-black mb-1">تم التحصيل</p>
                            <p className="text-lg font-bold text-emerald-700 print:text-black">
                                {totalCollectedFiltered.toLocaleString()} ج.م
                            </p>
                            <span className="text-[10px] text-gray-400">
                                ({collectedCheques.length} شيكات)
                            </span>
                        </div>

                        <div className="border p-4 rounded-xl text-center bg-rose-50/50 print:bg-white print:border-black">
                            <p className="text-xs font-bold text-gray-500 print:text-black mb-1">راجع وملغي</p>
                            <p className="text-lg font-bold text-rose-700 print:text-black">
                                {totalReturnedCancelledFiltered.toLocaleString()} ج.م
                            </p>
                            <span className="text-[10px] text-gray-400">
                                ({returnedCancelledCheques.length} شيكات)
                            </span>
                        </div>

                        <div className="border p-4 rounded-xl text-center bg-slate-800 text-white print:bg-white print:text-black print:border-black col-span-2 lg:col-span-1">
                            <p className="text-xs font-bold opacity-80 mb-1">الرصيد الحالي الصافي</p>
                            <p className="text-lg font-bold">
                                {currentNetBalance.toLocaleString()} ج.م
                            </p>
                        </div>
                    </div>

                    {/* جدول عرض الشيكات */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border border-gray-200 rounded-lg">
                            <thead className="bg-slate-800 text-white print:bg-gray-200 print:text-black">
                                <tr>
                                    <th className="p-3 border text-xs font-bold">تاريخ الاستلام</th>
                                    <th className="p-3 border text-xs font-bold">رقم الشيك</th>
                                    <th className="p-3 border text-xs font-bold">التاجر</th>
                                    <th className="p-3 border text-xs font-bold">البنك</th>
                                    <th className="p-3 border text-xs font-bold">تاريخ الاستحقاق</th>
                                    <th className="p-3 border text-xs font-bold">القيمة</th>
                                    <th className="p-3 border text-xs font-bold">الحالة</th>
                                    <th className="p-3 border text-xs font-bold">ملاحظات</th>
                                    <th className="p-3 border text-xs font-bold no-print">تفاصيل الحركة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="9" className="text-center p-6 text-gray-500">جاري تحميل البيانات...</td>
                                    </tr>
                                ) : filteredCheques.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="text-center p-6 text-gray-500">لا توجد شيكات تطابق الفلاتر المحددة لهذه الفترة</td>
                                    </tr>
                                ) : (
                                    filteredCheques.map((cheque, index) => (
                                        <tr key={cheque._id || index} className="border hover:bg-gray-50/80 transition-colors">
                                            <td className="p-3 border text-sm font-medium">
                                                {cheque.receiveDate ? new Date(cheque.receiveDate).toLocaleDateString('ar-EG') : '-'}
                                            </td>
                                            <td className="p-3 border text-sm font-bold text-gray-800">{cheque.chequeNumber || '-'}</td>
                                            <td className="p-3 border text-sm font-semibold text-gray-900">
                                                {cheque.customer?.name || cheque.supplier?.name || "غير محدد"}
                                            </td>
                                            <td className="p-3 border text-sm text-gray-700">{cheque.bankName || '-'}</td>
                                            <td className="p-3 border text-sm">
                                                {cheque.dueDate ? new Date(cheque.dueDate).toLocaleDateString('ar-EG') : '-'}
                                            </td>
                                            <td className="p-3 border text-sm font-bold text-blue-900 print:text-black">
                                                {cheque.amount?.toLocaleString()} ج.م
                                            </td>
                                            <td className="p-3 border text-xs font-semibold">
                                                <span className={`px-2.5 py-1 rounded-full text-xs ${
                                                    cheque.status === 'collected' ? 'bg-emerald-100 text-emerald-800' :
                                                    cheque.status === 'returned' ? 'bg-red-100 text-red-800' :
                                                    cheque.status === 'cancelled' ? 'bg-gray-200 text-gray-800' :
                                                    'bg-amber-100 text-amber-800'
                                                }`}>
                                                    {statusMap[cheque.status] || cheque.status}
                                                </span>
                                            </td>
                                            <td className="p-3 border text-xs text-gray-600 print:text-black max-w-[150px] truncate" title={cheque.notes}>
                                                {cheque.notes || "-"}
                                            </td>
                                            <td className="p-3 border text-center no-print">
                                                <button
                                                    onClick={() => setSelectedCheque(cheque)}
                                                    title="تفاصيل الحركة"
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
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

            {/* Modal تفاصيل الحركة */}
            {selectedCheque && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 no-print">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-100">
                        <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Eye className="w-5 h-5 text-blue-400" />
                                <h3 className="text-lg font-bold">تفاصيل حركة الشيك</h3>
                            </div>
                            <button
                                onClick={() => setSelectedCheque(null)}
                                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

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
                                        {selectedCheque.customer?.name || selectedCheque.supplier?.name || "غير محدد"}
                                    </span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg border">
                                    <span className="text-gray-500 block text-xs">القيمة المالية</span>
                                    <span className="font-bold text-blue-700 text-base">{selectedCheque.amount?.toLocaleString()} ج.م</span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg border">
                                    <span className="text-gray-500 block text-xs">حالة الشيك الحالية</span>
                                    <span className="font-bold text-amber-700">
                                        {statusMap[selectedCheque.status] || selectedCheque.status}
                                    </span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg border">
                                    <span className="text-gray-500 block text-xs">تاريخ الاستحقاق</span>
                                    <span className="font-semibold text-gray-800">
                                        {selectedCheque.dueDate ? new Date(selectedCheque.dueDate).toLocaleDateString('ar-EG') : '-'}
                                    </span>
                                </div>
                            </div>

                            {selectedCheque.notes && (
                                <div className="bg-gray-50 p-3 rounded-lg border">
                                    <span className="text-gray-500 block text-xs mb-1">ملاحظات</span>
                                    <p className="text-gray-800 font-medium whitespace-pre-line">{selectedCheque.notes}</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-50 p-4 border-t flex justify-end">
                            <button
                                onClick={() => setSelectedCheque(null)}
                                className="px-5 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 text-sm font-semibold transition-colors"
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
