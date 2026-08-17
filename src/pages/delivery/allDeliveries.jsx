import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Truck, Calendar, Edit3, Loader2, Package, Printer, Trash,
  ChevronRight, ChevronLeft, Search, User, Scale, Layers,
  CreditCard, DollarSign
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
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination States
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    const updateLimit = () => {
      const width = window.innerWidth;
      
      if (width < 640) {
        setLimit(2); 
      } else if (width < 1024) {
        setLimit(4); 
      } else if (width < 1536) {
        setLimit(6);
      } else {
        setLimit(8); 
      }
    };

    // التشغيل عند التجميع لأول مرة
    updateLimit();

    // الاستماع لإعادة تغيير حجم الشاشة (Resize Event)
    window.addEventListener("resize", updateLimit);
    return () => window.removeEventListener("resize", updateLimit);
  }, []);

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

  // شارات وسائل الدفع (من الكود القديم)
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
        return { label: method || "نقدي", bg: "bg-ligth text-dark border-brown/20" };
    }
  };

  // تصفية النقلات حسب البحث
  const filteredDeliveries = deliveries.filter(del => {
    const q = searchQuery.toLowerCase();
    const deliveryNum = del.delveryNumber ? String(del.delveryNumber) : "";
    const supplierName = del.supplier?.name ? del.supplier.name.toLowerCase() : "";
    return deliveryNum.includes(q) || supplierName.includes(q);
  });

  if (loading && page === 1) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-ligth  space-y-3">
        <Loader2 className="animate-spin text-brown" size={48} />
        <span className="text-dark/70 font-bold">جاري تحميل سجل النقلات...</span>
      </div>
    );
  }

  // حساب الحسابات المالية للنقلة المعروضة
  const currentPayments = selectedDelivery?.Payments || selectedDelivery?.payment || [];
  const currentTotalPaid = currentPayments.reduce((acc, p) => acc + Number(p.amount || p.paidAmount || 0), 0);
  const totalAmount = selectedDelivery?.totalAmount || 0;
  const remainingAmount = totalAmount - currentTotalPaid;

  // إجماليات الجدول (أوزان)
  const getGross = (item) => Number(
    item.grossWeight ||
    item.totalWeight ||
    item.batches?.reduce((acc, curr) => acc + (Number(curr.weight || 0) * Number(curr.quantity || 1)), 0) ||
    0
  );
  const totalGross = selectedDelivery?.items?.reduce((acc, item) => acc + getGross(item), 0) || 0;
  const totalReturn = selectedDelivery?.items?.reduce((acc, item) => acc + Number(item.returnWeight || 0), 0) || 0;
  const totalOldReturn = selectedDelivery?.items?.reduce((acc, item) => acc + Number(item.oldReturnWeight || 0), 0) || 0;
  const totalNet = selectedDelivery?.items?.reduce((acc, item) => {
    const gross = getGross(item);
    const ret = Number(item.returnWeight || 0);
    const oldRet = Number(item.oldReturnWeight || 0);
    return acc + Math.max(0, gross - ret - oldRet);
  }, 0) || 0;

return (
    <div className="w-96 px-1 md:w-full min-h-screen bg-ligth text-dark flex flex-col overflow-x-hidden" dir="rtl">

      {/* ================= 1. NAVBAR العلوي ================= */}
      <header className="w-86 md:w-full bg-white border-b border-brown/20 px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2">
            <Truck className="text-brown" size={24} />
            <h1 className="text-lg sm:text-xl font-black text-dark tracking-tight">سجل النقلات</h1>
          </div>
        </div>

        {/* شريط البحث */}
        <div className="relative w-full sm:w-72 md:w-96">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برقم النقلة أو اسم التاجر..."
            className="w-full bg-ligth/70 border border-brown/20 focus:border-brown rounded-xl py-2 pr-10 pl-4 text-xs font-bold text-dark focus:outline-none transition-all"
          />
          <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark/40" />
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 p-3 sm:p-5 lg:p-6 space-y-5 lg:space-y-6 max-w-[1600px] w-full mx-auto">

{/* ================= 2. الكروت العلوية الأفقية (اختر النقلة) ================= */}
<div className="bg-white p-3.5 sm:p-4 w-96 md:w-full rounded-2xl border border-brown/20 shadow-sm space-y-3">
  <div className="flex justify-between items-center text-xs">
    <span className="font-black text-dark flex items-center gap-1.5">
      <Truck size={16} className="text-brown" /> سجل النقلات
    </span>
    <div className="flex items-center gap-2">
      <button
        onClick={() => setPage((p) => Math.max(p - 1, 1))}
        disabled={page === 1 || loading}
        className="p-1 rounded-lg bg-ligth hover:bg-brown/10 disabled:opacity-30 transition-all text-dark"
      >
        <ChevronRight size={16} />
      </button>
      <span className="font-black text-brown text-[11px]">
        {page} / {totalPages}
      </span>
      <button
        onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
        disabled={page === totalPages || loading}
        className="p-1 rounded-lg bg-ligth hover:bg-brown/10 disabled:opacity-30 transition-all text-dark"
      >
        <ChevronLeft size={16} />
      </button>
    </div>
  </div>

  {/* شريط السحب الأفقي الممتاز */}
  <div className="flex items-center gap-3 overflow-x-auto py-1.5 touch-pan-x overscroll-x-contain select-none [ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    {filteredDeliveries.length === 0 ? (
      <div className="text-center w-full py-4 text-xs font-bold text-dark/50">لا توجد نقلات مطابقة للبحث</div>
    ) : (
      filteredDeliveries.map((del) => {
        const isSelected = selectedDelivery?._id === del._id;
        return (
          <div
            key={del._id}
            onClick={() => fetchDeliveryDetails(del._id)}
            className={`shrink-0 w-[210px] sm:w-[240px] p-3 rounded-xl cursor-pointer border transition-all text-right space-y-2 active:scale-95 ${
              isSelected
                ? "bg-brown text-ligth border-brown shadow-md scale-[1.01]"
                : "bg-ligth/50 hover:bg-white text-dark border-brown/15 hover:border-brown/40"
            }`}
          >
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className={`px-2 py-0.5 rounded ${isSelected ? "bg-accent text-dark font-black" : "bg-brown/10 text-brown"}`}>
                #{del.delveryNumber || "---"}
              </span>
              <span className={isSelected ? "text-ligth/80" : "text-dark/50"}>
                {del.deliveryDate ? new Date(del.deliveryDate).toLocaleDateString('ar-EG') : '---'}
              </span>
            </div>
            <div className="font-black text-xs truncate">
              {del.supplier?.name || "تاجر غير محدد"}
            </div>
            <div className="text-left font-black text-xs">
              {(del.totalAmount || 0).toLocaleString()} <span className="text-[10px] font-normal">ج.م</span>
            </div>
          </div>
        );
      })
    )}
  </div>
</div>

        {/* ================= 3. تفاصيل النقلة المحددة ================= */}
        {detailsLoading ? (
          <div className="h-72 sm:h-96 flex flex-col items-center justify-center space-y-3 bg-white rounded-2xl border border-brown/20 shadow-sm">
            <Loader2 className="animate-spin text-brown" size={40} />
            <span className="text-xs sm:text-sm font-bold text-dark/70">جاري عرض بيانات النقلة...</span>
          </div>
        ) : selectedDelivery ? (
          <div className="space-y-5 lg:space-y-6">

            {/* الهيدر الأوسط للنقلة والأزرار */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-brown/20 shadow-sm">
              <div className="space-y-1 w-full md:w-auto">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-black rounded-md border border-amber-200">
                    معاينة الفاتورة الكاملة
                  </span>
                  <span className="text-xs text-dark/50 font-bold">ID: {selectedDelivery._id?.slice(-6)}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-dark flex items-center gap-2">
                  نقلة رقم {selectedDelivery.delveryNumber || "---"}
                </h2>
                <p className="text-xs font-bold text-dark/60 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1"><User size={14} className="text-brown" /> التاجر: <strong className="text-dark font-black">{selectedDelivery.supplier?.name || "غير محدد"}</strong></span>
                  <span className="hidden sm:inline">•</span>
                  <span className="flex items-center gap-1"><Calendar size={14} className="text-brown" /> {selectedDelivery.deliveryDate ? new Date(selectedDelivery.deliveryDate).toLocaleDateString('ar-EG') : "---"}</span>
                  {selectedDelivery.receivedBy?.username && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <span>المستلم: <strong className="text-dark font-black">{selectedDelivery.receivedBy.username}</strong></span>
                    </>
                  )}
                </p>
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex items-center gap-2 w-86 md:w-full md:w-auto justify-end flex-wrap ">
                <button
                  onClick={() => handleToDelete(selectedDelivery._id)}
                  className="p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors"
                  title="حذف"
                >
                  <Trash size={18} />
                </button>
                <button
                  onClick={() => navigate(`/deliveries/edit/${selectedDelivery._id}`)}
                  className="flex-1 md:flex-initial justify-center px-4 py-2.5 bg-dark text-ligth hover:bg-dark/90 rounded-xl font-black text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 size={16} /> تعديل
                </button>
                <button
                  onClick={() => navigate(`/deliveries/print/${selectedDelivery._id}`)}
                  className="flex-1 md:flex-initial justify-center px-4 py-2.5 bg-ligth hover:bg-brown/10 text-dark border border-brown/20 rounded-xl font-black text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Printer size={16} /> طباعة
                </button>
              </div>
            </div>

            {/* كروت الإحصائيات المالية */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-2">
              <div className="bg-[#1b494d] text-white p-4 sm:p-5 rounded-2xl shadow-sm relative overflow-auto w-full   flex flex-col justify-between h-28 sm:h-32">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold opacity-80">إجمالي النقلة</span>
                  <CreditCard size={18} className="opacity-60" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-left">
                  {totalAmount.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
                </div>
              </div>

              <div className="bg-[#d97706] text-white p-4 sm:p-5 rounded-2xl shadow-sm relative overflow-auto w-full flex flex-col justify-between h-28 sm:h-32">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold opacity-80">المدفوع</span>
                  <Scale size={18} className="opacity-60" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-left">
                  {currentTotalPaid.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
                </div>
              </div>

              <div className="bg-[#1b3d4d] text-white p-4 sm:p-5 rounded-2xl shadow-sm relative overflow-auto w-full  flex flex-col justify-between h-28 sm:h-32">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold opacity-80">المتبقي</span>
                  <DollarSign size={18} className="opacity-60" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-left">
                  {remainingAmount.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-brown/20 shadow-sm relative overflow-auto w-full flex flex-col justify-between h-28 sm:h-32">
                <div className="flex justify-between items-start text-dark">
                  <span className="text-xs font-bold text-dark/60">عدد الأصناف</span>
                  <Layers size={18} className="text-brown" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-dark text-left">
                  {selectedDelivery.items?.length || 0} <span className="text-xs font-normal text-dark/60">صنف</span>
                </div>
              </div>
            </div>

{/* ================= 4. جدول الأصناف والتفاصيل ================= */}
<div className="bg-white rounded-2xl border border-brown/20 shadow-sm overflow-auto overflow-x-auto w-96 md:w-full">
  <div className="p-4 bg-ligth/40 border-b border-brown/10 flex justify-between items-center">
    <h3 className="font-black text-dark text-xs sm:text-sm flex items-center gap-2">
      <Package size={18} className="text-brown" /> تفاصيل الشحنة والأصناف
    </h3>
    <span className="text-[11px] sm:text-xs font-bold text-brown bg-brown/10 px-2.5 py-1 rounded-full">
      عدد الأصناف: {selectedDelivery.items?.length || 0}
    </span>
  </div>

  <div className="overflow-x-auto w-full touch-pan-x overscroll-x-contain">
    <table className="w-full text-right border-collapse text-xs min-w-[480px]">
      <thead>
        <tr className="border-b border-brown/10 text-dark/50 bg-ligth/20">
          <th className="p-3 font-bold whitespace-nowrap">الصنف</th>
          <th className="p-3 font-bold text-center whitespace-nowrap">سعر الكيلو</th>
          <th className="p-3 font-bold text-center whitespace-nowrap">الوزن</th>
          <th className="p-3 font-bold text-left whitespace-nowrap">الإجمالي</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-brown/10 font-bold">
        {selectedDelivery.items?.map((item, idx) => {
          const grossWeight = getGross(item);
          const returnW = Number(item.returnWeight || 0);
          const oldReturnW = Number(item.oldReturnWeight || 0);
          const price = Number(item.pricePerKg || 0);

          const netWeight = Math.max(0, grossWeight - returnW - oldReturnW);
          const itemTotalPrice = item.totalPrice ?? (netWeight * price);

          return (
            <tr key={idx} className="hover:bg-ligth/30 transition-colors">
              <td className="p-3 font-black text-dark whitespace-nowrap">{item.item?.name || "صنف بدون اسم"}</td>
              <td className="p-3 text-center text-dark/80 whitespace-nowrap">{price.toLocaleString()} ج.م</td>
              <td className="p-3 text-center text-dark/80 whitespace-nowrap">{grossWeight.toLocaleString()} كجم</td>
              <td className="p-3 text-left font-black text-dark whitespace-nowrap">{itemTotalPrice.toLocaleString()} ج.م</td>
            </tr>
          );
        })}
      </tbody>
      <tfoot className="border-t-2 border-brown/20 bg-ligth/50 font-black text-dark">
        <tr>
          <td className="p-3 whitespace-nowrap">الإجمالي الكلي</td>
          <td className="p-3 text-center text-dark/40 whitespace-nowrap">—</td>
          <td className="p-3 text-center whitespace-nowrap">{totalGross.toLocaleString()} كجم</td>
          <td className="p-3 text-left text-xs sm:text-sm bg-brown/10 whitespace-nowrap">{totalAmount.toLocaleString()} ج.م</td>
        </tr>
      </tfoot>
    </table>
  </div>
</div>

            {/* ================= 5 & 6. قسم الملاحظات والدفعات (توزيع عمودي/أفقي متجاوب) ================= */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              
              {/* 5. تفاصيل إضافية */}
              <div className="bg-[#1b3d4d] text-white p-5 sm:p-6 rounded-2xl shadow-sm space-y-3 text-xs flex flex-col justify-between">
                <div>
                  <h4 className="font-black text-amber-400 border-b border-white/10 pb-2 flex items-center gap-2">
                    • تفاصيل إضافية
                  </h4>
                  <div className="space-y-2 font-bold mt-3">
                    <div className="flex justify-between items-center py-1 border-b border-white/5">
                      <span className="opacity-70">رصيد التاجر قبل النقلة:</span>
                      <span>0 ج.م</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-white/5">
                      <span className="opacity-70">الصافي من النقلة:</span>
                      <span className="font-black text-emerald-400">{totalAmount.toLocaleString()} ج.م</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="opacity-70">رصيد التاجر بعد النقلة:</span>
                      <span className="font-black">{totalAmount.toLocaleString()} ج.م</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 mt-3">
                  <span className="opacity-70 block mb-1">ملاحظات:</span>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10 opacity-90 break-words">
                    {selectedDelivery.notes || "لا يوجد ملاحظات مسجلة لهذه النقلة."}
                  </div>
                </div>
              </div>

              {/* 6. تحليل الدفعات الصادرة */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-brown/20 shadow-sm space-y-4 text-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center border-b border-brown/10 pb-3">
                    <h4 className="font-black text-dark flex items-center gap-2">
                      <CreditCard size={16} className="text-brown" /> تحليل الدفعات الصادرة
                    </h4>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      {currentPayments.length} عملية دفع
                    </span>
                  </div>

                  {currentPayments.length === 0 ? (
                    <div className="bg-ligth/40 p-4 my-3 rounded-xl text-center text-dark/50 font-bold">
                      لا توجد دفعات مسجلة لهذه النقلة
                    </div>
                  ) : (
                    <div className="space-y-2 mt-3 max-h-60 overflow-y-auto pr-1">
                      {currentPayments.map((p, idx) => {
                        const badge = getPaymentBadge(p.paymentMethod);
                        return (
                          <div key={idx} className="p-3 bg-ligth/40 rounded-xl border border-brown/10 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className={`px-2 py-0.5 rounded-lg font-black border ${badge.bg}`}>
                                {badge.label}
                              </span>
                              <span className="font-black text-dark text-xs sm:text-sm">
                                {(p.amount || p.paidAmount || 0).toLocaleString()} ج.م
                              </span>
                            </div>

                            {p.bankInfo?.bankName && (
                              <div className="text-[11px] text-dark/70 space-y-0.5 pt-1 border-t border-brown/10">
                                <p><span className="text-dark/40">البنك:</span> {p.bankInfo.bankName}</p>
                                <p><span className="text-dark/40">رقم المعاملة:</span> {p.bankInfo.transactionReference}</p>
                              </div>
                            )}
                            {p.walletInfo && (
                              <div className="text-[11px] text-dark/70 space-y-0.5 pt-1 border-t border-brown/10">
                                <p><span className="text-dark/40">المستلم:</span> {p.walletInfo.receiverPhone}</p>
                                <p><span className="text-dark/40">المرسل:</span> {p.walletInfo.senderPhone}</p>
                              </div>
                            )}
                            {p.cheque?.chequeNumber && (
                              <div className="text-[11px] text-dark/70 space-y-0.5 pt-1 border-t border-brown/10">
                                <p><span className="text-dark/40">رقم الشيك:</span> {p.cheque.chequeNumber}</p>
                                <p>
                                  <span className="text-dark/40">الاستحقاق:</span>{" "}
                                  {p.cheque.dueDate ? new Date(p.cheque.dueDate).toLocaleDateString("ar-EG") : "---"}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-3 font-black text-xs text-dark border-t border-brown/10">
                  <span>إجمالي ما تم دفعه:</span>
                  <span className="text-amber-700 text-sm">{currentTotalPaid.toLocaleString()} ج.م</span>
                </div>
              </div>

            </div>

          </div>
        ) : null}

      </main>
    </div>
  );
};


export default DeliveriesList;
