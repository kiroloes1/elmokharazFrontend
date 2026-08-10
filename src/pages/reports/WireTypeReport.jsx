import ReportPage from './ReportPage';

export default function WireTypeReport() {
  return (
    <ReportPage
      title="تقرير أنواع السلك"
      endpoint="wire-type"
      filterFields={[{ key: 'name', label: 'اسم النوع', type: 'text', placeholder: 'بحث بالاسم' }]}
      columns={[
        { key: 'name', label: 'الاسم' },
        { key: 'notes', label: 'ملاحظات' },
      ]}
      buildSummaryItems={(s) => [{ label: 'عدد الأنواع', value: s.count, format: 'number' }]}
    />
  );
}
