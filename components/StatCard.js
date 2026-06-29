export default function StatCard({ title, value, subtitle, icon: Icon, color = 'purple', trend }) {
  const colorMap = {
    purple: 'bg-accent/15 text-accent',
    emerald: 'bg-success/15 text-success',
    amber: 'bg-[#F4A93B]/15 text-[#F4A93B]',
    rose: 'bg-danger/15 text-danger',
    blue: 'bg-[#4C8DD6]/15 text-[#4C8DD6]',
  }

  return (
    <div className="glass-card rounded-2xl p-5 hover:border-accent/25 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${colorMap[color]} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            trend >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'
          }`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="font-display text-2xl font-bold text-ink tabular-nums">{value}</p>
        <p className="text-sm font-medium text-ink-soft">{title}</p>
        {subtitle && <p className="text-xs text-ink-faint">{subtitle}</p>}
      </div>
    </div>
  )
}
