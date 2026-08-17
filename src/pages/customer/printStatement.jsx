import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";
import html2pdf from 'html2pdf.js';
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
  const { settings } = useSystemSettings();

  // 🔹 دالة تنسيق المبالغ طبقًا للقاعدة الموحدة
  const formatAmount = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) return "-";
    if (Number(amount) === 0) return "-";
    const absValue = Math.abs(amount).toLocaleString();
    if (amount < 0) {
      return `${absValue} -ج.م`;
    }
    return `${absValue} ج.م`;
  };

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

  const groupedPayments = useMemo(() => {
    const grouped = {};
    payments.forEach(payment => {
      if (payment.module === "delivery" && payment.moduleId) {
        if (!grouped[payment.moduleId]) {
          grouped[payment.moduleId] = [];
        }
        grouped[payment.moduleId].push(payment);
      }
    });
    return grouped;
  }, [payments]);

  const combinedLog = useMemo(() => {
    if (!customerData) return [];
    const logs = [];

    payments.forEach(payment => {
      if (payment.module === "delivery") return;

      let label = "";
      switch (payment.module) {
        case "debt":
          label = "";
          break;
        case "pay":
          label = "";
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
        isSinglePayment: true
      });
    });

    deliveries.forEach((deliveryDetail) => {
      const deliveryPayments = groupedPayments[deliveryDetail._id] || [];
      const totalPaidFromPayments = deliveryPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const paidFromDelivery = deliveryDetail.payment?.reduce((sum, p) => sum + (p.paidAmount || 0), 0) || 0;
      const totalPaid = Math.max(totalPaidFromPayments, paidFromDelivery);

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

    if (customerData.openningBalance !== undefined && customerData.openningBalance !== null) {
      logs.push({
        date: customerData.openningBalanceDate || customerData.createdAt || new Date(),
        type: "opening",
        label: "رصيد افتتاحي",
        amount: customerData.openningBalance,
        paid: 0,
        note: customerData.notes || "رصيد أول المدة",
        details: null,
        isOpening: true,
        previousBalance: 0
      });
    }

    return logs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [customerData, payments, groupedPayments, deliveriesMap]);

  const getPaymentDisplay = (payment, type = "receive") => {
    const method = payment?.paymentMethod;

    const methodNames = {
      cash: "نقدي",
      wallet: "محفظة",
      instapay: "إنستا باي",
      bank: "بنكي",
      "bank transfer": "بنكي",
      cheque: "شيك",
      mail: "بريد",
      work: "شغل",
    };

    const methodName = methodNames[method] || method || "غير محدد";

    let title = type === "send" ? "تحويل خارجي" : "استلام دفعة";

    let details = "";

    if (method === "wallet") {
      const walletInfo = payment.walletInfo || {};
      const receiverName = walletInfo.receiverName || walletInfo.senderName || "";
      const phone = walletInfo.receiverPhone || walletInfo.senderPhone || "";
      let maskedPhone = phone;
      if (phone) {
        const cleanPhone = String(phone);
        maskedPhone = cleanPhone.length > 4 ? `(...${cleanPhone.slice(-4)})` : cleanPhone;
      }
      if (receiverName || maskedPhone) {
        details = `إلى: ${receiverName || ""} ${maskedPhone}`;
      }
    }

    if (method === "bank" || method === "bank transfer") {
      const bankInfo = payment.bankInfo || {};
      const bankName = bankInfo.bankName || "";
      const transactionReference = bankInfo.transactionReference || bankInfo.reference || "";
      if (bankName || transactionReference) {
        details = [bankName, transactionReference ? `عملية: ${transactionReference}` : ""].filter(Boolean).join(" | ");
      }
    }

    if (method === "instapay") {
      const bankInfo = payment.bankInfo || {};
      const bankName = bankInfo.bankName || "";
      const transactionReference = bankInfo.transactionReference || bankInfo.reference || "";
      if (bankName || transactionReference) {
        details = [bankName, transactionReference ? `عملية: ${transactionReference}` : ""].filter(Boolean).join(" | ");
      }
    }

    if (method === "cheque") {
      const cheque = payment.cheque || {};
      const chequeNumber = cheque.chequeNumber || cheque.number || "";
      const bankName = cheque.bankName || "";
      let dueDate = "";
      if (cheque.dueDate) {
        dueDate = new Date(cheque.dueDate).toLocaleDateString("ar-EG", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        });
      }
      details = [chequeNumber ? `رقم ${chequeNumber}` : "", bankName, dueDate ? `استحقاق ${dueDate}` : ""]
        .filter(Boolean)
        .join(" | ");
    }

    return { title, methodName, details };
  };

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

  const sequentialLedger = useMemo(() => {
    let runningBalance = 0;

    return filteredLog.map((op) => {
      const isDelivery = op.type === "delivery";
      const isPay = op.type === "debt";
      const isDebt = op.type === "pay";
      const isOpening = op.type === "opening";

      const tea = op.details?.teaForWorkers || 0;
      const carPay = op.details?.carPayment || 0;

      let previousBalance = runningBalance;
      let debtAdded = 0;
      let paymentReceived = 0;
      let currentInvoiceAmount = 0;
      let paymentReceivedDelivery = 0;

      if (isOpening) {
        debtAdded = op.amount;
        currentInvoiceAmount = op.amount;
        paymentReceived = 0;
        previousBalance = 0;
      } else if (isDelivery) {
        paymentReceivedDelivery = op.paid || 0;
        const deliveryTotal = op.details?.totalAmount || op.amount || 0;

        paymentReceived = 0;
        debtAdded = deliveryTotal - (op.paid || 0);
        currentInvoiceAmount = deliveryTotal;

        if (tea > 0) {
          paymentReceived += tea;
        }
      } else if (isDebt) {
        debtAdded = op.amount || 0;
        paymentReceived = 0;
        currentInvoiceAmount = op.amount;
      } else if (isPay) {
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
    let totalDeliveryPayment = 0;
    let totalPayments = 0;
    let totalDebts = 0;
    let totalTea = 0;
    let openingBalance = 0;

    sequentialLedger.forEach(op => {
      if (op.type === "opening") {
        openingBalance = op.amount || 0;
      } else if (op.type === "delivery") {
        totalDeliveries += op.grossAmount || 0;
        totalDeliveryPayment += op.paymentReceivedDelivery;
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
    const arabicFileName = `${customerData?.name || 'التاجر'}.pdf`;

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
          text: `مرفق كشف الحساب التفصيلي الموحد للسيد التاجر: ${customerData?.name}`
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

  if (loading) return <div className="p-10 text-center font-semibold">جاري التحميل...</div>;

  return (
    <div id='invoice' className="p-4 mx-auto text-right" dir="rtl">
      <div className="text-md no-print mb-6 flex flex-col md:flex-row justify-between items-center bg-gray-100 p-4 rounded gap-4">
        <h2 className="font-semibold">كشف حساب موحد: {customerData?.name}</h2>

        <div className="grid lg:grid-cols-2 gap-2 w-full md:w-auto">
          <button
            onClick={() => window.print()}
            className="bg-black text-white px-5 py-2 rounded font-semibold hover:bg-gray-800 transition-all text-md flex-1 md:flex-none"
          >
            طباعة الكشف
          </button>
          <button
            onClick={handleSharePDF}
            disabled={sharing}
            className="bg-green-700 text-white px-5 py-2 rounded font-semibold hover:bg-green-800 transition-all text-md flex-1 md:flex-none disabled:opacity-50"
          >
            {sharing ? "جاري التجهيز..." : "مشاركة كـ PDF"}
          </button>
        </div>

        <div className="no-print flex gap-3 items-center w-full md:w-auto justify-end">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border p-2 rounded text-md"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border p-2 rounded text-md"
          />
          <button
            onClick={() => {
              setFromDate("");
              setToDate("");
            }}
            className="bg-gray-500 text-white px-4 py-2 rounded text-md whitespace-nowrap"
          >
            إلغاء التصفية
          </button>
        </div>
      </div>

      <div id="invoice-capture" className="bg-white p-8 border-2 border-black print:border-0 print:p-0" dir="rtl">
        <div className="flex justify-between items-start border-b-4 border-black pb-4 mb-8">
          <div className="text-right">
            <h1 className="text-3xl font-semibold">
              {settings.invoiceFactoryName}
            </h1>
            <p className="font-semibold mt-1">
              كشف حساب تفصيلي وحركة الأوزان و تتبع المدفوعات
            </p>
          </div>

          <div className="text-left text-md font-semibold">
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

        <div className="mb-8 border-r-4 border-black pr-4 space-y-1">
          <p className="text-2xl font-semibold text-gray-900">اسم التاجر: {customerData?.name || "---"}</p>

          {(() => {
            const currentBalance = customerData?.balance || 0;
            return (
              <p className="text-md text-slate-800">
                <span className="font-semibold">الرصيد الحالي: </span>
                <span className="font-semibold text-black">
                  {formatAmount(currentBalance)}
                </span>
              </p>
            );
          })()}
        </div>

        <table className="w-full border-collapse border-2 border-black text-right text-md">
          <thead>
            <tr className="bg-gray-200 text-black font-semibold text-center border-b-2 border-black">
              <th className="border border-black p-2 w-32">التاريخ والوقت</th>
              <th className="border border-black p-2 w-28">رصيد السابق</th>
              <th className="border border-black p-2">بيان الحركة وتفاصيل الأصناف</th>
              <th className="border border-black p-2 w-36">تفاصيل الحساب</th>
              <th className="border border-black p-2 w-24">استلام دفعه </th>
              <th className="border border-black p-2 w-28 font-semibold bg-slate-100 text-black">المرحل</th>
              <th className="border border-black p-2 w-28 font-semibold bg-gray-300 text-black">الرصيد الجاري</th>
            </tr>
          </thead>
          <tbody>
            {sequentialLedger.map((op, i) => {
              const isDelivery = op.type === "delivery";
              const isPay = op.type === "debt";
              const isDebt = op.type === "pay";
              const isOpening = op.type === "opening";

              return (
                <React.Fragment key={i}>
                  <tr className={`border-t border-black align-top ${isDelivery ? 'bg-white' : 'bg-gray-50'}`}>
                    {!isOpening && (
                      <td className="border border-black p-2 text-center font-semibold text-black leading-relaxed">
                        {new Date(op.date).toLocaleString("ar-EG", {
                          weekday: "short",
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true
                        })}
                      </td>
                    )}
                    {isOpening && (
                      <td className="border border-black p-2 text-center font-semibold text-black leading-relaxed">
                        منذ البدايه
                      </td>
                    )}

                    <td className="border border-black p-2 text-center font-semibold text-black bg-gray-50/50">
                      {isOpening ? "0 ج.م" : formatAmount(op.previousBalance)}
                    </td>

                    <td className="border border-black p-2">
                      <div className="font-semibold text-md text-slate-900 mb-1">{op.label}</div>

                      {isDelivery && op.details?.items && (
                        <div className="mt-1 w-full">
                          <table className="w-full text-right text-[12px] border border-gray-300 border-collapse">
                            <thead>
                              <tr className="bg-gray-50 text-black font-semibold border-b border-gray-300 text-center">
                                <th className="p-1 border-l border-gray-300 text-right">الصنف</th>
                                <th className="p-1 border-l border-gray-300 text-center">الأوزان والكمية</th>
                                <th className="p-1 border-l border-gray-300 text-center">السعر</th>
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
                                    <td className="p-2 font-semibold text-black border-l border-gray-200">
                                      {item.item?.name || "غير معروف"}
                                    </td>
                                    <td className="p-2 border-l border-gray-200 text-black text-center text-md">
                                      <div className="flex flex-col gap-0.5 text-right px-1">
                                        <div className="flex justify-between border-t border-gray-200 pt-0.5 font-semibold text-md">
                                          <span>الوزن:</span>
                                          <span>{itemNetWeight.toLocaleString()} كجم</span>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="p-2 text-center border-l border-gray-200 font-medium">
                                      {formatAmount(item.pricePerKg)}
                                    </td>
                                    <td className="p-2 text-left font-semibold text-black">
                                      {formatAmount(item.totalPrice)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr className="font-semibold border-t-2 border-gray-400 bg-gray-50">
                                <td className="p-1 text-right"> </td>
                                <td className="p-2 text-left text-md">
                                  <div className="flex flex-col gap-0.5 text-right px-1">
                                    <div className="flex justify-between border-t border-gray-300 pt-0.5 font-semibold">
                                      <span>الاجمالي</span>
                                      <span>{op.details.items?.reduce((sum, i) => sum + ((i.totalWeight || 0) - ((i.returnWeight || 0) + (i.oldReturnWeight || 0))), 0).toLocaleString()} كجم</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-2"></td>
                                <td className="p-2 text-left text-base text-slate-900">
                                  {formatAmount(op.details.items?.reduce((sum, item) => sum + (item.totalPrice || 0), 0))}
                                </td>
                              </tr>
                            </tfoot>
                          </table>

                          <div className=" font-semibold text-[12px] gap-1.5">
                            {isDelivery && op.tea > 0 && (
                              <div className="text-slate-900 border-t border-dashed border-gray-300 pt-1.5 flex flex-col gap-1 text-[13px]">
                                <div className="flex justify-between">
                                  <span>شاي العمال:</span>
                                  <span>{formatAmount(op.tea)}</span>
                                </div>
                                <div className="flex justify-between font-semibold text-[12px] bg-white p-1.5 rounded border border-gray-200">
                                  <span>صافي السعر النهائي:</span>
                                  <span>{formatAmount(op.grossAmount - op.tea)}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {isPay && op.paymentDetails && (
                        <div className="mt-2 text-sm text-center leading-relaxed">
                          {(() => {
                            const paymentDisplay = getPaymentDisplay(op.paymentDetails, "receive");
                            return (
                              <div>
                                <div className="font-semibold text-md">
                                  {paymentDisplay.title} - {paymentDisplay.methodName}
                                </div>
                                {paymentDisplay.details && (
                                  <div className="text-sm font-semibold mt-0.5">
                                    {paymentDisplay.details}
                                  </div>
                                )}
                                {op.note && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    {op.note}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {isDebt && (
                        <div className="mt-2 text-sm text-center leading-relaxed">
                          {(() => {
                            const paymentDisplay = getPaymentDisplay(op.paymentDetails || op, "send");
                            return (
                              <div>
                                <div className="font-semibold text-md">
                                  {paymentDisplay.title} - {paymentDisplay.methodName}
                                </div>
                                {paymentDisplay.details && (
                                  <div className="text-sm font-semibold mt-0.5">
                                    {paymentDisplay.details}
                                  </div>
                                )}
                                {op.note && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    {op.note}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {isOpening && (
                        <div className="mt-2 text-sm text-700 font-semibold">
                          {op.note || "رصيد أول المدة"}
                        </div>
                      )}
                    </td>

                    <td className="border border-black p-2 text-right text-md bg-50/5 pt-3">
                      {(isDelivery || isDebt || isOpening || isPay) ? (
                        <div className="space-y-1 text-right">
                          <div className="text-[12px] font-semibold text-black">
                            {isDelivery && <b>رصيد سابق : </b>}
                            {isDelivery && formatAmount(op.previousBalance)}
                          </div>
                          <div className="text-[12px] font-semibold text-black">
                            {isDelivery && (
                              <><b>قيمه النقله: </b>{formatAmount(op.currentInvoiceAmount)}</>
                            )}
                          </div>
                          {isOpening &&
                            <div className="text-[12px] font-semibold text-slate-800 border-t border-dashed pt-1 mt-1">
                              <b>{"الرصيد بعد الإضافة"}: </b>
                              {formatAmount(op.currentInvoiceAmount)}
                            </div>}

                          {isDelivery &&
                            <div className="text-[12px] font-semibold text-slate-800 border-t border-dashed pt-1 mt-1">
                              <b>{"الاجمالي "}: </b>
                              {formatAmount(op.previousBalance + op.currentInvoiceAmount)}
                            </div>}

                          {!isDelivery && !isOpening &&
                            <div className="text-[12px] font-semibold text-slate-800 border-t border-dashed pt-1 mt-1 text-center">
                              ----
                            </div>}
                        </div>
                      ) : "-"}
                    </td>

                    <td className="border border-black p-2 text-center font-semibold text-slate-700 text-md bg-slate-50/5 pt-3">

                      {/* نقلة - عرض كل وسيلة دفع ومبلغها بدون تكرار */}
                      {isDelivery && (() => {
                        const totalDeliveryPayment = (op.deliveryPayments || []).reduce(
                          (acc, curr) => acc + (Number(curr.amount) || 0), 0
                        );
                        const totalDeliveryPaymentMethods = (op.deliveryPaymentMethods || []).reduce(
                          (acc, curr) => acc + (Number(curr.paidAmount) || 0), 0
                        );

                        // نفضّل مصدر المدفوعات التفصيلي (فيه تفاصيل شيك/محفظة/بنك) لو موجود ومبلغه أكبر من صفر
                        const useDetailed = totalDeliveryPayment > 0;
                        const totalPayment = useDetailed ? totalDeliveryPayment : totalDeliveryPaymentMethods;

                        if (totalPayment === 0) return null;

                        const rows = useDetailed
                          ? (op.deliveryPayments || []).filter(p => Number(p.amount))
                          : (op.deliveryPaymentMethods || []).filter(p => Number(p.paidAmount));

                        return (
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-semibold text-md">
                              {formatAmount(totalPayment)}
                            </span>

                            <div className="w-full border-t border-gray-200 mt-1 pt-1 space-y-1">
                              {rows.map((p, idx) => {
                                const amount = useDetailed ? p.amount : p.paidAmount;
                                const paymentDisplay = getPaymentDisplay(p, "receive");

                                return (
                                  <div
                                    key={`${useDetailed ? "pay" : "del"}-${idx}`}
                                    className="text-[13px] text-slate-700 text-center py-1"
                                  >
                                    <div className="font-semibold">
                                      {formatAmount(amount)}: {paymentDisplay.methodName}
                                    </div>
                                    
                                    {paymentDisplay.details && (
                                      <div className="text-[12px]">
                                        {paymentDisplay.details}
                                      </div>

                                  
                                    )}

                                        <span>------------</span>
                                  </div>
                                );
                              })}
                            </div>

                            {op.tea > 0 && (
                              <span className="text-[13px] block border-t border-dashed border-gray-200 w-full pt-0.5 mt-0.5">
                                شاي: {formatAmount(op.tea)}
                              </span>
                            )}
                          </div>
                        );
                      })()}

                      {/* استلام فلوس */}
                      {isPay && Number(op.amount) !== 0 && (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="font-semibold text-md text-700">
                           {formatAmount(-op.amount)}: {translatePaymentMethod(op.paymentMethod)}
                          </span>
                        </div>
                      )}

                      {/* سداد للتاجر */}
                      {isDebt && Number(op.amount) !== 0 && (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="font-semibold text-md text-700">
                         {formatAmount(op.amount)}  :  {translatePaymentMethod(op.paymentMethod)}
                          </span>
                        </div>
                      )}

                      {/* الرصيد الافتتاحي */}
                      {isOpening && Number(op.amount) !== 0 && (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="font-semibold text-md text-700">
                            {formatAmount(op.amount)}
                          </span>
                          <span className="text-[13px] font-semibold block">
                            (رصيد افتتاحي)
                          </span>
                        </div>
                      )}

                    </td>

                    <td className="border border-black p-2 text-left font-semibold bg-slate-50 text-md pl-2 pt-3">
                      {(() => {
                        const diff = (op.debtAdded || 0) - (op.paymentReceived || 0);
                        return (
                          <span className="text-black">
                            {formatAmount(diff)}
                          </span>
                        );
                      })()}
                    </td>

                    <td className="border border-black p-2 text-left font-semibold bg-gray-200 text-md pl-2 text-black pt-3">
                      {formatAmount(op.balance)}
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        {(() => {
          const openingBalance = totals.openingBalance || 0;
          const debts = totals.totalDebts || 0;

          const totalDebt = openingBalance > 0 ? openingBalance + debts : debts;
          const totalPayment = openingBalance < 0 ? Math.abs(openingBalance) : 0;

          const totalReceived = (totals.totalDeliveryPayment || 0) + (totals.totalPayments || 0);

          const finalBalance =
            openingBalance +
            (totals.totalDeliveries || 0) +
            debts -
            totalReceived -
            (totals.totalTea || 0);

          return (
            <div className="mt-10 flex justify-end">
              <div className="border-4 border-black min-w-[400px]">

                <div className="bg-black text-white p-3 text-center font-semibold">
                  ملخص كشف الحساب
                </div>

                <div className="p-4 space-y-3">

                  <div className="flex justify-between border-b pb-2">
                    <span className="font-semibold">
                      إجمالي قيمة النقلات
                    </span>
                    <span className="font-semibold">
                      {formatAmount(totals.totalDeliveries)}
                    </span>
                  </div>

                  <div className="flex justify-between border-b pb-2">
                    <span className="font-semibold">
                      إجمالي الفلوس المستلمة
                    </span>
                    <span className="font-semibold">
                      {formatAmount(-totalReceived)}
                    </span>
                  </div>

                  {(totalDebt > 0 || totalPayment > 0) && (
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-semibold">
                        {openingBalance < 0 ? "إجمالي السداد" : "إجمالي المديونية"}
                      </span>
                      <span className="font-semibold">
                        {formatAmount(openingBalance < 0 ? -totalPayment : totalDebt)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xl pt-3 border-t-2 border-black">
                    <span className="font-semibold">
                      المتبقي النهائي
                    </span>
                    <span className="font-semibold text-black">
                      {formatAmount(finalBalance)}
                    </span>
                  </div>

                </div>
              </div>
            </div>
          );
        })()}
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
