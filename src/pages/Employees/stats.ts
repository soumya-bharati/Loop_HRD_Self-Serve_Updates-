import type { Gender, SearchableEmployee } from '@/data/employees'
import { entityIdForEmployee } from '@/pages/ManageLives/searchEmployees'

export type RelationshipBucket =
  | 'Employees'
  | 'Spouses'
  | 'Parents'
  | 'Parents-In-Law'
  | 'Children'

export interface RelationshipSlice {
  label: RelationshipBucket
  count: number
  percent: number
  color: string
}

export interface RosterStats {
  totalEmployees: number
  totalLives: number
  livesWithEcards: number
  livesInProgress: number
  employeesWithEcards: number
  ecardPercent: number
  inProgressPercent: number
  relationship: RelationshipSlice[]
}

export interface DependantCovered {
  name: string
  relationship: string
  gender: Gender
}

export interface RosterRow {
  id: string
  employeeId: string
  name: string
  initials: string
  gender: Gender
  dateOfBirth: string
  email: string
  sumInsured: string
  coverageStart: string
  insuranceStatus: 'Insured' | 'In Progress'
  empStatus: 'Active' | 'Leaving' | 'Inactive'
  enrStatus: 'Enrolled' | 'Pending'
  reminderScheduled: boolean
  dependants: DependantCovered[]
  plans: string[]
  benefits: string[]
  planPremium: string
  benefitPremium: string
  wallet: string
  prepaid: string
  payrollDeduction: string
  href: string
  kind: 'employee' | 'dependant'
}

export const RELATIONSHIP_COLORS: Record<RelationshipBucket, string> = {
  Employees: '#025F4C',
  Spouses: '#FDD506',
  Parents: '#7F8785',
  'Parents-In-Law': '#A586EF',
  Children: '#FF8080',
}

export const PAGE_SIZE = 10

function bucketForRelationship(
  relationship: string,
): RelationshipBucket | null {
  if (relationship === 'Spouse') return 'Spouses'
  if (relationship === 'Parent') return 'Parents'
  if (relationship === 'Parent-in-law') return 'Parents-In-Law'
  if (relationship === 'Child') return 'Children'
  return null
}

export function filterRoster(
  employees: SearchableEmployee[],
  filters: { entityId?: string; dealId?: string; query?: string },
) {
  const q = filters.query?.trim().toLowerCase() ?? ''
  return employees.filter((employee) => {
    if (
      filters.entityId &&
      entityIdForEmployee(employee) !== filters.entityId
    ) {
      return false
    }
    if (filters.dealId && employee.dealId && employee.dealId !== filters.dealId) {
      return false
    }
    if (!q) return true
    const hay = [
      employee.employeeId,
      employee.id,
      employee.firstName,
      employee.lastName,
      employee.email,
      employee.department,
    ]
      .join(' ')
      .toLowerCase()
    return hay.includes(q)
  })
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/** Figma format: Apr 24, 2026 */
export function formatCoverageDate(iso: string) {
  if (!iso) return '—'
  const date = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

export function formatCount(n: number) {
  return n.toLocaleString('en-IN')
}

function relationshipLabel(relationship: string) {
  return relationship.toLowerCase()
}

function initialsFor(firstName: string, lastName: string) {
  const first = firstName.trim().charAt(0)
  return (first || '?').toUpperCase()
}

/** Prototype: every active life is treated as having an e-card. */
export function buildRosterStats(employees: SearchableEmployee[]): RosterStats {
  const totalEmployees = employees.length
  const dependantCount = employees.reduce(
    (sum, employee) => sum + employee.dependants.length,
    0,
  )
  const totalLives = totalEmployees + dependantCount

  const counts: Record<RelationshipBucket, number> = {
    Employees: totalEmployees,
    Spouses: 0,
    Parents: 0,
    'Parents-In-Law': 0,
    Children: 0,
  }

  for (const employee of employees) {
    for (const dependant of employee.dependants) {
      const bucket = bucketForRelationship(dependant.relationship)
      if (bucket) counts[bucket] += 1
    }
  }

  const relationship: RelationshipSlice[] = (
    Object.keys(counts) as RelationshipBucket[]
  ).map((label) => ({
    label,
    count: counts[label],
    percent: totalLives === 0 ? 0 : Math.round((counts[label] / totalLives) * 100),
    color: RELATIONSHIP_COLORS[label],
  }))

  return {
    totalEmployees,
    totalLives,
    livesWithEcards: totalLives,
    livesInProgress: 0,
    employeesWithEcards: totalEmployees,
    ecardPercent: totalLives === 0 ? 0 : 100,
    inProgressPercent: 0,
    relationship,
  }
}

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function buildDealFields(
  employee: SearchableEmployee,
  insuranceStatus: 'Insured' | 'In Progress',
  empStatus: 'Active' | 'Leaving' | 'Inactive',
) {
  const plans = employee.plans.map((plan) => plan.name)
  const benefits = employee.coverages
    .filter((item) => item.kind === 'benefit')
    .map((item) => item.label)
  const dependants: DependantCovered[] = employee.dependants.map((item) => ({
    name: `${item.firstName} ${item.lastName}`.trim(),
    relationship: relationshipLabel(item.relationship),
    gender: item.gender,
  }))
  const payroll = employee.currentPayrollDeduction ?? 0
  const planPremium = Math.max(payroll * 8, 2400)
  const benefitPremium = Math.max(payroll * 3, 900)

  return {
    email: employee.email,
    gender: employee.gender,
    dateOfBirth: formatCoverageDate(employee.dateOfBirth),
    initials: initialsFor(employee.firstName, employee.lastName),
    empStatus,
    enrStatus:
      insuranceStatus === 'Insured'
        ? ('Enrolled' as const)
        : ('Pending' as const),
    reminderScheduled: insuranceStatus !== 'Insured',
    dependants,
    plans,
    benefits,
    planPremium: formatINR(planPremium),
    benefitPremium: formatINR(benefitPremium),
    wallet: '₹5L',
    prepaid: '₹5L',
    payrollDeduction: '₹5L',
  }
}

export function buildEmployeeRows(
  employees: SearchableEmployee[],
  statusFor: (employee: SearchableEmployee) => 'Insured' | 'In Progress',
  lifecycleFor?: (
    employee: SearchableEmployee,
  ) => 'Active' | 'Leaving' | 'Inactive',
): RosterRow[] {
  return employees.map((employee) => {
    const insuranceStatus = statusFor(employee)
    const empStatus = lifecycleFor?.(employee) ?? 'Active'
    return {
      id: employee.id,
      employeeId: employee.employeeId,
      name: `${employee.firstName} ${employee.lastName}`,
      sumInsured: '₹5 lacs',
      coverageStart: formatCoverageDate(employee.dateOfJoining),
      insuranceStatus,
      href: `/manage-lives/employee/${employee.id}`,
      kind: 'employee' as const,
      ...buildDealFields(employee, insuranceStatus, empStatus),
    }
  })
}

export function buildLifeRows(
  employees: SearchableEmployee[],
  statusFor: (employee: SearchableEmployee) => 'Insured' | 'In Progress',
  lifecycleFor?: (
    employee: SearchableEmployee,
  ) => 'Active' | 'Leaving' | 'Inactive',
): RosterRow[] {
  const rows: RosterRow[] = []
  for (const employee of employees) {
    const insuranceStatus = statusFor(employee)
    const empStatus = lifecycleFor?.(employee) ?? 'Active'
    const deal = buildDealFields(employee, insuranceStatus, empStatus)
    rows.push({
      id: employee.id,
      employeeId: employee.employeeId,
      name: `${employee.firstName} ${employee.lastName}`,
      sumInsured: '₹5 lacs',
      coverageStart: formatCoverageDate(employee.dateOfJoining),
      insuranceStatus,
      href: `/manage-lives/employee/${employee.id}`,
      kind: 'employee',
      ...deal,
    })
    for (const dependant of employee.dependants) {
      rows.push({
        id: `${employee.id}-${dependant.id}`,
        employeeId: employee.employeeId,
        name: `${dependant.firstName} ${dependant.lastName}`,
        sumInsured: '₹5 lacs',
        coverageStart: formatCoverageDate(employee.dateOfJoining),
        insuranceStatus,
        href: `/manage-lives/employee/${employee.id}`,
        kind: 'dependant',
        ...deal,
        email: dependant.email || employee.email,
        gender: dependant.gender,
        dateOfBirth: formatCoverageDate(dependant.dateOfBirth),
        initials: initialsFor(dependant.firstName, dependant.lastName),
        reminderScheduled: false,
        dependants: [],
        plans: [],
        benefits: [],
        planPremium: '—',
        benefitPremium: '—',
        wallet: '—',
        prepaid: '—',
        payrollDeduction: '—',
      })
    }
  }
  return rows
}

export function rosterToCsv(rows: RosterRow[]) {
  const header = [
    'Name',
    'Employee ID',
    'Email',
    'Coverage start date',
    'Emp. Status',
    'Enr. Status',
    'Dependents Covered',
    'Plans Selected',
    'Plan Premium',
    'Benefits Selected',
    'Benefit Premium',
    'Wallet',
    'Prepaid',
    'Payroll Deduction',
  ]
  const body = rows.map((row) =>
    [
      row.name,
      row.employeeId,
      row.email,
      row.coverageStart,
      row.empStatus,
      row.enrStatus,
      row.dependants
        .map((d) => `${d.name} (${d.relationship})`)
        .join('; ') || '—',
      row.plans.join('; ') || '—',
      row.planPremium,
      row.benefits.join('; ') || '—',
      row.benefitPremium,
      row.wallet,
      row.prepaid,
      row.payrollDeduction,
    ]
      .map((cell) => `"${cell.replaceAll('"', '""')}"`)
      .join(','),
  )
  return [header.join(','), ...body].join('\n')
}
