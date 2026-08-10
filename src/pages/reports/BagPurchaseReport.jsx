import ReportPage from './ReportPage';
import { formatDate, formatCurrency } from './format';

const STATUS_OPTIONS = [
  { value: 'paid', label: 'مدفوع' },
  { value: 'partial', label: 'مدفوع جزئياً' },
  { value: 'unpaid', label: 'غير مدفوع' },
];

export default function BagPurchaseReport() {
  return (
    <ReportPage
      title="تقرير شراء الشكاير"
      endpoint="bag-purchase"
      filterFields={[
        { key: 'from', label: 'من تاريخ', type: 'date' },
        { key: 'to', label: 'إلى تاريخ', type: 'date' },
                        {
          key: 'supplier',
          label: '',
          type: 'supplier-search',
          placeholder: 'ابحث باسم التاجر...',
        },
        { key: 'paymentStatus', label: 'حالة السداد', type: 'select', options: STATUS_OPTIONS },
      ]}
      columns={[
        { key: 'purchaseDate', label: 'التاريخ', render: (r) => formatDate(r.purchaseDate) },
        { key: 'invoiceNumber', label: 'رقم الفاتورة' },
        { key: 'supplier', label: 'التاجر', render: (r) => r.supplier?.name || '—' },
        // { key: 'totalAmount', label: 'الإجمالي', render: (r) => formatCurrency(r.totalAmount) },
        // { key: 'paidAmount', label: 'المدفوع', render: (r) => formatCurrency(r.paidAmount) },
        // { key: 'remainingAmount', label: 'المتبقي', render: (r) => formatCurrency(r.remainingAmount) },
        { key: 'paymentStatus', label: 'حالة السداد' },
      ]}
      buildSummaryItems={(s) => [
        { label: 'إجمالي المشتريات', value: s.totalAmount, format: 'currency' },
        // { label: 'المدفوع', value: s.paidAmount, format: 'currency' },
        // { label: 'المتبقي', value: s.remainingAmount, format: 'currency' },
        { label: 'عدد الفواتير', value: s.count, format: 'number' },
      ]}
    />
  );
}
