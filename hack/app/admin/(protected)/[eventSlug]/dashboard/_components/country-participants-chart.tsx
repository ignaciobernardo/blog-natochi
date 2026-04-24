'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getCountryDisplay } from '@/src/lib/utils/countries';
import type { CountryParticipantStats } from '@/src/queries/dashboard';

interface CountryParticipantsChartProps {
  data: CountryParticipantStats[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: 'hsl(0 0% 9%)',
          border: '1px solid hsl(0 0% 15%)',
          borderRadius: '0.5rem',
          padding: '12px',
          color: 'hsl(0 0% 100%)',
        }}
      >
        <p style={{ marginBottom: '8px', fontWeight: 'bold' }}>{label}</p>
        {payload.map((entry) => (
          <p key={entry.name} style={{ margin: '4px 0', fontSize: '14px' }}>
            <span style={{ color: entry.color }}>{entry.name}: </span>
            <span style={{ fontWeight: 'bold' }}>{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }

  return null;
}

export function CountryParticipantsChart({
  data,
}: CountryParticipantsChartProps) {
  const chartData = data.map((item) => ({
    country: getCountryDisplay(item.country),
    Participants: item.participants,
  }));

  return (
    <ResponsiveContainer width="100%" height={450}>
      <BarChart data={chartData} margin={{ bottom: 80, left: 10, right: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="country"
          angle={-45}
          textAnchor="end"
          height={100}
          interval={0}
        />
        <YAxis
          label={{ value: 'Participants', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend verticalAlign="top" height={36} />
        <Bar dataKey="Participants" fill="hsl(54 100% 63%)" />
      </BarChart>
    </ResponsiveContainer>
  );
}
