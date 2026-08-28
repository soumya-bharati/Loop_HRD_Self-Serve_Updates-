import type {
  AttributeDefinition,
  CdAccountConfig,
  FlexDealConfig,
} from './types'

const spouseChildFamily = [
  { relationship: 'Spouse' as const, maxCount: 1, midtermAllowedWhenActive: true },
  { relationship: 'Child' as const, maxCount: 2, midtermAllowedWhenActive: true },
]

const parentalFamily = [
  { relationship: 'Parent' as const, maxCount: 2, midtermAllowedWhenActive: false },
  {
    relationship: 'Parent-in-law' as const,
    maxCount: 2,
    midtermAllowedWhenActive: false,
  },
]

const midtermSpouseChild = [
  {
    relationship: 'Child' as const,
    windowDays: 45,
    evidenceField: 'dateOfBirth' as const,
    requiresDocument: false,
  },
  {
    relationship: 'Spouse' as const,
    windowDays: 45,
    evidenceField: 'marriageDate' as const,
    requiresDocument: true,
    documentLabel: 'Marriage certificate',
  },
]

const marriageDateAttr: AttributeDefinition = {
  id: 'attr-marriage-date',
  label: 'Date of marriage',
  required: true,
  inputBy: 'hr',
  entity: 'dependant',
  relationships: ['Spouse'],
}

const gmcPolicySlabs = [
  {
    id: 'gmc-3l-self',
    label: 'Sum Insured - 3 lakhs, Family Structure - Self',
  },
  {
    id: 'gmc-3l-spouse',
    label: 'Sum Insured - 3 lakhs, Family Structure - Self + Spouse',
  },
  {
    id: 'gmc-3l-family',
    label: 'Sum Insured - 3 lakhs, Family Structure - Self + Spouse + 2 Children',
  },
  {
    id: 'gmc-5l-self',
    label: 'Sum Insured - 5 lakhs, Family Structure - Self',
  },
  {
    id: 'gmc-5l-spouse',
    label: 'Sum Insured - 5 lakhs, Family Structure - Self + Spouse',
  },
  {
    id: 'gmc-5l-family',
    label: 'Sum Insured - 5 lakhs, Family Structure - Self + Spouse + 2 Children',
  },
  {
    id: 'gmc-10l-self',
    label: 'Sum Insured - 10 lakhs, Family Structure - Self',
  },
  {
    id: 'gmc-10l-spouse',
    label: 'Sum Insured - 10 lakhs, Family Structure - Self + Spouse',
  },
  {
    id: 'gmc-10l-family',
    label: 'Sum Insured - 10 lakhs, Family Structure - Self + Spouse + 2 Children',
  },
]

const opdPolicySlabs = [
  {
    id: 'opd-25k-self',
    label: 'Sum Insured - 25,000, Family Structure - Self',
  },
  {
    id: 'opd-25k-spouse',
    label: 'Sum Insured - 25,000, Family Structure - Self + Spouse',
  },
  {
    id: 'opd-25k-family',
    label: 'Sum Insured - 25,000, Family Structure - Self + Spouse + 2 Children',
  },
  {
    id: 'opd-50k-self',
    label: 'Sum Insured - 50,000, Family Structure - Self',
  },
  {
    id: 'opd-50k-spouse',
    label: 'Sum Insured - 50,000, Family Structure - Self + Spouse',
  },
  {
    id: 'opd-50k-family',
    label: 'Sum Insured - 50,000, Family Structure - Self + Spouse + 2 Children',
  },
  {
    id: 'opd-1l-self',
    label: 'Sum Insured - 1 lakh, Family Structure - Self',
  },
  {
    id: 'opd-1l-spouse',
    label: 'Sum Insured - 1 lakh, Family Structure - Self + Spouse',
  },
  {
    id: 'opd-1l-family',
    label: 'Sum Insured - 1 lakh, Family Structure - Self + Spouse + 2 Children',
  },
]

const preferredHospitalAttr: AttributeDefinition = {
  id: 'attr-preferred-hospital',
  label: 'Preferred Hospital',
  required: false,
  inputBy: 'employee',
  entity: 'dependant',
}

/**
 * Primary Flex deal — mirrors the existing Herbalife mock with extended
 * family / midterm / attribute configuration for the domain layer.
 */
export const herbalifeFlexDeal: FlexDealConfig = {
  id: 'deal-herbalife-flex',
  name: 'Herbalife HealthFlex',
  isFlexCompany: true,
  status: 'active',
  periodLabel: 'FY 2026–27',
  periodStart: '2026-04-01',
  periodEnd: '2027-03-31',
  defaultPlanId: 'plan-standard',
  maxDependantsUnion: 4,
  employeeAttributes: [
    {
      id: 'attr-department',
      label: 'Department',
      required: true,
      inputBy: 'hr',
      entity: 'employee',
      allowedValues: [
        'Engineering',
        'Operations',
        'HR',
        'Finance',
        'Marketing',
        'Sales',
      ],
    },
    {
      id: 'attr-grade',
      label: 'Grade',
      required: true,
      inputBy: 'hr',
      entity: 'employee',
      allowedValues: ['L1', 'L2', 'L3', 'L4'],
    },
    {
      id: 'attr-location',
      label: 'Work Location',
      required: false,
      inputBy: 'hr',
      entity: 'employee',
      allowedValues: ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad'],
    },
    {
      id: 'attr-preferred-hospital',
      label: 'Preferred Hospital',
      required: false,
      inputBy: 'employee',
      entity: 'employee',
    },
  ],
  benefits: [
    {
      id: 'ben-gtl',
      name: 'Group Term Life',
      policyName: 'GTL Policy_INVOQ LOOP INSURANCE BROKER',
      policyNumber: 'GT002801',
      insurerName: 'HDFC Standard Life Insurance Co. Ltd.',
      policyLabel: 'GTL Policy_INVOQ LOOP INSURANCE BROKER',
      insurerLogo: 'icici',
      category: 'gtl',
      isInsurance: true,
      premiumProrated: true,
      unitCost: 1450,
      payrollContribution: 0,
      familyDefinition: [],
      dependantAttributes: [],
      midtermRules: [],
      backingPolicyId: 'pol-gtl',
      cdAccountId: 'cd-life',
      policySlabs: [
        {
          id: 'si-15l-self',
          label: 'Sum Insured - 15 lakhs, Family Structure - Self',
        },
        {
          id: 'si-30l-self',
          label: 'Sum Insured - 30 lakhs, Family Structure - Self',
        },
        {
          id: 'si-45l-self',
          label: 'Sum Insured - 45 lakhs, Family Structure - Self',
        },
        {
          id: 'si-75l-self',
          label: 'Sum Insured - 75 lakhs, Family Structure - Self',
        },
        {
          id: 'si-1cr-self',
          label: 'Sum Insured - 1 crore, Family Structure - Self',
        },
      ],
    },
    {
      id: 'ben-gpa',
      name: 'Group Personal Accident',
      policyName: 'GPA Policy_INVOQ LOOP INSURANCE BROKERS',
      policyNumber: 'P0126200002/9999/100808',
      insurerName: 'Magma HDI General Insurance Co Ltd',
      policyLabel: 'GPA Policy_INVOQ LOOP INSURANCE BROKERS',
      insurerLogo: 'icici',
      category: 'gpa',
      isInsurance: true,
      premiumProrated: true,
      unitCost: 1620,
      payrollContribution: 280,
      familyDefinition: [
        {
          relationship: 'Spouse',
          maxCount: 1,
          midtermAllowedWhenActive: true,
        },
        {
          relationship: 'Child',
          maxCount: 2,
          midtermAllowedWhenActive: true,
        },
      ],
      dependantAttributes: [],
      midtermRules: midtermSpouseChild,
      backingPolicyId: 'pol-gpa',
      cdAccountId: 'cd-main',
    },
    {
      id: 'ben-gmc',
      name: 'Group Medical Coverage',
      policyName: 'GMC Policy_JUNE HEALTH NETWORK',
      policyNumber: '252405/48/2026/2222',
      insurerName: 'The Oriental Insurance Co Ltd',
      policyLabel: 'GMC Policy_JUNE HEALTH NETWORK',
      insurerLogo: 'digit',
      category: 'gmc',
      isInsurance: true,
      premiumProrated: true,
      unitCost: 1850,
      payrollContribution: 720,
      familyDefinition: spouseChildFamily,
      dependantAttributes: [marriageDateAttr, preferredHospitalAttr],
      midtermRules: midtermSpouseChild,
      backingPolicyId: 'pol-gmc',
      cdAccountId: 'cd-main',
      policySlabs: gmcPolicySlabs,
    },
    {
      id: 'ben-gmc-parental',
      name: 'Group Medical Coverage',
      policyName: 'The Oriental Insurance Co Ltd',
      policyNumber: '',
      insurerName: 'The Oriental Insurance Co Ltd',
      insurerLogo: 'digit',
      category: 'gmc',
      isInsurance: true,
      premiumProrated: true,
      unitCost: 2400,
      payrollContribution: 900,
      familyDefinition: parentalFamily,
      dependantAttributes: [
        {
          id: 'attr-city',
          label: 'City of residence',
          required: true,
          inputBy: 'hr',
          entity: 'dependant',
        },
      ],
      midtermRules: [],
      backingPolicyId: 'pol-gmc',
      cdAccountId: 'cd-life',
      policySlabs: gmcPolicySlabs,
    },
    {
      id: 'ben-gmc-opd',
      name: 'Group Medical Coverage (OPD)',
      policyName: 'Magma HDI General Insurance Co Ltd',
      policyNumber: '',
      insurerName: 'Magma HDI General Insurance Co Ltd',
      insurerLogo: 'icici',
      category: 'opd',
      isInsurance: true,
      premiumProrated: true,
      unitCost: 480,
      payrollContribution: 150,
      familyDefinition: spouseChildFamily,
      dependantAttributes: [],
      midtermRules: midtermSpouseChild,
      backingPolicyId: 'pol-gmc-opd',
      cdAccountId: 'cd-main',
      policySlabs: opdPolicySlabs,
    },
    {
      id: 'ben-wellness',
      name: 'Wellness Flat Benefit',
      policyName: 'Employee Wellness',
      policyNumber: 'WEL-001',
      insurerName: 'Loop',
      insurerLogo: 'digit',
      category: 'wellness',
      isInsurance: false,
      premiumProrated: false,
      unitCost: 400,
      payrollContribution: 0,
      familyDefinition: [{ relationship: 'Spouse', maxCount: 1 }],
      dependantAttributes: [],
      midtermRules: [],
      cdAccountId: 'cd-main',
      retainedOnOffboard: true,
      retainedUntil: '2026-12-31',
      retainedReason:
        'Self-bought flat-validity benefit — stays active until its own end date',
    },
  ],
  plans: [
    {
      id: 'plan-standard',
      name: 'Standard Plan',
      benefitIds: ['ben-gmc', 'ben-gpa', 'ben-gtl'],
      maxDependants: 3,
    },
    {
      id: 'plan-parental',
      name: 'Parental Plan',
      benefitIds: ['ben-gmc', 'ben-gpa', 'ben-gtl', 'ben-gmc-parental'],
      maxDependants: 4,
    },
  ],
  purchaseGroups: [
    {
      id: 'pg-core',
      name: 'Core Cover',
      selectMode: 'single',
      requirement: 'mandatory',
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
      requirement: 'optional',
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
  assignmentRules: [
    { id: 'rule-eng', department: 'Engineering', planId: 'plan-parental' },
    { id: 'rule-ops', department: 'Operations', planId: 'plan-standard' },
    { id: 'rule-hr', department: 'HR', planId: 'plan-standard' },
    { id: 'rule-fin', department: 'Finance', planId: 'plan-standard' },
    { id: 'rule-mkt', department: 'Marketing', planId: 'plan-standard' },
  ],
}

/**
 * Second active Flex deal for multi-deal accounts (persona B).
 * Leaner catalog: GMC + GTL assigned core, optional dental add-on.
 */
export const symphonyCareFlexDeal: FlexDealConfig = {
  id: 'deal-symphony-care-flex',
  name: 'Symphony CareFlex',
  isFlexCompany: true,
  status: 'active',
  periodLabel: 'FY 2026–27',
  periodStart: '2026-04-01',
  periodEnd: '2027-03-31',
  defaultPlanId: 'plan-care-core',
  maxDependantsUnion: 3,
  employeeAttributes: [
    {
      id: 'attr-department',
      label: 'Department',
      required: true,
      inputBy: 'hr',
      entity: 'employee',
      allowedValues: ['Engineering', 'Operations', 'HR'],
    },
    {
      id: 'attr-grade',
      label: 'Grade',
      required: true,
      inputBy: 'hr',
      entity: 'employee',
      allowedValues: ['A', 'B', 'C'],
    },
    {
      id: 'attr-employment-type',
      label: 'Employment type',
      required: true,
      inputBy: 'hr',
      entity: 'employee',
      allowedValues: ['Permanent', 'Contract'],
    },
    {
      id: 'attr-business-unit',
      label: 'Business unit',
      required: false,
      inputBy: 'hr',
      entity: 'employee',
      allowedValues: ['India Ops', 'Shared Services', 'Product'],
    },
  ],
  benefits: [
    {
      id: 'ben-care-gmc',
      name: 'GMC — Gold',
      policyName: 'Care GMC Gold',
      policyNumber: 'CG-2026-8841',
      insurerName: 'Care Health Insurance',
      insurerLogo: 'care',
      category: 'gmc',
      isInsurance: true,
      premiumProrated: true,
      unitCost: 2100,
      payrollContribution: 850,
      familyDefinition: spouseChildFamily,
      dependantAttributes: [marriageDateAttr],
      midtermRules: midtermSpouseChild,
      backingPolicyId: 'pol-gmc',
      cdAccountId: 'cd-main',
    },
    {
      id: 'ben-care-gtl',
      name: 'Group Term Life',
      policyName: 'ABSLI GTL',
      policyNumber: 'GTL-509468',
      insurerName: 'Aditya Birla Sun Life',
      insurerLogo: 'aditya-birla',
      category: 'gtl',
      isInsurance: true,
      premiumProrated: true,
      unitCost: 980,
      payrollContribution: 400,
      familyDefinition: [],
      dependantAttributes: [],
      midtermRules: [],
      backingPolicyId: 'pol-gtl',
      cdAccountId: 'cd-life',
      policySlabs: [
        {
          id: 'si-15l-self',
          label: 'Sum Insured - 15 lakhs, Family Structure - Self',
        },
        {
          id: 'si-30l-self',
          label: 'Sum Insured - 30 lakhs, Family Structure - Self',
        },
        {
          id: 'si-45l-self',
          label: 'Sum Insured - 45 lakhs, Family Structure - Self',
        },
        {
          id: 'si-75l-self',
          label: 'Sum Insured - 75 lakhs, Family Structure - Self',
        },
        {
          id: 'si-1cr-self',
          label: 'Sum Insured - 1 crore, Family Structure - Self',
        },
      ],
    },
    {
      id: 'ben-care-dental',
      name: 'Dental Care',
      policyName: 'Dental Rider',
      policyNumber: 'DEN-110',
      insurerName: 'Care Health Insurance',
      insurerLogo: 'care',
      category: 'opd',
      isInsurance: true,
      premiumProrated: true,
      unitCost: 2400,
      payrollContribution: 200,
      familyDefinition: [
        {
          relationship: 'Spouse',
          maxCount: 1,
          midtermAllowedWhenActive: true,
        },
      ],
      dependantAttributes: [
        {
          id: 'attr-city',
          label: 'City',
          required: true,
          inputBy: 'hr',
          entity: 'dependant',
        },
      ],
      midtermRules: [
        {
          relationship: 'Spouse',
          windowDays: 45,
          evidenceField: 'marriageDate',
          requiresDocument: true,
          documentLabel: 'Marriage certificate',
        },
      ],
      cdAccountId: 'cd-main',
    },
  ],
  plans: [
    {
      id: 'plan-care-core',
      name: 'Care Core',
      benefitIds: ['ben-care-gmc', 'ben-care-gtl'],
      maxDependants: 3,
    },
  ],
  purchaseGroups: [
    {
      id: 'pg-care-core',
      name: 'Core Cover',
      selectMode: 'single',
      requirement: 'mandatory',
      options: [
        {
          id: 'opt-care-core',
          label: 'Care Core',
          kind: 'plan',
          planId: 'plan-care-core',
        },
      ],
    },
    {
      id: 'pg-care-addons',
      name: 'Optional add-ons',
      selectMode: 'multi',
      requirement: 'optional',
      options: [
        {
          id: 'opt-care-dental',
          label: 'Dental Care',
          kind: 'benefit',
          benefitId: 'ben-care-dental',
        },
      ],
    },
  ],
  assignmentRules: [
    { id: 'rule-care-eng', department: 'Engineering', planId: 'plan-care-core' },
    { id: 'rule-care-ops', department: 'Operations', planId: 'plan-care-core' },
    { id: 'rule-care-hr', department: 'HR', planId: 'plan-care-core' },
  ],
}

export const domainCdAccounts: CdAccountConfig[] = [
  {
    id: 'cd-main',
    name: 'Symphony Main CD',
    balance: 2_38_456,
    policyIds: [
      'pol-gmc',
      'pol-gpa',
      'pol-gmc-opd',
      'ben-gmc',
      'ben-gpa',
      'ben-wellness',
      'ben-care-gmc',
      'ben-care-dental',
    ],
  },
  {
    id: 'cd-life',
    name: 'Life & Parental CD',
    balance: 45_000,
    policyIds: ['pol-gtl', 'ben-gmc-parental', 'ben-care-gtl'],
  },
]

/** Full configuration-driven deal catalog (domain source of truth). */
export const dealCatalog: FlexDealConfig[] = [
  herbalifeFlexDeal,
  symphonyCareFlexDeal,
]

export function listActiveDeals(
  catalog: FlexDealConfig[] = dealCatalog,
): FlexDealConfig[] {
  return catalog.filter((d) => d.status === 'active')
}

export function getDealConfig(
  dealId: string,
  catalog: FlexDealConfig[] = dealCatalog,
): FlexDealConfig | undefined {
  return catalog.find((d) => d.id === dealId)
}

export function getPlanConfig(deal: FlexDealConfig, planId: string) {
  return deal.plans.find((p) => p.id === planId)
}

export function getBenefitConfig(deal: FlexDealConfig, benefitId: string) {
  return deal.benefits.find((b) => b.id === benefitId)
}

export function getCdAccountConfig(
  id: string,
  accounts: CdAccountConfig[] = domainCdAccounts,
) {
  return accounts.find((c) => c.id === id)
}

/** Auto-select when exactly one active deal exists; otherwise require HR choice. */
export function resolveInitialDealId(
  catalog: FlexDealConfig[] = dealCatalog,
): string | null {
  const active = listActiveDeals(catalog)
  return active.length === 1 ? active[0]!.id : null
}
