import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";
import html2pdf from "html2pdf.js";
import { useSystemSettings } from "../../context/shareInfo";

const SupplierPaymentsPrintPage = () => {
  const { id } = useParams(); // Customer ID
  const { settings } = useSystemSettings();

  const [customer, setCustomer] = useState(null);
  const [payments, setPayments] = useState([]);
  const [totalPayments, setTotalPayments] = useState(0);
  
  // حالة التحكم في عدد العناصر المعروضة (الافتراضي: 100)
  const [limit, setLimit] = useState(100);
  
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  // خريطة أسماء طرق الدفع بالعربية
  const paymentMethodNames = {
    cash: "نقدي",
    wallet: "محفظة إلكترونية",
    instapay: "إنستا باي",
    bank: "تحويل بنكي",
    mail: "بريد",
    cheque: "شيك",
    work: "شغل",
  };

  // خريطة حالات الشيك بالعربية
  const chequeStatusNames = {
    under_collection: "تحت التحصيل",
    due_today: "مستحق اليوم",
    collected: "تم تحصيله",
    returned: "راجع / مرتد",
    cancelled: "ملغي",
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. جلب بيانات التاجر أول مرة فقط إذا لم تكن موجودة
        if (!customer) {
          const customerRes = await api.get(`/suppliers/${id}`);
          setCustomer(customerRes.data.data || customerRes.data);
        }

        // 2. جلب مدفوعات التاجر بالحد المحدد من قبل المستخدم
        const paymentsRes = await api.get(
          `/suppliers/allPaymentPerCustomer/${id}?limit=${limit}`
        );
        setPayments(paymentsRes.data.payments || []);
        setTotalPayments(paymentsRes.data.totalPayments || 0);
      } catch (error) {
        console.error("خطأ في جلب بيانات المدفوعات:", error);
      } fontFinally: {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, limit]); // إعادة الجلب تلقائياً عند تغيير الـ limit

  // تغيير عدد الصفوف
  const handleLimitChange = (e) => {
    const val = e.target.value;
    if (val === "all") {
      // إذا اختار الكل، نمرر الإجمالي كـ limit أو قيمة كبيرة جداً
      setLimit(totalPayments || 10000);
    } else {
      setLimit(Number(val));
    }
  };

  if (loading && !customer) {
    return (
      <div className="p-10 text-center font-bold text-black">
        جاري تجهيز كشف المدفوعات للطباعة...
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-10 text-center font-bold text-black">
        حدث خطأ في تحميل بيانات التاجر
      </div>
    );
  }


  // حساب إجمالي المقبوضات (المتحصلات) والمدفوعات للعمليات المعروضة
  const totalIncoming = payments
    .filter((p) => p.moneyFlow === "incoming")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalOutgoing = payments
    .filter((p) => p.moneyFlow === "outgoing")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  const handleSharePDF = async () => {
    const element = document.getElementById("invoice-capture");
    const arabicFileName = `كشف_مدفوعات_${customer.name || "تاجر"}.pdf`;

    const options = {
      margin: 8,
      filename: arabicFileName,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    try {
      setSharing(true);
      const pdfBlob = await html2pdf().set(options).from(element).output("blob");
      const file = new File([pdfBlob], arabicFileName, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `كشف حساب تحصيلات - ${customer.name}`,
          text: `مرفق تقرير المدفوعات والتحصيلات للتاجر: ${customer.name}`,
        });
      } else {
        html2pdf().set(options).from(element).save();
      }
    } catch (error) {
      console.error("خطأ أثناء مشاركة الملف:", error);
      alert("حدث خطأ أثناء محاولة مشاركة الملف.");
    } finally {
      setSharing(false);
    }
  };

  

  return (
    <div
      id="invoice"
      className="min-h-screen p-0 md:p-6 text-right text-black"
      dir="rtl"
      style={{ fontFamily: `${settings?.invoiceFont || "Cairo"}, sans-serif` }}
    >
      {/* هيدر التحكم - يختفي عند الطباعة */}
      <div className="max-w-4xl mx-auto mb-4 no-print flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl border border-black gap-3 shadow-sm">
        <div>
          <h2 className="text-base font-black text-black">
            معاينة كشف المقبوضات والمدفوعات للطباعة
          </h2>
          <p className="text-xs text-gray-700 font-bold mt-0.5">
            التاجر: {customer.name} - المعروض: {payments.length} من إجمالي {totalPayments} عملية
          </p>
        </div>

        {/* عناصر التحكم والتصفية */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* اختيار عدد العمليات (Limit) */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-black px-3 py-1.5 rounded-lg">
            <label htmlFor="limit-select" className="text-xs font-black text-black whitespace-nowrap">
              عرض العمليات:
            </label>
            <select
              id="limit-select"
              value={limit >= totalPayments && totalPayments > 0 ? "all" : limit}
              onChange={handleLimitChange}
              disabled={loading}
              className="bg-white border border-gray-400 text-xs font-bold rounded p-1 outline-none focus:border-black cursor-pointer"
            >
              <option value={10}>10 عمليات</option>
              <option value={25}>25 عملية</option>
              <option value={50}>50 عملية</option>
              <option value={100}>100 عملية</option>
              <option value="all">عرض الكل (الحد الأقصى)</option>
            </select>
          </div>

          <button
            onClick={handlePrint}
            className="bg-black text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-800 transition-all text-xs flex-1 md:flex-none"
          >
            طباعة التقرير
          </button>
          <button
            onClick={handleSharePDF}
            disabled={sharing}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-black transition-all text-xs flex-1 md:flex-none disabled:opacity-50"
          >
            {sharing ? "جاري التجهيز..." : "مشاركة كـ PDF"}
          </button>
        </div>
      </div>

      {/* الجسم الرئيسي للتقرير - مناسب للطباعة أبيض وأسود */}
      <div
        id="invoice-capture"
        className="max-w-4xl mx-auto bg-white p-6 border-2 border-black print:border-none print:m-0 print:p-0 text-black"
        dir="rtl"
      >
        {/* الهيدر العلوي */}
        <div className="border-b-2 border-black pb-4 mb-4">
          <table className="w-full text-right" style={{ borderCollapse: "collapse", border: "none" }}>
            <tbody>
              <tr>
                <td className="align-top">
                  <h1 className="text-2xl font-black text-black m-0">
                    {settings?.invoiceFactoryName || "مصنع المخرز"}
                  </h1>
                  <h3 className="text-sm font-bold text-gray-800 mt-1 m-0">
                    تقرير تحصيلات ومدفوعات حساب تاجر
                  </h3>
                  <div className="text-xs font-bold text-black mt-3 space-y-1">
                    <p className="m-0">
                      اسم التاجر: <span className="font-black">{customer.name}</span>
                    </p>
                    <p className="m-0">
                      الهاتف: <span className="font-bold">{customer.phone || customer.mobile || "غير محدد"}</span>
                    </p>
                    <p className="m-0">
                      رصيد التاجر الحالي:{" "}
                      <span className="font-black">{customer.balance?.toLocaleString() || 0} ج.م</span>
                    </p>
                  </div>
                </td>

                <td className="text-left align-top min-w-[160px]">
                  <div className="p-3 border-2 border-black inline-block text-right">
                    <p className="font-black text-xs text-black m-0">تاريخ التقرير:</p>
                    <p className="text-black text-[11px] font-bold m-0 mt-1">
                      {new Date().toLocaleString("ar-EG", {
                        timeZone: "Africa/Cairo",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-[10px] font-bold text-black mt-2 m-0 border-t border-black pt-1">
                      العمليات المطبوعة: {payments.length} من {totalPayments}
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* كروت ملخص الحركة المالية */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
          <div className="border border-black p-2 text-center bg-gray-50">
            <div className="font-bold text-black text-[10px]">
              إجمالي التحصيلات (استلام فلوس من التاجر)
            </div>
            <div className="font-black text-black text-sm mt-0.5">
              {totalIncoming.toLocaleString()} ج.م
            </div>
          </div>
          <div className="border border-black p-2 text-center bg-gray-50">
            <div className="font-bold text-black text-[10px]">إجمالي المخرجات / المصروفات</div>
            <div className="font-black text-black text-sm mt-0.5">
              {totalOutgoing.toLocaleString()} ج.م
            </div>
          </div>
        </div>

        {/* جدول عمليات التحصيل والدفع */}
        <div className="mb-4">
          <h3 className="text-xs font-black text-black mb-2 border-r-4 border-black pr-2 uppercase">
            سجل حركة المعاملات المالية
          </h3>
          <table className="w-full text-right border-collapse border-2 border-black text-xs">
            <thead>
              <tr className="bg-gray-100 text-black border-b-2 border-black font-black">
                <th className="p-2 border-r border-black text-center">#</th>
                <th className="p-2 border-r border-black text-center">التاريخ</th>
                <th className="p-2 border-r border-black text-center">نوع الحركة</th>
                <th className="p-2 border-r border-black text-center">طريقة الدفع</th>
                <th className="p-2 border-r border-black text-center">المبلغ</th>
                <th className="p-2 border-r border-black text-right">بيانات إضافية / تفاصيل الشيك</th>
                <th className="p-2 text-right">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center font-bold">
                    جاري تحميل البيانات المطلوب عرضها...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center font-bold">
                    لا توجد أي عمليات دفع مسجلة لهذا التاجر.
                  </td>
                </tr>
              ) : (
                payments.map((payment, idx) => (
                  <tr key={payment._id || idx} className="text-black">
                    <td className="p-2 border-r border-black text-center font-bold">
                      {idx + 1}
                    </td>
                    <td className="p-2 border-r border-black text-center font-bold">
{
  new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(payment.transactionDate || payment.createdAt))
}
                    </td>
                    <td className="p-2 border-r border-black text-center font-black">
                      {payment.moneyFlow === "incoming"
                        ? "تحصيل (استلام فلوس من التاجر)"
                        : "مصروف (دفع فلوس للتاجر)"}
                    </td>
                    <td className="p-2 border-r border-black text-center font-bold">
                      {paymentMethodNames[payment.paymentMethod] || payment.paymentMethod}
                    </td>
                    <td className="p-2 border-r border-black text-center font-black text-sm">
                      {payment.amount?.toLocaleString()} ج.م
                    </td>

                    {/* تفاصيل طريقة الدفع (شيك / محفظة / بنك) */}
                    <td className="p-2 border-r border-black text-xs font-bold">
                      {payment.paymentMethod === "cheque" && payment.cheque ? (
                        <div className="space-y-0.5 text-[10px]">
                          <p className="m-0">
                            رقم الشيك: <span className="font-black">{payment.cheque.chequeNumber}</span>
                          </p>
                          <p className="m-0">البنك: {payment.cheque.bankName}</p>
                          <p className="m-0">
                            تاريخ الاستحقاق:{" "}
                            {new Date(payment.cheque.dueDate).toLocaleDateString("ar-EG")}
                          </p>
                          <p className="m-0">
                            الحالة: {chequeStatusNames[payment.cheque.status] || payment.cheque.status}
                          </p>
                        </div>
                      ) : payment.paymentMethod === "wallet" && payment.walletInfo ? (
                        <div className="space-y-0.5 text-[10px]">
                          <p className="m-0"> اسم الراسل: {payment.walletInfo.senderName}</p>
                          <p className="m-0">رقم المرسل: {payment.walletInfo.senderPhone}</p>
                          {/* <p className="m-0">المرجع: {payment.walletInfo.transactionReference}</p> */}
                          <div className="h-[1px] border-1 border-slate-950 bg-slate-950  text-slate-950"></div>
                          <p className="m-0"> اسم المستلم: {payment.walletInfo.receiverName}</p>
                          <p className="m-0">رقم المستلم: {payment.walletInfo.receiverPhone}</p>
                        </div>
                      ) : (payment.paymentMethod === "bank" || payment.paymentMethod === "instapay") &&
                        payment.bankInfo ? (
                        <div className="space-y-0.5 text-[10px]">
                          <p className="m-0">البنك: {payment.bankInfo.bankName}</p>
                          <p className="m-0">المرجع: {payment.bankInfo.transactionReference}</p>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>

                    <td className="p-2 text-right font-medium">
                      {payment.notes || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* تنسيقات الطباعة الخاصة بالمتصفح */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background-color: white !important; margin: 0; padding: 0; color: #000 !important; }
          #invoice-capture { max-width: 100% !important; width: 100% !important; margin: 0 !important; border: none !important; box-shadow: none !important; }
          @page { size: A4; margin: 8mm; }
          .bg-gray-100 { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; }
          .bg-gray-50 { background-color: #f9fafb !important; -webkit-print-color-adjust: exact; }
          table, th, td, div { border-color: #000000 !important; }
        }
      `}</style>
    </div>
  );
};

export default SupplierPaymentsPrintPage;