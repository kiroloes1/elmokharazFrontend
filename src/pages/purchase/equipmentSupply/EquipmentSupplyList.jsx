import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Wrench, Calendar, CreditCard, Edit3, Loader2, 
  Package, Printer, Trash, ChevronRight, ChevronLeft,
  DollarSign, ShoppingBag
} from "lucide-react";
import api from "../../../services/api";
import { showAlert } from "../../../services/alert";
import { showAlertConfirm } from "../../../services/alertConfirm";

const EquipmentSupplyList = () => {
  const navigate = useNavigate();

  // States
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Pagination States
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // 1. جلب تفاصيل فاتورة محددة بالـ ID
  const fetchInvoiceDetails = useCallback(async (id) => {
    try {
      setDetailsLoading(true);
      const res = await api.get(`/equipmentSupply/${id}`);
      setSelectedInvoice(res.data.equipment || null);
    } catch (err) {
      showAlert({ title: "خطأ في جلب تفاصيل الفاتورة", icon: "error" });
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  // 2. جلب قائمة الفواتير مع Pagination
  const fetchInvoices = useCallback(async (currentPage) => {
    try {
      setLoading(true);
      const res = await api.get(`/equipmentSupply?page=${currentPage}&limit=${limit}`);
      const rawInvoices = res.data.equipments || [];
      
      setInvoices(rawInvoices);
      setTotalPages(res.data.totalPages || 1);

      if (rawInvoices.length > 0) {
        fetchInvoiceDetails(rawInvoices[0]._id);
      } else {
        setSelectedInvoice(null);
      }
    } catch (err) {
      showAlert({ title: "خطأ في جلب البيانات", icon: "error" });
    } finally {
      setLoading(false);
    }
  }, [fetchInvoiceDetails]);

  useEffect(() => {
    fetchInvoices(page);
  }, [page, fetchInvoices]);

  // حذف الفاتورة
  const handleToDelete = async (id) => {
    try {
      const confirm = await showAlertConfirm({
        title: "حذف فاتورة مشتريات مستلزمات معدات",
        text: "هل أنت متأكد أنك تريد حذف هذه الفاتورة؟ لا يمكن الرجوع في القرار بعد الموافقة",
        icon: "warning",
        confirmButtonText: "تأكيد",
        cancelButtonText: "إلغاء"
      });
      if (!confirm.isConfirmed) return;

      await api.delete(`/equipmentSupply/${id}`);
      const updatedInvoices = invoices.filter(inv => inv._id !== id);
      setInvoices(updatedInvoices);

      if (updatedInvoices.length > 0) {
        fetchInvoiceDetails(updatedInvoices[0]._id);
      } else {
        setSelectedInvoice(null);
      }

      showAlert({ title: "تم حذف الفاتورة بنجاح", icon: "success" });
    } catch (err) {
      showAlert({ title: "خطأ في حذف الفاتورة", icon: "error" });
    }
  };

  // حساب حالة الدفع
  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case "paid":
        return { label: "مدفوع بالكامل", bg: "bg-emerald-100 text-emerald-800 border-emerald-200" };
      case "partial":
        return { label: "مدفوع جزئياً", bg: "bg-amber-100 text-amber-800 border-amber-200" };
      case "unpaid":
        return { label: "غير مدفوع", bg: "bg-red-100 text-red-800 border-red-200" };
      default:
        return { label: status, bg: "bg-gray-100 text-gray-800 border-gray-200" };
    }
  };

  if (loading && page === 1) {
    return (
      <div className="h-screen flex items-center justify-center bg-ligth font-[cairo]">
        <Loader2 className="animate-spin text-dark" size={40} />
      </div>
    );
  }

  if (!loading && invoices.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-ligth text-center p-6" dir="rtl">
        <ShoppingBag size={70} className="text-brown/40 mb-4" />
        <h2 className="text-2xl font-black text-dark">لا توجد فواتير مشتريات مستلزمات معدات</h2>
        <p className="text-dark/60 mt-2">لم يتم تسجيل أي فاتورة حتى الآن.</p>
        <button
          onClick={() => navigate("/equipmentSupply/add")}
          className="mt-6 bg-brown text-ligth px-6 py-3 rounded-lg font-black hover:opacity-90 transition-all"
        >
          إضافة فاتورة جديدة
        </button>
      </div>
    );
  }

  // حساب الحسابات المالية للفاتورة المعروضة
  const totalAmount = selectedInvoice?.totalAmount || 0;
  const paidAmount = selectedInvoice?.paidAmount || 0;
  const remainingAmount = selectedInvoice?.remainingAmount || (totalAmount - paidAmount);

  return (
    <div className="w-full min-h-screen p-4 lg:p-8 flex flex-col justify-between font-[cairo]" dir="rtl">
      
      {/* ================= SECTION 1: الشاشة الرئيسية ================= */}
      <div className="flex-1 mb-6 space-y-6">
        
        {/* Top Header */}
        <div className="flex justify-between items-center border-b border-brown/20 pb-4 flex-wrap gap-4">
          <div className="space-y-1 text-right">
            <span className="px-3 py-1 bg-brown/10 text-brown text-[10px] font-black rounded-full uppercase">
              معاينة الفاتورة الكاملة
            </span>
            <h1 className="text-3xl font-black text-dark">
              فاتورة مشتريات #{selectedInvoice?.invoiceNumber || "---"} - {selectedInvoice?.supplier?.name || "تاجر  غير محدد"}
            </h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleToDelete(selectedInvoice?._id)}
              disabled={!selectedInvoice || detailsLoading}
              className="bg-red-700 hover:opacity-90 disabled:opacity-50 text-ligth px-5 py-2.5 rounded-lg font-black text-sm flex items-center gap-2 shadow-md transition-all"
            >
              <Trash size={18} /> حذف
            </button>
            <button
              onClick={() => navigate(`/equipmentSupply/edit/${selectedInvoice?._id}`)}
              disabled={!selectedInvoice || detailsLoading}
              className="bg-dark hover:opacity-90 disabled:opacity-50 text-ligth px-5 py-2.5 rounded-lg font-black text-sm flex items-center gap-2 shadow-md transition-all"
            >
              <Edit3 size={18} /> تعديل الفاتورة
            </button>
            <button
              onClick={() => navigate(`/equipmentSupply/print/${selectedInvoice?._id}`)}
              disabled={!selectedInvoice || detailsLoading}
              className="bg-brown hover:opacity-90 disabled:opacity-50 text-ligth px-5 py-2.5 rounded-lg font-black text-sm flex items-center gap-2 shadow-md transition-all"
            >
              <Printer size={18} /> طباعة
            </button>

                      <button
                          onClick={() => navigate(`/equipmentSupply/part/print/${selectedInvoice?._id}`)}
                          disabled={!selectedInvoice || detailsLoading}
                          className="bg-brown hover:opacity-90 disabled:opacity-50 text-ligth px-5 py-2.5 rounded-lg font-black text-sm flex items-center gap-2 shadow-md transition-all"
                        >
                          <Printer size={18} /> طباعة مستلزمات المعدات
                        </button>
          </div>
        </div>

        {/* عرض مؤشر التحميل عند التبديل بين الفواتير */}
        {detailsLoading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-2 bg-white rounded-lg border border-brown/20">
            <Loader2 className="animate-spin text-brown" size={32} />
            <span className="text-xs font-bold text-dark/60">جاري جلب تفاصيل الفاتورة...</span>
          </div>
        ) : selectedInvoice && (
          <div className="space-y-6">
            
            {/* الشريط الإحصائي العلوي للفاتورة */}
            <div className="bg-white p-5 rounded-md border border-brown/20 shadow-sm grid grid-cols-2 md:grid-cols-3 gap-4 text-right">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                <span className="text-xs font-bold text-dark/60 block mb-1">اسم المعدة</span>
                <span className="font-black text-dark text-sm flex items-center gap-1">
                  <Package size={14} className="text-accent" />
                  {selectedInvoice.equipmentName || "---"}
                </span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                <span className="text-xs font-bold text-dark/60 block mb-1">تاريخ الشراء</span>
                <span className="font-black text-dark text-sm flex items-center gap-1">
                  <Calendar size={14} className="text-accent" />
                  {selectedInvoice.purchaseDate ? new Date(selectedInvoice.purchaseDate).toLocaleDateString('ar-EG') : "---"}
                </span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                <span className="text-xs font-bold text-dark/60 block mb-1">حالة الدفع</span>
                <span className={`px-3 py-1 rounded-full text-xs font-black border ${getPaymentStatusBadge(selectedInvoice.paymentStatus).bg}`}>
                  {getPaymentStatusBadge(selectedInvoice.paymentStatus).label}
                </span>
              </div>
            </div>

            {/* التقسيم الرئيسي: الأصناف والمعاملات المالية */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* === الجانب الأيمن: جدول الأصناف (7 أعمدة) === */}
              <div className="lg:col-span-7 bg-white p-6 rounded-md border border-brown/20 shadow-sm text-right space-y-4">
                <div className="flex justify-between items-center border-b border-brown/10 pb-3">
                  <h3 className="font-black text-dark text-lg flex items-center gap-2">
                    <Package size={20} className="text-accent" /> الأصناف والكميات
                  </h3>
                  <span className="text-xs font-bold text-brown bg-brown/10 px-3 py-1 rounded-full">
                    عدد الأصناف: {selectedInvoice.items?.length || 0}
                  </span>
                </div>

                {/* جدول الأصناف */}
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="bg-ligth text-dark border-b border-brown/20">
                        <th className="p-3 font-black rounded-r-xl">اسم الصنف</th>
                        <th className="p-3 font-black text-center">النوع/الفئة</th>
                        <th className="p-3 font-black text-center">الملاحظات</th>
                        <th className="p-3 font-black text-center">الكمية</th>
                        <th className="p-3 font-black text-center">سعر الوحدة</th>
                        <th className="p-3 font-black text-center rounded-l-xl">الإجمالي</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-brown/10">
                      {selectedInvoice.items?.map((item, idx) => {
                        const quantity = Number(item.quantity || 1);
                        const unitPrice = Number(item.unitPrice || 0);
                        const itemTotal = item.total ?? (quantity * unitPrice);

                        return (
                          <tr key={idx} className="hover:bg-ligth/50 font-bold text-dark">
                            <td className="p-3 font-black">{item.itemName || "بدون اسم"}</td>
                            <td className="p-3 text-center">{item.type || "—"}</td>
                            <td className="p-3 text-center">{item.notes || "—"}</td>
                            <td className="p-3 text-center">{quantity}</td>
                            <td className="p-3 text-center">{unitPrice.toLocaleString()} ج.م</td>
                            <td className="p-3 text-center font-black">{itemTotal.toLocaleString()} ج.م</td>
                          </tr>
                        );
                      })}
                    </tbody>

                    {/* Footer الجدول */}
                    <tfoot className="border-t-2 border-brown/20 bg-ligth font-black text-dark">
                      <tr>
                        <td className="p-3 font-black rounded-r-xl">الإجمالي الكلي</td>
                        <td className="p-3 text-center text-dark/40">—</td>
                        <td className="p-3 text-center text-dark/40">—</td>
                        <td className="p-3 text-center text-dark/40">—</td>
                        <td className="p-3 text-center text-dark/40">—</td>
                        <td className="p-3 text-center font-black bg-brown/10 rounded-l-xl">
                          {selectedInvoice.totalAmount?.toLocaleString() || 0} ج.م
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* الرصيد القديم وملاحظات الفاتورة */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {selectedInvoice.oldBalance > 0 && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <span className="text-xs font-bold text-blue-700 block">الرصيد القديم للتاجر :</span>
                      <span className="font-black text-blue-800">{selectedInvoice.oldBalance.toLocaleString()} ج.م</span>
                    </div>
                  )}
                  {selectedInvoice.notes && (
                    <div className="bg-brown/10 p-3 rounded-lg border border-brown/20">
                      <span className="text-xs font-bold text-brown block">ملاحظات الفاتورة:</span>
                      <p className="text-dark font-medium text-sm">{selectedInvoice.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* === الجانب الأيسر: المعاملات المالية (5 أعمدة) === */}
              <div className="lg:col-span-5 bg-white p-6 rounded-md border border-brown/20 shadow-sm text-right space-y-4">
                <div className="flex justify-between items-center border-b border-brown/10 pb-3">
                  <h3 className="font-black text-dark text-lg flex items-center gap-2">
                    <DollarSign size={20} className="text-accent" /> ملخص المدفوعات
                  </h3>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    مدفوع: {paidAmount.toLocaleString()} ج.م
                  </span>
                </div>

                {/* ملخص الحسابات الإجمالي والمدفوع والمتبقي */}
                <div className="bg-dark text-ligth p-4 rounded-lg space-y-2 pt-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-ligth/70">إجمالي الفاتورة:</span>
                    <span className="font-black text-sm">{totalAmount.toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-emerald-400">إجمالي المدفوع:</span>
                    <span className="font-black text-sm text-emerald-400">{paidAmount.toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-ligth/20 pt-2">
                    <span className="text-amber-400">المتبقي:</span>
                    <span className="font-black text-sm text-amber-400">{remainingAmount.toLocaleString()} ج.م</span>
                  </div>
                </div>

                {/* معلومات إضافية عن التاجر  */}
                {selectedInvoice.supplier && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-brown/20 mt-3">
                    <span className="text-xs font-bold text-dark/60 block">معلومات التاجر :</span>
                    <div className="flex justify-between items-center mt-1">
                      <span className="font-black text-dark text-sm">{selectedInvoice.supplier.name}</span>
                      {selectedInvoice.supplier.balance !== undefined && (
                        <span className="text-xs text-dark/60">
                          الرصيد: <span className="font-black">{selectedInvoice.supplier.balance.toLocaleString()} ج.م</span>
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </div>

      {/* ================= SECTION 2: الشريط السفلي (Pagination + Horizontal Scroll) ================= */}
      <div className="border-t border-brown/20 pt-4 space-y-3">
        
        {/* رأس الشريط السفلي + أزرار الصفحات */}
        <div className="flex justify-between items-center text-right flex-wrap gap-2">
          <span className="text-xs font-black text-dark">اختر فاتورة من القائمة للتفاصيل:</span>
          
          {/* أزرار الانتقال بين الصفحات */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1 || loading}
              className="p-1 rounded bg-white border border-brown/20 disabled:opacity-30 hover:bg-brown/10 transition"
              title="الصفحة السابقة"
            >
              <ChevronRight size={18} />
            </button>
            <span className="text-xs font-black text-brown">
              صفحة {page} من {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages || loading}
              className="p-1 rounded bg-white border border-brown/20 disabled:opacity-30 hover:bg-brown/10 transition"
              title="الصفحة التالية"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
        </div>

        {/* المربعات الصغيرة - النقر عليها يجلب تفاصيل الفاتورة */}
        <div className="flex items-center gap-3 overflow-x-auto max-w-[96vw] lg:max-w-[81vw] pb-3 pt-1 scrollbar-thin">
          {invoices.map((inv) => {
            const isSelected = selectedInvoice?._id === inv._id;

            return (
              <div
                key={inv._id}
                onClick={() => fetchInvoiceDetails(inv._id)}
                className={`flex-shrink-0 w-60 p-4 rounded-lg cursor-pointer border transition-all text-right space-y-2 shadow-sm ${
                  isSelected 
                    ? "bg-dark text-ligth border-dark ring-4 ring-brown/30 scale-105" 
                    : "bg-white text-dark border-brown/20 hover:border-brown hover:bg-ligth"
                }`}
              >
                {/* أعلى المربع */}
                <div className="flex justify-between items-center">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${isSelected ? "bg-accent text-dark" : "bg-brown/10 text-brown"}`}>
                    فاتورة #{inv.invoiceNumber || "---"}
                  </span>
                  <span className={`text-[10px] font-bold ${isSelected ? "text-ligth/60" : "text-dark/50"}`}>
                    {inv.purchaseDate ? new Date(inv.purchaseDate).toLocaleDateString('ar-EG') : '---'}
                  </span>
                </div>

                {/* اسم المعدة */}
                <div className="font-black text-sm truncate">
                  {inv.equipmentName || "معدة غير معروفة"}
                </div>

                {/* اسم التاجر  */}
                <div className="text-xs text-dark/60 truncate">
                  {inv.supplier?.name || "تاجر  غير معروف"}
                </div>

                {/* المبالغ في المربع */}
                <div className="flex justify-between items-end pt-2 border-t border-brown/10 text-xs">
                  <div>
                    <span className={`text-[9px] block ${isSelected ? "text-ligth/60" : "text-dark/50"}`}>الإجمالي</span>
                    <span className="font-black">{(inv.totalAmount || 0).toLocaleString()}</span>
                  </div>

                  {/* حالة الدفع - مربع صغير */}
                  <div className="pt-1">
                    <span className={`text-[8px] px-2 py-0.5 rounded-full border ${getPaymentStatusBadge(inv.paymentStatus).bg}`}>
                      {getPaymentStatusBadge(inv.paymentStatus).label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default EquipmentSupplyList;