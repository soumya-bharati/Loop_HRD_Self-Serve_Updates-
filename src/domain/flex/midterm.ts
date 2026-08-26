import { isWithinLastDays } from './dates'
import { getBenefitConfig } from './dealCatalog'
import type {
  CoverageStatus,
  FamilyRelationship,
  FlexBenefitConfig,
  FlexDealConfig,
  MidtermValidationInput,
  MidtermValidationResult,
} from './types'

const ACTIVE_MIDTERM_RELATIONSHIPS: FamilyRelationship[] = ['Spouse', 'Child']

function asFamilyRelationship(value: string): FamilyRelationship | null {
  const allowed: FamilyRelationship[] = [
    'Spouse',
    'Child',
    'Parent',
    'Parent-in-law',
    'Sibling',
    'Other',
  ]
  return (allowed as string[]).includes(value)
    ? (value as FamilyRelationship)
    : null
}

function rulesFor(
  benefit: FlexBenefitConfig,
  relationship: FamilyRelationship,
) {
  return benefit.midtermRules.filter((r) => r.relationship === relationship)
}

/**
 * Active coverage: only spouse/child midterm additions with evidence windows.
 * Draft coverage: other relationships may be allowed independently per benefit.
 */
export function validateMidtermAddition(
  deal: FlexDealConfig,
  benefitId: string,
  input: MidtermValidationInput,
): MidtermValidationResult {
  const benefit = getBenefitConfig(deal, benefitId)
  if (!benefit) {
    return {
      allowed: false,
      reasons: ['Unknown benefit'],
      requiresDocument: false,
    }
  }

  const relationship = asFamilyRelationship(String(input.relationship))
  if (!relationship) {
    return {
      allowed: false,
      reasons: ['Unsupported relationship'],
      requiresDocument: false,
    }
  }

  const slot = benefit.familyDefinition.find(
    (s) => s.relationship === relationship,
  )
  if (!slot) {
    return {
      allowed: false,
      reasons: [`${benefit.name} does not support ${relationship}`],
      requiresDocument: false,
    }
  }

  const status: CoverageStatus = input.coverageStatus
  const asOf = input.asOf ?? new Date()

  if (status === 'draft') {
    return {
      allowed: true,
      reasons: [],
      requiresDocument: false,
    }
  }

  if (!ACTIVE_MIDTERM_RELATIONSHIPS.includes(relationship)) {
    return {
      allowed: false,
      reasons: [
        `Active coverage only allows spouse or child midterm additions for ${benefit.name}`,
      ],
      requiresDocument: false,
    }
  }

  if (slot.midtermAllowedWhenActive === false) {
    return {
      allowed: false,
      reasons: [
        `${relationship} cannot be added midterm on active ${benefit.name}`,
      ],
      requiresDocument: false,
    }
  }

  const rules = rulesFor(benefit, relationship)
  if (rules.length === 0) {
    return {
      allowed: true,
      reasons: [],
      requiresDocument: false,
    }
  }

  const reasons: string[] = []
  let requiresDocument = false
  let documentLabel: string | undefined
  let evidenceField = rules[0]?.evidenceField
  let windowDays = rules[0]?.windowDays

  for (const rule of rules) {
    evidenceField = rule.evidenceField
    windowDays = rule.windowDays
    const value =
      rule.evidenceField === 'marriageDate'
        ? input.marriageDate
        : input.dateOfBirth

    if (!value?.trim()) {
      reasons.push(
        rule.evidenceField === 'marriageDate'
          ? 'Marriage date is required for midterm spouse addition'
          : 'Date of birth is required for midterm child addition',
      )
      continue
    }

    const within = isWithinLastDays(value, rule.windowDays, asOf)
    if (within === null) {
      reasons.push('Evidence date is invalid')
    } else if (!within) {
      reasons.push(
        relationship === 'Child'
          ? `This child cannot be added because the date of birth is more than ${rule.windowDays} days ago.`
          : `This spouse cannot be added because the marriage date is more than ${rule.windowDays} days ago.`,
      )
    }

    if (rule.requiresDocument) {
      requiresDocument = true
      documentLabel = rule.documentLabel ?? 'Supporting document'
    }
  }

  return {
    allowed: reasons.length === 0,
    reasons,
    requiresDocument,
    documentLabel,
    evidenceField,
    windowDays,
  }
}

/**
 * Evaluate midterm eligibility across multiple benefits independently.
 * A dependant may be eligible on draft Parent Cover but not on active GMC.
 */
export function evaluateMidtermAcrossBenefits(
  deal: FlexDealConfig,
  benefitIds: string[],
  input: Omit<MidtermValidationInput, 'coverageStatus'> & {
    coverages: { benefitId: string; status: CoverageStatus }[]
  },
): {
  results: Record<string, MidtermValidationResult>
  eligibleBenefitIds: string[]
} {
  const results: Record<string, MidtermValidationResult> = {}
  const eligibleBenefitIds: string[] = []

  for (const benefitId of benefitIds) {
    const coverageStatus =
      input.coverages.find((c) => c.benefitId === benefitId)?.status ?? 'draft'
    const result = validateMidtermAddition(deal, benefitId, {
      ...input,
      coverageStatus,
    })
    results[benefitId] = result
    if (result.allowed) eligibleBenefitIds.push(benefitId)
  }

  return { results, eligibleBenefitIds }
}

/** Convenience wrapper returning a list of per-benefit midterm results. */
export function validateMidtermAssignments(
  deal: FlexDealConfig,
  benefitIds: string[],
  coverageStatuses: Record<string, CoverageStatus>,
  input: Omit<MidtermValidationInput, 'coverageStatus'>,
) {
  return benefitIds.map((benefitId) => ({
    benefitId,
    result: validateMidtermAddition(deal, benefitId, {
      ...input,
      coverageStatus: coverageStatuses[benefitId] ?? 'draft',
    }),
  }))
}
