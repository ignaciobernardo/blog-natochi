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
import type { SubmissionStatus } from '@/src/lib/db/schema';
import type { StatusBreakdownByModality } from '@/src/queries/dashboard';

interface StatusBreakdownChartProps {
  data: StatusBreakdownByModality[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    payload: {
      soloCount: number;
      teamLookingCount: number;
      teamCount: number;
      teamHackersCount: number;
    };
  }>;
  label?: string;
}

const statusLabels: Record<SubmissionStatus, string> = {
  received: 'Received',
  priority_waiting: 'Priority Waiting',
  asking_self_finance_trip: 'Asking Self Finance',
  approved: 'Approved',
  onboarding_request: 'Onboarding Request',
  onboarding_expired: 'Onboarding Expired',
  onboarding_complete: 'Onboarding Complete',
  rejected: 'Rejected',
  waiting_list: 'Waiting List',
  withdrawn: 'Withdrawn',
  archived: 'Archived',
};

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    const totalParticipants =
      data.soloCount + data.teamLookingCount + data.teamHackersCount;

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

        <div style={{ marginBottom: '8px' }}>
          <p style={{ margin: '4px 0', fontSize: '14px' }}>
            <span style={{ color: 'hsl(54 80% 43%)' }}>Solo: </span>
            <span style={{ fontWeight: 'bold' }}>{data.soloCount}</span>
          </p>
          <p style={{ margin: '4px 0', fontSize: '14px' }}>
            <span style={{ color: 'hsl(54 90% 53%)' }}>Looking for Team: </span>
            <span style={{ fontWeight: 'bold' }}>{data.teamLookingCount}</span>
          </p>
          <p style={{ margin: '4px 0', fontSize: '14px' }}>
            <span style={{ color: 'hsl(54 100% 63%)' }}>
              Team ({data.teamCount} submissions):{' '}
            </span>
            <span style={{ fontWeight: 'bold' }}>{data.teamHackersCount}</span>
          </p>
        </div>

        <div
          style={{
            paddingTop: '8px',
            borderTop: '1px solid hsl(0 0% 25%)',
          }}
        >
          <p style={{ fontSize: '14px', fontWeight: 'bold' }}>
            Total Participants: {totalParticipants}
          </p>
        </div>
      </div>
    );
  }

  return null;
}

export function StatusBreakdownChart({ data }: StatusBreakdownChartProps) {
  const chartData = data.map((item) => {
    return {
      status: statusLabels[item.status],
      Solo: item.soloCount,
      'Looking for Team': item.teamLookingCount,
      Team: item.teamHackersCount,
      soloCount: item.soloCount,
      teamLookingCount: item.teamLookingCount,
      teamCount: item.teamCount,
      teamHackersCount: item.teamHackersCount,
    };
  });

  const colors = {
    Solo: 'hsl(54 80% 43%)',
    'Looking for Team': 'hsl(54 90% 53%)',
    Team: 'hsl(54 100% 63%)',
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} margin={{ bottom: 60, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="status"
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
        <Bar dataKey="Solo" stackId="a" fill={colors.Solo} />
        <Bar
          dataKey="Looking for Team"
          stackId="a"
          fill={colors['Looking for Team']}
        />
        <Bar dataKey="Team" stackId="a" fill={colors.Team} />
      </BarChart>
    </ResponsiveContainer>
  );
}
