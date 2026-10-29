/**
 * ImpactOS Financial & General Formatters
 *
 * Rules:
 * - State and API payloads strictly use raw integer rupees (INR).
 * - Formatting is exclusively presentation layer.
 * - Tabular numbers are used for financial comparisons.
 */

/**
 * Formats integer rupees according to Indian lakh/crore or International notation.
 *
 * @param {number|null|undefined} amountInRupees - Integer amount in INR
 * @param {Object} options
 * @param {'INR_LAKH_CRORE'|'INR_FULL'|'USD_MILLIONS'} options.currencyMode - Formatting mode
 * @param {boolean} options.compact - Whether to use compact symbols (Cr, L)
 * @returns {string} Formatted currency string
 */
export function formatINR(amountInRupees, options = {}) {
  const { currencyMode = 'INR_LAKH_CRORE', compact = true } = options;

  if (amountInRupees === null || amountInRupees === undefined || isNaN(amountInRupees)) {
    return '—';
  }

  const num = Math.round(Number(amountInRupees));

  if (currencyMode === 'USD_MILLIONS') {
    // Rough illustrative conversion ($1 ~ 83 INR for reference if international mode selected)
    const usd = num / 83.0;
    if (compact) {
      if (Math.abs(usd) >= 1_000_000) {
        return `$${(usd / 1_000_000).toFixed(2)}M`;
      }
      if (Math.abs(usd) >= 1_000) {
        return `$${(usd / 1_000).toFixed(1)}K`;
      }
      return `$${usd.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    }
    return `$${Math.round(usd).toLocaleString('en-US')}`;
  }

  if (currencyMode === 'INR_FULL') {
    return `₹${num.toLocaleString('en-IN')}`;
  }

  // Default: Indian Lakh / Crore notation
  if (!compact) {
    return `₹${num.toLocaleString('en-IN')}`;
  }

  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (absNum >= 10_000_000) {
    // 1 Crore = 100 Lakh = 10,000,000
    const crores = absNum / 10_000_000;
    return `${sign}₹${crores.toFixed(2)} Cr`;
  }

  if (absNum >= 100_000) {
    // 1 Lakh = 100,000
    const lakhs = absNum / 100_000;
    return `${sign}₹${lakhs.toFixed(2)} L`;
  }

  return `${sign}₹${absNum.toLocaleString('en-IN')}`;
}

/**
 * Format benefit score (typically 0-100)
 */
export function formatBenefitScore(score) {
  if (score === null || score === undefined || isNaN(score)) return '—';
  return Number(score).toFixed(1);
}

/**
 * Format percentage
 */
export function formatPercentage(ratio) {
  if (ratio === null || ratio === undefined || isNaN(ratio)) return '—';
  const val = Number(ratio);
  return `${(val * 100).toFixed(1)}%`;
}

/**
 * Format ISO datetime for audit trails
 */
export function formatDateTime(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return isoString;
  }
}

/**
 * Format relative time (e.g., '10 minutes ago')
 */
export function formatRelativeTime(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now - d) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hr ago`;
    return formatDateTime(isoString);
  } catch {
    return isoString;
  }
}

