'use client'

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts'

export const CATEGORY_COLORS_MAP = {
  Food: '#EE6C4D',
  Grocery: '#8FAE52',
  Transport: '#2E9E83',
  Entertainment: '#9B6BC9',
  Shopping: '#F4A93B',
  Health: '#E0719A',
  Education: '#3FA7C4',
  Bills: '#4C8DD6',
  Fuel: '#C97F3A',
  Labour: '#7C8AA8',
  Material: '#A9876F',
  Investment: '#5C9E6B',
  Other: '#B9A99C',
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const tooltipStyle = {
  backgroundColor: '#1D1E28',
  border: '1px solid #2E2F3D',
  borderRadius: '12px',
  color: '#F3F3F6',
  fontSize: '12px',
}

export function CategoryPieChart({ data }) {
  if (!data?.length) return <EmptyChart message="No expenses yet" />

  const chartData = data.map((d) => ({
    name: d._id,
    value: Math.round(d.total),
    count: d.count,
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          outerRadius={90}
          innerRadius={50}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={CATEGORY_COLORS_MAP[entry.name] || '#B9A99C'} strokeWidth={0} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Amount']}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(val) => <span style={{ color: '#8D8E9C', fontSize: '12px' }}>{val}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function MonthlyBarChart({ data }) {
  if (!data?.length) return <EmptyChart message="No data for this year" />

  const chartData = MONTH_NAMES.map((name, i) => {
    const found = data.find((d) => d._id.month === i + 1)
    return { name, amount: found ? Math.round(found.total) : 0 }
  }).filter((_, i) => i <= new Date().getMonth())

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: '#8D8E9C', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#8D8E9C', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Spent']}
          cursor={{ fill: 'rgba(242,103,63,0.12)' }}
        />
        <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
          {chartData.map((entry, i) => (
            <Cell
              key={i}
              fill={i === new Date().getMonth() ? '#F2673F' : 'rgba(242,103,63,0.22)'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function SpendingAreaChart({ expenses }) {
  if (!expenses?.length) return <EmptyChart message="No expenses yet" />

  const dailyMap = {}
  expenses.forEach((e) => {
    const day = new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    dailyMap[day] = (dailyMap[day] || 0) + e.amount
  })

  const sorted = Object.entries(dailyMap)
    .slice(-14)
    .map(([date, amount]) => ({ date, amount: Math.round(amount) }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={sorted} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <defs>
          <linearGradient id="accentGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#F2673F" stopOpacity={0.45} />
            <stop offset="95%" stopColor="#F2673F" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: '#8D8E9C', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#8D8E9C', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Spent']}
        />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="#F2673F"
          strokeWidth={2}
          fill="url(#accentGrad)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

const HEATMAP_LEVELS = ['#1B1C24', '#3B2A22', '#6B3A26', '#B14F2C', '#F2673F']
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function DailyHeatmap({ expenses, year, month }) {
  const dailyTotals = {}
  ;(expenses || []).forEach((e) => {
    const day = new Date(e.date).getDate()
    dailyTotals[day] = (dailyTotals[day] || 0) + e.amount
  })

  const daysInMonth = new Date(year, month, 0).getDate()
  const firstWeekday = new Date(year, month - 1, 1).getDay()
  const max = Math.max(1, ...Object.values(dailyTotals))

  const levelOf = (amt) => {
    if (!amt) return 0
    const ratio = amt / max
    if (ratio > 0.75) return 4
    if (ratio > 0.5) return 3
    if (ratio > 0.25) return 2
    return 1
  }

  const cells = Array(firstWeekday).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  )

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 mb-2">
        {WEEKDAY_LABELS.map((d, i) => (
          <div key={i} className="text-center text-[11px] text-ink-faint font-semibold">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((day, i) => (
          <div
            key={i}
            title={day ? `Day ${day}: ₹${Math.round(dailyTotals[day] || 0).toLocaleString('en-IN')}` : undefined}
            className="aspect-square rounded-md"
            style={{ background: day ? HEATMAP_LEVELS[levelOf(dailyTotals[day])] : 'transparent' }}
          />
        ))}
      </div>
      <div className="flex items-center justify-end gap-1.5 mt-3 text-[11px] text-ink-faint font-semibold">
        Less
        {HEATMAP_LEVELS.map((c, i) => (
          <div key={i} className="w-3 h-3 rounded" style={{ background: c }} />
        ))}
        More
      </div>
    </div>
  )
}

function EmptyChart({ message }) {
  return (
    <div className="flex items-center justify-center h-[280px] text-ink-faint text-sm">
      {message}
    </div>
  )
}
