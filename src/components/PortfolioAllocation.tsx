"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useLang } from "@/lib/i18n";
import { formatEUR } from "@/lib/format";

const COLORS = ["#f6c700", "#2a6fd6", "#d01012", "#23a45c", "#7fb0f5", "#ff8a3d", "#9b8cff", "#4cd587"];

export default function PortfolioAllocation({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const { lang } = useLang();

  if (data.length === 0) return null;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="55%"
            outerRadius="85%"
            paddingAngle={2}
            stroke="#121829"
            strokeWidth={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#1a2138",
              border: "1px solid #232c47",
              borderRadius: 10,
              color: "#f2f4fb",
            }}
            formatter={(value, name) => [formatEUR(value as number, lang), name as string]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
