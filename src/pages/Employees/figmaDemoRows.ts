import type { RosterRow } from '@/pages/Employees/stats'

/** Matches Flex-Sep-2026 frame 18:12163 prototype roster. */
export const FIGMA_DEMO_TOTAL = 281

const baseDependants = [
  { name: 'Madhuri Gupta', relationship: 'spouse', gender: 'Female' as const },
  { name: 'Kush Gupta', relationship: 'child', gender: 'Male' as const },
  { name: 'Veer Gupta', relationship: 'child', gender: 'Male' as const },
]

const baseRow: Omit<RosterRow, 'id' | 'enrStatus' | 'reminderScheduled'> = {
  employeeId: 'SS3301',
  name: 'A Bhagyalakshmi',
  initials: 'A',
  gender: 'Male',
  dateOfBirth: 'Apr 24, 1986',
  email: 'bhagyalakshmi@demo.com',
  sumInsured: '₹5 lacs',
  coverageStart: 'Apr 24, 2026',
  insuranceStatus: 'Insured',
  empStatus: 'Active',
  dependants: baseDependants,
  plans: ['Vymo Bronze', 'Vymo Gold', 'Critical Care Bundle - Couple Pan'],
  benefits: ['Cult Pro', 'Annual Health Checkup - Essential'],
  planPremium: '₹43,600',
  benefitPremium: '₹43,600',
  wallet: '₹5L',
  prepaid: '₹5L',
  payrollDeduction: '₹5L',
  href: '/manage-lives/employee/emp-1',
  kind: 'employee',
}

export const figmaDemoRows: RosterRow[] = [
  {
    ...baseRow,
    id: 'figma-1',
    enrStatus: 'Enrolled',
    reminderScheduled: false,
  },
  {
    ...baseRow,
    id: 'figma-2',
    enrStatus: 'Pending',
    reminderScheduled: true,
  },
  {
    ...baseRow,
    id: 'figma-3',
    name: 'A Bhagyalakshmi',
    enrStatus: 'Enrolled',
    reminderScheduled: false,
    dependants: [
      { name: 'Madhuri Gupta', relationship: 'spouse', gender: 'Female' },
      { name: 'Kush Gupta', relationship: 'child', gender: 'Male' },
    ],
  },
  {
    ...baseRow,
    id: 'figma-4',
    enrStatus: 'Pending',
    reminderScheduled: true,
    dependants: [
      { name: 'Madhuri Gupta', relationship: 'spouse', gender: 'Female' },
      { name: 'Kush Gupta', relationship: 'child', gender: 'Male' },
    ],
  },
  ...Array.from({ length: 6 }, (_, index) => ({
    ...baseRow,
    id: `figma-${index + 5}`,
    employeeId: `SS330${index + 2}`,
    enrStatus: (index % 2 === 0 ? 'Enrolled' : 'Pending') as RosterRow['enrStatus'],
    reminderScheduled: index % 2 === 1,
  })),
]

export const FIGMA_DEAL_LABEL = "Flex Benefits - Aug'26"
