import { useState } from 'react';
import { Printer } from 'lucide-react';

import {
  ExpenseReport,
  ItemsReport,
  OutDeliveryReport,
  ChequeReport,
  PaymentReport,
  TransactionReport,
  CustomerReport,
  SupplierReport,
  BagPurchaseReport,
  BagTypeReport,
  EquipmentReport,
  EquipmentPartReport,
  EquipmentSupplyReport,
  MaintenanceReport,
  WirePurchaseReport,
  WireTypeReport,
} from './index';
import { useSystemSettings } from '../../context/shareInfo';

const NAV = [


  { key: 'out-delivery', label: 'النقلات الصادرة', Component: OutDeliveryReport },
  { key: 'cheque', label: 'الشيكات', Component: ChequeReport },
  { key: 'payment', label: 'المدفوعات', Component: PaymentReport },
  { key: 'customer', label: 'العملاء', Component: CustomerReport },
  { key: 'supplier', label: 'التاجرين', Component: SupplierReport },
  { key: 'bag-purchase', label: 'شراء الشكاير', Component: BagPurchaseReport },
  { key: 'equipment', label: 'شراء المعدات', Component: EquipmentReport },
  { key: 'equipment-supply', label: 'مستلزمات المعدات', Component: EquipmentSupplyReport },
  { key: 'maintenance', label: 'الصيانة', Component: MaintenanceReport },
  { key: 'wire-purchase', label: 'شراء السلك', Component: WirePurchaseReport },

];

export default function ReportsApp() {
  const [active, setActive] = useState(NAV[0].key);
  const { settings } = useSystemSettings();

  const ActiveComponent = NAV.find((n) => n.key === active)?.Component;

  // دالة الطباعة المباشرة
  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      dir="rtl"
      className="flex flex-col min-h-screen text-slate-800  w-[100vw] lg:w-[86vw]"
      style={{
        fontFamily: settings?.systemFont ? `var(--system-font), sans-serif` : 'inherit',
        backgroundColor: 'var(--background)',
      }}
    >
      {/* Horizontal Nav Bar - أخفي عند الطباعة (print:hidden) */}
      <header
        className="sticky overflow-auto w-[100vw] lg:w-[85vw] top-0 z-36 border-b shadow-sm print:hidden"
        style={{
          backgroundColor: 'var(--primary)',
          borderColor: 'var(--secondary)',
        }}
      >
        <div className="flex items-center  overflow-auto w-full justify-between px-4 py-3 gap-4">
          {/* عنوان القسم */}
          <h1 className="text-xl font-bold whitespace-nowrap text-white flex items-center gap-2">
            التقارير
          </h1>

          {/* قائمة التنقل - تدعم overflow-x-auto */}
          <nav className="flex items-center gap-2 overflow-x-auto py-1 px-2 overflow-x-auto w-full max-w-full">
            {NAV.map((n) => {
              const isActive = active === n.key;
              return (
                <button
                  key={n.key}
                  onClick={() => setActive(n.key)}
                  className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                    isActive
                      ? 'shadow-md scale-105'
                      : 'hover:bg-white/10 opacity-80 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: isActive ? 'var(--secondary)' : 'transparent',
                    color: '#ffffff',
                    borderColor: isActive ? 'var(--accent)' : 'transparent',
                  }}
                >
                  {n.label}
                </button>
              );
            })}
          </nav>

          {/* زر الطباعة */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm transition hover:opacity-90 shrink-0"
            style={{
              backgroundColor: 'var(--secondary)',
            }}
          >
            <Printer size={16} />
            طباعة
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-6 overflow-auto print:p-0 print:overflow-visible">
        {/* الحاوية القابلة للطباعة */}
        <div id="printable-report" className="print:w-full">
          {ActiveComponent && <ActiveComponent />}
        </div>
      </main>

      {/* تنسيقات الشاشة والطباعة المخصصة */}
      <style>{`
        @media print {
          body {
            background-color: #fff !important;
            color: #000 !important;
          }
          /* إخفاء الهيدر وأي أزرار غير مطلوبة عند الطباعة */
          header, .print\\:hidden {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }
        }
      `}</style>
    </div>
  );
}