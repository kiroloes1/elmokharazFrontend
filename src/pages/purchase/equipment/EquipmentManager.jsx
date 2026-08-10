import React, { useState, useEffect } from "react";
import api from "../../../services/api";
import { showAlert } from "../../../services/alert";
import { showAlertConfirm } from "../../../services/alertConfirm";

const EquipmentManager = () => {
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(false);

  // حالات Modal الإضافة والتعديل
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' أو 'edit'
  const [selectedId, setSelectedId] = useState(null);
  const [itemName, setItemName] = useState("");

  // 1. جلب البيانات
  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const response = await api.get("/equipmnetpart");
      if (response.data.success) {
        setEquipmentList(response.data.data);
      }
    } catch (err) {
      showAlert({
        title: "حدث خطأ أثناء جلب البيانات",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  // فتح Modal للإضافة
  const openCreateModal = () => {
    setModalMode("create");
    setItemName("");
    setSelectedId(null);
    setIsModalOpen(true);
  };

  // فتح Modal للتعديل
  const openEditModal = (item) => {
    setModalMode("edit");
    setItemName(item.itemName);
    setSelectedId(item._id);
    setIsModalOpen(true);
  };

  // إغلاق الـ Modal
  const closeModal = () => {
    setIsModalOpen(false);
    setItemName("");
    setSelectedId(null);
  };

  // حفظ البيانات (سواء إضافة أو تعديل)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!itemName.trim()) {
      showAlert({
        title: "يرجى كتابة اسم المعدة",
        icon: "warning",
      });
      return;
    }

    try {
      if (modalMode === "create") {
        const response = await api.post("/equipmnetpart", { itemName });
        if (response.data.success) {
          showAlert({
            title: response.data.message || "تمت الإضافة بنجاح",
            icon: "success",
          });
        }
      } else {
        const response = await api.put(`/equipmnetpart/${selectedId}`, {
          itemName,
        });
        if (response.data.success) {
          showAlert({
            title: response.data.message || "تم التعديل بنجاح",
            icon: "success",
          });
        }
      }

      closeModal();
      fetchEquipment();
    } catch (err) {
      showAlert({
        title: err.response?.data?.message || "حدث خطأ أثناء الحفظ",
        icon: "error",
      });
    }
  };

  // 4. حذف معدة
  const handleDelete = async (id) => {
    const result = await showAlertConfirm({
      title: "هل أنت تأكد من الحذف؟",
      text: "لن تتمكن من استعادة هذه البيانات بعد الحذف!",
      icon: "warning",
      confirmButtonText: "نعم، احذف",
      cancelButtonText: "إلغاء",
    });

    if (result.isConfirmed) {
      try {
        const response = await api.delete(`/equipmnetpart/${id}`);
        if (response.data.success) {
          showAlert({
            title: response.data.message || "تم الحذف بنجاح",
            icon: "success",
          });
          fetchEquipment();
        }
      } catch (err) {
        showAlert({
          title: err.response?.data?.message || "فشل في الحذف",
          icon: "error",
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-ligth text-dark p-4 md:p-8 font-sans" dir="rtl">
      <div className=" mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-lg shadow-sm border border-brown/10">
          <div>
            <h1 className="text-2xl font-bold text-dark">إدارة المعدات</h1>
            <p className="text-dark/60 text-sm mt-1">عرض، إضافة وتعديل قطعة المعدات في النظام</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-dark text-white rounded-lg font-medium hover:bg-brown transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            إضافة معدة جديدة
          </button>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-lg shadow-sm border border-brown/10 overflow-hidden">
          
          {/* Table Header Bar */}
          <div className="p-5 bg-dark/5 border-b border-brown/10 flex justify-between items-center">
            <span className="font-bold text-dark">جدول المعدات المسجلة</span>
            <span className="text-xs font-semibold bg-accent/20 text-dark px-3 py-1.5 rounded-full border border-accent/40">
              الإجمالي: {equipmentList.length}
            </span>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-brown font-medium flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-4 border-brown border-t-transparent rounded-full animate-spin"></div>
                <span>جاري تحميل البيانات...</span>
              </div>
            ) : equipmentList.length === 0 ? (
              <div className="p-12 text-center text-dark/50">
                لا توجد معدات مضافة حالياً.
              </div>
            ) : (
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-ligth/80 border-b border-brown/10 text-dark/70 text-sm">
                    <th className="p-4 font-semibold w-16 text-center">#</th>
                    <th className="p-4 font-semibold">اسم المعدة</th>
                    <th className="p-4 font-semibold text-center w-48">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brown/10 text-sm">
                  {equipmentList.map((item, index) => (
                    <tr
                      key={item._id}
                      className="hover:bg-ligth/40 transition-colors duration-150 group"
                    >
                      <td className="p-4 text-center font-medium text-dark/60">
                        {index + 1}
                      </td>
                      <td className="p-4 font-semibold text-dark">
                        {item.itemName}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-2 text-brown hover:bg-brown/10 rounded-lg transition-colors"
                            title="تعديل"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="حذف"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      {/* Pop-up Modal (Create & Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl border border-brown/10 w-full max-w-md overflow-hidden transform transition-all">
            
            {/* Modal Header */}
            <div className="p-5 bg-dark text-white flex justify-between items-center">
              <h3 className="font-bold text-lg">
                {modalMode === "create" ? "إضافة معدة جديدة" : "تعديل المعدة"}
              </h3>
              <button
                onClick={closeModal}
                className="text-white/70 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">
                  اسم المعدة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="أدخل اسم المعدة..."
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full p-3 border border-brown/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-ligth text-dark transition-all"
                  autoFocus
                />
              </div>

              {/* Modal Footer Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-brown/10">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 border border-brown/30 text-dark rounded-lg font-medium hover:bg-ligth transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-dark text-white rounded-lg font-medium hover:bg-brown transition-colors shadow-sm"
                >
                  {modalMode === "create" ? "إضافة" : "حفظ التغيرات"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentManager;