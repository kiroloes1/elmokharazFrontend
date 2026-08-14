import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Save, Wrench, Search, Notebook, CreditCard, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../../../services/api";
import { showAlert } from "../../../services/alert";

const CreateWireForm = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [supSearch, setSupSearch] = useState("");
  const [showSupList, setShowSupList] = useState(false);

  // قائمة أنواع الأسلاك (Wire Types) للاقتراح التلقائي
  const [wireTypes, setWireTypes] = useState([]);
  const [wireSearch, setWireSearch] = useState("");
  const [showWireList, setShowWireList] = useState(false);

  const [walletSearch, setWalletSearch] = useState("");
  const [showWalletList, setShowWalletList] = useState(false);
  const [activeWalletIdx, setActiveWalletIdx] = useState(null);
  const [suggestionWallets, setSuggestionWallets] = useState([]);

  const [formData, setFormData] = useState({
    supplier: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    notes: "",
    note: "",
    payment: [
      {
        paidAmount: 0,
        paymentMethod: "cash",
        bankInfo: { bankName: "", transactionReference: "" },
        walletInfo: {
          provider: "",
          senderName: "",
          senderPhone: "",
          receiverName: "",
          receiverPhone: "",
          transactionReference: "",
          linkWallet: true,
          walletId: "",
        },
        cheque: {
          chequeNumber: "",
          chequeType: "normal",
          bankName: "",
          receiveDate: "",
          dueDate: "",
          status: "under_collection",
        },
      },
    ],
    items: [
      {
        wireType: "",
        wireTypeName: "",
        size: "",
        quantity: 1,
        unitPrice: 0,
        total: 0,
        notes: "",
      },
    ],
  });

  const [remainingOutgoing, setRemainingOutgoing] = useState(0);
  const [balance, setBalance] = useState(null);

  const wireRef = useRef(null);

  const navigate = useNavigate();

  // ===== جلب التجار =====
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await api.get("/suppliers");
        setSuppliers(res.data.data || res.data.suppliers || []);
      } catch (err) {
        console.error("Error fetching suppliers", err);
      }
    };
    fetchSuppliers();
  }, []);

  // ===== جلب أنواع الأسلاك للاقتراح =====
  const fetchWireTypes = async () => {
    try {
      setLoading(true);
      const response = await api.get("/wiretype");
    
        const wireNames = response.data.wireTypes.map(wt => ({
          _id: wt._id,
          name: wt.name,
          notes: wt.notes
        }));
        setWireTypes(wireNames);
      
    } catch (err) {
      showAlert({
        title: "حدث خطأ أثناء جلب بيانات أنواع الأسلاك",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWireTypes();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wireRef.current && !wireRef.current.contains(e.target)) {
        setShowWireList(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ===== جلب اقتراحات المحافظ =====
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

  // ===== حسابات الأصناف =====
  const calculateItemTotal = (item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    return quantity * unitPrice;
  };

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

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { wireType: "", wireTypeName: "", size: "", quantity: 1, unitPrice: 0, total: 0, notes: "" },
      ],
    });
  };

  const removeItem = (idx) => {
    const newItems = formData.items.filter((_, i) => i !== idx);
    setFormData({ ...formData, items: newItems });
  };

  const selectedSupplier = suppliers.find((s) => s._id === formData.supplier);
  const oldBalance = selectedSupplier ? selectedSupplier.balance : 0;

  const totalAmount = formData.items.reduce((acc, item) => acc + calculateItemTotal(item), 0);
  const totalPaidAmount = formData.payment.reduce((acc, p) => acc + Number(p.paidAmount || 0), 0);
  const netDue = totalAmount - totalPaidAmount;
  const newBalance = oldBalance + netDue;

  // ===== إدارة طرق الدفع =====
  const addPaymentField = () => {

    const allMethods = ["cash", "wallet", "instapay", "bank", "mail", "cheque", "work"];
    const unusedMethod =
      allMethods.find((method) => !formData.payment.some((m) => m.paymentMethod === method)) ||
      "cash";

    setFormData({
      ...formData,
      payment: [
        ...formData.payment,
        {
          paidAmount: 0,
          paymentMethod: unusedMethod,
          bankInfo: { bankName: "", transactionReference: "" },
          walletInfo: {
            provider: "",
            senderName: "",
            senderPhone: "",
            receiverName: "",
            receiverPhone: "",
            transactionReference: "",
            linkWallet: true,
            walletId: "",
          },
          cheque: {
            chequeNumber: "",
            chequeType: "normal",
            bankName: "",
            receiveDate: "",
            dueDate: "",
            status: "under_collection",
          },
        },
      ],
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
        const isDuplicate = formData.payment.some(
          (m, i) => i !== idx && m.paymentMethod === value
        );
        // if (isDuplicate) {
        //   showAlert({ title: "لا يمكن تكرار طريقة الدفع في نفس الفاتورة", icon: "error" });
        //   return;
        // }
      }
      newPayments[idx][field] = field === "paidAmount" ? Number(value) : value;
    }

    setFormData({ ...formData, payment: newPayments });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.supplier) return showAlert({ title: "برجاء اختيار التاجر أولاً", icon: "warning" });

    if (
      formData.items.some(
        (i) => !i.wireType || !i.size || Number(i.quantity) < 1 || Number(i.unitPrice) < 0
      )
    ) {
      return showAlert({ 
        title: "تأكد من بيانات الأسلاك (نوع السلك، المقاس، الكمية، السعر)", 
        icon: "warning" 
      });
    }

    for (const p of formData.payment) {
      if (
        (p.paymentMethod === "bank" || p.paymentMethod === "instapay") &&
        (!p.bankInfo.bankName || !p.bankInfo.transactionReference)
      ) {
        return showAlert({ title: "برجاء ملء بيانات البنك / إنستا باي المطلوبة بالكامل", icon: "warning" });
      }
      if (p.paymentMethod === "wallet" && (!p.walletInfo.senderPhone || !p.walletInfo.receiverPhone)) {
        return showAlert({ title: "برجاء ملء بيانات المحفظة الإلكترونية الأساسية", icon: "warning" });
      }
      if (
        p.paymentMethod === "cheque" &&
        (!p.cheque.chequeNumber || !p.cheque.bankName || !p.cheque.dueDate)
      ) {
        return showAlert({ title: "برجاء ملء بيانات الشيك الأساسية (الرقم، البنك، الاستحقاق)", icon: "warning" });
      }
    }

    setLoading(true);
    try {
      const payload = {
        supplier: formData.supplier,
        purchaseDate: formData.purchaseDate,
        items: formData.items.map((i) => ({
          wireType: i.wireType,
          size: i.size,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          total: Number(i.total) || (Number(i.quantity) * Number(i.unitPrice)),
          notes: i.notes || ""
        })),
        notes: formData.notes || "",
        note: formData.note || "",
        payment: formData.payment.map(p => ({
          paidAmount: Number(p.paidAmount),
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

      await api.post("/wire", payload);
      showAlert({ title: "تم تسجيل فاتورة شراء الأسلاك وتحديث الحسابات بنجاح", icon: "success" });
      navigate("/wire");
    } catch (err) {
      showAlert({ title: err.response?.data?.message || "خطأ أثناء الحفظ", icon: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mx-auto p-4 lg:p-8 bg-ligth/10" dir="rtl">
      <form onSubmit={handleSubmit} className="space-y-6 h-[100vh] overflow-auto pb-32 pr-2">
        {/* قسم التاجر والتاريخ */}
        <div className="bg-white p-6 rounded-2xl border border-brwonLight shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div className="space-y-2 relative text-right">
            <label className="block font-black text-dark text-sm">التاجر</label>
            <div className="relative">
              <Search className="absolute right-3 top-3.5 text-brown/50" size={18} />
              <input
                type="text"
                className="w-full p-3 pr-10 bg-ligth/20 border border-brown/10 rounded-xl outline-none font-bold text-dark focus:border-brown focus:ring-1 focus:ring-brown"
                placeholder="ابحث عن اسم التاجر للربط المالي..."
                value={supSearch}
                onFocus={() => setShowSupList(true)}
                onChange={(e) => setSupSearch(e.target.value)}
              />
            </div>
            {showSupList && supSearch.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-brwonLight rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                {suppliers
                  .filter((s) => s.name.includes(supSearch))
                  .map((s) => (
                    <div
                      key={s._id}
                      className="p-4 hover:bg-ligth/40 cursor-pointer flex justify-between items-center border-b border-ligth last:border-b-0 text-dark transition-all"
                      onClick={() => {
                        setFormData({ ...formData, supplier: s._id });
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
            <label className="block font-black text-dark text-sm flex items-center gap-2">
              <Calendar size={18} className="text-brown" /> تاريخ الشراء
            </label>
            <input
              type="date"
              className="w-full p-3 bg-ligth/20 border border-brown/10 rounded-xl outline-none font-bold text-dark focus:border-brown focus:ring-1 focus:ring-brown"
              value={formData.purchaseDate}
              onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
            />
          </div>
        </div>

        {/* قسم الأسلاك */}
        <div className="space-y-4">
          <div className="sticky top-0 z-30 bg-ligth/10 backdrop-blur py-2 flex justify-between items-center border-b border-brown/10 mb-4">
            <h3 className="text-lg font-black text-dark flex items-center gap-2">
              <Wrench size={22} className="text-brown" /> أصناف الأسلاك المشتراة
            </h3>
            <button
              type="button"
              onClick={addItem}
              className="bg-brown hover:bg-brown/90 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-black shadow-md transition-all"
            >
              <Plus size={18} /> إضافة سلك جديد
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.items.map((item, idx) => {
              const total = calculateItemTotal(item);
              return (
                <div
                  key={idx}
                  className="bg-white p-5 rounded-2xl border border-brwonLight shadow-sm relative space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* نوع السلك مع اقتراح تلقائي */}
                    <div className="text-right relative" ref={wireRef}>
                      <label className="text-xs font-black text-dark">نوع السلك</label>
                      <div className="relative">
                        <Search className="absolute right-3 top-2.5 text-brown/50" size={16} />
                        <input
                          type="text"
                          className="w-full p-2.5 pr-8 mt-1 bg-ligth/20 border border-brown/10 rounded-xl outline-none font-bold text-dark focus:border-brown"
                          placeholder="ابحث عن نوع السلك..."
                          value={item.wireTypeName || ""}
                          onFocus={() => setShowWireList(true)}
                          onChange={(e) => {
                            const value = e.target.value;
                            setShowWireList(true);
                            // البحث عن النوع المطابق
                            const found = wireTypes.find(w => w.name === value);
                            if (found) {
                              handleItemChange(idx, "wireType", found._id);
                              handleItemChange(idx, "wireTypeName", found.name);
                            } else {
                              handleItemChange(idx, "wireType", "");
                              handleItemChange(idx, "wireTypeName", value);
                            }
                          }}
                        />
                      </div>
                      {showWireList && wireTypes.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-brwonLight rounded-xl shadow-2xl max-h-40 overflow-y-auto">
                          {wireTypes
                            .filter((wt) => 
                              wt.name.toLowerCase().includes((item.wireTypeName || "").toLowerCase())
                            )
                            .map((wt) => (
                              <div
                                key={wt._id}
                                className="p-2.5 hover:bg-ligth/40 cursor-pointer font-bold text-sm border-b border-ligth last:border-b-0 transition-all"
                                onClick={() => {
                                  handleItemChange(idx, "wireType", wt._id);
                                  handleItemChange(idx, "wireTypeName", wt.name);
                                  setShowWireList(false);
                                }}
                              >
                                {wt.name}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <label className="text-xs font-black text-dark">المقاس</label>
                      <input
                        type="text"
                        className="w-full p-2.5 mt-1 bg-ligth/20 border border-brown/10 rounded-xl outline-none font-bold text-dark focus:border-brown"
                        placeholder="مثال: 2.5 مم, 4 مم..."
                        value={item.size}
                        onChange={(e) => handleItemChange(idx, "size", e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-right">
                        <label className="text-xs font-black text-dark">الكمية</label>
                        <input
                          type="number"
                          min="1"
                          className="w-full p-2.5 mt-1 bg-ligth/20 border border-brown/10 rounded-xl font-black text-brown outline-none focus:border-brown"
                          value={item.quantity || 1}
                          onChange={(e) => handleItemChange(idx, "quantity", Math.max(1, Number(e.target.value)))}
                        />
                      </div>
                      <div className="text-right">
                        <label className="text-xs font-black text-dark">سعر الوحدة (EGP)</label>
                        <input
                          type="number"
                          min="0"
                          className="w-full p-2.5 mt-1 bg-ligth/20 border border-brown/10 rounded-xl font-black text-brown outline-none focus:border-brown"
                          value={item.unitPrice === 0 ? "" : item.unitPrice}
                          onChange={(e) => handleItemChange(idx, "unitPrice", Math.max(0, Number(e.target.value)))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-right">
                        <label className="text-xs font-black text-dark">الإجمالي</label>
                        <div className="w-full p-2.5 mt-1 bg-brown/10 rounded-xl font-black text-brown text-center">
                          {total.toLocaleString()} EGP
                        </div>
                      </div>
                      <div className="text-right">
                        <label className="text-xs font-black text-dark">ملاحظات</label>
                        <input
                          type="text"
                          className="w-full p-2.5 mt-1 bg-ligth/20 border border-brown/10 rounded-xl outline-none font-bold text-dark focus:border-brown"
                          placeholder="اختياري"
                          value={item.notes}
                          onChange={(e) => handleItemChange(idx, "notes", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="absolute top-2 left-2 text-brown/30 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* الحسابات والماليات */}
        <div className="bg-white p-6 rounded-2xl border border-brwonLight shadow-sm space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            {/* طرق الدفع المتعددة وتفاصيلها الفرعية */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-ligth pb-2">
                <label className="font-black text-dark text-base flex items-center gap-2">
                  <CreditCard size={18} className="text-brown" /> طرق سداد النقدية للتاجر
                </label>
                <button
                  type="button"
                  onClick={addPaymentField}
                  className="text-brown hover:text-dark text-xs font-black flex items-center gap-1"
                >
                  <Plus size={16} /> إضافة وسيلة سداد
                </button>
              </div>

              {formData.payment.map((pay, pIdx) => (
                <div
                  key={pIdx}
                  className="bg-ligth/10 p-4 rounded-xl border border-brwonLight/60 space-y-3"
                >
                  <div className="flex gap-2 items-center">
                    <select
                      className="bg-white p-2.5 rounded-xl border border-brown/15 text-sm font-bold outline-none text-dark focus:border-brown"
                      value={pay.paymentMethod}
                      onChange={(e) => handlePaymentChange(pIdx, "paymentMethod", e.target.value)}
                    >
                      <option value="cash">نقدي (كاش)</option>
                      <option value="bank">تحويل بنكي</option>
                      <option value="instapay">إنستا باي</option>
                      <option value="wallet">محفظة الكترونية</option>
                      <option value="cheque">شيك بنكي</option>
                      <option value="mail">مكتب البريد</option>
                      <option value="work">خصم من الشغل</option>
                    </select>

                    <input
                      type="number"
                      placeholder="المبلغ المدفوع"
                      className="flex-1 p-2.5 rounded-xl border border-brown/15 text-center font-black text-dark outline-none focus:border-brown"
                      value={pay.paidAmount || ""}
                      onChange={(e) => handlePaymentChange(pIdx, "paidAmount", e.target.value)}
                    />

                    {formData.payment.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePaymentField(pIdx)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>

                  {/* بنك / إنستا باي */}
                  {(pay.paymentMethod === "bank" || pay.paymentMethod === "instapay") && (
                    <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-lg border border-brown/10 shadow-inner">
                      <div className="text-right">
                        <label className="text-[11px] font-black text-brown block mb-1">اسم البنك / المنصة</label>
                        <input
                          type="text"
                          placeholder="مثال: بنك مصر / إنستاباي"
                          className="w-full p-2 bg-ligth/20 border rounded-lg text-xs font-bold"
                          value={pay.bankInfo?.bankName || ""}
                          onChange={(e) => handlePaymentChange(pIdx, "bankInfo", e.target.value, "bankName")}
                        />
                      </div>
                      <div className="text-right">
                        <label className="text-[11px] font-black text-brown block mb-1">رقم مرجع المعاملة (Ref)</label>
                        <input
                          type="text"
                          placeholder="رقم التحويل أو العملية"
                          className="w-full p-2 bg-ligth/20 border rounded-lg text-xs font-bold"
                          value={pay.bankInfo?.transactionReference || ""}
                          onChange={(e) =>
                            handlePaymentChange(pIdx, "bankInfo", e.target.value, "transactionReference")
                          }
                        />
                      </div>
                    </div>
                  )}

                  {/* محفظة الكترونية */}
                  {pay.paymentMethod === "wallet" && (
                    <div className="p-4 space-y-4 rounded-lg border bg-white shadow-inner border-brown/10">
                      <div className="flex gap-3 items-center p-3 rounded-lg bg-light/20">
                        <input
                          type="checkbox"
                          disabled={true}
                          checked={pay.walletInfo?.linkWallet || true}
                          onChange={(e) =>
                            handlePaymentChange(pIdx, "walletInfo", e.target.checked, "linkWallet")
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
                            placeholder="رقم هاتف التاجر المستلم"
                            value={pay.walletInfo?.receiverPhone || ""}
                            onChange={(e) =>
                              handlePaymentChange(pIdx, "walletInfo", e.target.value, "receiverPhone")
                            }
                          />
                        </div>
                        <div className="w-full text-right">
                          <label className="block mb-1 text-[11px] font-black text-brown">اسم المستلم</label>
                          <input
                            type="text"
                            className="p-2 w-full text-xs font-bold rounded-lg border bg-light/20"
                            placeholder="اسم التاجر المستلم"
                            value={pay.walletInfo?.receiverName || ""}
                            onChange={(e) =>
                              handlePaymentChange(pIdx, "walletInfo", e.target.value, "receiverName")
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
                                handlePaymentChange(pIdx, "walletInfo", e.target.value, "senderPhone")
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
                                handlePaymentChange(pIdx, "walletInfo", e.target.value, "senderName")
                              }
                            />
                          </div>
                        </div>
                      )}

                      {pay.walletInfo?.linkWallet && (
                        <div className="relative text-right">
                          <label className="block mb-1 text-[11px] font-black text-brown">المحفظة المرسلة</label>
                          <input
                            type="text"
                            className="p-2 w-full text-xs font-bold rounded-lg border bg-light/20"
                            placeholder="ابحث بالاسم أو رقم المحفظة..."
                            value={activeWalletIdx === pIdx ? walletSearch : ""}
                            onFocus={() => {
                              setActiveWalletIdx(pIdx);
                              setShowWalletList(true);
                            }}
                            onChange={(e) => {
                              setWalletSearch(e.target.value);
                              setActiveWalletIdx(pIdx);
                              setShowWalletList(true);
                            }}
                          />

                          {showWalletList && activeWalletIdx === pIdx && walletSearch.length > 0 && (
                            <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto bg-white rounded-xl border shadow-xl">
                              {suggestionWallets
                                .filter(
                                  (w) =>
                                    w.walletName.toLowerCase().includes(walletSearch.toLowerCase()) ||
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
                                      setFormData({ ...formData, payment: newPayments });
                                      setWalletSearch(wallet.walletName);
                                      setBalance(wallet?.balance);
                                      setShowWalletList(false);
                                      setRemainingOutgoing(wallet?.remainingOutgoing);
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

                      {pay.walletInfo?.walletId && pay.walletInfo?.linkWallet && (
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                          <div>
                            <label className="block mb-1 text-[11px] font-black text-brown">اسم المرسل</label>
                            <input
                              readOnly
                              value={pay.walletInfo.senderName || ""}
                              className="p-2 w-full text-xs font-bold bg-gray-100 rounded-lg border"
                            />
                          </div>

                          <div>
                            <label className="block mb-1 text-[11px] font-black text-brown">رقم المرسل</label>
                            <input
                              readOnly
                              value={pay.walletInfo.senderPhone || ""}
                              className="p-2 w-full text-xs font-bold bg-gray-100 rounded-lg border"
                            />
                          </div>

                          <div>
                            <label className="block mb-1 text-[11px] font-black text-brown">رصيد المحفظة</label>
                            <input
                              readOnly
                              value={balance || ""}
                              className="p-2 w-full text-xs font-bold bg-gray-100 rounded-lg border"
                            />
                          </div>

                          <div>
                            <label className="block mb-1 text-[11px] font-black text-brown">المتبقي للإرسال</label>
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

                  {/* شيك بنكي */}
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
                          <input
                            type="text"
                            className="w-full p-2 bg-ligth/20 border rounded-lg text-xs font-bold"
                            value={pay.cheque?.bankName || ""}
                            onChange={(e) => handlePaymentChange(pIdx, "cheque", e.target.value, "bankName")}
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
                          <label className="text-[11px] font-black text-brown block mb-1">تاريخ الاستحقاق</label>
                          <input
                            type="date"
                            className="w-full p-2 bg-ligth/20 border rounded-lg text-xs font-bold"
                            value={pay.cheque?.dueDate || ""}
                            onChange={(e) => handlePaymentChange(pIdx, "cheque", e.target.value, "dueDate")}
                          />
                        </div>
                        <div className="text-right">
                          <label className="text-[11px] font-black text-brown block mb-1">نوع الشيك</label>
                          <select
                            className="w-full p-2 bg-ligth/20 border rounded-lg text-xs font-bold"
                            value={pay.cheque?.chequeType}
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
                            value={pay.cheque?.status}
                            onChange={(e) => handlePaymentChange(pIdx, "cheque", e.target.value, "status")}
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

            {/* بيان حركة الخزنة */}
            <div className="space-y-4 bg-ligth/10 p-4 rounded-2xl border border-brwonLight">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2 text-right">
                  <label className="text-xs font-black text-dark">بيان حركة الخزنة الرئيسي</label>
                  <input
                    type="text"
                    className="w-full p-3 bg-white border border-brown/10 rounded-xl font-bold text-sm text-dark"
                    placeholder="الحركة المرتبطة بدفتر الخزينة العام..."
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ملخص الحساب المالي الإجمالي */}
          <div className="bg-white border border-brwonLight rounded-2xl overflow-hidden shadow-lg">
            <div className="bg-ligth p-4 flex justify-between items-center border-b border-brwonLight">
              <h4 className="font-black text-dark flex items-center gap-2 text-sm">
                <Notebook size={18} className="text-brown" /> ملخص وتأثير الحساب المالي النهائي للتاجر
              </h4>
              <span className="text-xs font-bold text-brown">تاريخ الشراء: {formData.purchaseDate}</span>
            </div>

            <div className="p-5 space-y-3.5 font-bold text-xs text-dark">
              <div className="flex justify-between items-center text-dark/80">
                <span>إجمالي قيمة الأسلاك المشتراة:</span>
                <span className="font-black text-sm">{totalAmount.toLocaleString()} EGP</span>
              </div>

              <div className="h-px bg-ligth my-2"></div>

              <div className="flex justify-between items-center text-emerald-700 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
                <span className="font-black">إجمالي المبالغ المدفوعة للتاجر:</span>
                <span className="font-black text-sm">-{totalPaidAmount.toLocaleString()} EGP</span>
              </div>

              <div className="bg-ligth/30 p-3 rounded-xl border border-brown/5 flex justify-between items-center">
                <span className="text-dark/80 font-black">المتبقي من هذه الفاتورة (الحالي):</span>
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
            placeholder="ملاحظات عامة توثيقية إضافية تُحفظ بملف فاتورة شراء الأسلاك..."
            rows="2"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brown hover:bg-brown/90 text-white p-4 rounded-xl font-black text-lg flex items-center justify-center gap-3 shadow-lg disabled:opacity-50 transition-all"
          >
            {loading ? (
              "جاري ترحيل القيود وحفظ بيانات شراء الأسلاك..."
            ) : (
              <>
                <Save size={22} /> إنشاء فاتورة شراء أسلاك وربط الحسابات المالية
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateWireForm;