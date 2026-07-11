import { Skeleton } from './Skeleton'

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'purple', trend, loading = false }) {
  const colorMap = {
    purple: 'bg-danger/15 text-danger',
    emerald: 'bg-success/15 text-success',
    amber: 'bg-accent-yellow/15 text-accent-yellow',
    rose: 'bg-accent-pink/15 text-accent-pink',
    blue: 'bg-[#4C8DD6]/15 text-[#4C8DD6]',
  }

  const borderMap = {
    purple: 'card-top-red',
    emerald: 'card-top-green',
    amber: 'card-top-yellow',
    rose: 'card-top-pink',
    blue: '',
  }

  return (
    <div className={`glass-card rounded-2xl p-5 hover:border-accent/25 transition-all duration-300 group ${borderMap[color] || ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${colorMap[color]} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && !loading && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            trend >= 0 ? 'text-success bg-success/10' : 'text-danger bg-danger/10'
          }`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="space-y-1">
        {loading ? <Skeleton className="h-7 w-24" /> : <p className="font-display text-2xl font-bold text-ink tabular-nums">{value}</p>}
        <p className="text-sm font-medium text-ink-soft">{title}</p>
        {loading ? <Skeleton className="h-3 w-16 mt-0.5" /> : subtitle && <p className="text-xs text-ink-faint">{subtitle}</p>}
      </div>
    </div>
  )
}
