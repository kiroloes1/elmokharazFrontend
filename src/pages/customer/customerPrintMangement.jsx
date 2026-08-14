import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";

const SupplierPrintManager = () => {
  const { id: supplierId, customerId } = useParams();
  const targetId = supplierId || customerId;
  const navigate = useNavigate();

  const [supplierData, setSupplierData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [printMode, setPrintMode] = useState(null);

  // 1. جلب البيانات من الـ Backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [supplierRes, deliveryRes] = await Promise.all([
          api.get(`/suppliers/${targetId}`).catch(() => api.get(`/customers/${targetId}`)),
          api.get(`/delivery/getDeliveryByCustomer/${targetId}`).catch(() => ({ data: { deliveries: [] } }))
        ]);

        const mainData = supplierRes.data?.data || supplierRes.data;
        setSupplierData(mainData);
        setPayments(mainData?.payment || mainData?.paymentHistory || []);
        setDeliveries(deliveryRes.data?.deliveries || []);
      } catch (err) {
        console.error("خطأ في جلب بيانات المورد:", err);
      } finally {
        setLoading(false);
      }
    };

    if (targetId) {
      fetchData();
    }
  }, [targetId]);

  // ترجمة طرق الدفع
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

  // 2. تجميع عمليات الدفع الخاصة بالنقلات
  const groupedPayments = useMemo(() => {
    const grouped = {};
    payments.forEach((payment) => {
      if (payment.module === "delivery" && payment.moduleId) {
        if (!grouped[payment.moduleId]) {
          grouped[payment.moduleId] = [];
        }
        grouped[payment.moduleId].push(payment);
      }
    });
    return grouped;
  }, [payments]);

  // 3. دمج ومعالجة سجل الحركات الموحد
  const combinedLog = useMemo(() => {
    if (!supplierData) return [];
    const logs = [];

    if (supplierData.openningBalance) {
      logs.push({
        date: supplierData.openningBalanceDate || supplierData.createdAt || new Date(),
        type: "opening",
        label: "رصيد افتتاحي",
        amount: supplierData.openningBalance,
        paid: 0,
        note: supplierData.notes || "رصيد أول المدة"
      });
    }

    payments.forEach((payment) => {
      if (payment.module === "delivery") return;

      let label = "";
      switch (payment.module) {
        case "debt":
          label = "مديونية / استلام فلوس";
          break;
        case "pay":
        case "payment":
          label = "سداد للتاجر";
          break;
        default:
          label = payment.module || "حركة مالية";
      }

      logs.push({
        date: payment.transactionDate || payment.date,
        type: payment.module,
        label: label,
        amount: payment.amount,
        paid: payment.moneyFlow === "incoming" ? payment.amount : 0,
        paymentMethod: payment.paymentMethod,
        note: payment.notes || payment.note,
        paymentDetails: payment
      });
    });

    deliveries.forEach((deliveryDetail) => {
      const deliveryPayments = groupedPayments[deliveryDetail._id] || [];
      const totalPaidFromPayments = deliveryPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const paidFromDelivery = deliveryDetail.payment?.reduce((sum, p) => sum + (p.paidAmount || 0), 0) || 0;
      const totalPaid = Math.max(totalPaidFromPayments, paidFromDelivery);

      logs.push({
        date: deliveryDetail.deliveryDate || deliveryDetail.date || new Date(),
        type: "delivery",
        label: `نقلة بضاعة رقم (${deliveryDetail.delveryNumber || "---"})`,
        amount: deliveryDetail.totalAmount || 0,
        paid: totalPaid,
        note: deliveryDetail.notes || deliveryDetail.note,
        details: deliveryDetail,
        deliveryPayments
      });
    });

    return logs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [supplierData, payments, deliveries, groupedPayments]);

  // 4. الحساب التتابعي للرصيد
  const operationsWithBalance = useMemo(() => {
    let runningBalance = 0;

    return combinedLog.map((op) => {
      const isDelivery = op.type === "delivery";
      const isPay = op.type === "pay" || op.type === "payment";
      const isDebt = op.type === "debt";
      const isOpening = op.type === "opening";

      let debtAdded = 0;
      let paymentReceived = 0;

      if (isOpening) {
        debtAdded = op.amount;
      } else if (isDelivery) {
        const remaining = op.amount - op.paid;
        debtAdded = remaining;
      } else if (isDebt) {
        debtAdded = op.amount || 0;
      } else if (isPay) {
        paymentReceived = op.amount || 0;
      }

      runningBalance = runningBalance + debtAdded - paymentReceived;

      return {
        ...op,
        debtAdded,
        paymentReceived,
        balance: runningBalance
      };
    });
  }, [combinedLog]);

  // 🚀 التوجيه لصفحة الطباعة الخارجية مع إرسال وضع الطباعة (mode)
  const handlePrint = () => {
    if (!targetId || !printMode) return;
    
    // يوجّه إلى الرابط المطلوب ممرراً الـ targetId و نوع التقرير (full / balance)
    navigate(`/customer/printSupplierDetails/${targetId}?mode=${printMode}`);
  };

  if (loading)
    return (
      <div className="p-10 text-center font-bold text-gray-600 italic">
        جاري جلب البيانات المالية...
      </div>
    );

  return (
    <div className="p-6 max-w-5xl mx-auto text-right mb-10 font-['Tahoma']" dir="rtl">
      
      {/* 🔧 لوحة التحكم */}
      <div className="no-print bg-white p-8 rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 border-r-4 border-black pr-3">
            لوحة طباعة التقارير | <span className="font-normal text-gray-600">{supplierData?.name}</span>
          </h2>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={() => navigate(`/customer/printSupplierDetails/${supplierData?._id}`)}
            className={`px-6 py-2 rounded border-2 font-bold transition-all ${
              printMode === "full" ? "bg-black text-white border-black" : "bg-white text-black border-gray-300 hover:border-black"
            }`}
          >
            كشف حساب تفصيلي
          </button>
          <button
            onClick={() => setPrintMode("balance")}
            className={`px-6 py-2 rounded border-2 font-bold transition-all ${
              printMode === "balance" ? "bg-black text-white border-black" : "bg-white text-black border-gray-300 hover:border-black"
            }`}
          >
            بيان رصيد نهائي
          </button>
          <button
            onClick={handlePrint}
            disabled={!printMode}
            className="bg-gray-800 text-white px-8 py-2 rounded font-bold disabled:bg-gray-200 disabled:text-gray-400 shadow-sm mr-auto hover:bg-black transition-colors"
          >
            🖨️ طباعة التقرير
          </button>
        </div>
      </div>

      {/* 📄 التقرير المعروض في الصفحة */}
      {printMode && (
        <div className="bg-white p-12 border-2 border-gray-100">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-black pb-8 mb-10">
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tighter">مصنع عزوز عطية</h1>
            </div>
          </div>

          <div className="border-r-8 border-black pr-6 mb-12">
            <p className="text-gray-500 text-sm mb-1 font-bold">اسم التاجر:</p>
            <p className="text-3xl font-black">{supplierData?.name}</p>
            <p className="text-sm font-semibold">الهاتف: <span>{supplierData?.phone || "---"}</span></p>
            <p className="text-sm font-bold italic block">تاريخ الإصدار: {new Date().toLocaleDateString("ar-EG")}</p>
          </div>

          {/* الجداول في حال كشف تفصيلي */}
          {printMode === "full" && (
            <div className="mb-12">
              <h3 className="text-lg font-black mb-3 border-b border-gray-300 inline-block pb-1">
                كشف حساب تفصيلي
              </h3>

              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b border-black">
                    <th className="border border-black p-3 text-center">التاريخ</th>
                    <th className="border border-black p-3 text-center">البيان</th>
                    <th className="border border-black p-3 text-center">مديونيه/نقله</th>
                    <th className="border border-black p-3 text-center">دفع للتاجر</th>
                    <th className="border border-black p-3 text-center">الرصيد</th>
                    <th className="border border-black p-3 text-right">ملاحظات</th>
                  </tr>
                </thead>

                <tbody>
                  {operationsWithBalance.map((op, i) => (
                    <tr key={i} className="border-b border-gray-300 align-top">
                      <td className="border border-black p-3 text-center">
                        {op.type === "opening" 
                          ? "رصيد سابق" 
                          : new Date(op.date).toLocaleDateString("ar-EG")}
                      </td>

                      <td className="border border-black p-3 text-center font-bold">
                        {op.type === "opening" && "رصيد افتتاحي"}
                        {op.type === "debt" && "مديونية"}
                        {(op.type === "payment" || op.type === "pay") && "سداد"}
                        {op.type === "delivery" && (op.label || "نقلة بضاعة")}
                        {op.type === "return" && "مرتجع قديم"}
                      </td>

                      <td className="border border-black p-3 text-center align-top">
                        {op.type === "delivery" ? (
                          <div className="flex flex-col items-center gap-1 leading-tight">
                            <span className="font-bold">إجمالي: {op.amount.toLocaleString()} ج.م</span>
                            <span className="text-[11px] text-gray-600">مدفوع: {op.paid.toLocaleString()}</span>
                            <span className="text-[11px] font-semibold">متبقي: {(op.amount - op.paid).toLocaleString()}</span>
                          </div>
                        ) : (op.type === "debt" || op.type === "opening" || op.type === "return") ? (
                          <div className="flex flex-col">
                            <span className="font-bold">{op.amount.toLocaleString()} ج.م</span>
                            {op.paymentMethod && (
                              <span className="text-xs text-gray-600">
                                {translatePaymentMethod(op.paymentMethod)}
                              </span>
                            )}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="border border-black p-3 text-center">
                        {(op.type === "payment" || op.type === "pay") ? (
                          <div className="flex flex-col">
                            <span className="font-bold">{op.amount.toLocaleString()}</span>
                            {op.paymentMethod && (
                              <span className="text-[11px] text-gray-600">
                                {translatePaymentMethod(op.paymentMethod)}
                              </span>
                            )}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="border border-black p-3 text-center font-black">
                        {op.balance.toLocaleString()}
                      </td>

                      <td className="border border-black p-3 text-right text-xs">
                        {op.note === "Updated delivery"
                          ? "تحديث نقلة"
                          : op.note === "New delivery"
                          ? "نقلة جديدة"
                          : op.note === "Return delivery"
                          ? "راجع"
                          : op.note || "---"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

{/* 💰 الخلاصة النهائية (الرصيد النهائي) */}
{(() => {
  const finalBalance = 
    supplierData?.remainingBalance ?? 
    supplierData?.balance ?? 
    (operationsWithBalance.length > 0 ? operationsWithBalance[operationsWithBalance.length - 1].balance : 0);

  const isOwedToUs = finalBalance < 0; // إذا كان سالب -> فلوس لينا (مطلوب من التاجر)
  const isOwedToSupplier = finalBalance > 0; // إذا كان موجب -> فلوس علينا (مستحق للتاجر)

  return (
    <div className="flex justify-end pt-6 border-t-2 border-black border-dashed">
      <div className="text-left">
        <p className="text-sm font-black mb-1 italic">
          {isOwedToUs && "إجمالي المبلغ المطلوب من التاجر (فلوس لينا):"}
          {isOwedToSupplier && "إجمالي الرصيد المستحق للتاجر (فلوس علينا):"}
          {!isOwedToUs && !isOwedToSupplier && "إجمالي الحساب (الحساب متخلص):"}
        </p>

        <div className={`text-5xl font-black tracking-tighter text-black`}>
          {Math.abs(finalBalance).toLocaleString()}{" "}
          <span className="text-xl font-normal">ج.م</span>
        </div>

        {/* توضيح كتابي إضافي للتأكيد في الطباعة */}
        <p className="text-xs font-bold mt-1 text-gray-600">
          {isOwedToUs && "(رصيد لينا )"}
          {isOwedToSupplier && "(رصيد علينا للتاجر)"}
        </p>
      </div>
    </div>
  );
})()}

        </div>
      )}
    </div>
  );
};

export default SupplierPrintManager;