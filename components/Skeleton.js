export function Skeleton({ className = '' }) {
  return <div className={`skeleton rounded-lg ${className}`} />
}

// Icon + two lines + trailing amount — mirrors ExpenseCard's row shape
export function SkeletonRow() {
  return (
    <div className="glass-card rounded-xl p-4 flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-3.5 w-1/3" />
        <Skeleton className="h-2.5 w-1/4" />
      </div>
      <Skeleton className="h-4 w-14 flex-shrink-0" />
    </div>
  )
}

export function SkeletonRows({ count = 4 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => <SkeletonRow key={i} />)}
    </div>
  )
}

// Bare label/amount pairs — for category breakdown lists nested inside an existing card
export function SkeletonLines({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <Skeleton className="h-3.5 w-1/3" />
          <Skeleton className="h-3.5 w-16" />
        </div>
      ))}
    </div>
  )
}

// Rectangular placeholder for charts and other large blocks
export function SkeletonBlock({ className = 'h-[280px]' }) {
  return <Skeleton className={`w-full ${className}`} />
}

// Matches LendingTracker's 2-column grid card shape
export function SkeletonGridCard() {
  return (
    <div className="p-3 rounded-xl border border-line bg-cream space-y-2.5">
      <div className="flex items-center justify-between">
        <Skeleton className="w-9 h-9 rounded-xl" />
        <Skeleton className="w-6 h-6 rounded-lg" />
      </div>
      <Skeleton className="h-3.5 w-2/3" />
      <Skeleton className="h-2.5 w-1/2" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  )
}

export function SkeletonGridCards({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => <SkeletonGridCard key={i} />)}
    </div>
  )
}

// Matches PendingPaymentTracker's row shape (name/date + progress bar + paid/due line)
export function SkeletonPaymentRow() {
  return (
    <div className="p-3 rounded-xl border border-line bg-cream space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-1/3" />
          <Skeleton className="h-2.5 w-1/2" />
        </div>
        <Skeleton className="w-6 h-6 rounded-lg flex-shrink-0" />
      </div>
      <Skeleton className="h-1.5 w-full rounded-full" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-2.5 w-1/3" />
        <Skeleton className="h-2.5 w-1/4" />
      </div>
    </div>
  )
}

export function SkeletonPaymentRows({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => <SkeletonPaymentRow key={i} />)}
    </div>
  )
}

// Full-page shell for the initial auth-loading gate on every protected route
export function SkeletonPage() {
  return (
    <div className="min-h-screen pt-16 lg:pt-10 pb-28 lg:pb-12 px-4 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-6 lg:mb-8 space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-5 space-y-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      <SkeletonRows count={4} />
    </div>
  )
}
