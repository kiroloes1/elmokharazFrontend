import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save, Truck, Search, Notebook, CreditCard, Wallet, Landmark, Smartphone, Mail, Briefcase } from "lucide-react";
import api from "../../services/api"; 
import { showAlert } from "../../services/alert";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import BankAutocomplete from "../../services/allBank";

const DeliveryForm = () => {

  
  const [suppliers, setSuppliers] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [supSearch, setSupSearch] = useState("");
  const [showSupList, setShowSupList] = useState(false);
  const [activeItemSearchIdx, setActiveItemSearchIdx] = useState(null);
  
  const [walletSearch, setWalletSearch] = useState("");
const [showWalletList, setShowWalletList] = useState(false);

  const [formData, setFormData] = useState({
    supplier: "",
    deliveryDate: new Date().toISOString().split("T")[0],
    teaForWorkers: 0,
    carPayment: 0,
    carName:"",
    notes: "",
    note: "", 
    payment: [
      { 
        paidAmount: 0, 
        paymentMethod: "cash",
        bankInfo: { bankName: "", transactionReference: "" },
        walletInfo: { provider: "", senderName: "", senderPhone: "", receiverName: "", receiverPhone: "", transactionReference: "" , linkWallet: true},
        cheque: { chequeNumber: "", chequeType: "normal", bankName: "", receiveDate: "", dueDate: "",status:"under_collection"}
      } 
    ],
    items: [
      {
        item: "", 
        itemName: "",
        pricePerKg: 0,
        returnWeight: 0,
        discount: 0,
        oldReturnWeight: 0,
        batches: [{ quantity: 1, weight: 0 }],
      },
    ],
  });

  const [suggestionWallets, setSuggestionWallets] = useState([]);

  const fetchSuggestions = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/wallet/getSugg`,{
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

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [supRes, itemRes] = await Promise.all([
          api.get("/customers/getAllSupplierName"),
          api.get("/item"),
        ]);
        setSuppliers(supRes.data.data || []);
        setAvailableItems(itemRes.data.categories || []);
      } catch (err) {
        console.error("Error fetching data", err);
      }
    };
    fetchData();
  }, []);

  const calculateItemStats = (item) => {
    const totalWeight = item.batches.reduce((acc, b) => acc + (Number(b.weight) * Number(b.quantity)), 0);
    const netWeight = (totalWeight - ((Number(item.returnWeight) || 0) + (Number(item.oldReturnWeight) || 0)));
    const priceBeforeDiscount = netWeight * Number(item.pricePerKg);
    const discountVal = priceBeforeDiscount * (Number(item.discount) / 100);
    const finalPrice = priceBeforeDiscount - discountVal;
    const returnCashValue = (Number(item.returnWeight) + Number(item.oldReturnWeight)) * Number(item.pricePerKg);

    return { totalWeight, netWeight, finalPrice, returnCashValue };
  };

  const selectedSupplier = suppliers.find(s => s._id === formData.supplier);
  const oldBalance = selectedSupplier ? selectedSupplier.balance : 0;
  const totalPaidAmount = formData.payment.reduce((acc, p) => acc + Number(p.paidAmount || 0), 0);

  const calculateGrandTotal = () => {
    const itemsTotal = formData.items.reduce((acc, item) => acc + calculateItemStats(item).finalPrice, 0);
    return itemsTotal - Number(formData.teaForWorkers); 
  };

  const grandTotal = calculateGrandTotal();
  const netDue = grandTotal - totalPaidAmount;
  const newBalance = oldBalance + netDue;

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleBatchChange = (itemIdx, batchIdx, field, value) => {
    const newItems = [...formData.items];
    newItems[itemIdx].batches[batchIdx][field] = Math.max(0, Number(value));
    setFormData({ ...formData, items: newItems });
  };

  const addPaymentField = () => {
    // if (formData.payment.length >= 7) {
    //   showAlert({ title: "الحد الأقصى لطرق الدفع المدمجة هي 5 طرق", icon: "error" });
    //   return;
    // }
    const allMethods = ["cash", "wallet", "instapay", "bank", "mail", "cheque", "work"];
    const unusedMethod = allMethods.find(method => !formData.payment.some(m => m.paymentMethod === method)) || "cash";

    setFormData({
      ...formData,
      payment: [
        ...formData.payment, 
        { 
          paidAmount: 0, 
          paymentMethod: unusedMethod,
          bankInfo: { bankName: "", transactionReference: "" },
          walletInfo: { provider: "", senderName: "", senderPhone: "", receiverName: "", receiverPhone: "", transactionReference: "" ,linkWallet: true },
          cheque: { chequeNumber: "", chequeType: "normal", bankName: "", receiveDate: "", dueDate: "" }
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
      newPayments[idx][field][subField] = value;
    } else {
      if (field === "paymentMethod") {
        const isDuplicate = formData.payment.some((m, i) => i !== idx && m.paymentMethod === value);
        // if (isDuplicate) {
        //   showAlert({ title: "لا يمكن تكرار طريقة الدفع في نفس النقلة", icon: "error" });
        //   return;
        // }
      }
      newPayments[idx][field] = field === "paidAmount" ? Number(value) : value;
    }

    // تصفية وإضافة ملاحظات الدفع التلقائية للشغل
    const workPayment = newPayments.find(p => p.paymentMethod === "work" && Number(p.paidAmount) > 0);
    let notes = formData.notes.replace(/تم خصم .* جنيه مقابل مرتجع قديم\.?\n?/g, "").trim();
    if (workPayment) {
      const autoNote = `تم خصم ${workPayment.paidAmount.toLocaleString()} جنيه مقابل مرتجع قديم.`;
      notes = notes ? `${notes}\n${autoNote}` : autoNote;
    }

    setFormData({ ...formData, payment: newPayments, notes });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.supplier) return showAlert({ title: "برجاء اختيار تاجر أولاً", icon: "warning" });
    if (formData.items.some(i => !i.item)) return showAlert({ title: "تأكد من اختيار الأصناف بشكل صحيح", icon: "warning" });

    // التحقق من تعبئة الحقول المطلوبة للماليات بناءً على الـ backend لإيقاف العملية قبل الإرسال الخاطئ
    for (const p of formData.payment) {
      if ((p.paymentMethod === "bank" || p.paymentMethod === "instapay") && (!p.bankInfo.bankName || !p.bankInfo.transactionReference)) {
        return showAlert({ title: "برجاء ملء بيانات البنك / إنستا باي المطلوبة بالكامل", icon: "warning" });
      }
      if (p.paymentMethod === "wallet" && ( !p.walletInfo.senderPhone || !p.walletInfo.receiverPhone)) {
        return showAlert({ title: "برجاء ملء بيانات المحفظة الإلكترونية الأساسية", icon: "warning" });
      }
      if (p.paymentMethod === "cheque" && (!p.cheque.chequeNumber || !p.cheque.bankName || !p.cheque.dueDate)) {
        return showAlert({ title: "برجاء ملء بيانات الشيك الأساسية (الرقم، البنك، الاستحقاق)", icon: "warning" });
      }
    }

    setLoading(true);
    try {
      const selectedDate = new Date(formData.deliveryDate);
      const now = new Date();
      selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
      
      await api.post("/delivery", { ...formData, deliveryDate: selectedDate });
      showAlert({ title: "تم تسجيل النقلة وتحديث الحسابات بنجاح", icon: "success" });
      navigate("/deliveries");
    } catch (err) {
      showAlert({ title: err.response?.data?.message || "خطأ أثناء الحفظ", icon: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mx-auto p-4 lg:p-8  bg-ligth/10" dir="rtl">
      <form onSubmit={handleSubmit} className="space-y-6 h-[100vh] overflow-auto pb-32 pr-2">
        
        {/* قسم التاجر والتاريخ */}
        <div className="bg-white p-6 rounded-2xl border border-brwonLight shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div className="space-y-2 relative text-right">
            <label className="block font-black text-dark text-sm">التاجر / المورد</label>
            <div className="relative">
              <Search className="absolute right-3 top-3.5 text-brown/50" size={18} />
              <input
                type="text"
                className="w-full p-3 pr-10 bg-ligth/20 border border-brown/10 rounded-xl outline-none font-bold text-dark focus:border-brown focus:ring-1 focus:ring-brown"
                placeholder="ابحث عن اسم التاجر للربط المالي..."
                value={supSearch}
                onFocus={() => setShowSupList(true)}
                onChange={(e) => {setSupSearch(e.target.value)}}
              />
            </div>
            {showSupList && supSearch.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-brwonLight rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                {suppliers.filter(s => s.name.includes(supSearch)).map(s => (
                  <div 
                    key={s._id} 
                    className="p-4 hover:bg-ligth/40 cursor-pointer flex justify-between items-center border-b border-ligth last:border-b-0 text-dark transition-all"
                  onClick={() => {
                    const newPayments = formData.payment.map((p) => ({
                      ...p,
                      walletInfo: {
                        ...p.walletInfo,
                        senderName: s.name, // لأن دي عملية Pay
                      },
                    }));

                    setFormData({
                      ...formData,
                      supplier: s._id,
                      payment: newPayments,
                    });

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
            <label className="block font-black text-dark text-sm">تاريخ النقلة</label>
            <input
              type="date"
              className="w-full p-3 bg-ligth/20 border border-brown/10 rounded-xl outline-none font-bold text-dark focus:border-brown focus:ring-1 focus:ring-brown"
              value={formData.deliveryDate}
              onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
            />
          </div>


             <div className="relative">
              
              <input
                type="text"
                className="w-full p-3 col-span-2 pr-10 bg-ligth/20 border border-brown/10 rounded-xl outline-none font-bold text-dark focus:border-brown focus:ring-1 focus:ring-brown"
                placeholder="ادخل اسم السائق"
                value={formData.carName}
            
                onChange={(e) => setFormData({ ...formData, carName: e.target.value })}
              />
            </div>
          
        </div>

        {/* قسم الأصناف */}
        <div className="space-y-4">
          <div className="sticky top-0 z-30 bg-ligth/10 backdrop-blur py-2 flex justify-between items-center border-b border-brown/10 mb-4">
            <h3 className="text-lg font-black text-dark flex items-center gap-2">
              <Truck size={22} className="text-brown" /> أصناف النقلة الحالية
            </h3>
            <button 
              type="button" 
              onClick={() => setFormData({...formData, items: [...formData.items, { item: "", itemName: "", pricePerKg: 0, returnWeight: 0, discount: 0, oldReturnWeight: 0, batches: [{ quantity: 1, weight: 0 }] }]})} 
              className="bg-brown hover:bg-brown/90 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-black shadow-md transition-all"
            >
              <Plus size={18} /> إضافة صنف جديد
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {formData.items.map((item, idx) => {
              const stats = calculateItemStats(item);
              return (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-brwonLight shadow-sm relative space-y-4 flex flex-col justify-between">
                  
                  <div className="space-y-3">
                    <div className="relative text-right">
                      <label className="text-xs font-black text-dark">اسم الصنف</label>
                      <input
                        type="text"
                        className="w-full p-2.5 mt-1 bg-ligth/20 border border-brown/10 rounded-xl outline-none font-bold text-dark focus:border-brown"
                        placeholder="ابحث عن صنف..."
                        value={item.itemName}
                        onBlur={() => setTimeout(() => setActiveItemSearchIdx(null), 200)}
                        onFocus={() => setActiveItemSearchIdx(idx)}
                        onChange={(e) => handleItemChange(idx, "itemName", e.target.value)}
                      />
                      {activeItemSearchIdx === idx && item.itemName.length > 0 && (
                        <div className="absolute z-40 w-full bg-white border border-brwonLight rounded-xl shadow-xl max-h-40 overflow-y-auto mt-1">
                          {availableItems.filter(i => i.name.includes(item.itemName)).map(ai => (
                            <div
                              key={ai._id}
                              className="p-2.5 hover:bg-ligth/50 font-bold text-sm cursor-pointer border-b border-ligth last:border-none"
                              onMouseDown={() => {
                                handleItemChange(idx, "item", ai._id);
                                handleItemChange(idx, "itemName", ai.name);
                                handleItemChange(idx, "pricePerKg", ai.pricePerWeight || 0);
                                setActiveItemSearchIdx(null);
                              }}
                            >
                              {ai.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <label className="text-xs font-black text-dark">سعر الكيلو (EGP)</label>
                      <input
                        type="number"
                        className="w-full p-2.5 mt-1 bg-ligth/20 border border-brown/10 rounded-xl font-black text-brown outline-none focus:border-brown"
                        value={item.pricePerKg === 0 ? "" : item.pricePerKg}
                        onChange={(e) => handleItemChange(idx, "pricePerKg", Number(e.target.value))}
                      />
                    </div>

                    {/* موازين البسكول داخل كارت الصنف */}
                    <div className="bg-ligth/30 p-3 rounded-xl border border-brown/5">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-black text-brown">موازين البسكول الفرعية</span>
                        <button 
                          type="button" 
                          onClick={() => {
                            const newItems = [...formData.items];
                            newItems[idx].batches.push({ quantity: 1, weight: 0 });
                            setFormData({...formData, items: newItems});
                          }} 
                          className="text-dark hover:text-brown text-xs font-black"
                        >
                          + إضافة وزن
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-0.5">
                        {item.batches.map((batch, bIdx) => (
                          <div key={bIdx} className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-brwonLight">
                            <input
                              type="number"
                              className="w-16 text-center outline-none font-bold text-xs"
                              placeholder="الوزن"
                              value={batch.weight || ""}
                              onChange={(e) => handleBatchChange(idx, bIdx, "weight", e.target.value)}
                            />
                            <button 
                              type="button" 
                              onClick={() => {
                                const newItems = [...formData.items];
                                newItems[idx].batches = newItems[idx].batches.filter((_, i) => i !== bIdx);
                                setFormData({...formData, items: newItems});
                              }} 
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={12}/>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* إحصائيات ومرتجع الصنف الكلية */}
                  <div className="pt-2 border-t border-brown/5 space-y-2">
                    {/* <div className="grid grid-cols-2 gap-2 text-center text-xs">
                      <div className="p-1.5 bg-red-50 rounded-lg border border-red-100">
                        <span className="text-[10px] block font-black text-red-500">وزن المرتجع الحالي</span>
                        <input type="number" className="w-full bg-transparent text-center font-black text-red-700 outline-none" value={item.returnWeight || ""} onChange={(e)=>handleItemChange(idx, "returnWeight", Number(e.target.value))} />
                      </div>
                      <div className="p-1.5 bg-red-50 rounded-lg border border-red-100">
                        <span className="text-[10px] block font-black text-red-500">وزن المرتجع القديم</span>
                        <input type="number" className="w-full bg-transparent text-center font-black text-red-700 outline-none" value={item.oldReturnWeight || ""} onChange={(e)=>handleItemChange(idx, "oldReturnWeight", Number(e.target.value))} />
                      </div>
                    </div> */}

                    <div className="grid grid-cols-2 gap-1 bg-ligth/20 p-2 rounded-xl text-center text-[11px] font-bold text-dark">
                      <div>
                        <span className="opacity-70 block">الوزن الكلي</span>
                        <span className="font-black text-xs text-dark">{stats.totalWeight}</span>
                      </div>
                      {/* <div>
                        <span className="opacity-70 block">الصافي</span>
                        <span className="font-black text-xs text-dark">{stats.netWeight.toFixed(2)}</span>
                      </div> */}
                      <div>
                        <span className="font-black text-brown block">إجمالي السعر</span>
                        <span className="font-black text-xs text-brown">{stats.finalPrice.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    type="button" 
                    onClick={() => {
                      const newItems = formData.items.filter((_, i) => i !== idx);
                      setFormData({...formData, items: newItems});
                    }} 
                    className="absolute top-2 left-2 text-brown/30 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16}/>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* الحسابات والماليات المتطورة */}
        <div className="bg-white p-6 rounded-2xl border border-brwonLight shadow-sm space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            
            {/* طرق الدفع المتعددة وتفاصيلها الفرعية */}
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
                      className="bg-white p-2.5 rounded-xl border border-brown/15 text-sm font-bold outline-none text-dark focus:border-brown"
                      value={pay.paymentMethod}
                      onChange={(e) => handlePaymentChange(pIdx, "paymentMethod", e.target.value)}
                    >
                      <option value="cash"> نقدي (كاش)</option>
                      <option value="bank"> تحويل بنكي</option>
                      <option value="instapay"> إنستا باي</option>
                      <option value="wallet">محفظة الكترونية</option>
                      <option value="cheque"> شيك بنكي</option>
                      <option value="mail">مكتب البريد</option>
                      <option value="work"> خصم من الشغل</option>
                    </select>

                    <input
                      type="number"
                      placeholder="المبلغ المدفوع"
                      className="flex-1 p-2.5 rounded-xl border border-brown/15 text-center font-black text-dark outline-none focus:border-brown"
                      value={pay.paidAmount || ""}
                      onChange={(e) => handlePaymentChange(pIdx, "paidAmount", e.target.value)}
                    />

                    {formData.payment.length > 1 && (
                      <button type="button" onClick={() => removePaymentField(pIdx)} className="text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 size={18}/>
                      </button>
                    )}
                  </div>

                  {/* الحقول الشرطية: البنك وإنستا باي */}
                  {(pay.paymentMethod === "bank" || pay.paymentMethod === "instapay") && (
                    <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-lg border border-brown/10 shadow-inner animate-fadeIn">
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
                          placeholder="رقم التحويل أو العملية"
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
    
    {/* ربط العملية */}
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
      <span className="text-sm font-bold">
        ربط العملية بنظام المحافظ
      </span>
    </div>

    {/* بيانات الراسل (تظهر دائمًا) */}
    <div className="flex gap-3 justify-between items-center w-full">
      {/* رقم الراسل */}
      <div className="w-full text-right">
        <label className="block mb-1 text-[11px] font-black text-brown">
          رقم الراسل
        </label>
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

      {/* اسم الراسل */}
      <div className="w-full text-right">
        <label className="block mb-1 text-[11px] font-black text-brown">
          اسم الراسل
        </label>
        <input
          type="text"
          className="p-2 w-full text-xs font-bold rounded-lg border bg-light/20"
          placeholder="اسم الذي قام بالتحويل"
          value={pay.walletInfo?.senderName ||  ""}
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

    {/* بيانات المستلم اليدوية (تظهر فقط في حال عدم الربط بنظام المحافظ) */}
    {!pay.walletInfo?.linkWallet && (
      <div className="flex gap-3 justify-between items-center w-full">
        {/* رقم المستلم */}
        <div className="w-full text-right">
          <label className="block mb-1 text-[11px] font-black text-brown">
            رقم المستلم
          </label>
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

        {/* اسم المستلم */}
        <div className="w-full text-right">
          <label className="block mb-1 text-[11px] font-black text-brown">
            اسم المستلم
          </label>
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
    )}

    {/* البحث عن المحفظة (يظهر عند تفعيل الربط) */}
    {pay.walletInfo?.linkWallet && (
      <div className="relative text-right">
        <label className="block mb-1 text-[11px] font-black text-brown">
          المحفظة المستلمة
        </label>
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

        {/* قائمة اقتراحات المحافظ */}
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
                      receiverName: wallet.walletName,
                      receiverPhone: wallet.phoneNumber,
                      provider: wallet.walletProvider,
                      remainingIncoming:wallet.remainingIncoming,
                      balance:wallet.balance
                    };

                    setFormData({
                      ...formData,
                      payment: newPayments,
                    });

                    setWalletSearch(wallet.walletName);
                    setShowWalletList(false);
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

    {/* بيانات المحفظة المختارة تلقائيًا */}
    {pay.walletInfo?.walletId && pay.walletInfo?.linkWallet && (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <label className="block mb-1 text-[11px] font-black text-brown">
            اسم المستلم
          </label>
          <input
            readOnly
            value={pay.walletInfo.receiverName || ""}
            className="p-2 w-full text-xs font-bold bg-gray-100 rounded-lg border"
          />
        </div>

        <div>
          <label className="block mb-1 text-[11px] font-black text-brown">
            رقم المستلم
          </label>
          <input
            readOnly
            value={pay.walletInfo.receiverPhone || ""}
            className="p-2 w-full text-xs font-bold bg-gray-100 rounded-lg border"
          />
        </div>

        <div>
          <label className="block mb-1 text-[11px] font-black text-brown">
            شركة المحفظة
          </label>
          <input
            readOnly
            value={pay.walletInfo.provider || ""}
            className="p-2 w-full text-xs font-bold bg-gray-100 rounded-lg border"
          />
        </div>

                <div>
          <label className="block mb-1 text-[11px] font-black text-brown">
            الرصيد
          </label>
          <input
            readOnly
            value={pay.walletInfo.balance || ""}
            className="p-2 w-full text-xs font-bold bg-gray-100 rounded-lg border"
          />
        </div>

                <div>
          <label className="block mb-1 text-[11px] font-black text-brown">
            المتبقي للاستلام
          </label>
          <input
            readOnly
            value={pay.walletInfo.remainingIncoming || ""}
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
                          {/* <input 
                            type="text" 
                            className="w-full p-2 bg-ligth/20 border rounded-lg text-xs font-bold"
                            value={pay.cheque?.bankName || ""} 
                            onChange={(e) => handlePaymentChange(pIdx, "cheque", e.target.value, "bankName")} 
                          /> */}

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
                            value={pay.cheque?.receiveDate || ""} 
                            onChange={(e) => handlePaymentChange(pIdx, "cheque", e.target.value, "receiveDate")} 
                          />
                        </div>
                        <div className="text-right">
                          <label className="text-[11px] font-black text-brown block mb-1">تاريخ الاستحقاق الصرف</label>
                          <input 
                            type="date" 
                            className="w-full p-2 bg-ligth/20 border rounded-lg text-xs font-bold"
                            value={pay.cheque?.dueDate || ""} 
                            onChange={(e) => handlePaymentChange(pIdx, "cheque", e.target.value, "dueDate")} 
                          />
                        </div>

                                         <div className="text-right">
                          <label className="text-[11px] font-black text-brown block mb-1">  نوع الشيك</label>
                                <select
                                value={pay.cheque?.chequeType}
                                onChange={(e) =>
                                    handlePaymentChange(pIdx, "cheque", e.target.value, "chequeType")
                                }
                                >
                                <option value="normal">عادي</option>
                                <option value="clearing">مقاصة</option>
                                </select>
                        </div>


      <div className="text-right">
                          <label className="text-[11px] font-black text-brown block mb-1">  حاله الشيك</label>
                                        <select
                                        value={pay.cheque?.status}
                                        onChange={(e) =>
                                            handlePaymentChange(pIdx, "cheque", e.target.value, "status")
                                        }
                                        >
                                        <option value="under_collection">تحت التحصيل</option>
                                        <option value="due_today">مستحق اليوم</option>
                                        </select>
                        </div>




                        
                      </div>
                    </div>
                  )}

                </div>
              ))}
            </div>

            {/* المصاريف الفرعية وتفاصيل الخزنة السريعة */}
            <div className="space-y-4 bg-ligth/10 p-4 rounded-2xl border border-brwonLight">
              <div className="grid grid-cols-2 gap-4">


                <div className="col-span-2 space-y-2 text-right">
                  <label className="text-xs font-black text-dark">بيان حركة الخزنة الرئيسي</label>
                  <input type="text" className="w-full p-3 bg-white border border-brown/10 rounded-xl font-bold text-sm text-dark" placeholder="الحركة المرتبطة بدفتر الخزينة العام..." value={formData.note} onChange={(e)=>setFormData({...formData, note: e.target.value})} />
                </div>
              </div>
            </div>

          </div>

          {/* ملخص الحساب المالي الإجمالي المطور */}
          <div className="bg-white border border-brwonLight rounded-2xl overflow-hidden shadow-lg">
            <div className="bg-ligth p-4 flex justify-between items-center border-b border-brwonLight">
              <h4 className="font-black text-dark flex items-center gap-2 text-sm">
                <Notebook size={18} className="text-brown" /> ملخص وتأثير الحساب المالي النهائي للتاجر
              </h4>
              <span className="text-xs font-bold text-brown">تاريخ النقلة: {formData.deliveryDate}</span>
            </div>

            <div className="p-5 space-y-3.5 font-bold text-xs text-dark">
              <div className="flex justify-between items-center text-dark/80">
                <span>إجمالي قيمة البضاعة والأصناف:</span>
                <span className="font-black text-sm">{(grandTotal + formData.teaForWorkers).toLocaleString()} EGP</span>
              </div>



              <div className="h-px bg-ligth my-2"></div>



              <div className="flex justify-between items-center text-emerald-700 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
                <span className="font-black">إجمالي المبالغ المدفوعة والراسلة:</span>
                <span className="font-black text-sm">-{totalPaidAmount.toLocaleString()} EGP</span>
              </div>

              <div className="bg-ligth/30 p-3 rounded-xl border border-brown/5 flex justify-between items-center">
                <span className="text-dark/80 font-black">المتبقي من هذه النقلة (الحالي):</span>
                <span className="text-base font-black text-brown">{netDue.toLocaleString()} EGP</span>
              </div>

              <div className="pt-3 border-t border-ligth grid grid-cols-2 gap-4 text-center">
                <div className="text-right bg-ligth/20 p-2 rounded-xl">
                  <p className="text-[10px] text-brown font-black">مديونية التاجر السابقة</p>
                  <p className="text-sm font-black text-dark">{oldBalance.toLocaleString()} EGP</p>
                </div>
                <div className="text-left bg-brown/5 p-2 rounded-xl border border-brown/10">
                  <p className="text-[10px] text-brown font-black">صافي مديونية التاجر الجديدة كلياً</p>
                  <p className="text-base font-black text-dark">{newBalance.toLocaleString()} EGP</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* الملاحظات وزر الحفظ */}
        <div className="space-y-4">
          <textarea
            className="w-full p-4 bg-white rounded-2xl border border-brwonLight outline-none text-right font-bold text-sm focus:border-brown"
            placeholder="ملاحظات عامة توثيقية إضافية تُحفظ بملف النقلة السجلّي..."
            rows="2"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brown hover:bg-brown/90 text-white p-4 rounded-xl font-black text-lg flex items-center justify-center gap-3 shadow-lg disabled:opacity-50 transition-all"
          >
            {loading ? "جاري ترحيل القيود وحفظ البيانات..." : <><Save size={22}/> إنشاء النقلة وربط الحسابات الماليّة</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DeliveryForm;