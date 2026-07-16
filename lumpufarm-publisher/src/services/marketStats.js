/**
 * Market statistics service.
 *
 * Derives summary numbers from the commodity items so the template
 * footer can show totals and extremes without any client-side logic
 * duplicating business rules.
 */

/**
 * Compute summary statistics for a list of market items.
 *
 * @param {Array<{ name: string, change?: number }>} items
 * @returns {{
 *   totalIncreased: number,
 *   totalDecreased: number,
 *   totalUnchanged: number,
 *   highestIncrease: { name: string, change: number } | null,
 *   highestDecrease: { name: string, change: number } | null,
 * }}
 */
export function computeMarketStats(items) {
  const stats = {
    totalIncreased: 0,
    totalDecreased: 0,
    totalUnchanged: 0,
    highestIncrease: null,
    highestDecrease: null,
  };

  for (const item of items) {
    const change = Number(item.change ?? 0);

    if (change > 0) {
      stats.totalIncreased += 1;
      if (!stats.highestIncrease || change > stats.highestIncrease.change) {
        stats.highestIncrease = { name: item.name, change };
      }
    } else if (change < 0) {
      stats.totalDecreased += 1;
      if (!stats.highestDecrease || change < stats.highestDecrease.change) {
        stats.highestDecrease = { name: item.name, change };
      }
    } else {
      stats.totalUnchanged += 1;
    }
  }

  return stats;
}
