import React, { useEffect, useState } from "react";
import { 
  Package, Search, Plus, Edit2, 
  Trash2, Loader2, X, 
  CirclePoundSterling,
  RefreshCw
} from "lucide-react";
import api from "../../services/api";
import { showAlert } from "../../services/alert";
import { showAlertConfirm } from "../../services/alertConfirm";

const ManageItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // حالات الـ Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: "", pricePerWeight: "" });
  const [btnLoading, setBtnLoading] = useState(false);

  const fetchItems = async () => {
    try {
      const res = await api.get("/item");
      setItems(res.data.categories || []);
    } catch (err) {
      showAlert({ title: "فشل تحميل الأصناف", icon: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({ name: item.name, pricePerWeight: item.pricePerWeight || "" });
    } else {
      setEditingItem(null);
      setFormData({ name: "", pricePerWeight: "" });
    }
    setIsModalOpen(true);
  };

  // حفظ البيانات (إضافة أو تحديث)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setBtnLoading(true);
    try {
      if (editingItem) {
        await api.put(`/item/${editingItem._id}`, formData);
        showAlert({ title: "تم التحديث بنجاح", icon: "success" });
      } else {
        await api.post("/item", formData);
        showAlert({ title: "تم إضافة الصنف", icon: "success" });
      }
      setIsModalOpen(false);
      fetchItems();
    } catch (err) {
      showAlert({ 
        title: "فشل الإجراء", 
        text: err.response?.data?.message || "حدث خطأ ما", 
        icon: "error" 
      });
    } finally {
      setBtnLoading(false);
    }
  };

  // حذف صنف
  const handleDelete = async (id, name) => {
    const confirm = await showAlertConfirm({
      title: `حذف صنف ${name}؟`,
      text: "تنبيه: قد يؤثر هذا على الناقلات المرتبطة بهذا الصنف.",
      icon: "warning"
    });

    if (confirm.isConfirmed) {
      try {
        await api.delete(`/item/${id}`);
        setItems(items.filter(i => i._id !== id));
        showAlert({ title: "تم الحذف بنجاح", icon: "success" });
      } catch (err) {
        showAlert({ title: "فشل الحذف", icon: "error" });
      }
    }
  };

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-6 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-brwonLight shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-dark flex items-center gap-2">
            <Package className="text-dark" /> إدارة أصناف النقل
          </h2>
          <p className="text-brown text-sm mt-1">تعريف أنواع البضائع التي يتعامل معها المصنع</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-brown/50" size={18} />
            <input
              type="text"
              placeholder="بحث عن صنف..."
              className="w-full pr-10 pl-4 py-2.5 bg-ligth/40 border border-brown/20 rounded-xl focus:border-brown focus:ring-1 focus:ring-brown outline-none transition-all text-sm font-bold text-dark"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => openModal()}
            className="bg-brown hover:bg-brown/90 text-white px-5 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 transition-all shadow"
          >
            <Plus size={18} /> إضافة صنف
          </button>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-2xl border border-brwonLight shadow-sm overflow-hidden min-h-[100px]">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="animate-spin text-dark w-10 h-10" />
            <p className="text-dark font-semibold text-sm">جاري تحميل الأصناف...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-ligth border-b border-brwonLight">
                  <th className="p-5 text-xs font-black text-dark uppercase tracking-widest">اسم الصنف</th>
                  <th className="p-5 text-xs font-black text-dark uppercase tracking-widest text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brwonLight">
                {filteredItems.map((item) => (
                  <tr key={item._id} className="hover:bg-ligth/30 transition-colors">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-ligth rounded-xl flex items-center justify-center text-dark font-black border border-brown/10">
                          {item.name[0]}
                        </div>
                        <span className="font-black text-dark text-sm">{item.name}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => openModal(item)}
                          className="p-2 bg-ligth text-brown hover:bg-brown hover:text-white rounded-xl transition-all border border-brown/10"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item._id, item.name)}
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all border border-red-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan="2" className="text-center p-10 text-brown font-medium text-sm">
                      لا توجد أصناف مطابقة للبحث.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal - الإضافة والتعديل */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 animate-in fade-in zoom-in duration-200 border border-brwonLight">
            <div className="flex justify-between items-center mb-6 border-b border-brwonLight pb-3">
              <h3 className="text-xl font-black text-dark">
                {editingItem ? "تعديل صنف" : "إضافة صنف جديد"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-brown hover:text-dark p-1 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-black text-dark mr-1 uppercase">اسم الصنف</label>
                <div className="relative">
                  <Package className="absolute right-3 top-1/2 -translate-y-1/2 text-brown/40" size={18} />
                  <input
                    type="text"
                    required
                    className="w-full pr-10 pl-4 py-3 bg-ligth/40 border border-brown/20 rounded-xl focus:border-brown focus:ring-1 focus:ring-brown outline-none font-bold text-sm text-dark"
                    placeholder="مثلاً: عجين"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={btnLoading}
                className="w-full py-3.5 bg-brown text-white rounded-xl font-black shadow hover:bg-brown/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm mt-2"
              >
                {btnLoading ? <Loader2 className="animate-spin" size={20} /> : "حفظ البيانات"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageItems;