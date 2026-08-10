import React, { useEffect, useState } from "react";
import api from "./api";

export default function DeleteBrokenDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBrokenDeliveries();
  }, []);

  const getBrokenDeliveries = async () => {
    try {
      const { data } = await api.get("/delivery/getAllDeliveriesless");
      setDeliveries(data.deliveryless || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteDelivery = async (id) => {
    if (!window.confirm("هل تريد حذف هذه العملية نهائياً؟")) return;

    try {
      await api.delete(`/delivery/less/${id}`);
      setDeliveries((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء الحذف");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto text-right" dir="rtl">
      {/* Header section with Glassmorphism touch */}
      <div className="backdrop-blur-md bg-white/60 shadow-sm border border-gray-100 rounded-2xl p-6 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
            النقليات المعلقة المكسورة
          </h2>
          <p className="text-sm text-gray-500 mt-1">إدارة ومراجعة النقليات المفقود بيانات تاجرها أو تحتاج لتعديل.</p>
        </div>
        <span className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-semibold border border-indigo-100">
          العدد الإجمالي: {deliveries.length}
        </span>
      </div>

      {deliveries.length === 0 ? (
        <div className="backdrop-blur-md bg-white/40 border border-dashed border-gray-200 rounded-2xl p-12 text-center text-gray-500">
          لا توجد بيانات نقليات مكسورة حالياً.
        </div>
      ) : (
        /* Table container */
        <div className="overflow-x-auto border border-gray-100 rounded-2xl shadow-sm bg-white/80 backdrop-blur-md">
          <table className="w-full text-sm text-right text-gray-600 border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-700 font-semibold">
                <th className="p-4">رقم النقلية</th>
                <th className="p-4">التاجر / التاجر</th>
                <th className="p-4">التاريخ</th>
                <th className="p-4">إجمالي المبلغ</th>
                <th className="p-4">المدفوع</th>
                <th className="p-4">المتبقي</th>
                <th className="p-4">ملاحظات</th>
                <th className="p-4 text-center">إجراءات</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {deliveries.map((item) => {
                // التحقق من وجود اسم التاجر سواء كان كـ Object أو نص مباشر
                const supplierName = item.supplier?.name || item.supplier || "بدون تاجر ";
                const isBrokenSupplier = !item.supplier;

                return (
                  <tr 
                    key={item._id} 
                    className="hover:bg-gray-50/50 transition-colors duration-200"
                  >
                    <td className="p-4 font-medium text-gray-900">
                      #{item.delveryNumber || "غير محدد"}
                    </td>
                    
                    {/* عمود التاجر مع تمييز لوني لو مفيش تاجر */}
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        isBrokenSupplier 
                          ? "bg-amber-50 text-amber-700 border border-amber-100" 
                          : "bg-blue-50 text-blue-700 border border-blue-100"
                      }`}>
                        {supplierName}
                      </span>
                    </td>

                    <td className="p-4 text-gray-500">
                      {item.deliveryDate 
                        ? new Date(item.deliveryDate).toLocaleDateString("ar-EG", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="p-4 font-semibold text-gray-800">
                      {item.totalAmount?.toLocaleString() || 0} ج.م
                    </td>
                    <td className="p-4 text-green-600 font-medium">
                      {item.paidAmount?.toLocaleString() || 0} ج.م
                    </td>
                    <td className="p-4 text-red-500 font-medium">
                      {item.remainingAmount?.toLocaleString() || 0} ج.م
                    </td>
                    <td className="p-4 max-w-xs truncate text-gray-400 text-xs" title={item.notes}>
                      {item.notes || "—"}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => deleteDelivery(item._id)}
                        className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-4 py-1.5 rounded-xl font-medium border border-red-100 transition-all duration-200 active:scale-95"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}