/** Shared pure date helpers for Flex domain rules. */

/** Parse DD/MM/YYYY or YYYY-MM-DD into age in whole years; null if unparseable. */
export function ageFromDateOfBirth(
  dateOfBirth: string,
  asOf: Date = new Date(),
): number | null {
  const parsed = parseDateOnly(dateOfBirth)
  if (!parsed) return null

  const { year, month, day } = parsed
  let age = asOf.getFullYear() - year
  const beforeBirthday =
    asOf.getMonth() < month - 1 ||
    (asOf.getMonth() === month - 1 && asOf.getDate() < day)
  if (beforeBirthday) age -= 1
  return age
}

export function parseDateOnly(
  value: string,
): { year: number; month: number; day: number } | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed)
  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)

  let day: number
  let month: number
  let year: number

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

  return { year, month, day }
}

export function daysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate())
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

/** True when `isoOrDmy` falls within the last `windowDays` days inclusive through asOf. */
export function isWithinLastDays(
  isoOrDmy: string,
  windowDays: number,
  asOf: Date = new Date(),
): boolean | null {
  const parsed = parseDateOnly(isoOrDmy)
  if (!parsed) return null
  const date = new Date(parsed.year, parsed.month - 1, parsed.day)
  const delta = daysBetween(date, asOf)
  return delta >= 0 && delta <= windowDays
}

export function isValidDateOfLeaving(
  isoDate: string,
  today: Date = new Date(),
  lookbackDays = 45,
): boolean {
  const parsed = parseDateOnly(isoDate)
  if (!parsed) return false
  const d = new Date(parsed.year, parsed.month - 1, parsed.day)
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const min = new Date(end)
  min.setDate(min.getDate() - lookbackDays)
  return d >= min && d <= end
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}
