export type InsurerLogo = 'digit' | 'icici'

export interface FlexBenefit {
  id: string
  name: string
  policyName: string
  policyNumber: string
  insurerName: string
  insurerLogo: InsurerLogo
  /** Primary benefit category for dependant assignment. */
  category: 'gmc' | 'gpa' | 'gtl' | 'opd'
  isInsurance: boolean
  premiumProrated: boolean
}

export interface FlexPlan {
  id: string
  name: string
  benefitIds: string[]
  maxDependants: number
}

export type PurchaseGroupSelectMode = 'single' | 'multi'

export interface PurchaseGroupOption {
  id: string
  label: string
  kind: 'plan' | 'benefit'
  planId?: string
  benefitId?: string
}

export interface PurchaseGroup {
  id: string
  name: string
  selectMode: PurchaseGroupSelectMode
  options: PurchaseGroupOption[]
}

export interface CustomAttribute {
  id: string
  label: string
  required: boolean
  /** HR-input vs employee-input (bulk: employee-input always optional). */
  inputBy: 'hr' | 'employee'
  allowedValues?: string[]
}

export interface AssignmentRule {
  id: string
  department: string
  planId: string
}

export interface CdAccount {
  id: string
  name: string
  balance: number
  policyIds: string[]
}

export interface FlexDeal {
  id: string
  name: string
  isFlexCompany: true
  plans: FlexPlan[]
  benefits: FlexBenefit[]
  purchaseGroups: PurchaseGroup[]
  customAttributes: CustomAttribute[]
  assignmentRules: AssignmentRule[]
  defaultPlanId: string
  maxDependantsUnion: number
}

export type AssignmentSource = 'rule' | 'default' | 'manual' | 'sheet'

export interface BulkMemberRow {
  id: string
  employeeId: string
  name: string
  email: string
  department: string
  relationship: 'Self' | 'Spouse' | 'Child' | 'Parent'
  assignedPlanId: string | null
  benefitIds: string[]
  purchaseGroupSelections: Record<string, string[]>
  assignmentSource: AssignmentSource
  needsManualAssignment: boolean
  validationError?: string
  validationField?: string
  status: 'pass' | 'fail' | 'needs-review'
  dealId: string
  payrollDelta: number
  /** Mid-term: dependant coverage starts after employee start + endo already sent. */
  needsMidtermProof?: boolean
  coverageStartDate?: string
  employeeStartDate?: string
}

export interface PolicyCostBreakdown {
  policyId: string
  policyName: string
  insurerName: string
  insurerLogo: InsurerLogo | 'care' | 'aditya-birla'
  policyNumber: string
  livesAdded: number
  endorsementCost: number
  cdAccountId: string
  cdAccountName: string
  cdBalance: number
}

export interface CostEstimate {
  totalLivesAdded: number
  totalEndorsementCost: number
  totalPayrollDeduction: number
  monthlyInstallment: number
  policies: PolicyCostBreakdown[]
  cdShortfall: boolean
  cdShortfallAmount: number
}

export type RefundZeroReason =
  | 'claim'
  | 'not_insurance'
  | 'not_prorated'
  | 'not_eligible'

export interface RefundLine {
  id: string
  label: string
  kind: 'policy' | 'plan' | 'benefit' | 'component'
  lives: number
  insurerRefund: number
  employeeRefund: number
  zeroReason?: RefundZeroReason
  staysActive?: boolean
  staysActiveNote?: string
  components?: RefundLine[]
}

export interface RefundEstimate {
  totalLivesDeleted: number
  totalInsurerRefund: number
  totalEmployeeRefund: number
  lines: RefundLine[]
  policiesByCd: {
    cdAccountId: string
    cdAccountName: string
    cdBalance: number
    policies: { policyName: string; lives: number; refund: number }[]
  }[]
}

export type EnrolmentMode = 'now' | 'schedule' | 'none'

export interface EnrolmentSettingsState {
  runEnrolment: boolean | null
  dueDate: string
  mode: EnrolmentMode
  launchTargetIds: string[]
}

export type SelectablePolicyLogo = 'care' | 'aditya-birla'

export interface PolicyTierOption {
  id: string
  label: string
  /** Per-life endorsement cost for this sum-insured tier. */
  unitCost?: number
}

export interface FamilyStructureOption {
  id: string
  label: string
  /** Number of lives covered by this structure. */
  lives: number
}

export interface SelectablePolicy {
  id: string
  name: string
  insurerName: string
  policyLabel?: string
  policyNumber: string
  logo: SelectablePolicyLogo
  cdAccountId: string
  isFlex: boolean
  /** @deprecated Prefer familyStructures for selectable composition. */
  coverageLabel?: string
  /** Family / lives compositions selectable with sum insured. */
  familyStructures?: FamilyStructureOption[]
  /** Sum-insured / plan tiers selectable when the policy is checked. */
  tiers?: PolicyTierOption[]
  tierLabel?: string
  /** Fallback per-life cost when a tier has no unitCost. */
  baseUnitCost?: number
}

export const cdAccounts: CdAccount[] = [
  {
    id: 'cd-main',
    name: 'Symphony Main CD',
    balance: 2_38_456,
    policyIds: ['pol-gmc', 'pol-gpa', 'pol-gmc-opd', 'ben-gmc', 'ben-gpa'],
  },
  {
    id: 'cd-life',
    name: 'Life & Parental CD',
    balance: 45_000,
    policyIds: ['pol-gtl', 'ben-gmc-parental'],
  },
]

export const selectablePolicies: SelectablePolicy[] = [
  {
    id: 'pol-gmc',
    name: 'Group Medical Coverage',
    insurerName: 'Care Health Insurance',
    policyNumber: '99929749',
    logo: 'care',
    cdAccountId: 'cd-main',
    isFlex: false,
    baseUnitCost: 850,
    familyStructures: [
      { id: 'fs-emp', label: 'Employee', lives: 1 },
      { id: 'fs-emp-spouse', label: 'Employee + Spouse', lives: 2 },
      {
        id: 'fs-emp-spouse-2c',
        label: 'Employee + Spouse + 2Children',
        lives: 4,
      },
    ],
    tierLabel: 'Choose Sum Insured',
    tiers: [
      { id: 'si-3l', label: '₹3 lacs', unitCost: 850 },
      { id: 'si-5l', label: '₹5 lacs', unitCost: 1200 },
      { id: 'si-10l', label: '₹10 lacs', unitCost: 1850 },
    ],
  },
  {
    id: 'pol-gtl',
    name: 'Group Term Life',
    insurerName: 'Aditya Birla Sun Life Insurance Company Ltd',
    policyLabel: 'GTL Policy_SYMPHONY EYC',
    policyNumber: '509468',
    logo: 'aditya-birla',
    cdAccountId: 'cd-life',
    isFlex: false,
    baseUnitCost: 650,
    familyStructures: [{ id: 'fs-emp', label: 'Employee', lives: 1 }],
    tierLabel: 'Choose Sum Insured',
    tiers: [
      { id: 'si-25l', label: '₹25 lacs', unitCost: 650 },
      { id: 'si-50l', label: '₹50 lacs', unitCost: 980 },
      { id: 'si-1cr', label: '₹1 crore', unitCost: 1450 },
    ],
  },
  {
    id: 'pol-gpa',
    name: 'Group Personal Accident',
    insurerName: 'Care Health Insurance',
    policyLabel: 'GPA Policy_SYMPHONYEYC',
    policyNumber: '20415113',
    logo: 'care',
    cdAccountId: 'cd-main',
    isFlex: false,
    baseUnitCost: 420,
    familyStructures: [{ id: 'fs-emp', label: 'Employee', lives: 1 }],
    tierLabel: 'Choose Sum Insured',
    tiers: [
      { id: 'si-5l', label: '₹5 lacs', unitCost: 420 },
      { id: 'si-10l', label: '₹10 lacs', unitCost: 620 },
      { id: 'si-15l', label: '₹15 lacs', unitCost: 780 },
    ],
  },
  {
    id: 'pol-gmc-opd',
    name: 'Group Medical Coverage (OPD)',
    insurerName: 'Care Health Insurance',
    policyLabel: 'OPD Policy_SYMPHONY EYC INDIA',
    policyNumber: '20451601',
    logo: 'care',
    cdAccountId: 'cd-main',
    isFlex: false,
    baseUnitCost: 300,
    familyStructures: [
      { id: 'fs-emp', label: 'Employee', lives: 1 },
      { id: 'fs-emp-spouse', label: 'Employee + Spouse', lives: 2 },
      {
        id: 'fs-emp-spouse-2c',
        label: 'Employee + Spouse + 2Children',
        lives: 4,
      },
    ],
    tierLabel: 'Choose Sum Insured',
    tiers: [
      { id: 'si-25k', label: '₹25,000', unitCost: 300 },
      { id: 'si-50k', label: '₹50,000', unitCost: 480 },
      { id: 'si-1l', label: '₹1 lac', unitCost: 720 },
    ],
  },
]

export const flexDeal: FlexDeal = {
  id: 'deal-herbalife-flex',
  name: 'Herbalife HealthFlex',
  isFlexCompany: true,
  defaultPlanId: 'plan-standard',
  maxDependantsUnion: 4,
  benefits: [
    {
      id: 'ben-gmc',
      name: 'Group Medical Cover',
      policyName: 'Loop GMC Policy',
      policyNumber: 'XYZ-684-362-564',
      insurerName: 'Go Digit',
      insurerLogo: 'digit',
      category: 'gmc',
      isInsurance: true,
      premiumProrated: true,
    },
    {
      id: 'ben-gpa',
      name: 'Group Personal Accidental',
      policyName: 'Loop GPA Policy',
      policyNumber: 'XYZ-684-362-565',
      insurerName: 'ICICI Lombard',
      insurerLogo: 'icici',
      category: 'gpa',
      isInsurance: true,
      premiumProrated: true,
    },
    {
      id: 'ben-gmc-parental',
      name: 'GMC Parental',
      policyName: 'Loop GMC (Parental) Policy',
      policyNumber: 'XYZ-684-362-566',
      insurerName: 'Go Digit',
      insurerLogo: 'digit',
      category: 'gmc',
      isInsurance: true,
      premiumProrated: true,
    },
    {
      id: 'ben-wellness',
      name: 'Wellness Flat Benefit',
      policyName: 'Employee Wellness',
      policyNumber: 'WEL-001',
      insurerName: 'Loop',
      insurerLogo: 'digit',
      category: 'opd',
      isInsurance: false,
      premiumProrated: false,
    },
  ],
  plans: [
    {
      id: 'plan-standard',
      name: 'Standard Plan',
      benefitIds: ['ben-gmc', 'ben-gpa'],
      maxDependants: 3,
    },
    {
      id: 'plan-parental',
      name: 'Parental Plan',
      benefitIds: ['ben-gmc', 'ben-gpa', 'ben-gmc-parental'],
      maxDependants: 4,
    },
  ],
  purchaseGroups: [
    {
      id: 'pg-core',
      name: 'Core Cover',
      selectMode: 'single',
      options: [
        {
          id: 'opt-standard',
          label: 'Standard Plan',
          kind: 'plan',
          planId: 'plan-standard',
        },
        {
          id: 'opt-parental',
          label: 'Parental Plan',
          kind: 'plan',
          planId: 'plan-parental',
        },
      ],
    },
    {
      id: 'pg-addons',
      name: 'Add-ons',
      selectMode: 'multi',
      options: [
        {
          id: 'opt-wellness',
          label: 'Wellness Flat Benefit',
          kind: 'benefit',
          benefitId: 'ben-wellness',
        },
      ],
    },
  ],
  customAttributes: [
    {
      id: 'attr-grade',
      label: 'Grade',
      required: true,
      inputBy: 'hr',
      allowedValues: ['L1', 'L2', 'L3', 'L4'],
    },
    {
      id: 'attr-location',
      label: 'Work Location',
      required: false,
      inputBy: 'hr',
      allowedValues: ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad'],
    },
    {
      id: 'attr-preferred-hospital',
      label: 'Preferred Hospital',
      required: false,
      inputBy: 'employee',
    },
  ],
  assignmentRules: [
    { id: 'rule-eng', department: 'Engineering', planId: 'plan-parental' },
    { id: 'rule-ops', department: 'Operations', planId: 'plan-standard' },
    { id: 'rule-hr', department: 'HR', planId: 'plan-standard' },
    { id: 'rule-fin', department: 'Finance', planId: 'plan-standard' },
    { id: 'rule-mkt', department: 'Marketing', planId: 'plan-standard' },
  ],
}

export const activeDeals: FlexDeal[] = [flexDeal]

export function getDealById(dealId: string) {
  return activeDeals.find((d) => d.id === dealId)
}

export function getPlanById(planId: string) {
  return flexDeal.plans.find((p) => p.id === planId)
}

export function getBenefitById(benefitId: string) {
  return flexDeal.benefits.find((b) => b.id === benefitId)
}

export function getPlanBenefits(planId: string) {
  const plan = getPlanById(planId)
  if (!plan) return []
  return plan.benefitIds
    .map(getBenefitById)
    .filter((b): b is FlexBenefit => Boolean(b))
}

export function getCdAccount(id: string) {
  return cdAccounts.find((c) => c.id === id)
}

/** Endorsement cost for a policy × family structure × sum-insured selection. */
export function estimatePolicyEndorsementCost(
  policyId: string,
  familyStructureId?: string,
  tierId?: string,
) {
  const policy = selectablePolicies.find((p) => p.id === policyId)
  if (!policy) return 0

  const structure = policy.familyStructures?.find(
    (item) => item.id === familyStructureId,
  )
  const lives = structure?.lives ?? 1
  const tier = policy.tiers?.find((item) => item.id === tierId)
  const unitCost = tier?.unitCost ?? policy.baseUnitCost ?? 850
  return lives * unitCost
}

/** Endorsement cost for a modular deal purchase-group option (per employee). */
export function estimatePurchaseOptionCost(option: PurchaseGroupOption) {
  if (option.kind === 'benefit' && option.benefitId) {
    return benefitUnitCost(option.benefitId)
  }
  if (option.kind === 'plan' && option.planId) {
    const plan = getPlanById(option.planId)
    if (!plan) return 0
    return plan.benefitIds.reduce((sum, id) => sum + benefitUnitCost(id), 0)
  }
  return 0
}

export interface OrganisationEntity {
  id: string
  name: string
}

/** Legal entities under the logged-in organisation — lives actions apply to one. */
export const organisationEntities: OrganisationEntity[] = [
  { id: 'symphony-eyc', name: 'Symphony Eyc India Private Limited' },
  { id: 'symphony-holdings', name: 'Symphony Holdings Pvt Ltd' },
  { id: 'eyc-services', name: 'EYC Services India Pvt Ltd' },
]

export function getOrganisationEntity(
  id: string | null | undefined,
  list: OrganisationEntity[] = organisationEntities,
) {
  const pool = list.length > 0 ? list : organisationEntities
  return pool.find((entity) => entity.id === id) ?? pool[0]
}

export const singleAddEntityName = organisationEntities[0].name

export const defaultEnrolmentDueDate = '2026-08-28'

export const emptyEnrolmentSettings = (): EnrolmentSettingsState => ({
  runEnrolment: null,
  dueDate: defaultEnrolmentDueDate,
  mode: 'now',
  launchTargetIds: [],
})

function benefitUnitCost(benefitId: string) {
  if (benefitId === 'ben-gmc-parental') return 2400
  if (benefitId === 'ben-gmc') return 1850
  if (benefitId === 'ben-wellness') return 400
  return 1620
}

export function resolveSelectionBenefitIds(
  selectedPolicyIds: string[],
  purchaseGroupChoices: Record<string, string[]>,
  dealId: string | null,
): { policyIds: string[]; planIds: string[]; benefitIds: string[] } {
  const planIds: string[] = []
  const benefitIds: string[] = []
  const deal = dealId ? getDealById(dealId) : null

  if (deal) {
    for (const pg of deal.purchaseGroups) {
      const chosen = purchaseGroupChoices[pg.id] ?? []
      for (const optId of chosen) {
        const opt = pg.options.find((o) => o.id === optId)
        if (!opt) continue
        if (opt.kind === 'plan' && opt.planId) {
          planIds.push(opt.planId)
          const plan = getPlanById(opt.planId)
          if (plan) benefitIds.push(...plan.benefitIds)
        }
        if (opt.kind === 'benefit' && opt.benefitId) {
          benefitIds.push(opt.benefitId)
        }
      }
    }
  }

  return {
    policyIds: [...selectedPolicyIds],
    planIds: [...new Set(planIds)],
    benefitIds: [...new Set(benefitIds)],
  }
}

export interface EligibleDependantCover {
  id: string
  label: string
  kind: 'policy' | 'benefit'
  meta: string
}

export type CoverEligibility = { eligible: boolean; reason?: string }

export type EmployeeCoverEligibility = {
  policies: Record<string, CoverEligibility>
  options: Record<string, CoverEligibility>
}

/** Parse DD/MM/YYYY or YYYY-MM-DD into age in whole years; null if unparseable. */
export function ageFromDateOfBirth(
  dateOfBirth: string,
  asOf: Date = new Date(),
): number | null {
  const trimmed = dateOfBirth.trim()
  if (!trimmed) return null

  let day: number
  let month: number
  let year: number

  const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed)
  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)
  if (dmy) {
    day = Number(dmy[1])
    month = Number(dmy[2])
    year = Number(dmy[3])
  } else if (ymd) {
    year = Number(ymd[1])
    month = Number(ymd[2])
    day = Number(ymd[3])
  } else {
    return null
  }

  const dob = new Date(year, month - 1, day)
  if (
    Number.isNaN(dob.getTime()) ||
    dob.getFullYear() !== year ||
    dob.getMonth() !== month - 1 ||
    dob.getDate() !== day
  ) {
    return null
  }

  let age = asOf.getFullYear() - year
  const beforeBirthday =
    asOf.getMonth() < month - 1 ||
    (asOf.getMonth() === month - 1 && asOf.getDate() < day)
  if (beforeBirthday) age -= 1
  return age
}

/**
 * Hybrid eligibility for employee benefit selection: full catalog stays visible;
 * callers grey out ineligible options with `reason`.
 */
export function getEmployeeCoverEligibility(employee: {
  dateOfBirth: string
  customAttributes: Record<string, string>
}): EmployeeCoverEligibility {
  const age = ageFromDateOfBirth(employee.dateOfBirth)
  const grade = employee.customAttributes['attr-grade']?.trim() ?? ''
  const under18 = age !== null && age < 18

  const policies: Record<string, CoverEligibility> = {}
  for (const policy of selectablePolicies) {
    if (under18 && (policy.id === 'pol-gtl' || policy.id === 'pol-gpa')) {
      policies[policy.id] = {
        eligible: false,
        reason: 'Available only for members aged 18+',
      }
    } else {
      policies[policy.id] = { eligible: true }
    }
  }

  const options: Record<string, CoverEligibility> = {}
  for (const deal of activeDeals) {
    for (const group of deal.purchaseGroups) {
      for (const opt of group.options) {
        if (opt.id === 'opt-parental' && grade === 'L1') {
          options[opt.id] = {
            eligible: false,
            reason: 'Parental plan not available for Grade L1',
          }
        } else if (opt.id === 'opt-wellness' && under18) {
          options[opt.id] = {
            eligible: false,
            reason: 'Wellness add-on requires age 18+',
          }
        } else {
          options[opt.id] = { eligible: true }
        }
      }
    }
  }

  return { policies, options }
}

/** Dependant-level hybrid rules on top of relationship + assignment eligibility. */
export function getDependantCoverEligibility(
  relationship: string,
  dateOfBirth: string,
  coverId: string,
): CoverEligibility {
  const age = ageFromDateOfBirth(dateOfBirth)

  if (relationship === 'Child' && age !== null && age > 25) {
    if (
      coverId === 'pol-gmc' ||
      coverId === 'pol-gmc-opd' ||
      coverId === 'ben-gmc' ||
      coverId === 'ben-gpa'
    ) {
      return {
        eligible: false,
        reason: 'Child covers require age 25 or under',
      }
    }
  }

  if (
    (relationship === 'Parent' || relationship === 'Parent-in-law') &&
    age !== null &&
    age > 85
  ) {
    if (coverId === 'ben-gmc-parental') {
      return {
        eligible: false,
        reason: 'Parental cover requires age 85 or under',
      }
    }
  }

  return { eligible: true }
}

/** Which dependant categories have at least one cover from the employee selection. */
export function getAvailableDependantCategories(assignment: {
  policyIds: string[]
  benefitIds: string[]
}): Array<'Spouse' | 'Child' | 'Parent'> {
  const categories: Array<'Spouse' | 'Child' | 'Parent'> = []
  if (getEligibleCoversForDependant('Spouse', assignment).length > 0) {
    categories.push('Spouse')
  }
  if (getEligibleCoversForDependant('Child', assignment).length > 0) {
    categories.push('Child')
  }
  if (getEligibleCoversForDependant('Parent', assignment).length > 0) {
    categories.push('Parent')
  }
  return categories
}

/** Benefits/policies a dependant can enroll on, given employee selection + relationship. */
export function getEligibleCoversForDependant(
  relationship: string,
  assignment: { policyIds: string[]; benefitIds: string[] },
): EligibleDependantCover[] {
  return getDependantCoverOptions(relationship, '', assignment)
    .filter((cover) => cover.relationshipAllowed)
    .map(({ id, label, kind, meta }) => ({ id, label, kind, meta }))
}

function isCoverAllowedForRelationship(
  relationship: string,
  coverId: string,
  kind: 'policy' | 'benefit',
) {
  if (kind === 'policy') {
    if (relationship === 'Parent' || relationship === 'Parent-in-law') {
      return false
    }
    if (relationship === 'Child') {
      return coverId === 'pol-gmc' || coverId === 'pol-gmc-opd'
    }
    return (
      coverId === 'pol-gmc' ||
      coverId === 'pol-gpa' ||
      coverId === 'pol-gmc-opd'
    )
  }

  if (relationship === 'Parent' || relationship === 'Parent-in-law') {
    return coverId === 'ben-gmc-parental'
  }
  if (relationship === 'Child') {
    return coverId === 'ben-gmc' || coverId === 'ben-gpa'
  }
  return coverId === 'ben-gmc' || coverId === 'ben-gpa'
}

export type DependantCoverOption = EligibleDependantCover & {
  relationshipAllowed: boolean
  status: CoverEligibility
}

/**
 * Full catalog of employee-selected covers for a dependant: eligible (selectable),
 * plus relationship/age-ineligible options kept visible but disabled.
 */
export function getDependantCoverOptions(
  relationship: string,
  dateOfBirth: string,
  assignment: { policyIds: string[]; benefitIds: string[] },
): DependantCoverOption[] {
  const covers: DependantCoverOption[] = []

  for (const policyId of assignment.policyIds) {
    const policy = selectablePolicies.find((p) => p.id === policyId)
    if (!policy) continue
    const relationshipAllowed = isCoverAllowedForRelationship(
      relationship,
      policy.id,
      'policy',
    )
    const ageStatus = relationshipAllowed
      ? getDependantCoverEligibility(relationship, dateOfBirth, policy.id)
      : {
          eligible: false,
          reason: `Not available for ${relationship || 'this relationship'}`,
        }
    covers.push({
      id: policy.id,
      label: policy.name,
      kind: 'policy',
      meta: `${policy.insurerName} · ${policy.policyNumber}`,
      relationshipAllowed,
      status: ageStatus,
    })
  }

  for (const benefitId of assignment.benefitIds) {
    const benefit = getBenefitById(benefitId)
    if (!benefit) continue
    const relationshipAllowed = isCoverAllowedForRelationship(
      relationship,
      benefit.id,
      'benefit',
    )
    const ageStatus = relationshipAllowed
      ? getDependantCoverEligibility(relationship, dateOfBirth, benefit.id)
      : {
          eligible: false,
          reason: `Not available for ${relationship || 'this relationship'}`,
        }
    covers.push({
      id: benefit.id,
      label: benefit.name,
      kind: 'benefit',
      meta: `${benefit.policyName} · ${benefit.insurerName}`,
      relationshipAllowed,
      status: ageStatus,
    })
  }

  return covers
}

export function defaultDependantBenefitIds(
  relationship: string,
  dateOfBirth: string,
  assignment: { policyIds: string[]; benefitIds: string[] },
) {
  return getDependantCoverOptions(relationship, dateOfBirth, assignment)
    .filter((cover) => cover.status.eligible)
    .map((cover) => cover.id)
}

export function buildSingleCostEstimate(args: {
  selectedPolicyIds: string[]
  purchaseGroupChoices: Record<string, string[]>
  activeDealId: string | null
  lifeCount: number
  forceCdShortfall?: boolean
}): CostEstimate {
  const { policyIds, benefitIds } = resolveSelectionBenefitIds(
    args.selectedPolicyIds,
    args.purchaseGroupChoices,
    args.activeDealId,
  )
  const lifeCount = Math.max(args.lifeCount, 1)
  const policies: PolicyCostBreakdown[] = []

  for (const policyId of policyIds) {
    const policy = selectablePolicies.find((p) => p.id === policyId)
    if (!policy) continue
    const cd = getCdAccount(policy.cdAccountId)
    const endorsementCost = lifeCount * 850
    policies.push({
      policyId: policy.id,
      policyName: policy.name,
      insurerName: policy.insurerName,
      insurerLogo: policy.logo,
      policyNumber: policy.policyNumber,
      livesAdded: lifeCount,
      endorsementCost,
      cdAccountId: policy.cdAccountId,
      cdAccountName: cd?.name ?? 'CD',
      cdBalance: args.forceCdShortfall
        ? Math.min(cd?.balance ?? 0, endorsementCost - 5000)
        : (cd?.balance ?? 0),
    })
  }

  for (const benefitId of benefitIds) {
    const benefit = getBenefitById(benefitId)
    if (!benefit) continue
    const cdAccountId =
      cdAccounts.find((c) => c.policyIds.includes(benefit.id))?.id ?? 'cd-main'
    const cd = getCdAccount(cdAccountId)
    const endorsementCost = lifeCount * benefitUnitCost(benefit.id)
    policies.push({
      policyId: benefit.id,
      policyName: benefit.policyName,
      insurerName: benefit.insurerName,
      insurerLogo: benefit.insurerLogo,
      policyNumber: benefit.policyNumber,
      livesAdded: lifeCount,
      endorsementCost,
      cdAccountId,
      cdAccountName: cd?.name ?? 'CD',
      cdBalance: args.forceCdShortfall
        ? Math.min(cd?.balance ?? 0, endorsementCost - 5000)
        : (cd?.balance ?? 0),
    })
  }

  const totalEndorsementCost = policies.reduce(
    (sum, p) => sum + p.endorsementCost,
    0,
  )
  const totalPayrollDeduction = lifeCount * 1250
  const monthlyInstallment = Math.round(totalPayrollDeduction / 12)

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

  return {
    totalLivesAdded: lifeCount,
    totalEndorsementCost,
    totalPayrollDeduction,
    monthlyInstallment,
    policies,
    cdShortfall: shortfall > 0 || Boolean(args.forceCdShortfall),
    cdShortfallAmount: shortfall || (args.forceCdShortfall ? 12_500 : 0),
  }
}

export function buildCostEstimate(
  rows: BulkMemberRow[],
  options: { cdShortfall: boolean } = { cdShortfall: false },
): CostEstimate {
  const assigned = rows.filter(
    (r) =>
      r.status !== 'fail' &&
      ((r.assignedPlanId && r.benefitIds.length > 0) ||
        r.benefitIds.length > 0),
  )

  const byPolicy = new Map<
    string,
    { benefit: FlexBenefit; lives: number; cost: number }
  >()

  for (const row of assigned) {
    for (const benefitId of row.benefitIds) {
      const benefit = getBenefitById(benefitId)
      if (!benefit) continue
      const existing = byPolicy.get(benefit.id) ?? {
        benefit,
        lives: 0,
        cost: 0,
      }
      existing.lives += 1
      existing.cost += benefitUnitCost(benefit.id)
      byPolicy.set(benefit.id, existing)
    }
  }

  const policies: PolicyCostBreakdown[] = [...byPolicy.values()].map(
    ({ benefit, lives, cost }) => {
      const cdAccountId =
        cdAccounts.find((c) => c.policyIds.includes(benefit.id))?.id ??
        'cd-main'
      const cd = getCdAccount(cdAccountId)
      return {
        policyId: benefit.id,
        policyName: benefit.policyName,
        insurerName: benefit.insurerName,
        insurerLogo: benefit.insurerLogo,
        policyNumber: benefit.policyNumber,
        livesAdded: lives,
        endorsementCost: cost,
        cdAccountId,
        cdAccountName: cd?.name ?? 'CD',
        cdBalance: options.cdShortfall
          ? Math.min(cd?.balance ?? 0, 12_000)
          : (cd?.balance ?? 0),
      }
    },
  )

  const totalEndorsementCost = policies.reduce(
    (sum, p) => sum + p.endorsementCost,
    0,
  )
  const totalPayrollDeduction = assigned.reduce(
    (sum, r) => sum + r.payrollDelta,
    0,
  )

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

  return {
    totalLivesAdded: assigned.length,
    totalEndorsementCost,
    totalPayrollDeduction,
    monthlyInstallment: Math.round(totalPayrollDeduction / 12),
    policies,
    cdShortfall: options.cdShortfall || shortfall > 0,
    cdShortfallAmount: shortfall || (options.cdShortfall ? 12_500 : 0),
  }
}

/** Cost estimate for multi-employee add flow (policies + modular benefits per life). */
export function buildMembersCostEstimate(
  lives: { selectedBenefitIds: string[] }[],
  policyTiers: Record<string, string> = {},
  _policyStructures: Record<string, string> = {},
): CostEstimate {
  const byCover = new Map<
    string,
    {
      policyId: string
      policyName: string
      insurerName: string
      insurerLogo: InsurerLogo | 'care' | 'aditya-birla'
      policyNumber: string
      cdAccountId: string
      lives: number
      cost: number
    }
  >()

  for (const life of lives) {
    for (const coverId of life.selectedBenefitIds) {
      const policy = selectablePolicies.find((p) => p.id === coverId)
      if (policy) {
        const tier = policy.tiers?.find((t) => t.id === policyTiers[policy.id])
        const unit = tier?.unitCost ?? policy.baseUnitCost ?? 850
        const existing = byCover.get(policy.id) ?? {
          policyId: policy.id,
          policyName: policy.name,
          insurerName: policy.insurerName,
          insurerLogo: policy.logo,
          policyNumber: policy.policyNumber,
          cdAccountId: policy.cdAccountId,
          lives: 0,
          cost: 0,
        }
        existing.lives += 1
        existing.cost += unit
        byCover.set(policy.id, existing)
        continue
      }

      const benefit = getBenefitById(coverId)
      if (!benefit) continue
      const cdAccountId =
        cdAccounts.find((c) => c.policyIds.includes(benefit.id))?.id ??
        'cd-main'
      const existing = byCover.get(benefit.id) ?? {
        policyId: benefit.id,
        policyName: benefit.policyName,
        insurerName: benefit.insurerName,
        insurerLogo: benefit.insurerLogo,
        policyNumber: benefit.policyNumber,
        cdAccountId,
        lives: 0,
        cost: 0,
      }
      existing.lives += 1
      existing.cost += benefitUnitCost(benefit.id)
      byCover.set(benefit.id, existing)
    }
  }

  const policies: PolicyCostBreakdown[] = [...byCover.values()].map((item) => {
    const cd = getCdAccount(item.cdAccountId)
    return {
      policyId: item.policyId,
      policyName: item.policyName,
      insurerName: item.insurerName,
      insurerLogo: item.insurerLogo,
      policyNumber: item.policyNumber,
      livesAdded: item.lives,
      endorsementCost: Math.round(item.cost),
      cdAccountId: item.cdAccountId,
      cdAccountName: cd?.name ?? 'CD',
      cdBalance: cd?.balance ?? 0,
    }
  })

  const totalEndorsementCost = policies.reduce(
    (sum, p) => sum + p.endorsementCost,
    0,
  )
  const assignedLives = lives.filter((l) => l.selectedBenefitIds.length > 0)
  const totalPayrollDeduction = assignedLives.length * 1250

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

  return {
    totalLivesAdded: assignedLives.length,
    totalEndorsementCost,
    totalPayrollDeduction,
    monthlyInstallment: Math.round(totalPayrollDeduction / 12),
    policies,
    cdShortfall: shortfall > 0,
    cdShortfallAmount: shortfall,
  }
}

export function buildRefundEstimate(args: {
  employeeName: string
  dependantCount: number
  hasClaimOnGmc?: boolean
  includeFlatWellness?: boolean
}): RefundEstimate {
  const lives = 1 + args.dependantCount
  const gmcRefund = args.hasClaimOnGmc ? 0 : 4200
  const gpaRefund = 1800
  const parentalRefund = 0

  const lines: RefundLine[] = [
    {
      id: 'line-gmc',
      label: 'Loop GMC Policy',
      kind: 'policy',
      lives,
      insurerRefund: gmcRefund,
      employeeRefund: 0,
      zeroReason: args.hasClaimOnGmc ? 'claim' : undefined,
    },
    {
      id: 'line-plan',
      label: 'Standard Plan',
      kind: 'plan',
      lives,
      insurerRefund: gmcRefund + gpaRefund,
      employeeRefund: 2100,
      components: [
        {
          id: 'comp-gmc',
          label: 'Group Medical Cover',
          kind: 'component',
          lives,
          insurerRefund: gmcRefund,
          employeeRefund: 1400,
          zeroReason: args.hasClaimOnGmc ? 'claim' : undefined,
        },
        {
          id: 'comp-gpa',
          label: 'Group Personal Accidental',
          kind: 'component',
          lives,
          insurerRefund: gpaRefund,
          employeeRefund: 700,
        },
      ],
    },
    {
      id: 'line-parental',
      label: 'GMC Parental',
      kind: 'benefit',
      lives: Math.min(lives, 2),
      insurerRefund: parentalRefund,
      employeeRefund: 0,
      zeroReason: 'not_prorated',
    },
  ]

  if (args.includeFlatWellness) {
    lines.push({
      id: 'line-wellness',
      label: 'Wellness Flat Benefit',
      kind: 'benefit',
      lives: 1,
      insurerRefund: 0,
      employeeRefund: 0,
      zeroReason: 'not_insurance',
      staysActive: true,
      staysActiveNote:
        'Self-bought flat-validity benefit — stays active until its own end date',
    })
  }

  const totalInsurerRefund = lines.reduce((s, l) => s + l.insurerRefund, 0)
  const totalEmployeeRefund = lines.reduce((s, l) => s + l.employeeRefund, 0)

  return {
    totalLivesDeleted: lives,
    totalInsurerRefund,
    totalEmployeeRefund,
    lines,
    policiesByCd: [
      {
        cdAccountId: 'cd-main',
        cdAccountName: 'Symphony Main CD',
        cdBalance: 2_38_456,
        policies: [
          { policyName: 'Loop GMC Policy', lives, refund: gmcRefund },
          { policyName: 'Loop GPA Policy', lives, refund: gpaRefund },
        ],
      },
      {
        cdAccountId: 'cd-life',
        cdAccountName: 'Life & Parental CD',
        cdBalance: 45_000,
        policies: [
          {
            policyName: 'Loop GMC (Parental) Policy',
            lives: Math.min(lives, 2),
            refund: parentalRefund,
          },
        ],
      },
    ],
  }
}

export const sampleBulkRows: BulkMemberRow[] = [
  {
    id: 'row-1',
    employeeId: 'EMP-1001',
    name: 'Neeru Yadav',
    email: 'neeru.yadav@herbalife.com',
    department: 'Operations',
    relationship: 'Self',
    assignedPlanId: 'plan-standard',
    benefitIds: ['ben-gmc', 'ben-gpa'],
    purchaseGroupSelections: { 'pg-core': ['opt-standard'] },
    assignmentSource: 'default',
    needsManualAssignment: false,
    status: 'pass',
    dealId: flexDeal.id,
    payrollDelta: 1250,
  },
  {
    id: 'row-2',
    employeeId: 'EMP-1001',
    name: 'Amit Yadav',
    email: 'neeru.yadav@herbalife.com',
    department: 'Operations',
    relationship: 'Spouse',
    assignedPlanId: 'plan-standard',
    benefitIds: ['ben-gmc', 'ben-gpa'],
    purchaseGroupSelections: { 'pg-core': ['opt-standard'] },
    assignmentSource: 'rule',
    needsManualAssignment: false,
    status: 'pass',
    dealId: flexDeal.id,
    payrollDelta: 980,
  },
  {
    id: 'row-3',
    employeeId: 'EMP-1042',
    name: 'Divya Verma',
    email: 'divya.verma@herbalife.com',
    department: 'Engineering',
    relationship: 'Self',
    assignedPlanId: 'plan-parental',
    benefitIds: ['ben-gmc', 'ben-gpa', 'ben-gmc-parental'],
    purchaseGroupSelections: { 'pg-core': ['opt-parental'] },
    assignmentSource: 'rule',
    needsManualAssignment: false,
    status: 'pass',
    dealId: flexDeal.id,
    payrollDelta: 2100,
  },
  {
    id: 'row-4',
    employeeId: 'EMP-1042',
    name: 'Suresh Verma',
    email: 'divya.verma@herbalife.com',
    department: 'Engineering',
    relationship: 'Parent',
    assignedPlanId: 'plan-parental',
    benefitIds: ['ben-gmc-parental'],
    purchaseGroupSelections: { 'pg-core': ['opt-parental'] },
    assignmentSource: 'rule',
    needsManualAssignment: false,
    status: 'pass',
    dealId: flexDeal.id,
    payrollDelta: 1600,
    needsMidtermProof: true,
    coverageStartDate: '2026-09-15',
    employeeStartDate: '2026-08-01',
  },
  {
    id: 'row-5',
    employeeId: 'EMP-1108',
    name: 'Rohan Mehta',
    email: 'rohan.mehta@herbalife.com',
    department: 'Sales',
    relationship: 'Self',
    assignedPlanId: null,
    benefitIds: [],
    purchaseGroupSelections: {},
    assignmentSource: 'manual',
    needsManualAssignment: true,
    status: 'needs-review',
    dealId: flexDeal.id,
    payrollDelta: 0,
    validationError: 'No matching assignment rule — pick a plan',
    validationField: 'Core Cover',
  },
  {
    id: 'row-6',
    employeeId: 'EMP-1120',
    name: 'Priya Nair',
    email: 'priya.nair@herbalife.com',
    department: 'HR',
    relationship: 'Self',
    assignedPlanId: 'plan-standard',
    benefitIds: ['ben-gmc', 'ben-gpa'],
    purchaseGroupSelections: { 'pg-core': ['opt-standard'] },
    assignmentSource: 'default',
    needsManualAssignment: false,
    status: 'pass',
    dealId: flexDeal.id,
    payrollDelta: 1250,
  },
  {
    id: 'row-7',
    employeeId: 'EMP-1135',
    name: 'Kabir Singh',
    email: 'kabir.singh@herbalife.com',
    department: 'Finance',
    relationship: 'Self',
    assignedPlanId: null,
    benefitIds: [],
    purchaseGroupSelections: {},
    assignmentSource: 'manual',
    needsManualAssignment: false,
    status: 'fail',
    dealId: flexDeal.id,
    payrollDelta: 0,
    validationError: 'Date of birth is invalid',
    validationField: 'Date of Birth',
  },
  {
    id: 'row-8',
    employeeId: 'EMP-1144',
    name: 'Ananya Rao',
    email: 'ananya.rao@herbalife.com',
    department: 'Marketing',
    relationship: 'Self',
    assignedPlanId: 'plan-standard',
    benefitIds: ['ben-gmc', 'ben-gpa'],
    purchaseGroupSelections: { 'pg-core': ['opt-standard'] },
    assignmentSource: 'default',
    needsManualAssignment: false,
    status: 'pass',
    dealId: flexDeal.id,
    payrollDelta: 1250,
  },
]

export const sampleBulkDeleteRows: {
  id: string
  employeeId: string
  name: string
  dateOfLeaving: string
  status: 'pass' | 'fail'
  hasClaim: boolean
  coverages: string[]
  payrollRefund: number
  insurerRefund: number
  error?: string
}[] = [
  {
    id: 'del-1',
    employeeId: 'EMP-20487',
    name: 'Rahul Sharma',
    dateOfLeaving: '2026-08-10',
    status: 'pass' as const,
    hasClaim: true,
    coverages: ['Standard Plan', 'Loop GMC Policy', 'Loop GPA Policy'],
    payrollRefund: 0,
    insurerRefund: 1800,
  },
  {
    id: 'del-2',
    employeeId: 'EMP-19821',
    name: 'Priya Nair',
    dateOfLeaving: '2026-08-08',
    status: 'pass' as const,
    hasClaim: false,
    coverages: ['Standard Plan', 'Loop GMC Policy'],
    payrollRefund: 2100,
    insurerRefund: 4200,
  },
  {
    id: 'del-3',
    employeeId: 'EMP-99999',
    name: 'Unknown',
    dateOfLeaving: '2026-08-01',
    status: 'fail' as const,
    hasClaim: false,
    coverages: [] as string[],
    payrollRefund: 0,
    insurerRefund: 0,
    error: 'Employee ID not found',
  },
]

export function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function zeroReasonLabel(reason: RefundZeroReason) {
  if (reason === 'claim') return 'A claim exists on this cover'
  if (reason === 'not_insurance') return 'Not an insurance benefit'
  if (reason === 'not_prorated') return 'Premium is not prorated'
  return 'Not eligible for refund'
}

export function isValidDateOfLeaving(isoDate: string, today = new Date()) {
  if (!isoDate) return false
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return false
  const start = new Date(today)
  start.setHours(0, 0, 0, 0)
  const end = new Date(today)
  end.setHours(0, 0, 0, 0)
  const min = new Date(end)
  min.setDate(min.getDate() - 45)
  d.setHours(0, 0, 0, 0)
  return d >= min && d <= end
}
