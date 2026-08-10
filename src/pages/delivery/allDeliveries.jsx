import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Truck, Calendar, CreditCard, Edit3, Loader2, 
  Package, Printer, Trash, ChevronRight, ChevronLeft 
} from "lucide-react";
import api from "../../services/api"; 
import { showAlert } from "../../services/alert";
import { showAlertConfirm } from "../../services/alertConfirm";

const DeliveriesList = () => {
  const navigate = useNavigate();

  // States
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  // Pagination States
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10; // عدد النقلات في كل صفحة

  // 1. جلب تفاصيل نقلة محددة بالـ ID عند النقر عليها
  const fetchDeliveryDetails = useCallback(async (id) => {
    try {
      setDetailsLoading(true);
      const res = await api.get(`/delivery/${id}`);
      setSelectedDelivery(res.data.delivery || null);
    } catch (err) {
      showAlert({ title: "خطأ في جلب تفاصيل النقلة", icon: "error" });
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  // 2. جلب قائمة النقلات الأساسية مع Pagination
  const fetchDeliveries = useCallback(async (currentPage) => {
    try {
      setLoading(true);
      const res = await api.get(`/delivery?page=${currentPage}&limit=${limit}`); 
      const rawDeliveries = res.data.deliveries || [];
      
      setDeliveries(rawDeliveries);
      setTotalPages(res.data.totalPages || 1);

      // اختيار أول نقلة تلقائياً وجلب تفاصيلها الكاملة
      if (rawDeliveries.length > 0) {
        fetchDeliveryDetails(rawDeliveries[0]._id);
      } else {
        setSelectedDelivery(null);
      }
    } catch (err) {
      showAlert({ title: "خطأ في جلب البيانات", icon: "error" });
    } finally {
      setLoading(false);
    }
  }, [fetchDeliveryDetails]);

  useEffect(() => {
    fetchDeliveries(page);
  }, [page, fetchDeliveries]);

  // حذف النقلة
  const handleToDelete = async (id) => {
    try {
      const confirm = await showAlertConfirm({
        title: "حذف نقلة",
        text: "هل أنت متأكد أنك تريد حذف هذه النقلة؟ لا يمكن الرجوع في القرار بعد الموافقة",
        icon: "warning",
        confirmButtonText: "تأكيد",
        cancelButtonText: "إلغاء"
      });
      if (!confirm.isConfirmed) return;

      await api.delete(`/delivery/${id}`); 
      const updatedDeliveries = deliveries.filter(d => d._id !== id);
      setDeliveries(updatedDeliveries);

      if (updatedDeliveries.length > 0) {
        fetchDeliveryDetails(updatedDeliveries[0]._id);
      } else {
        setSelectedDelivery(null);
      }

      showAlert({ title: "تم حذف النقلة بنجاح", icon: "success" });
    } catch (err) {
      showAlert({ title: "خطأ في حذف النقلة", icon: "error" });
    }
  };

  // شارات وسائل الدفع المرفقة
  const getPaymentBadge = (method) => {
    switch (method) {
      case "cash":
        return { label: "نقدي", bg: "bg-emerald-100 text-emerald-800 border-emerald-200" };
      case "instapay":
        return { label: "إنستا باي", bg: "bg-purple-100 text-purple-800 border-purple-200" };
      case "bank":
        return { label: "تحويل بنكي", bg: "bg-blue-100 text-blue-800 border-blue-200" };
      case "wallet":
        return { label: "محفظة إلكترونية", bg: "bg-amber-100 text-amber-800 border-amber-200" };
      case "cheque":
        return { label: "شيك بنكي", bg: "bg-rose-100 text-rose-800 border-rose-200" };
      case "mail":
        return { label: "حوالة بريدية", bg: "bg-cyan-100 text-cyan-800 border-cyan-200" };
      case "work":
        return { label: "شغل", bg: "bg-orange-100 text-orange-800 border-orange-200" };
      default:
        return { label: method, bg: "bg-ligth text-dark border-brown/20" };
    }
  };

  if (loading && page === 1) {
    return (
      <div className="h-screen flex items-center justify-center bg-ligth font-[cairo]">
        <Loader2 className="animate-spin text-dark" size={40} />
      </div>
    );
  }

  // حساب الحسابات المالية للنقلة المعروضة
  const currentPayments = selectedDelivery?.Payments || selectedDelivery?.payment || [];
  const currentTotalPaid = currentPayments.reduce((acc, p) => acc + Number(p.amount || p.paidAmount || 0), 0);
  const totalAmount = selectedDelivery?.totalAmount || 0;
  const remainingAmount = totalAmount - currentTotalPaid;

  if (!loading && deliveries.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-ligth text-center p-6" dir="rtl">
        <Truck size={70} className="text-brown/40 mb-4" />
        <h2 className="text-2xl font-black text-dark">لا توجد نقلات</h2>
        <p className="text-dark/60 mt-2">لم يتم تسجيل أي نقلة حتى الآن.</p>
        <button
          onClick={() => navigate("/deliveries/add")}
          className="mt-6 bg-brown text-ligth px-6 py-3 rounded-lg font-black hover:opacity-90 transition-all"
        >
          إضافة نقلة جديدة
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen p-4 lg:p-8 flex flex-col justify-between font-[cairo]" dir="rtl">
      
      {/* ================= SECTION 1: الشاشة الرئيسية ================= */}
      <div className="flex-1 mb-6 space-y-6">
        
        {/* Top Header */}
        <div className="flex justify-between items-center border-b border-brown/20 pb-4">
          <div className="space-y-1 text-right">
            <span className="px-3 py-1 bg-brown/10 text-brown text-[10px] font-black rounded-full uppercase">
              معاينة الفاتورة الكاملة
            </span>
            <h1 className="text-3xl font-black text-dark">
              نقلة #{selectedDelivery?.delveryNumber || "---"} - {selectedDelivery?.supplier?.name || "تاجر غير محدد"}
            </h1>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => handleToDelete(selectedDelivery?._id)}
              disabled={!selectedDelivery || detailsLoading}
              className="bg-red-700 hover:opacity-90 disabled:opacity-50 text-ligth px-5 py-2.5 rounded-lg font-black text-sm flex items-center gap-2 shadow-md transition-all"
            >
              <Trash size={18} /> حذف 
            </button>
            <button
              onClick={() => navigate(`/deliveries/edit/${selectedDelivery?._id}`)}
              disabled={!selectedDelivery || detailsLoading}
              className="bg-dark hover:opacity-90 disabled:opacity-50 text-ligth px-5 py-2.5 rounded-lg font-black text-sm flex items-center gap-2 shadow-md transition-all"
            >
              <Edit3 size={18} /> تعديل النقلة
            </button>
            <button
              onClick={() => navigate(`/deliveries/print/${selectedDelivery?._id}`)}
              disabled={!selectedDelivery || detailsLoading}
              className="bg-brown hover:opacity-90 disabled:opacity-50 text-ligth px-5 py-2.5 rounded-lg font-black text-sm flex items-center gap-2 shadow-md transition-all"
            >
              <Printer size={18} /> طباعة 
            </button>

             <button
              onClick={() => navigate(`/deliveries/item/print/${selectedDelivery?._id}`)}
              disabled={!selectedDelivery || detailsLoading}
              className="bg-ligth hover:opacity-90 disabled:opacity-50 text-dark px-5 py-2.5 rounded-lg font-black text-sm flex items-center gap-2 shadow-md transition-all"
            >
              <Printer size={18} /> طباعه الاصناف 
            </button>
          </div>
        </div>

        {/* عرض مؤشر التحميل عند التبديل بين النقلات */}
        {detailsLoading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-2 bg-white rounded-lg border border-brown/20">
            <Loader2 className="animate-spin text-brown" size={32} />
            <span className="text-xs font-bold text-dark/60">جاري جلب تفاصيل النقلة...</span>
          </div>
        ) : selectedDelivery && (
          <div className="space-y-6">
            
            {/* الشريط الإحصائي العلوي للنقلة */}
            <div className="bg-white p-5 rounded-md border border-brown/20 shadow-sm grid grid-cols-2 md:grid-cols-2 gap-4 text-right">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                <span className="text-xs font-bold text-dark/60 block mb-1">تاريخ النقلة</span>
                <span className="font-black text-dark text-sm flex items-center gap-1">
                  <Calendar size={14} className="text-accent" />
                  {selectedDelivery.deliveryDate ? new Date(selectedDelivery.deliveryDate).toLocaleDateString('ar-EG') : "---"}
                </span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                <span className="text-xs font-bold text-dark/60 block mb-1">المستلم</span>
                <span className="font-black text-dark text-sm">{selectedDelivery.receivedBy?.username || "---"}</span>
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
                    عدد الأصناف: {selectedDelivery.items?.length || 0}
                  </span>
                </div>

                {/* جدول الأصناف */}
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="bg-ligth text-dark border-b border-brown/20">
                        <th className="p-3 font-black rounded-r-xl">الصنف</th>
                        <th className="p-3 font-black text-center">سعر الكيلو</th>
                        <th className="p-3 font-black text-center">الوزن القائم</th>
                        <th className="p-3 font-black text-center">مرتجع</th>
                        <th className="p-3 font-black text-center">مرتجع قديم</th>
                        <th className="p-3 font-black text-center">الوزن الصافي</th>
                        <th className="p-3 font-black text-center rounded-l-xl">الإجمالي</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-brown/10">
                      {selectedDelivery.items?.map((item, idx) => {
                        const grossWeight = Number(
                          item.grossWeight || 
                          item.totalWeight || 
                          item.batches?.reduce((acc, curr) => acc + (Number(curr.weight || 0) * Number(curr.quantity || 1)), 0) || 
                          0
                        );
                        const returnW = Number(item.returnWeight || 0);
                        const oldReturnW = Number(item.oldReturnWeight || 0);
                        const price = Number(item.pricePerKg || 0);

                        const netWeight = Math.max(0, grossWeight - returnW - oldReturnW);
                        const itemTotalPrice = item.totalPrice ?? (netWeight * price);

                        return (
                          <tr key={idx} className="hover:bg-ligth/50 font-bold text-dark">
                            <td className="p-3 font-black">{item.item?.name || "صنف بدون اسم"}</td>
                            <td className="p-3 text-center">{price.toLocaleString()} ج.م</td>
                            <td className="p-3 text-center">{grossWeight.toLocaleString()} كجم</td>
                            <td className="p-3 text-center">{returnW.toLocaleString()} كجم</td>
                            <td className="p-3 text-center">{oldReturnW.toLocaleString()} كجم</td>
                            <td className="p-3 text-center font-black">{netWeight.toLocaleString()} كجم</td>
                            <td className="p-3 text-center font-black">{itemTotalPrice.toLocaleString()} ج.م</td>
                          </tr>
                        );
                      })}
                    </tbody>

                    {/* Footer الجدول */}
                    <tfoot className="border-t-2 border-brown/20 bg-ligth font-black text-dark">
                      <tr>
                        <td className="p-3 font-black rounded-r-xl">الإجمالي الكلي</td>
                        <td className="p-3 text-center text-dark/40">—</td>
                        
                        <td className="p-3 text-center">
                          {(selectedDelivery.items?.reduce((acc, item) => {
                            const gross = Number(
                              item.grossWeight || 
                              item.totalWeight || 
                              item.batches?.reduce((bAcc, bCurr) => bAcc + (Number(bCurr.weight || 0) * Number(bCurr.quantity || 1)), 0) || 
                              0
                            );
                            return acc + gross;
                          }, 0) || 0).toLocaleString()} كجم
                        </td>

                        <td className="p-3 text-center">
                          {(selectedDelivery.items?.reduce((acc, item) => acc + Number(item.returnWeight || 0), 0) || 0).toLocaleString()} كجم
                        </td>

                        <td className="p-3 text-center">
                          {(selectedDelivery.items?.reduce((acc, item) => acc + Number(item.oldReturnWeight || 0), 0) || 0).toLocaleString()} كجم
                        </td>

                        <td className="p-3 text-center font-black">
                          {(selectedDelivery.items?.reduce((acc, item) => {
                            const gross = Number(
                              item.grossWeight || 
                              item.totalWeight || 
                              item.batches?.reduce((bAcc, bCurr) => bAcc + (Number(bCurr.weight || 0) * Number(bCurr.quantity || 1)), 0) || 
                              0
                            );
                            const ret = Number(item.returnWeight || 0);
                            const oldRet = Number(item.oldReturnWeight || 0);
                            return acc + Math.max(0, gross - ret - oldRet);
                          }, 0) || 0).toLocaleString()} كجم
                        </td>

                        <td className="p-3 text-center font-black bg-brown/10 rounded-l-xl">
                          {(selectedDelivery.totalAmount || selectedDelivery.items?.reduce((acc, item) => {
                            const gross = Number(
                              item.grossWeight || 
                              item.totalWeight || 
                              item.batches?.reduce((bAcc, bCurr) => bAcc + (Number(bCurr.weight || 0) * Number(bCurr.quantity || 1)), 0) || 
                              0
                            );
                            const ret = Number(item.returnWeight || 0);
                            const oldRet = Number(item.oldReturnWeight || 0);
                            const net = Math.max(0, gross - ret - oldRet);
                            return acc + (item.totalPrice ?? (net * Number(item.pricePerKg || 0)));
                          }, 0) || 0).toLocaleString()} ج.م
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* ملاحظات الفاتورة */}
                {selectedDelivery.notes && (
                  <div className="bg-brown/10 p-4 rounded-lg border border-brown/20 text-xs mt-4">
                    <span className="font-bold text-brown block mb-1">ملاحظات الفاتورة:</span>
                    <p className="text-dark font-medium">{selectedDelivery.notes}</p>
                  </div>
                )}
              </div>

              {/* === الجانب الأيسر: المعاملات المالية (5 أعمدة) === */}
              <div className="lg:col-span-5 bg-white p-6 rounded-md border border-brown/20 shadow-sm text-right space-y-4">
                <div className="flex justify-between items-center border-b border-brown/10 pb-3">
                  <h3 className="font-black text-dark text-lg flex items-center gap-2">
                    <CreditCard size={20} className="text-accent" /> المعاملات المالية ووسائط الدفع
                  </h3>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    {currentPayments.length} عملية دفع
                  </span>
                </div>

                {/* كروت المعاملات المالية */}
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {currentPayments.map((p, idx) => {
                    const badge = getPaymentBadge(p.paymentMethod);
                    return (
                      <div key={idx} className="p-3.5 rounded-lg border border-brown/20 space-y-2 text-xs">
                        <div className="flex justify-between items-center border-b border-brown/10 pb-2">
                          <span className={`px-2 py-0.5 rounded-lg font-black border ${badge.bg}`}>
                            {badge.label}
                          </span>
                          <span className="font-black text-dark text-sm">
                            {(p.amount || p.paidAmount || 0).toLocaleString()} ج.م
                          </span>
                        </div>

                        {/* بيانات إضافية حسب وسيلة الدفع */}
                        {p.bankInfo?.bankName && (
                          <div className="text-[11px] text-dark/70 space-y-0.5 pt-0.5">
                            <p><span className="text-dark/40">البنك:</span> {p.bankInfo.bankName}</p>
                            <p><span className="text-dark/40">رقم المعاملة:</span> {p.bankInfo.transactionReference}</p>
                          </div>
                        )}
                        {p.walletInfo && (
                          <div className="text-[11px] text-dark/70 space-y-0.5 pt-0.5">
                            <p><span className="text-dark/40">المستلم:</span> {p.walletInfo.receiverPhone}</p>
                            <p><span className="text-dark/40">المرسل:</span> {p.walletInfo.senderPhone}</p>
                          </div>
                        )}
                        {p.cheque?.chequeNumber && (
                          <div className="text-[11px] text-dark/70 space-y-0.5 pt-0.5">
                            <p><span className="text-dark/40">رقم الشيك:</span> {p.cheque.chequeNumber}</p>
                            <p>
                              <span className="text-dark/40">الاستحقاق:</span>{" "}
                              {new Date(p.cheque.dueDate).toLocaleDateString("ar-EG")}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* ملخص الحسابات الإجمالي والمدفوع والمتبقي */}
                <div className="bg-dark text-ligth p-4 rounded-lg space-y-2 pt-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-ligth/70">إجمالي الفاتورة:</span>
                    <span className="font-black text-sm">{totalAmount.toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-emerald-400">إجمالي المدفوع:</span>
                    <span className="font-black text-sm text-emerald-400">{currentTotalPaid.toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-ligth/20 pt-2">
                    <span className="text-amber-400">المتبقي:</span>
                    <span className="font-black text-sm text-amber-400">{remainingAmount.toLocaleString()} ج.م</span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

      </div>

      {/* ================= SECTION 2: الشريط السفلي (Pagination + Horizontal Scroll) ================= */}
      <div className="border-t border-brown/20 pt-4 space-y-3">
        
        {/* رأس الشريط السفلي + أزرار الصفحات */}
        <div className="flex justify-between items-center text-right">
          <span className="text-xs font-black text-dark">اختر نقلة من القائمة للتفاصيل:</span>
          
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

        {/* المربعات الصغيرة النقر عليها يجلب بيانات النقلة بالـ ID فقط */}
        <div className="flex items-center gap-3 overflow-x-auto max-w-[96vw] lg:max-w-[81vw] pb-3 pt-1 scrollbar-thin">
          {deliveries.map((del) => {
            const isSelected = selectedDelivery?._id === del._id;
            const delPayments = del.Payments || del.payment || [];
            const delTotalPaid = delPayments.reduce((acc, p) => acc + Number(p.amount || p.paidAmount || 0), 0);

            return (
              <div
                key={del._id}
                onClick={() => fetchDeliveryDetails(del._id)} // هنا جلب الـ ID عند النقر
                className={`flex-shrink-0 w-60 p-4 rounded-lg cursor-pointer border transition-all text-right space-y-2 shadow-sm ${
                  isSelected 
                    ? "bg-dark text-ligth border-dark ring-4 ring-brown/30 scale-105" 
                    : "bg-white text-dark border-brown/20 hover:border-brown hover:bg-ligth"
                }`}
              >
                {/* أعلى المربع */}
                <div className="flex justify-between items-center">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${isSelected ? "bg-accent text-dark" : "bg-brown/10 text-brown"}`}>
                    نقلة #{del.delveryNumber || "---"}
                  </span>
                  <span className={`text-[10px] font-bold ${isSelected ? "text-ligth/60" : "text-dark/50"}`}>
                    {del.deliveryDate ? new Date(del.deliveryDate).toLocaleDateString('ar-EG') : '---'}
                  </span>
                </div>

                {/* اسم التاجر */}
                <div className="font-black text-sm truncate">
                  {del.supplier?.name || "تاجر غير معروف"}
                </div>

                {/* المبالغ في المربع */}
                <div className="flex justify-between items-end pt-2 border-t border-brown/10 text-xs">
                
                    <span className={`text-[9px] block ${isSelected ? "text-ligth/60" : "text-dark/50"}`}>الإجمالي</span>
                    <span className="font-black">{(del.totalAmount || 0).toLocaleString()}</span>
                  
                  {/* <div className="text-left">
                    <span className={`text-[9px] block ${isSelected ? "text-emerald-300" : "text-emerald-600"}`}>المدفوع</span>
                    <span className="font-black">{delTotalPaid.toLocaleString()}</span>
                  </div> */}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default DeliveriesList;