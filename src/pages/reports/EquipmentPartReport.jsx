import ReportPage from './ReportPage';

export default function EquipmentPartReport() {
  return (
    <ReportPage
      title="تقرير قطع غيار المعدات"
      endpoint="equipment-part"
      filterFields={[{ key: 'itemName', label: 'اسم القطعة', type: 'text', placeholder: 'بحث بالاسم' }]}
      columns={[{ key: 'itemName', label: 'اسم القطعة' }]}
      buildSummaryItems={(s) => [{ label: 'عدد القطع', value: s.count, format: 'number' }]}
    />
  );
}
