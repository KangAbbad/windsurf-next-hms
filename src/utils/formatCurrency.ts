/**
 * Format a number into Indonesian Rupiah currency format
 * @param value - The number to format
 * @returns Formatted currency string (e.g., "Rp 1.000.000")
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}
