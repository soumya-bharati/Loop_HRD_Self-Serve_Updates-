export type AutoCorrection = {
  from: string
  to: string
}

const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
}

const RELATIONSHIP_MAP: Record<string, string> = {
  self: 'Self',
  employee: 'Self',
  spouse: 'Spouse',
  husband: 'Spouse',
  wife: 'Spouse',
  partner: 'Spouse',
  child: 'Child',
  son: 'Child',
  daughter: 'Child',
  kid: 'Child',
  parent: 'Parent',
  father: 'Parent',
  mother: 'Parent',
  dad: 'Parent',
  mom: 'Parent',
  'father in law': 'Parent',
  'mother in law': 'Parent',
  'father-in-law': 'Parent',
  'mother-in-law': 'Parent',
}

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

function toLoopDate(day: number, month: number, year: number) {
  if (
    !Number.isFinite(day) ||
    !Number.isFinite(month) ||
    !Number.isFinite(year) ||
    day < 1 ||
    day > 31 ||
    month < 1 ||
    month > 12 ||
    year < 1900 ||
    year > 2100
  ) {
    return null
  }
  return `${pad2(day)}/${pad2(month)}/${year}`
}

/** Output Loop date as DD/MM/YYYY, or null if unparseable. */
export function normalizeDate(raw: string): string | null {
  const value = raw.trim()
  if (!value) return null

  const iso = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (iso) {
    return toLoopDate(Number(iso[3]), Number(iso[2]), Number(iso[1]))
  }

  const slashOrDash = value.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/)
  if (slashOrDash) {
    const first = Number(slashOrDash[1])
    const second = Number(slashOrDash[2])
    const year = Number(slashOrDash[3])
    // Prefer DD/MM when first > 12; otherwise treat as already Loop-friendly DD/MM
    // unless second > 12 (then first must be month → MM/DD).
    if (second > 12 && first <= 12) {
      return toLoopDate(second, first, year)
    }
    return toLoopDate(first, second, year)
  }

  const named = value.match(
    /^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$|^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/,
  )
  if (named) {
    if (named[1] && named[2] && named[3]) {
      const month = MONTHS[named[1].toLowerCase()]
      if (!month) return null
      return toLoopDate(Number(named[2]), month, Number(named[3]))
    }
    if (named[4] && named[5] && named[6]) {
      const month = MONTHS[named[5].toLowerCase()]
      if (!month) return null
      return toLoopDate(Number(named[4]), month, Number(named[6]))
    }
  }

  return null
}

/** CTC → plain number string (e.g. 8L → 800000). */
export function normalizeCtc(raw: string): string | null {
  const value = raw.trim()
  if (!value) return null

  const cleaned = value.replace(/[₹Rs.\s,]/gi, '')
  const lakh = cleaned.match(/^(\d+(?:\.\d+)?)[Ll](?:akh)?s?$/i)
  if (lakh) {
    const amount = Math.round(Number(lakh[1]) * 100_000)
    return Number.isFinite(amount) ? String(amount) : null
  }

  const crore = cleaned.match(/^(\d+(?:\.\d+)?)[Cc]r(?:ore)?s?$/i)
  if (crore) {
    const amount = Math.round(Number(crore[1]) * 10_000_000)
    return Number.isFinite(amount) ? String(amount) : null
  }

  const digits = cleaned.replace(/[^\d.]/g, '')
  if (!digits) return null
  const amount = Math.round(Number(digits))
  return Number.isFinite(amount) && amount > 0 ? String(amount) : null
}

/** Mobile → last 10 digits only. */
export function normalizeMobile(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return null
  if (digits.length >= 10) return digits.slice(-10)
  return null
}

/** Relationship synonyms → Self | Spouse | Child | Parent. */
export function normalizeRelationship(raw: string): string | null {
  const key = raw.trim().toLowerCase().replace(/\s+/g, ' ')
  if (!key) return null
  return RELATIONSHIP_MAP[key] ?? null
}

function normalizeForField(loopField: string, sample: string): string | null {
  switch (loopField) {
    case 'Date of Joining':
    case 'Date of Birth':
      return normalizeDate(sample)
    case 'CTC':
      return normalizeCtc(sample)
    case 'Mobile':
      return normalizeMobile(sample)
    case 'Relationship':
      return normalizeRelationship(sample)
    default:
      return null
  }
}

/**
 * Returns a correction when the extracted sample isn’t already in Loop’s
 * exact format and we can confidently normalize it.
 */
export function autoCorrectionFor(
  loopField: string,
  sample: string | null | undefined,
): AutoCorrection | null {
  if (!sample?.trim()) return null
  const from = sample.trim()
  const to = normalizeForField(loopField, from)
  if (!to || to === from) return null
  return { from, to }
}
