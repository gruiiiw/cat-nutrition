'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface NutrientChartProps {
  protein: number;
  fat: number;
  fiber: number;
  carbs: number;
  ash?: number;
}

const COLORS: Record<string, string> = {
  Protein: '#22c55e',
  Fat: '#eab308',
  Fiber: '#f97316',
  Carbs: '#ef4444',
  Ash: '#9ca3af',
};

export default function NutrientChart({
  protein,
  fat,
  fiber,
  carbs,
  ash,
}: NutrientChartProps) {
  const data = [
    { name: 'Protein', value: protein },
    { name: 'Fat', value: fat },
    { name: 'Fiber', value: fiber },
    { name: 'Carbs', value: carbs },
    ...(ash !== undefined ? [{ name: 'Ash', value: ash }] : []),
  ];

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Dry Matter Basis
      </h3>
      <ResponsiveContainer width="100%" height={ash !== undefined ? 220 : 190}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 40 }}>
          <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
          <YAxis
            type="category"
            dataKey="name"
            width={60}
            tick={{ fontSize: 13 }}
          />
          <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={22} label={{ position: 'right', formatter: (v) => `${Number(v).toFixed(1)}%`, fontSize: 12 }}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
