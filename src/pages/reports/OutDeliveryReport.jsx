
import ReportPage from './ReportPage';
import { formatDate, formatCurrency } from './format';

export default function OutDeliveryReport() {
  return (
    <ReportPage
      title="تقرير النقلات الصادرة"
      endpoint="out-delivery"
      filterFields={[
        { key: 'from', label: 'من تاريخ', type: 'date' },
        { key: 'to', label: 'إلى تاريخ', type: 'date' },

        {
          key: 'supplier',
          label: '',
          type: 'supplier-search',
          placeholder: 'ابحث باسم التاجر...',
        },
      ]}
      columns={[
        {
          key: 'deliveryDate',
          label: 'التاريخ',
          render: (r) => formatDate(r.deliveryDate),
        },
        {
          key: 'delveryNumber',
          label: 'رقم النقلة',
        },
        {
          key: 'supplier',
          label: 'التاجر',
          render: (r) => r.supplier?.name || '—',
        },
        {
          key: 'carName',
          label: 'السائق',
        },
        // {
        //   key: 'totalAmount',
        //   label: 'الإجمالي',
        //   render: (r) => formatCurrency(r.totalAmount),
        // },
        // {
        //   key: 'paidAmount',
        //   label: 'المدفوع',
        //   render: (r) => formatCurrency(r.paidAmount),
        // },
        // {
        //   key: 'remainingAmount',
        //   label: 'المتبقي',
        //   render: (r) => formatCurrency(r.remainingAmount),
        // },
      ]}
      buildSummaryItems={(s) => [
        // {
        //   label: 'إجمالي النقلات',
        //   value: s.totalAmount,
        //   format: 'currency',
        // },
        // {
        //   label: 'المدفوع',
        //   value: s.paidAmount,
        //   format: 'currency',
        // },
        // {
        //   label: 'المتبقي',
        //   value: s.remainingAmount,
        //   format: 'currency',
        // },
        {
          label: 'عدد النقلات',
          value: s.count,
          format: 'number',
        },
      ]}
    />
  );
}

