// Same-tab pub/sub so components that create expenses outside a page (the AI chat)
// can tell the open page to refresh. Replaces what socket events used to do.
const EVENT = 'expenses:changed'

export function emitExpensesChanged() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(EVENT))
}

export function onExpensesChanged(handler) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(EVENT, handler)
  return () => window.removeEventListener(EVENT, handler)
}
