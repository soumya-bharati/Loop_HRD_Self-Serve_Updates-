import { sampleEmployees, type SearchableEmployee } from '@/data/employees'
import { organisationEntities } from '@/data/flexDeal'
import { listActiveDeals } from '@/domain/flex'

export function entityIdForEmployee(_employee: SearchableEmployee) {
  return 'symphony-eyc'
}

export function entityNameForEmployee(employee: SearchableEmployee) {
  return (
    organisationEntities.find((item) => item.id === entityIdForEmployee(employee))
      ?.name ?? organisationEntities[0]?.name ?? '—'
  )
}

export function dealNameForEmployee(employee: SearchableEmployee) {
  if (!employee.dealId) return '—'
  return listActiveDeals().find((deal) => deal.id === employee.dealId)?.name ?? '—'
}

export function searchEmployees(
  query: string,
  filters?: { entityId?: string; dealId?: string },
) {
  const q = query.trim().toLowerCase()
  return sampleEmployees.filter((employee) => {
    if (filters?.dealId && employee.dealId && employee.dealId !== filters.dealId) {
      return false
    }
    if (
      filters?.entityId &&
      entityIdForEmployee(employee) !== filters.entityId
    ) {
      return false
    }
    if (!q) return true
    const hay = [
      employee.employeeId,
      employee.firstName,
      employee.lastName,
      employee.email,
      employee.mobile,
      employee.department,
    ]
      .join(' ')
      .toLowerCase()
    return hay.includes(q)
  })
}

export function findEmployee(employeeId: string) {
  return sampleEmployees.find(
    (item) => item.id === employeeId || item.employeeId === employeeId,
  )
}
