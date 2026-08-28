import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'

import { assets } from '@/assets/figma'
import {
  DEPENDANT_RELATIONSHIP_OPTIONS,
  emptyDependantForm,
  GENDER_OPTIONS,
  sampleEmployees,
  type DependantFormData,
  type Relationship,
} from '@/data/employees'
import {
  defaultDependantBenefitIds,
  getAvailableDependantCategories,
  getDependantCoverOptions,
} from '@/data/flexDeal'
import { FlowStepper, WizardChrome } from '@/pages/LivesWizard/WizardChrome'
import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'
import { SINGLE_ADD_STEPS } from '@/pages/LivesWizard/singleAddSteps'
import { ExistingEmployeeDependantStep } from '@/pages/LivesWizard/steps/ExistingEmployeeDependantStep'

type ParentMode = 'parents' | 'parents-in-law'

function byRelationship(
  dependants: DependantFormData[],
  relationship: Relationship,
) {
  return dependants.filter((d) => d.relationship === relationship)
}

function SingleAddDependantDetails() {
  const navigate = useNavigate()
  const {
    addDependants,
    setAddDependants,
    dependants,
    setDependants,
    updateDependant,
    removeDependant,
    resolvedAssignment,
    setStep,
  } = useLivesWizard()

  const [editingId, setEditingId] = useState<string | null>(null)

  const categories = getAvailableDependantCategories(resolvedAssignment)
  const showSpouse = categories.includes('Spouse')
  const showChild = categories.includes('Child')
  const showParent = categories.includes('Parent')

  const spouses = byRelationship(dependants, 'Spouse')
  const kids = byRelationship(dependants, 'Child')
  const parents = byRelationship(dependants, 'Parent')
  const parentsInLaw = byRelationship(dependants, 'Parent-in-law')

  const parentMode: ParentMode =
    parentsInLaw.length > 0 && parents.length === 0
      ? 'parents-in-law'
      : 'parents'
  const activeParents = parentMode === 'parents' ? parents : parentsInLaw
  const parentRelationship: Relationship =
    parentMode === 'parents' ? 'Parent' : 'Parent-in-law'

  const editingDependant =
    dependants.find((d) => d.id === editingId) ?? null

  const chooseAddDependants = (value: boolean) => {
    setAddDependants(value)
    if (!value) {
      setDependants([])
      setEditingId(null)
    }
  }

  const openNew = (relationship: Relationship) => {
    const id = `dep-${relationship}-${Date.now()}`
    setDependants([
      ...dependants,
      {
        ...emptyDependantForm(id),
        relationship,
        selectedBenefitIds: defaultDependantBenefitIds(
          relationship,
          '',
          resolvedAssignment,
        ),
      },
    ])
    setEditingId(id)
  }

  const setParentMode = (mode: ParentMode) => {
    const nextRel: Relationship =
      mode === 'parents' ? 'Parent' : 'Parent-in-law'
    const otherRel: Relationship =
      mode === 'parents' ? 'Parent-in-law' : 'Parent'
    const kept = dependants.filter((d) => d.relationship !== otherRel)
    const converted = dependants
      .filter((d) => d.relationship === otherRel)
      .map((d) => ({
        ...d,
        relationship: nextRel,
        selectedBenefitIds: defaultDependantBenefitIds(
          nextRel,
          d.dateOfBirth,
          resolvedAssignment,
        ),
      }))
    setDependants([
      ...kept.filter((d) => d.relationship !== nextRel),
      ...converted,
    ])
  }

  const handleRemove = (id: string) => {
    removeDependant(id)
    if (editingId === id) setEditingId(null)
  }

  const formsValid =
    dependants.length > 0 &&
    dependants.every((d) => {
      const covers = getDependantCoverOptions(
        d.relationship || '',
        d.dateOfBirth,
        resolvedAssignment,
      )
      const selectable = covers.filter((c) => c.status.eligible)
      const selectedOk =
        selectable.length === 0 ||
        (d.selectedBenefitIds ?? []).some((id) =>
          selectable.some((c) => c.id === id),
        )
      return (
        Boolean(d.firstName.trim()) &&
        Boolean(d.gender) &&
        Boolean(d.dateOfBirth) &&
        Boolean(d.relationship) &&
        selectedOk
      )
    })

  const canProceed =
    addDependants === false || (addDependants === true && formsValid)

  const noCategories =
    addDependants === true && categories.length === 0

  return (
    <WizardChrome
      title="Add dependants"
      onBack={() => setStep('selection')}
      onExit={() => navigate('/endorsements')}
      secondaryLabel="Back"
      onSecondary={() => setStep('selection')}
      primaryLabel="Proceed"
      primaryDisabled={!canProceed || noCategories || Boolean(editingId)}
      onPrimary={() => {
        if (addDependants === false) {
          setDependants([])
        }
        setStep('verify')
      }}
    >
      <FlowStepper steps={[...SINGLE_ADD_STEPS]} activeIndex={2} bare />

      <Sheet>
        <DependantsQuestion>
          Do you want to add the dependants of this employee?
          <span>*</span>
        </DependantsQuestion>
        <RadioRow>
          <RadioOption $active={addDependants === true}>
            <Radio
              type="radio"
              name="add-dependants"
              checked={addDependants === true}
              onChange={() => chooseAddDependants(true)}
            />
            <span>Yes</span>
          </RadioOption>
          <RadioOption $active={addDependants === false}>
            <Radio
              type="radio"
              name="add-dependants"
              checked={addDependants === false}
              onChange={() => chooseAddDependants(false)}
            />
            <span>No</span>
          </RadioOption>
        </RadioRow>

        {addDependants === true ? (
          <>
            {categories.length === 0 ? (
              <EmptyEligible>
                None of the selected benefits support dependants. Go back to
                Select Benefit to include family covers, or choose No.
              </EmptyEligible>
            ) : (
              <>
                <Hint>
                  Click Add to open the dependant details panel from the right.
                  Eligible benefits are selected by default.
                </Hint>

                {showSpouse ? (
                  <CategoryBlock>
                    <CategoryTitle>Your spouse</CategoryTitle>
                    <AddRow>
                      {spouses.map((dependant) => (
                        <SummaryCard
                          key={dependant.id}
                          dependant={dependant}
                          assignment={resolvedAssignment}
                          onEdit={() => setEditingId(dependant.id)}
                          onRemove={() => handleRemove(dependant.id)}
                        />
                      ))}
                      {spouses.length < 1 ? (
                        <AddCard
                          type="button"
                          onClick={() => openNew('Spouse')}
                        >
                          <PlusIcon
                            src={assets.iconAddDependant}
                            alt=""
                            width={20}
                            height={20}
                          />
                          Add Spouse
                        </AddCard>
                      ) : null}
                    </AddRow>
                  </CategoryBlock>
                ) : null}

                {showChild ? (
                  <CategoryBlock>
                    <CategoryHeading>
                      <CategoryTitle>2 Kids</CategoryTitle>
                      <CategoryHint>
                        This insures 2 kids, with maximum age of 25 years.
                      </CategoryHint>
                    </CategoryHeading>
                    <AddRow>
                      {kids.map((dependant) => (
                        <SummaryCard
                          key={dependant.id}
                          dependant={dependant}
                          assignment={resolvedAssignment}
                          onEdit={() => setEditingId(dependant.id)}
                          onRemove={() => handleRemove(dependant.id)}
                        />
                      ))}
                      {Array.from({
                        length: Math.max(0, 2 - kids.length),
                      }).map((_, index) => (
                        <AddCard
                          key={`kid-slot-${index}`}
                          type="button"
                          onClick={() => openNew('Child')}
                        >
                          <PlusIcon
                            src={assets.iconAddDependant}
                            alt=""
                            width={20}
                            height={20}
                          />
                          Add Kid
                        </AddCard>
                      ))}
                    </AddRow>
                  </CategoryBlock>
                ) : null}

                {showParent ? (
                  <CategoryBlock>
                    <CategoryHeading>
                      <CategoryTitle>2 Parents or Parents-in-law</CategoryTitle>
                      <CategoryHint>
                        This insures 2 Parents or Parents-in-law, with maximum
                        age of 85 years.
                      </CategoryHint>
                    </CategoryHeading>
                    <RadioRow>
                      <RadioOption $active={parentMode === 'parents'}>
                        <Radio
                          type="radio"
                          name="parent-mode"
                          checked={parentMode === 'parents'}
                          onChange={() => setParentMode('parents')}
                        />
                        <span>Insure Parents</span>
                      </RadioOption>
                      <RadioOption $active={parentMode === 'parents-in-law'}>
                        <Radio
                          type="radio"
                          name="parent-mode"
                          checked={parentMode === 'parents-in-law'}
                          onChange={() => setParentMode('parents-in-law')}
                        />
                        <span>Insure parents-in-law</span>
                      </RadioOption>
                    </RadioRow>
                    <AddRow>
                      {activeParents.map((dependant) => (
                        <SummaryCard
                          key={dependant.id}
                          dependant={dependant}
                          assignment={resolvedAssignment}
                          onEdit={() => setEditingId(dependant.id)}
                          onRemove={() => handleRemove(dependant.id)}
                        />
                      ))}
                      {Array.from({
                        length: Math.max(0, 2 - activeParents.length),
                      }).map((_, index) => (
                        <AddCard
                          key={`parent-slot-${index}`}
                          type="button"
                          onClick={() => openNew(parentRelationship)}
                        >
                          <PlusIcon
                            src={assets.iconAddDependant}
                            alt=""
                            width={20}
                            height={20}
                          />
                          Add Parents
                        </AddCard>
                      ))}
                    </AddRow>
                  </CategoryBlock>
                ) : null}
              </>
            )}
          </>
        ) : null}
      </Sheet>

      {editingDependant ? (
        <DependantDrawer
          dependant={editingDependant}
          assignment={resolvedAssignment}
          onChange={updateDependant}
          onClose={() => setEditingId(null)}
          onRemove={() => handleRemove(editingDependant.id)}
        />
      ) : null}
    </WizardChrome>
  )
}

function SummaryCard({
  dependant,
  assignment,
  onEdit,
  onRemove,
}: {
  dependant: DependantFormData
  assignment: { policyIds: string[]; benefitIds: string[] }
  onEdit: () => void
  onRemove: () => void
}) {
  const name =
    `${dependant.firstName} ${dependant.lastName}`.trim() || 'Details pending'
  const selectedIds = dependant.selectedBenefitIds ?? []
  const covers = getDependantCoverOptions(
    dependant.relationship || '',
    dependant.dateOfBirth,
    assignment,
  )
  const selectedCovers = covers.filter((cover) => selectedIds.includes(cover.id))

  return (
    <Summary>
      <SummaryMain type="button" onClick={onEdit}>
        <SummaryTitle>{dependant.relationship}</SummaryTitle>
        <SummaryMeta>{name}</SummaryMeta>
        {selectedCovers.length > 0 ? (
          <SummaryBenefits>
            {selectedCovers.map((cover) => (
              <SummaryBenefitChip key={cover.id}>
                {cover.label}
              </SummaryBenefitChip>
            ))}
          </SummaryBenefits>
        ) : (
          <SummaryMeta>No benefits selected</SummaryMeta>
        )}
      </SummaryMain>
      <SummaryActions>
        <SummaryEdit type="button" onClick={onEdit}>
          Edit
        </SummaryEdit>
        <RemoveBtn type="button" onClick={onRemove}>
          Remove
        </RemoveBtn>
      </SummaryActions>
    </Summary>
  )
}

function DependantDrawer({
  dependant,
  assignment,
  onChange,
  onClose,
  onRemove,
}: {
  dependant: DependantFormData
  assignment: { policyIds: string[]; benefitIds: string[] }
  onChange: (id: string, patch: Partial<DependantFormData>) => void
  onClose: () => void
  onRemove: () => void
}) {
  const covers = useMemo(
    () =>
      getDependantCoverOptions(
        dependant.relationship || '',
        dependant.dateOfBirth,
        assignment,
      ),
    [assignment, dependant.dateOfBirth, dependant.relationship],
  )

  const eligibleCovers = covers.filter((c) => c.status.eligible)
  const ineligibleCovers = covers.filter((c) => !c.status.eligible)
  const selected = dependant.selectedBenefitIds ?? []
  const availableToAdd = eligibleCovers.filter((c) => !selected.includes(c.id))
  const enrolled = eligibleCovers.filter((c) => selected.includes(c.id))

  useEffect(() => {
    const eligibleIds = defaultDependantBenefitIds(
      dependant.relationship || '',
      dependant.dateOfBirth,
      assignment,
    )
    const current = dependant.selectedBenefitIds ?? []
    const pruned = current.filter((id) => eligibleIds.includes(id))

    let next = pruned
    if (current.length === 0 && eligibleIds.length > 0) {
      next = eligibleIds
    }

    if (
      next.length !== current.length ||
      next.some((id, index) => id !== current[index])
    ) {
      onChange(dependant.id, { selectedBenefitIds: next })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    assignment,
    dependant.dateOfBirth,
    dependant.id,
    dependant.relationship,
    onChange,
  ])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const toggleBenefit = (coverId: string) => {
    const current = dependant.selectedBenefitIds ?? []
    const next = current.includes(coverId)
      ? current.filter((id) => id !== coverId)
      : [...current, coverId]
    onChange(dependant.id, { selectedBenefitIds: next })
  }

  const canSave =
    Boolean(dependant.firstName.trim()) &&
    Boolean(dependant.gender) &&
    Boolean(dependant.dateOfBirth)

  return (
    <DrawerOverlay role="presentation" onClick={onClose}>
      <DrawerPanel
        role="dialog"
        aria-modal="true"
        aria-label={`${dependant.relationship} details`}
        onClick={(e) => e.stopPropagation()}
      >
        <DrawerHeader>
          <DrawerTitle>{dependant.relationship} details</DrawerTitle>
          <DrawerClose type="button" onClick={onClose} aria-label="Close">
            <img src={assets.modalDismiss} alt="" width={24} height={24} />
          </DrawerClose>
        </DrawerHeader>

        <DrawerBody>
          <FilledGrid>
            <Field>
              <Label>
                First Name<span>*</span>
              </Label>
              <Input
                value={dependant.firstName}
                placeholder="Enter Here"
                onChange={(e) =>
                  onChange(dependant.id, { firstName: e.target.value })
                }
              />
            </Field>
            <Field>
              <Label>Last Name</Label>
              <Input
                value={dependant.lastName}
                placeholder="Enter Here"
                onChange={(e) =>
                  onChange(dependant.id, { lastName: e.target.value })
                }
              />
            </Field>
            <Field>
              <Label>
                Gender<span>*</span>
              </Label>
              <SelectWrap>
                <Select
                  value={dependant.gender}
                  onChange={(e) =>
                    onChange(dependant.id, {
                      gender: e.target.value as typeof dependant.gender,
                    })
                  }
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </Select>
                <SelectChevron
                  src={assets.chevronDown}
                  alt=""
                  width={24}
                  height={24}
                  aria-hidden
                />
              </SelectWrap>
            </Field>
            <Field>
              <Label>
                Date of Birth<span>*</span>
              </Label>
              <DateWrap>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter Date (DD/MM/YYYY)"
                  value={dependant.dateOfBirth}
                  onChange={(e) =>
                    onChange(dependant.id, { dateOfBirth: e.target.value })
                  }
                />
                <DateIcon
                  src={assets.iconCalendar24}
                  alt=""
                  width={24}
                  height={24}
                  aria-hidden
                />
              </DateWrap>
            </Field>
          </FilledGrid>

          <BenefitsBlock>
            <BenefitsTitle>Benefits</BenefitsTitle>
            {covers.length === 0 ? (
              <BenefitsEmpty>
                No covers in the employee’s current benefit selection.
              </BenefitsEmpty>
            ) : (
              <>
                {enrolled.length > 0 ? (
                  <BenefitGroup>
                    <BenefitGroupLabel>Added by default</BenefitGroupLabel>
                    <BenefitList>
                      {enrolled.map((cover) => (
                        <BenefitOption
                          key={cover.id}
                          type="button"
                          $selected
                          $disabled={false}
                          onClick={() => toggleBenefit(cover.id)}
                        >
                          <BenefitCheck $selected>✓</BenefitCheck>
                          <BenefitCopy>
                            <BenefitName>{cover.label}</BenefitName>
                            <BenefitMeta>
                              {cover.kind === 'policy' ? 'Policy' : 'Benefit'} ·{' '}
                              {cover.meta}
                            </BenefitMeta>
                          </BenefitCopy>
                        </BenefitOption>
                      ))}
                    </BenefitList>
                  </BenefitGroup>
                ) : null}

                {availableToAdd.length > 0 ? (
                  <BenefitGroup>
                    <BenefitGroupLabel>Available to add</BenefitGroupLabel>
                    <BenefitList>
                      {availableToAdd.map((cover) => (
                        <BenefitOption
                          key={cover.id}
                          type="button"
                          $selected={false}
                          $disabled={false}
                          onClick={() => toggleBenefit(cover.id)}
                        >
                          <BenefitCheck $selected={false} />
                          <BenefitCopy>
                            <BenefitName>{cover.label}</BenefitName>
                            <BenefitMeta>
                              {cover.kind === 'policy' ? 'Policy' : 'Benefit'} ·{' '}
                              {cover.meta}
                            </BenefitMeta>
                          </BenefitCopy>
                        </BenefitOption>
                      ))}
                    </BenefitList>
                  </BenefitGroup>
                ) : null}

                {ineligibleCovers.length > 0 ? (
                  <BenefitGroup>
                    <BenefitGroupLabel>Not eligible</BenefitGroupLabel>
                    <BenefitList>
                      {ineligibleCovers.map((cover) => (
                        <BenefitOption
                          key={cover.id}
                          type="button"
                          $selected={false}
                          $disabled
                          disabled
                          title={cover.status.reason}
                        >
                          <BenefitCheck $selected={false} />
                          <BenefitCopy>
                            <BenefitName>{cover.label}</BenefitName>
                            <BenefitMeta>
                              {cover.kind === 'policy' ? 'Policy' : 'Benefit'} ·{' '}
                              {cover.meta}
                            </BenefitMeta>
                            {cover.status.reason ? (
                              <BenefitReason>
                                {cover.status.reason}
                              </BenefitReason>
                            ) : null}
                          </BenefitCopy>
                        </BenefitOption>
                      ))}
                    </BenefitList>
                  </BenefitGroup>
                ) : null}
              </>
            )}
          </BenefitsBlock>
        </DrawerBody>

        <DrawerFooter>
          <RemoveBtn type="button" onClick={onRemove}>
            Remove
          </RemoveBtn>
          <DrawerActions>
            <DrawerSecondary type="button" onClick={onClose}>
              Cancel
            </DrawerSecondary>
            <DrawerPrimary
              type="button"
              disabled={!canSave}
              onClick={onClose}
            >
              Save
            </DrawerPrimary>
          </DrawerActions>
        </DrawerFooter>
      </DrawerPanel>
    </DrawerOverlay>
  )
}

function formatDisplayDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return value || '—'
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  return `${Number(match[3])} ${months[Number(match[2]) - 1]} ${match[1]}`
}

function SingleDependantDetailsLegacy() {
  const navigate = useNavigate()
  const {
    dependants,
    updateDependant,
    addDependant,
    removeDependant,
    selectedEmployeeId,
    maxDependants,
    setStep,
  } = useLivesWizard()

  const selectedEmployee = sampleEmployees.find(
    (e) => e.id === selectedEmployeeId,
  )
  const existingDependants = selectedEmployee?.dependants ?? []
  const remainingSlots = Math.max(
    0,
    maxDependants - existingDependants.length,
  )

  const canProceed =
    remainingSlots > 0 &&
    dependants.length > 0 &&
    dependants.length <= remainingSlots &&
    dependants.every(
      (d) =>
        d.firstName.trim() && d.gender && d.dateOfBirth && d.relationship,
    )

  return (
    <WizardChrome
      title="Add Dependant Details"
      onBack={() => setStep('search-employee')}
      onExit={() => navigate('/endorsements')}
      secondaryLabel="Back"
      onSecondary={() => setStep('search-employee')}
      primaryLabel="Proceed"
      primaryDisabled={!canProceed}
      onPrimary={() => {
        const plans =
          selectedEmployee?.plans.filter((p) => p.category === 'gmc') ?? []
        if (plans.length <= 1) {
          setStep('verify')
        } else {
          setStep('dependant-plan')
        }
      }}
    >
      <FlowStepper
        steps={['Search Employee', 'Dependant Details', 'Plan', 'Review Cost']}
        activeIndex={1}
        bare
      />

      {selectedEmployee ? (
        <EmployeeBanner>
          Adding dependant for{' '}
          <strong>
            {selectedEmployee.firstName} {selectedEmployee.lastName}
          </strong>{' '}
          ({selectedEmployee.employeeId})
        </EmployeeBanner>
      ) : null}

      {existingDependants.length > 0 ? (
        <ExistingBlock>
          <ExistingHeading>
            <CategoryTitle>Existing dependants</CategoryTitle>
            <CategoryHint>
              Already enrolled on this employee’s cover. New additions count
              toward the remaining {remainingSlots} of {maxDependants} slots.
            </CategoryHint>
          </ExistingHeading>
          <ExistingList>
            {existingDependants.map((dependant) => (
              <ExistingCard key={dependant.id}>
                <ExistingBadge>Enrolled</ExistingBadge>
                <SummaryTitle>{dependant.relationship}</SummaryTitle>
                <ExistingName>
                  {dependant.firstName} {dependant.lastName}
                </ExistingName>
                <SummaryMeta>
                  {dependant.gender} · DOB {formatDisplayDate(dependant.dateOfBirth)}
                </SummaryMeta>
                {dependant.mobile || dependant.email ? (
                  <SummaryMeta>
                    {[dependant.mobile, dependant.email]
                      .filter(Boolean)
                      .join(' · ')}
                  </SummaryMeta>
                ) : null}
              </ExistingCard>
            ))}
          </ExistingList>
        </ExistingBlock>
      ) : (
        <Hint>This employee has no dependants enrolled yet.</Hint>
      )}

      {remainingSlots > 0 ? (
        <Hint>
          Add a new dependant below. You can add up to {remainingSlots} more
          (family definition allows {maxDependants} in total).
        </Hint>
      ) : null}

      {remainingSlots > 0
        ? dependants.map((dependant, index) => (
        <Card key={dependant.id}>
          <CardHeader>
            <CardTitle>Dependant {index + 1}</CardTitle>
            {dependants.length > 1 ? (
              <Remove
                type="button"
                onClick={() => removeDependant(dependant.id)}
              >
                Remove
              </Remove>
            ) : null}
          </CardHeader>
          <Grid>
            <Field>
              <Label>
                First Name<span>*</span>
              </Label>
              <Input
                value={dependant.firstName}
                placeholder="Enter Here"
                onChange={(e) =>
                  updateDependant(dependant.id, { firstName: e.target.value })
                }
              />
            </Field>
            <Field>
              <Label>Last Name</Label>
              <Input
                value={dependant.lastName}
                placeholder="Enter Here"
                onChange={(e) =>
                  updateDependant(dependant.id, { lastName: e.target.value })
                }
              />
            </Field>
            <Field>
              <Label>
                Gender<span>*</span>
              </Label>
              <Select
                value={dependant.gender}
                onChange={(e) =>
                  updateDependant(dependant.id, {
                    gender: e.target.value as typeof dependant.gender,
                  })
                }
              >
                <option value="">Select</option>
                {GENDER_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              <Label>
                Date of Birth<span>*</span>
              </Label>
              <Input
                type="date"
                value={dependant.dateOfBirth}
                onChange={(e) =>
                  updateDependant(dependant.id, {
                    dateOfBirth: e.target.value,
                  })
                }
              />
            </Field>
            <Field>
              <Label>
                Relationship<span>*</span>
              </Label>
              <Select
                value={dependant.relationship}
                onChange={(e) =>
                  updateDependant(dependant.id, {
                    relationship: e.target
                      .value as typeof dependant.relationship,
                  })
                }
              >
                <option value="">Select</option>
                {DEPENDANT_RELATIONSHIP_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </Field>
          </Grid>
        </Card>
      ))
        : null}

      {dependants.length < remainingSlots ? (
        <AddButton type="button" onClick={addDependant}>
          + Add another dependant
        </AddButton>
      ) : remainingSlots === 0 ? (
        <Hint>
          This employee already has the maximum number of dependants allowed
          on the selected covers.
        </Hint>
      ) : null}
    </WizardChrome>
  )
}

export function DependantDetailsStep() {
  // Keep the prior form implementation compiled as a fallback while the
  // configuration-driven flow is exercised with the same route and entry step.
  void SingleDependantDetailsLegacy
  const { method, action } = useLivesWizard()
  const isSingleDependant = method === 'single-dependant' && action === 'add'
  if (isSingleDependant) return <ExistingEmployeeDependantStep />
  return <SingleAddDependantDetails />
}

const Sheet = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  padding: 24px;
  background: ${({ theme }) => theme.colors.surface1};
  border-radius: 16px;
  box-sizing: border-box;
`

const DependantsQuestion = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};

  span {
    color: ${({ theme }) => theme.colors.textError};
  }
`

const RadioRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
`

const RadioOption = styled.label<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1.5px solid
    ${({ theme, $active }) =>
      $active ? theme.colors.emerald : theme.colors.defaultBorder};
  background: ${({ theme, $active }) =>
    $active ? theme.colors.planeGreenLight : theme.colors.surface1};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
`

const Radio = styled.input`
  accent-color: ${({ theme }) => theme.colors.emerald};
`

const Hint = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const EmptyEligible = styled.p`
  margin: 0;
  padding: 12px 14px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.disableFill};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const CategoryBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const CategoryHeading = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const CategoryTitle = styled.h3`
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.beyondGrey};
`

const CategoryHint = styled.p`
  margin: 0;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const AddRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 720px;
`

const AddCard = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 100%;
  height: 80px;
  padding: 16px;
  border: 1.5px dashed ${({ theme }) => theme.colors.emerald};
  border-radius: 12px;
  background: transparent;
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.emerald};
  cursor: pointer;
`

const PlusIcon = styled.img`
  display: block;
`

const Summary = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  background: ${({ theme }) => theme.colors.surface1};
  box-sizing: border-box;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
  }
`

const SummaryMain = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  min-width: 0;
  flex: 1;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  text-align: left;
`

const SummaryTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.beyondGrey};
`

const SummaryMeta = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const SummaryBenefits = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 2px;
`

const SummaryBenefitChip = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.colors.planeGreenLight};
  background: ${({ theme }) => theme.colors.planeGreenLight};
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  color: ${({ theme }) => theme.colors.emerald};
`

const SummaryActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: 100%;
    justify-content: flex-end;
  }
`

const SummaryEdit = styled.button`
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.emerald};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
`

const RemoveBtn = styled.button`
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.textError};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 13px;
  cursor: pointer;
`

const slideIn = keyframes`
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
`

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`

const DrawerOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  justify-content: flex-end;
  background: rgba(45, 55, 72, 0.45);
  animation: ${fadeIn} 180ms ease-out;
`

const DrawerPanel = styled.div`
  display: flex;
  flex-direction: column;
  width: min(480px, 100%);
  height: 100%;
  background: ${({ theme }) => theme.colors.surface1};
  box-shadow: -8px 0 32px rgba(16, 24, 40, 0.12);
  animation: ${slideIn} 220ms ease-out;
`

const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.disableFill};
  flex-shrink: 0;
`

const DrawerTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  line-height: 24px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const DrawerClose = styled.button`
  border: none;
  background: transparent;
  padding: 0;
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: grid;
  place-items: center;
`

const DrawerBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  flex: 1;
  overflow-y: auto;
  padding: 24px;
`

const DrawerFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 24px;
  border-top: 1px solid ${({ theme }) => theme.colors.disableFill};
  flex-shrink: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    align-items: stretch;
    flex-direction: column;
    padding: 12px 16px max(12px, env(safe-area-inset-bottom));
  }
`

const DrawerActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: 100%;

    > * {
      min-width: 0;
      flex: 1;
    }
  }
`

const DrawerSecondary = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 96px;
  height: 40px;
  padding: 0 16px;
  border: 1px solid ${({ theme }) => theme.colors.emerald};
  border-radius: ${({ theme }) => theme.radii.md};
  background: transparent;
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.emerald};
  cursor: pointer;
`

const DrawerPrimary = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 96px;
  height: 40px;
  padding: 0 16px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.fillGreen};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.emerald};
  cursor: pointer;

  &:disabled {
    background: ${({ theme }) => theme.colors.disableFill};
    color: ${({ theme }) => theme.colors.textSecondary};
    cursor: not-allowed;
  }
`

const FilledGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`

const BenefitsBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 4px;
  border-top: 1px solid ${({ theme }) => theme.colors.disableFill};
`

const BenefitsTitle = styled.h5`
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.beyondGrey};
`

const BenefitsEmpty = styled.p`
  margin: 0;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const BenefitGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const BenefitGroupLabel = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const BenefitList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const BenefitOption = styled.button<{ $selected: boolean; $disabled: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid
    ${({ theme, $selected, $disabled }) =>
      $disabled
        ? theme.colors.disableFill
        : $selected
          ? theme.colors.emerald
          : theme.colors.defaultBorder};
  background: ${({ theme, $selected, $disabled }) =>
    $disabled
      ? theme.colors.disableFill
      : $selected
        ? theme.colors.planeGreenLight
        : theme.colors.surface1};
  text-align: left;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  font-family: ${({ theme }) => theme.fontFamily};
  opacity: ${({ $disabled }) => ($disabled ? 0.75 : 1)};
  box-sizing: border-box;
`

const BenefitCheck = styled.span<{ $selected: boolean }>`
  width: 18px;
  height: 18px;
  margin-top: 1px;
  flex-shrink: 0;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.surface1};
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.emerald : 'transparent'};
  border: 1.5px solid
    ${({ theme, $selected }) =>
      $selected ? theme.colors.emerald : theme.colors.defaultBorder};
`

const BenefitCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`

const BenefitName = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const BenefitMeta = styled.div`
  font-size: 11px;
  line-height: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const BenefitReason = styled.div`
  margin-top: 2px;
  font-size: 11px;
  line-height: 14px;
  color: ${({ theme }) => theme.colors.textError};
`

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
`

const Label = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};

  span {
    color: ${({ theme }) => theme.colors.textError};
  }
`

const Input = styled.input`
  width: 100%;
  height: 44px;
  padding: 0 12px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  box-sizing: border-box;
`

const SelectWrap = styled.div`
  position: relative;
`

const Select = styled.select`
  width: 100%;
  height: 44px;
  padding: 0 36px 0 12px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  background: ${({ theme }) => theme.colors.surface1};
  appearance: none;
`

const SelectChevron = styled.img`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  width: 20px;
  height: 20px;
`

const DateWrap = styled.div`
  position: relative;
`

const DateIcon = styled.img`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  width: 20px;
  height: 20px;
`

const EmployeeBanner = styled.div`
  padding: 12px 16px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.planeGreenLight};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const ExistingBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const ExistingHeading = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const ExistingList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
`

const ExistingCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.disableFill};
  background: ${({ theme }) => theme.colors.surface0};
`

const ExistingBadge = styled.span`
  display: inline-flex;
  align-items: center;
  margin-bottom: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.planeGreenLight};
  font-size: 11px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.emerald};
`

const ExistingName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface1};
  border: 1px solid ${({ theme }) => theme.colors.disableFill};
`

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const CardTitle = styled.h3`
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.beyondGrey};
`

const Remove = styled.button`
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.textError};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 13px;
  cursor: pointer;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

const AddButton = styled.button`
  align-self: flex-start;
  border: 1px dashed ${({ theme }) => theme.colors.emerald};
  background: transparent;
  color: ${({ theme }) => theme.colors.emerald};
  border-radius: 8px;
  padding: 12px 16px;
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
`
