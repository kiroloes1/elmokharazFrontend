import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";
import html2pdf from "html2pdf.js";
import { useSystemSettings } from "../../context/shareInfo";

/**
 * ⚠️ عدّل المسارات دي لو مختلفة عندك في الراوتس الفعلية
 * الافتراض اني بنيتها على نفس نمط الـ delivery/customer
 */
const PURCHASE_TYPES = {
  bag: {
    label: "شكاير",
    endpoint: (id) => `/bag/getBagBySupplier/${id}`,
    dataKey: "bags",
  },
  wire: {
    label: "سلك",
    endpoint: (id) => `/wire/getWireBySupplier/${id}`,
    dataKey: "wires",
  },
  equipment: {
    label: "معدات",
    endpoint: (id) => `/equipmnet/getEquipmentBySupplier/${id}`,
    dataKey: "equipments",
  },
  equipment_supply: {
    label: "مستلزمات معدات",
    endpoint: (id) => `/equipmentSupply/getEquipmentSupplyBySupplier/${id}`,
    dataKey: "equipments",
  },
  maintenance: {
    label: "صيانة",
    endpoint: (id) => `/maintenance/getMaintainsBySupplier/${id}`,
    dataKey: "maintains",
  },
};

const PURCHASE_TYPE_KEYS = Object.keys(PURCHASE_TYPES);

const SupplierStatement = () => {
  const { supplierId } = useParams();
  const [supplierData, setSupplierData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [purchasesByType, setPurchasesByType] = useState({});
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sharing, setSharing] = useState(false);

  const { settings } = useSystemSettings();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [supplierRes, ...purchaseResList] = await Promise.all([
          api.get(`/suppliers/${supplierId}`), // ⚠️ عدّل لو الراوت مختلف
          ...PURCHASE_TYPE_KEYS.map((type) =>
            api.get(PURCHASE_TYPES[type].endpoint(supplierId))
          ),
        ]);

        setSupplierData(supplierRes.data.data || supplierRes.data);
        setPayments(supplierRes.data.payment || []);

        const purchasesMap = {};
        PURCHASE_TYPE_KEYS.forEach((type, idx) => {
          const dataKey = PURCHASE_TYPES[type].dataKey;
          purchasesMap[type] = purchaseResList[idx]?.data?.[dataKey] || [];
        });
        setPurchasesByType(purchasesMap);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (supplierId) {
      fetchData();
    }
  }, [supplierId]);

  const translatePaymentMethod = (method) => {
    const methods = {
      cash: "نقدي",
      bank: "تحويل بنكي",
      "bank transfer": "تحويل بنكي",
      wallet: "محفظة",
      work: "شغل",
      instapay: "انستا",
      mail: "بريد",
      cheque: "شيك",
    };
    return methods[method] || method;
  };

  // بيانات وأصناف كل نوع فاتورة (بيختلف شكل items حسب النوع)
  const getItemRows = (type, doc) => {
    const items = doc.items || [];
    switch (type) {
      case "bag":
        return items.map((i) => ({
          name: i.bagType?.name || "غير معروف",
          extra: i.size,
          qty: i.quantity,
          price: i.unitPrice,
          total: i.total,
        }));
      case "wire":
        return items.map((i) => ({
          name: i.wireType?.name || "غير معروف",
          extra: i.size,
          qty: i.quantity,
          price: i.unitPrice,
          total: i.total,
        }));
      case "equipment":
        return items.map((i) => ({
          name: i.equipmentName || "غير معروف",
          extra: i.type,
          qty: i.quantity,
          price: i.unitPrice,
          total: i.total,
        }));
      case "equipment_supply":
        return items.map((i) => ({
          name: i.itemName || "غير معروف",
          extra: i.type,
          qty: i.quantity,
          price: i.unitPrice,
          total: i.total,
        }));
      case "maintenance":
        return items.map((i) => ({
          name: i.partName || "غير معروف",
          extra: i.faultDescription,
          qty: null,
          price: null,
          total: i.repairCost,
        }));
      default:
        return [];
    }
  };

  const getLabel = (type, doc) => {
    const num = doc.invoiceNumber ?? "---";
    switch (type) {
      case "bag":
        return `فاتورة شكاير رقم (${num})`;
      case "wire":
        return `فاتورة سلك رقم (${num})`;
      case "equipment":
        return `فاتورة معدات رقم (${num})`;
      case "equipment_supply":
        return `فاتورة مستلزمات معدات رقم (${num})`;
      case "maintenance":
        return `فاتورة صيانة رقم (${num})${
          doc.maintenanceProvider ? " - " + doc.maintenanceProvider : ""
        }`;
      default:
        return "حركة";
    }
  };

  // ✅ المديونية السابقة + مدفوعات عامة (pay/debt/أخرى) + فواتير الشراء المجمعة
  const combinedLog = useMemo(() => {
    if (!supplierData) return [];

    const logs = [];

    // 1. المديونية السابقة (مديونية عليا من أول المدة)
    if (supplierData.openningBalance ) {
      logs.push({
        date:  supplierData.openningBalanceDate||supplierData.createdAt || new Date(),
        type: "opening",
        label: "رصيد افتتاحي",
        amount: supplierData.openningBalance,
        note: supplierData.notes || "مديونية أول المدة",
        details: null,
        isOpening: true,
      });
    }

    // 2. المدفوعات العامة الغير مرتبطة بفاتورة شراء (pay / debt / أخرى)
    payments.forEach((payment) => {
      if (PURCHASE_TYPE_KEYS.includes(payment.module)) return; // هتتضاف مجمعة مع فواتير الشراء

      let label = "";
      let direction = null; // "in" = بتقلل مديونيتي / "out" = بتزود مديونيتي

      if (payment.module === "pay") {
        label = "سداد للتاجر";
        direction = "in";
      } else if (payment.module === "debt") {
        label = "مديونية إضافية من التاجر";
        direction = "out";
      } else {
        label = payment.module || "حركة أخرى";
        direction = payment.moneyFlow === "incoming" ? "in" : "out";
      }

      logs.push({
        date: payment.transactionDate,
        type: payment.module,
        label,
        amount: payment.amount,
        direction,
        paymentMethod: payment.paymentMethod,
        paymentDetails: payment,
        note: payment.notes,
        details: null,
        cheque: payment.cheque,
        walletInfo: payment.walletInfo,
        bankInfo: payment.bankInfo,
        isGenericPayment: true,
      });
    });

    // 3. فواتير الشراء (شكاير / سلك / معدات / مستلزمات / صيانة) - مجمعة مع مدفوعاتها
    PURCHASE_TYPE_KEYS.forEach((type) => {
      const docs = purchasesByType[type] || [];

      docs.forEach((doc) => {
        const linkedPayments = payments.filter(
          (p) =>
            p.module === type &&
            p.moduleId &&
            p.moduleId.toString() === doc._id?.toString()
        );

        const totalPaidFromPayments = linkedPayments.reduce(
          (sum, p) => sum + (p.amount || 0),
          0
        );
        // نأخذ القيمة الأكبر بين المجموع من الـ payments وبين paidAmount المسجل على الفاتورة نفسها
        const totalPaid = (totalPaidFromPayments || 0);

        logs.push({
          date: doc.purchaseDate || doc.createdAt || new Date(),
          type,
          label: getLabel(type, doc),
          amount: doc.totalAmount || 0,
          paid: totalPaid,
          note: doc.notes,
          details: doc,
          isPurchase: true,
          purchasePayments: linkedPayments,
        });
      });
    });

    return logs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [supplierData, payments, purchasesByType]);

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

  // ✅ الحساب التتابعي - الرصيد هنا = المديونية عليا تجاه التاجر
  const sequentialLedger = useMemo(() => {
    let runningBalance = 0;

    return filteredLog.map((op) => {
      const isPurchase = op.isPurchase;
      const isOpening = op.type === "opening";
      const isGeneric = op.isGenericPayment;

      let previousBalance = runningBalance;

      let debtAdded = 0;
      let paymentReceived = 0;
      let currentInvoiceAmount = 0;

      if (isOpening) {
        debtAdded = op.amount;
        currentInvoiceAmount = op.amount;
        previousBalance = 0;
      } else if (isPurchase) {
        // فاتورة شراء: بتزود اللي أنا مديون بيه للتاجر
        debtAdded = op.amount || 0;
        paymentReceived = op.paid || 0;
        currentInvoiceAmount = op.amount || 0;
      } else if (isGeneric) {
        if (op.direction === "in") {
          // أنا دفعت للتاجر -> تقلل مديونيتي
          paymentReceived = op.amount || 0;
        } else {
          // التاجر ضاف عليا مديونية -> تزود مديونيتي
          debtAdded = op.amount || 0;
        }
        currentInvoiceAmount = op.amount || 0;
      }

      runningBalance = previousBalance + debtAdded - paymentReceived;

      return {
        ...op,
        previousBalance,
        grossAmount: op.amount || 0,
        currentInvoiceAmount,
        debtAdded,
        paymentReceived,
        balance: runningBalance,
      };
    });
  }, [filteredLog]);

  const totals = useMemo(() => {
    let openingBalance = 0;
    let totalPurchases = 0;
    let totalPaidOnPurchases = 0;
    let totalPaidToSupplier = 0; // pay
    let totalExtraDebt = 0; // debt
    const byType = {};
    PURCHASE_TYPE_KEYS.forEach((t) => (byType[t] = 0));

    sequentialLedger.forEach((op) => {
      if (op.type === "opening") {
        openingBalance = op.amount || 0;
      } else if (op.isPurchase) {
        totalPurchases += op.grossAmount || 0;
        totalPaidOnPurchases += op.paymentReceived || 0;
        byType[op.type] = (byType[op.type] || 0) + (op.grossAmount || 0);
      } else if (op.type === "pay") {
        totalPaidToSupplier += op.amount || 0;
      } else if (op.type === "debt") {
        totalExtraDebt += op.amount || 0;
      }
    });

    return {
      openingBalance,
      totalPurchases,
      totalPaidOnPurchases,
      totalPaidToSupplier,
      totalExtraDebt,
      byType,
    };
  }, [sequentialLedger]);

  const handleSharePDF = async () => {
    const element = document.getElementById("invoice-capture");
    const arabicFileName = `${supplierData?.name || "التاجر"}.pdf`;

    const options = {
      margin: 10,
      filename: arabicFileName,
      image: { type: "jpeg", quality: 1 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        scrollX: 0,
        scrollY: 0,
      },
      jsPDF: {
        unit: "mm",
        format: [350, 500],
        orientation: "landscape",
      },
    };

    try {
      setSharing(true);
      const pdfBlob = await html2pdf().set(options).from(element).output("blob");
      const file = new File([pdfBlob], arabicFileName, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${supplierData?.name}`,
          text: `مرفق كشف الحساب التفصيلي الموحد للتاجر: ${supplierData?.name}`,
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

  if (loading) return <div className="p-10 text-center font-bold">جاري التحميل...</div>;

  return (
    <div id="invoice" className="p-4 mx-auto text-right" dir="rtl">
      <div className="text-lg no-print mb-6 flex flex-col md:flex-row justify-between items-center bg-gray-100 p-4 rounded gap-4">
        <h2 className="font-bold">كشف حساب تاجر: {supplierData?.name}</h2>

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

      <div id="invoice-capture" className="bg-white p-8 border-2 border-black print:border-0 print:p-0" dir="rtl">
        <div className="flex justify-between items-start border-b-4 border-black pb-4 mb-8">
          <div className="text-right">
            <h1 className="text-3xl font-black">{settings.invoiceFactoryName}</h1>
            <p className="font-bold mt-1">كشف حساب تفصيلي وحركة مشتريات المصنع من التاجر</p>
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
          <p className="text-2xl font-black">اسم التاجر : {supplierData?.name}</p>
          <p className="text-lg text-slate-800">رقم التلفون : {supplierData?.phone}</p>
          {supplierData?.openningBalance  && (
            <p className="text-lg text-slate-800">
              المديونية السابقة : {supplierData.openningBalance.toLocaleString()} ج.م
            </p>
          )}
          <p className="text-lg text-slate-800">
            رصيد التاجر  : {supplierData?.balance?.toLocaleString() || "0"} ج.م
          </p>
        </div>

        <table className="w-full border-collapse border-2 border-black text-right text-lg">
          <thead>
            <tr className="bg-gray-200 text-black font-bold text-center border-b-2 border-black">
              <th className="border border-black p-2 w-32">التاريخ والوقت</th>
              <th className="border border-black p-2 w-28">المديونية السابقة</th>
              <th className="border border-black p-2">بيان الحركة وتفاصيل الأصناف </th>
              <th className="border border-black p-2 w-36">إضافة مديونية</th>
              <th className="border border-black p-2 w-24">سداد للتاجر</th>
              <th className="border border-black p-2 w-28 font-bold bg-slate-100 text-black">المرحل</th>
              <th className="border border-black p-2 w-28 font-black bg-gray-300 text-black">الرصيد الجاري</th>
            </tr>
          </thead>
          <tbody>
            {sequentialLedger.map((op, i) => {
              const isPurchase = op.isPurchase;
              const isOpening = op.type === "opening";
              const isGenericPay = op.isGenericPayment && op.direction === "in";
              const isGenericDebt = op.isGenericPayment && op.direction === "out";
              const rows = isPurchase ? getItemRows(op.type, op.details) : [];
              const hasQtyPrice = rows.some((r) => r.qty !== null && r.qty !== undefined);

              return (
                <React.Fragment key={i}>
                  <tr className={`border-t border-black align-top ${isPurchase ? "bg-white" : "bg-gray-50"}`}>
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

                      {isPurchase && rows.length > 0 && (
                        <div className="mt-1 w-full">
                          <table className="w-full text-right text-[15px] border border-gray-300 border-collapse">
                            <thead>
                              <tr className="bg-gray-50 text-black font-bold border-b border-gray-300 text-center">
                                <th className="p-1 border-l border-gray-300 text-right">الصنف</th>
                                {hasQtyPrice && (
                                  <>
                                    <th className="p-1 border-l border-gray-300 text-center">الكمية</th>
                                    <th className="p-1 border-l border-gray-300 text-center">سعر الوحدة</th>
                                  </>
                                )}
                                <th className="p-1 text-left pl-2">الإجمالي</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rows.map((item, idx) => (
                                <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/30">
                                  <td className="p-2 font-bold text-black border-l border-gray-200">
                                    {item.name}
                                    {item.extra && (
                                      <div className="text-xs text-slate-500 font-normal mt-0.5">{item.extra}</div>
                                    )}
                                  </td>
                                  {hasQtyPrice && (
                                    <>
                                      <td className="p-2 text-center border-l border-gray-200">
                                        {item.qty ?? "-"}
                                      </td>
                                      <td className="p-2 text-center border-l border-gray-200 font-medium">
                                        {item.price != null ? `${item.price.toLocaleString()} ج.م` : "-"}
                                      </td>
                                    </>
                                  )}
                                  <td className="p-2 text-left font-black text-black">
                                    {item.total?.toLocaleString()} ج.م
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="font-black border-t-2 border-gray-400 bg-gray-50">
                                <td className="p-2 text-right" colSpan={hasQtyPrice ? 3 : 1}>
                                  إجمالي الفاتورة:
                                </td>
                                <td className="p-2 text-left text-base text-slate-900">
                                  {(op.grossAmount || 0).toLocaleString()} ج.م
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}



                      {isOpening && (
                        <div className="mt-2 text-sm text-700 font-bold">
                          {op.note || "مديونية أول المدة"} - 
                        </div>
                      )}
                    </td>

                    <td className="border border-black p-2 text-right text-lg pt-3">
                      {(isPurchase || isGenericDebt || isGenericPay || isOpening) ? (
                        <div className="space-y-1 text-right">
                          <div className="text-[15px] font-semibold text-black">
                            {/* <b>{isOpening ? "الرصيد الإفتتاحي" : "المديونية السابقة"}:</b>{" "} */}
                            {/* {isOpening ? "0" : op.previousBalance?.toLocaleString()} ج.م */}
                          </div>
                          <div className="text-[15px] font-semibold text-black">
                          
                                                     <div className="text-[15px] font-bold text-slate-800 border-t border-dashed pt-1 mt-1">
                            <b>{ "الرصيد  السابق" }:</b>{" "}
                            {( op.previousBalance )?.toLocaleString()} ج.م
                          </div>
                           
                            {isPurchase && (
                              <>
                                <b>قيمة الفاتورة الحالية:</b> {op.currentInvoiceAmount?.toLocaleString()} ج.م
                              </>
                            )}
                            {isGenericPay && (
                              <>
                                <b>سداد للتاجر:</b> -{op.paymentReceived?.toLocaleString()} ج.م
                              </>
                            )}
                            {isGenericDebt && (
                              <>
                                <b>المديونيه الحاليه:</b> +{op.debtAdded?.toLocaleString()} ج.م
                              </>
                            )}
                            {isOpening && (
                              <>
                                <b>المديونية السابقة:</b> {op.currentInvoiceAmount?.toLocaleString()} ج.م
                              </>
                            )}
                          </div>
                          <div className="text-[15px] font-bold text-slate-800 border-t border-dashed pt-1 mt-1">
                            <b>{isOpening ? "الرصيد بعد الإضافة" : "الاجمالي النهائي"}:</b>{" "}
                            {( op.previousBalance + (op.currentInvoiceAmount || op.paymentReceived ||op.debtAdded || op.currentInvoiceAmount))?.toLocaleString()} ج.م
                          </div>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className="border border-black p-2 text-center font-semibold text-slate-700 text-lg pt-3">
                      {isPurchase && op.paymentReceived  && (
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-black text-lg">{op.paymentReceived.toLocaleString()} ج.م</span>

                          {op.purchasePayments && op.purchasePayments.length > 0 && (
                            <div className="w-full border-t border-gray-200 mt-1 pt-1 space-y-0.5">
                              {op.purchasePayments.map((p, idx) => (
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
                            </div>
                          )}
                        </div>
                      )}

                      {isGenericPay && (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="font-black text-lg text-700">-{op.amount.toLocaleString()} ج.م</span>
                          <span className="text-[13px] font-bold block">(سداد للتاجر)</span>
                          {/* {op.paymentMethod && (
                            <span className="text-[13px] text-slate-700 font-bold block">
                              {translatePaymentMethod(op.paymentMethod)}
                            </span>
                          )} */}
                        </div>
                      )}

                      {isGenericDebt && (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="font-black text-lg text-700">+{op.amount.toLocaleString()} ج.م</span>
                          <span className="text-[13px] font-bold block">(مديونية إضافية من التاجر)</span>
                        </div>
                      )}

                      {isOpening && (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="font-black text-lg text-700">{op.amount.toLocaleString()} ج.م</span>
                          <span className="text-[13px] font-bold block">(رصيد افتتاحي)</span>
                        </div>
                      )}

                                            {isGenericPay && op.paymentDetails && (
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
                              <div>المحفظة: {op.walletInfo.provider || "محفظة"}</div>
                              <div>المرسل: {op.walletInfo.senderName}</div>
                              <div>رقم المرسل: {op.walletInfo.senderPhone}</div>
                            </div>
                          )}
                          {op.bankInfo && op.bankInfo.bankName && (
                            <div className="mt-1 text-xs">
                              <div>البنك: {op.bankInfo.bankName}</div>
                              {op.bankInfo.transactionReference && <div>المرجع: {op.bankInfo.transactionReference}</div>}
                            </div>
                          )}
                          {op.note && <div className="mt-1 text-gray-600">ملاحظة: {op.note}</div>}
                        </div>
                      )}

                      {isGenericDebt && (
                        <div className="mt-2 text-sm">
                          {op.paymentMethod && (
                            <div className="font-bold">طريقة الدفع: {translatePaymentMethod(op.paymentMethod)}</div>
                          )}
                          {op.paymentMethod === "cheque" && op.cheque && (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              <div>رقم الشيك: {op.cheque.chequeNumber}</div>
                              <div>البنك: {op.cheque.bankName}</div>
                              <div>تاريخ الاستحقاق: {new Date(op.cheque.dueDate).toLocaleDateString("ar-EG")}</div>
                            </div>
                          )}
                          {op.note && <div className="mt-1 text-gray-600">ملاحظة: {op.note}</div>}
                        </div>
                      )}

                      {!isPurchase && !isGenericPay && !isGenericDebt && !isOpening && "-"}
                    </td>

                    <td className="border border-black p-2 text-left font-bold bg-slate-50 text-lg pl-2 pt-3">
                      {(() => {
                        const diff = (op.debtAdded || 0) - (op.paymentReceived || 0);
                        if (diff > 0) return <span className="text-700">+{diff.toLocaleString()}</span>;
                        if (diff < 0) return <span className="text-700">{diff.toLocaleString()}</span>;
                        return <span className="text-black">0</span>;
                      })()}{" "}
                      ج.م
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
            <div className="bg-black text-white p-3 text-center font-black">ملخص كشف الحساب</div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold">المديونية السابقة</span>
                <span className="font-black text-700">{totals.openingBalance.toLocaleString()} ج.م</span>
              </div>

              {PURCHASE_TYPE_KEYS.filter((t) => totals.byType[t] > 0).map((t) => (
                <div className="flex justify-between border-b pb-2" key={t}>
                  <span className="font-bold">إجمالي مشتريات {PURCHASE_TYPES[t].label}</span>
                  <span className="font-black text-700">+{totals.byType[t].toLocaleString()} ج.م</span>
                </div>
              ))}

              <div className="flex justify-between border-b pb-2">
                <span className="font-bold">إجمالي قيمة المشتريات (كل الأنواع)</span>
                <span className="font-black text-700">+{totals.totalPurchases.toLocaleString()} ج.م</span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="font-bold">إجمالي المسدد على فواتير الشراء</span>
                <span className="font-black text-700">-{totals.totalPaidOnPurchases.toLocaleString()} ج.م</span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="font-bold">سداد مباشر للتاجر</span>
                <span className="font-black text-700">-{totals.totalPaidToSupplier.toLocaleString()} ج.م</span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="font-bold">مديونية إضافية من التاجر</span>
                <span className="font-black text-700">+{totals.totalExtraDebt.toLocaleString()} ج.م</span>
              </div>

              <div className="flex justify-between text-md pt-2 border-t-2 border-black">
                <span className="font-black">المديونية النهائية   </span>
                <span className="font-black text-700">
                  {sequentialLedger.length > 0
                    ? sequentialLedger[sequentialLedger.length - 1]?.balance?.toLocaleString()
                    : supplierData?.openningBalance?.toLocaleString() || "0"}{" "}
                  ج.م
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

export default SupplierStatement;
