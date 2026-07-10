"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PricePoint } from "@/data/types";
import { useLang } from "@/lib/i18n";
import { formatEUR } from "@/lib/format";

export default function PriceChart({ data }: { data: PricePoint[] }) {
  const { lang } = useLang();

  if (data.length < 2) {
    return (
      <p className="text-sm text-[var(--muted)]">
        {lang === "de"
          ? "Noch nicht genug Datenpunkte für einen Chart."
          : "Not enough data points for a chart yet."}
      </p>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f6c700" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#f6c700" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#232c47" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="year"
            stroke="#94a0bd"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: "#232c47" }}
          />
          <YAxis
            stroke="#94a0bd"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={70}
            tickFormatter={(v: number) => formatEUR(v, lang)}
          />
          <Tooltip
            contentStyle={{
              background: "#1a2138",
              border: "1px solid #232c47",
              borderRadius: 10,
              color: "#f2f4fb",
            }}
            labelStyle={{ color: "#94a0bd" }}
            formatter={(value) => [
              formatEUR(value as number, lang),
              lang === "de" ? "Marktwert" : "Market value",
            ]}
          />
          <Area
            type="monotone"
            dataKey="priceEUR"
            stroke="#f6c700"
            strokeWidth={2.5}
            fill="url(#priceFill)"
            dot={{ fill: "#f6c700", r: 3.5 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
