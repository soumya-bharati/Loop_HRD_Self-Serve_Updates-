export type PendingAction =
  | 'add_employee'
  | 'edit_employee'
  | 'add_dependant'
  | 'edit_dependant'
  | 'remove_dependant'
  | 'employee_exit'
  | 'bulk_add'
  | 'bulk_remove'

export type CostImpactType = 'charge' | 'refund' | 'neutral'

export interface CostImpact {
  type: CostImpactType
  amount: number
}

export interface BulkPendingRow {
  id: string
  employeeId: string
  employee: string
  status: 'ready' | 'warning' | 'error'
}

export interface PendingChange {
  id: string
  employeeId: string
  employeeName: string
  entityId?: string
  entityName?: string
  dealId?: string
  dealName?: string
  action: PendingAction
  description: string
  effectiveDate?: string
  costImpact?: CostImpact
  createdAt: string
  payload: unknown
}

export type EmployeeLifecycle = 'active' | 'leaving' | 'inactive'

export function nextPendingId() {
  return `chg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function chargeImpact(amount: number): CostImpact {
  if (amount <= 0) return { type: 'neutral', amount: 0 }
  return { type: 'charge', amount }
}

export function refundImpact(amount: number): CostImpact {
  if (amount <= 0) return { type: 'neutral', amount: 0 }
  return { type: 'refund', amount }
}

export function employeeLifecycle(
  leavingDate: string | undefined,
  asOf = new Date(),
): EmployeeLifecycle {
  if (!leavingDate) return 'active'
  const parsed = new Date(leavingDate)
  if (Number.isNaN(parsed.getTime())) return 'active'
  const today = new Date(asOf)
  today.setHours(0, 0, 0, 0)
  parsed.setHours(0, 0, 0, 0)
  return parsed.getTime() <= today.getTime() ? 'inactive' : 'leaving'
}

export function actionGroup(action: PendingAction) {
  if (action === 'add_employee') return 'additions'
  if (action === 'edit_employee') return 'edits'
  if (
    action === 'add_dependant' ||
    action === 'edit_dependant' ||
    action === 'remove_dependant'
  ) {
    return 'dependants'
  }
  if (action === 'employee_exit') return 'exits'
  return 'bulk'
}

export const GROUP_LABELS = {
  additions: 'Additions',
  edits: 'Edits',
  dependants: 'Dependants',
  exits: 'Employee exits',
  bulk: 'Bulk changes',
} as const
