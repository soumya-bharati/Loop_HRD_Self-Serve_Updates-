import {
  evaluateEmployeeEligibility,
  resolveBenefitIdsFromSelections,
} from './eligibility'
import { validatePurchaseGroupSelections } from './assignment'
import type {
  AssignmentResult,
  BenefitSelectionItem,
  BenefitSelectionState,
  EmployeeEligibilityInput,
  FlexDealConfig,
} from './types'

export interface BuildBenefitSelectionInput {
  deal: FlexDealConfig
  employee: EmployeeEligibilityInput
  assignment: AssignmentResult
  /** HR-chosen optional / override selections (purchase group option ids). */
  purchaseGroupSelections?: Record<string, string[]>
  /** Explicitly selected available benefit ids (outside locked assignment). */
  additionalBenefitIds?: string[]
}

/**
 * Build Assigned / Available / Selected / Ineligible view-model for HR benefit UI.
 * Ineligible items are returned separately so the normal HR view can hide them.
 */
export function buildBenefitSelectionState(
  input: BuildBenefitSelectionInput,
): BenefitSelectionState {
  const {
    deal,
    employee,
    assignment,
    purchaseGroupSelections,
    additionalBenefitIds = [],
  } = input

  const eligibility = evaluateEmployeeEligibility(deal, employee)
  const selections =
    purchaseGroupSelections ?? assignment.purchaseGroupSelections
  const resolved = resolveBenefitIdsFromSelections(deal, selections)
  const validation = validatePurchaseGroupSelections(deal, selections)

  const assignedIds = new Set(assignment.benefitIds)
  const selectedExtra = new Set(additionalBenefitIds)
  const resolvedIds = new Set([
    ...resolved.benefitIds,
    ...additionalBenefitIds,
  ])

  const assigned: BenefitSelectionItem[] = []
  const available: BenefitSelectionItem[] = []
  const selected: BenefitSelectionItem[] = []
  const ineligible: BenefitSelectionItem[] = []

  for (const benefit of deal.benefits) {
    const status = eligibility.benefits[benefit.id] ?? { eligible: true }
    const purchaseGroupId = deal.purchaseGroups.find((g) =>
      g.options.some((o) => {
        if (o.kind === 'benefit' && o.benefitId === benefit.id) return true
        if (o.kind === 'plan' && o.planId) {
          return deal.plans
            .find((p) => p.id === o.planId)
            ?.benefitIds.includes(benefit.id)
        }
        return false
      }),
    )?.id

    const base: BenefitSelectionItem = {
      benefitId: benefit.id,
      label: benefit.name,
      status: 'available',
      locked: false,
      purchaseGroupId,
      unitCost: benefit.unitCost,
      category: benefit.category,
      source: assignment.source,
    }

    if (!status.eligible) {
      ineligible.push({
        ...base,
        status: 'ineligible',
        reason: status.reason,
      })
      continue
    }

    if (assignedIds.has(benefit.id)) {
      assigned.push({
        ...base,
        status: 'assigned',
        locked: true,
        planId: assignment.planId ?? undefined,
      })
      continue
    }

    if (resolvedIds.has(benefit.id) || selectedExtra.has(benefit.id)) {
      selected.push({
        ...base,
        status: 'selected',
        locked: false,
      })
      continue
    }

    available.push({
      ...base,
      status: 'available',
      locked: false,
    })
  }

  return {
    dealId: deal.id,
    assigned,
    available,
    selected,
    ineligible,
    purchaseGroupSelections: selections,
    resolvedBenefitIds: [...resolvedIds],
    resolvedPlanIds: resolved.planIds,
    unmetMandatoryGroupIds: validation.unmetMandatoryGroupIds,
  }
}

/** Toggle an available benefit into / out of the selected set. */
export function toggleAvailableBenefit(
  state: BenefitSelectionState,
  benefitId: string,
): string[] {
  const locked = state.assigned.some((b) => b.benefitId === benefitId)
  if (locked) return state.resolvedBenefitIds

  const ineligible = state.ineligible.some((b) => b.benefitId === benefitId)
  if (ineligible) return state.resolvedBenefitIds

  const current = new Set(state.resolvedBenefitIds)
  const assignedIds = new Set(state.assigned.map((b) => b.benefitId))
  if (current.has(benefitId) && !assignedIds.has(benefitId)) {
    current.delete(benefitId)
  } else {
    current.add(benefitId)
  }
  // Keep assigned benefits always present.
  for (const id of assignedIds) current.add(id)
  return [...current]
}
