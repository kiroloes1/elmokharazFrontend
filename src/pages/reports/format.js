export function formatCurrency(value) {
  const n = Number(value) || 0;
  return n.toLocaleString({ minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function formatNumber(value) {
  const n = Number(value) || 0;
  return n.toLocaleString();
}

export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' });
}
