import { useState } from "react";
import { 
  LayoutDashboard, Users, BarChart3, 
  ChevronDown, Menu, X, 
  LogOut, Truck, User2Icon, 
  UsersIcon, Settings2, FactoryIcon, 
  ShoppingBag, Landmark, Package, 
  Cable, ShoppingBag as BagIcon, Wrench, Cog,
  FileText, PieChart
} from "lucide-react";
import { Link } from "react-router-dom";
import { showAlert } from "../services/alert";
import api from "../services/api";
import { useSystemSettings } from "../context/shareInfo";

const Sidebar = ({ role }) => {
  // إدارة فتح القوائم المتعددة
  const [openMenus, setOpenMenus] = useState({});
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  const { settings } = useSystemSettings();

  // دالة التبديل المستقلة
  const toggle = (menuId) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

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
      equipmentReport: "/advancedReport/equipment",
      suppliersReport: "/advancedReport/supplier",
      userActivityReport: "/advancedReport/user",

      // المشرفين والإعدادات
      manageUsers: "/admin/users",
      addManager: "/admin/add",
      profile: "/profile",
      settingsInfo: "/settings/info",
      activityLogs: "/settings/ActivityLogs",
    };
    return paths[id] || `/${id}`;
  };

  const menus = [
    { 
      id: "dashboard", 
      label: "لوحة التحكم", 
      icon: <LayoutDashboard size={20} />, 
      roles: ["admin", "manager", "superadmin"], 
      path: getDashboardPath() 
    },
    { 
      id: "customer", 
      label: "عملاء المبيعات", 
      icon: <Users size={20} />, 
      roles: ["admin", "manager", "superadmin"], 
      sub: [ 
        { id: "addCustomer", label: "إضافة عميل", roles: ["admin", "manager", "superadmin"] },
        { id: "allCustomers", label: "جميع العملاء", roles: ["admin", "manager", "superadmin"] }, 
        { id: "customerPayments", label: "تحصيلات العملاء", roles: ["admin", "superadmin", "manager"] } 
      ] 
    },
    { 
      id: "supplier", 
      label: "تجار المشتريات", 
      icon: <Users size={20} />, 
      roles: ["admin", "manager", "superadmin"], 
      sub: [ 
        { id: "addSupplier", label: "إضافة تاجر", roles: ["admin", "manager", "superadmin"] },
        { id: "allSuppliers", label: "جميع التجار", roles: ["admin", "manager", "superadmin"] }, 
        { id: "supplierPayments", label: "مدفوعات التجار", roles: ["admin", "superadmin", "manager"] } 
      ] 
    },
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

    /* ================= قسم المشتريات ================= */
    { 
      id: "purchases", 
      label: "المشتريات", 
      icon: <ShoppingBag size={20} />, 
      roles: ["admin", "manager", "superadmin"], 
      sub: [ 
        { 
          id: "equipmentGroup", 
          label: "المعدات", 
          icon: <Cog size={16} />,
          roles: ["admin", "manager", "superadmin"],
          isSubGroup: true,
          sub: [
            { id: "EquipmentManager", label: "إدارة المعدات", roles: ["admin", "manager", "superadmin"] },
            { id: "purchasesAdd", label: "إضافة فاتورة معدات", roles: ["admin", "manager", "superadmin"] },
            { id: "equipment", label: "جميع فواتير المعدات", roles: ["admin", "manager", "superadmin"] },
          ] 
        },
        { 
          id: "equipmentSupplyGroup", 
          label: "مستلزمات المعدات", 
          icon: <Package size={16} />,
          roles: ["admin", "manager", "superadmin"],
          isSubGroup: true,
          sub: [
            { id: "purchasesEquipment", label: "جميع فواتير المستلزمات", roles: ["admin", "manager", "superadmin"] },
            { id: "purchasesEquipmentAdd", label: "إضافة مستلزمات", roles: ["admin", "manager", "superadmin"] },
          ] 
        },
        { 
          id: "maintenanceGroup", 
          label: "الصيانة", 
          icon: <Wrench size={16} />,
          roles: ["admin", "manager", "superadmin"],
          isSubGroup: true,
          sub: [
            { id: "purchasesMaintenance", label: "جميع فواتير الصيانة", roles: ["admin", "manager", "superadmin"] },
            { id: "purchasesMaintenanceAdd", label: "إضافة صيانة", roles: ["admin", "manager", "superadmin"] },
          ] 
        },
        { 
          id: "wireGroup", 
          label: "الأسلاك", 
          icon: <Cable size={16} />,
          roles: ["admin", "manager", "superadmin"],
          isSubGroup: true,
          sub: [
            { id: "purchasesWireManager", label: "إدارة أنواع السلك", roles: ["admin", "manager", "superadmin"] },
            { id: "purchasesWire", label: "جميع فواتير الأسلاك", roles: ["admin", "manager", "superadmin"] },
            { id: "purchasesWireAdd", label: "إضافة سلك", roles: ["admin", "manager", "superadmin"] },
          ] 
        },
        { 
          id: "bagsGroup", 
          label: "الشكاير", 
          icon: <BagIcon size={16} />,
          roles: ["admin", "manager", "superadmin"],
          isSubGroup: true,
          sub: [
            { id: "purchasesBagsManager", label: "إدارة أنواع الشكاير", roles: ["admin", "manager", "superadmin"] },
            { id: "purchasesBags", label: "جميع فواتير الشكاير", roles: ["admin", "manager", "superadmin"] },
            { id: "purchasesBagsAdd", label: "إضافة شكاير", roles: ["admin", "manager", "superadmin"] },
          ] 
        },
        { id: "PurchasesHub", label: "سجل المشتريات الكلي", roles: ["admin", "manager", "superadmin"] }
      ] 
    },

    /* ================= قسم إدارة الأموال ================= */
    { 
      id: "moneyManagement", 
      label: "إدارة الأموال", 
      icon: <Landmark size={20} />, 
      roles: ["admin", "manager", "superadmin"], 
      sub: [ 
        { id: "MoneyDashboard", label: "لوحة الأموال", roles: ["admin", "manager", "superadmin"] },
        { id: "treasury", label: "حركة الخزنة (النقدية)", roles: ["admin", "manager", "superadmin"] },
        { id: "treasuryInventory", label: "جرد الخزنة", roles: ["admin", "manager", "superadmin"] },
        { id: "ChequeManagement", label: "إدارة الشيكات", roles: ["admin", "manager", "superadmin"] },
        { id: "expenses", label: "المصروفات", roles: ["admin", "manager", "superadmin"] }
      ] 
    },

    /* ================= قسم التقارير الشامل (العادية والمتقدمة) ================= */
    {
      id: "reportsSection",
      label: "التقارير",
      icon: <BarChart3 size={20} />,
      roles: ["admin", "manager", "superadmin"],
      sub: [
        // 1. رابط مركز التقارير العامة
        { id: "generalReports", label: "التقارير العامة (العادية)", roles: ["admin", "manager", "superadmin"] },
        
        // 2. مجموعة التقارير المتقدمة
        {
          id: "advancedReportsGroup",
          label: "التقارير المتقدمة",
          icon: <PieChart size={16} />,
          roles: ["admin", "manager", "superadmin"],
          isSubGroup: true,
          sub: [
            { id: "chequesReport", label: "تقرير الشيكات", roles: ["admin", "manager", "superadmin"] },
            { id: "customersReport", label: "تقرير العملاء", roles: ["admin", "manager", "superadmin"] },
            { id: "suppliersReport", label: "تقرير التجار", roles: ["admin", "manager", "superadmin"] },
            { id: "equipmentReport", label: "تقرير المعدات", roles: ["admin", "manager", "superadmin"] },
            { id: "userActivityReport", label: "تقرير نشاط المستخدمين", roles: ["admin", "manager", "superadmin"] },
          ]
        }
      ]
    },

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
        { id: "activityLogs", label: "سجل المتابعة للنظام", roles: ["superadmin", "manager"] }
  ,      { id: "BackupSettings", label: "  نظام النسخ الاحتياطي ", roles: ["superadmin", "manager"] }

        
      ] 
    },
  ];

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

  const hasAccess = (roles) => roles && roles.includes(role);

  // دالة لعرض العناصر الفرعية
  const renderSubItem = (subItem, depth = 0) => {
    if (subItem.isSubGroup) {
      const isOpen = !!openMenus[subItem.id];
      return (
        <div key={subItem.id} className="mb-1">
          <div 
            onClick={() => toggle(subItem.id)}
            className={`
              flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all duration-200
              ${isOpen ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50 hover:text-white'}
            `}
            style={{ paddingRight: `${16 + depth * 8}px` }}
          >
            <div className="flex items-center gap-2">
              <span className={`text-slate-400 ${isOpen ? 'text-blue-400' : ''}`}>
                {subItem.icon}
              </span>
              <span className="text-sm font-medium">{subItem.label}</span>
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
              {subItem.sub.filter(sub => hasAccess(sub.roles)).map(sub => (
                <Link 
                  key={sub.id} 
                  to={getPath(sub.id)}
                  onClick={() => setIsOpenMobile(false)}
                  className="block"
                >
                  <div className="cursor-pointer py-2 px-4 text-sm text-slate-400 hover:text-blue-400 hover:bg-slate-800/30 rounded-l-xl transition-colors">
                    {sub.label}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <Link 
        key={subItem.id} 
        to={getPath(subItem.id)}
        onClick={() => setIsOpenMobile(false)}
        className="block"
      >
        <div 
          className="cursor-pointer py-2 px-4 text-sm text-slate-400 hover:text-blue-400 hover:bg-slate-800/30 rounded-l-xl transition-colors"
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
          {menus.map(menu => hasAccess(menu.roles) && (
            <div key={menu.id} className="mb-1">
              {menu.sub ? (
                <>
                  <div 
                    onClick={() => toggle(menu.id)}
                    className={`
                      group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200
                      ${openMenus[menu.id] ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50 hover:text-white'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`${openMenus[menu.id] ? 'text-blue-400' : 'text-slate-400 group-hover:text-blue-400'}`}>
                        {menu.icon}
                      </span>
                      <span className="font-medium text-[15px]">{menu.label}</span>
                    </div>
                    
                    <ChevronDown 
                      size={16} 
                      className={`transition-transform duration-300 ${openMenus[menu.id] ? "rotate-180" : ""}`} 
                    />
                  </div>

                  {/* العناصر الفرعية */}
                  <div className={`
                    overflow-hidden transition-all duration-300 ease-in-out
                    ${openMenus[menu.id] ? "max-h-[1000px] opacity-100 mt-1" : "max-h-0 opacity-0"}
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
                      hover:bg-slate-800/50 hover:text-white
                    `}
                  >
                    <span className="text-slate-400 group-hover:text-blue-400">
                      {menu.icon}
                    </span>
                    <span className="font-medium text-[15px]">{menu.label}</span>
                  </div>
                </Link>
              )}
            </div>
          ))}
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