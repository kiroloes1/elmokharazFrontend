import React, { useState, useEffect } from "react";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiPrinter,
  FiArrowRight,
  FiXCircle,
} from "react-icons/fi";
import { FaMoneyBill } from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { showAlert } from "../../services/alert";
import { CalendarDaysIcon } from "lucide-react";

// إعدادات الحالة: لون + أيقونة + نص عربي
const statusConfig = {
  under_collection: {
    label: "تحت التحصيل",
    color: "bg-accent/10 text-accent border-accent/30",
    icon: <FiClock className="w-4 h-4" />,
  },
  collected: {
    label: "تم التحصيل",
    color: "bg-green-100 text-green-700 border-green-300",
    icon: <FiCheckCircle className="w-4 h-4" />,
  },
  returned: {
    label: "مرتجع",
    color: "bg-red-100 text-red-700 border-red-300",
    icon: <FiAlertCircle className="w-4 h-4" />,
  },
  cancelled: {
    label: "ملغي",
    color: "bg-brown/10 text-brown border-brown/30",
    icon: <FiXCircle className="w-4 h-4" />,
  },
    due_today: {
    label: "مستحق اليوم",
    color: "bg-brown/10 text-brown border-brown/30",
    icon: <CalendarDaysIcon className="w-4 h-4" />,
  },

  
};

const locationLabels = {
  with_me: "عندي",
  with_bank: "بالبنك",
  delivered: "تم التسليم",
};

const moduleLabels = {
  debt: "رصيد / دين",
  delivery: "نقلة",
};

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "-";

const formatMoney = (amount) =>
  `${Number(amount || 0).toLocaleString()} ج.م`;

const Cheque = () => {
  const { chequeId } = useParams();
  const navigate = useNavigate();
  const [cheque, setCheque] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCheque = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/cheque/${chequeId}`);
      setCheque(res.data.cheque);
    } catch (error) {
      showAlert({
        title: "حدث خطأء ما اثناء جلب البيانات",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheque();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chequeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-dark" />
      </div>
    );
  }

  if (!cheque) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-brown">
        <FiAlertCircle className="w-10 h-10 mb-2" />
        <p>لم يتم العثور على الشيك</p>
      </div>
    );
  }

  const owner = cheque.customer || cheque.supplier;
  const status = statusConfig[cheque.status] || {
    label: cheque.status,
    color: "bg-brown/10 text-brown border-brown/30",
    icon: <FiClock className="w-4 h-4" />,
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 bg-ligth min-h-screen" dir="rtl">
      {/* الهيدر - يختفي بالكامل وقت الطباعة */}
      <div className="no-print flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-brown hover:text-dark transition"
        >
          <FiArrowRight className="w-5 h-5" />
          <span>رجوع</span>
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-brown/30 text-brown hover:bg-brown/5 transition"
          >
            <FiPrinter className="w-4 h-4" />
            طباعة
          </button>
        </div>
      </div>

      {/* بطاقة الشيك الرئيسية - النسخة اللي بتبان على الشاشة */}
      <div className="printable-area bg-white rounded-2xl shadow-sm border border-brown/20 overflow-hidden">
        {/* Header بلون */}
        <div className="cheque-header bg-gradient-to-l from-dark to-brown text-ligth p-6 flex items-center justify-between">
          <div>
            <p className="text-ligth/70 text-sm mb-1">شيك رقم</p>
            <h1 className="cheque-title text-2xl font-bold">#{cheque.chequeNumber}</h1>
          </div>
          <div
            className={`status-badge flex items-center gap-2 px-4 py-2 rounded-md border bg-white ${status.color} font-medium`}
          >
            {status.icon}
            {status.label}
          </div>
        </div>

        {/* المبلغ */}
        <div className="amount-block text-center py-8 border-b border-brown/10">
          <p className="text-brown text-sm mb-1">قيمة الشيك</p>
          <p className="amount-value text-4xl font-bold text-dark">
            {formatMoney(cheque.amount)}
          </p>
        </div>

        {/* بيانات العميل / التاجر */}
        {owner && (
          <div className="owner-block p-6 border-b border-brown/10">
            <h2 className="text-sm font-semibold text-brown mb-3">
              {cheque.customer ? "بيانات العميل" : "بيانات التاجر"}
            </h2>
            <div className="flex items-center justify-between bg-ligth rounded-xl p-4">
              <div>
                <p className="font-bold text-dark">{owner.name}</p>
                <p className="text-sm text-brown">{owner.phone}</p>
              </div>
              <div className="text-left">
                <p className="text-sm text-brown">الرصيد الحالي</p>
                <p
                  className={`font-bold ${
                    owner.balance < 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {formatMoney(owner.balance)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* تفاصيل الشيك */}
        <div className="details-grid p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <DetailItem label="البنك" value={cheque.bankName} />
          <DetailItem
            label="نوع الشيك"
            value={cheque.chequeType === "normal" ? "عادي" : cheque.chequeType}
          />
          <DetailItem
            label="مكان الشيك"
            value={locationLabels[cheque.location] || cheque.location}
          />
          <DetailItem
            label="مرتبط بـ"
            value={moduleLabels[cheque.module] || cheque.module}
          />
          <DetailItem label="تاريخ الاستلام" value={formatDate(cheque.receiveDate)} />
          <DetailItem label="تاريخ الاستحقاق" value={formatDate(cheque.dueDate)} />

        </div>

        {/* ملاحظات */}
        {cheque.notes && (
          <div className="notes-block px-6 pb-6">
            <h2 className="text-sm font-semibold text-brown mb-2">ملاحظات</h2>
            <p className="bg-ligth rounded-xl p-4 text-dark">
              {cheque.notes}
            </p>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          @page { margin: 1cm; size: A4; }

          html, body {
            background: #ffffff !important;
            color: #000000 !important;
          }

          .no-print { display: none !important; }

          /* شيل أي هوامش أو ظل حوالين الصفحة نفسها */
          .max-w-4xl {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            min-height: 0 !important;
          }

          .printable-area {
            box-shadow: none !important;
            border: 1px solid #000 !important;
            border-radius: 0 !important;
          }

          /* هيدر مضغوط */
          .cheque-header {
            background: #ffffff !important;
            background-image: none !important;
            color: #000000 !important;
            border-bottom: 2px solid #000 !important;
            padding: 10px 16px !important;
          }
          .cheque-header * { color: #000000 !important; }
          .cheque-title { font-size: 18px !important; }

          .status-badge {
            background: #ffffff !important;
            color: #000000 !important;
            border: 1px solid #000 !important;
            padding: 4px 10px !important;
            font-size: 12px !important;
          }
          .status-badge svg { color: #000000 !important; width: 12px !important; height: 12px !important; }

          /* مبلغ الشيك مضغوط */
          .amount-block { padding: 12px 16px !important; }
          .amount-value { font-size: 24px !important; }

          .owner-block { padding: 10px 16px !important; }
          .owner-block .rounded-xl { padding: 8px !important; }

          /* شبكة التفاصيل: 3 أعمدة مضغوطة بدل عمودين واسعين */
          .details-grid {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 6px !important;
            padding: 10px 16px !important;
          }

          .notes-block { padding: 8px 16px 12px !important; }

          /* أي خلفية ملونة تتحول لأبيض */
          * {
            background-color: #ffffff !important;
            box-shadow: none !important;
          }

          p, h1, h2, h3, span, div {
            color: #000000 !important;
          }

          .border, .border-b, .border-t,
          [class*="border-brown"],
          [class*="border-accent"],
          [class*="border-green"],
          [class*="border-red"] {
            border-color: #000000 !important;
          }

          table { width: 100% !important; border-collapse: collapse !important; margin-top: 10px; }
          th, td { border: 1px solid #000 !important; padding: 4px !important; color: #000 !important; font-size: 11px !important; }
          th { background-color: #f2f2f2 !important; -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
};

const DetailItem = ({ label, value }) => (
  <div className="detail-item bg-ligth rounded-xl p-4 border border-transparent">
    <p className="text-xs text-brown mb-1">{label}</p>
    <p className="font-medium text-dark">{value || "-"}</p>
  </div>
);

export default Cheque;