'use client'

import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'

interface ChartData {
  type: string
  title?: string
  unit?: string
  data: { label: string; value: number }[]
}

const COLORS = [
  '#F97316', '#FB923C', '#FDBA74', '#FED7AA',
  '#EA580C', '#C2410C', '#9A3412', '#7C2D12',
]

function ChartBlockBase({ json, theme }: { json: string; theme: 'light' | 'sepia' | 'dark' }) {
  let chart: ChartData
  try {
    chart = JSON.parse(json) as ChartData
  } catch {
    return (
      <pre className="text-xs opacity-50 whitespace-pre-wrap break-all my-4 p-3 rounded-xl bg-black/5">
        {json}
      </pre>
    )
  }

  const isDark = theme === 'dark'
  const labelColor = isDark ? '#E5DDD0' : '#3D2E1A'
  const gridColor  = isDark ? '#2C2416' : '#E0D8CC'
  const bgColor    = isDark ? '#22190F' : 'transparent'

  const max = Math.max(...chart.data.map(d => d.value))

  return (
    <div
      className="my-8 rounded-2xl p-5 overflow-hidden"
      style={{ background: bgColor, border: `1px solid ${gridColor}` }}
    >
      {chart.title && (
        <p className="text-sm font-semibold mb-4 opacity-70" style={{ color: labelColor }}>
          {chart.title}
          {chart.unit && <span className="font-normal opacity-60 ml-1.5">({chart.unit})</span>}
        </p>
      )}
      <ResponsiveContainer width="100%" height={Math.max(180, chart.data.length * 44)}>
        <BarChart
          data={chart.data}
          layout="vertical"
          margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
        >
          <CartesianGrid horizontal={false} stroke={gridColor} strokeDasharray="3 3" />
          <XAxis
            type="number"
            tick={{ fill: labelColor, fontSize: 11, opacity: 0.5 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => chart.unit ? `${v}` : String(v)}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={90}
            tick={{ fill: labelColor, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: isDark ? '#1A1610' : '#FAFAF7',
              border: `1px solid ${gridColor}`,
              borderRadius: 12,
              color: labelColor,
              fontSize: 13,
            }}
            formatter={(v) => [`${v}${chart.unit ? ' ' + chart.unit : ''}`, '']}
            cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={32}>
            {chart.data.map((_, i) => (
              <Cell
                key={i}
                fill={COLORS[i % COLORS.length]}
                opacity={0.4 + 0.6 * (chart.data[i].value / max)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export const ChartBlock = React.memo(ChartBlockBase)
