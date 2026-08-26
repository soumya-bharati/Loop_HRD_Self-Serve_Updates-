import {
  domainCdAccounts,
  getBenefitConfig,
  getCdAccountConfig,
  getPlanConfig,
} from './dealCatalog'
import type {
  FlexDealConfig,
  RefundEstimateResult,
  RefundLineResult,
  RefundZeroReason,
  RetainedBenefitResult,
} from './types'

export interface BuildRefundInput {
  deal: FlexDealConfig
  /** Benefit ids ending on offboard. */
  endingBenefitIds: string[]
  dependantCount: number
  /** Benefits with an existing claim (no insurer refund). */
  claimedBenefitIds?: string[]
  planId?: string | null
}

export function zeroReasonLabel(reason: RefundZeroReason): string {
  if (reason === 'claim') return 'A claim exists on this cover'
  if (reason === 'not_insurance') return 'Not an insurance benefit'
  if (reason === 'not_prorated') return 'Premium is not prorated'
  return 'Not eligible for refund'
}

function refundForBenefit(
  deal: FlexDealConfig,
  benefitId: string,
  lives: number,
  claimedBenefitIds: string[],
): {
  insurerRefund: number
  employeeRefund: number
  zeroReason?: RefundZeroReason
  staysActive?: boolean
  staysActiveNote?: string
} {
  const benefit = getBenefitConfig(deal, benefitId)
  if (!benefit) {
    return { insurerRefund: 0, employeeRefund: 0, zeroReason: 'not_eligible' }
  }

  if (benefit.retainedOnOffboard) {
    return {
      insurerRefund: 0,
      employeeRefund: 0,
      zeroReason: 'not_insurance',
      staysActive: true,
      staysActiveNote:
        benefit.retainedReason ??
        'This benefit has a fixed validity and will not end on the employee\'s leaving date.',
    }
  }

  if (!benefit.isInsurance) {
    return {
      insurerRefund: 0,
      employeeRefund: 0,
      zeroReason: 'not_insurance',
    }
  }

  if (!benefit.premiumProrated) {
    return {
      insurerRefund: 0,
      employeeRefund: 0,
      zeroReason: 'not_prorated',
    }
  }

  if (claimedBenefitIds.includes(benefitId)) {
    return {
      insurerRefund: 0,
      employeeRefund: Math.round(benefit.payrollContribution * lives * 0.5),
      zeroReason: 'claim',
    }
  }

  // Mock prorated refund ~ 2× unit cost fraction.
  const insurerRefund = Math.round(benefit.unitCost * lives * 0.45)
  const employeeRefund = Math.round(benefit.payrollContribution * lives * 0.6)
  return { insurerRefund, employeeRefund }
}

/**
 * Build offboarding refund estimate with retained benefits and CD grouping.
 * Always surfaces explicit zero-refund reasons.
 */
export function buildRefundEstimate(
  input: BuildRefundInput,
): RefundEstimateResult {
  const {
    deal,
    endingBenefitIds,
    dependantCount,
    claimedBenefitIds = [],
    planId,
  } = input

  const lives = 1 + Math.max(0, dependantCount)
  const lines: RefundLineResult[] = []
  const retainedBenefits: RetainedBenefitResult[] = []
  const policiesByCdMap = new Map<
    string,
    {
      cdAccountId: string
      cdAccountName: string
      cdBalance: number
      policies: { policyName: string; lives: number; refund: number }[]
    }
  >()

  const endingIds = [...new Set(endingBenefitIds)]

  for (const benefitId of endingIds) {
    const benefit = getBenefitConfig(deal, benefitId)
    if (!benefit) continue

    if (benefit.retainedOnOffboard) {
      retainedBenefits.push({
        benefitId,
        label: benefit.name,
        retainedUntil: benefit.retainedUntil,
        reason:
          benefit.retainedReason ??
          'Flat-validity benefit remains active until its configured end date.',
      })
    }

    const refund = refundForBenefit(deal, benefitId, lives, claimedBenefitIds)
    const lineLives =
      benefit.category === 'gmc' && benefit.id.includes('parental')
        ? Math.min(lives, 2)
        : benefit.retainedOnOffboard
          ? 1
          : lives

    lines.push({
      id: `line-${benefitId}`,
      label: benefit.policyName || benefit.name,
      kind: 'benefit',
      lives: lineLives,
      insurerRefund: refund.insurerRefund,
      employeeRefund: refund.employeeRefund,
      zeroReason: refund.zeroReason,
      staysActive: refund.staysActive,
      staysActiveNote: refund.staysActiveNote,
    })

    if (!refund.staysActive) {
      const cdAccountId =
        benefit.cdAccountId ??
        domainCdAccounts.find((c) => c.policyIds.includes(benefitId))?.id ??
        'cd-main'
      const cd = getCdAccountConfig(cdAccountId)
      const bucket = policiesByCdMap.get(cdAccountId) ?? {
        cdAccountId,
        cdAccountName: cd?.name ?? 'CD',
        cdBalance: cd?.balance ?? 0,
        policies: [],
      }
      bucket.policies.push({
        policyName: benefit.policyName,
        lives: lineLives,
        refund: refund.insurerRefund,
      })
      policiesByCdMap.set(cdAccountId, bucket)
    }
  }

  if (planId) {
    const plan = getPlanConfig(deal, planId)
    if (plan) {
      const componentLines = plan.benefitIds
        .filter((id) => endingIds.includes(id))
        .map((id) => {
          const benefit = getBenefitConfig(deal, id)!
          const refund = refundForBenefit(deal, id, lives, claimedBenefitIds)
          return {
            id: `comp-${id}`,
            label: benefit.name,
            kind: 'component' as const,
            lives,
            insurerRefund: refund.insurerRefund,
            employeeRefund: refund.employeeRefund,
            zeroReason: refund.zeroReason,
          }
        })

      if (componentLines.length > 0) {
        lines.unshift({
          id: `line-plan-${plan.id}`,
          label: plan.name,
          kind: 'plan',
          lives,
          insurerRefund: componentLines.reduce((s, c) => s + c.insurerRefund, 0),
          employeeRefund: componentLines.reduce(
            (s, c) => s + c.employeeRefund,
            0,
          ),
          components: componentLines,
        })
      }
    }
  }

  // Ensure every zero line has a reason.
  for (const line of lines) {
    if (
      line.insurerRefund === 0 &&
      line.employeeRefund === 0 &&
      !line.zeroReason &&
      !line.staysActive
    ) {
      line.zeroReason = 'not_eligible'
    }
  }

  return {
    totalLivesDeleted: lives,
    totalInsurerRefund: lines
      .filter((l) => l.kind !== 'plan')
      .reduce((s, l) => s + l.insurerRefund, 0),
    totalEmployeeRefund: lines
      .filter((l) => l.kind !== 'plan')
      .reduce((s, l) => s + l.employeeRefund, 0),
    lines,
    retainedBenefits,
    policiesByCd: [...policiesByCdMap.values()],
  }
}

/** Ending vs retained split for offboard coverage summary. */
export function splitEndingAndRetained(
  deal: FlexDealConfig,
  benefitIds: string[],
): {
  ending: { benefitId: string; label: string }[]
  retained: RetainedBenefitResult[]
} {
  const ending: { benefitId: string; label: string }[] = []
  const retained: RetainedBenefitResult[] = []

  for (const id of benefitIds) {
    const benefit = getBenefitConfig(deal, id)
    if (!benefit) continue
    if (benefit.retainedOnOffboard) {
      retained.push({
        benefitId: id,
        label: benefit.name,
        retainedUntil: benefit.retainedUntil,
        reason:
          benefit.retainedReason ??
          'This benefit has a fixed validity and will not end on the employee\'s leaving date.',
      })
    } else {
      ending.push({ benefitId: id, label: benefit.name })
    }
  }

  return { ending, retained }
}
