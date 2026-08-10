import ReportPage from './ReportPage';
import { formatDate, formatCurrency } from './format';

const STATUS_OPTIONS = [
  { value: 'under_collection', label: 'تحت التحصيل' },
  { value: 'due_today', label: 'مستحق اليوم' },
  { value: 'collected', label: 'تم التحصيل' },
  { value: 'returned', label: 'مرتجع' },
  { value: 'cancelled', label: 'ملغي' },
];

const LOCATION_OPTIONS = [
  { value: 'with_me', label: 'معي' },
  { value: 'bank', label: 'البنك' },
  { value: 'collector', label: 'المُحصّل' },
  { value: 'delivered', label: 'تم التسليم' },
  { value: 'archived', label: 'مؤرشف' },
];

const MONEY_FLOW_OPTIONS = [
  { value: 'incoming', label: 'وارد' },
  { value: 'outgoing', label: 'صادر' },
];

export default function ChequeReport() {
  return (
    <ReportPage
      title="تقرير الشيكات"
      endpoint="cheque"
      filterFields={[
        { key: 'from', label: 'استحقاق من', type: 'date' },
        { key: 'to', label: 'استحقاق إلى', type: 'date' },
        { key: 'status', label: 'الحالة', type: 'select', options: STATUS_OPTIONS },
        { key: 'location', label: 'الموقع', type: 'select', options: LOCATION_OPTIONS },
        { key: 'moneyFlow', label: 'اتجاه المبلغ', type: 'select', options: MONEY_FLOW_OPTIONS },
      ]}
      columns={[
        { key: 'chequeNumber', label: 'رقم الشيك' },
        { key: 'bankName', label: 'البنك' },
        { key: 'amount', label: 'المبلغ', render: (r) => formatCurrency(r.amount) },
        { key: 'dueDate', label: 'تاريخ الاستحقاق', render: (r) => formatDate(r.dueDate) },
        { key: 'status', label: 'الحالة' },
        { key: 'location', label: 'الموقع' },
        { key: 'moneyFlow', label: 'الاتجاه' },
      ]}
      buildSummaryItems={(s) => [
        { label: 'إجمالي القيمة', value: s.totalAmount, format: 'currency' },
        { label: 'عدد الشيكات', value: s.count, format: 'number' },
        { label: 'مستحقة خلال 7 أيام', value: s.upcomingDueWithin7Days, format: 'number' },
      ]}
    />
  );
}
