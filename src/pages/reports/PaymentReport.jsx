import ReportPage from './ReportPage';
import { formatDate, formatCurrency } from './format';

const MONEY_FLOW_OPTIONS = [
  { value: 'incoming', label: 'استلام' },
  { value: 'outgoing', label: 'دفع' },
];

const METHOD_OPTIONS = [
  { value: 'cash', label: 'كاش' },
  { value: 'wallet', label: 'محفظة' },
  { value: 'bank', label: 'بنك' },
  { value: 'instapay', label: 'إنستاباي' },
  { value: 'mail', label: 'بريد' },
  { value: 'cheque', label: 'شيك' },
  { value: 'work', label: 'أعمال' },
];

const MODULE_OPTIONS = [
  { value: 'delivery', label: 'نقلة' },
  { value: 'pay', label: 'دفع ' },
  { value: 'debt', label: 'مديونية' },
  { value: 'equipment_supply', label: 'مستلزمات معدات' },
  { value: 'maintenance', label: 'صيانة' },
  { value: 'equipment', label: 'معدات' },
  { value: 'wire', label: 'سلك' },
  { value: 'bag', label: 'شكاير' },
  { value: 'export', label: 'تصدير' },
  { value: 'import', label: 'استيراد' },
  { value: 'collection', label: 'تحصيل' },
  { value: 'purchase', label: 'شراء' },
  { value: 'other', label: 'أخرى' },
];

export default function PaymentReport() {
  return (
    <ReportPage
      title="تقرير المدفوعات"
      endpoint="payment"
      filterFields={[
        { key: 'from', label: 'من تاريخ', type: 'date' },
        { key: 'to', label: 'إلى تاريخ', type: 'date' },
        { key: 'moneyFlow', label: 'اتجاه المبلغ', type: 'select', options: MONEY_FLOW_OPTIONS },
        { key: 'paymentMethod', label: 'طريقة الدفع', type: 'select', options: METHOD_OPTIONS },
        { key: 'module', label: 'مرتبط بـ', type: 'select', options: MODULE_OPTIONS },
                {
          key: 'supplier',
          label: '',
          type: 'supplier-search',
          placeholder: 'ابحث باسم التاجر...',
        },

                        {
          key: 'customer',
          label: '',
          type: 'customer-search',
          placeholder: 'ابحث باسم العميل...',
        },

      ]}
      columns={[
        { key: 'transactionDate', label: 'التاريخ', render: (r) => formatDate(r.transactionDate) },
        { key: 'amount', label: 'المبلغ', render: (r) => formatCurrency(r.amount) },
        { key: 'paymentMethod', label: 'طريقة الدفع' },
        { key: 'moneyFlow', label: 'الاتجاه' },
        { key: 'module', label: 'مرتبط بـ' },
        {
          key: 'party',
          label: 'العميل / التاجر',
          render: (r) => r.customer?.name || r.supplier?.name || '—',
        },
      ]}
      buildSummaryItems={(s) => [
        { label: 'عدد العمليات', value: s.count, format: 'number' },
      ]}
    />
  );
}
