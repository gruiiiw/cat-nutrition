export type Retailer = 'chewy' | 'amazon' | 'petsmart' | 'petco';

/**
 * Affiliate tag placeholders -- replace with real IDs before launch.
 */
export const AFFILIATE_TAGS: Record<string, string> = {
  chewy: '?AID=YOUR_CHEWY_AID',
  amazon: '?tag=YOUR_AMAZON_TAG',
  petsmart: '?AID=YOUR_PETSMART_AID',
  petco: '?AID=YOUR_PETCO_AID',
};

/**
 * Append the appropriate affiliate tag to a retailer URL.
 * Handles URLs that already contain query parameters.
 */
export function tagAffiliateLink(url: string, retailer: string): string {
  const tag = AFFILIATE_TAGS[retailer.toLowerCase()];
  if (!tag) return url;

  // tag starts with '?key=value' -- convert to '&key=value' if URL already has params
  const separator = url.includes('?') ? '&' : '?';
  const paramPart = tag.startsWith('?') ? tag.slice(1) : tag;

  return `${url}${separator}${paramPart}`;
}

/**
 * Human-readable retailer name.
 */
export function getRetailerDisplayName(retailer: string): string {
  const names: Record<string, string> = {
    chewy: 'Chewy',
    amazon: 'Amazon',
    petsmart: 'PetSmart',
    petco: 'Petco',
  };
  return names[retailer.toLowerCase()] ?? retailer;
}

/**
 * Tailwind color class for each retailer's brand color.
 */
export function getRetailerColor(retailer: string): string {
  const colors: Record<string, string> = {
    chewy: 'text-blue-600',
    amazon: 'text-orange-500',
    petsmart: 'text-red-600',
    petco: 'text-cyan-600',
  };
  return colors[retailer.toLowerCase()] ?? 'text-gray-600';
}

/**
 * Format a price given in cents as a dollar string (e.g. 199 -> "$1.99").
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Format a decimal dollar amount as a dollar string (e.g. 1.99 -> "$1.99").
 */
export function formatPriceDecimal(price: number): string {
  return `$${price.toFixed(2)}`;
}
