'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface VoteTimestamp {
  projectId: string;
  projectName: string;
  slug: string;
  logoUrl: string | null;
  votedAt: Date;
}

interface ProjectVoteData {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  voteCount: number;
}

interface VoteEvolutionChartProps {
  projects: ProjectVoteData[];
  votes: VoteTimestamp[];
}

const CHART_COLORS = [
  '#e1ff00',
  '#00ff87',
  '#ff006e',
  '#00d9ff',
  '#ffbe0b',
  '#ff7700',
  '#a100ff',
  '#00ffc8',
];

interface ChartDataPoint {
  timestamp: number;
  [key: string]: number;
}

export function VoteEvolutionChart({
  projects,
  votes,
}: VoteEvolutionChartProps) {
  const chartData = useMemo(() => {
    if (votes.length === 0) return [];

    const projectAccumulators: Record<string, number> = {};
    projects.forEach((project) => {
      projectAccumulators[project.id] = 0;
    });

    const projectIds = new Set(projects.map((p) => p.id));
    const voteEvents: Array<{ timestamp: number; projectId: string }> = [];

    votes.forEach((vote) => {
      if (projectIds.has(vote.projectId)) {
        voteEvents.push({
          timestamp: new Date(vote.votedAt).getTime(),
          projectId: vote.projectId,
        });
      }
    });

    voteEvents.sort((a, b) => a.timestamp - b.timestamp);

    // Set the visible start time to January 4, 2026
    const visibleStartTime = new Date('2026-01-04T00:00:00Z').getTime();
    const maxTime = voteEvents[voteEvents.length - 1].timestamp;
    const interval = 30 * 60 * 1000;

    let voteIndex = 0;

    // First, accumulate all votes that happened before January 4
    while (
      voteIndex < voteEvents.length &&
      voteEvents[voteIndex].timestamp < visibleStartTime
    ) {
      projectAccumulators[voteEvents[voteIndex].projectId] += 1;
      voteIndex += 1;
    }

    // Now generate data points starting from January 4
    const dataPoints: ChartDataPoint[] = [];

    for (let time = visibleStartTime; time <= maxTime; time += interval) {
      while (
        voteIndex < voteEvents.length &&
        voteEvents[voteIndex].timestamp <= time
      ) {
        projectAccumulators[voteEvents[voteIndex].projectId] += 1;
        voteIndex += 1;
      }

      dataPoints.push({
        timestamp: time,
        ...{ ...projectAccumulators },
      });
    }

    if (dataPoints[dataPoints.length - 1]?.timestamp !== maxTime) {
      while (voteIndex < voteEvents.length) {
        projectAccumulators[voteEvents[voteIndex].projectId] += 1;
        voteIndex += 1;
      }
      dataPoints.push({
        timestamp: maxTime,
        ...{ ...projectAccumulators },
      });
    }

    return dataPoints;
  }, [projects, votes]);

  const projectsMap = useMemo(() => {
    const map: Record<string, ProjectVoteData> = {};
    projects.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [projects]);

  const timeRange = useMemo(() => {
    if (chartData.length === 0) return { min: 0, max: 0, ticks: [] };

    const timestamps = chartData.map((d) => d.timestamp);
    const maxTime = Math.max(...timestamps);

    // Set visible range to start from January 4, 2026
    const visibleStartTime = new Date('2026-01-04T00:00:00Z').getTime();

    const ticks: number[] = [];
    const eightHours = 8 * 60 * 60 * 1000;
    const startTick = Math.floor(visibleStartTime / eightHours) * eightHours;

    for (
      let tick = startTick;
      tick <= maxTime + eightHours;
      tick += eightHours
    ) {
      if (tick >= visibleStartTime) {
        ticks.push(tick);
      }
    }

    return { min: visibleStartTime, max: maxTime, ticks };
  }, [chartData]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month} ${day}, ${hours}:${minutes}`;
  };

  return (
    <div className="w-full space-y-8">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {projects.map((project, index) => (
          <div
            key={project.id}
            className="flex items-center gap-3 rounded-lg border border-primary/20 bg-card p-4"
          >
            {project.logoUrl && (
              <Image
                src={project.logoUrl}
                alt={project.name}
                width={40}
                height={40}
                className="rounded-md"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{
                    backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                  }}
                />
                <p className="font-medium text-foreground text-sm">
                  {project.name}
                </p>
              </div>
              <p className="text-muted-foreground text-xs">
                {project.voteCount} votes
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-primary/20 bg-card p-6">
        <h3 className="mb-6 font-bold text-primary text-xl">
          Vote Accumulation Over Time
        </h3>
        <ResponsiveContainer width="100%" height={500}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={[timeRange.min, timeRange.max]}
              ticks={timeRange.ticks}
              tickFormatter={formatTime}
              stroke="hsl(var(--foreground))"
              tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              stroke="hsl(var(--foreground))"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))',
              }}
              labelFormatter={(value) =>
                new Date(value).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              }
              formatter={(value: number, name: string) => [
                value,
                projectsMap[name]?.name || name,
              ]}
            />
            <Legend
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '12px',
              }}
              formatter={(value) => projectsMap[value]?.name || value}
            />
            {projects.map((project, index) => (
              <Line
                key={project.id}
                type="monotoneX"
                dataKey={project.id}
                stroke={CHART_COLORS[index % CHART_COLORS.length]}
                strokeWidth={3}
                dot={false}
                name={project.name}
                animationDuration={300}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
