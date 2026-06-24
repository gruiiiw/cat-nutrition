'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface RecallBadgeProps {
  recallCount: number;
  brandName: string;
}

export default function RecallBadge({ recallCount, brandName }: RecallBadgeProps) {
  const [expanded, setExpanded] = useState(false);
  const hasRecalls = recallCount > 0;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
          hasRecalls
            ? 'bg-red-100 text-red-700 hover:bg-red-200'
            : 'bg-green-100 text-green-700 hover:bg-green-200'
        )}
      >
        {hasRecalls ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3.5 w-3.5"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3.5 w-3.5"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
              clipRule="evenodd"
            />
          </svg>
        )}
        {hasRecalls ? `${recallCount} recall${recallCount > 1 ? 's' : ''}` : 'No recalls'}
      </button>

      {expanded && (
        <div className="absolute left-0 top-full z-10 mt-1 w-56 rounded-md border border-gray-200 bg-white p-3 text-xs text-gray-700 shadow-lg">
          <p>View recall history for {brandName}</p>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="mt-2 text-blue-600 hover:underline"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
