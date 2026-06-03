'use client'

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts'

const CATEGORY_COLORS_MAP = {
  Food: '#f97316',
  Transport: '#3b82f6',
  Entertainment: '#ec4899',
  Shopping: '#eab308',
  Health: '#ef4444',
  Education: '#06b6d4',
  Bills: '#94a3b8',
  Other: '#a855f7',
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const tooltipStyle = {
  backgroundColor: '#1e1333',
  border: '1px solid rgba(139,92,246,0.2)',
  borderRadius: '12px',
  color: '#e2e8f0',
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
            <Cell key={entry.name} fill={CATEGORY_COLORS_MAP[entry.name] || '#a855f7'} strokeWidth={0} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Amount']}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(val) => <span style={{ color: '#94a3b8', fontSize: '12px' }}>{val}</span>}
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
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Spent']}
          cursor={{ fill: 'rgba(139,92,246,0.1)' }}
        />
        <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
          {chartData.map((entry, i) => (
            <Cell
              key={i}
              fill={i === new Date().getMonth() ? '#7c3aed' : '#4c1d95'}
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
          <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: '#64748b', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 11 }}
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
          stroke="#7c3aed"
          strokeWidth={2}
          fill="url(#purpleGrad)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function EmptyChart({ message }) {
  return (
    <div className="flex items-center justify-center h-[280px] text-slate-500 text-sm">
      {message}
    </div>
  )
}
