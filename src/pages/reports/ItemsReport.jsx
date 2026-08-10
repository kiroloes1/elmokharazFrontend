import ReportPage from './ReportPage';
import { formatCurrency } from './format';

export default function ItemsReport() {
  return (
    <ReportPage
      title="تقرير الأصناف"
      endpoint="items"
      filterFields={[{ key: 'name', label: 'اسم الصنف', type: 'text', placeholder: 'بحث بالاسم' }]}
      columns={[
        { key: 'name', label: 'الاسم' },
      ]}
      buildSummaryItems={(s) => [
        { label: 'عدد الأصناف', value: s.count, format: 'number' },

      ]}
    />
  );
}
