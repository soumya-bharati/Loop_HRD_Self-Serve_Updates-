import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled, { css } from 'styled-components'

import { assets } from '@/assets/figma'
import { SelectField } from '@/components/form/SelectField'
import {
  emptyDependantForm,
  type DependantFormData,
  type EmployeeFormData,
} from '@/data/employees'
import {
  availableBenefitsForRelationship,
  computeFamilySlots,
  evaluateDependantCoverEligibility,
  evaluateEmployeeEligibility,
  resolveAssignment,
  parseDateOnly,
  resolveAttributeFields,
  validateAttributeValues,
  type AssignmentSource,
  type FlexDealConfig,
  type FamilyRelationship,
  type InsurerLogo,
} from '@/domain/flex'
import {
  isDependantValid,
  isEmployeeValid,
  nextDependantId,
  type AddEmployeeMember,
} from '@/pages/LivesWizard/addEmployees'
import { useRegisterFormAutofill } from '@/pages/LivesWizard/autofill/activeFormAutofill'
import {
  attributeValueFor,
  personaAt,
  priorFamilyForEmployee,
  toDisplayDate,
} from '@/pages/LivesWizard/autofill/personas'
import { AddDependantModal } from '@/pages/LivesWizard/components/AddDependantModal'
import { DependantSlotSelector } from '@/pages/LivesWizard/components/DependantSlotSelector'
import { DynamicAttributeForm } from '@/pages/LivesWizard/components/DynamicAttributeForm'

type OnboardingStep =
  | { kind: 'details'; label: string }
  | { kind: 'policies'; label: string }
  | { kind: 'dependants'; label: string }

export interface EmployeeOnboardingDraft {
  employee: EmployeeFormData
  planId: string
  purchaseGroupSelections: Record<string, string[]>
  policySlabIds: Record<string, string>
  assignmentSource: AssignmentSource
  selectedBenefitIds: string[]
  dependants: DependantFormData[]
}

export function EmployeeOnboardingPage({
  open,
  member,
  deal,
  onCancel,
  onSave,
}: {
  open: boolean
  member: AddEmployeeMember | null
  deal: FlexDealConfig
  onCancel: () => void
  onSave: (draft: EmployeeOnboardingDraft) => void
}) {
  const [stepIndex, setStepIndex] = useState(0)
  const [employee, setEmployee] = useState<EmployeeFormData | null>(null)
  const [selectedBenefitIds, setSelectedBenefitIds] = useState<string[]>([])
  const [policySlabIds, setPolicySlabIds] = useState<Record<string, string>>({})
  const [dependants, setDependants] = useState<DependantFormData[]>([])
  const [dependantModal, setDependantModal] = useState<{
    relationship: FamilyRelationship
    dependant?: DependantFormData
  } | null>(null)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)

  const policyCovers = useMemo(
    () => deal.benefits.filter((benefit) => benefit.isInsurance),
    [deal.benefits],
  )
  const steps = useMemo<OnboardingStep[]>(
    () => [
      { kind: 'details', label: 'Add Employee Details' },
      { kind: 'policies', label: 'Assigned policies for the employee' },
      { kind: 'dependants', label: 'Add Dependant Details' },
    ],
    [],
  )
  const activeIndex = Math.min(stepIndex, steps.length - 1)
  const currentStep = steps[activeIndex]
  const isLastStep = activeIndex === steps.length - 1

  const sessionId = open && member ? member.id : null
  const seededSessionId = useRef<string | null>(null)
  const assignedKeyRef = useRef<string | null>(null)

  // Seed the draft once per open session; later context updates to the member
  // must not reset the stage the user is on.
  useEffect(() => {
    if (!sessionId || !member) {
      seededSessionId.current = null
      return
    }
    if (seededSessionId.current === sessionId) return
    seededSessionId.current = sessionId
    assignedKeyRef.current = null
    setStepIndex(0)
    setCancelConfirmOpen(false)
    setEmployee({
      ...member.employee,
      customAttributes: { ...member.employee.customAttributes },
    })
    setSelectedBenefitIds([...member.selectedBenefitIds])
    setPolicySlabIds({ ...(member.policySlabIds ?? {}) })
    setDependants(member.dependants.map((dependant) => ({ ...dependant })))
  }, [member, sessionId])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (dependantModal) return
      if (cancelConfirmOpen) {
        setCancelConfirmOpen(false)
        return
      }
      setCancelConfirmOpen(true)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cancelConfirmOpen, dependantModal, open])

  const employeeFields = useMemo(
    () =>
      resolveAttributeFields({
        deal,
        entity: 'employee',
        existingValues: employee?.customAttributes,
      }).fields,
    [deal, employee?.customAttributes],
  )
  const recommendation = useMemo(() => {
    if (!employee) return null
    return resolveAssignment({
      deal,
      employee: {
        dateOfBirth: employee.dateOfBirth,
        department: employee.customAttributes['attr-department'],
        attributes: employee.customAttributes,
      },
    })
  }, [deal, employee])
  const eligibility = useMemo(() => {
    if (!employee) return null
    return evaluateEmployeeEligibility(deal, {
      dateOfBirth: employee.dateOfBirth,
      department: employee.customAttributes['attr-department'],
      attributes: employee.customAttributes,
    })
  }, [deal, employee])
  const recommendedBenefitIds = useMemo(() => {
    const suggested = recommendation?.benefitIds ?? []
    return suggested.filter(
      (benefitId) =>
        policyCovers.some((cover) => cover.id === benefitId) &&
        eligibility?.benefits[benefitId]?.eligible !== false,
    )
  }, [eligibility, policyCovers, recommendation])
  const assignedCovers = useMemo(
    () =>
      policyCovers.filter((cover) =>
        recommendedBenefitIds.includes(cover.id),
      ),
    [policyCovers, recommendedBenefitIds],
  )
  const assignedKey = recommendedBenefitIds.slice().sort().join('|')

  useEffect(() => {
    if (!open || !employee) return
    const slabs: Record<string, string> = {}
    for (const benefitId of recommendedBenefitIds) {
      const cover = policyCovers.find((item) => item.id === benefitId)
      if (cover?.policySlabs?.length) {
        slabs[benefitId] = cover.policySlabs[0].id
      }
    }
    setSelectedBenefitIds(recommendedBenefitIds)
    setPolicySlabIds(slabs)
    if (
      assignedKeyRef.current !== null &&
      assignedKeyRef.current !== assignedKey
    ) {
      setDependants([])
    }
    assignedKeyRef.current = assignedKey
  }, [assignedKey, employee, open, policyCovers, recommendedBenefitIds])
  const planId =
    deal.plans.find((plan) =>
      plan.benefitIds.every((benefitId) =>
        selectedBenefitIds.includes(benefitId),
      ),
    )?.id ?? ''
  const selectedPlan = deal.plans.find((plan) => plan.id === planId)
  const familySummary = computeFamilySlots({
    deal,
    selectedBenefitIds,
    existingDependants: dependants
      .filter((dependant) => Boolean(dependant.relationship))
      .map((dependant) => ({
        id: dependant.id,
        relationship: dependant.relationship,
        dateOfBirth: dependant.dateOfBirth,
        benefitIds: dependant.selectedBenefitIds,
      })),
  })
  const benefitLabels = Object.fromEntries(
    deal.benefits.map((benefit) => [benefit.id, benefit.name]),
  )
  const detailsValid =
    employee !== null &&
    isEmployeeValid(employee) &&
    Object.keys(
      validateAttributeValues(employeeFields, employee.customAttributes),
    ).length === 0
  const policiesValid =
    selectedBenefitIds.length > 0 &&
    selectedBenefitIds.every((benefitId) => {
      if (eligibility?.benefits[benefitId]?.eligible === false) return false
      const cover = policyCovers.find((item) => item.id === benefitId)
      if (cover?.policySlabs?.length) return Boolean(policySlabIds[benefitId])
      return true
    })
  const dependantsValid = dependants.every((dependant) => {
    const fields = resolveAttributeFields({
      deal,
      entity: 'dependant',
      relationship: dependant.relationship,
      selectedBenefitIds: dependant.selectedBenefitIds,
      existingValues: dependant.customAttributes,
    }).fields
    return (
      isDependantValid(dependant) &&
      dependant.selectedBenefitIds.every(
        (benefitId) =>
          evaluateDependantCoverEligibility(
            deal,
            dependant.relationship,
            dependant.dateOfBirth,
            benefitId,
          ).eligible,
      ) &&
      Object.keys(
        validateAttributeValues(fields, dependant.customAttributes),
      ).length === 0
    )
  })

  const fillDetails = useCallback(
    (personaIndex: number) => {
      if (!employee) return 'Open an employee form to fill it.'
      const persona = personaAt(personaIndex)
      const draft: EmployeeFormData = {
        ...employee,
        customAttributes: { ...employee.customAttributes },
        relationship: 'Self',
      }
      let filled = 0
      const setIfBlank = <Key extends keyof EmployeeFormData>(
        key: Key,
        value: EmployeeFormData[Key],
      ) => {
        if (draft[key]) return
        draft[key] = value
        filled += 1
      }
      setIfBlank('employeeId', persona.employeeId)
      setIfBlank('firstName', persona.firstName)
      setIfBlank('lastName', persona.lastName)
      setIfBlank('gender', persona.gender)
      setIfBlank('dateOfBirth', toDisplayDate(persona.dateOfBirth))
      setIfBlank('dateOfJoining', toDisplayDate(persona.dateOfJoining))
      setIfBlank('email', persona.email)
      setIfBlank('mobile', persona.mobile)
      for (const field of employeeFields) {
        if (!field.visible) continue
        if (draft.customAttributes[field.definition.id]) continue
        draft.customAttributes[field.definition.id] = attributeValueFor(
          field.definition,
          persona,
          personaIndex,
        )
        filled += 1
      }
      if (filled === 0) return 'Every field on this step is already filled.'
      setEmployee(draft)
      return `Filled ${filled} empty ${filled === 1 ? 'field' : 'fields'} for ${persona.firstName} ${persona.lastName}.`
    },
    [employee, employeeFields],
  )

  const fillPolicies = useCallback(() => {
    if (recommendedBenefitIds.length === 0) {
      return 'No policy is auto assigned for this employee.'
    }
    return `Showing ${recommendedBenefitIds.length} auto assigned ${
      recommendedBenefitIds.length === 1 ? 'policy' : 'policies'
    }.`
  }, [recommendedBenefitIds])

  const fillDependants = useCallback(
    (personaIndex: number) => {
      if (selectedBenefitIds.length === 0) {
        return 'Choose a cover before adding dependants.'
      }
      const persona = personaAt(personaIndex)
      const pool = [...persona.family]
      const remaining = new Map<string, number>(
        familySummary.slots.map((slot) => [
          slot.relationship,
          slot.remainingSlots,
        ]),
      )
      /**
       * A card already on screen holds its own slot, so filling it does not
       * need spare capacity; opening a new card does.
       */
      const take = (preferred: string | undefined, respectCapacity: boolean) => {
        const index = pool.findIndex(
          (candidate) =>
            (!preferred || candidate.relationship === preferred) &&
            (!respectCapacity ||
              (remaining.get(candidate.relationship) ?? 0) > 0),
        )
        if (index < 0) return null
        const [claimed] = pool.splice(index, 1)
        remaining.set(
          claimed.relationship,
          Math.max((remaining.get(claimed.relationship) ?? 1) - 1, 0),
        )
        return claimed
      }
      const withAttributes = (dependant: DependantFormData) => {
        const fields = resolveAttributeFields({
          deal,
          entity: 'dependant',
          relationship: dependant.relationship,
          selectedBenefitIds: dependant.selectedBenefitIds,
          existingValues: dependant.customAttributes,
        }).fields
        const customAttributes = { ...dependant.customAttributes }
        for (const field of fields) {
          if (!field.visible) continue
          if (customAttributes[field.definition.id]) continue
          customAttributes[field.definition.id] = attributeValueFor(
            field.definition,
            persona,
            personaIndex,
          )
        }
        return { ...dependant, customAttributes }
      }

      let filled = 0
      // Complete the cards already on screen before opening new ones.
      const existing = dependants.map((dependant) => {
        const source = dependant.relationship
          ? take(dependant.relationship, false)
          : take(undefined, true)
        if (!source) return dependant
        const relationship = dependant.relationship || source.relationship
        filled += 1
        return withAttributes({
          ...dependant,
          relationship,
          firstName: dependant.firstName || source.firstName,
          lastName: dependant.lastName || source.lastName,
          gender: dependant.gender || source.gender,
          dateOfBirth: dependant.dateOfBirth || source.dateOfBirth,
          selectedBenefitIds: dependant.selectedBenefitIds.length
            ? dependant.selectedBenefitIds
            : availableBenefitsForRelationship(familySummary, relationship),
        })
      })

      let added = 0
      const seeded: DependantFormData[] = []
      for (const relationship of familySummary.addableRelationships) {
        for (
          let source = take(relationship, true);
          source;
          source = take(relationship, true)
        ) {
          seeded.push(
            withAttributes({
              ...emptyDependantForm(nextDependantId()),
              relationship,
              firstName: source.firstName,
              lastName: source.lastName,
              gender: source.gender,
              dateOfBirth: source.dateOfBirth,
              selectedBenefitIds: availableBenefitsForRelationship(
                familySummary,
                relationship,
              ),
            }),
          )
          added += 1
        }
      }

      if (filled === 0 && added === 0) {
        return 'No dependant slots left for the selected plan.'
      }
      setDependants([...existing, ...seeded])
      if (added > 0) {
        return `Added ${added} demo ${added === 1 ? 'dependant' : 'dependants'}.`
      }
      return `Filled ${filled} dependant ${filled === 1 ? 'card' : 'cards'}.`
    },
    [deal, dependants, familySummary, selectedBenefitIds],
  )

  useRegisterFormAutofill(
    useMemo(
      () =>
        open && member
          ? {
              stepLabel:
                currentStep.kind === 'details'
                  ? 'Employee details'
                  : currentStep.kind === 'policies'
                    ? 'Assigned policies'
                    : 'Dependant details',
              hint:
                currentStep.kind === 'details'
                  ? 'Fills the empty fields on this employee form.'
                  : currentStep.kind === 'policies'
                    ? 'Assigned policies are already applied for this employee.'
                    : 'Adds demo dependants that fit the remaining slots.',
              run: (personaIndex: number) =>
                currentStep.kind === 'details'
                  ? fillDetails(personaIndex)
                  : currentStep.kind === 'policies'
                    ? fillPolicies()
                    : fillDependants(personaIndex),
            }
          : null,
      [currentStep, fillDependants, fillDetails, fillPolicies, member, open],
    ),
  )

  if (!open || !member || !employee) return null

  const updateEmployee = (patch: Partial<EmployeeFormData>) =>
    setEmployee((current) => (current ? { ...current, ...patch } : current))

  return (
    <Page role="dialog" aria-modal="true" aria-label="Add employee">
      <GreenBackdrop />
      <Header>
        <Logo src={assets.loopLogoYellow} alt="Loop" />
        <CancelButton type="button" onClick={() => setCancelConfirmOpen(true)}>
          Cancel
        </CancelButton>
      </Header>

      <Card>
        <Rail>
          {steps.map((step, index) => (
            <RailItem
              key={step.label}
              $active={index === activeIndex}
              $done={index < activeIndex}
              aria-current={index === activeIndex ? 'step' : undefined}
            >
              <RailTrack>
                <RailDot />
                {index < steps.length - 1 ? <RailLine /> : null}
              </RailTrack>
              <RailLabel>
                <RailIcon src={assets.iconDocumentCopy} alt="" aria-hidden />
                {step.label}
              </RailLabel>
            </RailItem>
          ))}
        </Rail>

        <Content>
          <MobileProgress>
            <MobileProgressMeta>
              Step {activeIndex + 1} of {steps.length}
            </MobileProgressMeta>
            <MobileProgressLabel>{currentStep.label}</MobileProgressLabel>
            <MobileProgressTrack>
              <MobileProgressFill
                $progress={((activeIndex + 1) / steps.length) * 100}
              />
            </MobileProgressTrack>
          </MobileProgress>
          {currentStep.kind === 'details' ? (
            <>
              <SectionLabel>Employee Details</SectionLabel>
              <FieldGrid>
                <Field>
                  <Label>Employee ID<Required>*</Required></Label>
                  <Input
                    value={employee.employeeId}
                    placeholder="Enter employee ID"
                    onChange={(event) =>
                      updateEmployee({ employeeId: event.target.value })
                    }
                  />
                </Field>
                <Field>
                  <Label>First Name<Required>*</Required></Label>
                  <Input
                    value={employee.firstName}
                    placeholder="Enter first name"
                    onChange={(event) =>
                      updateEmployee({ firstName: event.target.value })
                    }
                  />
                </Field>
                <Field>
                  <Label>Last Name</Label>
                  <Input
                    value={employee.lastName}
                    placeholder="Enter last name"
                    onChange={(event) =>
                      updateEmployee({ lastName: event.target.value })
                    }
                  />
                </Field>
                <FieldBlock>
                  <Label id="onboarding-gender-label">
                    Gender<Required>*</Required>
                  </Label>
                  <SelectField
                    ariaLabelledBy="onboarding-gender-label"
                    value={employee.gender}
                    placeholder="Select gender"
                    options={[
                      { value: 'Male', label: 'Male' },
                      { value: 'Female', label: 'Female' },
                    ]}
                    onChange={(value) =>
                      updateEmployee({
                        gender: value as EmployeeFormData['gender'],
                      })
                    }
                  />
                </FieldBlock>
                <Field>
                  <Label>Date of Birth<Required>*</Required></Label>
                  <DateInput
                    label="date of birth"
                    value={employee.dateOfBirth}
                    onChange={(dateOfBirth) => updateEmployee({ dateOfBirth })}
                  />
                </Field>
                <Field>
                  <Label>Date of Joining<Required>*</Required></Label>
                  <DateInput
                    label="date of joining"
                    value={employee.dateOfJoining}
                    onChange={(dateOfJoining) =>
                      updateEmployee({ dateOfJoining })
                    }
                  />
                </Field>
                <Field>
                  <Label>Work Email</Label>
                  <Input
                    type="email"
                    value={employee.email}
                    placeholder="Enter work email"
                    onChange={(event) =>
                      updateEmployee({ email: event.target.value })
                    }
                  />
                </Field>
                <Field>
                  <Label>Mobile Number</Label>
                  <PhoneField>
                    <PhonePrefix>+91</PhonePrefix>
                    <PhoneDivider />
                    <PhoneInput
                      value={employee.mobile}
                      placeholder="Enter phone number"
                      onChange={(event) =>
                        updateEmployee({ mobile: event.target.value })
                      }
                    />
                  </PhoneField>
                </Field>
              </FieldGrid>
              <Divider />
              <DynamicAttributeForm
                fields={employeeFields}
                values={employee.customAttributes}
                onChange={(attributeId, value) =>
                  updateEmployee({
                    customAttributes: {
                      ...employee.customAttributes,
                      [attributeId]: value,
                    },
                  })
                }
              />
            </>
          ) : currentStep.kind === 'policies' ? (
            <Section>
              <SectionHeading>
                <div>
                  <SectionTitle>
                    Assigned policies for the employee
                  </SectionTitle>
                  <SectionCopy>
                    These covers were auto assigned and cannot be changed.
                  </SectionCopy>
                </div>
                {assignedCovers.length > 0 ? (
                  <Badge>Auto assigned</Badge>
                ) : null}
              </SectionHeading>
              {assignedCovers.length > 0 ? (
                <PolicyList>
                  {assignedCovers.map((cover) => (
                    <PolicyCard key={cover.id}>
                      <PolicyHeader>
                        <LogoBox>
                          <LogoImg
                            src={insurerLogoSrc(cover.insurerLogo)}
                            alt=""
                          />
                        </LogoBox>
                        <PolicyCopy>
                          <PolicyName>{cover.name}</PolicyName>
                          <PolicyMeta>
                            <span>{cover.insurerName}</span>
                            {cover.policyLabel ? (
                              <>
                                <PolicyDot aria-hidden />
                                <span>{cover.policyLabel}</span>
                              </>
                            ) : null}
                            {cover.policyNumber ? (
                              <>
                                <PolicyDot aria-hidden />
                                <span>Policy No: {cover.policyNumber}</span>
                              </>
                            ) : null}
                          </PolicyMeta>
                        </PolicyCopy>
                      </PolicyHeader>
                    </PolicyCard>
                  ))}
                </PolicyList>
              ) : (
                <EmptyPolicies>
                  No cover could be auto assigned for this employee.
                </EmptyPolicies>
              )}
            </Section>
          ) : selectedBenefitIds.length > 0 ? (
            <Section>
              <SectionHeading>
                <div>
                  <SectionTitle>Add dependant details</SectionTitle>
                  <SectionCopy>
                    Add eligible family members under{' '}
                    {selectedPlan?.name ?? 'the selected covers'}.
                  </SectionCopy>
                </div>
              </SectionHeading>
              <DependantSlotSelector
                summary={familySummary}
                benefitLabels={benefitLabels}
                employee={employee}
                employeeBenefitIds={selectedBenefitIds}
                dependants={dependants}
                knownDependants={priorFamilyForEmployee(employee)}
                onAddSlot={(relationship) =>
                  setDependantModal({ relationship })
                }
                onEditDependant={(dependant) =>
                  setDependantModal({
                    relationship: dependant.relationship as FamilyRelationship,
                    dependant,
                  })
                }
                onEditSelf={() => setStepIndex(0)}
              />
            </Section>
          ) : null}

          <Footer>
            {activeIndex > 0 ? (
              <BackButton
                type="button"
                onClick={() => setStepIndex(activeIndex - 1)}
              >
                Back
              </BackButton>
            ) : null}
            <PrimaryButton
              type="button"
              disabled={
                currentStep.kind === 'details'
                  ? !detailsValid
                  : currentStep.kind === 'policies'
                    ? !policiesValid
                    : !dependantsValid
              }
              onClick={() => {
                if (!isLastStep) {
                  setStepIndex(activeIndex + 1)
                  return
                }
                if (!dependantsValid) return
                onSave({
                  employee,
                  planId,
                  purchaseGroupSelections: {},
                  policySlabIds,
                  assignmentSource: recommendation?.source ?? 'manual',
                  selectedBenefitIds,
                  dependants,
                })
              }}
            >
              {isLastStep ? 'Save Employee' : 'Next'}
            </PrimaryButton>
          </Footer>
        </Content>
      </Card>
      <AddDependantModal
        open={Boolean(dependantModal)}
        relationship={dependantModal?.relationship ?? 'Spouse'}
        initial={dependantModal?.dependant ?? null}
        onClose={() => setDependantModal(null)}
        onSave={(dependant) => {
          const relationship = dependantModal?.relationship ?? dependant.relationship
          const withCovers = {
            ...dependant,
            relationship,
            id: dependantModal?.dependant?.id ?? nextDependantId(),
            selectedBenefitIds: availableBenefitsForRelationship(
              familySummary,
              relationship,
            ),
          }
          setDependants((current) => {
            const exists = current.some((item) => item.id === withCovers.id)
            return exists
              ? current.map((item) =>
                  item.id === withCovers.id ? withCovers : item,
                )
              : [...current, withCovers]
          })
          setDependantModal(null)
        }}
      />
      {cancelConfirmOpen ? (
        <ConfirmOverlay
          role="presentation"
          onClick={() => setCancelConfirmOpen(false)}
        >
          <ConfirmDialog
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-confirm-title"
            onClick={(event) => event.stopPropagation()}
          >
            <ConfirmHeader>
              <ConfirmTitle id="cancel-confirm-title">
                Cancel adding this employee?
              </ConfirmTitle>
              <ConfirmClose
                type="button"
                aria-label="Close"
                onClick={() => setCancelConfirmOpen(false)}
              >
                <img src={assets.modalDismiss} alt="" width={24} height={24} />
              </ConfirmClose>
            </ConfirmHeader>
            <ConfirmBody>
              Any details you&apos;ve entered will be lost. Are you sure you
              want to cancel?
            </ConfirmBody>
            <ConfirmActions>
              <ConfirmStay
                type="button"
                onClick={() => setCancelConfirmOpen(false)}
              >
                Stay
              </ConfirmStay>
              <ConfirmLeave
                type="button"
                onClick={() => {
                  setCancelConfirmOpen(false)
                  onCancel()
                }}
              >
                Cancel
              </ConfirmLeave>
            </ConfirmActions>
          </ConfirmDialog>
        </ConfirmOverlay>
      ) : null}
    </Page>
  )
}

/**
 * Keeps the designed DD/MM/YYYY text field and hangs the browser's date picker
 * off the calendar icon. The native date input is only there to anchor the
 * popup, so it stays invisible and out of the tab order.
 */
function DateInput({
  value,
  onChange,
  label,
}: {
  value: string
  onChange: (value: string) => void
  label: string
}) {
  const pickerRef = useRef<HTMLInputElement>(null)
  const parsed = parseDateOnly(value)
  const isoValue = parsed
    ? [
        `${parsed.year}`.padStart(4, '0'),
        `${parsed.month}`.padStart(2, '0'),
        `${parsed.day}`.padStart(2, '0'),
      ].join('-')
    : ''

  return (
    <DateField>
      <Input
        value={value}
        placeholder="Enter Date (DD/MM/YYYY)"
        onChange={(event) => onChange(event.target.value)}
      />
      <DateIcon src={assets.iconCalendar24} alt="" aria-hidden />
      <PickerTrigger
        type="button"
        aria-label={`Choose ${label}`}
        onClick={(event) => {
          // The field sits inside a <label>; stop it re-dispatching the click.
          event.preventDefault()
          try {
            pickerRef.current?.showPicker()
          } catch {
            // Browsers without showPicker keep the typed DD/MM/YYYY input.
          }
        }}
      />
      <NativeDatePicker
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden
        value={isoValue}
        onChange={(event) => {
          if (!event.target.value) return
          onChange(toDisplayDate(event.target.value))
        }}
      />
    </DateField>
  )
}

function insurerLogoSrc(logo: InsurerLogo) {
  if (logo === 'icici' || logo === 'aditya-birla') return assets.iciciLogo
  return assets.digitLogo
}

const Page = styled.div`
  position: fixed;
  inset: 0;
  z-index: 250;
  overflow-y: auto;
  padding: 36px 48px 48px;
  background: ${({ theme }) => theme.colors.surface0};
  box-sizing: border-box;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    padding: 24px ${({ theme }) => theme.layout.contentPadXTablet};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 0;
    background: ${({ theme }) => theme.colors.surface1};
  }
`

const GreenBackdrop = styled.div`
  position: absolute;
  inset: 0 0 auto;
  height: 227px;
  background: ${({ theme }) => theme.colors.emerald};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    height: 76px;
  }
`

const Header = styled.header`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1344px;
  height: 36px;
  margin: 0 auto 36px;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    height: 76px;
    margin: 0;
    padding: 0 ${({ theme }) => theme.layout.contentPadXMobile};
  }
`

const Logo = styled.img`
  display: block;
  width: 67px;
  height: 37px;
  object-fit: contain;
`

const CancelButton = styled.button`
  padding: 10px 20px;
  border: 0;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.14);
  color: white;
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
`

const ConfirmOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 420;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(45, 55, 72, 0.45);
`

const ConfirmDialog = styled.div`
  width: min(420px, 100%);
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface1};
  box-shadow: 0 16px 48px rgba(16, 24, 40, 0.16);
  box-sizing: border-box;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: 20px;
  }
`

const ConfirmHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`

const ConfirmTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  line-height: 24px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const ConfirmClose = styled.button`
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
`

const ConfirmBody = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const ConfirmActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
`

const ConfirmStay = styled.button`
  min-width: 96px;
  height: 40px;
  padding: 0 16px;
  border: 1px solid ${({ theme }) => theme.colors.emerald};
  border-radius: ${({ theme }) => theme.radii.md};
  background: transparent;
  color: ${({ theme }) => theme.colors.emerald};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
`

const ConfirmLeave = styled.button`
  min-width: 96px;
  height: 40px;
  padding: 0 16px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.fillRed};
  color: ${({ theme }) => theme.colors.surface1};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
`

const Card = styled.div`
  position: relative;
  display: flex;
  width: min(1344px, 100%);
  min-height: 632px;
  margin: 0 auto;
  overflow: hidden;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface1};
  box-shadow: ${({ theme }) => theme.shadows.smooth};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    min-height: calc(100vh - 76px);
    border-radius: 0;
    box-shadow: none;
  }
`

const Rail = styled.ol`
  width: 360px;
  flex-shrink: 0;
  margin: 0;
  padding: 32px;
  background: #fafbfb;
  box-sizing: border-box;
  list-style: none;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: none;
  }
`

const RailItem = styled.li<{ $active: boolean; $done: boolean }>`
  display: grid;
  grid-template-columns: 12px 1fr;
  gap: 22px;
  min-height: 52px;
  color: ${({ theme, $active, $done }) =>
    $active || $done ? theme.colors.emerald : theme.colors.textSecondary};
`

const RailTrack = styled.span`
  display: flex;
  align-items: center;
  flex-direction: column;
`

const RailDot = styled.span`
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border: 2px solid currentColor;
  border-radius: 50%;
  background: white;
`

const RailLine = styled.span`
  width: 1px;
  min-height: 32px;
  flex: 1;
  margin: 4px 0;
  background: currentColor;
  opacity: 0.55;
`

const RailLabel = styled.span`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding-bottom: 16px;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
`

const RailIcon = styled.img`
  width: 24px;
  height: 24px;
  flex-shrink: 0;
`

const Content = styled.div`
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  box-sizing: border-box;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    gap: 20px;
    padding: 20px ${({ theme }) => theme.layout.contentPadXMobile};
  }
`

const MobileProgress = styled.div`
  display: none;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
`

const MobileProgressMeta = styled.span`
  font-size: 12px;
  line-height: 18px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const MobileProgressLabel = styled.strong`
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const MobileProgressTrack = styled.span`
  width: 100%;
  height: 4px;
  overflow: hidden;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.disableFill};
`

const MobileProgressFill = styled.span<{ $progress: number }>`
  display: block;
  width: ${({ $progress }) => `${$progress}%`};
  height: 100%;
  border-radius: inherit;
  background: ${({ theme }) => theme.colors.emerald};
`

const SectionLabel = styled.h2`
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;

  @media (max-width: ${({ theme }) => theme.breakpoints.xl}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`

const fieldLayout = css`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
`

const Field = styled.label`
  ${fieldLayout}
`

/** For controls that are not labelable elements, e.g. the listbox dropdown. */
const FieldBlock = styled.div`
  ${fieldLayout}
`

const Label = styled.span`
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Required = styled.span`
  color: ${({ theme }) => theme.colors.textError};
`

const Input = styled.input`
  width: 100%;
  height: 48px;
  padding: 12px 20px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface1};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  box-sizing: border-box;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`

const DateField = styled.div`
  position: relative;

  ${Input} {
    padding-right: 48px;
  }
`

const DateIcon = styled.img`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 24px;
  height: 24px;
  pointer-events: none;
`

/** Transparent hit area over the calendar icon — no visual footprint. */
const PickerTrigger = styled.button`
  position: absolute;
  top: 0;
  right: 0;
  width: 48px;
  height: 48px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
`

const NativeDatePicker = styled.input`
  position: absolute;
  right: 16px;
  bottom: 0;
  width: 1px;
  height: 1px;
  padding: 0;
  border: none;
  opacity: 0;
  pointer-events: none;
`

const PhoneField = styled.div`
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 20px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: 8px;
  box-sizing: border-box;
`

const PhonePrefix = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const PhoneDivider = styled.span`
  width: 1px;
  height: 20px;
  margin: 0 8px;
  background: ${({ theme }) => theme.colors.defaultBorder};
`

const PhoneInput = styled.input`
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Divider = styled.hr`
  width: 100%;
  margin: -8px 0 0;
  border: 0;
  border-top: 1px solid ${({ theme }) => theme.colors.defaultBorder};
`

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const SectionHeading = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
`

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const SectionCopy = styled.p`
  margin: 4px 0 0;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Badge = styled.span`
  padding: 4px 10px;
  border-radius: 99px;
  background: ${({ theme }) => theme.colors.planeGreenLight};
  color: ${({ theme }) => theme.colors.emerald};
  font-size: 12px;
  font-weight: 600;
`

const PolicyList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const PolicyCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  padding: 16px 20px;
  border: 1px solid ${({ theme }) => theme.colors.emerald};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface1};
  box-sizing: border-box;
`

const PolicyHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    gap: 10px;
  }
`

const LogoBox = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 36px;
  flex-shrink: 0;
  padding: 4px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.surface1};
  box-sizing: border-box;
`

const LogoImg = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
`

const PolicyCopy = styled.div`
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 4px;
`

const PolicyName = styled.strong`
  font-size: 16px;
  font-weight: 600;
  line-height: 22px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const PolicyMeta = styled.span`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  line-height: 18px;
  color: ${({ theme }) => theme.colors.textSecondary};
  overflow-wrap: anywhere;
`

const PolicyDot = styled.span`
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.textSecondary};
`

const EmptyPolicies = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Footer = styled.footer`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  margin-top: auto;
  padding-top: 24px;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    position: sticky;
    bottom: -20px;
    z-index: 5;
    width: calc(100% + 32px);
    margin: auto -16px -20px;
    padding: 12px 16px 20px;
    border-top: 1px solid ${({ theme }) => theme.colors.defaultBorder};
    background: ${({ theme }) => theme.colors.surface1};
  }
`

const BackButton = styled.button`
  width: 180px;
  height: 48px;
  border: 1px solid ${({ theme }) => theme.colors.emerald};
  border-radius: 12px;
  background: transparent;
  color: ${({ theme }) => theme.colors.emerald};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    width: auto;
    min-width: 0;
    flex: 1;
  }
`

const PrimaryButton = styled(BackButton)`
  border: 0;
  background: ${({ theme }) => theme.colors.fillGreen};

  &:disabled {
    background: ${({ theme }) => theme.colors.disableFill};
    color: ${({ theme }) => theme.colors.textSecondary};
    cursor: not-allowed;
  }
`
