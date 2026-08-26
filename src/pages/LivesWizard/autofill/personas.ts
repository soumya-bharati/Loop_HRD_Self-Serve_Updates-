import type { Gender, Relationship } from '@/data/employees'
import type { AttributeDefinition } from '@/domain/flex'

export interface DemoFamilyMember {
  relationship: Relationship
  firstName: string
  lastName: string
  gender: Gender
  dateOfBirth: string
}

export interface DemoPersona {
  id: string
  label: string
  employeeId: string
  firstName: string
  lastName: string
  gender: Gender
  dateOfBirth: string
  dateOfJoining: string
  email: string
  mobile: string
  department: string
  city: string
  family: DemoFamilyMember[]
}

/** Dates are ISO (YYYY-MM-DD); use toDisplayDate for DD/MM/YYYY text inputs. */
export const demoPersonas: DemoPersona[] = [
  {
    id: 'persona-rahul',
    label: 'Rahul Sharma · Engineering',
    employeeId: 'EMP-40121',
    firstName: 'Rahul',
    lastName: 'Sharma',
    gender: 'Male',
    dateOfBirth: '1992-03-14',
    dateOfJoining: '2024-08-01',
    email: 'rahul.sharma@symphonyeyc.com',
    mobile: '9876543210',
    department: 'Engineering',
    city: 'Bangalore',
    family: [
      {
        relationship: 'Spouse',
        firstName: 'Anita',
        lastName: 'Sharma',
        gender: 'Female',
        dateOfBirth: '1994-01-20',
      },
      {
        relationship: 'Child',
        firstName: 'Aarav',
        lastName: 'Sharma',
        gender: 'Male',
        dateOfBirth: '2018-05-12',
      },
      {
        relationship: 'Child',
        firstName: 'Ira',
        lastName: 'Sharma',
        gender: 'Female',
        dateOfBirth: '2021-09-30',
      },
      {
        relationship: 'Parent',
        firstName: 'Suresh',
        lastName: 'Sharma',
        gender: 'Male',
        dateOfBirth: '1965-07-08',
      },
      {
        relationship: 'Parent-in-law',
        firstName: 'Kamala',
        lastName: 'Iyer',
        gender: 'Female',
        dateOfBirth: '1963-02-17',
      },
    ],
  },
  {
    id: 'persona-priya',
    label: 'Priya Nair · HR',
    employeeId: 'EMP-40244',
    firstName: 'Priya',
    lastName: 'Nair',
    gender: 'Female',
    dateOfBirth: '1990-08-22',
    dateOfJoining: '2023-02-15',
    email: 'priya.nair@symphonyeyc.com',
    mobile: '9811112233',
    department: 'HR',
    city: 'Mumbai',
    family: [
      {
        relationship: 'Spouse',
        firstName: 'Manoj',
        lastName: 'Nair',
        gender: 'Male',
        dateOfBirth: '1988-06-11',
      },
      {
        relationship: 'Child',
        firstName: 'Kavya',
        lastName: 'Nair',
        gender: 'Female',
        dateOfBirth: '2016-11-03',
      },
      {
        relationship: 'Parent',
        firstName: 'Latha',
        lastName: 'Nair',
        gender: 'Female',
        dateOfBirth: '1961-12-05',
      },
    ],
  },
  {
    id: 'persona-ajit',
    label: 'Ajit Jain · Operations',
    employeeId: 'EMP-40318',
    firstName: 'Ajit',
    lastName: 'Jain',
    gender: 'Male',
    dateOfBirth: '1995-06-14',
    dateOfJoining: '2025-01-10',
    email: 'ajit.jain@symphonyeyc.com',
    mobile: '9822223344',
    department: 'Operations',
    city: 'Hyderabad',
    family: [
      {
        relationship: 'Spouse',
        firstName: 'Meera',
        lastName: 'Jain',
        gender: 'Female',
        dateOfBirth: '1996-09-02',
      },
      {
        relationship: 'Child',
        firstName: 'Vivaan',
        lastName: 'Jain',
        gender: 'Male',
        dateOfBirth: '2023-07-19',
      },
      {
        relationship: 'Parent',
        firstName: 'Rekha',
        lastName: 'Jain',
        gender: 'Female',
        dateOfBirth: '1968-03-21',
      },
    ],
  },
  {
    id: 'persona-neha',
    label: 'Neha Kapoor · Finance',
    employeeId: 'EMP-40427',
    firstName: 'Neha',
    lastName: 'Kapoor',
    gender: 'Female',
    dateOfBirth: '1988-11-05',
    dateOfJoining: '2022-08-20',
    email: 'neha.kapoor@symphonyeyc.com',
    mobile: '9833334455',
    department: 'Finance',
    city: 'Delhi',
    family: [
      {
        relationship: 'Spouse',
        firstName: 'Rohan',
        lastName: 'Kapoor',
        gender: 'Male',
        dateOfBirth: '1986-04-18',
      },
      {
        relationship: 'Child',
        firstName: 'Ishaan',
        lastName: 'Kapoor',
        gender: 'Male',
        dateOfBirth: '2014-02-09',
      },
      {
        relationship: 'Parent',
        firstName: 'Vimla',
        lastName: 'Kapoor',
        gender: 'Female',
        dateOfBirth: '1959-10-14',
      },
    ],
  },
  {
    id: 'persona-farah',
    label: 'Farah Khan · Marketing',
    employeeId: 'EMP-40530',
    firstName: 'Farah',
    lastName: 'Khan',
    gender: 'Female',
    dateOfBirth: '1993-03-28',
    dateOfJoining: '2024-09-18',
    email: 'farah.khan@symphonyeyc.com',
    mobile: '9844400022',
    department: 'Marketing',
    city: 'Hyderabad',
    family: [
      {
        relationship: 'Spouse',
        firstName: 'Imran',
        lastName: 'Khan',
        gender: 'Male',
        dateOfBirth: '1991-05-09',
      },
      {
        relationship: 'Child',
        firstName: 'Zoya',
        lastName: 'Khan',
        gender: 'Female',
        dateOfBirth: '2023-01-16',
      },
      {
        relationship: 'Parent',
        firstName: 'Nasreen',
        lastName: 'Khan',
        gender: 'Female',
        dateOfBirth: '1964-08-30',
      },
    ],
  },
]

export function personaAt(index: number): DemoPersona {
  const size = demoPersonas.length
  return demoPersonas[((index % size) + size) % size]
}

export function randomPersonaIndex() {
  return Math.floor(Math.random() * demoPersonas.length)
}

/** ISO date → DD/MM/YYYY for the free-text date inputs used in the add flows. */
export function toDisplayDate(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return iso
  const [, year, month, day] = match
  return `${day}/${month}/${year}`
}

export function todayIso() {
  return isoDaysAgo(0)
}

export function isoDaysAgo(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/**
 * Midterm additions must fall inside the deal's evidence window, so life
 * events (marriage, newborn) are generated relative to today.
 */
export const RECENT_LIFE_EVENT_DAYS = 12

/**
 * Pick a plausible value for a deal-configured attribute: prefer a persona
 * trait that the attribute accepts, otherwise fall back to a stable option.
 */
export function attributeValueFor(
  definition: AttributeDefinition,
  persona: DemoPersona,
  index: number,
) {
  const allowed = definition.allowedValues
  if (allowed && allowed.length > 0) {
    const preferred = [persona.department, persona.city].find((trait) =>
      allowed.includes(trait),
    )
    return preferred ?? allowed[index % allowed.length]
  }
  const id = definition.id.toLowerCase()
  if (id.includes('marriage')) return isoDaysAgo(RECENT_LIFE_EVENT_DAYS)
  if (id.includes('date')) return persona.dateOfJoining
  if (id.includes('hospital')) return `Apollo Hospital, ${persona.city}`
  if (id.includes('email')) return persona.email
  if (id.includes('mobile') || id.includes('phone')) return persona.mobile
  return persona.city
}
