import { useState, useEffect } from "react";
import { 
  LayoutDashboard, Users, BarChart3, 
  ChevronDown, Menu, X, 
  LogOut, Truck, User2Icon, 
  UsersIcon, Settings2, FactoryIcon, 
  ShoppingBag, Landmark, Package, 
  Cable, ShoppingBag as BagIcon, Wrench, Cog,
  FileText, PieChart
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { showAlert } from "../services/alert";
import api from "../services/api";
import { useSystemSettings } from "../context/shareInfo";

const Sidebar = ({ role }) => {
  const location = useLocation();

  // أكورديون: مفتوح واحد بس في كل مستوى (الرئيسي، والفرعي)
  const [openMain, setOpenMain] = useState(null);
  const [openSub, setOpenSub] = useState(null);
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  const { settings } = useSystemSettings();

  const getDashboardPath = () => {
    switch(role) {
      case 'superadmin': return '/';
      case 'admin': return '/admin-dashboard';
      case 'manager': return '/manager_dashboard';
      default: return '/';
    }
  };

  // خريطة المسارات المطابقة لـ App.jsx
  const getPath = (id) => {
    const paths = {
      dashboard: getDashboardPath(),

      // العملاء / التجار
      addCustomer: "/customer/add",
      allCustomers: "/customer",
      customerPayments: "/customer/payments",
      addSupplier: "/supplier/add",
      allSuppliers: "/supplier",
      supplierPayments: "/supplier/payments",

      // ====== قسم المعدات والمشتريات ======
      EquipmentManager: "/equipment/EquipmentManager",
      purchasesAdd: "/equipment/add",
      equipment: "/equipment",
      
      purchasesEquipment: "/equipmentSupply",
      purchasesEquipmentAdd: "/equipmentSupply/add",
      
      purchasesMaintenance: "/Maintenance",
      purchasesMaintenanceAdd: "/Maintenance/add",
      
      purchasesWire: "/wire",
      purchasesWireAdd: "/wire/add",
      purchasesWireManager: "/wire/EquipmentManager",
      
      purchasesBags: "/bag",
      purchasesBagsAdd: "/bag/add",
      purchasesBagsManager: "/bag/EquipmentManager",
      
      PurchasesHub: "/PurchasesHub",

      // إدارة الأموال
      treasury: "/treasury",
      treasuryInventory: "/treasury/inventory",
      ChequeManagement: "/ChequeManagement",
      expenses: "/expenses",
      MoneyDashboard: "/MoneyDashboard",

      // النقل
      ManageItems: "/deliveries/ManageItems",
      addDelivery: "/deliveries/add",
      allDeliveries: "/deliveries",

      // ====== التقارير العادية (الرئيسية) ======
      generalReports: "/report",

      // ====== التقارير المتقدمة ======
      chequesReport: "/advancedReport/cheque",
      customersReport: "/advancedReport/customer",
      // equipmentReport: "/advancedReport/equipment",
      suppliersReport: "/advancedReport/delivery",
      userActivityReport: "/advancedReport/items",

      // المشرفين والإعدادات
      manageUsers: "/admin/users",
      addManager: "/admin/add",
      profile: "/profile",
      settingsInfo: "/settings/info",
      activityLogs: "/settings/ActivityLogs",
    };
    return paths[id] || `/${id}`;
  };

  // ====== ترتيب القائمة الجانبية: الأقسام الأساسية أولاً بنفس ترتيب سيستم الكسر ======
  const menus = [
    { 
      id: "dashboard", 
      label: "لوحة التحكم", 
      icon: <LayoutDashboard size={20} />, 
      roles: ["admin", "manager", "superadmin"], 
      path: getDashboardPath() 
    },

    // 2- التجار
    { 
      id: "customer", 
      label: "التجار", 
      icon: <Users size={20} />, 
      roles: ["admin", "manager", "superadmin"], 
      sub: [ 
        { id: "addCustomer", label: "إضافة تاجر", roles: ["admin", "manager", "superadmin"] },
        { id: "allCustomers", label: "جميع التجار", roles: ["admin", "manager", "superadmin"] }, 
        { id: "customerPayments", label: "التحصيلات", roles: ["admin", "superadmin", "manager"] } 
      ] 
    },

    // 3- النقل
    { 
      id: "deliveries", 
      label: "النقل", 
      icon: <Truck size={20} />, 
      roles: ["admin", "manager", "superadmin"], 
      sub: [
        { id: "ManageItems", label: "إدارة الأصناف", roles: ["admin", "manager", "superadmin"] }, 
        { id: "addDelivery", label: "إضافة ناقلة", roles: ["admin", "manager", "superadmin"] }, 
        { id: "allDeliveries", label: "جميع الناقلات", roles: ["admin", "manager", "superadmin"] } 
      ] 
    },

    // 4- إدارة الأموال
    { 
      id: "moneyManagement", 
      label: "إدارة الأموال", 
      icon: <Landmark size={20} />, 
      roles: ["admin", "manager", "superadmin"], 
      sub: [ 
        { id: "MoneyDashboard", label: "لوحة الأموال", roles: ["admin", "manager", "superadmin"] },
        { id: "treasury", label: "حركة الخزنة (النقدية)", roles: ["admin", "manager", "superadmin"] },
        { id: "treasuryInventory", label: "جرد الخزنة", roles: ["admin", "manager", "superadmin"] },

        { id: "expenses", label: "المصروفات", roles: ["admin", "manager", "superadmin"] }
      ] 
    },

    // 5- تجار المشتريات والصيانة
    { 
      id: "cheque", 
      label: "  قسم الشيكات", 
      icon: <Users size={20} />, 
      roles: ["admin", "manager", "superadmin"], 
      sub: [ 
        { id: "ChequeManagement", label: "إدارة الشيكات", roles: ["admin", "manager", "superadmin"] },
        { id: "addCheque", label: "اضافه شيك", roles: ["admin", "manager", "superadmin"] },
      ] 
    },

    // 6- التقارير
    {
      id: "reportsSection",
      label: "التقارير",
      icon: <BarChart3 size={20} />,
      roles: ["admin", "manager", "superadmin"],
      sub: [
        { id: "generalReports", label: "التقارير العامة (العادية)", roles: ["admin", "manager", "superadmin"] },
        {
          id: "advancedReportsGroup",
          label: "التقارير المتقدمة",
          icon: <PieChart size={16} />,
          roles: ["admin", "manager", "superadmin"],
          isSubGroup: true,
          sub: [
            { id: "chequesReport", label: "تقرير الشيكات", roles: ["admin", "manager", "superadmin"] },
            { id: "customersReport", label: "تقرير التجار ", roles: ["admin", "manager", "superadmin"] },
            { id: "suppliersReport", label: "تقرير النقل", roles: ["admin", "manager", "superadmin"] },
            { id: "userActivityReport", label: "تقرير الاصناف", roles: ["admin", "manager", "superadmin"] },
            // { id: "userActivityReport", label: "تقرير نشاط المستخدمين", roles: ["admin", "manager", "superadmin"] },
          ]
        }
      ]
    },

    /* ================= باقي الأقسام الأقل استخدامًا ================= */
    // { 
    //   id: "purchases", 
    //   label: "المشتريات", 
    //   icon: <ShoppingBag size={20} />, 
    //   roles: ["admin", "manager", "superadmin"], 
    //   sub: [ 
    //     { 
    //       id: "equipmentGroup", 
    //       label: "المعدات", 
    //       icon: <Cog size={16} />,
    //       roles: ["admin", "manager", "superadmin"],
    //       isSubGroup: true,
    //       sub: [
    //         { id: "EquipmentManager", label: "إدارة المعدات", roles: ["admin", "manager", "superadmin"] },
    //         { id: "purchasesAdd", label: "إضافة فاتورة معدات", roles: ["admin", "manager", "superadmin"] },
    //         { id: "equipment", label: "جميع فواتير المعدات", roles: ["admin", "manager", "superadmin"] },
    //       ] 
    //     },
    //     { 
    //       id: "equipmentSupplyGroup", 
    //       label: "مستلزمات المعدات", 
    //       icon: <Package size={16} />,
    //       roles: ["admin", "manager", "superadmin"],
    //       isSubGroup: true,
    //       sub: [
    //         { id: "purchasesEquipment", label: "جميع فواتير المستلزمات", roles: ["admin", "manager", "superadmin"] },
    //         { id: "purchasesEquipmentAdd", label: "إضافة مستلزمات", roles: ["admin", "manager", "superadmin"] },
    //       ] 
    //     },
    //     { 
    //       id: "maintenanceGroup", 
    //       label: "الصيانة", 
    //       icon: <Wrench size={16} />,
    //       roles: ["admin", "manager", "superadmin"],
    //       isSubGroup: true,
    //       sub: [
    //         { id: "purchasesMaintenance", label: "جميع فواتير الصيانة", roles: ["admin", "manager", "superadmin"] },
    //         { id: "purchasesMaintenanceAdd", label: "إضافة صيانة", roles: ["admin", "manager", "superadmin"] },
    //       ] 
    //     },
    //     // { 
    //     //   id: "wireGroup", 
    //     //   label: "الأسلاك", 
    //     //   icon: <Cable size={16} />,
    //     //   roles: ["admin", "manager", "superadmin"],
    //     //   isSubGroup: true,
    //     //   sub: [
    //     //     { id: "purchasesWireManager", label: "إدارة أنواع السلك", roles: ["admin", "manager", "superadmin"] },
    //     //     { id: "purchasesWire", label: "جميع فواتير الأسلاك", roles: ["admin", "manager", "superadmin"] },
    //     //     { id: "purchasesWireAdd", label: "إضافة سلك", roles: ["admin", "manager", "superadmin"] },
    //     //   ] 
    //     // },
    //     // { 
    //     //   id: "bagsGroup", 
    //     //   label: "الشكاير", 
    //     //   icon: <BagIcon size={16} />,
    //     //   roles: ["admin", "manager", "superadmin"],
    //     //   isSubGroup: true,
    //     //   sub: [
    //     //     { id: "purchasesBagsManager", label: "إدارة أنواع الشكاير", roles: ["admin", "manager", "superadmin"] },
    //     //     { id: "purchasesBags", label: "جميع فواتير الشكاير", roles: ["admin", "manager", "superadmin"] },
    //     //     { id: "purchasesBagsAdd", label: "إضافة شكاير", roles: ["admin", "manager", "superadmin"] },
    //     //   ] 
    //     // },
    //     { id: "PurchasesHub", label: "سجل المشتريات الكلي", roles: ["admin", "manager", "superadmin"] }
    //   ] 
    // },

    { 
      id: "admin", 
      label: "المشرفين", 
      icon: <UsersIcon size={20} />, 
      roles: ["superadmin"], 
      sub: [
        { id: "manageUsers", label: "إدارة المستخدمين", roles: ["superadmin"] }, 
        { id: "addManager", label: "إضافة مشرف", roles: ["superadmin"] }
      ] 
    },
    { 
      id: "profile", 
      label: "الصفحة الشخصية", 
      icon: <User2Icon size={20} />, 
      roles: ["superadmin", "manager", "admin"], 
      sub: [
        { id: "profile", label: "إدارة الصفحة الشخصية", roles: ["superadmin", "manager", "admin"] }
      ] 
    },
    { 
      id: "settings", 
      label: "الإعدادات", 
      icon: <Settings2 size={20} />, 
      roles: ["superadmin", "manager"], 
      sub: [
        { id: "settingsInfo", label: "إعدادات النظام", roles: ["superadmin", "manager"] },
        { id: "activityLogs", label: "سجل المتابعة للنظام", roles: ["superadmin", "manager"] },
        { id: "BackupSettings", label: "نظام النسخ الاحتياطي", roles: ["superadmin", "manager"] }
      ] 
    },
  ];

  const hasAccess = (roles) => roles && roles.includes(role);

  // ====== تحديد العنصر الحالي (Active) بناءً على مسار الصفحة ======
  const isPathActive = (id) => {
    const path = getPath(id);
    if (!path) return false;
    if (path === "/") return location.pathname === "/";
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  // هل أي عنصر داخل subItem (أو مجموعته الفرعية) هو النشط حاليًا؟
  const isBranchActive = (item) => {
    if (item.path && isPathActive(item.id)) return true;
    if (item.sub) {
      return item.sub.some((child) => isBranchActive(child));
    }
    return isPathActive(item.id);
  };

  // ====== فتح تلقائي للقائمة/القائمة الفرعية اللي فيها الصفحة الحالية ======
  useEffect(() => {
    let foundMain = null;
    let foundSub = null;

    for (const menu of menus) {
      if (!hasAccess(menu.roles)) continue;
      if (menu.sub && isBranchActive(menu)) {
        foundMain = menu.id;
        for (const sub of menu.sub) {
          if (sub.isSubGroup && isBranchActive(sub)) {
            foundSub = sub.id;
            break;
          }
        }
        break;
      }
    }

    setOpenMain(foundMain);
    setOpenSub(foundSub);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // فتح/قفل قائمة رئيسية — بيقفل أي قائمة رئيسية تانية وأي قائمة فرعية مفتوحة معاها
  const toggleMain = (menuId) => {
    setOpenMain((prev) => {
      const next = prev === menuId ? null : menuId;
      if (next !== prev) setOpenSub(null);
      return next;
    });
  };

  // فتح/قفل قائمة فرعية (subGroup) — بيقفل أي قائمة فرعية تانية مفتوحة في نفس المستوى
  const toggleSub = (subId) => {
    setOpenSub((prev) => (prev === subId ? null : subId));
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('token'); 
      if (typeof showAlert === 'function') {
        showAlert({ icon: "success", title: "تم تسجيل الخروج بنجاح" });
      }
      setTimeout(() => {
        window.location.href = '/login'; 
      }, 500);
      await api.post('/users/logout'); 
    } catch (err) {
      console.error("Logout Error:", err);
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  // دالة لعرض العناصر الفرعية
  const renderSubItem = (subItem, depth = 0) => {
    if (subItem.isSubGroup) {
      const isOpen = openSub === subItem.id;
      const active = isBranchActive(subItem);
      return (
        <div key={subItem.id} className="mb-1">
          <div 
            onClick={() => toggleSub(subItem.id)}
            className={`
              flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all duration-200
              ${isOpen ? 'bg-slate-800 text-white' : active ? 'text-blue-400' : 'hover:bg-slate-800/50 hover:text-white'}
            `}
            style={{ paddingRight: `${16 + depth * 8}px` }}
          >
            <div className="flex items-center gap-2">
              <span className={`${isOpen || active ? 'text-blue-400' : 'text-slate-400'}`}>
                {subItem.icon}
              </span>
              <span className={`text-sm ${active ? 'font-bold' : 'font-medium'}`}>{subItem.label}</span>
            </div>
            <ChevronDown 
              size={14} 
              className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} 
            />
          </div>
          
          <div className={`
            overflow-hidden transition-all duration-300 ease-in-out
            ${isOpen ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"}
          `}>
            <div className="mr-6 border-r border-slate-700 space-y-1">
              {subItem.sub.filter(sub => hasAccess(sub.roles)).map(sub => {
                const subActive = isPathActive(sub.id);
                return (
                  <Link 
                    key={sub.id} 
                    to={getPath(sub.id)}
                    onClick={() => setIsOpenMobile(false)}
                    className="block"
                  >
                    <div className={`
                      cursor-pointer py-2 px-4 text-sm rounded-l-xl transition-colors
                      ${subActive 
                        ? 'text-blue-400 font-bold bg-slate-800/50' 
                        : 'text-slate-400 hover:text-blue-400 hover:bg-slate-800/30'}
                    `}>
                      {sub.label}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    const active = isPathActive(subItem.id);
    return (
      <Link 
        key={subItem.id} 
        to={getPath(subItem.id)}
        onClick={() => setIsOpenMobile(false)}
        className="block"
      >
        <div 
          className={`
            cursor-pointer py-2 px-4 text-sm rounded-l-xl transition-colors
            ${active 
              ? 'text-blue-400 font-bold bg-slate-800/50' 
              : 'text-slate-400 hover:text-blue-400 hover:bg-slate-800/30'}
          `}
          style={{ paddingRight: `${16 + depth * 8}px` }}
        >
          {subItem.label}
        </div>
      </Link>
    );
  };

  return (
    <div className="no-print">
      {/* زر الموبايل */}
      <button 
        onClick={() => setIsOpenMobile(!isOpenMobile)}
        className="xl:hidden fixed top-4 left-4 z-50 p-2 bg-dark text-white rounded-md border border-slate-700 shadow-xl"
      >
        {isOpenMobile ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay للموبايل */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 xl:hidden transition-opacity"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Sidebar الرئيسي */}
      <div className={`
        fixed xl:static inset-y-0 right-0 z-40
        w-72 h-screen bg-dark text-slate-300 p-4 flex flex-col border-l border-slate-800
        transition-transform duration-300 ease-in-out transform
        ${isOpenMobile ? "translate-x-0" : "translate-x-full xl:translate-x-0"}
      `} dir="rtl">
        
        {/* الهيدر */}
        <div className="flex items-center gap-3 px-2 mb-8 mt-2">   
          <div className="w-8 h-8 text-white rounded-xl flex items-center justify-center bg-orange font-bold shrink-0">
            <FactoryIcon size={18} />
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide truncate">
            {settings?.factoryName || "لوحة التحكم"}
          </h2>
        </div>
        
        {/* القائمة Navigation */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar pr-1">
          {menus.map(menu => {
            if (!hasAccess(menu.roles)) return null;

            const isOpen = openMain === menu.id;
            const active = menu.path ? isPathActive(menu.id) : isBranchActive(menu);

            return (
              <div key={menu.id} className="mb-1">
                {menu.sub ? (
                  <>
                    <div 
                      onClick={() => toggleMain(menu.id)}
                      className={`
                        group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200
                        ${isOpen ? 'bg-slate-800 text-white' : active ? 'text-blue-400' : 'hover:bg-slate-800/50 hover:text-white'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`${isOpen || active ? 'text-blue-400' : 'text-slate-400 group-hover:text-blue-400'}`}>
                          {menu.icon}
                        </span>
                        <span className={`text-[15px] ${active ? 'font-bold' : 'font-medium'}`}>{menu.label}</span>
                      </div>
                      
                      <ChevronDown 
                        size={16} 
                        className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} 
                      />
                    </div>

                    {/* العناصر الفرعية */}
                    <div className={`
                      overflow-hidden transition-all duration-300 ease-in-out
                      ${isOpen ? "max-h-[1000px] opacity-100 mt-1" : "max-h-0 opacity-0"}
                    `}>
                      <div className="mr-4 border-r border-slate-700 space-y-1">
                        {menu.sub.filter(sub => hasAccess(sub.roles)).map(sub => renderSubItem(sub, 1))}
                      </div>
                    </div>
                  </>
                ) : (
                  <Link 
                    to={getPath(menu.id)} 
                    onClick={() => setIsOpenMobile(false)}
                  >
                    <div 
                      className={`
                        group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200
                        ${active ? 'bg-slate-800 text-blue-400' : 'hover:bg-slate-800/50 hover:text-white'}
                      `}
                    >
                      <span className={`${active ? 'text-blue-400' : 'text-slate-400 group-hover:text-blue-400'}`}>
                        {menu.icon}
                      </span>
                      <span className={`text-[15px] ${active ? 'font-bold' : 'font-medium'}`}>{menu.label}</span>
                    </div>
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        {/* كارت المستخدم وتسجيل الخروج */}
        <div className="mt-auto pt-4 shrink-0 bg-dark/5 p-2 rounded-3xl">
          <button 
            onClick={handleLogout}
            className="flex w-full mb-3 items-center gap-3 text-rose-500 hover:bg-rose-500/10 px-4 py-2.5 rounded-2xl transition-all duration-300 font-bold group"
          >
            <div className="bg-rose-500/10 p-2 rounded-xl group-hover:bg-rose-500/20 transition-colors">
              <LogOut size={18} />
            </div>
            <span className="text-sm">تسجيل الخروج</span>
          </button>

          <div className="flex items-center gap-3 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-orange flex items-center justify-center text-sm font-black text-white shadow-md">
              {role ? role[0].toUpperCase() : 'U'}
            </div>
            
            <div className="flex flex-col overflow-hidden">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                مرحباً بك
              </span>
              <span className="text-sm font-bold text-white truncate capitalize">
                {role === "superadmin" ? "مدير عام" : role === "admin" ? "مشرف" : "مدير"}
              </span>
            </div>

            <div className="mr-auto w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Sidebar;
