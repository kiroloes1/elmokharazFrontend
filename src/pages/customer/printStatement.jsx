import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";
import html2pdf from 'html2pdf.js'
import { useSystemSettings } from "../../context/shareInfo";

const DeliveryStatement = () => {
  const { customerId } = useParams();
  const [customerData, setCustomerData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sharing, setSharing] = useState(false);
  var currOpen=0
   const { settings } = useSystemSettings();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [customerRes, deliveryRes] = await Promise.all([
          api.get(`/customers/${customerId}`),
          api.get(`/delivery/getDeliveryByCustomer/${customerId}`),
        ]);

        setCustomerData(customerRes.data.data || customerRes.data);
        setPayments(customerRes.data.payment || []);
        setDeliveries(deliveryRes.data.deliveries || []);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      fetchData();
    }
  }, [customerId]);

  const deliveriesMap = useMemo(() => {
    const map = new Map();
    deliveries.forEach(d => map.set(d._id, d));
    return map;
  }, [deliveries]);

  const translatePaymentMethod = (method) => {
    const methods = {
      cash: "نقدي",
      bank: "تحويل بنكي",
      "bank transfer": "تحويل بنكي",
      wallet: "محفظة",
      work: "شغل",
      instapay: "انستا",
      mail: "بريد",
      cheque: "شيك"
    };
    return methods[method] || method;
  };

  // ✅ تجميع الـ Payments حسب moduleId
  const groupedPayments = useMemo(() => {
    const grouped = {};
    
    payments.forEach(payment => {
      // للـ delivery، نجمع حسب moduleId
      if (payment.module === "delivery" && payment.moduleId) {
        if (!grouped[payment.moduleId]) {
          grouped[payment.moduleId] = [];
        }
        grouped[payment.moduleId].push(payment);
      }
    });

    return grouped;
  }, [payments]);

  // ✅ تجميع الحركات (الرصيد الافتتاحي + الـ Payments الغير delivery + الـ Delivery المجمعة)
  const combinedLog = useMemo(() => {
    if (!customerData) return [];

    const logs = [];



    // 2. معالجة الـ Payments غير delivery
    payments.forEach(payment => {
      if (payment.module === "delivery") {
        // نتجاوزها لأننا سنضيفها مجمعة
        return;
      }

      let label = "";
      switch (payment.module) {
        case "debt":
          label = "سداد من العميل(استلام فلوس)";
          break;
        case "pay":
          label = "دفع للعميل";
          break;
        default:
          label = payment.module || "حركة أخرى";
      }

      logs.push({
        date: payment.transactionDate,
        type: payment.module,
        label: label,
        amount: payment.amount,
        paid: payment.moneyFlow === "incoming" ? payment.amount : 0,
        paymentMethod: payment.paymentMethod,
        paymentDetails: payment,
        note: payment.notes,
        details: null,
        moneyFlow: payment.moneyFlow,
        cheque: payment.cheque,
        walletInfo: payment.walletInfo,
        bankInfo: payment.bankInfo,
        isSinglePayment: true // علامة للتمييز
      });
    });

    // 3. معالجة النقلات (delivery) - مجمعة
    
 deliveries.forEach((deliveryDetail) => {

  const deliveryPayments =
    groupedPayments[deliveryDetail._id] || [];

  const totalPaidFromPayments =
    deliveryPayments.reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );

  const paidFromDelivery =
    deliveryDetail.payment?.reduce(
      (sum, p) => sum + (p.paidAmount || 0),
      0
    ) || 0;

  const totalPaid = Math.max(
    totalPaidFromPayments,
    paidFromDelivery
  );

  
  logs.push({
    date: deliveryDetail.deliveryDate || new Date(),
    type: "delivery",
    label: `نقلة بضاعة رقم (${deliveryDetail.delveryNumber || "---"})`,
    amount: deliveryDetail.totalAmount || 0,
    paid: totalPaid,
    note: deliveryDetail.notes,
    details: deliveryDetail,
    moneyFlow: "incoming",
    isDeliveryGrouped: true,
    deliveryPayments,
    deliveryPaymentMethods: deliveryDetail.payment || []
  });

});

    // 1. الرصيد الافتتاحي
    if (customerData.openningBalance ) {
      logs.push({
        date:  customerData.openningBalanceDate || customerData.createdAt || new Date(),
        type: "opening",
        label: "رصيد افتتاحي",
        amount: customerData.openningBalance,
        paid: 0,
        note: customerData.notes || "رصيد أول المدة",
        details: null,
        isOpening: true,
        previousBalance: 0
      });

      currOpen=customerData.openningBalance
    }

    return logs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [customerData, payments, groupedPayments, deliveriesMap]);


  console.log(combinedLog)
  const filteredLog = useMemo(() => {
    return combinedLog.filter((item) => {
      if (!fromDate && !toDate) return true;
      const itemDate = new Date(item.date);
      if (fromDate && itemDate < new Date(fromDate)) return false;
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        if (itemDate > end) return false;
      }
      return true;
    });
  }, [combinedLog, fromDate, toDate]);


  

  // ✅ الحساب التتابعي
  const sequentialLedger = useMemo(() => {
    let runningBalance = 0;
    
    return filteredLog.map((op) => {
      const isDelivery = op.type === "delivery";
      const isPay = op.type === "pay";
      const isDebt = op.type === "debt";
      const isOpening = op.type === "opening";

      const tea = op.details?.teaForWorkers || 0;
      const carPay = op.details?.carPayment || 0;

      let previousBalance = runningBalance;
      
      let debtAdded = 0;
      let paymentReceived = 0;
      let currentInvoiceAmount = 0;
     let  paymentReceivedDelivery =0;

      if (isOpening) {
        debtAdded = op.amount;
        currentInvoiceAmount = op.amount;
        paymentReceived = 0;
        previousBalance = 0;
      } 
      else if (isDelivery) {
        // const deliveryTotal = op.details?.totalAmount || op.amount || 0;
        // debtAdded = deliveryTotal;
       paymentReceivedDelivery = op.paid || 0;
        // currentInvoiceAmount = deliveryTotal;
        
        // if (tea > 0) {
        //   paymentReceived += tea;
        // }
          const deliveryTotal = op.details?.totalAmount || op.amount || 0;

  debtAdded = 0;
  paymentReceived = deliveryTotal - (op.paid || 0);
  

  currentInvoiceAmount = deliveryTotal;

  if (tea > 0) {
    paymentReceived += tea;
  }
      } 
      else if (isDebt ) {
        // pay: العميل دفع للمصنع → يزيد الرصيد (+)
        debtAdded = op.amount || 0;
        paymentReceived = 0;
        currentInvoiceAmount = op.amount;
      } 
      else if ( isPay ) {
        // debt: المصنع دفع للعميل → يقل الرصيد (-)
        debtAdded = 0;
        paymentReceived = op.amount || 0;
        currentInvoiceAmount = 0;
      }

      runningBalance = previousBalance + debtAdded - paymentReceived;

      return {
        ...op,
        previousBalance,
        grossAmount: op.amount || 0,
        currentInvoiceAmount,
        debtAdded,
        paymentReceived,
        paymentReceivedDelivery,
        balance: runningBalance,
        tea,
        carPay
      };
    });
  }, [filteredLog]);

  const totals = useMemo(() => {
    let totalDeliveries = 0;
    let totalDeliveryPayment=0;
    let totalPayments = 0;
    let totalDebts = 0;
    let totalTea = 0;
    let openingBalance = 0;

    sequentialLedger.forEach(op => {
      if (op.type === "opening") {
        openingBalance = op.amount || 0;
      } else if (op.type === "delivery") {
        totalDeliveries += op.grossAmount || 0;
        totalDeliveryPayment+=op.paymentReceivedDelivery 
        totalTea += op.tea || 0;
      } else if (op.type === "debt") {
        totalPayments += op.amount || 0;
      } else if (op.type === "pay") {
        totalDebts += op.amount || 0;
      }
    });

    return {
      totalDeliveries,
      totalPayments,
      totalDebts,
      totalTea,
      openingBalance,
      totalDeliveryPayment
    };
  }, [sequentialLedger]);


   


  const handleSharePDF = async () => {
    const element = document.getElementById('invoice-capture');
    const arabicFileName = `${customerData?.name || 'العميل'}.pdf`;
    
    const options = {
      margin: 10,
      filename: arabicFileName,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        scrollX: 0,
        scrollY: 0
      },
      jsPDF: {
        unit: 'mm',
        format: [350, 500],
        orientation: 'landscape'
      }
    };

    try {
      setSharing(true);
      const pdfBlob = await html2pdf().set(options).from(element).output('blob');
      const file = new File([pdfBlob], arabicFileName, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${customerData?.name}`,
          text: `مرفق كشف الحساب التفصيلي الموحد للسيد العميل: ${customerData?.name}`
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

  if (loading) return <div className="p-10 text-center  font-bold">جاري التحميل...</div>;

  return (
    <div id='invoice' className="p-4 mx-auto text-right  " dir="rtl">
      <div className="text-lg no-print mb-6 flex flex-col md:flex-row justify-between items-center bg-gray-100 p-4 rounded gap-4">
        <h2 className="font-bold">كشف حساب موحد: {customerData?.name}</h2>
        
        <div className="grid lg:grid-cols-2 gap-2 w-full md:w-auto">
          <button 
            onClick={() => window.print()} 
            className="bg-black text-white px-5 py-2 rounded font-bold hover:bg-gray-800 transition-all text-lg flex-1 md:flex-none"
          >
            طباعة الكشف
          </button>
          <button 
            onClick={handleSharePDF}
            disabled={sharing}
            className="bg-green-700 text-white px-5 py-2 rounded font-bold hover:bg-green-800 transition-all text-lg flex-1 md:flex-none disabled:opacity-50"
          >
            {sharing ? "جاري التجهيز..." : "مشاركة كـ PDF"}
          </button>
        </div>

        <div className="no-print flex gap-3 items-center w-full md:w-auto justify-end">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border p-2 rounded text-lg"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border p-2 rounded text-lg"
          />
          <button
            onClick={() => {
              setFromDate("");
              setToDate("");
            }}
            className="bg-gray-500 text-white px-4 py-2 rounded text-lg whitespace-nowrap"
          >
            إلغاء التصفية
          </button>
        </div>
      </div>

      <div id="invoice-capture"  className="bg-white p-8 border-2  border-black print:border-0 print:p-0" dir="rtl">
        <div className="flex justify-between items-start border-b-4 border-black pb-4 mb-8">
          <div className="text-right">
            <h1 className="text-3xl font-black">
              {settings.invoiceFactoryName}
            </h1>
            <p className="font-bold mt-1">
              كشف حساب تفصيلي وحركة الأوزان و تتبع المدفوعات
            </p>
          </div>

          <div className="text-left text-lg font-bold">
            <p>تاريخ الاستخراج:</p>
            <p>
              {new Date().toLocaleString("ar-EG", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        <div className="mb-8 border-r-4 border-black pr-4">
          <p className="text-2xl font-black">اسم العميل : {customerData?.name}</p>
          <p className="text-lg text-slate-800">رقم التلفون : {customerData?.phone}</p>
          {customerData?.openningBalance > 0 && (
            <p className="text-lg text-slate-800">الرصيد الافتتاحي : {customerData.openningBalance.toLocaleString()} ج.م</p>
          )}
          <p className="text-lg text-slate-800">الرصيد الحالي : {customerData?.balance?.toLocaleString() || "0"} ج.م</p>
        </div>

        <table className="w-full border-collapse border-2 border-black text-right text-lg">
          <thead>
            <tr className="bg-gray-200 text-black font-bold text-center border-b-2 border-black">
              <th className="border border-black p-2 w-32">التاريخ والوقت</th>
              <th className="border border-black p-2 w-28">المديونية السابقة</th>
              <th className="border border-black p-2">بيان الحركة وتفاصيل الأصناف </th>
              <th className="border border-black p-2 w-36">إضافة مديونية</th>
              <th className="border border-black p-2 w-24">سداد</th>
              <th className="border border-black p-2 w-28 font-bold bg-slate-100 text-black">المرحل</th>
              <th className="border border-black p-2 w-28 font-black bg-gray-300 text-black">الرصيد الجاري</th>
            </tr>
          </thead>
          <tbody>
            {sequentialLedger.map((op, i) => {
              const isDelivery = op.type === "delivery";
              const isPay = op.type === "pay";
              const isDebt = op.type === "debt";
              const isOpening = op.type === "opening";

              return (
                <React.Fragment key={i}>
                  <tr className={`border-t border-black align-top ${isDelivery ? 'bg-white' : 'bg-gray-50'}`}>
{   !isOpening &&                 <td className="border border-black p-2 text-center font-bold text-black leading-relaxed">
                      {new Date(op.date).toLocaleString("ar-EG", {
                        weekday: "short",
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true
                      })}
                    </td>}
 {   isOpening &&                 <td className="border border-black p-2 text-center font-bold text-black leading-relaxed">
منذ البدايه
                    </td>}

                    <td className="border border-black p-2 text-center font-bold text-black bg-gray-50/50">
                      {isOpening ? "0" : op.previousBalance?.toLocaleString()} ج.م
                    </td>

                    <td className="border border-black p-2">
                      <div className="font-black text-lg text-slate-900 mb-1">{op.label}</div>

                      {isDelivery && op.details?.items && (
                        <div className="mt-1 w-full">
                          <table className="w-full text-right text-[15px] border border-gray-300 border-collapse">
                            <thead>
                              <tr className="bg-gray-50 text-black font-bold border-b border-gray-300 text-center">
                                <th className="p-1 border-l border-gray-300 text-right">الصنف</th>
                                <th className="p-1 border-l border-gray-300 text-center">الأوزان والكمية</th>
                                <th className="p-1 border-l border-gray-300 text-center">سعر الكيلو</th>
                                <th className="p-1 text-left pl-2">الإجمالي</th>
                              </tr>
                            </thead>
                            <tbody>
                              {op.details.items.map((item, idx) => {
                                const itemGrossWeight = item.totalWeight || 0;
                                const itemReturnWeight = (item.returnWeight || 0) + (item.oldReturnWeight || 0);
                                const itemNetWeight = itemGrossWeight - itemReturnWeight;

                                return (
                                  <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/30">
                                    <td className="p-2 font-bold text-black border-l border-gray-200">
                                      {item.item?.name || "غير معروف"}
                                    </td>
                                    <td className="p-2 border-l border-gray-200 text-black text-center text-lg">
                                      <div className="flex flex-col gap-0.5 text-right px-1">
                                        <div className="flex justify-between border-t border-gray-200 pt-0.5 font-black text-lg">
                                          <span>الصافي:</span>
                                          <span>{itemNetWeight.toLocaleString()} كجم</span>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="p-2 text-center border-l border-gray-200 font-medium">
                                      {item.pricePerKg?.toLocaleString()} ج.م
                                    </td>
                                    <td className="p-2 text-left font-black text-black">
                                      {item.totalPrice?.toLocaleString()} ج.م
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr className="font-black border-t-2 border-gray-400 bg-gray-50">
                                <td className="p-2 text-right">المجموع للجدول:</td>
                                <td className="p-2 text-center text-lg">
                                  <div className="flex flex-col gap-0.5 text-right px-1">
                                    <div className="flex justify-between border-t border-gray-300 pt-0.5 font-black">
                                      <span>صافي الأوزان:</span>
                                      <span>{op.details.items?.reduce((sum, i) => sum + ((i.totalWeight || 0) - ((i.returnWeight || 0) + (i.oldReturnWeight || 0))), 0).toLocaleString()} كجم</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-2"></td>
                                <td className="p-2 text-left text-base text-slate-900">
                                  {op.details.items?.reduce((sum, item) => sum + (item.totalPrice || 0), 0).toLocaleString()} ج.م
                                </td>
                              </tr>
                            </tfoot>
                          </table>

                          <div className="mt-2 flex flex-col bg-gray-100/80 p-2 border border-gray-300 rounded-sm font-bold text-[15px] gap-1.5">
                            <div className="flex justify-between items-center text-black">
                              <span>إجمالي البضاعة:</span>
                              <span className="text-slate-900">{(op.grossAmount || 0).toLocaleString()} ج.م</span>
                            </div>

                            {isDelivery && op.tea > 0 && (
                              <div className="text-slate-900 border-t border-dashed border-gray-300 pt-1.5 flex flex-col gap-1 text-[13px]">
                                <div className="flex justify-between">
                                  <span>شاي العمال:</span>
                                  <span>{op.tea?.toLocaleString()} ج.م</span>
                                </div>
                                <div className="flex justify-between font-black text-[15px] bg-white p-1.5 rounded border border-gray-200">
                                  <span>صافي السعر النهائي:</span>
                                  <span>{(op.grossAmount - op.tea)?.toLocaleString()} ج.م</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {isPay && op.paymentDetails && (
                        <div className="mt-2 text-sm">
                          <div className="font-bold">طريقة الدفع: {translatePaymentMethod(op.paymentMethod)}</div>
                          {op.paymentMethod === "cheque" && op.cheque && (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              <div>رقم الشيك: {op.cheque.chequeNumber}</div>
                              <div>البنك: {op.cheque.bankName}</div>
                              <div>تاريخ الاستحقاق: {new Date(op.cheque.dueDate).toLocaleDateString("ar-EG")}</div>
                              {/* <div>الحالة: {op.cheque.status}</div> */}
                            </div>
                          )}
                          {op.walletInfo && op.walletInfo.senderName && (
                            <div className="mt-1 text-xs">
                              <div>المحفظة: {op.walletInfo.provider || "محفظة"}</div>
                              <div>المرسل: {op.walletInfo.senderName}</div>
                              <div>رقم المرسل: {op.walletInfo.senderPhone}</div>
                            </div>
                          )}
                          {op.bankInfo && op.bankInfo.bankName && (
                            <div className="mt-1 text-xs">
                              <div>البنك: {op.bankInfo.bankName}</div>
                              {op.bankInfo.transactionReference && (
                                <div>المرجع: {op.bankInfo.transactionReference}</div>
                              )}
                            </div>
                          )}
                          {op.note && <div className="mt-1 text-gray-600">ملاحظة: {op.note}</div>}
                        </div>
                      )}

                      {isDebt && (
                        <div className="mt-2 text-sm">
                          <div className="font-bold">طريقة الدفع: {translatePaymentMethod(op.paymentMethod)}</div>
                          {op.paymentMethod === "cheque" && op.cheque && (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              <div>رقم الشيك: {op.cheque.chequeNumber}</div>
                              <div>البنك: {op.cheque.bankName}</div>
                              <div>تاريخ الاستحقاق: {new Date(op.cheque.dueDate).toLocaleDateString("ar-EG")}</div>
                            </div>
                          )}
                          {op.walletInfo && op.walletInfo.senderName && (
                            <div className="mt-1 text-xs">
                              <div>رقم المرسل: {op.walletInfo.senderPhone || ""}</div>
                              <div>المرسل: {op.walletInfo.senderName}</div>
                              <div>رقم المستلم: {op.walletInfo.receiverPhone || ""}</div>
                              <div>المستلم: {op.walletInfo.receiverName}</div>
                            </div>
                          )}
                          {op.bankInfo && op.bankInfo.bankName && (
                            <div className="mt-1 text-xs">
                              <div>البنك: {op.bankInfo.bankName}</div>
                              {op.bankInfo.transactionReference && (
                                <div>المرجع: {op.bankInfo.transactionReference}</div>
                              )}
                            </div>
                          )}
                          {op.note && <div className="mt-1 text-gray-600">ملاحظة: {op.note}</div>}
                        </div>
                      )}

                      {isOpening  && (
                        <div className="mt-2 text-sm text-700 font-bold">
                          {op.note || "رصيد أول المدة"} - {currOpen >0 ?" يضاف إلى رصيد العميل" :" يخصم من حساب العميل"}
                        </div>
                      )}
                    </td>

                    <td className="border border-black p-2 text-right text-lg bg-50/5 pt-3">
                      {(isDelivery || isDebt || isOpening || isPay) ? (
                        <div className="space-y-1 text-right">
                          <div className="text-[15px] font-semibold text-black">
                         {  !isOpening && <b>{  "المديونية السابقة"}:</b> }
                            { !isOpening  &&  <> { op.previousBalance?.toLocaleString()}  ج.م
                                      </>}                          </div>
                          <div className="text-[15px] font-semibold text-black">
                            {isDelivery && (
                              <><b>المديونيه الحاليه:</b> -{op.currentInvoiceAmount?.toLocaleString()} ج.م</>
                            )}
                            {isDebt && (
                              <><b>سداد من العميل(استلام فلوس):</b> +{op.debtAdded?.toLocaleString()} ج.م</>
                            )}
                            { isPay && (
                              <><b>دفع للعميل:</b> -{op.paymentReceived?.toLocaleString()} ج.م</>
                            )}
                            {isOpening && (
                              <><b>الرصيد الافتتاحي:</b> +{op.currentInvoiceAmount?.toLocaleString()} ج.م</>
                            )}
                          </div>
                          <div className="text-[15px] font-bold text-slate-800 border-t border-dashed pt-1 mt-1">
                            <b>{isOpening ? "الرصيد بعد الإضافة" : "الاجمالي النهائي"}:</b> 
                            {(isOpening ? op.currentInvoiceAmount :isDelivery? (op.previousBalance - op.currentInvoiceAmount)?.toLocaleString() : op.previousBalance + (op.debtAdded || 0) - (op.paymentReceived || 0)  )?.toLocaleString()} ج.م
                          </div>
                        </div>
                      ) : "-"}
                    </td>

                    <td className="border border-black p-2 text-center font-semibold text-slate-700 text-lg bg-slate-50/5 pt-3">
                      {isDelivery  && (
                        <div className="flex flex-col items-center gap-1">
                          {/* <span className="font-black text-lg">{op.paymentReceived.toLocaleString()} ج.م</span> */}
                          <span className="font-black text-lg">{op.deliveryPayments.reduce((acc,curr)=>acc+ curr.amount,0)}</span>
                          {/* ✅ عرض جميع طرق الدفع المجمعة للنقلة */}
                          <div className="w-full border-t border-gray-200 mt-1 pt-1 space-y-0.5">
                            {/* من Payments المرتبطة */}
                            {op.deliveryPayments && op.deliveryPayments.length > 0 && (
                              <>
                                {op.deliveryPayments.map((p, idx) => (
                                  <span key={`pay-${idx}`} className="text-[13px] text-slate-600 block">
                                    {translatePaymentMethod(p.paymentMethod)}: {p.amount?.toLocaleString()} ج.م
                                    {p.paymentMethod === "cheque" && p.cheque && (
                                      <span className="text-xs text-slate-500 block mr-4">
                                        (شيك رقم: {p.cheque.chequeNumber} - {p.cheque.bankName})
                                      </span>
                                    )}
                                    {p.walletInfo && p.walletInfo.senderName && (
                                      <span className="text-xs text-slate-500 block mr-4">
                                        (محفظة: {p.walletInfo.senderName})
                                      </span>
                                    )}
                                    {p.bankInfo && p.bankInfo.bankName && (
                                      <span className="text-xs text-slate-500 block mr-4">
                                        (بنك: {p.bankInfo.bankName})
                                      </span>
                                    )}
                                  </span>
                                ))}
                              </>
                            )}
                            
                            {/* من Array payment داخل النقلة (إذا كانت مختلفة) */}
                            {op.deliveryPaymentMethods && op.deliveryPaymentMethods.length > 0 && op.deliveryPayments?.length === 0 && (
                              <>
                                {op.deliveryPaymentMethods.map((p, idx) => (
                                  <span key={`del-${idx}`} className="text-[13px] text-slate-600 block">
                                    {translatePaymentMethod(p.paymentMethod)}: {p.paidAmount?.toLocaleString()} ج.م
                                  </span>
                                ))}
                              </>
                            )}
                          </div>
                          
                          {op.tea > 0 && (
                            <span className="text-[13px] block border-t border-dashed border-gray-200 w-full pt-0.5 mt-0.5">
                              شاي: {op.tea.toLocaleString()} ج.م
                            </span>
                          )}
                        </div>
                      )}

                      { isDebt &&(
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="font-black text-lg text-700">+{op.amount.toLocaleString()} ج.م</span>
                          <span className="text-[13px] font-bold block">(سداد من العميل(استلام فلوس))</span>
                          {op.paymentMethod && (
                            <span className="text-[13px] text-slate-700 font-bold block">
                              {translatePaymentMethod(op.paymentMethod)}
                            </span>
                          )}
                        </div>
                      )}

                      {isPay &&  (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="font-black text-lg text-700">-{op.amount.toLocaleString()} ج.م</span>
                          <span className="text-[13px] font-bold block">(دفع للعميل)</span>
                        </div>
                      )}

                      {isOpening && (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="font-black text-lg text-700">+{op.amount.toLocaleString()} ج.م</span>
                          <span className="text-[13px] font-bold block">(رصيد افتتاحي)</span>
                        </div>
                      )}

                      {!isDelivery && !isPay && !isDebt && !isOpening && "-"}
                    </td>

                    <td className="border border-black p-2 text-left font-bold bg-slate-50 text-lg pl-2 pt-3">
                      {(() => {
                        const diff = (op.debtAdded || 0) - (op.paymentReceived || 0);
                        if (diff > 0) return <span className="text-700">+{diff.toLocaleString()}</span>;
                        if (diff < 0) return <span className="text-700">{diff.toLocaleString()}</span>;
                        return <span className="text-black">0</span>;
                      })()} ج.م
                    </td>

                    <td className="border border-black p-2 text-left font-black bg-gray-200 text-lg pl-2 text-black pt-3">
                      {op.balance?.toLocaleString()} ج.م
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        <div className="mt-10 flex justify-end">
          <div className="border-4 border-black min-w-[400px]">
            <div className="bg-black text-white p-3 text-center font-black">
              ملخص كشف الحساب
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold">الرصيد الافتتاحي</span>
                <span className="font-black text-700">
                  {totals.openingBalance.toLocaleString()} ج.م
                </span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="font-bold">إجمالي قيمة النقلات (مشتريات العميل)</span>
                <span className="font-black text-700">
                  -{totals.totalDeliveries.toLocaleString()} ج.م
                </span>
              </div>

                            <div className="flex justify-between border-b pb-2">
                <span className="font-bold">اجمالي ما تم استلامه من حساب النقله</span>
                <span className="font-black text-700">
                  +{totals?.totalDeliveryPayment.toLocaleString()} ج.م
                </span>
              </div>

              

              <div className="flex justify-between border-b pb-2">
                <span className="font-bold">سداد من العميل(استلام فلوس)</span>
                <span className="font-black text-700">
                  +{totals.totalPayments.toLocaleString()} ج.م
                </span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="font-bold">دفع للعميل</span>
                <span className="font-black text-700">
                  -{totals.totalDebts.toLocaleString()} ج.م
                </span>
              </div>

              {totals.totalTea > 0 && (
                <div className="flex justify-between border-b pb-2">
                  <span className="font-bold">إجمالي الشاي</span>
                  <span className="font-black text-700">
                    -{totals.totalTea.toLocaleString()} ج.م
                  </span>
                </div>
              )}

              <div className="flex justify-between text-xl pt-2 border-t-2 border-black">
                <span className="font-black">الرصيد النهائي المستحق للعميل</span>
                <span className="font-black text-700">
                  {sequentialLedger.length > 0 
                    ? sequentialLedger[sequentialLedger.length - 1]?.balance?.toLocaleString() 
                    : customerData?.openningBalance?.toLocaleString() || "0"} ج.م
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
};

export default DeliveryStatement;