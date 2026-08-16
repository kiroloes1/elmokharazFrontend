import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";
import { useSystemSettings } from "../../context/shareInfo";

/**
 * صفحة ملخص حساب التاجر
 * ------------------------------------------------
 * بتعتمد على نفس الـ APIs المستخدمة في صفحة كشف الحساب التفصيلي
 * (DeliveryStatement) ونفس منطق حساب الرصيد المتحرك بالظبط،
 * لكن من غير عرض الجدول التفصيلي — بس صندوق الملخص النهائي،
 * عشان تكون صفحة سريعة تديك "موقف حساب التاجر" في ثانية.
 */
const CustomerAccountSummary = () => {
  const { customerId } = useParams();
  const [customerData, setCustomerData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { settings } = useSystemSettings();

  // ====== نفس جلب البيانات من صفحة كشف الحساب التفصيلي ======
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

  // ====== تجميع المدفوعات المرتبطة بالنقلات حسب moduleId (نفس المنطق الأصلي) ======
  const groupedPayments = useMemo(() => {
    const grouped = {};
    payments.forEach((payment) => {
      if (payment.module === "delivery" && payment.moduleId) {
        if (!grouped[payment.moduleId]) grouped[payment.moduleId] = [];
        grouped[payment.moduleId].push(payment);
      }
    });
    return grouped;
  }, [payments]);

  // ====== بناء سجل الحركات الموحد (نفس منطق combinedLog) ======
  const combinedLog = useMemo(() => {
    if (!customerData) return [];

    const logs = [];

    // المدفوعات المستقلة (سداد من التاجر / سداد للتاجر)
    payments.forEach((payment) => {
      if (payment.module === "delivery") return; // هتتحسب مجمعة مع النقلة

      let label = "";
      switch (payment.module) {
        case "debt":
          label = "سداد من التاجر(استلام فلوس)";
          break;
        case "pay":
          label = "سداد للتاجر";
          break;
        default:
          label = payment.module || "حركة أخرى";
      }

      logs.push({
        date: payment.transactionDate,
        type: payment.module,
        label,
        amount: payment.amount,
      });
    });

    // النقلات (مجمعة مع مدفوعاتها)
    deliveries.forEach((deliveryDetail) => {
      const deliveryPayments = groupedPayments[deliveryDetail._id] || [];

      const totalPaidFromPayments = deliveryPayments.reduce(
        (sum, p) => sum + (p.amount || 0),
        0
      );

      const paidFromDelivery =
        deliveryDetail.payment?.reduce(
          (sum, p) => sum + (p.paidAmount || 0),
          0
        ) || 0;

      const totalPaid = Math.max(totalPaidFromPayments, paidFromDelivery);

      logs.push({
        date: deliveryDetail.deliveryDate || new Date(),
        type: "delivery",
        label: `نقلة بضاعة رقم (${deliveryDetail.delveryNumber || "---"})`,
        amount: deliveryDetail.totalAmount || 0,
        paid: totalPaid,
        tea: deliveryDetail.teaForWorkers || 0,
      });
    });

    // المديونية السابقة (الرصيد الافتتاحي)
    if (customerData.openningBalance) {
      logs.push({
        date: customerData.openningBalanceDate || customerData.createdAt || new Date(),
        type: "opening",
        label: "رصيد افتتاحي",
        amount: customerData.openningBalance,
      });
    }

    return logs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [customerData, payments, groupedPayments]);

  // ====== فلترة بالتاريخ (اختياري) ======
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

  // ====== الحساب التتابعي للرصيد (نفس منطق sequentialLedger) ======
  const sequentialLedger = useMemo(() => {
    let runningBalance = 0;

    return filteredLog.map((op) => {
      const isDelivery = op.type === "delivery";
      const isPay = op.type === "pay";
      const isDebt = op.type === "debt";
      const isOpening = op.type === "opening";

      const tea = op.tea || 0;
      let debtAdded = 0;
      let paymentReceived = 0;

      if (isOpening) {
        debtAdded = op.amount;
      } else if (isDelivery) {
        const deliveryTotal = op.amount || 0;
        paymentReceived = deliveryTotal - (op.paid || 0);
        if (tea > 0) paymentReceived += tea;
      } else if (isDebt) {
        debtAdded = op.amount || 0;
      } else if (isPay) {
        paymentReceived = op.amount || 0;
      }

      runningBalance = runningBalance + debtAdded - paymentReceived;

      return { ...op, debtAdded, paymentReceived, balance: runningBalance, tea };
    });
  }, [filteredLog]);

  // ====== إجمالي بنود الملخص (نفس منطق totals) ======
  const totals = useMemo(() => {
    let totalDeliveries = 0;
    let totalDeliveryPayment = 0;
    let totalPayments = 0;
    let totalDebts = 0;
    let totalTea = 0;
    let openingBalance = 0;

    sequentialLedger.forEach((op) => {
      if (op.type === "opening") {
        openingBalance = op.amount || 0;
      } else if (op.type === "delivery") {
        totalDeliveries += op.amount || 0;
        totalDeliveryPayment += op.paid || 0;
        totalTea += op.tea || 0;
      } else if (op.type === "debt") {
        totalPayments += op.amount || 0;
      } else if (op.type === "pay") {
        totalDebts += op.amount || 0;
      }
    });

    return { totalDeliveries, totalPayments, totalDebts, totalTea, openingBalance, totalDeliveryPayment };
  }, [sequentialLedger]);

  const finalBalance =
    sequentialLedger.length > 0
      ? sequentialLedger[sequentialLedger.length - 1]?.balance
      : customerData?.openningBalance || 0;

  if (loading) return <div className="p-10 text-center font-semibold">جاري التحميل...</div>;

  return (
    <div id="invoice" className="p-4 mx-auto text-right max-w-4xl" dir="rtl">
      {/* شريط التحكم */}
      <div className="text-md no-print mb-6 flex flex-col md:flex-row justify-between items-center bg-gray-100 p-4 rounded gap-4">
        <h2 className="font-semibold">ملخص حساب: {customerData?.name}</h2>

        <button
          onClick={() => window.print()}
          className="bg-black text-white px-5 py-2 rounded font-semibold hover:bg-gray-800 transition-all text-md"
        >
          طباعة الملخص
        </button>

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

      {/* رأس الملخص */}
      <div className="bg-white p-6 border-2 border-black print:border-0" dir="rtl">
        <div className="border-b-4 border-black pb-4 mb-6 text-right">
          <h1 className="text-2xl font-semibold">{settings?.invoiceFactoryName}</h1>
          <p className="font-semibold mt-1 text-slate-700">ملخص كشف حساب التاجر</p>
        </div>

        <div className="mb-6 border-r-4 border-black pr-4">
          <p className="text-xl font-semibold">اسم التاجر : {customerData?.name}</p>
          <p className="text-xl font-semibold"> الرصيد : {customerData?.balance.toLocaleString()}</p>

          <p className="text-md text-slate-800">رقم التلفون : {customerData?.phone}</p>
        </div>

        {/* صندوق الملخص — نفس شكل الملخص في كشف الحساب التفصيلي */}
        <div className="border-4 border-black">
          <div className="bg-black text-white p-3 text-center font-semibold">ملخص كشف الحساب</div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold">المديونية السابقة</span>
              <span className="font-semibold">{totals.openingBalance.toLocaleString()} ج.م</span>
            </div>

            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold">إجمالي قيمة النقلات (مشتريات التاجر)</span>
              <span className="font-semibold">-{totals.totalDeliveries.toLocaleString()} ج.م</span>
            </div>

            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold">إجمالي ما تم استلامه من حساب النقلة</span>
              <span className="font-semibold">+{totals.totalDeliveryPayment.toLocaleString()} ج.م</span>
            </div>

            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold">سداد من التاجر (استلام فلوس)</span>
              <span className="font-semibold">+{totals.totalPayments.toLocaleString()} ج.م</span>
            </div>

            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold">سداد للتاجر</span>
              <span className="font-semibold">-{totals.totalDebts.toLocaleString()} ج.م</span>
            </div>

            {totals.totalTea > 0 && (
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold">إجمالي الشاي</span>
                <span className="font-semibold">-{totals.totalTea.toLocaleString()} ج.م</span>
              </div>
            )}

            <div className="flex justify-between text-xl pt-2 border-t-2 border-black">
              <span className="font-semibold">الرصيد النهائي المستحق للتاجر</span>
              <span className="font-semibold">{finalBalance?.toLocaleString() || "0"} ج.م</span>
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

export default CustomerAccountSummary;
