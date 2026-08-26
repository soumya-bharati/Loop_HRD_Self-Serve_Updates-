import { ageFromDateOfBirth } from './dates'
import { getBenefitConfig, getPlanConfig } from './dealCatalog'
import type {
  CoverEligibility,
  EligibilityResult,
  EmployeeEligibilityInput,
  FlexDealConfig,
} from './types'

function eligible(): CoverEligibility {
  return { eligible: true }
}

function ineligible(reason: string): CoverEligibility {
  return { eligible: false, reason }
}

/**
 * Evaluate employee eligibility for plans, purchase-group options, and benefits.
 * Pure and configuration-driven — no UI assumptions.
 */
export function evaluateEmployeeEligibility(
  deal: FlexDealConfig,
  employee: EmployeeEligibilityInput,
  asOf: Date = new Date(),
): EligibilityResult {
  const age = ageFromDateOfBirth(employee.dateOfBirth, asOf)
  const grade = employee.attributes['attr-grade']?.trim() ?? ''
  const under18 = age !== null && age < 18

  const options: Record<string, CoverEligibility> = {}
  const plans: Record<string, CoverEligibility> = {}
  const benefits: Record<string, CoverEligibility> = {}
  const reasons: string[] = []

  for (const plan of deal.plans) {
    if (plan.id === 'plan-parental' && grade === 'L1') {
      plans[plan.id] = ineligible('Parental plan not available for Grade L1')
    } else if (under18 && plan.benefitIds.some((id) => {
      const b = getBenefitConfig(deal, id)
      return b?.category === 'gtl' || b?.category === 'gpa'
    })) {
      plans[plan.id] = ineligible('Available only for members aged 18+')
    } else {
      plans[plan.id] = eligible()
    }
  }

  for (const benefit of deal.benefits) {
    if (
      under18 &&
      (benefit.category === 'gtl' ||
        benefit.category === 'gpa' ||
        benefit.category === 'wellness')
    ) {
      benefits[benefit.id] = ineligible(
        benefit.category === 'wellness'
          ? 'Wellness add-on requires age 18+'
          : 'Available only for members aged 18+',
      )
    } else {
      benefits[benefit.id] = eligible()
    }
  }

  for (const group of deal.purchaseGroups) {
    for (const opt of group.options) {
      if (opt.kind === 'plan' && opt.planId) {
        options[opt.id] = plans[opt.planId] ?? eligible()
      } else if (opt.kind === 'benefit' && opt.benefitId) {
        options[opt.id] = benefits[opt.benefitId] ?? eligible()
      } else {
        options[opt.id] = eligible()
      }

      // Deal-specific option overrides (Herbalife parental / wellness).
      if (opt.id === 'opt-parental' && grade === 'L1') {
        options[opt.id] = ineligible('Parental plan not available for Grade L1')
      }
      if (opt.id === 'opt-wellness' && under18) {
        options[opt.id] = ineligible('Wellness add-on requires age 18+')
      }
    }
  }

  for (const status of Object.values(options)) {
    if (!status.eligible && status.reason) reasons.push(status.reason)
  }

  const hasAnyEligibleOption = Object.values(options).some((o) => o.eligible)

  return {
    dealId: deal.id,
    eligible: hasAnyEligibleOption,
    reasons: [...new Set(reasons)],
    options,
    benefits,
    plans,
  }
}

/** Dependant age / relationship eligibility for a single cover. */
export function evaluateDependantCoverEligibility(
  deal: FlexDealConfig,
  relationship: string,
  dateOfBirth: string,
  coverId: string,
  asOf: Date = new Date(),
): CoverEligibility {
  const age = ageFromDateOfBirth(dateOfBirth, asOf)
  const benefit = getBenefitConfig(deal, coverId)

  if (relationship === 'Child' && age !== null && age > 25) {
    if (
      !benefit ||
      benefit.category === 'gmc' ||
      benefit.category === 'gpa' ||
      benefit.category === 'opd'
    ) {
      return ineligible('Child covers require age 25 or under')
    }
  }

  if (
    (relationship === 'Parent' || relationship === 'Parent-in-law') &&
    age !== null &&
    age > 85
  ) {
    if (benefit?.id === 'ben-gmc-parental' || benefit?.category === 'gmc') {
      return ineligible('Parental cover requires age 85 or under')
    }
  }

  return eligible()
}

export function isRelationshipAllowedForBenefit(
  deal: FlexDealConfig,
  relationship: string,
  benefitId: string,
): boolean {
  const benefit = getBenefitConfig(deal, benefitId)
  if (!benefit) return false
  return benefit.familyDefinition.some((slot) => slot.relationship === relationship)
}

export function resolveBenefitIdsFromSelections(
  deal: FlexDealConfig,
  purchaseGroupSelections: Record<string, string[]>,
): { planIds: string[]; benefitIds: string[] } {
  const planIds: string[] = []
  const benefitIds: string[] = []

  for (const group of deal.purchaseGroups) {
    const chosen = purchaseGroupSelections[group.id] ?? []
    for (const optId of chosen) {
      const opt = group.options.find((o) => o.id === optId)
      if (!opt) continue
      if (opt.kind === 'plan' && opt.planId) {
        planIds.push(opt.planId)
        const plan = getPlanConfig(deal, opt.planId)
        if (plan) benefitIds.push(...plan.benefitIds)
      }
      if (opt.kind === 'benefit' && opt.benefitId) {
        benefitIds.push(opt.benefitId)
      }
    }
  }

  return {
    planIds: [...new Set(planIds)],
    benefitIds: [...new Set(benefitIds)],
  }
}
