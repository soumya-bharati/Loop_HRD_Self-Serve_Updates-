import {
  domainCdAccounts,
  getBenefitConfig,
  getCdAccountConfig,
} from './dealCatalog'
import type {
  FlexDealConfig,
  PolicyImpact,
  PolicyImpactLine,
} from './types'

export interface LifeCoverSelection {
  /** Benefit ids covering this life. */
  benefitIds: string[]
}

export interface BuildPolicyImpactInput {
  deal: FlexDealConfig
  lives: LifeCoverSelection[]
  /** Existing monthly payroll deduction (for delta views). */
  currentPayrollDeduction?: number
  forceCdShortfall?: boolean
}

/**
 * Configuration-driven endorsement + payroll + CD shortfall impact.
 */
export function buildPolicyImpact(input: BuildPolicyImpactInput): PolicyImpact {
  const { deal, lives, currentPayrollDeduction, forceCdShortfall } = input

  const byBenefit = new Map<
    string,
    { lives: number; cost: number; payroll: number }
  >()

  for (const life of lives) {
    for (const benefitId of life.benefitIds) {
      const benefit = getBenefitConfig(deal, benefitId)
      if (!benefit) continue
      const cur = byBenefit.get(benefitId) ?? { lives: 0, cost: 0, payroll: 0 }
      cur.lives += 1
      cur.cost += benefit.unitCost
      cur.payroll += benefit.payrollContribution
      byBenefit.set(benefitId, cur)
    }
  }

  const policies: PolicyImpactLine[] = []
  for (const [benefitId, agg] of byBenefit) {
    const benefit = getBenefitConfig(deal, benefitId)!
    const cdAccountId =
      benefit.cdAccountId ??
      domainCdAccounts.find((c) => c.policyIds.includes(benefitId))?.id ??
      'cd-main'
    const cd = getCdAccountConfig(cdAccountId)
    const endorsementCost = agg.cost
    policies.push({
      policyId: benefit.id,
      policyName: benefit.policyName,
      insurerName: benefit.insurerName,
      insurerLogo: benefit.insurerLogo,
      policyNumber: benefit.policyNumber,
      livesAdded: agg.lives,
      endorsementCost,
      cdAccountId,
      cdAccountName: cd?.name ?? 'CD',
      cdBalance: forceCdShortfall
        ? Math.min(cd?.balance ?? 0, Math.max(endorsementCost - 5000, 0))
        : (cd?.balance ?? 0),
      benefitIds: [benefitId],
    })
  }

  const totalEndorsementCost = policies.reduce(
    (sum, p) => sum + p.endorsementCost,
    0,
  )
  const totalPayrollDeduction = [...byBenefit.values()].reduce(
    (sum, a) => sum + a.payroll,
    0,
  )
  const assignedLives = lives.filter((l) => l.benefitIds.length > 0).length

  let shortfall = 0
  const byCd = new Map<string, { balance: number; cost: number }>()
  for (const p of policies) {
    const cur = byCd.get(p.cdAccountId) ?? {
      balance: p.cdBalance,
      cost: 0,
    }
    cur.cost += p.endorsementCost
    byCd.set(p.cdAccountId, cur)
  }
  for (const v of byCd.values()) {
    if (v.cost > v.balance) shortfall += v.cost - v.balance
  }

  const additional =
    currentPayrollDeduction !== undefined
      ? totalPayrollDeduction
      : undefined
  const newPayroll =
    currentPayrollDeduction !== undefined
      ? currentPayrollDeduction + totalPayrollDeduction
      : totalPayrollDeduction

  return {
    totalLivesAdded: assignedLives,
    totalEndorsementCost,
    totalPayrollDeduction: newPayroll,
    monthlyInstallment: additional ?? totalPayrollDeduction,
    currentPayrollDeduction,
    additionalPayrollDeduction: additional,
    policies,
    cdShortfall: shortfall > 0 || Boolean(forceCdShortfall),
    cdShortfallAmount:
      shortfall || (forceCdShortfall ? 12_500 : 0),
  }
}

/** Payroll delta only (add-dependant review). */
export function computePayrollDelta(
  deal: FlexDealConfig,
  currentMonthly: number,
  addedBenefitIds: string[],
): {
  current: number
  additional: number
  next: number
} {
  const additional = addedBenefitIds.reduce((sum, id) => {
    const benefit = getBenefitConfig(deal, id)
    return sum + (benefit?.payrollContribution ?? 0)
  }, 0)
  return {
    current: currentMonthly,
    additional,
    next: currentMonthly + additional,
  }
}

/** Compare two payroll totals for correction impact checks. */
export function payrollWouldChange(
  beforeBenefitIds: string[],
  afterBenefitIds: string[],
  deal: FlexDealConfig,
): boolean {
  const sum = (ids: string[]) =>
    ids.reduce((total, id) => {
      const b = getBenefitConfig(deal, id)
      return total + (b?.payrollContribution ?? 0)
    }, 0)
  return sum(beforeBenefitIds) !== sum(afterBenefitIds)
}
