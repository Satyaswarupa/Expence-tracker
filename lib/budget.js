// Single source of truth for the category list — models/Expense.js takes its enum
// from here, and the AI routes validate against it.
export const CATEGORIES = ['Food', 'Grocery', 'Transport', 'Entertainment', 'Shopping', 'Health', 'Education', 'Bills', 'Fuel', 'Labour', 'Material', 'Investment', 'Other']

export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export const fmtCurrency = (n) =>
  `₹${Math.round(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
