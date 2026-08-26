import type {
  AttributeDefinition,
  AttributeEntity,
  FlexDealConfig,
  ResolvedAttributeField,
} from './types'
import { getBenefitConfig } from './dealCatalog'

export interface ResolveAttributesInput {
  deal: FlexDealConfig
  entity: AttributeEntity
  /** Selected benefit ids that contribute dependant / benefit attributes. */
  selectedBenefitIds?: string[]
  /** Previously entered values — preserved even when a field is temporarily hidden. */
  existingValues?: Record<string, string>
  /** When true, include employee-input fields for HR preview; default false for HR forms. */
  includeEmployeeInput?: boolean
  relationship?: string
}

/**
 * Merge common deal-level and benefit-required attributes without duplicates.
 * Hidden fields keep their values in `preservedValues` for session restore.
 */
export function resolveAttributeFields(
  input: ResolveAttributesInput,
): {
  fields: ResolvedAttributeField[]
  preservedValues: Record<string, string>
} {
  const {
    deal,
    entity,
    selectedBenefitIds = [],
    existingValues = {},
    includeEmployeeInput = false,
    relationship,
  } = input

  const byId = new Map<string, AttributeDefinition>()

  if (entity === 'employee') {
    for (const attr of deal.employeeAttributes) {
      if (attr.entity !== 'employee') continue
      if (attr.inputBy === 'employee' && !includeEmployeeInput) continue
      byId.set(attr.id, { ...attr, requiredByBenefitIds: [] })
    }
  }

  if (entity === 'dependant') {
    for (const benefitId of selectedBenefitIds) {
      const benefit = getBenefitConfig(deal, benefitId)
      if (!benefit) continue
      for (const attr of benefit.dependantAttributes) {
        if (
          attr.relationships?.length &&
          (!relationship ||
            !attr.relationships.some((item) => item === relationship))
        ) {
          continue
        }
        const existing = byId.get(attr.id)
        if (existing) {
          const requiredBy = new Set([
            ...(existing.requiredByBenefitIds ?? []),
            benefitId,
          ])
          byId.set(attr.id, {
            ...existing,
            required: existing.required || attr.required,
            requiredByBenefitIds: [...requiredBy],
          })
        } else {
          byId.set(attr.id, {
            ...attr,
            requiredByBenefitIds: [benefitId],
          })
        }
      }
    }
  }

  const fields: ResolvedAttributeField[] = [...byId.values()].map((definition) => {
    const benefitIds = definition.requiredByBenefitIds ?? []
    const labels = benefitIds
      .map((id) => getBenefitConfig(deal, id)?.name)
      .filter((name): name is string => Boolean(name))

    return {
      definition,
      requiredForLabel:
        labels.length > 0 ? `Required for ${labels.join(' + ')}` : undefined,
      visible: true,
    }
  })

  const visibleIds = new Set(fields.map((f) => f.definition.id))
  const preservedValues: Record<string, string> = { ...existingValues }
  for (const [key, value] of Object.entries(existingValues)) {
    if (!visibleIds.has(key) && value !== undefined) {
      preservedValues[key] = value
    }
  }

  return { fields, preservedValues }
}

/** Validate required visible attributes; returns field id → error message. */
export function validateAttributeValues(
  fields: ResolvedAttributeField[],
  values: Record<string, string>,
): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const field of fields) {
    if (!field.visible || !field.definition.required) continue
    const raw = values[field.definition.id]?.trim() ?? ''
    if (!raw) {
      errors[field.definition.id] = `${field.definition.label} is required`
      continue
    }
    const allowed = field.definition.allowedValues
    if (allowed && allowed.length > 0 && !allowed.includes(raw)) {
      errors[field.definition.id] =
        `${field.definition.label} must be one of: ${allowed.join(', ')}`
    }
  }
  return errors
}

/** Merge stored values with current form, keeping hidden keys. */
export function mergeAttributeValues(
  preserved: Record<string, string>,
  nextVisible: Record<string, string>,
): Record<string, string> {
  return { ...preserved, ...nextVisible }
}
