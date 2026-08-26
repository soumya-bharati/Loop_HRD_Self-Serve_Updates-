/**
 * Configuration-driven Flex domain types.
 * UI should consume result view-models from domain functions, not raw deal globals.
 */

export type InsurerLogo = 'digit' | 'icici' | 'care' | 'aditya-birla'

export type BenefitCategory = 'gmc' | 'gpa' | 'gtl' | 'opd' | 'wellness' | 'other'

export type CoverageStatus = 'active' | 'draft'

export type DealStatus = 'active' | 'upcoming' | 'closed'

export type PurchaseGroupSelectMode = 'single' | 'multi'

export type PurchaseGroupRequirement = 'mandatory' | 'optional'

export type AssignmentSource = 'rule' | 'default' | 'manual' | 'sheet'

export type BenefitSelectionStatus =
  | 'assigned'
  | 'available'
  | 'selected'
  | 'ineligible'

export type FamilyRelationship =
  | 'Spouse'
  | 'Child'
  | 'Parent'
  | 'Parent-in-law'
  | 'Sibling'
  | 'Other'

export type RefundZeroReason =
  | 'claim'
  | 'not_insurance'
  | 'not_prorated'
  | 'not_eligible'

export type AttributeInputBy = 'hr' | 'employee'

export type AttributeEntity = 'employee' | 'dependant'

export type MidtermEvidenceField = 'dateOfBirth' | 'marriageDate'

/** Shared attribute definition used at deal and benefit level. */
export interface AttributeDefinition {
  id: string
  label: string
  required: boolean
  inputBy: AttributeInputBy
  entity: AttributeEntity
  allowedValues?: string[]
  /** Benefits that require this attribute (for merge explanations). */
  requiredByBenefitIds?: string[]
  /** Restrict a dependant attribute to specific relationships. */
  relationships?: FamilyRelationship[]
}

export interface FamilySlotDefinition {
  relationship: FamilyRelationship
  maxCount: number
  /** When coverage is active, midterm add is limited to these relationships. */
  midtermAllowedWhenActive?: boolean
}

export interface MidtermEvidenceRule {
  relationship: FamilyRelationship
  /** Inclusive window in days (e.g. 45). */
  windowDays: number
  evidenceField: MidtermEvidenceField
  requiresDocument?: boolean
  documentLabel?: string
}

export interface FlexBenefitConfig {
  id: string
  name: string
  policyName: string
  policyNumber: string
  insurerName: string
  insurerLogo: InsurerLogo
  category: BenefitCategory
  isInsurance: boolean
  premiumProrated: boolean
  /** Per-life endorsement unit cost (mock). */
  unitCost: number
  /** Monthly payroll contribution per life (mock). */
  payrollContribution: number
  familyDefinition: FamilySlotDefinition[]
  dependantAttributes: AttributeDefinition[]
  midtermRules: MidtermEvidenceRule[]
  backingPolicyId?: string
  cdAccountId?: string
  /** Flat-validity employee-bought benefits that survive offboarding. */
  retainedOnOffboard?: boolean
  retainedUntil?: string
  retainedReason?: string
}

export interface FlexPlanConfig {
  id: string
  name: string
  benefitIds: string[]
  maxDependants: number
}

export interface PurchaseGroupOption {
  id: string
  label: string
  kind: 'plan' | 'benefit'
  planId?: string
  benefitId?: string
}

export interface PurchaseGroupConfig {
  id: string
  name: string
  selectMode: PurchaseGroupSelectMode
  requirement: PurchaseGroupRequirement
  options: PurchaseGroupOption[]
}

export interface AssignmentRule {
  id: string
  /** Match against employee department attribute/field. */
  department: string
  planId: string
  /** Optional grade match; when set, all conditions must match. */
  grade?: string
}

export interface CdAccountConfig {
  id: string
  name: string
  balance: number
  policyIds: string[]
}

export interface FlexDealConfig {
  id: string
  name: string
  isFlexCompany: true
  status: DealStatus
  periodLabel: string
  periodStart: string
  periodEnd: string
  plans: FlexPlanConfig[]
  benefits: FlexBenefitConfig[]
  purchaseGroups: PurchaseGroupConfig[]
  /** Deal-level employee attributes (HR / employee input). */
  employeeAttributes: AttributeDefinition[]
  assignmentRules: AssignmentRule[]
  defaultPlanId: string
  maxDependantsUnion: number
}

/** Input snapshot for eligibility / assignment evaluation. */
export interface EmployeeEligibilityInput {
  dateOfBirth: string
  department?: string
  /** Deal attribute values keyed by attribute id. */
  attributes: Record<string, string>
}

export interface CoverEligibility {
  eligible: boolean
  reason?: string
}

export interface EligibilityResult {
  dealId: string
  eligible: boolean
  reasons: string[]
  /** Purchase-group option id → eligibility. */
  options: Record<string, CoverEligibility>
  /** Benefit id → eligibility. */
  benefits: Record<string, CoverEligibility>
  /** Plan id → eligibility. */
  plans: Record<string, CoverEligibility>
}

export interface AssignmentResult {
  dealId: string
  source: AssignmentSource
  planId: string | null
  benefitIds: string[]
  purchaseGroupSelections: Record<string, string[]>
  matchedRuleId?: string
  needsManualAssignment: boolean
}

export interface BenefitSelectionItem {
  benefitId: string
  label: string
  status: BenefitSelectionStatus
  locked: boolean
  reason?: string
  purchaseGroupId?: string
  planId?: string
  source?: AssignmentSource
  unitCost: number
  category: BenefitCategory
}

export interface BenefitSelectionState {
  dealId: string
  assigned: BenefitSelectionItem[]
  available: BenefitSelectionItem[]
  selected: BenefitSelectionItem[]
  /** Hidden from normal HR view; useful for diagnostics. */
  ineligible: BenefitSelectionItem[]
  purchaseGroupSelections: Record<string, string[]>
  resolvedBenefitIds: string[]
  resolvedPlanIds: string[]
  /** Purchase groups that still need a mandatory selection. */
  unmetMandatoryGroupIds: string[]
}

export interface ExistingDependantRef {
  id: string
  relationship: FamilyRelationship | string
  dateOfBirth?: string
  /** Benefit ids this dependant is already enrolled on. */
  benefitIds?: string[]
}

export interface MemberCoverageRef {
  benefitId: string
  status: CoverageStatus
}

export interface DependantSlotBreakdown {
  benefitId: string
  benefitName: string
  coverageStatus: CoverageStatus
  maxCount: number
  usedCount: number
  remainingCount: number
  midtermRestricted: boolean
}

export interface DependantSlotResult {
  relationship: FamilyRelationship
  maxSlots: number
  usedSlots: number
  remainingSlots: number
  /** Benefits that still have capacity for this relationship. */
  availableBenefitIds: string[]
  /** All benefits that define this relationship (including full). */
  supportingBenefitIds: string[]
  perBenefit: DependantSlotBreakdown[]
  /** True when every supporting benefit is midterm-restricted. */
  midtermOnly: boolean
}

export interface FamilySlotSummary {
  dealId: string
  slots: DependantSlotResult[]
  /** Relationships that still have at least one remaining slot. */
  addableRelationships: FamilyRelationship[]
  allSlotsConsumed: boolean
  emptyReason?: string
}

export interface MidtermValidationInput {
  relationship: FamilyRelationship | string
  dateOfBirth?: string
  marriageDate?: string
  coverageStatus: CoverageStatus
  asOf?: Date
}

export interface MidtermValidationResult {
  allowed: boolean
  reasons: string[]
  requiresDocument: boolean
  documentLabel?: string
  evidenceField?: MidtermEvidenceField
  windowDays?: number
}

export interface PolicyImpactLine {
  policyId: string
  policyName: string
  insurerName: string
  insurerLogo: InsurerLogo
  policyNumber: string
  livesAdded: number
  endorsementCost: number
  cdAccountId: string
  cdAccountName: string
  cdBalance: number
  benefitIds: string[]
}

export interface PolicyImpact {
  totalLivesAdded: number
  totalEndorsementCost: number
  totalPayrollDeduction: number
  monthlyInstallment: number
  /** When comparing against an existing deduction (add-dependant). */
  currentPayrollDeduction?: number
  additionalPayrollDeduction?: number
  policies: PolicyImpactLine[]
  cdShortfall: boolean
  cdShortfallAmount: number
}

export interface RefundLineResult {
  id: string
  label: string
  kind: 'policy' | 'plan' | 'benefit' | 'component'
  lives: number
  insurerRefund: number
  employeeRefund: number
  zeroReason?: RefundZeroReason
  staysActive?: boolean
  staysActiveNote?: string
  components?: RefundLineResult[]
}

export interface RetainedBenefitResult {
  benefitId: string
  label: string
  retainedUntil?: string
  reason: string
}

export interface RefundEstimateResult {
  totalLivesDeleted: number
  totalInsurerRefund: number
  totalEmployeeRefund: number
  lines: RefundLineResult[]
  retainedBenefits: RetainedBenefitResult[]
  policiesByCd: {
    cdAccountId: string
    cdAccountName: string
    cdBalance: number
    policies: { policyName: string; lives: number; refund: number }[]
  }[]
}

export type CorrectableField =
  | 'firstName'
  | 'lastName'
  | 'dateOfBirth'
  | 'gender'
  | 'mobile'
  | 'email'

export type LockedCorrectionField =
  | 'employeeId'
  | 'relationship'
  | 'dealAttributes'

export interface FieldDiff {
  field: string
  label: string
  from: string
  to: string
}

export interface MemberCorrectionDraft {
  memberId: string
  memberName: string
  relationship: string
  original: Record<string, string>
  updated: Record<string, string>
  /** Current benefit assignments — must remain unchanged. */
  benefitIds: string[]
  dealId: string
  department?: string
  attributes?: Record<string, string>
}

export interface MemberCorrection {
  memberId: string
  memberName: string
  relationship: string
  diffs: FieldDiff[]
  requiresKyc: boolean
  kycTriggerFields: CorrectableField[]
  accepted: boolean
  rejectionReason?: string
  affectedBenefitIds?: string[]
}

export interface CorrectionBatch {
  corrections: MemberCorrection[]
}

export interface InvalidationPreview {
  clearsDependants: boolean
  clearsBenefitSelections: boolean
  clearsPurchaseGroups: boolean
  clearsAttributes: boolean
  messages: string[]
}

export interface ResolvedAttributeField {
  definition: AttributeDefinition
  /** Human-readable “Required for GMC + Parent Cover”. */
  requiredForLabel?: string
  visible: boolean
}
