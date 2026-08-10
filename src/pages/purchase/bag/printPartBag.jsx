import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import { useSystemSettings } from '../../../context/shareInfo';
import api from '../../../services/api';

const PrintBagPartPage = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  const { settings } = useSystemSettings();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const invoiceRes = await api.get(`/bag/${id}`);
        const invoiceData = invoiceRes.data.bag || invoiceRes.data;
        setInvoice(invoiceData);

        if (invoiceData.supplier?._id || invoiceData.supplier) {
          const supplierId = invoiceData.supplier?._id || invoiceData.supplier;
          const supplierRes = await api.get(`/suppliers/${supplierId}`);
          setSupplier(supplierRes.data.data || supplierRes.data);
        }
      } catch (error) {
        console.error("Error fetching print data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="p-10 text-center font-bold text-black">جاري تجهيز الفاتورة للطباعة...</div>;
  if (!invoice) return <div className="p-10 text-center font-bold text-black">خطأ في تحميل البيانات</div>;

  // حساب إجمالي عدد الأصناف
  const totalItems = invoice.items?.length || 0;
  
  // حساب إجمالي الكميات
  const totalQuantity = invoice.items?.reduce((sum, item) => {
    const quantity = item.quantity || 0;
    return sum + quantity;
  }, 0) || 0;

  // حساب إجمالي قيمة الشكاير
  const totalBagValue = invoice.items?.reduce((sum, item) => {
    const total = item.total || (item.quantity * item.unitPrice) || 0;
    return sum + total;
  }, 0) || 0;

  // إجمالي المدفوع من المدفوعات المرتبطة
  const totalPaid = invoice.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
  
  // الرصيد المتبقي
  const remainingAmount = invoice.remainingAmount || (invoice.totalAmount - totalPaid);

  // حساب الرصيد النهائي (الرصيد القديم + صافي الفاتورة)
  const oldBalance = invoice.oldBalance || 0;
  const netDue = invoice.totalAmount - totalPaid;
  const finalBalance = oldBalance + netDue;

  const handlePrint = () => {
    window.print();
  };

  const handleSharePDF = async () => {
    const element = document.getElementById('invoice-capture');
    const arabicFileName = `فاتورة_شراء_شكاير_${invoice.invoiceNumber}.pdf`;
    
    const options = {
      margin: 8,
      filename: arabicFileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      setSharing(true);
      const pdfBlob = await html2pdf().set(options).from(element).output('blob');
      const file = new File([pdfBlob], arabicFileName, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `فاتورة شراء شكاير #${invoice.invoiceNumber}`,
          text: `مرفق فاتورة شراء شكاير من: ${supplier?.name || invoice.supplier?.name || "تاجر  عام"}`
        });
      } else {
        html2pdf().set(options).from(element).save();
      }
    } catch (error) {
      console.error("Error sharing PDF:", error);
      alert("حدث خطأ أثناء محاولة مشاركة الملف.");
    } finally {
      setSharing(false);
    }
  };

  return (
    <div id='invoice' className={`min-h-screen p-0 md:p-6 text-right font-${settings?.invoiceFont} text-black`} dir="rtl" style={{fontFamily: `${settings?.invoiceFont} || cairo`}}>
      
      {/* هيدر التحكم - يختفي عند الطباعة */}
      <div className="max-w-4xl mx-auto mb-4 no-print flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-black gap-3">
        <div>
          <h2 className="text-base font-black text-black">معاينة الفاتورة للطباعة والمشاركة</h2>
          <p className="text-xs text-gray-700 font-bold">فاتورة شراء شكاير #{invoice.invoiceNumber} - {supplier?.name || invoice.supplier?.name}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={handlePrint}
            className="bg-black text-white px-5 py-2.5 rounded-lg font-bold hover:bg-gray-800 transition-all text-xs flex-1 sm:flex-none"
          >
            طباعة الفاتورة
          </button>
          <button 
            onClick={handleSharePDF}
            disabled={sharing}
            className="bg-gray-800 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-black transition-all text-xs flex-1 sm:flex-none disabled:opacity-50"
          >
            {sharing ? "جاري التجهيز..." : "مشاركة كـ PDF"}
          </button>
        </div>
      </div>

      {/* جسم الفاتورة الرئيسي - أبيض وأسود بالكامل */}
      <div 
        id="invoice-capture" 
        className="max-w-4xl mx-auto bg-white p-6 border-2 border-black print:border-none print:m-0 print:p-0 text-black"
        dir="rtl"
      >
        {/* الهيدر العلوي */}
        <div className="border-b-2 border-black pb-4 mb-4">
          <table className="w-full text-right" style={{ borderCollapse: 'collapse', border: 'none' }}>
            <tbody>
              <tr>
                <td className="align-top">
                  <h1 className="text-2xl font-black text-black m-0">{settings?.invoiceFactoryName || "مصنع المخرز"}</h1>
                  <div className="text-xs font-bold text-black mt-3 space-y-1">
                    <p className="m-0">التاجر : <span className="font-black">{supplier?.name || invoice.supplier?.name || "تاجر  عام"}</span></p>
                    <p className="m-0">رصيد التاجر : <span className="font-black">{supplier?.balance?.toLocaleString() || 0} ج.م</span></p>
                    {invoice.oldBalance > 0 && (
                      <p className="m-0">الرصيد القديم: <span className="font-black">{invoice.oldBalance.toLocaleString()} ج.م</span></p>
                    )}
                  </div>
                </td>

                <td className="text-left align-top min-w-[160px]">
                  <div className="p-3 border-2 border-black inline-block text-right">
                    <p className="font-black text-xs text-black m-0">فاتورة شراء شكاير #{invoice.invoiceNumber}</p>
                    <p className="text-black text-[11px] font-bold m-0 mt-1">
                      {new Date(invoice.purchaseDate || invoice.createdAt).toLocaleString("ar-EG", {
                        timeZone: "Africa/Cairo",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-black text-[10px] font-bold m-0 mt-1 border-t border-black pt-1">
                      حالة الدفع: {
                        invoice.paymentStatus === 'paid' ? 'مدفوع بالكامل' :
                        invoice.paymentStatus === 'partial' ? 'مدفوع جزئياً' : 'غير مدفوع'
                      }
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* جدول الشكاير المشتراة */}
        <div className="mb-4">
          <h3 className="text-xs font-black text-black mb-2 border-r-4 border-black pr-2 uppercase">أصناف الشكاير المشتراة</h3>
          <table className="w-full text-right border-collapse border-2 border-black text-xs">
            <thead>
              <tr className="bg-gray-100 text-black border-b-2 border-black font-black">
                <th className="p-2 border-r border-black text-center">#</th>
                <th className="p-2 border-r border-black text-right">نوع الشكارة</th>
                <th className="p-2 border-r border-black text-center">المقاس</th>
                <th className="p-2 border-r border-black text-center">الكمية</th>
                <th className="p-2 border-r border-black text-center">سعر الوحدة</th>
                <th className="p-2 text-left">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black">
              {invoice.items?.map((item, idx) => {
                const quantity = item.quantity || 0;
                const unitPrice = item.unitPrice || 0;
                const total = item.total || (quantity * unitPrice) || 0;

                return (
                  <tr key={item._id || idx} className="text-black">
                    <td className="p-2 border-r border-black text-center font-bold">{idx + 1}</td>
                    <td className="p-2 border-r border-black font-black">
                      {item.bagType?.name || "بدون نوع"}
                    </td>
                    <td className="p-2 border-r border-black text-center">
                      {item.size || "—"}
                    </td>
                    <td className="p-2 border-r border-black text-center font-bold">
                      {quantity}
                    </td>
                    <td className="p-2 border-r border-black text-center font-bold">
                      {unitPrice.toLocaleString()} ج.م
                    </td>
                    <td className="p-2 text-left font-black">
                      {total.toLocaleString()} ج.م
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Footer الجدول */}
            <tfoot className="border-t-2 border-black bg-gray-50 font-black">
              <tr>
                <td colSpan={2} className="p-2 border-r border-black text-right">
                  إجمالي عدد الأصناف: {totalItems}
                </td>
                <td className="p-2 border-r border-black text-center">—</td>
                <td className="p-2 border-r border-black text-center font-black">
                  {totalQuantity}
                </td>
                <td className="p-2 border-r border-black text-center">—</td>
                <td className="p-2 text-left font-black text-lg">
                  {totalBagValue.toLocaleString()} ج.م
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

   
      </div>

      {/* تنسيقات الطباعة */}
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

export default PrintBagPartPage;