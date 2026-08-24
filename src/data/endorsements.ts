export type StatusTone = 'default' | 'accepting'

export interface EndorsementRecord {
  id: string
  insurerLogo: 'digit' | 'icici'
  policyName: string
  insurerName: string
  policyLabel: string
  policyNumber: string
  totalLifeCount: number
  costLabel: string
  costNote?: string
  showCostInfo?: boolean
  livesLastUpdatedOn: string
  currentStatus: string
  statusTone?: StatusTone
}

export interface MonthGroup {
  id: string
  label: string
  endorsements: EndorsementRecord[]
}

export const endorsementsSummary = {
  ongoing: '04',
  completed: '10',
  deadlineMonth: "Jan’ 2024",
  deadlineDate: "05th Jan’ 2024!",
  profileName: 'Herbalife - Bangalore Plant..',
}

const gmcJan: EndorsementRecord = {
  id: 'jan-gmc',
  insurerLogo: 'digit',
  policyName: 'Group Medical Cover',
  insurerName: 'Go Digit',
  policyLabel: 'Loop GMC Policy',
  policyNumber: 'XYZ-684-362-564',
  totalLifeCount: 100,
  costLabel: '₹10,000',
  costNote: '(refund)',
  showCostInfo: true,
  livesLastUpdatedOn: '01 Jan 2024',
  currentStatus: 'Data Submission',
  statusTone: 'default',
}

const gpaJan: EndorsementRecord = {
  id: 'jan-gpa',
  insurerLogo: 'icici',
  policyName: 'Group Personal Accidental',
  insurerName: 'ICICI Lombard',
  policyLabel: 'Loop GPA Policy',
  policyNumber: 'XYZ-684-362-564',
  totalLifeCount: 100,
  costLabel: '₹10,000',
  livesLastUpdatedOn: '01 Jan 2024',
  currentStatus: 'Accepting data till 05 Jan 2024',
  statusTone: 'accepting',
}

const gmcDec: EndorsementRecord = {
  ...gmcJan,
  id: 'dec-gmc',
  currentStatus: 'Accepting data till 05 Jan 2024',
  statusTone: 'accepting',
  costNote: undefined,
  showCostInfo: false,
}

const gpaDec: EndorsementRecord = {
  ...gpaJan,
  id: 'dec-gpa',
}

export const monthGroups: MonthGroup[] = [
  {
    id: 'jan-2024',
    label: "Jan’ 2024 (02 Endorsements)",
    endorsements: [gmcJan, gpaJan],
  },
  {
    id: 'dec-2023',
    label: "Dec’ 2023 (02 Endorsements)",
    endorsements: [gmcDec, gpaDec],
  },
]
