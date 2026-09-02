/**
 * Prototype/mock endorsement rules — not production insurance logic.
 * Sensitive identity and coverage fields require endorsement; contact-only
 * edits can be saved immediately.
 */
const SENSITIVE_FIELDS = new Set([
  'firstName',
  'lastName',
  'name',
  'dateOfBirth',
  'dob',
  'gender',
  'entity',
  'entityId',
  'deal',
  'dealId',
  'coverage',
  'selectedBenefitIds',
  'planId',
  'relationship',
])

export function requiresEndorsement(changedFields: string[]) {
  return changedFields.some((field) => SENSITIVE_FIELDS.has(field))
}
