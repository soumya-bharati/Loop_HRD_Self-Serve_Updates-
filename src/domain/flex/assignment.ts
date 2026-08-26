import { getPlanConfig } from './dealCatalog'
import { resolveBenefitIdsFromSelections } from './eligibility'
import type {
  AssignmentResult,
  AssignmentSource,
  EmployeeEligibilityInput,
  FlexDealConfig,
  PurchaseGroupConfig,
} from './types'

export interface ResolveAssignmentInput {
  deal: FlexDealConfig
  employee: EmployeeEligibilityInput
  /** Optional manual overrides after rule evaluation. */
  manualPurchaseGroupSelections?: Record<string, string[]>
  manualPlanId?: string | null
}

function findMatchingRule(deal: FlexDealConfig, employee: EmployeeEligibilityInput) {
  const department = employee.department?.trim() ?? ''
  const grade = employee.attributes['attr-grade']?.trim()

  return deal.assignmentRules.find((rule) => {
    if (rule.department !== department) return false
    if (rule.grade && rule.grade !== grade) return false
    return true
  })
}

function selectionsForPlan(
  deal: FlexDealConfig,
  planId: string,
): Record<string, string[]> {
  const selections: Record<string, string[]> = {}
  for (const group of deal.purchaseGroups) {
    const option = group.options.find(
      (o) => o.kind === 'plan' && o.planId === planId,
    )
    if (option) {
      selections[group.id] = [option.id]
    }
  }
  return selections
}

/**
 * Apply assignment rules + default plan to produce company-assigned benefits.
 * Manual selections override when provided.
 */
export function resolveAssignment(
  input: ResolveAssignmentInput,
): AssignmentResult {
  const { deal, employee, manualPurchaseGroupSelections, manualPlanId } = input

  if (manualPurchaseGroupSelections && Object.keys(manualPurchaseGroupSelections).length > 0) {
    const resolved = resolveBenefitIdsFromSelections(
      deal,
      manualPurchaseGroupSelections,
    )
    return {
      dealId: deal.id,
      source: 'manual',
      planId: manualPlanId ?? resolved.planIds[0] ?? null,
      benefitIds: resolved.benefitIds,
      purchaseGroupSelections: manualPurchaseGroupSelections,
      needsManualAssignment: false,
    }
  }

  if (manualPlanId) {
    const plan = getPlanConfig(deal, manualPlanId)
    const purchaseGroupSelections = selectionsForPlan(deal, manualPlanId)
    return {
      dealId: deal.id,
      source: 'manual',
      planId: manualPlanId,
      benefitIds: plan?.benefitIds ?? [],
      purchaseGroupSelections,
      needsManualAssignment: false,
    }
  }

  const matched = findMatchingRule(deal, employee)
  if (matched) {
    const plan = getPlanConfig(deal, matched.planId)
    return {
      dealId: deal.id,
      source: 'rule',
      planId: matched.planId,
      benefitIds: plan?.benefitIds ?? [],
      purchaseGroupSelections: selectionsForPlan(deal, matched.planId),
      matchedRuleId: matched.id,
      needsManualAssignment: false,
    }
  }

  const defaultPlan = getPlanConfig(deal, deal.defaultPlanId)
  if (defaultPlan) {
    return {
      dealId: deal.id,
      source: 'default',
      planId: defaultPlan.id,
      benefitIds: defaultPlan.benefitIds,
      purchaseGroupSelections: selectionsForPlan(deal, defaultPlan.id),
      needsManualAssignment: false,
    }
  }

  return {
    dealId: deal.id,
    source: 'manual',
    planId: null,
    benefitIds: [],
    purchaseGroupSelections: {},
    needsManualAssignment: true,
  }
}

/** Enforce single/multi select modes when toggling a purchase-group option. */
export function togglePurchaseGroupOption(
  group: PurchaseGroupConfig,
  current: string[],
  optionId: string,
): string[] {
  const exists = current.includes(optionId)
  if (group.selectMode === 'single') {
    return exists ? [] : [optionId]
  }
  if (exists) return current.filter((id) => id !== optionId)
  return [...current, optionId]
}

/** Validate mandatory groups and select-mode constraints. */
export function validatePurchaseGroupSelections(
  deal: FlexDealConfig,
  selections: Record<string, string[]>,
): { valid: boolean; unmetMandatoryGroupIds: string[]; errors: string[] } {
  const unmetMandatoryGroupIds: string[] = []
  const errors: string[] = []

  for (const group of deal.purchaseGroups) {
    const chosen = selections[group.id] ?? []
    if (group.requirement === 'mandatory' && chosen.length === 0) {
      unmetMandatoryGroupIds.push(group.id)
      errors.push(`${group.name} requires a selection`)
    }
    if (group.selectMode === 'single' && chosen.length > 1) {
      errors.push(`${group.name} allows only one selection`)
    }
    for (const optId of chosen) {
      if (!group.options.some((o) => o.id === optId)) {
        errors.push(`Unknown option ${optId} in ${group.name}`)
      }
    }
  }

  return {
    valid: unmetMandatoryGroupIds.length === 0 && errors.length === 0,
    unmetMandatoryGroupIds,
    errors,
  }
}

export function assignmentSourceLabel(source: AssignmentSource): string {
  if (source === 'rule') return 'Assigned by company rule'
  if (source === 'default') return 'Assigned by default plan'
  if (source === 'sheet') return 'Imported from sheet'
  return 'Manually selected'
}
