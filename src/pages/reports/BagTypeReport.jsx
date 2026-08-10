import ReportPage from './ReportPage';

export default function BagTypeReport() {
  return (
    <ReportPage
      title="تقرير أنواع الشكاير"
      endpoint="bag-type"
      filterFields={[{ key: 'name', label: 'اسم النوع', type: 'text', placeholder: 'بحث بالاسم' }]}
      columns={[
        { key: 'name', label: 'الاسم' },
        { key: 'notes', label: 'ملاحظات' },
      ]}
      buildSummaryItems={(s) => [{ label: 'عدد الأنواع', value: s.count, format: 'number' }]}
    />
  );
}
