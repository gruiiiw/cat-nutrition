'use client';

import { cn } from '@/lib/utils';

interface BodyConditionScoreProps {
  value: number;
  onChange: (score: number) => void;
}

const BCS_LABELS: Record<number, string> = {
  1: 'Emaciated',
  2: 'Very Thin',
  3: 'Thin',
  4: 'Underweight',
  5: 'Ideal',
  6: 'Slightly Over',
  7: 'Overweight',
  8: 'Obese',
  9: 'Severely Obese',
};

const BCS_DESCRIPTIONS: Record<number, string> = {
  1: 'Ribs, spine, and bones highly visible. No body fat. Severe muscle wasting.',
  2: 'Ribs easily visible. No palpable fat. Minimal muscle mass.',
  3: 'Ribs easily palpable with minimal fat covering. Waist obvious.',
  4: 'Ribs palpable with slight fat covering. Waist noticeable from above.',
  5: 'Well-proportioned. Ribs palpable without excess fat. Waist visible behind ribs.',
  6: 'Ribs palpable with slight excess fat. Waist barely discernible.',
  7: 'Ribs difficult to palpate under moderate fat. Waist absent. Rounding of abdomen.',
  8: 'Ribs not palpable under heavy fat. No waist. Obvious abdominal distension.',
  9: 'Massive fat deposits over thorax, spine, and abdomen. Heavy abdominal distension.',
};

function getSegmentColor(score: number): string {
  if (score <= 2) return 'bg-red-500';
  if (score === 3) return 'bg-yellow-500';
  if (score >= 4 && score <= 6) return 'bg-green-500';
  if (score === 7) return 'bg-yellow-500';
  return 'bg-red-500'; // 8-9
}

function getSelectedTextColor(score: number): string {
  if (score >= 4 && score <= 6) return 'text-green-700';
  if (score === 3 || score === 7) return 'text-yellow-700';
  return 'text-red-700';
}

export default function BodyConditionScore({
  value,
  onChange,
}: BodyConditionScoreProps) {
  return (
    <div className="w-full">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        Body Condition Score (BCS)
      </h3>
      <p className="text-xs text-gray-500 mb-3">
        Ideal range: 4-6
      </p>

      {/* Scale bar */}
      <div className="flex gap-1">
        {Array.from({ length: 9 }, (_, i) => i + 1).map((score) => {
          const isSelected = score === value;
          const isIdeal = score >= 4 && score <= 6;

          return (
            <button
              key={score}
              type="button"
              onClick={() => onChange(score)}
              className={cn(
                'relative flex-1 h-10 rounded-md text-xs font-bold transition-all',
                getSegmentColor(score),
                isSelected
                  ? 'ring-2 ring-offset-2 ring-gray-900 scale-110 z-10'
                  : 'opacity-70 hover:opacity-100',
                'text-white'
              )}
              title={BCS_LABELS[score]}
            >
              {score}
              {isIdeal && !isSelected && (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-white" />
              )}
            </button>
          );
        })}
      </div>

      {/* Labels at extremes */}
      <div className="mt-1 flex justify-between text-[10px] text-gray-400">
        <span>Underweight</span>
        <span>Ideal</span>
        <span>Overweight</span>
      </div>

      {/* Selected score description */}
      {value >= 1 && value <= 9 && (
        <div className="mt-4 rounded-lg bg-gray-50 p-3">
          <p className={cn('text-sm font-semibold', getSelectedTextColor(value))}>
            {value} - {BCS_LABELS[value]}
          </p>
          <p className="mt-1 text-xs text-gray-600">
            {BCS_DESCRIPTIONS[value]}
          </p>
        </div>
      )}
    </div>
  );
}
