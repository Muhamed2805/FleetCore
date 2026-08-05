"use client";

import { useId, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { vehicleTypeLabels } from "@/lib/vehicles";
import type { VehicleType } from "@/lib/supabase/types";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const BAR_HEIGHT = 20;
const ROW_HEIGHT = 32;
const LABEL_WIDTH = 132;
const CHART_WIDTH = 420;

export function FleetCompositionChart({
  counts,
}: {
  counts: Record<VehicleType, number>;
}) {
  const titleId = useId();
  const [hovered, setHovered] = useState<VehicleType | null>(null);

  const rows = (Object.entries(vehicleTypeLabels) as [VehicleType, string][])
    .map(([type, label]) => ({ type, label, count: counts[type] ?? 0 }))
    .filter((row) => row.count > 0);

  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const max = Math.max(1, ...rows.map((row) => row.count));
  const barAreaWidth = CHART_WIDTH - LABEL_WIDTH - 40;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">
          Fleet by type
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No vehicles yet.</p>
        ) : (
          <svg
            role="img"
            aria-labelledby={titleId}
            viewBox={`0 0 ${CHART_WIDTH} ${rows.length * ROW_HEIGHT}`}
            className="w-full"
            style={{ height: rows.length * ROW_HEIGHT }}
          >
            <title id={titleId}>
              Fleet composition: {rows.map((r) => `${r.label} ${r.count}`).join(", ")}
            </title>
            {rows.map((row, index) => {
              const y = index * ROW_HEIGHT + (ROW_HEIGHT - BAR_HEIGHT) / 2;
              const width = Math.max(4, (row.count / max) * barAreaWidth);
              const isHovered = hovered === row.type;
              const pct = total ? Math.round((row.count / total) * 100) : 0;

              return (
                <g
                  key={row.type}
                  tabIndex={0}
                  role="button"
                  aria-label={`${row.label}: ${row.count} vehicles, ${pct}%`}
                  onMouseEnter={() => setHovered(row.type)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(row.type)}
                  onBlur={() => setHovered(null)}
                  className="outline-none"
                >
                  <text
                    x={LABEL_WIDTH - 12}
                    y={y + BAR_HEIGHT / 2}
                    textAnchor="end"
                    dominantBaseline="middle"
                    className="fill-foreground text-xs"
                  >
                    {row.label}
                  </text>
                  <rect
                    x={LABEL_WIDTH}
                    y={y}
                    width={width}
                    height={BAR_HEIGHT}
                    rx={4}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                    opacity={isHovered ? 1 : 0.9}
                  />
                  <text
                    x={LABEL_WIDTH + width + 8}
                    y={y + BAR_HEIGHT / 2}
                    dominantBaseline="middle"
                    className="fill-muted-foreground text-xs tabular-nums"
                  >
                    {row.count}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </CardContent>
    </Card>
  );
}
