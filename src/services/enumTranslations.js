
const ENUM_TRANSLATIONS = {

  // Payment Methods

  cash: "نقدي (كاش)",
  wallet: "محفظة إلكترونية",
  instapay: "إنستا باي (InstaPay)",
  bank: "تحويل بنكي",
  mail: "بريد",
  work: "عمل / شغل",
  cheque: "شيك",


  // Money Flow 

  incoming: "استلام / مقبوضات",
  outgoing: "صادر / مدفوعات",
  income: "استلام",
  expense: "مصروف",


  // Modules & Categories

  delivery: "نقلة ",
  outdelivery: "نقلة خارجية",
  collection: "تحصيل",
  purchase: "شراء",
  pay: "دفع عميل",
  debt: "إضافة مديونية",
  maintenance: "صيانة",
  wire: "سلك",
  bag: "شكاير",
  equipment: "معدات",
  equipment_supply: "مستلزمات معدات",
  export: "تصدير",
  import: "استيراد",
  supplier: "تاجر",
  customer: "عميل",
  carPayment: "مصاريف سيارة",
  teaForWorker: "شاي واكراميات عمال",
  AddHand: "أجرة يد / إضافي",
  workerOut: "خارجية عمال",
  advance: "سلفة",
  deduction: "خصم / استقطاع",
  food: "وجبات / أكل",
  other: "أخرى",


  // Cheque Status & Types & Location

  normal: "عادي",
  clearing: "مقاصة",
  under_collection: "تحت التحصيل",
  due_today: "مستحق اليوم",
  collected: "تم التحصيل",
  returned: "مرتد / راجع",
  cancelled: "ملغي",
  with_me: "معي (بالحافظة)",
  collector: "مع المحصل",
  delivered: "تم تسليمه",
  archived: "مؤرشف",


  // Payment Status 

  paid: "مدفوع بالكامل",
  partial: "مدفوع جزئياً",
  unpaid: "غير مدفوع",
};


export const translateEnum = (key, fallback = "—") => {
  if (!key) return fallback;
  return ENUM_TRANSLATIONS[key.toString().toLowerCase()] || key;
};