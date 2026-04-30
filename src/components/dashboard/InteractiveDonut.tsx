import { useState, useCallback } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip as RechartsTooltip } from 'recharts';

interface DonutDataItem {
  name: string;
  value: number;
  [key: string]: any;
}

interface InteractiveDonutProps {
  data: DonutDataItem[];
  colors: string[];
  dataKey?: string;
  nameKey?: string;
  centerLabel?: string;
  centerValue?: string | number;
  tooltipFormatter?: (value: number) => string;
  height?: number;
}

export function InteractiveDonut({
  data,
  colors,
  dataKey = 'value',
  nameKey = 'name',
  centerLabel = 'Total',
  centerValue,
  tooltipFormatter,
  height = 220,
}: InteractiveDonutProps) {
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());

  const toggleKey = useCallback((key: string) => {
    setHiddenKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        // Don't hide if it would hide all segments
        if (next.size < data.length - 1) {
          next.add(key);
        }
      }
      return next;
    });
  }, [data.length]);

  const visibleData = data.filter(d => !hiddenKeys.has(d[nameKey]));
  const visibleTotal = centerValue !== undefined
    ? (typeof centerValue === 'number'
        ? visibleData.reduce((sum, d) => sum + d[dataKey], 0)
        : centerValue)
    : undefined;

  // Custom legend with clickable items
  const renderLegend = useCallback((props: any) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1">
        {data.map((entry, i) => {
          const isHidden = hiddenKeys.has(entry[nameKey]);
          return (
            <button
              key={entry[nameKey]}
              type="button"
              onClick={() => toggleKey(entry[nameKey])}
              className="flex items-center gap-1 text-[11px] cursor-pointer transition-opacity hover:opacity-80"
              style={{ opacity: isHidden ? 0.35 : 1 }}
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm flex-shrink-0"
                style={{
                  backgroundColor: colors[i % colors.length],
                  opacity: isHidden ? 0.3 : 1,
                }}
              />
              <span className={isHidden ? 'line-through text-muted-foreground' : 'text-foreground'}>
                {entry[nameKey]}
              </span>
            </button>
          );
        })}
      </div>
    );
  }, [data, hiddenKeys, nameKey, colors, toggleKey]);

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    fontSize: '12px',
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={visibleData}
          cx="50%"
          cy="45%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey={dataKey}
          nameKey={nameKey}
          animationDuration={300}
        >
          {visibleData.map((entry) => {
            const originalIndex = data.findIndex(d => d[nameKey] === entry[nameKey]);
            return (
              <Cell key={entry[nameKey]} fill={colors[originalIndex % colors.length]} />
            );
          })}
        </Pie>
        {centerLabel && (
          <text x="50%" y="42%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground" style={{ fontSize: 11 }}>
            {centerLabel}
          </text>
        )}
        {visibleTotal !== undefined && (
          <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground" style={{ fontSize: 20, fontWeight: 700 }}>
            {visibleTotal}
          </text>
        )}
        <RechartsTooltip
          formatter={tooltipFormatter}
          contentStyle={tooltipStyle}
        />
        <Legend content={renderLegend} />
      </PieChart>
    </ResponsiveContainer>
  );
}
