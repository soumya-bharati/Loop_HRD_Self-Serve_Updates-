import {
  emptyDependantForm,
  emptyEmployeeForm,
  type DependantFormData,
  type EmployeeFormData,
  type Relationship,
} from '@/data/employees'
import type { AssignmentSource } from '@/domain/flex'

export type IntakeMode = 'form' | 'excel'

export interface AddEmployeeMember {
  id: string
  employee: EmployeeFormData
  dependants: DependantFormData[]
  /** Policy / benefit ids assigned to this employee. */
  selectedBenefitIds: string[]
  /** Plan resolved by company rules or selected in the assignment modal. */
  planId: string | null
  /** Chosen purchase-group option ids, keyed by group id. */
  purchaseGroupSelections: Record<string, string[]>
  assignmentSource: AssignmentSource | null
  /** True only after the assignment/dependant modal is explicitly saved. */
  assignmentCompleted: boolean
}

let memberSeq = 1
let depSeq = 1

export function nextMemberId() {
  return `member-${memberSeq++}`
}

export function nextDependantId() {
  return `dep-${depSeq++}`
}

export function emptyAddEmployeeMember(
  id: string = nextMemberId(),
): AddEmployeeMember {
  return {
    id,
    employee: emptyEmployeeForm(),
    dependants: [],
    selectedBenefitIds: [],
    planId: null,
    purchaseGroupSelections: {},
    assignmentSource: null,
    assignmentCompleted: false,
  }
}

export function isEmployeeValid(employee: EmployeeFormData) {
  return (
    Boolean(employee.employeeId.trim()) &&
    Boolean(employee.firstName.trim()) &&
    Boolean(employee.gender) &&
    Boolean(employee.dateOfBirth) &&
    Boolean(employee.dateOfJoining)
  )
}

export function isDependantValid(dependant: DependantFormData) {
  return (
    Boolean(dependant.firstName.trim()) &&
    Boolean(dependant.relationship) &&
    Boolean(dependant.dateOfBirth) &&
    Boolean(dependant.gender)
  )
}

export function areMembersValid(members: AddEmployeeMember[]) {
  if (members.length === 0) return false
  return members.every(
    (m) =>
      isEmployeeValid(m.employee) &&
      m.dependants.every(isDependantValid),
  )
}

export type FlatLife = {
  id: string
  memberId: string
  employeeId: string
  name: string
  relationship: Relationship | ''
  dateOfBirth: string
  gender: string
  email: string
  selectedBenefitIds: string[]
  kind: 'employee' | 'dependant'
}

export function flattenMembers(members: AddEmployeeMember[]): FlatLife[] {
  const lives: FlatLife[] = []
  for (const member of members) {
    const empName =
      `${member.employee.firstName} ${member.employee.lastName}`.trim() ||
      'Employee'
    lives.push({
      id: member.id,
      memberId: member.id,
      employeeId: member.employee.employeeId,
      name: empName,
      relationship: 'Self',
      dateOfBirth: member.employee.dateOfBirth,
      gender: member.employee.gender,
      email: member.employee.email,
      selectedBenefitIds: member.selectedBenefitIds,
      kind: 'employee',
    })
    for (const dep of member.dependants) {
      lives.push({
        id: dep.id,
        memberId: member.id,
        employeeId: member.employee.employeeId,
        name: `${dep.firstName} ${dep.lastName}`.trim() || 'Dependant',
        relationship: dep.relationship,
        dateOfBirth: dep.dateOfBirth,
        gender: dep.gender,
        email: dep.email,
        selectedBenefitIds: dep.selectedBenefitIds,
        kind: 'dependant',
      })
    }
  }
  return lives
}

/** Parse CSV text into AddEmployeeMember[] grouped by Employee ID. */
export function parseEmployeesCsv(text: string): {
  members: AddEmployeeMember[]
  error?: string
} {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length < 2) {
    return { members: [], error: 'Sheet has no data rows.' }
  }

  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase())
  const idx = (names: string[]) =>
    headers.findIndex((h) => names.some((n) => h === n || h.includes(n)))

  const employeeIdIdx = idx(['employee id', 'employeeid', 'emp id'])
  const firstNameIdx = idx(['first name', 'firstname'])
  const lastNameIdx = idx(['last name', 'lastname'])
  const genderIdx = idx(['gender'])
  const dobIdx = idx(['date of birth', 'dob', 'dateofbirth'])
  const dojIdx = idx(['date of joining', 'doj', 'dateofjoining'])
  const emailIdx = idx(['email', 'work email'])
  const mobileIdx = idx(['mobile', 'phone'])
  const relationshipIdx = idx(['relationship', 'relation'])
  const gradeIdx = idx(['grade'])

  if (employeeIdIdx < 0 || firstNameIdx < 0) {
    return {
      members: [],
      error:
        'Could not find Employee ID / First Name columns. Use the template or map required headers.',
    }
  }

  type Row = {
    employeeId: string
    firstName: string
    lastName: string
    gender: string
    dob: string
    doj: string
    email: string
    mobile: string
    relationship: string
    grade: string
  }

  const rows: Row[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i])
    const employeeId = (cols[employeeIdIdx] ?? '').trim()
    if (!employeeId) continue
    rows.push({
      employeeId,
      firstName: (cols[firstNameIdx] ?? '').trim(),
      lastName: lastNameIdx >= 0 ? (cols[lastNameIdx] ?? '').trim() : '',
      gender: genderIdx >= 0 ? (cols[genderIdx] ?? '').trim() : 'Male',
      dob: dobIdx >= 0 ? (cols[dobIdx] ?? '').trim() : '',
      doj: dojIdx >= 0 ? (cols[dojIdx] ?? '').trim() : '',
      email: emailIdx >= 0 ? (cols[emailIdx] ?? '').trim() : '',
      mobile: mobileIdx >= 0 ? (cols[mobileIdx] ?? '').trim() : '',
      relationship:
        relationshipIdx >= 0
          ? (cols[relationshipIdx] ?? 'Self').trim() || 'Self'
          : 'Self',
      grade: gradeIdx >= 0 ? (cols[gradeIdx] ?? '').trim() : '',
    })
  }

  if (rows.length === 0) {
    return { members: [], error: 'No valid rows found in the sheet.' }
  }

  const byEmp = new Map<string, Row[]>()
  for (const row of rows) {
    const list = byEmp.get(row.employeeId) ?? []
    list.push(row)
    byEmp.set(row.employeeId, list)
  }

  const members: AddEmployeeMember[] = []
  for (const [employeeId, group] of byEmp) {
    const self =
      group.find((r) => normalizeRelationship(r.relationship) === 'Self') ??
      group[0]
    const gender =
      self.gender === 'Female' || self.gender === 'Male'
        ? self.gender
        : ('Male' as const)
    const member = emptyAddEmployeeMember()
    member.employee = {
      ...emptyEmployeeForm(),
      employeeId,
      firstName: self.firstName,
      lastName: self.lastName,
      gender,
      dateOfBirth: self.dob,
      dateOfJoining: self.doj || self.dob,
      email: self.email,
      mobile: self.mobile,
      relationship: 'Self',
      customAttributes: self.grade ? { 'attr-grade': self.grade } : {},
    }
    for (const row of group) {
      const rel = normalizeRelationship(row.relationship)
      if (rel === 'Self') continue
      const depGender =
        row.gender === 'Female' || row.gender === 'Male' ? row.gender : 'Male'
      const dep = emptyDependantForm(nextDependantId())
      dep.firstName = row.firstName
      dep.lastName = row.lastName
      dep.gender = depGender
      dep.dateOfBirth = row.dob
      dep.relationship = rel
      dep.email = row.email
      dep.mobile = row.mobile
      member.dependants.push(dep)
    }
    members.push(member)
  }

  return { members }
}

function normalizeRelationship(value: string): Relationship {
  const v = value.trim().toLowerCase()
  if (v === 'self' || v === 'employee') return 'Self'
  if (v === 'spouse' || v === 'wife' || v === 'husband') return 'Spouse'
  if (v === 'child' || v === 'son' || v === 'daughter') return 'Child'
  if (v === 'parent' || v === 'father' || v === 'mother') return 'Parent'
  if (v.includes('parent-in-law') || v.includes('in-law')) return 'Parent-in-law'
  if (v === 'sibling') return 'Sibling'
  return 'Other'
}

function splitCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
      continue
    }
    current += ch
  }
  result.push(current)
  return result
}

export const ADD_EMPLOYEES_CSV_TEMPLATE =
  'Employee ID,First Name,Last Name,Gender,Date of Birth,Date of Joining,Email,Mobile,Relationship,Grade\n' +
  'EMP-20487,Rahul,Sharma,Male,15/03/1992,01/08/2024,rahul.sharma@symphonyeyc.com,9876543210,Self,L2\n' +
  'EMP-20487,Priya,Sharma,Female,20/06/1994,,priya.sharma@email.com,,Spouse,\n' +
  'EMP-20488,Neha,Verma,Female,10/01/1990,15/03/2023,neha.verma@symphonyeyc.com,9876501234,Self,L1\n'
