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
import type { SubmissionTimeline } from '@/src/queries/dashboard';

interface SubmissionTimelineChartProps {
  data: SubmissionTimeline;
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
    const total = payload.reduce(
      (sum: number, entry) => sum + (entry.value || 0),
      0,
    );

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
        <div
          style={{
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid hsl(0 0% 25%)',
          }}
        >
          <p style={{ fontSize: '14px', fontWeight: 'bold' }}>Total: {total}</p>
        </div>
      </div>
    );
  }

  return null;
}

export function SubmissionTimelineChart({
  data,
}: SubmissionTimelineChartProps) {
  // Transform data to chart format (data is already cumulative from SQL)
  const chartData = data.currentEvent.data.map((item) => {
    return {
      date: new Date(item.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'America/Santiago',
      }),
      'With Team': item.team,
      'Looking for Team': item.teamLooking,
      Solo: item.solo,
    };
  });

  const colors = {
    'With Team': 'hsl(54 100% 63%)', // brightest primary
    'Looking for Team': 'hsl(54 90% 53%)', // medium primary
    Solo: 'hsl(54 80% 43%)', // darker primary
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} margin={{ bottom: 30 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          label={{
            value: 'Submission Date',
            position: 'insideBottom',
            offset: -10,
          }}
        />
        <YAxis label={{ value: 'Cumulative People', angle: -90 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend verticalAlign="top" height={36} />
        <Bar dataKey="Solo" stackId="a" fill={colors.Solo} />
        <Bar
          dataKey="Looking for Team"
          stackId="a"
          fill={colors['Looking for Team']}
        />
        <Bar dataKey="With Team" stackId="a" fill={colors['With Team']} />
      </BarChart>
    </ResponsiveContainer>
  );
}
