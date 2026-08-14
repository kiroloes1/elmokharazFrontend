import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Save, Wrench, Search, Notebook, CreditCard } from "lucide-react";
import api from "../../../services/api"; 
import { showAlert } from "../../../services/alert";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import BankAutocomplete from "../../../services/allBank";

const EquipmentEditForm = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [supSearch, setSupSearch] = useState("");
  const [showSupList, setShowSupList] = useState(false);
  
  const[remainingOutgoing,setRemainingOutgoing]=useState(0)

  const [balance,setBalance]=useState(0)
  const [walletSearch, setWalletSearch] = useState("");
  const [showWalletList, setShowWalletList] = useState(false);
  const [suggestionWallets, setSuggestionWallets] = useState([]);

    const [equipmentList, setEquipmentList] = useState([]);
  const [equipmentSearch, setEquipmentSearch] = useState("");
  const [showEquipmentList, setShowEquipmentList] = useState(false);
  const [activeEquipmentIdx, setActiveEquipmentIdx] = useState(null);


    const equipmentRef = useRef(null);
  

  const [formData, setFormData] = useState({
    supplier: "",
    purchaseDate: "",
    notes: "",
    note: "",
    payment: [],
    items: []
  });

  const fetchSuggestions = async () => {
    try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/wallet/getSugg`, {
        headers: {
          "x-api-key": import.meta.env.VITE_API_X_API_KEY,
          "Content-Type": "application/json",
        },
      });
      setSuggestionWallets(res.data.wallets);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  // جلب البيانات بناءً على هيكل الـ JSON
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [supRes, invoiceRes] = await Promise.all([
          api.get("/customers/getAllSupplierName"),
          api.get(`/equipmnet/${id}`),
        ]);
        
        const sups = supRes.data.data || [];
        setSuppliers(sups);
        
        const rawData = invoiceRes.data.equipment || invoiceRes.data;
        
        if (rawData) {
          let formattedDate = "";
          if (rawData.purchaseDate) {
            formattedDate = rawData.purchaseDate.split("T")[0];
          }

          // تحويل الأصناف - مطابق لـ req.body.items
          const formattedItems = (rawData.items || []).map(i => ({
            equipmentName: i.equipmentName || "",
            type: i.type || i.category || "",
            quantity: i.quantity || 1,
            unitPrice: i.unitPrice || 0,
            total: i.total || 0,
            notes: i.notes || ""
          }));

          // معالجة مصفوفة الـ Payments - مطابق لـ req.body.payment
          const formattedPayments = (rawData.payments || []).map(p => ({
            paidAmount: p.amount || 0, // مهم: اسم الحقل paidAmount
            paymentMethod: p.paymentMethod || "cash",
            bankInfo: p.bankInfo || { bankName: "", transactionReference: "" },
            walletInfo: {
              linkWallet: p.walletInfo?.linkWallet || false,
              walletId: p.walletInfo?.walletId || "",
              provider: p.walletInfo?.provider || "",
              senderName: p.walletInfo?.senderName || "",
              senderPhone: p.walletInfo?.senderPhone || "",
              receiverName: p.walletInfo?.receiverName || supSearch || "",
              receiverPhone: p.walletInfo?.receiverPhone || "",
              transactionReference: p.walletInfo?.transactionReference || ""
            },
            cheque: p.cheque || { 
              chequeNumber: "", 
              chequeType: "normal", 
              bankName: "", 
              receiveDate: "", 
              dueDate: "", 
              status: "under_collection" 
            }
          }));

          // حماية إضافية
          if (formattedPayments.length === 0) {
            formattedPayments.push({ 
              paidAmount: 0, // مهم: paidAmount
              paymentMethod: "cash",
              bankInfo: { bankName: "", transactionReference: "" },
              walletInfo: { 
                linkWallet: false,
                walletId: "",
                provider: "", 
                senderName: "", 
                senderPhone: "", 
                receiverName: "", 
                receiverPhone: "", 
                transactionReference: "" 
              },
              cheque: { 
                chequeNumber: "", 
                chequeType: "normal", 
                bankName: "", 
                receiveDate: "", 
                dueDate: "", 
                status: "under_collection" 
              }
            });
          }

          setFormData({
            supplier: rawData.supplier?._id || rawData.supplier,
            purchaseDate: formattedDate,
            notes: rawData.notes || "",
            note: rawData.note || "",
            items: formattedItems,
            payment: formattedPayments,
            invoiceNumber: rawData.invoiceNumber || 1
          });

          const currentSupplierName = rawData.supplier?.name || "";
          if (currentSupplierName) {
            setSupSearch(currentSupplierName);
          } else {
            const foundSup = sups.find(s => s._id === rawData.supplier);
            if (foundSup) setSupSearch(foundSup.name);
          }
        }

      } catch (err) {
        console.error("Error fetching data", err);
        showAlert({ title: "خطأ في جلب بيانات الفاتورة", icon: "error" });
      } finally {
        setFetchLoading(false);
      }
    };
    fetchData();
  }, [id]);


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

      useEffect(() => {
    const handleClickOutside = (e) => {
      if (equipmentRef.current && !equipmentRef.current.contains(e.target)) {
        setShowEquipmentList(false);
        setActiveEquipmentIdx(null);
      }
    };
  
    document.addEventListener("mousedown", handleClickOutside);
  
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // حساب إجمالي الأصناف
  const calculateItemTotal = (item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    return quantity * unitPrice;
  };

  // حساب إجمالي الفاتورة
  const calculateGrandTotal = () => {
    return formData.items.reduce((acc, item) => acc + calculateItemTotal(item), 0);
  };

  const grandTotal = calculateGrandTotal();
  const totalPaidAmount = formData.payment.reduce((acc, p) => acc + Number(p.paidAmount || 0), 0);
  const remainingAmount = grandTotal - totalPaidAmount;

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    // إعادة حساب الإجمالي تلقائياً
    if (field === "quantity" || field === "unitPrice") {
      const quantity = Number(newItems[index].quantity) || 0;
      const unitPrice = Number(newItems[index].unitPrice) || 0;
      newItems[index].total = quantity * unitPrice;
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const addPaymentField = () => {
    // if (formData.payment.length >= 7) {
    //   showAlert({ title: "الحد الأقصى لطرق الدفع المدمجة هي 7 طرق", icon: "error" });
    //   return;
    // }
    const allMethods = ["cash", "wallet", "instapay", "bank", "mail", "cheque", "work"];
    const unusedMethod = allMethods.find(method => !formData.payment.some(m => m.paymentMethod === method)) || "cash";

    setFormData({
      ...formData,
      payment: [
        ...formData.payment, 
        { 
          paidAmount: 0, // مهم: paidAmount
          paymentMethod: unusedMethod,
          bankInfo: { bankName: "", transactionReference: "" },
          walletInfo: { 
            linkWallet: true,
            walletId: "",
            provider: "", 
            senderName: "", 
            senderPhone: "", 
            receiverName: supSearch || "", 
            receiverPhone: "", 
            transactionReference: "" 
          },
          cheque: { 
            chequeNumber: "", 
            chequeType: "normal", 
            bankName: "", 
            receiveDate: "", 
            dueDate: "", 
            status: "under_collection" 
          }
        }
      ]
    });
  };

  const removePaymentField = (idx) => {
    if (formData.payment.length > 1) {
      const newPayments = formData.payment.filter((_, i) => i !== idx);
      setFormData({ ...formData, payment: newPayments });
    }
  };

  const handlePaymentChange = (idx, field, value, subField = null) => {
    const newPayments = [...formData.payment];
    
    if (subField) {
      newPayments[idx][field] = newPayments[idx][field] || {};
      newPayments[idx][field][subField] = value;
    } else {
      if (field === "paymentMethod") {
        const isDuplicate = formData.payment.some((m, i) => i !== idx && m.paymentMethod === value);
        // if (isDuplicate) {
        //   showAlert({ title: "لا يمكن تكرار طريقة الدفع في نفس الفاتورة", icon: "error" });
        //   return;
        // }
      }
      // مهم: الحقل اسمه paidAmount في الـ req.body
      newPayments[idx][field] = field === "paidAmount" ? Number(value) : value;
    }

    setFormData({ ...formData, payment: newPayments });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.supplier) return showAlert({ title: "برجاء اختيار تاجر  أولاً", icon: "warning" });
    if (formData.items.some(i => !i.equipmentName)) return showAlert({ title: "تأكد من إدخال أسماء المعدات بشكل صحيح", icon: "warning" });

    // التحقق من صحة المدفوعات
    for (const p of formData.payment) {
      if ((p.paymentMethod === "bank" || p.paymentMethod === "instapay") && (!p.bankInfo?.bankName || !p.bankInfo?.transactionReference)) {
        return showAlert({ title: "برجاء ملء بيانات البنك / إنستا باي المطلوبة بالكامل", icon: "warning" });
      }
      if (p.paymentMethod === "wallet" && (!p.walletInfo?.senderPhone || !p.walletInfo?.receiverPhone)) {
        return showAlert({ title: "برجاء ملء بيانات المحفظة الإلكترونية الأساسية", icon: "warning" });
      }
      if (p.paymentMethod === "cheque" && (!p.cheque?.chequeNumber || !p.cheque?.bankName || !p.cheque?.dueDate)) {
        return showAlert({ title: "برجاء ملء بيانات الشيك الأساسية (الرقم، البنك، الاستحقاق)", icon: "warning" });
      }
    }

    setLoading(true);
    try {
      const selectedDate = new Date(formData.purchaseDate);
      const now = new Date();
      selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
      
      // بناء الـ payload المطابق للـ req.body في الـ Controller
      const payload = {
        supplier: formData.supplier,
        purchaseDate: selectedDate,
        items: formData.items.map(item => ({
          equipmentName: item.equipmentName,
          type: item.type,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          total: Number(item.total) || (Number(item.quantity) * Number(item.unitPrice)),
          notes: item.notes || ""
        })),
        notes: formData.notes || "",
        note: formData.note || "",
        payment: formData.payment.map(p => ({
          paidAmount: Number(p.paidAmount), // مهم: اسم الحقل paidAmount
          paymentMethod: p.paymentMethod,
          bankInfo: p.bankInfo ? {
            bankName: p.bankInfo.bankName || "",
            transactionReference: p.bankInfo.transactionReference || ""
          } : undefined,
          walletInfo: p.walletInfo ? {
            linkWallet: p.walletInfo.linkWallet || true,
            walletId: p.walletInfo.walletId || "",
            provider: p.walletInfo.provider || "",
            senderName: p.walletInfo.senderName || "",
            senderPhone: p.walletInfo.senderPhone || "",
            receiverName: p.walletInfo.receiverName || "",
            receiverPhone: p.walletInfo.receiverPhone || "",
            transactionReference: p.walletInfo.transactionReference || ""
          } : undefined,
          cheque: p.cheque ? {
            chequeNumber: p.cheque.chequeNumber || "",
            chequeType: p.cheque.chequeType || "normal",
            bankName: p.cheque.bankName || "",
            receiveDate: p.cheque.receiveDate || "",
            dueDate: p.cheque.dueDate || "",
            status: p.cheque.status || "under_collection"
          } : undefined
        }))
      };

      await api.put(`/equipmnet/${id}`, payload);
      
      showAlert({ title: "تم تعديل وتحديث الفاتورة بنجاح", icon: "success" });
      navigate("/equipment");
    } catch (err) {
      showAlert({ title: err.response?.data?.message || "خطأ أثناء الحفظ والتعديل", icon: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-light/10">
        <div className="text-dark font-black text-lg">جاري تحميل بيانات الفاتورة والمدفوعات الحالية...</div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto p-4 lg:p-8 bg-light/10" dir="rtl">
      <form onSubmit={handleSubmit} className="space-y-6 h-[100vh] overflow-auto pb-32 pr-2">
        
        {/* قسم التاجر  والتاريخ */}
        <div className="bg-white p-6 rounded-2xl border border-brwonLight shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div className="space-y-2 relative text-right">
            <label className="block font-black text-dark text-sm">التاجر </label>
            <div className="relative">
              <Search className="absolute right-3 top-3.5 text-brown/50" size={18} />
              <input
                type="text"
                disabled={true}
                className="w-full p-3 pr-10 bg-ligth/20 border border-brown/10 rounded-xl outline-none font-bold text-dark focus:border-brown"
                placeholder="ابحث عن اسم التاجر  للربط المالي..."
                value={supSearch}
                onFocus={() => setShowSupList(true)}
                onChange={(e) => setSupSearch(e.target.value)}
              />
            </div>
            {showSupList && supSearch.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-brwonLight rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                {suppliers.filter(s => s.name.includes(supSearch)).map(s => (
                  <div 
                    key={s._id} 
                    className="p-4 hover:bg-ligth/40 cursor-pointer flex justify-between items-center border-b border-ligth last:border-b-0 text-dark transition-all"
                    onClick={() => {
                      setFormData({...formData, supplier: s._id});
                      setSupSearch(s.name);
                      setShowSupList(false);
                    }}
                  >
                    <span className="font-bold">{s.name}</span>
                    <span className="text-brown bg-ligth px-3 py-1 rounded-lg text-xs font-black">
                      {s.balance?.toLocaleString()} EGP
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2 text-right">
            <label className="block font-black text-dark text-sm">تاريخ الشراء</label>
            <input
              type="date"
              className="w-full p-3 bg-ligth/20 border border-brown/10 rounded-xl outline-none font-bold text-dark focus:border-brown"
              value={formData.purchaseDate}
              onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
            />
          </div>

          {/* رقم الفاتورة للعرض */}
          <div className="space-y-2 text-right">
            <label className="block font-black text-dark text-sm">رقم الفاتورة</label>
            <div className="w-full p-3 bg-gray-100 border border-brown/10 rounded-xl font-bold text-dark">
              #{formData.invoiceNumber || "---"}
            </div>
          </div>
        </div>

        {/* قسم الأصناف */}
        <div className="space-y-4">
          <div className="sticky top-0 z-30 bg-ligth/10 backdrop-blur py-2 flex justify-between items-center border-b border-brown/10 mb-4">
            <h3 className="text-lg font-black text-dark flex items-center gap-2">
              <Wrench size={22} className="text-brown" /> أصناف المعدات المشتراة
            </h3>
            <button 
              type="button" 
              onClick={() => setFormData({
                ...formData, 
                items: [...formData.items, { equipmentName: "", type: "", quantity: 1, unitPrice: 0, total: 0, notes: "" }]
              })} 
              className="bg-brown hover:bg-brown/90 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-black shadow-md"
            >
              <Plus size={18} /> إضافة معدة جديدة
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {formData.items.map((item, idx) => {
              const itemTotal = calculateItemTotal(item);
              return (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-brwonLight shadow-sm relative space-y-4 flex flex-col justify-between">
                  
                  <div className="space-y-3">
                    <div className="text-right">
                      <label className="text-xs font-black text-dark">اسم المعدة</label>
                <div className="relative"  ref={equipmentRef}>
  <input
    type="text"
    className="w-full p-2.5 mt-1 bg-ligth/20 border rounded-xl"
    placeholder="ابحث عن المعدة..."
    value={activeEquipmentIdx === idx ? equipmentSearch : item.equipmentName}
    onFocus={() => {
      setActiveEquipmentIdx(idx);
      setEquipmentSearch(item.equipmentName);
      setShowEquipmentList(true);
    }}
    onChange={(e) => {
      setEquipmentSearch(e.target.value);
      setActiveEquipmentIdx(idx);
      setShowEquipmentList(true);

      setShowEquipmentList(e.target.value.trim().length > 0);
    }}
  />

  {showEquipmentList && activeEquipmentIdx === idx && (
    <div className="absolute z-50 mt-1 w-full bg-white border rounded-xl shadow-lg max-h-60 overflow-y-auto">
      {equipmentList
        .filter((eq) =>
          eq.itemName.toLowerCase().includes(equipmentSearch.toLowerCase())
        
        ).slice(0, 10)
        .map((eq) => (
          <div
            key={eq._id}
            className="p-3 hover:bg-gray-100 cursor-pointer"
            onClick={() => {
              handleItemChange(idx, "equipmentName", eq.itemName);


              setEquipmentSearch(eq.itemName);
              setShowEquipmentList(false);
            }}
          >
            {eq.itemName}
          </div>
        ))}
    </div>
  )}
</div>
                    </div>

                    <div className="text-right">
                      <label className="text-xs font-black text-dark">النوع / الفئة</label>
                      <input
                        type="text"
                        className="w-full p-2.5 mt-1 bg-ligth/20 border border-brown/10 rounded-xl outline-none font-bold text-dark focus:border-brown"
                        placeholder="نوع المعدة..."
                        value={item.type}
                        onChange={(e) => handleItemChange(idx, "type", e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-right">
                        <label className="text-xs font-black text-dark">الكمية</label>
                        <input
                          type="number"
                          min={1}
                          className="w-full p-2.5 mt-1 bg-ligth/20 border border-brown/10 rounded-xl font-black text-brown outline-none"
                          value={item.quantity || ""}
                          onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                        />
                      </div>
                      <div className="text-right">
                        <label className="text-xs font-black text-dark">سعر الوحدة (EGP)</label>
                        <input
                          type="number"
                          className="w-full p-2.5 mt-1 bg-ligth/20 border border-brown/10 rounded-xl font-black text-brown outline-none"
                          value={item.unitPrice || ""}
                          onChange={(e) => handleItemChange(idx, "unitPrice", Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="text-right">
                      <label className="text-xs font-black text-dark">ملاحظات</label>
                      <input
                        type="text"
                        className="w-full p-2.5 mt-1 bg-ligth/20 border border-brown/10 rounded-xl outline-none font-bold text-dark focus:border-brown"
                        placeholder="ملاحظات إضافية عن المعدة..."
                        value={item.notes || ""}
                        onChange={(e) => handleItemChange(idx, "notes", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* إجمالي الصنف */}
                  <div className="pt-2 border-t border-brown/5">
                    <div className="bg-ligth/30 p-2 rounded-xl text-center text-sm font-black text-dark">
                      إجمالي الصنف: <span className="text-brown">{itemTotal.toLocaleString()} ج.م</span>
                    </div>
                  </div>

                  <button 
                    type="button" 
                    onClick={() => {
                      const newItems = formData.items.filter((_, i) => i !== idx);
                      setFormData({...formData, items: newItems});
                    }} 
                    className="absolute top-2 left-2 text-brown/30 hover:text-red-500"
                  >
                    <Trash2 size={16}/>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* قسم حركة المالية والمدفوعات المتعددة */}
        <div className="bg-white p-6 rounded-2xl border border-brwonLight shadow-sm space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-ligth pb-2">
              <label className="font-black text-dark text-base flex items-center gap-2">
                <CreditCard size={18} className="text-brown" /> طرق سداد واستلام النقدية
              </label>
              <button type="button" onClick={addPaymentField} className="text-brown hover:text-dark text-xs font-black flex items-center gap-1">
                <Plus size={16}/> إضافة وسيلة سداد
              </button>
            </div>
            
            {formData.payment.map((pay, pIdx) => (
              <div key={pIdx} className="bg-ligth/10 p-4 rounded-xl border border-brwonLight/60 space-y-3">
                <div className="flex gap-2 items-center">
                  <select 
                    className="bg-white p-2.5 rounded-xl border border-brown/15 text-sm font-bold outline-none text-dark"
                    value={pay.paymentMethod}
                    onChange={(e) => handlePaymentChange(pIdx, "paymentMethod", e.target.value)}
                  >
                    <option value="cash">نقدي (كاش)</option>
                    <option value="wallet">محفظة الكترونية</option>
                    <option value="instapay">إنستا باي</option>
                    <option value="bank">تحويل بنكي</option>
                    <option value="mail">مكتب البريد</option>
                    <option value="work">خصم من الشغل</option>
                    <option value="cheque">شيك بنكي</option>
                  </select>

                  <input
                    type="number"
                    placeholder="المبلغ المدفوع"
                    className="flex-1 p-2.5 rounded-xl border border-brown/15 text-center font-black text-dark outline-none"
                    value={pay.paidAmount || ""}
                    onChange={(e) => handlePaymentChange(pIdx, "paidAmount", e.target.value)}
                  />

                  {formData.payment.length > 1 && (
                    <button type="button" onClick={() => removePaymentField(pIdx)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={18}/>
                    </button>
                  )}
                </div>

                {/* الحقول الشرطية: البنك وإنستا باي */}
                {(pay.paymentMethod === "bank" || pay.paymentMethod === "instapay") && (
                  <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-lg border border-brown/10 shadow-inner">
                    <div className="text-right">
                      <label className="text-[11px] font-black text-brown block mb-1">اسم البنك / المنصة</label>
<BankAutocomplete
  value={pay.bankInfo?.bankName || ""}
  placeholder="اكتب اسم البنك..."
  onChange={(value) =>
    handlePaymentChange(
      pIdx,
      "bankInfo",
      value,
      "bankName"
    )
  }
/>
                    </div>
                    <div className="text-right">
                      <label className="text-[11px] font-black text-brown block mb-1">رقم مرجع المعاملة (Ref)</label>
                      <input 
                        type="text" 
                        className="w-full p-2 bg-ligth/20 border rounded-lg text-xs font-bold"
                        value={pay.bankInfo?.transactionReference || ""} 
                        onChange={(e) => handlePaymentChange(pIdx, "bankInfo", e.target.value, "transactionReference")} 
                      />
                    </div>
                  </div>
                )}

                {/* الحقول الشرطية: المحفظة الإلكترونية */}
                {pay.paymentMethod === "wallet" && (
                  <div className="p-4 space-y-4 rounded-lg border bg-white shadow-inner border-brown/10">
                    
                    <div className="flex gap-3 items-center p-3 rounded-lg bg-light/20">
                      <input
                        type="checkbox"
                        disabled={true}
                        checked={pay.walletInfo?.linkWallet || true}
                        onChange={(e) =>
                          handlePaymentChange(
                            pIdx,
                            "walletInfo",
                            e.target.checked,
                            "linkWallet"
                          )
                        }
                      />
                      <span className="text-sm font-bold">ربط العملية بنظام المحافظ</span>
                    </div>

                           <div className="flex gap-3 justify-between items-center w-full">
                        <div className="w-full text-right">
                          <label className="block mb-1 text-[11px] font-black text-brown">رقم المستلم</label>
                          <input
                            type="text"
                            className="p-2 w-full text-xs font-bold rounded-lg border bg-light/20"
                            placeholder="رقم الهاتف المستلم"
                            value={pay.walletInfo?.receiverPhone || ""}
                            onChange={(e) =>
                              handlePaymentChange(
                                pIdx,
                                "walletInfo",
                                e.target.value,
                                "receiverPhone"
                              )
                            }
                          />
                        </div>
                        <div className="w-full text-right">
                          <label className="block mb-1 text-[11px] font-black text-brown">اسم المستلم</label>
                          <input
                            type="text"
                            className="p-2 w-full text-xs font-bold rounded-lg border bg-light/20"
                            placeholder="اسم الشخص/الجهة المستلمة"
                            value={pay.walletInfo?.receiverName || ""}
                            onChange={(e) =>
                              handlePaymentChange(
                                pIdx,
                                "walletInfo",
                                e.target.value,
                                "receiverName"
                              )
                            }
                          />
                        </div>
                      </div>


                    {!pay.walletInfo?.linkWallet && (
               

                      
                    <div className="flex gap-3 justify-between items-center w-full">
                      <div className="w-full text-right">
                        <label className="block mb-1 text-[11px] font-black text-brown">رقم الراسل</label>
                        <input
                          type="text"
                          className="p-2 w-full text-xs font-bold rounded-lg border bg-light/20"
                          placeholder="رقم الهاتف الذي قام بالتحويل"
                          value={pay.walletInfo?.senderPhone || ""}
                          onChange={(e) =>
                            handlePaymentChange(
                              pIdx,
                              "walletInfo",
                              e.target.value,
                              "senderPhone"
                            )
                          }
                        />
                      </div>
                      <div className="w-full text-right">
                        <label className="block mb-1 text-[11px] font-black text-brown">اسم الراسل</label>
                        <input
                          type="text"
                          className="p-2 w-full text-xs font-bold rounded-lg border bg-light/20"
                          placeholder="اسم الذي قام بالتحويل"
                          value={pay.walletInfo?.senderName || ""}
                          onChange={(e) =>
                            handlePaymentChange(
                              pIdx,
                              "walletInfo",
                              e.target.value,
                              "senderName"
                            )
                          }
                        />
                      </div>
                    </div>
                    )}

                    {pay.walletInfo?.linkWallet && (
                      <div className="relative text-right">
                        <label className="block mb-1 text-[11px] font-black text-brown">المحفظة المرسله</label>
                        <input
                          type="text"
                          className="p-2 w-full text-xs font-bold rounded-lg border bg-light/20"
                          placeholder="ابحث بالاسم أو رقم المحفظة..."
                          value={walletSearch}
                          onFocus={() => setShowWalletList(true)}
                          onChange={(e) => {
                            setWalletSearch(e.target.value);
                            setShowWalletList(true);
                          }}
                        />

                        {showWalletList && walletSearch.length > 0 && (
                          <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto bg-white rounded-xl border shadow-xl">
                            {suggestionWallets
                              .filter(
                                (w) =>
                                  w.walletName
                                    .toLowerCase()
                                    .includes(walletSearch.toLowerCase()) ||
                                  w.phoneNumber.includes(walletSearch)
                              )
                              .map((wallet) => (
                                <div
                                  key={wallet._id}
                                  className="p-3 border-b transition cursor-pointer hover:bg-light/30"
                                  onClick={() => {
                                    const newPayments = [...formData.payment];

                                    newPayments[pIdx].walletInfo = {
                                      ...newPayments[pIdx].walletInfo,
                                      walletId: wallet._id,
                                      senderName: wallet.walletName,
                                      senderPhone: wallet.phoneNumber,
                                      provider: wallet.walletProvider,
                                    };

                                    setFormData({
                                      ...formData,
                                      payment: newPayments,
                                    });

                                    setWalletSearch(wallet.walletName);
                                    setShowWalletList(false);
                                    setRemainingOutgoing(wallet.remainingOutgoing )
                                    setBalance(wallet?.balance)
                                  }}
                                >
                                  <div className="font-black">{wallet.walletName}</div>
                                  <div className="text-xs text-gray-500">{wallet.phoneNumber}</div>
                                  <div className="text-xs text-green-600">{wallet.walletProvider}</div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}

                    {pay.walletInfo?.linkWallet && (
                   <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
  <div>
    <label className="block mb-1 text-[11px] font-black text-brown">
      اسم المرسل
    </label>
    <input
      readOnly
      value={pay.walletInfo.senderName || ""}
      className="p-2 w-full text-xs font-bold bg-gray-100 rounded-lg border"
    />
  </div>

  <div>
    <label className="block mb-1 text-[11px] font-black text-brown">
      رقم المرسل
    </label>
    <input
      readOnly
      value={pay.walletInfo.senderPhone || ""}
      className="p-2 w-full text-xs font-bold bg-gray-100 rounded-lg border"
    />
  </div>

  <div>
    <label className="block mb-1 text-[11px] font-black text-brown">
      رصيد المحفظة
    </label>
    <input
      readOnly
      value={balance || ""}
      className="p-2 w-full text-xs font-bold bg-gray-100 rounded-lg border"
    />
  </div>

  <div>
    <label className="block mb-1 text-[11px] font-black text-brown">
      المتبقي للإرسال
    </label>
    <input
      readOnly
      value={remainingOutgoing || ""}
      className="p-2 w-full text-xs font-bold bg-gray-100 rounded-lg border"
    />
  </div>
</div>
                    )}
                  </div>
                )}

                {/* الحقول الشرطية: الشيكات البنكية */}
                {pay.paymentMethod === "cheque" && (
                  <div className="bg-white p-3 rounded-lg border border-brown/10 space-y-2 shadow-inner">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-right">
                        <label className="text-[11px] font-black text-brown block mb-1">رقم الشيك</label>
                        <input 
                          type="text" 
                          className="w-full p-2 bg-ligth/20 border rounded-lg text-xs font-bold"
                          value={pay.cheque?.chequeNumber || ""} 
                          onChange={(e) => handlePaymentChange(pIdx, "cheque", e.target.value, "chequeNumber")} 
                        />
                      </div>
                      <div className="text-right">
                        <label className="text-[11px] font-black text-brown block mb-1">البنك المسحوب عليه</label>
<BankAutocomplete
  value={pay.cheque?.bankName || ""}
  placeholder="البنك المسحوب عليه..."
  onChange={(value) =>
    handlePaymentChange(
      pIdx,
      "cheque",
      value,
      "bankName"
    )
  }
/>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-right">
                        <label className="text-[11px] font-black text-brown block mb-1">تاريخ الاستلام</label>
                        <input 
                          type="date" 
                          className="w-full p-2 bg-ligth/20 border rounded-lg text-xs font-bold"
                          value={pay.cheque?.receiveDate ? pay.cheque.receiveDate.split("T")[0] : ""} 
                          onChange={(e) => handlePaymentChange(pIdx, "cheque", e.target.value, "receiveDate")} 
                        />
                      </div>
                      <div className="text-right">
                        <label className="text-[11px] font-black text-brown block mb-1">تاريخ الاستحقاق</label>
                        <input 
                          type="date" 
                          className="w-full p-2 bg-ligth/20 border rounded-lg text-xs font-bold"
                          value={pay.cheque?.dueDate ? pay.cheque.dueDate.split("T")[0] : ""} 
                          onChange={(e) => handlePaymentChange(pIdx, "cheque", e.target.value, "dueDate")} 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-right">
                        <label className="text-[11px] font-black text-brown block mb-1">نوع الشيك</label>
                        <select
                          className="w-full p-2 bg-ligth/20 border rounded-lg text-xs font-bold"
                          value={pay.cheque?.chequeType || "normal"}
                          onChange={(e) => handlePaymentChange(pIdx, "cheque", e.target.value, "chequeType")}
                        >
                          <option value="normal">عادي</option>
                          <option value="clearing">مقاصة</option>
                        </select>
                      </div>
                      <div className="text-right">
                        <label className="text-[11px] font-black text-brown block mb-1">حالة الشيك</label>
                        <select
                          className="w-full p-2 bg-ligth/20 border rounded-lg text-xs font-bold"
                          value={pay.cheque?.status || "under_collection"}
                          onChange={(e) => handlePaymentChange(pIdx, "cheque", e.target.value, "status")}
                        >
                          <option value="under_collection">تحت التحصيل</option>
                          <option value="due_today">مستحق اليوم</option>
                          <option value="collected">تم التحصيل</option>
                          <option value="returned">مرتجع</option>
                          <option value="cancelled">ملغي</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ملاحظات وبيانات الحركات العامة */}
          <div className="space-y-4 bg-ligth/10 p-4 rounded-2xl border border-brwonLight">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 text-right">
                <label className="text-xs font-black text-dark">بيان حركة الخزنة الرئيسي</label>
                <input 
                  type="text" 
                  className="w-full p-3 bg-white border border-brown/10 rounded-xl font-bold text-sm text-dark" 
                  placeholder="الحركة المرتبطة بدفتر الخزينة العام..." 
                  value={formData.note || ""} 
                  onChange={(e)=>setFormData({...formData, note: e.target.value})} 
                />
              </div>
              <div className="space-y-2 text-right">
                <label className="text-xs font-black text-dark">ملاحظات الفاتورة</label>
                <input 
                  type="text" 
                  className="w-full p-3 bg-white border border-brown/10 rounded-xl font-bold text-sm text-dark" 
                  placeholder="ملاحظات إضافية للفاتورة..." 
                  value={formData.notes || ""} 
                  onChange={(e)=>setFormData({...formData, notes: e.target.value})} 
                />
              </div>
            </div>
          </div>

          {/* الحساب والملخص المالي الإجمالي */}
          <div className="bg-white border border-brwonLight rounded-2xl overflow-hidden shadow-lg">
            <div className="bg-ligth p-4 flex justify-between items-center border-b border-brwonLight">
              <h4 className="font-black text-dark flex items-center gap-2 text-sm">
                <Notebook size={18} className="text-brown" /> ملخص وتأثير الحساب المالي النهائي للتاجر  (تعديل الفاتورة #{formData.invoiceNumber})
              </h4>
              <span className="text-xs font-bold text-brown">تاريخ الشراء: {formData.purchaseDate}</span>
            </div>

            <div className="p-5 space-y-3.5 font-bold text-xs text-dark">
              <div className="flex justify-between items-center text-dark/80">
                <span>إجمالي قيمة المشتريات:</span>
                <span className="font-black text-sm">{grandTotal.toLocaleString()} EGP</span>
              </div>
              <div className="flex justify-between items-center text-dark/80 border-t border-brwonLight/30 pt-2">
                <span>إجمالي المبلغ المدفوع حالياً:</span>
                <span className="font-black text-sm text-green-600">{totalPaidAmount.toLocaleString()} EGP</span>
              </div>
              <div className="flex justify-between items-center text-dark/80">
                <span>المبلغ المتبقي:</span>
                <span className="font-black text-sm text-amber-600">{remainingAmount.toLocaleString()} EGP</span>
              </div>
              <div className="flex justify-between items-center text-dark/80 border-t border-brwonLight/30 pt-2">
                <span>حالة الدفع:</span>
                <span className={`font-black text-sm px-3 py-1 rounded-full ${
                  remainingAmount <= 0 ? 'bg-green-100 text-green-700' :
                  totalPaidAmount > 0 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {remainingAmount <= 0 ? 'مدفوع بالكامل' :
                   totalPaidAmount > 0 ? 'مدفوع جزئياً' : 'غير مدفوع'}
                </span>
              </div>
            </div>
          </div>

          {/* زر التحديث والحفظ النهائي */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-brown hover:bg-brown/90 text-white px-8 py-3 rounded-xl flex items-center gap-2 font-black shadow-lg transition-all disabled:opacity-50"
            >
              <Save size={20} />
              {loading ? "جاري التحديث..." : "تحديث الفاتورة والمدفوعات"}
            </button>
          </div>

        </div>

      </form>
    </div>
  );
};

export default EquipmentEditForm;