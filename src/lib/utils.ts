export function formatCurrency(amount: number, currency: string = '৳'): string {
  const val = Number(amount) || 0;
  return `${currency} ${val.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function exportToCSV(filename: string, rows: (string | number)[][]) {
  let csvContent = "data:text/csv;charset=utf-8,";
  rows.forEach(rowArray => {
    const row = rowArray.map(item => `"${(item + '').replace(/"/g, '""')}"`).join(",");
    csvContent += row + "\r\n";
  });
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function calculateFlockAgeDays(startDate: string): number {
  if (!startDate) return 1;
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffTime = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1);
}
