import ReportPage from './ReportPage';
import { formatDate, formatCurrency } from './format';

export default function ExpenseReport() {
  return (
    <ReportPage
      title="تقرير المصروفات"
      endpoint="expense"
      filterFields={[
        { key: 'from', label: 'من تاريخ', type: 'date' },
        { key: 'to', label: 'إلى تاريخ', type: 'date' },
      ]}
      columns={[
        {
          key: 'expenseDate',
          label: 'التاريخ',
          render: (r) => formatDate(r.expenseDate),
        },
        {
          key: 'itemsCount',
          label: 'عدد البنود',
          render: (r) => r.items?.length || 0,
        },
        {
          key: 'title',
          label: 'البنود',
          render: (r) =>
            r.items?.map((i) => i.title).join(' ، ') || '—',
        },
        {
          key: 'totalAmount',
          label: 'الإجمالي',
          render: (r) => formatCurrency(r.totalAmount),
        },
        {
          key: 'createdBy',
          label: 'أضيف بواسطة',
          render: (r) =>
            r.createdBy?.name || r.createdBy?.email || '—',
        },
      ]}
      buildSummaryItems={(s) => [
        {
          label: 'إجمالي المصروفات',
          value: s.totalAmount,
          format: 'currency',
        },
        {
          label: 'عدد البنود',
          value: s.count,
          format: 'number',
        },
        {
          label: 'عدد التصنيفات',
          value: s.byCategory?.length || 0,
          format: 'number',
        },
      ]}
    />
  );
}