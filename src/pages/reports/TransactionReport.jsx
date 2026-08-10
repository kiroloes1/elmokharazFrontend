import ReportPage from './ReportPage';
import { formatDate, formatCurrency } from './format';

const TYPE_OPTIONS = [
  { value: 'income', label: 'استلام / داخل' },
  { value: 'expense', label: 'مصروف / خارج' },
];

export default function TransactionReport() {
  return (
    <ReportPage
      title="تقرير الخزينة (المعاملات)"
      endpoint="transaction"
      filterFields={[
        { key: 'from', label: 'من تاريخ', type: 'date' },
        { key: 'to', label: 'إلى تاريخ', type: 'date' },
        { key: 'type', label: 'النوع', type: 'select', options: TYPE_OPTIONS },
      ]}
      columns={[
        { key: 'date', label: 'التاريخ', render: (r) => formatDate(r.date) },
        { key: 'type', label: 'النوع', render: (r) => (r.type === 'income' ? 'استلام / داخل ' : 'مصروف / خارج') },
        { key: 'note', label: 'ملاحظة' },
        { key: 'totalAmount', label: 'الإجمالي', render: (r) => formatCurrency(r.totalAmount) },
      ]}
      buildSummaryItems={(s) => [
        { label: 'إجمالي الداخل', value: s.totalIncome, format: 'currency' },
        { label: 'إجمالي الخارج', value: s.totalExpense, format: 'currency' },
        { label: 'الصافي', value: s.net, format: 'currency' },
        { label: 'عدد الحركات', value: s.count, format: 'number' },
      ]}
    />
  );
}
