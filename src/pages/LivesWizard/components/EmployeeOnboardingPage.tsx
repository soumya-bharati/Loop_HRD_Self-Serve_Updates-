import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled, { css } from 'styled-components'

import { assets } from '@/assets/figma'
import { SelectField } from '@/components/form/SelectField'
import {
  emptyDependantForm,
  type DependantFormData,
  type EmployeeFormData,
  type Gender,
  type Relationship,
} from '@/data/employees'
import {
  availableBenefitsForRelationship,
  computeFamilySlots,
  evaluateDependantCoverEligibility,
  evaluateEmployeeEligibility,
  getBenefitConfig,
  resolveAssignment,
  parseDateOnly,
  resolveAttributeFields,
  resolveBenefitIdsFromSelections,
  validateAttributeValues,
  validatePurchaseGroupSelections,
  type AssignmentSource,
  type FlexDealConfig,
  type PurchaseGroupConfig,
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
  toDisplayDate,
} from '@/pages/LivesWizard/autofill/personas'
import { DependantSlotSelector } from '@/pages/LivesWizard/components/DependantSlotSelector'
import { DynamicAttributeForm } from '@/pages/LivesWizard/components/DynamicAttributeForm'

/**
 * The flow walks the deal's purchase groups one at a time, so the steps are
 * derived from configuration rather than fixed: a deal with "Core Cover" and
 * "Add-ons" gets two selection steps between details and dependants.
 */
type OnboardingStep =
  | { kind: 'details'; label: string }
  | { kind: 'group'; label: string; group: PurchaseGroupConfig }
  | { kind: 'dependants'; label: string }

export interface EmployeeOnboardingDraft {
  employee: EmployeeFormData
  planId: string
  purchaseGroupSelections: Record<string, string[]>
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
  const [selections, setSelections] = useState<Record<string, string[]>>({})
  const [dependants, setDependants] = useState<DependantFormData[]>([])

  const steps = useMemo<OnboardingStep[]>(
    () => [
      { kind: 'details', label: 'Add Employee Details' },
      ...deal.purchaseGroups.map((group) => ({
        kind: 'group' as const,
        label: `Choose ${group.name}`,
        group,
      })),
      { kind: 'dependants', label: 'Add Dependant Details' },
    ],
    [deal.purchaseGroups],
  )
  const activeIndex = Math.min(stepIndex, steps.length - 1)
  const currentStep = steps[activeIndex]
  const isLastStep = activeIndex === steps.length - 1

  const sessionId = open && member ? member.id : null
  const seededSessionId = useRef<string | null>(null)

  // Seed the draft once per open session; later context updates to the member
  // must not reset the stage the user is on.
  useEffect(() => {
    if (!sessionId || !member) {
      seededSessionId.current = null
      return
    }
    if (seededSessionId.current === sessionId) return
    seededSessionId.current = sessionId
    setStepIndex(0)
    setEmployee({
      ...member.employee,
      customAttributes: { ...member.employee.customAttributes },
    })
    setSelections({ ...member.purchaseGroupSelections })
    setDependants(member.dependants.map((dependant) => ({ ...dependant })))
  }, [member, sessionId])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel, open])

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
  /** Rule / default assignment, dropped where the employee is not eligible. */
  const recommendedSelections = useMemo(() => {
    const suggested = recommendation?.purchaseGroupSelections ?? {}
    const allowed: Record<string, string[]> = {}
    for (const group of deal.purchaseGroups) {
      allowed[group.id] = (suggested[group.id] ?? []).filter(
        (optionId) => eligibility?.options[optionId]?.eligible !== false,
      )
    }
    return allowed
  }, [deal.purchaseGroups, eligibility, recommendation])

  const resolved = useMemo(
    () => resolveBenefitIdsFromSelections(deal, selections),
    [deal, selections],
  )
  const planId = resolved.planIds[0] ?? ''
  const selectedPlan = deal.plans.find((plan) => plan.id === planId)
  const selectedBenefitIds = resolved.benefitIds
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
  const groupValidation = validatePurchaseGroupSelections(deal, selections)
  const unmetGroupIds = new Set(groupValidation.unmetMandatoryGroupIds)
  /** A group is complete when it meets its requirement and holds no ineligible pick. */
  const isGroupValid = (group: PurchaseGroupConfig) =>
    !unmetGroupIds.has(group.id) &&
    (selections[group.id] ?? []).every(
      (optionId) => eligibility?.options[optionId]?.eligible !== false,
    )
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

  const fillGroup = useCallback(
    (group: PurchaseGroupConfig) => {
      if ((selections[group.id] ?? []).length > 0) {
        return `${group.name} already has a selection.`
      }
      const recommended = recommendedSelections[group.id] ?? []
      const eligibleIds = group.options
        .filter((option) => eligibility?.options[option.id]?.eligible !== false)
        .map((option) => option.id)
      const picked = recommended.length
        ? recommended
        : group.selectMode === 'single'
          ? eligibleIds.slice(0, 1)
          : eligibleIds
      if (picked.length === 0) {
        return `No ${group.name} option is available for this employee.`
      }
      const labels = group.options
        .filter((option) => picked.includes(option.id))
        .map((option) => option.label)
      setSelections((current) => ({ ...current, [group.id]: picked }))
      setDependants([])
      return `Selected ${labels.join(', ')}.`
    },
    [eligibility, recommendedSelections, selections],
  )

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
                  : currentStep.kind === 'group'
                    ? currentStep.group.name
                    : 'Dependant details',
              hint:
                currentStep.kind === 'details'
                  ? 'Fills the empty fields on this employee form.'
                  : currentStep.kind === 'group'
                    ? `Picks the assigned ${currentStep.group.name} option.`
                    : 'Adds demo dependants that fit the remaining slots.',
              run: (personaIndex: number) =>
                currentStep.kind === 'details'
                  ? fillDetails(personaIndex)
                  : currentStep.kind === 'group'
                    ? fillGroup(currentStep.group)
                    : fillDependants(personaIndex),
            }
          : null,
      [currentStep, fillDependants, fillDetails, fillGroup, member, open],
    ),
  )

  if (!open || !member || !employee) return null

  const updateEmployee = (patch: Partial<EmployeeFormData>) =>
    setEmployee((current) => (current ? { ...current, ...patch } : current))
  const toggleOption = (group: PurchaseGroupConfig, optionId: string) => {
    setSelections((current) => {
      const chosen = current[group.id] ?? []
      if (group.selectMode === 'single') {
        // A mandatory group must keep a pick, so re-clicking it is a no-op.
        const next =
          chosen.includes(optionId) && group.requirement === 'optional'
            ? []
            : [optionId]
        return { ...current, [group.id]: next }
      }
      return {
        ...current,
        [group.id]: chosen.includes(optionId)
          ? chosen.filter((id) => id !== optionId)
          : [...chosen, optionId],
      }
    })
    // Changing covers changes the family slots the dependants were built from.
    setDependants([])
  }
  const updateDependant = (
    dependantId: string,
    patch: Partial<DependantFormData>,
  ) =>
    setDependants((current) =>
      current.map((dependant) =>
        dependant.id === dependantId ? { ...dependant, ...patch } : dependant,
      ),
    )

  return (
    <Page role="dialog" aria-modal="true" aria-label="Add employee">
      <GreenBackdrop />
      <Header>
        <Logo src={assets.loopLogoYellow} alt="Loop" />
        <CancelButton type="button" onClick={onCancel}>
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
          ) : currentStep.kind === 'group' ? (
            <Section>
              <SectionHeading>
                <div>
                  <SectionTitle>Choose {currentStep.group.name}</SectionTitle>
                  <SectionCopy>
                    {currentStep.group.requirement === 'mandatory'
                      ? currentStep.group.selectMode === 'single'
                        ? 'Pick one cover to continue.'
                        : 'Pick at least one cover to continue.'
                      : currentStep.group.selectMode === 'single'
                        ? 'Optional — pick one cover or skip this step.'
                        : 'Optional — pick any covers that apply, or skip this step.'}
                  </SectionCopy>
                </div>
                {(recommendedSelections[currentStep.group.id] ?? []).length >
                0 ? (
                  <Badge>Auto assigned</Badge>
                ) : null}
              </SectionHeading>
              <PlanList>
                {currentStep.group.options.map((option) => {
                  const status = eligibility?.options[option.id]
                  const disabled = status?.eligible === false
                  const selected = (
                    selections[currentStep.group.id] ?? []
                  ).includes(option.id)
                  const plan = option.planId
                    ? deal.plans.find((item) => item.id === option.planId)
                    : null
                  const benefit = option.benefitId
                    ? getBenefitConfig(deal, option.benefitId)
                    : null
                  const covers = plan
                    ? plan.benefitIds
                        .map((id) => getBenefitConfig(deal, id)?.name ?? id)
                        .join(' · ')
                    : (benefit?.policyName ?? benefit?.name ?? '')
                  return (
                    <PlanCard
                      key={option.id}
                      type="button"
                      $selected={selected}
                      disabled={disabled}
                      onClick={() =>
                        toggleOption(currentStep.group, option.id)
                      }
                    >
                      {currentStep.group.selectMode === 'single' ? (
                        <Radio $selected={selected} />
                      ) : (
                        <Checkbox $selected={selected} />
                      )}
                      <PlanCopy>
                        <PlanName>{option.label}</PlanName>
                        <PlanMeta>{covers}</PlanMeta>
                        {disabled ? (
                          <PlanError>{status?.reason}</PlanError>
                        ) : null}
                      </PlanCopy>
                      {plan ? (
                        <PlanLimit>
                          Up to {plan.maxDependants} dependants
                        </PlanLimit>
                      ) : benefit ? (
                        <PlanLimit>{benefit.insurerName}</PlanLimit>
                      ) : null}
                    </PlanCard>
                  )
                })}
              </PlanList>
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
                {!familySummary.allSlotsConsumed &&
                familySummary.addableRelationships.length > 0 ? (
                  <OutlineButton
                    type="button"
                    onClick={() => {
                      const relationship =
                        familySummary.addableRelationships[0]
                      const dependant = emptyDependantForm(nextDependantId())
                      dependant.relationship = relationship
                      dependant.selectedBenefitIds =
                        availableBenefitsForRelationship(
                          familySummary,
                          relationship,
                        )
                      setDependants((current) => [...current, dependant])
                    }}
                  >
                    + Add dependant
                  </OutlineButton>
                ) : null}
              </SectionHeading>
              <DependantSlotSelector
                summary={familySummary}
                benefitLabels={benefitLabels}
              />
              {dependants.length === 0 ? (
                <EmptyNotice>
                  Adding dependants is optional. Save to return to the employee
                  list.
                </EmptyNotice>
              ) : (
                <DependantList>
                  {dependants.map((dependant, index) => (
                    <DependantCard key={dependant.id}>
                      <DependantHeader>
                        <strong>Dependant {index + 1}</strong>
                        <RemoveButton
                          type="button"
                          onClick={() =>
                            setDependants((current) =>
                              current.filter((item) => item.id !== dependant.id),
                            )
                          }
                        >
                          Remove
                        </RemoveButton>
                      </DependantHeader>
                      <DependantGrid>
                        <FieldBlock>
                          <Label id={`${dependant.id}-relationship-label`}>
                            Relationship<Required>*</Required>
                          </Label>
                          <SelectField
                            ariaLabelledBy={`${dependant.id}-relationship-label`}
                            value={dependant.relationship}
                            placeholder="Select relationship"
                            options={[
                              ...familySummary.addableRelationships,
                              ...(dependant.relationship &&
                              dependant.relationship !== 'Self'
                                ? [dependant.relationship]
                                : []),
                            ]
                              .filter(
                                (relationship, relationIndex, all) =>
                                  all.indexOf(relationship) === relationIndex,
                              )
                              .map((relationship) => ({
                                value: relationship,
                                label: relationship,
                              }))}
                            onChange={(value) => {
                              const relationship = value as Relationship
                              updateDependant(dependant.id, {
                                relationship,
                                selectedBenefitIds:
                                  availableBenefitsForRelationship(
                                    familySummary,
                                    relationship,
                                  ),
                                customAttributes: {},
                              })
                            }}
                          />
                        </FieldBlock>
                        <Field>
                          <Label>First Name<Required>*</Required></Label>
                          <Input
                            value={dependant.firstName}
                            onChange={(event) =>
                              updateDependant(dependant.id, {
                                firstName: event.target.value,
                              })
                            }
                          />
                        </Field>
                        <Field>
                          <Label>Last Name</Label>
                          <Input
                            value={dependant.lastName}
                            onChange={(event) =>
                              updateDependant(dependant.id, {
                                lastName: event.target.value,
                              })
                            }
                          />
                        </Field>
                        <Field>
                          <Label>Date of Birth<Required>*</Required></Label>
                          <Input
                            type="date"
                            value={dependant.dateOfBirth}
                            onChange={(event) =>
                              updateDependant(dependant.id, {
                                dateOfBirth: event.target.value,
                              })
                            }
                          />
                        </Field>
                        <FieldBlock>
                          <Label id={`${dependant.id}-gender-label`}>
                            Gender<Required>*</Required>
                          </Label>
                          <SelectField
                            ariaLabelledBy={`${dependant.id}-gender-label`}
                            value={dependant.gender}
                            placeholder="Select gender"
                            options={[
                              { value: 'Male', label: 'Male' },
                              { value: 'Female', label: 'Female' },
                              { value: 'Other', label: 'Other' },
                            ]}
                            onChange={(value) =>
                              updateDependant(dependant.id, {
                                gender: value as Gender,
                              })
                            }
                          />
                        </FieldBlock>
                      </DependantGrid>
                    </DependantCard>
                  ))}
                </DependantList>
              )}
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
                  : currentStep.kind === 'group'
                    ? !isGroupValid(currentStep.group)
                    : !dependantsValid
              }
              onClick={() => {
                if (!isLastStep) {
                  // Carry the rule-assigned covers in so each group opens
                  // pre-filled with what the employee already qualifies for.
                  if (currentStep.kind === 'details') {
                    setSelections((current) => {
                      const next = { ...current }
                      for (const group of deal.purchaseGroups) {
                        if ((next[group.id] ?? []).length > 0) continue
                        const recommended = recommendedSelections[group.id]
                        if (recommended?.length) next[group.id] = recommended
                      }
                      return next
                    })
                  }
                  setStepIndex(activeIndex + 1)
                  return
                }
                if (!dependantsValid) return
                const matchesRecommendation = deal.purchaseGroups.every(
                  (group) => {
                    const chosen = [...(selections[group.id] ?? [])].sort()
                    const suggested = [
                      ...(recommendedSelections[group.id] ?? []),
                    ].sort()
                    return (
                      chosen.length === suggested.length &&
                      chosen.every((id, index) => id === suggested[index])
                    )
                  },
                )
                onSave({
                  employee,
                  planId,
                  purchaseGroupSelections: selections,
                  assignmentSource:
                    matchesRecommendation && recommendation
                      ? recommendation.source
                      : 'manual',
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

const Page = styled.div`
  position: fixed;
  inset: 0;
  z-index: 250;
  overflow-y: auto;
  padding: 36px 48px 48px;
  background: ${({ theme }) => theme.colors.surface0};
  box-sizing: border-box;
`

const GreenBackdrop = styled.div`
  position: absolute;
  inset: 0 0 auto;
  height: 227px;
  background: ${({ theme }) => theme.colors.emerald};
`

const Header = styled.header`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1344px;
  height: 36px;
  margin: 0 auto 36px;
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
`

const Rail = styled.ol`
  width: 360px;
  flex-shrink: 0;
  margin: 0;
  padding: 32px;
  background: #fafbfb;
  box-sizing: border-box;
  list-style: none;

  @media (max-width: 900px) {
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

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
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

const PlanList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const PlanCard = styled.button<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 16px;
  border: 1.5px solid
    ${({ theme, $selected }) =>
      $selected ? theme.colors.emerald : theme.colors.defaultBorder};
  border-radius: 12px;
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.planeGreenLight : theme.colors.surface1};
  font-family: ${({ theme }) => theme.fontFamily};
  text-align: left;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const Radio = styled.span<{ $selected: boolean }>`
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border: 2px solid
    ${({ theme, $selected }) =>
      $selected ? theme.colors.emerald : theme.colors.defaultBorder};
  border-radius: 50%;
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.emerald : theme.colors.surface1};
  box-shadow: ${({ theme, $selected }) =>
    $selected ? `inset 0 0 0 4px ${theme.colors.surface1}` : 'none'};
`

const Checkbox = styled.span<{ $selected: boolean }>`
  position: relative;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border: 2px solid
    ${({ theme, $selected }) =>
      $selected ? theme.colors.emerald : theme.colors.defaultBorder};
  border-radius: 5px;
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.emerald : theme.colors.surface1};

  &::after {
    content: '';
    position: absolute;
    top: 1px;
    left: 4px;
    width: 4px;
    height: 8px;
    border: solid ${({ theme }) => theme.colors.surface1};
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
    opacity: ${({ $selected }) => ($selected ? 1 : 0)};
  }
`

const PlanCopy = styled.span`
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 3px;
`

const PlanName = styled.strong`
  font-size: 15px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const PlanMeta = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const PlanError = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textError};
`

const PlanLimit = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const OutlineButton = styled.button`
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.emerald};
  border-radius: 8px;
  background: transparent;
  color: ${({ theme }) => theme.colors.emerald};
  font-family: ${({ theme }) => theme.fontFamily};
  font-weight: 600;
  cursor: pointer;
`

const EmptyNotice = styled.div`
  padding: 18px;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.surface0};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
`

const DependantList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const DependantCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: 12px;
`

const DependantHeader = styled.div`
  display: flex;
  justify-content: space-between;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 14px;
`

const RemoveButton = styled.button`
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.textError};
  cursor: pointer;
`

const DependantGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
`

const Footer = styled.footer`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  margin-top: auto;
  padding-top: 24px;
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
