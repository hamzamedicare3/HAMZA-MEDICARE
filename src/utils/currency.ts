export const CURRENCY_CODE = 'PKR';
export const CURRENCY_SYMBOL = '₨';
export const CURRENCY_PREFIX = 'Rs. ';

/**
 * Formats a number into Pakistani Rupee (PKR) format
 * Example: 15400 -> "₨ 15,400"
 */
export function formatPKR(amount: number | undefined | null, showDecimals: boolean = false): string {
  const num = Number(amount) || 0;
  const formatted = new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 2,
  }).format(num);

  return `${CURRENCY_SYMBOL} ${formatted}`;
}

/**
 * Short representation for thermal receipts (e.g. "Rs. 1,500.00")
 */
export function formatThermalPKR(amount: number | undefined | null): string {
  const num = Number(amount) || 0;
  const formatted = new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);

  return `Rs.${formatted}`;
}
