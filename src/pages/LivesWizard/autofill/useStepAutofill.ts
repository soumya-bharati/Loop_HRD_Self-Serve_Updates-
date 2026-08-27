import { useMemo } from 'react'

import {
  emptyDependantForm,
  sampleEmployees,
  type DependantFormData,
} from '@/data/employees'
import { defaultDependantBenefitIds } from '@/data/flexDeal'
import {
  availableBenefitsForRelationship,
  computeFamilySlots,
  listActiveDeals,
  resolveAttributeFields,
  type FamilySlotSummary,
  type FlexDealConfig,
} from '@/domain/flex'
import { nextDependantId } from '@/pages/LivesWizard/addEmployees'
import {
  attributeValueFor,
  isoDaysAgo,
  personaAt,
  toDisplayDate,
  todayIso,
  RECENT_LIFE_EVENT_DAYS,
  type DemoFamilyMember,
  type DemoPersona,
} from '@/pages/LivesWizard/autofill/personas'
import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'

export interface StepAutofill {
  /** Human label for the step the widget is currently pointed at. */
  stepLabel: string
  /** What a fill will do, or why nothing can be filled. */
  hint: string
  supported: boolean
  /** Fills the step and returns a short result message. */
  run: (personaIndex: number) => string
}

type DateStyle = 'iso' | 'display'

function formatDate(iso: string, style: DateStyle) {
  return style === 'iso' ? iso : toDisplayDate(iso)
}

function fillEmployeeAttributes(
  deal: FlexDealConfig,
  persona: DemoPersona,
  personaIndex: number,
) {
  const values: Record<string, string> = {}
  const { fields } = resolveAttributeFields({ deal, entity: 'employee' })
  for (const field of fields) {
    if (!field.visible) continue
    values[field.definition.id] = attributeValueFor(
      field.definition,
      persona,
      personaIndex,
    )
  }
  return values
}

function fillDependantAttributes(
  deal: FlexDealConfig,
  dependant: DependantFormData,
  persona: DemoPersona,
  personaIndex: number,
) {
  const values: Record<string, string> = { ...dependant.customAttributes }
  const { fields } = resolveAttributeFields({
    deal,
    entity: 'dependant',
    relationship: dependant.relationship,
    selectedBenefitIds: dependant.selectedBenefitIds,
    existingValues: dependant.customAttributes,
  })
  for (const field of fields) {
    if (!field.visible) continue
    values[field.definition.id] = attributeValueFor(
      field.definition,
      persona,
      personaIndex,
    )
  }
  return values
}

/**
 * Hands out persona family members while respecting the remaining family slots
 * of the deal, so autofilled dependants never exceed configured capacity.
 */
function createFamilyPool(persona: DemoPersona, summary: FamilySlotSummary) {
  const pool = [...persona.family]
  const capacity = new Map<string, number>(
    summary.slots.map((slot) => [slot.relationship, slot.remainingSlots]),
  )

  return function claim(preferred?: string): DemoFamilyMember | null {
    const index = pool.findIndex(
      (candidate) =>
        (!preferred || candidate.relationship === preferred) &&
        (capacity.get(candidate.relationship) ?? 0) > 0,
    )
    if (index < 0) return null
    const [claimed] = pool.splice(index, 1)
    capacity.set(
      claimed.relationship,
      (capacity.get(claimed.relationship) ?? 1) - 1,
    )
    return claimed
  }
}

function pluralise(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}

export function useStepAutofill(): StepAutofill {
  const wizard = useLivesWizard()

  return useMemo<StepAutofill>(() => {
    const {
      action,
      method,
      step,
      activeDeal,
      selectDeal,
      addEmployees,
      setAddEmployees,
      editingAddEmployeeIds,
      intakeMode,
      setFileName,
      setTemplateDownloaded,
      setDeleteConfirmed,
      employee,
      setEmployee,
      updateEmployee,
      dependants,
      setDependants,
      setAddDependants,
      resolvedAssignment,
      selectedEmployeeId,
      setSelectedEmployeeId,
      setSelectedDependantId,
      setDateOfLeaving,
      setMidtermProofUploaded,
      setEditProofFileName,
      enrolment,
      setEnrolment,
      signalAutofill,
    } = wizard

    const unsupported = (stepLabel: string, hint: string): StepAutofill => ({
      stepLabel,
      hint,
      supported: false,
      run: () => hint,
    })

    /** Deal-driven steps need a deal before attribute fields can be resolved. */
    const ensureDeal = () => {
      if (activeDeal) return activeDeal
      const fallback = listActiveDeals()[0]
      if (fallback) selectDeal(fallback.id)
      return null
    }

    switch (step) {
      case 'user-details': {
        /**
         * Saved cards collapse into a read-only summary, so autofill only
         * touches the ones whose form is actually on screen.
         */
        const editing = new Set(editingAddEmployeeIds)
        const isOpen = (member: (typeof addEmployees)[number]) =>
          !member.assignmentCompleted || editing.has(member.id)
        const openCount = addEmployees.filter(isOpen).length

        return {
          stepLabel: 'Employee details',
          hint: openCount
            ? `Fills ${pluralise(openCount, 'open employee card')} with demo data, including deal attributes.`
            : 'Every employee card is saved — add or edit one to fill it.',
          supported: openCount > 0 || intakeMode === 'excel',
          run: (personaIndex) => {
            const deal = ensureDeal()
            if (!deal) {
              return 'Picked a Flex deal — press Autofill again to complete the form.'
            }
            let offset = 0
            const next = addEmployees.map((member) => {
              if (!isOpen(member)) return member
              const index = personaIndex + offset
              offset += 1
              const persona = personaAt(index)
              return {
                ...member,
                planId: null,
                assignmentSource: null,
                assignmentCompleted: false,
                selectedBenefitIds: [],
                dependants: [],
                employee: {
                  ...member.employee,
                  employeeId: persona.employeeId,
                  firstName: persona.firstName,
                  lastName: persona.lastName,
                  gender: persona.gender,
                  dateOfBirth: toDisplayDate(persona.dateOfBirth),
                  dateOfJoining: toDisplayDate(persona.dateOfJoining),
                  relationship: 'Self' as const,
                  email: persona.email,
                  mobile: persona.mobile,
                  customAttributes: fillEmployeeAttributes(
                    deal,
                    persona,
                    index,
                  ),
                },
              }
            })
            if (intakeMode === 'excel') {
              setAddEmployees(next)
              setTemplateDownloaded(true)
              setFileName('demo-employees.csv')
              signalAutofill()
              return 'Attached a demo employee sheet.'
            }
            if (offset === 0) {
              return 'Every employee card is saved — add or edit one to fill it.'
            }
            setAddEmployees(next)
            signalAutofill()
            return `Filled ${pluralise(offset, 'employee')}.`
          },
        }
      }

      case 'employee-details':
        return {
          stepLabel: 'Employee details',
          hint: 'Fills the employee form with demo data.',
          supported: true,
          run: (personaIndex) => {
            const persona = personaAt(personaIndex)
            const deal = activeDeal
            setEmployee({
              ...employee,
              employeeId: persona.employeeId,
              firstName: persona.firstName,
              lastName: persona.lastName,
              gender: persona.gender,
              dateOfBirth: toDisplayDate(persona.dateOfBirth),
              dateOfJoining: toDisplayDate(persona.dateOfJoining),
              relationship: 'Self',
              email: persona.email,
              mobile: persona.mobile,
              customAttributes: deal
                ? fillEmployeeAttributes(deal, persona, personaIndex)
                : employee.customAttributes,
            })
            signalAutofill()
            return `Filled details for ${persona.firstName} ${persona.lastName}.`
          },
        }

      case 'family':
        return {
          stepLabel: 'Dependants',
          hint: 'Fills dependant cards with a demo family, within the available slots.',
          supported: true,
          run: (personaIndex) => {
            const deal = ensureDeal()
            if (!deal) {
              return 'Picked a Flex deal — press Fill again to complete the form.'
            }
            let filled = 0
            let added = 0
            const next = addEmployees.map((member, offset) => {
              const index = personaIndex + offset
              const persona = personaAt(index)
              const summary = computeFamilySlots({
                deal,
                selectedBenefitIds: member.selectedBenefitIds,
                existingDependants: [],
              })
              const claim = createFamilyPool(persona, summary)

              const applyDemoDependant = (
                dependant: DependantFormData,
                source: DemoFamilyMember,
              ): DependantFormData => {
                const withRelationship: DependantFormData = {
                  ...dependant,
                  relationship: source.relationship,
                  firstName: source.firstName,
                  lastName: source.lastName,
                  gender: source.gender,
                  dateOfBirth: source.dateOfBirth,
                  selectedBenefitIds: availableBenefitsForRelationship(
                    summary,
                    source.relationship,
                  ),
                }
                return {
                  ...withRelationship,
                  customAttributes: fillDependantAttributes(
                    deal,
                    withRelationship,
                    persona,
                    index,
                  ),
                }
              }

              const existing = member.dependants.map((dependant) => {
                const source =
                  claim(dependant.relationship || undefined) ?? claim()
                if (!source) return dependant
                filled += 1
                return applyDemoDependant(dependant, source)
              })

              if (existing.length > 0) {
                return { ...member, dependants: existing }
              }

              const seeded: DependantFormData[] = []
              for (const relationship of ['Spouse', 'Child'] as const) {
                const source = claim(relationship)
                if (!source) continue
                seeded.push(
                  applyDemoDependant(
                    emptyDependantForm(nextDependantId()),
                    source,
                  ),
                )
                added += 1
              }
              return { ...member, dependants: seeded }
            })
            setAddEmployees(next)
            signalAutofill()
            if (filled === 0 && added === 0) {
              return 'No dependant slots available for the selected benefits.'
            }
            return added > 0
              ? `Added ${pluralise(added, 'dependant')} with demo details.`
              : `Filled ${pluralise(filled, 'dependant')}.`
          },
        }

      case 'dependant-details': {
        /** Adding to an employee who already has coverage: midterm rules apply. */
        const isMidtermAddition =
          method === 'single-dependant' && action === 'add'

        if (isMidtermAddition) {
          return {
            stepLabel: 'Dependant details',
            hint: 'Fills a dependant that fits the free family slots and midterm window.',
            supported: true,
            run: (personaIndex) => {
              const deal = activeDeal
              const record = sampleEmployees.find(
                (item) => item.id === selectedEmployeeId,
              )
              const target = dependants[0]
              if (!deal || !record || !target) {
                return 'Pick an employee first.'
              }
              const persona = personaAt(personaIndex)
              const covered = record.coverages.filter(
                (coverage) => coverage.kind === 'benefit',
              )
              const summary = computeFamilySlots({
                deal,
                selectedBenefitIds: covered.map((coverage) => coverage.id),
                existingDependants: record.dependants.map((item) => ({
                  id: item.id,
                  relationship: item.relationship,
                  dateOfBirth: item.dateOfBirth,
                  benefitIds: item.benefitIds,
                })),
                coverages: covered.map((coverage) => ({
                  benefitId: coverage.id,
                  status: coverage.status ?? 'active',
                })),
              })
              const source = createFamilyPool(persona, summary)()
              if (!source) {
                return 'This employee has no free family slots left.'
              }
              const filled: DependantFormData = {
                ...target,
                relationship: source.relationship,
                firstName: source.firstName,
                lastName: source.lastName,
                gender: source.gender,
                // Midterm additions must sit inside the evidence window.
                dateOfBirth:
                  source.relationship === 'Child'
                    ? isoDaysAgo(RECENT_LIFE_EVENT_DAYS)
                    : source.dateOfBirth,
                selectedBenefitIds: availableBenefitsForRelationship(
                  summary,
                  source.relationship,
                ),
                supportingDocumentName: 'demo-supporting-document.pdf',
              }
              setDependants([
                {
                  ...filled,
                  customAttributes: fillDependantAttributes(
                    deal,
                    filled,
                    persona,
                    personaIndex,
                  ),
                },
              ])
              signalAutofill()
              return `Filled ${source.relationship.toLowerCase()} details for ${source.firstName}.`
            },
          }
        }

        return {
          stepLabel: 'Dependant details',
          hint: dependants.length
            ? `Fills ${pluralise(dependants.length, 'dependant card')} with demo data.`
            : 'Answers the dependant question and adds a demo spouse.',
          supported: true,
          run: (personaIndex) => {
            const persona = personaAt(personaIndex)
            const deal = activeDeal
            const dateStyle: DateStyle = 'display'
            const withAttributes = (dependant: DependantFormData) =>
              deal
                ? {
                    ...dependant,
                    customAttributes: fillDependantAttributes(
                      deal,
                      dependant,
                      persona,
                      personaIndex,
                    ),
                  }
                : dependant

            if (dependants.length === 0) {
              const source = persona.family[0]
              const seeded: DependantFormData = {
                ...emptyDependantForm(nextDependantId()),
                relationship: source.relationship,
                firstName: source.firstName,
                lastName: source.lastName,
                gender: source.gender,
                dateOfBirth: formatDate(source.dateOfBirth, dateStyle),
                selectedBenefitIds: defaultDependantBenefitIds(
                  source.relationship,
                  source.dateOfBirth,
                  resolvedAssignment,
                ),
              }
              setAddDependants(true)
              setDependants([withAttributes(seeded)])
              signalAutofill()
              return `Added ${source.relationship.toLowerCase()} details for ${source.firstName}.`
            }

            const pool = [...persona.family]
            const next = dependants.map((dependant) => {
              const matchIndex = dependant.relationship
                ? pool.findIndex(
                    (candidate) =>
                      candidate.relationship === dependant.relationship,
                  )
                : 0
              const source = pool.splice(matchIndex < 0 ? 0 : matchIndex, 1)[0]
              if (!source) return dependant
              const relationship = dependant.relationship || source.relationship
              return withAttributes({
                ...dependant,
                relationship,
                firstName: source.firstName,
                lastName: source.lastName,
                gender: source.gender,
                dateOfBirth: formatDate(source.dateOfBirth, dateStyle),
                selectedBenefitIds: defaultDependantBenefitIds(
                  relationship,
                  source.dateOfBirth,
                  resolvedAssignment,
                ),
              })
            })
            setDependants(next)
            signalAutofill()
            return `Filled ${pluralise(next.length, 'dependant')}.`
          },
        }
      }

      case 'search-employee': {
        const needsDependant =
          method === 'single-dependant' && action === 'edit'
        return {
          stepLabel: 'Search employee',
          hint: needsDependant
            ? 'Selects a demo employee and one of their dependants.'
            : 'Selects a demo employee from the list.',
          supported: true,
          run: (personaIndex) => {
            const candidates = needsDependant
              ? sampleEmployees.filter((item) => item.dependants.length > 0)
              : sampleEmployees
            const picked =
              candidates[personaIndex % Math.max(candidates.length, 1)]
            if (!picked) return 'No demo employees available.'
            setSelectedEmployeeId(picked.id)
            setSelectedDependantId(
              needsDependant ? picked.dependants[0]?.id ?? null : null,
            )
            signalAutofill()
            return `Selected ${picked.firstName} ${picked.lastName} (${picked.employeeId}).`
          },
        }
      }

      case 'edit-form':
        return {
          stepLabel: 'Edit details',
          hint: 'Applies a demo contact correction so a reviewable change exists.',
          supported: true,
          run: (personaIndex) => {
            const persona = personaAt(personaIndex)
            const original = sampleEmployees.find(
              (item) => item.id === selectedEmployeeId,
            )
            const mobile =
              original?.mobile === persona.mobile
                ? `${persona.mobile.slice(0, -1)}${(Number(persona.mobile.slice(-1)) + 1) % 10}`
                : persona.mobile
            const email =
              original?.email === persona.email
                ? persona.email.replace('@', '.updated@')
                : persona.email
            updateEmployee({ mobile, email })
            signalAutofill()
            return 'Applied a demo mobile and email correction.'
          },
        }

      case 'upload':
        return {
          stepLabel: 'Upload sheet',
          hint: 'Marks the template as downloaded and attaches a demo sheet.',
          supported: true,
          run: () => {
            setTemplateDownloaded(true)
            setFileName(
              action === 'delete'
                ? 'demo-lives-deletion.csv'
                : 'demo-lives-addition.csv',
            )
            if (action === 'delete') setDeleteConfirmed(true)
            signalAutofill()
            return 'Attached a demo upload sheet.'
          },
        }

      case 'midterm-proof':
        return {
          stepLabel: 'Midterm proof',
          hint: 'Marks the midterm proof as uploaded.',
          supported: true,
          run: () => {
            setMidtermProofUploaded(true)
            signalAutofill()
            return 'Marked midterm proof as uploaded.'
          },
        }

      case 'edit-proof':
        return {
          stepLabel: 'KYC proof',
          hint: 'Attaches a demo KYC document.',
          supported: true,
          run: () => {
            setEditProofFileName('demo-kyc-proof.pdf')
            signalAutofill()
            return 'Attached demo-kyc-proof.pdf.'
          },
        }

      case 'date-of-leaving':
        return {
          stepLabel: 'Date of leaving',
          hint: 'Sets the date of leaving to today.',
          supported: true,
          run: () => {
            setDateOfLeaving(todayIso())
            signalAutofill()
            return 'Set date of leaving to today.'
          },
        }

      case 'enrolment':
        return {
          stepLabel: 'Enrolment',
          hint: 'Turns enrolment on and keeps the default due date.',
          supported: true,
          run: () => {
            setEnrolment({
              ...enrolment,
              runEnrolment: true,
              mode: 'now',
              dueDate: enrolment.dueDate || todayIso(),
            })
            signalAutofill()
            return 'Enrolment invites set to send now.'
          },
        }

      case 'benefits':
        return unsupported(
          'Select benefits',
          'Benefit choices drive costs, so pick them manually.',
        )

      case 'employee-assignment':
        return unsupported(
          'Plan assignment',
          'The plan is assigned for you — change it or add dependants manually.',
        )

      default:
        return unsupported(
          'This step',
          'Nothing to fill here — this step has no form inputs.',
        )
    }
  }, [wizard])
}
