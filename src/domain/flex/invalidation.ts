import type { InvalidationPreview } from './types'

export interface DownstreamStateFlags {
  hasDependants: boolean
  hasBenefitSelections: boolean
  hasPurchaseGroupSelections: boolean
  hasAttributeValues: boolean
}

/**
 * Preview what downstream wizard state would clear when an upstream value changes.
 * UI should confirm before applying — never silently prune.
 */
export function previewDealChangeInvalidation(
  state: DownstreamStateFlags,
): InvalidationPreview {
  const messages: string[] = []
  if (state.hasBenefitSelections || state.hasPurchaseGroupSelections) {
    messages.push('Benefit and plan selections will be cleared')
  }
  if (state.hasDependants) {
    messages.push('Dependant details will be cleared')
  }
  if (state.hasAttributeValues) {
    messages.push('Deal-specific attributes will be cleared')
  }

  return {
    clearsDependants: state.hasDependants,
    clearsBenefitSelections: state.hasBenefitSelections,
    clearsPurchaseGroups: state.hasPurchaseGroupSelections,
    clearsAttributes: state.hasAttributeValues,
    messages,
  }
}

export function previewAttributeChangeInvalidation(
  state: DownstreamStateFlags,
  affectsEligibility: boolean,
): InvalidationPreview {
  if (!affectsEligibility) {
    return {
      clearsDependants: false,
      clearsBenefitSelections: false,
      clearsPurchaseGroups: false,
      clearsAttributes: false,
      messages: [],
    }
  }

  const messages = ['Your changes affected benefit eligibility.']
  if (state.hasBenefitSelections || state.hasPurchaseGroupSelections) {
    messages.push('Some benefit selections may no longer be valid')
  }
  if (state.hasDependants) {
    messages.push('Dependant assignments may need to be reviewed')
  }

  return {
    clearsDependants: false,
    clearsBenefitSelections: state.hasBenefitSelections,
    clearsPurchaseGroups: state.hasPurchaseGroupSelections,
    clearsAttributes: false,
    messages,
  }
}

export function previewBenefitChangeInvalidation(
  state: DownstreamStateFlags,
): InvalidationPreview {
  const messages: string[] = []
  if (state.hasDependants) {
    messages.push(
      'Changing benefits will recalculate dependant slots and may clear invalid dependant assignments',
    )
  }
  return {
    clearsDependants: state.hasDependants,
    clearsBenefitSelections: false,
    clearsPurchaseGroups: false,
    clearsAttributes: false,
    messages,
  }
}

export function requiresInvalidationConfirmation(
  preview: InvalidationPreview,
): boolean {
  return (
    preview.clearsDependants ||
    preview.clearsBenefitSelections ||
    preview.clearsPurchaseGroups ||
    preview.clearsAttributes ||
    preview.messages.length > 0
  )
}
