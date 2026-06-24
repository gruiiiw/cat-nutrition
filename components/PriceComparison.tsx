'use client';

import { cn } from '@/lib/utils';
import { tagAffiliateLink, type Retailer } from '@/lib/affiliate';

export interface RetailerPrice {
  retailer: Retailer;
  price: number;
  pricePerCalorie?: number;
  url: string;
  inStock: boolean;
  autoshipPrice?: number;
  subscribePrice?: number;
}

interface PriceComparisonProps {
  prices: RetailerPrice[];
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export default function PriceComparison({ prices }: PriceComparisonProps) {
  const inStockPrices = prices.filter((p) => p.inStock);
  const lowestPrice =
    inStockPrices.length > 0
      ? Math.min(...inStockPrices.map((p) => p.price))
      : null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
            <th className="pb-2 pr-4">Retailer</th>
            <th className="pb-2 pr-4">Price</th>
            <th className="pb-2 pr-4">Autoship / Subscribe</th>
            <th className="pb-2 pr-4">$/Calorie</th>
            <th className="pb-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {prices.map((item) => {
            const isLowest = item.inStock && item.price === lowestPrice;
            const affiliateUrl = tagAffiliateLink(item.url, item.retailer);
            const discountPrice = item.autoshipPrice ?? item.subscribePrice;

            return (
              <tr
                key={item.retailer}
                className={cn(
                  'transition-colors',
                  !item.inStock && 'opacity-50',
                  isLowest && 'bg-green-50'
                )}
              >
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 capitalize">
                      {item.retailer}
                    </span>
                    {isLowest && (
                      <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700">
                        LOWEST
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 pr-4 text-gray-900 font-medium">
                  {item.inStock ? formatPrice(item.price) : '--'}
                </td>
                <td className="py-3 pr-4 text-gray-600">
                  {discountPrice ? formatPrice(discountPrice) : '--'}
                </td>
                <td className="py-3 pr-4 text-gray-600">
                  {item.pricePerCalorie
                    ? `$${item.pricePerCalorie.toFixed(4)}`
                    : '--'}
                </td>
                <td className="py-3">
                  {item.inStock ? (
                    <a
                      href={affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                    >
                      Buy
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400 font-medium">
                      Out of Stock
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
