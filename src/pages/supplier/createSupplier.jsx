import React, { useState } from "react";
import { UserPlus, Phone, DollarSign, FileText, Save } from "lucide-react";
import api from "../../services/api";
import { showAlert } from "../../services/alert";
import { useNavigate } from "react-router-dom";

const AddSupplierFormSUP = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    openBalance: 0,
    notes: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "openBalance" ? Number(value) : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // التحقق من البيانات (Validation)
    if (!formData.name || formData.name.trim().length < 2) {
      return showAlert({ title: "برجاء إدخال اسم التاجر بشكل صحيح (حرفين على الأقل)", icon: "warning" });
    }
    if (!formData.phone || formData.phone.trim().length === 0) {
      return showAlert({ title: "رقم الهاتف مطلوب لتسجيل التاجر", icon: "warning" });
    }

    setLoading(true);
    try {
      const response = await api.post("/suppliers", formData);
      
      setFormData({
        name: "",
        phone: "",
        openBalance: 0,
        notes: "",
      });
      
      showAlert({ title: response.data.message || "تم إضافة التاجر بنجاح", icon: "success" });
   
    } catch (err) {
      showAlert({ 
        title: err.response?.data?.message || "حدث خطأ أثناء إضافة التاجر", 
        icon: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mx-auto p-4 lg:p-8  bg-ligth/10" dir="rtl">
      <div className=" mx-auto bg-white rounded-2xl border border-brwonLight shadow-sm overflow-hidden">
        
        {/* الهيدر الخاص بالفورم */}
        <div className="bg-ligth p-5 border-b border-brwonLight flex items-center gap-3">
          <div className="p-2.5 bg-brown rounded-md text-white">
            <UserPlus size={22} />
          </div>
          <div>
            <h3 className="text-lg font-black text-dark">تسجيل تاجر </h3>
            <p className="text-xs font-bold text-brown/80 mt-0.5">إضافة بيانات التاجر الجديدة وربط رصيده الافتتاحي بالمنظومة الماليّة</p>
          </div>
        </div>

        {/* جسم الفورم - تم تحويله إلى عنصر form لتفعيل الـ validation تلقائياً */}
        <form onSubmit={handleSubmit} className="p-6 gap-5 text-right grid  md:grid-cols-2">
          
          {/* حقل اسم التاجر */}
          
          <div className="space-y-1.5">
            <label className="text-sm font-black text-dark block">اسم التاجر <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute right-3 top-3 text-brown/50 text-xs font-bold">الاسم:</span>
              <input
                type="text"
                name="name"
                required
                placeholder="أدخل اسم التاجر الثنائي أو الثلاثي..."
                className="w-full p-3 pr-14 bg-ligth/20 border border-brown/10 rounded-md outline-none font-bold text-dark focus:border-brown focus:ring-1 focus:ring-brown text-sm"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* حقل رقم الهاتف */}
          <div className="space-y-1.5">
            <label className="text-sm font-black text-dark block">رقم الهاتف <span className="text-red-500">*</span></label>
            <div className="relative">
              <Phone className="absolute right-3 top-3.5 text-brown/50" size={18} />
              <input
                type="text"
                name="phone"
                maxLength={11}
                required
                placeholder="رقم الهاتف للتواصل المباشر..."
                className="w-full p-3 pr-10 bg-ligth/20 border border-brown/10 rounded-md outline-none font-bold text-dark focus:border-brown focus:ring-1 focus:ring-brown text-sm text-left"
                dir="ltr"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* حقل الرصيد الافتتاحي */}
          <div className="space-y-1.5">
            <label className="text-sm font-black text-dark block">المديونية السابقة</label>
            <div className="relative">
              <DollarSign className="absolute right-3 top-3.5 text-brown/50" size={18} />
              <input
                type="number"
                name="openBalance"
                placeholder="0"
                className="w-full p-3 pr-10 bg-ligth/20 border border-brown/10 rounded-md outline-none font-black text-brown focus:border-brown focus:ring-1 focus:ring-brown text-sm"
                value={formData.openBalance === 0 ? "" : formData.openBalance}
                onChange={handleChange}
              />
            </div>
            <p className="text-[11px] text-brown/70 font-bold">
              * ملحوظة: اكتب المبلغ بالسالب إذا كان التاجر "مدين للمصنع"، أو بالموجب إذا كان "له مستحقات لدينا".
            </p>
          </div>

          {/* حقل ملاحظات التاجر */}
          <div className="space-y-1.5">
            <label className="text-sm font-black text-dark block">ملاحظات عن التاجر</label>
            <div className="relative">
              <FileText className="absolute right-3 top-3.5 text-brown/50" size={18} />
              <textarea
                name="notes"
                placeholder="أي ملاحظات إضافية تخص التاجر (العنوان، شروط خاصة، إلخ)..."
                rows="3"
                className="w-full p-3 pr-10 bg-ligth/20 border border-brown/10 rounded-md outline-none font-bold text-dark focus:border-brown focus:ring-1 focus:ring-brown text-sm"
                value={formData.notes}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* زر الحفظ والتأكيد */}
          <div className="pt-4 border-t border-ligth">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brown hover:bg-brown/90 text-white p-3.5 rounded-md font-black text-base flex items-center justify-center gap-2 shadow-md disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                "جاري حفظ بيانات التاجر الجديد..."
              ) : (
                <>
                  <Save size={20} />
                  حفظ وتأكيد تسجيل التاجر بالمنظومة
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddSupplierFormSUP;