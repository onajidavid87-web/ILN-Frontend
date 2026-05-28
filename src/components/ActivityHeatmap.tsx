"use client";

import { useMemo } from "react";
import type { Invoice } from "@/utils/soroban";
import {
  buildDailyActivityCounts,
  buildHeatmapGrid,
  deriveAddressActivityFromInvoices,
  formatActivityTooltip,
  getHeatmapIntensityColor,
} from "@/utils/activity-heatmap";

interface ActivityHeatmapProps {
  address: string;
  invoices: Invoice[];
}

const CELL = 12;
const GAP = 3;

export default function ActivityHeatmap({ address, invoices }: ActivityHeatmapProps) {
  const { weeks, maxCount, dayKeys } = useMemo(() => {
    const activity = deriveAddressActivityFromInvoices(invoices, address);
    const counts = buildDailyActivityCounts(activity);
    const grid = buildHeatmapGrid(counts);
    const keys: string[] = [];
    const cursor = new Date();
    cursor.setUTCHours(0, 0, 0, 0);
    cursor.setUTCDate(cursor.getUTCDate() - 52 * 7 + 1);
    for (let i = 0; i < 52 * 7; i += 1) {
      keys.push(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return { ...grid, dayKeys: keys };
  }, [address, invoices]);

  const width = weeks.length * (CELL + GAP);
  const height = 7 * (CELL + GAP);

  return (
    <section
      className="rounded-3xl border border-outline-variant/10 bg-surface-container-lowest p-6"
      aria-label="On-chain activity heatmap"
    >
      <h2 className="text-xl font-semibold text-on-surface">Activity heatmap</h2>
      <p className="mt-1 text-sm text-on-surface-variant">
        Daily on-chain actions (submit, fund, mark paid) over the last 52 weeks.
      </p>

      <div className="mt-6 overflow-x-auto">
        <svg
          width={width}
          height={height}
          role="img"
          aria-label="GitHub-style activity heatmap for the last 52 weeks"
        >
          {weeks.map((week, weekIndex) =>
            week.map((countValue, dayIndex) => {
              const count = Number(countValue);
              const dayKey =
                dayKeys[weekIndex * 7 + dayIndex] ?? new Date().toISOString().slice(0, 10);
              return (
                <rect
                  key={`${weekIndex}-${dayIndex}`}
                  x={weekIndex * (CELL + GAP)}
                  y={dayIndex * (CELL + GAP)}
                  width={CELL}
                  height={CELL}
                  rx={2}
                  fill={getHeatmapIntensityColor(count, maxCount)}
                >
                  <title>{formatActivityTooltip(count, dayKey)}</title>
                </rect>
              );
            }),
          )}
        </svg>
      </div>
    </section>
  );
}
