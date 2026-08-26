/**
 * Configuration-driven Flex domain layer.
 *
 * UI steps should consume result view-models from these modules rather than
 * reading the global `flexDeal` mock directly. Legacy shapes remain available
 * via adapters so existing pages keep working unchanged.
 */

// Types / config
export type * from './types'

// Deal catalog
export {
  herbalifeFlexDeal,
  symphonyCareFlexDeal,
  dealCatalog,
  domainCdAccounts,
  listActiveDeals,
  getDealConfig,
  getPlanConfig,
  getBenefitConfig,
  getCdAccountConfig,
  resolveInitialDealId,
} from './dealCatalog'

// Dates / formatting
export {
  ageFromDateOfBirth,
  parseDateOnly,
  daysBetween,
  isWithinLastDays,
  isValidDateOfLeaving,
  formatINR,
} from './dates'

// Dynamic attributes
export {
  resolveAttributeFields,
  validateAttributeValues,
  mergeAttributeValues,
  type ResolveAttributesInput,
} from './attributes'

// Eligibility
export {
  evaluateEmployeeEligibility,
  evaluateDependantCoverEligibility,
  isRelationshipAllowedForBenefit,
  resolveBenefitIdsFromSelections,
} from './eligibility'

// Assignment
export {
  resolveAssignment,
  togglePurchaseGroupOption,
  validatePurchaseGroupSelections,
  assignmentSourceLabel,
  type ResolveAssignmentInput,
} from './assignment'

// Benefit selection states
export {
  buildBenefitSelectionState,
  toggleAvailableBenefit,
  type BuildBenefitSelectionInput,
} from './benefitSelection'

// Family slots
export {
  computeFamilySlots,
  availableBenefitsForRelationship,
  type ComputeFamilySlotsInput,
} from './familySlots'

// Midterm / active-vs-draft
export {
  validateMidtermAddition,
  evaluateMidtermAcrossBenefits,
  validateMidtermAssignments,
} from './midterm'

// Financial / payroll / policy impact
export {
  buildPolicyImpact,
  computePayrollDelta,
  payrollWouldChange,
  type LifeCoverSelection,
  type BuildPolicyImpactInput,
} from './financial'

// Refunds / retained benefits
export {
  buildRefundEstimate,
  splitEndingAndRetained,
  zeroReasonLabel,
  type BuildRefundInput,
} from './refunds'

// Corrections
export {
  LOCKED_CORRECTION_FIELDS,
  isEditableCorrectionField,
  computeCorrectionDiffs,
  correctionRequiresKyc,
  validateMemberCorrection,
  createCorrectionBatch,
  addCorrectionToBatch,
  removeCorrectionFromBatch,
  summarizeCorrectionBatch,
} from './corrections'

// Invalidation previews
export {
  previewDealChangeInvalidation,
  previewAttributeChangeInvalidation,
  previewBenefitChangeInvalidation,
  requiresInvalidationConfirmation,
  type DownstreamStateFlags,
} from './invalidation'

// Legacy adapters
export {
  toLegacyFlexDeal,
  fromLegacyFlexDeal,
  legacyActiveDealsFromCatalog,
  toLegacyCostEstimate,
  toLegacyRefundEstimate,
  toLegacyEmployeeCoverEligibility,
} from './adapters'
