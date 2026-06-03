export default function StatCard({ title, value, subtitle, icon: Icon, color = 'purple', trend }) {
  const colorMap = {
    purple: 'from-purple-500 to-indigo-600 shadow-purple-500/20',
    emerald: 'from-emerald-500 to-teal-600 shadow-emerald-500/20',
    amber: 'from-amber-500 to-orange-600 shadow-amber-500/20',
    rose: 'from-rose-500 to-pink-600 shadow-rose-500/20',
    blue: 'from-blue-500 to-cyan-600 shadow-blue-500/20',
  }

  return (
    <div className="glass-card rounded-2xl p-5 border border-white/5 hover:border-purple-500/20 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            trend >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
          }`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
        <p className="text-sm font-medium text-slate-300">{title}</p>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
    </div>
  )
}
