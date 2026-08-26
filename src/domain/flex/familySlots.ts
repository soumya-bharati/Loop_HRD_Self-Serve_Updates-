import { getBenefitConfig } from './dealCatalog'
import type {
  CoverageStatus,
  DependantSlotBreakdown,
  DependantSlotResult,
  ExistingDependantRef,
  FamilyRelationship,
  FamilySlotSummary,
  FlexDealConfig,
  MemberCoverageRef,
} from './types'

const FAMILY_ORDER: FamilyRelationship[] = [
  'Spouse',
  'Child',
  'Parent',
  'Parent-in-law',
  'Sibling',
  'Other',
]

function asFamilyRelationship(value: string): FamilyRelationship | null {
  return (FAMILY_ORDER as string[]).includes(value)
    ? (value as FamilyRelationship)
    : null
}

function coverageForBenefit(
  benefitId: string,
  coverages: MemberCoverageRef[] | undefined,
): CoverageStatus {
  return coverages?.find((c) => c.benefitId === benefitId)?.status ?? 'draft'
}

export interface ComputeFamilySlotsInput {
  deal: FlexDealConfig
  /** Final selected benefit ids for the employee. */
  selectedBenefitIds: string[]
  existingDependants?: ExistingDependantRef[]
  /** Per-benefit active/draft status; defaults to draft when omitted. */
  coverages?: MemberCoverageRef[]
}

interface RelationshipAccumulator {
  maxSlots: number
  usedSlots: number
  availableBenefitIds: string[]
  supportingBenefitIds: string[]
  perBenefit: DependantSlotBreakdown[]
  midtermFlags: boolean[]
}

/**
 * Per-relationship family slots derived from selected benefits' family definitions,
 * accounting for existing dependants and active midterm restrictions.
 */
export function computeFamilySlots(
  input: ComputeFamilySlotsInput,
): FamilySlotSummary {
  const {
    deal,
    selectedBenefitIds,
    existingDependants = [],
    coverages,
  } = input

  const byRelationship = new Map<FamilyRelationship, RelationshipAccumulator>()

  for (const benefitId of selectedBenefitIds) {
    const benefit = getBenefitConfig(deal, benefitId)
    if (!benefit) continue
    const status = coverageForBenefit(benefitId, coverages)

    for (const slot of benefit.familyDefinition) {
      const usedOnBenefit = existingDependants.filter((d) => {
        if (d.relationship !== slot.relationship) return false
        if (!d.benefitIds || d.benefitIds.length === 0) return true
        return d.benefitIds.includes(benefitId)
      }).length

      const remaining = Math.max(0, slot.maxCount - usedOnBenefit)
      const midtermRestricted =
        status === 'active' && slot.midtermAllowedWhenActive !== true
      const effectiveRemaining = midtermRestricted ? 0 : remaining

      const breakdown: DependantSlotBreakdown = {
        benefitId,
        benefitName: benefit.name,
        coverageStatus: status,
        maxCount: slot.maxCount,
        usedCount: usedOnBenefit,
        remainingCount: effectiveRemaining,
        midtermRestricted,
      }

      const current = byRelationship.get(slot.relationship) ?? {
        maxSlots: 0,
        usedSlots: 0,
        availableBenefitIds: [],
        supportingBenefitIds: [],
        perBenefit: [],
        midtermFlags: [],
      }

      current.maxSlots = Math.max(current.maxSlots, slot.maxCount)
      current.supportingBenefitIds.push(benefitId)
      current.perBenefit.push(breakdown)
      current.midtermFlags.push(midtermRestricted)
      if (effectiveRemaining > 0) {
        current.availableBenefitIds.push(benefitId)
      }
      byRelationship.set(slot.relationship, current)
    }
  }

  const slots: DependantSlotResult[] = FAMILY_ORDER.flatMap((relationship) => {
    const bucket = byRelationship.get(relationship)
    if (!bucket) return []

    const usedSlots = existingDependants.filter(
      (d) => d.relationship === relationship,
    ).length

    const positiveRemainders = bucket.perBenefit
      .filter((b) => b.remainingCount > 0)
      .map((b) => b.remainingCount)
    const remainingSlots =
      positiveRemainders.length > 0 ? Math.max(...positiveRemainders) : 0

    const midtermOnly =
      bucket.midtermFlags.length > 0 && bucket.midtermFlags.every(Boolean)

    return [
      {
        relationship,
        maxSlots: bucket.maxSlots,
        usedSlots,
        remainingSlots,
        availableBenefitIds: [...new Set(bucket.availableBenefitIds)],
        supportingBenefitIds: [...new Set(bucket.supportingBenefitIds)],
        perBenefit: bucket.perBenefit,
        midtermOnly,
      },
    ]
  })

  const addableRelationships = slots
    .filter((s) => s.remainingSlots > 0)
    .map((s) => s.relationship)

  const allSlotsConsumed =
    selectedBenefitIds.length > 0 &&
    slots.length > 0 &&
    addableRelationships.length === 0

  return {
    dealId: deal.id,
    slots,
    addableRelationships,
    allSlotsConsumed,
    emptyReason: allSlotsConsumed
      ? 'This employee has already used all dependant slots available across their plans and benefits.'
      : undefined,
  }
}

/** Benefits a dependant relationship can still join given slot capacity. */
export function availableBenefitsForRelationship(
  summary: FamilySlotSummary,
  relationship: FamilyRelationship | string,
): string[] {
  const rel = asFamilyRelationship(relationship)
  if (!rel) return []
  return (
    summary.slots.find((s) => s.relationship === rel)?.availableBenefitIds ?? []
  )
}
