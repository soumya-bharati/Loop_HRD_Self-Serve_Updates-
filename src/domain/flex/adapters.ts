/**
 * Adapters between the configuration-driven domain layer and legacy
 * `src/data/flexDeal.ts` shapes so existing UI imports keep working.
 */
import type {
  CustomAttribute,
  FlexBenefit,
  FlexDeal,
  FlexPlan,
  PurchaseGroup,
  CostEstimate,
  RefundEstimate,
  CoverEligibility as LegacyCoverEligibility,
  EmployeeCoverEligibility,
} from '@/data/flexDeal'
import {
  dealCatalog,
  getDealConfig,
  herbalifeFlexDeal,
  listActiveDeals,
} from './dealCatalog'
import { evaluateEmployeeEligibility } from './eligibility'
import type {
  FlexBenefitConfig,
  FlexDealConfig,
  PolicyImpact,
  RefundEstimateResult,
} from './types'

/** Strip domain extensions into the legacy FlexDeal shape used by current UI. */
export function toLegacyFlexDeal(deal: FlexDealConfig): FlexDeal {
  const benefits: FlexBenefit[] = deal.benefits.map((b) => toLegacyBenefit(b))
  const plans: FlexPlan[] = deal.plans.map((p) => ({
    id: p.id,
    name: p.name,
    benefitIds: p.benefitIds,
    maxDependants: p.maxDependants,
  }))
  const purchaseGroups: PurchaseGroup[] = deal.purchaseGroups.map((g) => ({
    id: g.id,
    name: g.name,
    selectMode: g.selectMode,
    options: g.options.map((o) => ({ ...o })),
  }))
  const customAttributes: CustomAttribute[] = deal.employeeAttributes.map(
    (a) => ({
      id: a.id,
      label: a.label,
      required: a.required,
      inputBy: a.inputBy,
      allowedValues: a.allowedValues,
    }),
  )

  return {
    id: deal.id,
    name: deal.name,
    isFlexCompany: true,
    plans,
    benefits,
    purchaseGroups,
    customAttributes,
    assignmentRules: deal.assignmentRules.map((r) => ({
      id: r.id,
      department: r.department,
      planId: r.planId,
    })),
    defaultPlanId: deal.defaultPlanId,
    maxDependantsUnion: deal.maxDependantsUnion,
  }
}

function toLegacyBenefit(b: FlexBenefitConfig): FlexBenefit {
  const category =
    b.category === 'wellness' || b.category === 'other' ? 'opd' : b.category
  return {
    id: b.id,
    name: b.name,
    policyName: b.policyName,
    policyNumber: b.policyNumber,
    insurerName: b.insurerName,
    insurerLogo: b.insurerLogo === 'care' || b.insurerLogo === 'aditya-birla'
      ? 'digit'
      : b.insurerLogo,
    category,
    isInsurance: b.isInsurance,
    premiumProrated: b.premiumProrated,
  }
}

/**
 * Enrich a legacy deal with domain defaults when only the slim FlexDeal exists.
 * Prefer `getDealConfig` from the domain catalog when the deal id is known.
 */
export function fromLegacyFlexDeal(deal: FlexDeal): FlexDealConfig {
  const fromCatalog = getDealConfig(deal.id)
  if (fromCatalog) return fromCatalog

  return {
    id: deal.id,
    name: deal.name,
    isFlexCompany: true,
    status: 'active',
    periodLabel: 'Active period',
    periodStart: '',
    periodEnd: '',
    plans: deal.plans.map((p) => ({ ...p })),
    benefits: deal.benefits.map((b) => ({
      id: b.id,
      name: b.name,
      policyName: b.policyName,
      policyNumber: b.policyNumber,
      insurerName: b.insurerName,
      insurerLogo: b.insurerLogo,
      category: b.category,
      isInsurance: b.isInsurance,
      premiumProrated: b.premiumProrated,
      unitCost: 1620,
      payrollContribution: 400,
      familyDefinition: [],
      dependantAttributes: [],
      midtermRules: [],
    })),
    purchaseGroups: deal.purchaseGroups.map((g) => ({
      ...g,
      requirement: 'optional' as const,
      options: g.options.map((o) => ({ ...o })),
    })),
    employeeAttributes: deal.customAttributes.map((a) => ({
      id: a.id,
      label: a.label,
      required: a.required,
      inputBy: a.inputBy,
      entity: 'employee' as const,
      allowedValues: a.allowedValues,
    })),
    assignmentRules: deal.assignmentRules.map((r) => ({ ...r })),
    defaultPlanId: deal.defaultPlanId,
    maxDependantsUnion: deal.maxDependantsUnion,
  }
}

/** Legacy-compatible active deals list derived from the domain catalog. */
export function legacyActiveDealsFromCatalog(): FlexDeal[] {
  return listActiveDeals(dealCatalog).map(toLegacyFlexDeal)
}

/** Map domain PolicyImpact → legacy CostEstimate for existing cost summary UI. */
export function toLegacyCostEstimate(impact: PolicyImpact): CostEstimate {
  return {
    totalLivesAdded: impact.totalLivesAdded,
    totalEndorsementCost: impact.totalEndorsementCost,
    totalPayrollDeduction: impact.totalPayrollDeduction,
    monthlyInstallment: impact.monthlyInstallment,
    policies: impact.policies.map((p) => ({
      policyId: p.policyId,
      policyName: p.policyName,
      insurerName: p.insurerName,
      insurerLogo: p.insurerLogo,
      policyNumber: p.policyNumber,
      livesAdded: p.livesAdded,
      endorsementCost: p.endorsementCost,
      cdAccountId: p.cdAccountId,
      cdAccountName: p.cdAccountName,
      cdBalance: p.cdBalance,
    })),
    cdShortfall: impact.cdShortfall,
    cdShortfallAmount: impact.cdShortfallAmount,
  }
}

/** Map domain refund result → legacy RefundEstimate. */
export function toLegacyRefundEstimate(
  result: RefundEstimateResult,
): RefundEstimate {
  return {
    totalLivesDeleted: result.totalLivesDeleted,
    totalInsurerRefund: result.totalInsurerRefund,
    totalEmployeeRefund: result.totalEmployeeRefund,
    lines: result.lines.map((l) => ({
      id: l.id,
      label: l.label,
      kind: l.kind,
      lives: l.lives,
      insurerRefund: l.insurerRefund,
      employeeRefund: l.employeeRefund,
      zeroReason:
        l.zeroReason === 'not_eligible' ? undefined : l.zeroReason,
      staysActive: l.staysActive,
      staysActiveNote: l.staysActiveNote,
      components: l.components?.map((c) => ({
        id: c.id,
        label: c.label,
        kind: c.kind,
        lives: c.lives,
        insurerRefund: c.insurerRefund,
        employeeRefund: c.employeeRefund,
        zeroReason:
          c.zeroReason === 'not_eligible' ? undefined : c.zeroReason,
      })),
    })),
    policiesByCd: result.policiesByCd,
  }
}

/**
 * Domain-backed employee cover eligibility in the legacy
 * `{ policies, options }` shape used by SelectionStep / BenefitsStep.
 * Policy keys are left empty — callers should keep using selectablePolicies
 * for non-Flex policy eligibility until that catalog is unified.
 */
export function toLegacyEmployeeCoverEligibility(
  dealId: string,
  employee: {
    dateOfBirth: string
    customAttributes: Record<string, string>
    department?: string
  },
): EmployeeCoverEligibility {
  const deal = getDealConfig(dealId) ?? herbalifeFlexDeal
  const result = evaluateEmployeeEligibility(deal, {
    dateOfBirth: employee.dateOfBirth,
    department: employee.department,
    attributes: employee.customAttributes,
  })

  const options: Record<string, LegacyCoverEligibility> = {}
  for (const [id, status] of Object.entries(result.options)) {
    options[id] = { eligible: status.eligible, reason: status.reason }
  }

  return { policies: {}, options }
}
