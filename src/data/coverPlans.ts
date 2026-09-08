import { getCdAccount, type BulkMemberRow, type InsurerLogo } from '@/data/flexDeal'

export type CoverId =
  | 'cover-health'
  | 'cover-health-topup'
  | 'cover-opd'
  | 'cover-term-life'
  | 'cover-pa'

export interface CoverPlan {
  id: string
  label: string
  /** Per-life endorsement cost for this plan. */
  unitCost: number
}

export interface CoverDefinition {
  id: CoverId
  name: string
  /** Short code shown alongside the cover name, matching endorsement paperwork. */
  shortLabel: string
  insurerName: string
  insurerLogo: InsurerLogo | 'care' | 'aditya-birla'
  policyNumber: string
  cdAccountId: string
  plans: CoverPlan[]
  /** Plain-language rule shown to HR in the "how benefits are assigned" modal. */
  assignmentNote: string
}

export const coverCatalog: CoverDefinition[] = [
  {
    id: 'cover-health',
    name: 'Health Insurance',
    shortLabel: 'GMC',
    insurerName: 'Care Health Insurance',
    insurerLogo: 'care',
    policyNumber: '99929749',
    cdAccountId: 'cd-main',
    plans: [
      { id: 'health-base', label: 'Base', unitCost: 850 },
      { id: 'health-silver', label: 'Silver', unitCost: 1200 },
      { id: 'health-gold', label: 'Gold', unitCost: 1850 },
      { id: 'health-platinum', label: 'Platinum', unitCost: 2400 },
    ],
    assignmentNote:
      'Every life gets Health Insurance. Employees get Gold (Platinum on the Parental Plan), spouses Silver, children and parents Base.',
  },
  {
    id: 'cover-health-topup',
    name: 'Health Insurance Top-up',
    shortLabel: 'Top-up',
    insurerName: 'Care Health Insurance',
    insurerLogo: 'care',
    policyNumber: '99929753',
    cdAccountId: 'cd-main',
    plans: [
      { id: 'topup-general', label: 'General', unitCost: 450 },
      { id: 'topup-advance', label: 'Advance', unitCost: 720 },
      { id: 'topup-exclusive', label: 'Exclusive', unitCost: 1100 },
    ],
    assignmentNote:
      'Employees and spouses only. Employees get Advance (Exclusive on the Parental Plan), spouses get General.',
  },
  {
    id: 'cover-opd',
    name: 'OPD Cover',
    shortLabel: 'OPD',
    insurerName: 'Care Health Insurance',
    insurerLogo: 'care',
    policyNumber: '20451601',
    cdAccountId: 'cd-main',
    plans: [
      { id: 'opd-essential', label: 'Essential', unitCost: 300 },
      { id: 'opd-complete', label: 'Complete Cover', unitCost: 560 },
    ],
    assignmentNote:
      'Employees, spouses and children. Complete Cover on the Parental Plan, Essential otherwise.',
  },
  {
    id: 'cover-term-life',
    name: 'Term Life',
    shortLabel: 'GTL',
    insurerName: 'Aditya Birla Sun Life Insurance Company Ltd',
    insurerLogo: 'aditya-birla',
    policyNumber: '509468',
    cdAccountId: 'cd-life',
    plans: [{ id: 'term-life-general', label: 'General', unitCost: 650 }],
    assignmentNote: 'Employees only, on the General plan.',
  },
  {
    id: 'cover-pa',
    name: 'Personal Accident Cover',
    shortLabel: 'GPA',
    insurerName: 'Care Health Insurance',
    insurerLogo: 'care',
    policyNumber: '20415113',
    cdAccountId: 'cd-main',
    plans: [{ id: 'pa-general', label: 'General', unitCost: 420 }],
    assignmentNote: 'Employees only, on the General plan.',
  },
]

export function getCover(coverId: CoverId) {
  return coverCatalog.find((cover) => cover.id === coverId)
}

export function getCoverPlan(coverId: CoverId, planId: string) {
  return getCover(coverId)?.plans.find((plan) => plan.id === planId)
}

export interface CoverAssignment {
  coverId: CoverId
  coverName: string
  planId: string
  planLabel: string
  unitCost: number
}

type Relationship = BulkMemberRow['relationship']

/** Which plan of each cover a life lands on, given its relationship and assigned plan. */
function planIdFor(
  coverId: CoverId,
  relationship: Relationship,
  parentalPlan: boolean,
): string | null {
  switch (coverId) {
    case 'cover-health':
      if (relationship === 'Self') {
        return parentalPlan ? 'health-platinum' : 'health-gold'
      }
      if (relationship === 'Spouse') return 'health-silver'
      return 'health-base'

    case 'cover-health-topup':
      if (relationship === 'Self') {
        return parentalPlan ? 'topup-exclusive' : 'topup-advance'
      }
      if (relationship === 'Spouse') return 'topup-general'
      return null

    case 'cover-opd':
      if (relationship === 'Parent') return null
      return parentalPlan ? 'opd-complete' : 'opd-essential'

    case 'cover-term-life':
    case 'cover-pa':
      return relationship === 'Self' ? getCover(coverId)!.plans[0].id : null
  }
}

/** A life counts towards the breakup once it has a plan and is not failing validation. */
export function isRowAssigned(row: BulkMemberRow) {
  return row.status !== 'fail' && Boolean(row.assignedPlanId)
}

export function coverAssignmentsForRow(row: BulkMemberRow): CoverAssignment[] {
  if (!isRowAssigned(row)) return []
  const parentalPlan = row.assignedPlanId === 'plan-parental'

  const assignments: CoverAssignment[] = []
  for (const cover of coverCatalog) {
    const planId = planIdFor(cover.id, row.relationship, parentalPlan)
    if (!planId) continue
    const plan = cover.plans.find((item) => item.id === planId)
    if (!plan) continue
    assignments.push({
      coverId: cover.id,
      coverName: cover.name,
      planId: plan.id,
      planLabel: plan.label,
      unitCost: plan.unitCost,
    })
  }
  return assignments
}

/** Short label for a life's assignment, e.g. "Health Insurance · Gold". */
export function rowAssignmentLabel(row: BulkMemberRow) {
  const assignments = coverAssignmentsForRow(row)
  if (assignments.length === 0) return 'Unassigned'
  const health = assignments.find((a) => a.coverId === 'cover-health')
  const lead = health ?? assignments[0]
  return `${lead.coverName} · ${lead.planLabel}`
}

export interface CoverPlanLine {
  planId: string
  planLabel: string
  lives: number
  cost: number
}

export interface CoverBreakup {
  cover: CoverDefinition
  lives: number
  cost: number
  plans: CoverPlanLine[]
}

/** Lives and cost per cover, broken down by the plan each life landed on. */
export function buildCoverBreakup(rows: BulkMemberRow[]): CoverBreakup[] {
  const byCover = new Map<CoverId, Map<string, number>>()

  for (const row of rows) {
    for (const assignment of coverAssignmentsForRow(row)) {
      const plans = byCover.get(assignment.coverId) ?? new Map<string, number>()
      plans.set(assignment.planId, (plans.get(assignment.planId) ?? 0) + 1)
      byCover.set(assignment.coverId, plans)
    }
  }

  const breakup: CoverBreakup[] = []
  for (const cover of coverCatalog) {
    const counts = byCover.get(cover.id)
    if (!counts) continue

    const plans: CoverPlanLine[] = []
    for (const plan of cover.plans) {
      const lives = counts.get(plan.id) ?? 0
      if (lives === 0) continue
      plans.push({
        planId: plan.id,
        planLabel: plan.label,
        lives,
        cost: lives * plan.unitCost,
      })
    }
    if (plans.length === 0) continue

    breakup.push({
      cover,
      lives: plans.reduce((sum, plan) => sum + plan.lives, 0),
      cost: plans.reduce((sum, plan) => sum + plan.cost, 0),
      plans,
    })
  }
  return breakup
}

export interface InsurerCostGroup {
  key: string
  insurerName: string
  insurerLogo: CoverDefinition['insurerLogo']
  cdAccountId: string
  cdAccountName: string
  cdBalance: number
  covers: CoverBreakup[]
}

/** Cover breakups grouped into the insurer cards shown on the review page. */
export function buildInsurerGroups(breakup: CoverBreakup[]): InsurerCostGroup[] {
  const groups = new Map<string, InsurerCostGroup>()

  for (const item of breakup) {
    const key = `${item.cover.insurerName}::${item.cover.cdAccountId}`
    const existing = groups.get(key)
    if (existing) {
      existing.covers.push(item)
      continue
    }
    const cd = getCdAccount(item.cover.cdAccountId)
    groups.set(key, {
      key,
      insurerName: item.cover.insurerName,
      insurerLogo: item.cover.insurerLogo,
      cdAccountId: item.cover.cdAccountId,
      cdAccountName: cd?.name ?? 'CD Account',
      cdBalance: cd?.balance ?? 0,
      covers: [item],
    })
  }

  return [...groups.values()]
}

export interface BreakupTotals {
  lives: number
  cost: number
}

/**
 * Lives counts people, not cover enrolments, so it comes off the rows while cost
 * sums every cover a life is enrolled on.
 */
export function breakupTotals(
  rows: BulkMemberRow[],
  breakup: CoverBreakup[],
): BreakupTotals {
  return {
    lives: rows.filter(isRowAssigned).length,
    cost: breakup.reduce((sum, item) => sum + item.cost, 0),
  }
}

/** Chips like "4 Gold · 2 Base" for the validation page headline. */
export function planChips(breakup: CoverBreakup[]) {
  const chips: { key: string; label: string; lives: number }[] = []
  for (const item of breakup) {
    for (const plan of item.plans) {
      chips.push({
        key: `${item.cover.id}:${plan.planId}`,
        label: `${item.cover.name} · ${plan.planLabel}`,
        lives: plan.lives,
      })
    }
  }
  return chips.sort((a, b) => b.lives - a.lives)
}

export function formatINRExact(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
