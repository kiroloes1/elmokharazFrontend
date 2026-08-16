import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import html2pdf from 'html2pdf.js';
import { useSystemSettings } from '../../context/shareInfo';

const PrintDeliveryPage = () => {
  const { id } = useParams();
  const [delivery, setDelivery] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

   const { settings } = useSystemSettings();
  // خريطة أسماء طرق الدفع بالعربية
  const paymentMethodNames = {
    cash: 'نقدي',
    wallet: 'محفظة إلكترونية',
    instapay: 'إنستا باي',
    bank: 'تحويل بنكي',
    mail: 'بريد',
    work: 'شغل',
    cheque: 'شيك'
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const deliveryRes = await api.get(`/delivery/${id}`);
        const deliveryData = deliveryRes.data.delivery || deliveryRes.data;
        setDelivery(deliveryData);

        if (deliveryData.supplier?._id || deliveryData.supplier) {
          const supplierId = deliveryData.supplier?._id || deliveryData.supplier;
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
  if (!delivery) return <div className="p-10 text-center font-bold text-black">خطأ في تحميل البيانات</div>;

  // الحسابات المعتمدة على البيانات الحقيقية من API
  const totalWeight = delivery.items?.reduce((sum, item) => sum + (item.totalWeight || 0), 0) || 0;
  const returnWeight = delivery.items?.reduce((sum, item) => sum + (item.returnWeight || 0), 0) || 0;
  const oldReturnWeight = delivery.items?.reduce((sum, item) => sum + (item.oldReturnWeight || 0), 0) || 0;
  const totalNetWeight =(0, totalWeight - returnWeight);

  // إجمالي قيمة الصافي للنقلة الحالية (الوزن الصافي * السعر)
  const currentNetItemsTotal = delivery.items?.reduce((sum, item) => {
    const netWeight = (0, (item.totalWeight || 0) - (item.returnWeight || 0));
    return sum + (netWeight * (item.pricePerKg || 0));
  }, 0) || 0;

  // حساب قيمة الراجع القديم
  const oldReturnItems = delivery.items?.filter(item => (item.oldReturnWeight || 0) > 0) || [];
  const totalOldReturnValue = oldReturnItems.reduce((sum, item) => sum + ((item.oldReturnWeight || 0) * (item.pricePerKg || 0)), 0);

  // الحساب المالي الإجمالي
  const oldBalance = delivery.oldBalance || 0;
  const teaForWorkers = delivery.teaForWorkers || 0;
  const paidAmount = delivery.paidAmount || 0;
  
  // الإجمالي المتبقي بعد إضافة القديم وخصم الراجع القديم والمدفوع والعمّال
  const finalBalance = oldBalance + currentNetItemsTotal - totalOldReturnValue - teaForWorkers - paidAmount;

  const handlePrint = () => {
    window.print();
  };

  const handleSharePDF = async () => {
    const element = document.getElementById('invoice-capture');
    const arabicFileName = `فاتورة_نقلة_${delivery.delveryNumber}.pdf`;
    
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
          title: `نقلة #${delivery.delveryNumber}`,
          text: `مرفق فاتورة نقلة السيد: ${supplier?.name || delivery.supplier?.name || "تاجر عام"}`
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
    <div id='invoice' className={`min-h-screen  p-0 md:p-6 text-right font-${settings?.invoiceFont}}  text-black`} dir="rtl" style={{fontFamily:`${settings?.invoiceFont} ||cairo `}}>
      
      {/* هيدر التحكم - يختفي عند الطباعة */}
      <div className="max-w-4xl mx-auto mb-4 no-print flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-black gap-3 -sm">
        <div>
          <h2 className="text-base font-normal text-black">معاينة الفاتورة للطباعة والمشاركة</h2>
          <p className="text-xs text-gray-700 font-bold">نقلة رقم #{delivery.delveryNumber} - {supplier?.name || delivery.supplier?.name}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={handlePrint}
            className="bg-black text-white px-5 py-2.5 rounded-lg font-bold hover:bg-gray-800 transition-all text-xs -sm flex-1 sm:flex-none"
          >
            طباعة الفاتورة
          </button>
          <button 
            onClick={handleSharePDF}
            disabled={sharing}
            className="bg-gray-800 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-black transition-all text-xs -sm flex-1 sm:flex-none disabled:opacity-50"
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
                  <h1 className="text-2xl font-normal text-black m-0"> {settings?.invoiceFactoryName || "مصنع المخرز"}</h1>
                  <div className="text-xs font-bold text-black mt-3 space-y-1">
                    <p className="m-0">السيد التاجر: <span className="font-normal">{supplier?.name || delivery.supplier?.name || "تاجر عام"}</span></p>
                    <p className="m-0">رصيد التاجر : <span className="font-normal">{ delivery.supplier?.balance || 0}</span></p>
                    <p className="m-0">المستلم: <span className="font-bold">{delivery.receivedBy?.username || "غير محدد"}</span></p>
                    <p className="m-0">اسم السائق: <span className="font-bold">{delivery.carName || "غير محدد"}</span></p>

                  </div>
                </td>

                <td className="text-left align-top min-w-[160px]">
                  <div className="p-3 border-2 border-black inline-block text-right">
                    <p className="font-normal text-xs text-black m-0">نقلة رقم: #{delivery.delveryNumber}</p>
                    <p className="text-black text-[11px] font-bold m-0 mt-1">
                      {new Date(delivery.deliveryDate || delivery.createdAt).toLocaleString("ar-EG", {
                        timeZone: "Africa/Cairo",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* جدول الأصناف الرئيسي */}
        <div className="mb-4">
          <h3 className="text-xs font-normal text-black mb-2 border-r-4 border-black pr-2 uppercase">تفاصيل أصناف النقلة الحالية</h3>
          <table className="w-full text-right border-collapse border-2 border-black text-xs">
            <thead>
              <tr className="bg-gray-100 text-black border-b-2 border-black font-normal">
                <th className="p-2 border-r border-black text-right">الصنف</th>
                <th className="p-2 border-r border-black text-center">الباتشات / الأوزان</th>
                <th className="p-2 border-r border-black text-center">الوزن القائم</th>
                {/* <th className="p-2 border-r border-black text-center">راجع حالي</th> */}
                <th className="p-2 border-r border-black text-center">الصافي</th>
                <th className="p-2 border-r border-black text-center">سعر الكيلو</th>
                <th className="p-2 border-r border-black text-left">إجمالي الصنف</th>
              </tr>
            </thead>
         <tbody className="divide-y divide-black">
  {delivery.items
    ?.filter(item => (item.totalWeight || 0) > 0 || (item.returnWeight || 0 ) >0)
    .map((item, idx) => {
      const itemNetWeight = (
        0,
        (item.totalWeight || 0) - (item.returnWeight || 0)
      );

      const itemTotalPrice = itemNetWeight * (item.pricePerKg || 0);

      return (
        <tr key={item._id || idx} className="text-black">
          <td className="p-2 border-r border-black font-normal">
            {item.item?.name || "صنف بدون اسم"}
          </td>

          <td className="p-2 border-r border-black text-center">
            <div className="flex flex-wrap justify-center gap-1">
              {item.batches?.map((batch, bIdx) => (
                <span
                  key={bIdx}
                  className="px-1.5 py-0.5 border border-black rounded text-[10px] font-bold"
                >
                  {batch.weight} كجم{" "}
                  {batch.quantity > 1 ? `(${batch.quantity}x)` : ""}
                </span>
              ))}
            </div>
          </td>

          <td className="p-2 border-r border-black text-center font-bold">
            {item.totalWeight.toLocaleString()} كجم
          </td>

          {/* <td className="p-2 border-r border-black text-center font-bold">
            {item.returnWeight > 0 ? `-${item.returnWeight}` : "0"} كجم
          </td> */}

          <td className="p-2 border-r border-black text-center font-normal">
            {itemNetWeight.toLocaleString()} كجم
          </td>

          <td className="p-2 border-r border-black text-center font-bold">
            {(item.pricePerKg || 0).toLocaleString()} ج.م
          </td>

          <td className="p-2 text-left border-r border-black font-normal">
            {itemTotalPrice.toLocaleString()} ج.م
          </td>
        </tr>
      );
    })}
</tbody>
          </table>

          {/* ملخص أوزان الأصناف */}
          {/* <div className="grid grid-cols-4 gap-2 my-3 text-xs">
            <div className="border border-black p-2 text-center">
              <div className="font-bold text-black text-[10px]">إجمالي الوزن القائم</div>
              <div className="font-normal text-black text-sm mt-0.5">{totalWeight.toLocaleString()} كجم</div>
            </div>
            <div className="border border-black p-2 text-center">
              <div className="font-bold text-black text-[10px]">إجمالي الراجع الحالي</div>
              <div className="font-normal text-black text-sm mt-0.5">{returnWeight.toLocaleString()} كجم</div>
            </div>
            <div className="border border-black p-2 text-center">
              <div className="font-bold text-black text-[10px]">صافي الوزن الحالي</div>
              <div className="font-normal text-black text-sm mt-0.5">{totalNetWeight.toLocaleString()} كجم</div>
            </div>
            <div className="border-2 border-black p-2 text-center bg-gray-50">
              <div className="font-bold text-black text-[10px]">صافي قيمة النقلة</div>
              <div className="font-normal text-black text-sm mt-0.5">{currentNetItemsTotal.toLocaleString()} ج.م</div>
            </div>
          </div> */}
        </div>

        {/* جدول الراجع القديم - يظهر فقط إن وجد */}
        {oldReturnItems.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-normal text-black mb-2 border-r-4 border-black pr-2 uppercase">تفاصيل الراجع القديم (مخصوم)</h3>
            <table className="w-full border-collapse border-2 border-black text-xs text-center">
              <thead className="bg-gray-100 font-normal border-b-2 border-black">
                <tr>
                  <th className="border-r border-black p-2 text-right">الصنف</th>
                  <th className="border-r border-black p-2">وزن الراجع القديم</th>
                  <th className="border-r border-black p-2">سعر الكيلو</th>
                  <th className="p-2 text-left">إجمالي المخصوم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black">
                {oldReturnItems.map((item) => (
                  <tr key={item._id}>
                    <td className="border-r border-black p-2 text-right font-normal">{item.item?.name}</td>
                    <td className="border-r border-black p-2 font-bold">{item.oldReturnWeight} كجم</td>
                    <td className="border-r border-black p-2 font-bold">{item.pricePerKg} ج.م</td>
                    <td className="p-2 text-left font-normal">{(item.oldReturnWeight * item.pricePerKg).toLocaleString()} ج.م</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="font-normal border-t-2 border-black bg-gray-50">
                <tr>
                  <td colSpan={2} className="p-2 border-r border-black text-right">
                    إجمالي الراجع القديم: <span className="font-bold">{oldReturnWeight.toLocaleString()} كجم</span>
                  </td>
                  <td colSpan={2} className="p-2 text-left">
                    إجمالي المخصوم: <span className="font-normal">{totalOldReturnValue.toLocaleString()} ج.م</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* الحساب المالي والتفاصيل */}
        <div className="mt-4">
          <table className="w-full text-xs" style={{ borderCollapse: 'collapse', border: 'none' }}>
            <tbody>
              <tr>
                {/* التفاصيل المالية الحسابية (اليمين) */}
                <td className="align-top w-1/2 pl-2">
                  <div className="border-2 border-black overflow-hidden">
                    <div className="bg-gray-100 text-black p-2 text-center font-normal border-b-2 border-black">
                      كشف الحساب المالي
                    </div>
                    
                    <div className="p-3">
                      <table className="w-full text-right">
                        <tbody className="-">
                          <tr>
                            <td className="text-black font-bold py-1.5">الرصيد السابق للتاجر:</td>
                            <td className="font-normal text-black text-left py-1.5">{oldBalance.toLocaleString()} ج.م</td>
                          </tr>
                          <tr>
                            <td className="text-black font-bold py-1.5">صافي قيمة النقلة الحالية:</td>
                            <td className="font-normal text-black text-left py-1.5">+{currentNetItemsTotal.toLocaleString()} ج.م</td>
                          </tr>
                          <tr className='border-t-2'>
                            <td className="text-black font-bold py-1.5">المجموع (القديم + النقلة):</td>
                            <td className="font-normal text-black text-left py-1.5">{(oldBalance + currentNetItemsTotal).toLocaleString()} ج.م</td>
                          </tr>
                          {totalOldReturnValue > 0 && (
                            <tr>
                              <td className="text-black font-bold py-1.5">اجمالي  راجع قديم:</td>
                              <td className="font-normal text-black text-left py-1.5">-{totalOldReturnValue.toLocaleString()} ج.م</td>
                            </tr>
                          )}
                          {teaForWorkers > 0 && (
                            <tr>
                              <td className="text-black font-bold py-1.5">إكرامية/شاي عمال:</td>
                              <td className="font-normal text-black text-left py-1.5">-{teaForWorkers.toLocaleString()} ج.م</td>
                            </tr>
                          )}
                          <tr>
                            <td className="text-black font-bold py-1.5">إجمالي المدفوع الآن:</td>
                            <td className="font-normal text-black text-left py-1.5">-{paidAmount.toLocaleString()} ج.م</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-gray-100 p-3 text-black border-t-2 border-black">
                      <div className="flex justify-between items-center">
                        <span className="font-normal underline">الرصيد المتبقي النهائي:</span>
                        <span className="text-sm font-normal">{((oldBalance + currentNetItemsTotal)-totalOldReturnValue -paidAmount).toLocaleString()} ج.م</span>
                      </div>
                    </div>
                  </div>
                </td>

                {/* طرق الدفع والملاحظات (اليسار) */}
                <td className="align-top w-1/2 pr-2">
                  <div className="space-y-3">
                    <div className="border border-black p-3 bg-white">
                      <h4 className="text-[11px] font-normal text-black mb-2 border-b border-black pb-1 m-0">تفاصيل وسائط الدفع للنقلة:</h4>
                      <table className="w-full text-right text-[11px]">
                        <tbody className="divide-y divide-black/20">
                          {delivery.payment?.map((p, i) => (
                            <tr key={p._id || i}>
                              <td className="text-black font-bold py-1">
                                {paymentMethodNames[p.paymentMethod] || p.paymentMethod}:
                              </td>
                              <td className="text-black font-normal text-left py-1">
                                {p.paidAmount?.toLocaleString()} ج.م
                              </td>
                            </tr>
                          ))}
                          <tr className="font-normal border-t border-black">
                            <td className="pt-2 text-black">إجمالي المدفوع:</td>
                            <td className="text-black text-left pt-2">{paidAmount.toLocaleString()} ج.م</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="border border-black p-2.5 bg-gray-50">
                      <p className="text-[10px] font-normal text-black mb-1 m-0">ملاحظات الفاتورة:</p>
                      <p className="text-[11px] font-bold text-black leading-relaxed m-0">
                        {delivery.notes || "لا توجد ملاحظات إضافية."}
                      </p>
                    </div>
                  </div>
                </td> 
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* تنسيقات الطباعة */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background-color: white !important; margin: 0; padding: 0; color: #000 !important; }
          #invoice-capture { max-width: 100% !important; width: 100% !important; margin: 0 !important; border: none !important; box-: none !important; }
          @page { size: A4; margin: 8mm; }
          .bg-gray-100 { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; }
          .bg-gray-50 { background-color: #f9fafb !important; -webkit-print-color-adjust: exact; }
          table, th, td, div { border-color: #000000 !important; }
        }
      `}</style>
    </div>
  );
};

export default PrintDeliveryPage;