import { ageFromDateOfBirth } from './dates'
import { getBenefitConfig } from './dealCatalog'
import { evaluateEmployeeEligibility } from './eligibility'
import type {
  CorrectableField,
  CorrectionBatch,
  FieldDiff,
  FlexDealConfig,
  LockedCorrectionField,
  MemberCorrection,
  MemberCorrectionDraft,
} from './types'

const FIELD_LABELS: Record<string, string> = {
  firstName: 'First name',
  lastName: 'Last name',
  dateOfBirth: 'Date of birth',
  gender: 'Gender',
  mobile: 'Mobile',
  email: 'Email',
  employeeId: 'Employee ID',
  relationship: 'Relationship',
}

const KYC_FIELDS: CorrectableField[] = ['firstName', 'lastName', 'dateOfBirth', 'gender']

const EDITABLE_FIELDS: CorrectableField[] = [
  'firstName',
  'lastName',
  'dateOfBirth',
  'gender',
  'mobile',
  'email',
]

export const LOCKED_CORRECTION_FIELDS: {
  field: LockedCorrectionField
  explanation: string
}[] = [
  {
    field: 'employeeId',
    explanation: 'Employee ID cannot be changed after the member is created.',
  },
  {
    field: 'relationship',
    explanation: 'Relationship cannot be changed through corrections.',
  },
  {
    field: 'dealAttributes',
    explanation:
      'Deal attributes cannot be changed through corrections. Use enrolment flows to update coverage-related data.',
  },
]

export function isEditableCorrectionField(field: string): field is CorrectableField {
  return (EDITABLE_FIELDS as string[]).includes(field)
}

/** Field-level diffs between original and updated member values. */
export function computeCorrectionDiffs(
  original: Record<string, string>,
  updated: Record<string, string>,
  fields: string[] = EDITABLE_FIELDS,
): FieldDiff[] {
  const diffs: FieldDiff[] = []
  for (const field of fields) {
    const from = (original[field] ?? '').trim()
    const to = (updated[field] ?? '').trim()
    if (from !== to) {
      diffs.push({
        field,
        label: FIELD_LABELS[field] ?? field,
        from,
        to,
      })
    }
  }
  return diffs
}

export function correctionRequiresKyc(diffs: FieldDiff[]): {
  requiresKyc: boolean
  kycTriggerFields: CorrectableField[]
} {
  const kycTriggerFields = diffs
    .map((d) => d.field)
    .filter((f): f is CorrectableField =>
      (KYC_FIELDS as string[]).includes(f),
    )
  return {
    requiresKyc: kycTriggerFields.length > 0,
    kycTriggerFields,
  }
}

/**
 * Validate a correction: reject if eligibility or payroll would change.
 * Does not modify benefit assignments.
 */
export function validateMemberCorrection(
  deal: FlexDealConfig,
  draft: MemberCorrectionDraft,
): MemberCorrection {
  const diffs = computeCorrectionDiffs(draft.original, draft.updated)
  const { requiresKyc, kycTriggerFields } = correctionRequiresKyc(diffs)

  if (diffs.length === 0) {
    return {
      memberId: draft.memberId,
      memberName: draft.memberName,
      relationship: draft.relationship,
      diffs,
      requiresKyc: false,
      kycTriggerFields: [],
      accepted: false,
      rejectionReason: 'No changes detected',
    }
  }

  const dobDiff = diffs.find((d) => d.field === 'dateOfBirth')
  const nextDob = draft.updated.dateOfBirth || draft.original.dateOfBirth

  // Re-evaluate eligibility with updated personal attributes.
  const eligibility = evaluateEmployeeEligibility(deal, {
    dateOfBirth: nextDob,
    department: draft.department,
    attributes: draft.attributes ?? {},
  })

  const affectedBenefitIds: string[] = []
  for (const benefitId of draft.benefitIds) {
    const status = eligibility.benefits[benefitId]
    if (status && !status.eligible) {
      affectedBenefitIds.push(benefitId)
    }

    // Dependant-age style checks for children/parents on DOB change.
    if (dobDiff && draft.relationship !== 'Self') {
      const age = ageFromDateOfBirth(nextDob)
      const benefit = getBenefitConfig(deal, benefitId)
      if (
        draft.relationship === 'Child' &&
        age !== null &&
        age > 25 &&
        benefit &&
        (benefit.category === 'gmc' || benefit.category === 'gpa')
      ) {
        affectedBenefitIds.push(benefitId)
      }
    }
  }

  const uniqueAffected = [...new Set(affectedBenefitIds)]
  if (uniqueAffected.length > 0) {
    const names = uniqueAffected
      .map((id) => getBenefitConfig(deal, id)?.name ?? id)
      .join(', ')
    return {
      memberId: draft.memberId,
      memberName: draft.memberName,
      relationship: draft.relationship,
      diffs,
      requiresKyc,
      kycTriggerFields,
      accepted: false,
      rejectionReason: `Updating these details would make this member ineligible for ${names}. Plan and benefit assignments cannot be changed through the correction flow.`,
      affectedBenefitIds: uniqueAffected,
    }
  }

  // Benefit assignments stay fixed; reject DOB changes that cross age-band payroll rules.
  if (dobDiff) {
    const beforeAge = ageFromDateOfBirth(draft.original.dateOfBirth)
    const afterAge = ageFromDateOfBirth(draft.updated.dateOfBirth)
    if (
      beforeAge !== null &&
      afterAge !== null &&
      ((beforeAge < 18 && afterAge >= 18) || (beforeAge >= 18 && afterAge < 18))
    ) {
      return {
        memberId: draft.memberId,
        memberName: draft.memberName,
        relationship: draft.relationship,
        diffs,
        requiresKyc,
        kycTriggerFields,
        accepted: false,
        rejectionReason:
          'Updating the date of birth would change payroll eligibility bands. Plan and benefit assignments cannot be changed through the correction flow.',
        affectedBenefitIds: draft.benefitIds,
      }
    }
  }

  return {
    memberId: draft.memberId,
    memberName: draft.memberName,
    relationship: draft.relationship,
    diffs,
    requiresKyc,
    kycTriggerFields,
    accepted: true,
  }
}

export function createCorrectionBatch(
  corrections: MemberCorrection[] = [],
): CorrectionBatch {
  return { corrections: corrections.filter((c) => c.accepted) }
}

export function addCorrectionToBatch(
  batch: CorrectionBatch,
  correction: MemberCorrection,
): CorrectionBatch {
  if (!correction.accepted) return batch
  const without = batch.corrections.filter(
    (c) => c.memberId !== correction.memberId,
  )
  return { corrections: [...without, correction] }
}

export function removeCorrectionFromBatch(
  batch: CorrectionBatch,
  memberId: string,
): CorrectionBatch {
  return {
    corrections: batch.corrections.filter((c) => c.memberId !== memberId),
  }
}

export function summarizeCorrectionBatch(batch: CorrectionBatch): {
  memberCount: number
  changeCount: number
  assignmentsUnchanged: true
} {
  return {
    memberCount: batch.corrections.length,
    changeCount: batch.corrections.reduce((n, c) => n + c.diffs.length, 0),
    assignmentsUnchanged: true,
  }
}
