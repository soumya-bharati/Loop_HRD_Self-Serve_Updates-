export type Gender = 'Male' | 'Female' | 'Other'
export type Relationship =
  | 'Self'
  | 'Spouse'
  | 'Child'
  | 'Parent'
  | 'Parent-in-law'
  | 'Sibling'
  | 'Other'

export interface EmployeeFormData {
  employeeId: string
  firstName: string
  lastName: string
  gender: Gender | ''
  dateOfBirth: string
  relationship: Relationship | ''
  mobile: string
  email: string
  dateOfJoining: string
  customAttributes: Record<string, string>
}

export interface DependantFormData {
  id: string
  firstName: string
  lastName: string
  gender: Gender | ''
  dateOfBirth: string
  relationship: Relationship | ''
  mobile: string
  email: string
  /** Benefit / policy ids this dependant is enrolled on. */
  selectedBenefitIds: string[]
}

export interface MemberCoverage {
  kind: 'policy' | 'plan' | 'benefit'
  id: string
  label: string
  category?: 'gmc' | 'gpa' | 'gtl' | 'opd'
  planId?: string
}

export interface SearchableEmployee {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  email: string
  mobile: string
  department: string
  gender: Gender
  dateOfBirth: string
  dateOfJoining: string
  plans: { id: string; name: string; category: 'gmc' | 'gpa' | 'gtl' | 'opd' }[]
  coverages: MemberCoverage[]
  dependants: {
    id: string
    firstName: string
    lastName: string
    relationship: Relationship
    dateOfBirth: string
    gender: Gender
    email: string
    mobile: string
  }[]
  hasClaimOnGmc: boolean
  hasFlatWellness: boolean
  requiresProofOnEdit: boolean
}

export const emptyEmployeeForm = (): EmployeeFormData => ({
  employeeId: '',
  firstName: '',
  lastName: '',
  gender: '',
  dateOfBirth: '',
  relationship: 'Self',
  mobile: '',
  email: '',
  dateOfJoining: '',
  customAttributes: {},
})

export const emptyDependantForm = (id: string): DependantFormData => ({
  id,
  firstName: '',
  lastName: '',
  gender: '',
  dateOfBirth: '',
  relationship: '',
  mobile: '',
  email: '',
  selectedBenefitIds: [],
})

export const sampleEmployees: SearchableEmployee[] = [
  {
    id: 'emp-1',
    employeeId: 'EMP-20487',
    firstName: 'Rahul',
    lastName: 'Sharma',
    email: 'rahul.sharma@symphonyeyc.com',
    mobile: '9876543210',
    department: 'Engineering',
    gender: 'Male',
    dateOfBirth: '1992-03-14',
    dateOfJoining: '2021-06-01',
    plans: [
      { id: 'plan-standard', name: 'Standard Plan', category: 'gmc' },
      { id: 'plan-parental', name: 'Parental Plan', category: 'gmc' },
    ],
    coverages: [
      { kind: 'plan', id: 'plan-standard', label: 'Standard Plan', category: 'gmc', planId: 'plan-standard' },
      { kind: 'plan', id: 'plan-parental', label: 'Parental Plan', category: 'gmc', planId: 'plan-parental' },
      { kind: 'benefit', id: 'ben-gmc', label: 'Group Medical Cover', category: 'gmc' },
      { kind: 'benefit', id: 'ben-gpa', label: 'Group Personal Accidental', category: 'gpa' },
      { kind: 'policy', id: 'pol-gmc', label: 'Group Medical Coverage' },
    ],
    dependants: [
      {
        id: 'dep-r1',
        firstName: 'Anita',
        lastName: 'Sharma',
        relationship: 'Spouse',
        dateOfBirth: '1994-01-20',
        gender: 'Female',
        email: 'anita.sharma@email.com',
        mobile: '9876543211',
      },
      {
        id: 'dep-r2',
        firstName: 'Aarav',
        lastName: 'Sharma',
        relationship: 'Child',
        dateOfBirth: '2018-05-12',
        gender: 'Male',
        email: '',
        mobile: '',
      },
      {
        id: 'dep-r3',
        firstName: 'Suresh',
        lastName: 'Sharma',
        relationship: 'Parent',
        dateOfBirth: '1965-07-08',
        gender: 'Male',
        email: '',
        mobile: '9876501122',
      },
    ],
    hasClaimOnGmc: true,
    hasFlatWellness: true,
    requiresProofOnEdit: false,
  },
  {
    id: 'emp-2',
    employeeId: 'EMP-19821',
    firstName: 'Priya',
    lastName: 'Nair',
    email: 'priya.nair@symphonyeyc.com',
    mobile: '9811112233',
    department: 'HR',
    gender: 'Female',
    dateOfBirth: '1990-08-22',
    dateOfJoining: '2019-02-15',
    plans: [{ id: 'plan-standard', name: 'Standard Plan', category: 'gmc' }],
    coverages: [
      { kind: 'plan', id: 'plan-standard', label: 'Standard Plan', category: 'gmc', planId: 'plan-standard' },
      { kind: 'benefit', id: 'ben-gmc', label: 'Group Medical Cover', category: 'gmc' },
      { kind: 'policy', id: 'pol-gmc', label: 'Group Medical Coverage' },
    ],
    dependants: [
      {
        id: 'dep-p1',
        firstName: 'Kavya',
        lastName: 'Nair',
        relationship: 'Child',
        dateOfBirth: '2016-11-03',
        gender: 'Female',
        email: '',
        mobile: '',
      },
    ],
    hasClaimOnGmc: false,
    hasFlatWellness: false,
    requiresProofOnEdit: true,
  },
  {
    id: 'emp-3',
    employeeId: 'EMP-17654',
    firstName: 'Ajit',
    lastName: 'Jain',
    email: 'ajit.jain@symphonyeyc.com',
    mobile: '9822223344',
    department: 'Operations',
    gender: 'Male',
    dateOfBirth: '1995-06-14',
    dateOfJoining: '2022-01-10',
    plans: [{ id: 'plan-standard', name: 'Standard Plan', category: 'gmc' }],
    coverages: [
      { kind: 'plan', id: 'plan-standard', label: 'Standard Plan', category: 'gmc', planId: 'plan-standard' },
      { kind: 'benefit', id: 'ben-gmc', label: 'Group Medical Cover', category: 'gmc' },
      { kind: 'benefit', id: 'ben-gpa', label: 'Group Personal Accidental', category: 'gpa' },
    ],
    dependants: [
      {
        id: 'dep-a1',
        firstName: 'Meera',
        lastName: 'Jain',
        relationship: 'Spouse',
        dateOfBirth: '1996-09-02',
        gender: 'Female',
        email: 'meera.jain@email.com',
        mobile: '9822223345',
      },
    ],
    hasClaimOnGmc: false,
    hasFlatWellness: false,
    requiresProofOnEdit: false,
  },
  {
    id: 'emp-4',
    employeeId: 'EMP-22109',
    firstName: 'Neha',
    lastName: 'Kapoor',
    email: 'neha.kapoor@symphonyeyc.com',
    mobile: '9833334455',
    department: 'Finance',
    gender: 'Female',
    dateOfBirth: '1988-11-05',
    dateOfJoining: '2018-08-20',
    plans: [
      { id: 'plan-standard', name: 'Standard Plan', category: 'gmc' },
      { id: 'plan-gpa-extra', name: 'GPA Plus', category: 'gpa' },
    ],
    coverages: [
      { kind: 'plan', id: 'plan-standard', label: 'Standard Plan', category: 'gmc', planId: 'plan-standard' },
      { kind: 'plan', id: 'plan-gpa-extra', label: 'GPA Plus', category: 'gpa', planId: 'plan-gpa-extra' },
      { kind: 'benefit', id: 'ben-gpa', label: 'Group Personal Accidental', category: 'gpa' },
    ],
    dependants: [
      {
        id: 'dep-n1',
        firstName: 'Rohan',
        lastName: 'Kapoor',
        relationship: 'Spouse',
        dateOfBirth: '1986-04-18',
        gender: 'Male',
        email: 'rohan.kapoor@email.com',
        mobile: '9833334456',
      },
      {
        id: 'dep-n2',
        firstName: 'Ishaan',
        lastName: 'Kapoor',
        relationship: 'Child',
        dateOfBirth: '2014-02-09',
        gender: 'Male',
        email: '',
        mobile: '',
      },
    ],
    hasClaimOnGmc: false,
    hasFlatWellness: false,
    requiresProofOnEdit: false,
  },
]

export const bulkTemplateFileName = 'flex_lives_addition_template.xlsx'
export const bulkDeleteTemplateFileName = 'flex_lives_deletion_template.xlsx'

export const GENDER_OPTIONS: Gender[] = ['Male', 'Female', 'Other']
export const RELATIONSHIP_OPTIONS: Relationship[] = [
  'Self',
  'Spouse',
  'Child',
  'Parent',
  'Parent-in-law',
  'Sibling',
  'Other',
]
export const DEPENDANT_RELATIONSHIP_OPTIONS: Relationship[] = [
  'Spouse',
  'Child',
  'Parent',
  'Parent-in-law',
  'Sibling',
  'Other',
]
