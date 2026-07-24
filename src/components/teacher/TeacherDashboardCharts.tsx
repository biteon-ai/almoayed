"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TeacherDashboardAnalytics } from "@/types/database";

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; name?: string; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border bg-background px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

/** [PERF-003] Recharts chunk for teacher grade distribution. */
export function TeacherGradeDistributionChart({
  gradeDistribution,
}: {
  gradeDistribution: TeacherDashboardAnalytics["gradeDistribution"];
}) {
  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={gradeDistribution}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="range"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            allowDecimals={false}
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="count" radius={[8, 8, 0, 0]}>
            {gradeDistribution.map((entry) => (
              <Cell key={entry.range} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** [PERF-003] Recharts chunk for weekly activity. */
export function TeacherWeeklyActivityChart({
  weeklyActivity,
}: {
  weeklyActivity: TeacherDashboardAnalytics["weeklyActivity"];
}) {
  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={weeklyActivity}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="day"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            allowDecimals={false}
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<ChartTooltip />} />
          <Line
            type="monotone"
            dataKey="passed"
            name="محاولات ناجحة"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="failed"
            name="محاولات غير مكتملة / رسوب"
            stroke="#f97316"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
