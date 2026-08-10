import ReportPage from './ReportPage';
import { formatCurrency } from './format';

export default function CustomerReport() {
  return (
    <ReportPage
      title="تقرير العملاء"
      endpoint="customer"
      filterFields={[
        { key: 'name', label: 'اسم العميل', type: 'text', placeholder: 'بحث بالاسم' },
        { key: 'minBalance', label: 'حد أدنى للرصيد', type: 'number' },
      ]}
      columns={[
        { key: 'name', label: 'الاسم' },
        { key: 'phone', label: 'الهاتف' },
        { key: 'balance', label: 'الرصيد', render: (r) => formatCurrency(r.balance) },
        { key: 'openningBalance', label: 'الرصيد الافتتاحي', render: (r) => formatCurrency(r.openningBalance) },
      ]}
      buildSummaryItems={(s) => [
        { label: 'عدد العملاء', value: s.count, format: 'number' },
        { label: 'إجمالي الأرصدة', value: s.totalBalance, format: 'currency' },
        { label: 'إجمالي الأرصدة الافتتاحية', value: s.totalOpenningBalance, format: 'currency' },
      ]}
    />
  );
}
