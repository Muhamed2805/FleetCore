"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/expenses";

const CHART_HEIGHT = 180;
const CHART_WIDTH = 480;
const BAR_WIDTH = 28;
const AXIS_GUTTER = 44;
const BOTTOM_GUTTER = 24;

export function SpendTrendChart({
  data,
}: {
  data: { label: string; total: number }[];
}) {
  const t = useTranslations("dashboardShell");
  const titleId = useId();
  const [hovered, setHovered] = useState<number | null>(null);

  const max = Math.max(1, ...data.map((d) => d.total));
  const plotHeight = CHART_HEIGHT - BOTTOM_GUTTER;
  const step = (CHART_WIDTH - AXIS_GUTTER) / data.length;
  const gridValues = [0, max / 2, max];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">
          {t("charts.spendTrend.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <svg
          role="img"
          aria-labelledby={titleId}
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="w-full"
          style={{ height: CHART_HEIGHT }}
        >
          <title id={titleId}>
            {t("charts.spendTrend.svgTitle", {
              items: data
                .map((d) => `${d.label} ${formatCurrency(d.total)}`)
                .join(", "),
            })}
          </title>
          {gridValues.map((value) => {
            const y = plotHeight - (value / max) * (plotHeight - 8);
            return (
              <g key={value}>
                <line
                  x1={AXIS_GUTTER}
                  x2={CHART_WIDTH}
                  y1={y}
                  y2={y}
                  stroke="var(--chart-grid)"
                  strokeWidth={1}
                />
                <text
                  x={AXIS_GUTTER - 8}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-muted-foreground text-[10px] tabular-nums"
                >
                  {value >= 1000 ? `${Math.round(value / 100) / 10}K` : Math.round(value)}
                </text>
              </g>
            );
          })}
          {data.map((point, index) => {
            const barHeight = Math.max(2, (point.total / max) * (plotHeight - 8));
            const x = AXIS_GUTTER + index * step + (step - BAR_WIDTH) / 2;
            const y = plotHeight - barHeight;
            const isHovered = hovered === index;

            return (
              <g
                key={point.label}
                tabIndex={0}
                role="button"
                aria-label={t("charts.spendTrend.pointAriaLabel", {
                  label: point.label,
                  amount: formatCurrency(point.total),
                })}
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(index)}
                onBlur={() => setHovered(null)}
                className="cursor-pointer outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
              >
                <rect
                  x={x}
                  y={y}
                  width={BAR_WIDTH}
                  height={barHeight}
                  rx={4}
                  fill="var(--chart-1)"
                  opacity={isHovered ? 1 : 0.9}
                />
                {isHovered ? (
                  <text
                    x={x + BAR_WIDTH / 2}
                    y={y - 6}
                    textAnchor="middle"
                    className="fill-foreground text-[10px] font-medium tabular-nums"
                  >
                    {formatCurrency(point.total)}
                  </text>
                ) : null}
                <text
                  x={x + BAR_WIDTH / 2}
                  y={plotHeight + 16}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px]"
                >
                  {point.label}
                </text>
              </g>
            );
          })}
        </svg>
      </CardContent>
    </Card>
  );
}
