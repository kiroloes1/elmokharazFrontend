import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";
import { useSystemSettings } from "../../context/shareInfo";

/**
 * صفحة ملخص حساب التاجر (تجار المشتريات)
 * ------------------------------------------------
 * ⚠️ نسخة مُصحَّحة: بتعتمد بالظبط على نفس الـ APIs ونفس منطق
 * الحساب الموجود في صفحة كشف الحساب التفصيلي (SupplierStatement)
 * — يعني بتجيب فواتير الشراء بكل أنواعها (شكاير/سلك/معدات/
 * مستلزمات معدات/صيانة) + المدفوعات العامة (سداد/مديونية إضافية)
 * + الرصيد الافتتاحي، وبتحسب المديونية بنفس الطريقة تمامًا،
 * لكن من غير عرض الجدول التفصيلي — بس صندوق الملخص.
 *
 * ⚠️ عدّل المسارات دي لو مختلفة عندك في الراوتس الفعلية
 * (نفس الافتراض المستخدم في SupplierStatement)
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

const SupplierAccountSummary = () => {
  const { id } = useParams();
  const { settings } = useSystemSettings();

  const [supplierData, setSupplierData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [purchasesByType, setPurchasesByType] = useState({});
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // ====== نفس جلب البيانات بالظبط من SupplierStatement ======
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [supplierRes, ...purchaseResList] = await Promise.all([
          api.get(`/suppliers/${id}`),
          ...PURCHASE_TYPE_KEYS.map((type) =>
            api.get(PURCHASE_TYPES[type].endpoint(id))
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

    if (id) fetchData();
  }, [id]);

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

  // ====== بناء سجل الحركات الموحد — نفس منطق combinedLog بالظبط ======
  const combinedLog = useMemo(() => {
    if (!supplierData) return [];

    const logs = [];

    // 1. المديونية السابقة (رصيد افتتاحي)
    if (supplierData.openningBalance) {
      logs.push({
        date: supplierData.openningBalanceDate || supplierData.createdAt || new Date(),
        type: "opening",
        label: "رصيد افتتاحي",
        amount: supplierData.openningBalance,
        isOpening: true,
      });
    }

    // 2. المدفوعات العامة الغير مرتبطة بفاتورة شراء (pay / debt / أخرى)
    payments.forEach((payment) => {
      if (PURCHASE_TYPE_KEYS.includes(payment.module)) return;

      let direction = null;
      if (payment.module === "pay") {
        direction = "in"; // سداد للتاجر -> بيقلل المديونية
      } else if (payment.module === "debt") {
        direction = "out"; // مديونية إضافية -> بتزود المديونية
      } else {
        direction = payment.moneyFlow === "incoming" ? "in" : "out";
      }

      logs.push({
        date: payment.transactionDate,
        type: payment.module,
        amount: payment.amount,
        direction,
        isGenericPayment: true,
      });
    });

    // 3. فواتير الشراء (مجمعة مع مدفوعاتها)
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

        logs.push({
          date: doc.purchaseDate || doc.createdAt || new Date(),
          type,
          label: getLabel(type, doc),
          amount: doc.totalAmount || 0,
          paid: totalPaidFromPayments,
          isPurchase: true,
        });
      });
    });

    return logs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [supplierData, payments, purchasesByType]);

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

  // ====== الحساب التتابعي — نفس منطق sequentialLedger بالظبط ======
  const sequentialLedger = useMemo(() => {
    let runningBalance = 0;

    return filteredLog.map((op) => {
      const isOpening = op.type === "opening";
      const isPurchase = op.isPurchase;
      const isGeneric = op.isGenericPayment;

      let previousBalance = runningBalance;
      let debtAdded = 0;
      let paymentReceived = 0;

      if (isOpening) {
        debtAdded = op.amount;
        previousBalance = 0;
      } else if (isPurchase) {
        debtAdded = op.amount || 0;
        paymentReceived = op.paid || 0;
      } else if (isGeneric) {
        if (op.direction === "in") {
          paymentReceived = op.amount || 0;
        } else {
          debtAdded = op.amount || 0;
        }
      }

      runningBalance = previousBalance + debtAdded - paymentReceived;

      return { ...op, previousBalance, debtAdded, paymentReceived, balance: runningBalance };
    });
  }, [filteredLog]);

  // ====== الإجماليات — نفس منطق totals بالظبط ======
  const totals = useMemo(() => {
    let openingBalance = 0;
    let totalPurchases = 0;
    let totalPaidOnPurchases = 0;
    let totalPaidToSupplier = 0;
    let totalExtraDebt = 0;
    const byType = {};
    PURCHASE_TYPE_KEYS.forEach((t) => (byType[t] = 0));

    sequentialLedger.forEach((op) => {
      if (op.type === "opening") {
        openingBalance = op.amount || 0;
      } else if (op.isPurchase) {
        totalPurchases += op.debtAdded || 0;
        totalPaidOnPurchases += op.paymentReceived || 0;
        byType[op.type] = (byType[op.type] || 0) + (op.debtAdded || 0);
      } else if (op.type === "pay") {
        totalPaidToSupplier += op.amount || 0;
      } else if (op.type === "debt") {
        totalExtraDebt += op.amount || 0;
      }
    });

    return { openingBalance, totalPurchases, totalPaidOnPurchases, totalPaidToSupplier, totalExtraDebt, byType };
  }, [sequentialLedger]);

  const finalBalance =
    sequentialLedger.length > 0
      ? sequentialLedger[sequentialLedger.length - 1]?.balance
      : supplierData?.openningBalance || 0;

  const handlePrint = () => window.print();

  if (loading) return <div className="p-10 text-center font-normal text-black">جاري التحميل...</div>;

  if (!supplierData) {
    return <div className="p-10 text-center font-normal text-black">حدث خطأ في تحميل بيانات التاجر</div>;
  }

  return (
    <div id="invoice" className="p-4 mx-auto text-right max-w-2xl" dir="rtl">
      {/* شريط التحكم - يختفي عند الطباعة */}
      <div className="no-print mb-6 flex flex-col md:flex-row justify-between items-center bg-gray-100 p-4 rounded gap-4">
        <h2 className="font-normal">ملخص حساب تاجر: {supplierData?.name}</h2>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border p-2 rounded text-sm"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border p-2 rounded text-sm"
          />
          <button
            onClick={() => {
              setFromDate("");
              setToDate("");
            }}
            className="bg-gray-500 text-white px-3 py-2 rounded text-sm whitespace-nowrap"
          >
            إلغاء التصفية
          </button>
          <button
            onClick={handlePrint}
            className="bg-black text-white px-5 py-2 rounded font-normal hover:bg-gray-800 transition-all text-sm"
          >
            طباعة الملخص
          </button>
        </div>
      </div>

      {/* جسم الملخص */}
      <div id="invoice-capture" className="bg-white p-6 border-2 border-black print:border-0 print:p-0" dir="rtl">
        <div className="border-b-4 border-black pb-4 mb-6 text-right">
          <h1 className="text-2xl font-black">{settings?.invoiceFactoryName}</h1>
          <p className="font-normal mt-1 text-slate-700">ملخص كشف حساب تاجر</p>
        </div>

        <div className="mb-6 border-r-4 border-black pr-4">
          <p className="text-xl font-black">اسم التاجر : {supplierData?.name}</p>
          <p className="text-md text-slate-800">رقم التلفون : {supplierData?.phone}</p>
          <p className="text-md text-slate-800">
            رصيد التاجر الحالي : {supplierData?.balance?.toLocaleString() || "0"} ج.م
          </p>
        </div>

        {/* صندوق الملخص — نفس بنود ملخص كشف الحساب التفصيلي بالظبط */}
        <div className="border-4 border-black">
          <div className="bg-black text-white p-3 text-center font-black">ملخص كشف الحساب</div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between border-b pb-2">
              <span className="font-normal">المديونية السابقة</span>
              <span className="font-black">{totals.openingBalance.toLocaleString()} ج.م</span>
            </div>

            {PURCHASE_TYPE_KEYS.filter((t) => totals.byType[t] > 0).map((t) => (
              <div className="flex justify-between border-b pb-2" key={t}>
                <span className="font-normal">إجمالي مشتريات {PURCHASE_TYPES[t].label}</span>
                <span className="font-black">+{totals.byType[t].toLocaleString()} ج.م</span>
              </div>
            ))}

            <div className="flex justify-between border-b pb-2">
              <span className="font-normal">إجمالي قيمة المشتريات (كل الأنواع)</span>
              <span className="font-black">+{totals.totalPurchases.toLocaleString()} ج.م</span>
            </div>

            <div className="flex justify-between border-b pb-2">
              <span className="font-normal">إجمالي المسدد على فواتير الشراء</span>
              <span className="font-black">-{totals.totalPaidOnPurchases.toLocaleString()} ج.م</span>
            </div>

            <div className="flex justify-between border-b pb-2">
              <span className="font-normal">سداد مباشر للتاجر</span>
              <span className="font-black">-{totals.totalPaidToSupplier.toLocaleString()} ج.م</span>
            </div>

            <div className="flex justify-between border-b pb-2">
              <span className="font-normal">مديونية إضافية من التاجر</span>
              <span className="font-black">+{totals.totalExtraDebt.toLocaleString()} ج.م</span>
            </div>

            <div className="flex justify-between text-xl pt-2 border-t-2 border-black">
              <span className="font-black">المديونية النهائية</span>
              <span className="font-black">{finalBalance?.toLocaleString() || "0"} ج.م</span>
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

export default SupplierAccountSummary;
