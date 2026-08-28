import { useEffect, useMemo, useState } from 'react'
import styled, { keyframes } from 'styled-components'

import { assets } from '@/assets/figma'
import {
  emptyDependantForm,
  type DependantFormData,
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
  resolveAttributeFields,
  validateAttributeValues,
  type AssignmentSource,
  type FlexDealConfig,
} from '@/domain/flex'
import {
  isDependantValid,
  nextDependantId,
  type AddEmployeeMember,
} from '@/pages/LivesWizard/addEmployees'
import { DependantSlotSelector } from '@/pages/LivesWizard/components/DependantSlotSelector'
import { DynamicAttributeForm } from '@/pages/LivesWizard/components/DynamicAttributeForm'

const RAIL_STEPS = [
  {
    label: 'Assign plan',
    copy: 'We match the employee’s details against the company assignment rules. Review the recommended plan and change it if a different one applies.',
  },
  {
    label: 'Add dependants',
    copy: 'Add the family members covered under the assigned plan. Available slots depend on the plan’s family structure.',
  },
]

interface AssignmentDraft {
  planId: string
  assignmentSource: AssignmentSource
  selectedBenefitIds: string[]
  dependants: DependantFormData[]
}

export function EmployeeAssignmentModal({
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
  onSave: (draft: AssignmentDraft) => void
}) {
  const recommendation = useMemo(() => {
    if (!member) return null
    return resolveAssignment({
      deal,
      employee: {
        dateOfBirth: member.employee.dateOfBirth,
        department: member.employee.customAttributes['attr-department'],
        attributes: member.employee.customAttributes,
      },
    })
  }, [deal, member])

  const eligibility = useMemo(() => {
    if (!member) return null
    return evaluateEmployeeEligibility(deal, {
      dateOfBirth: member.employee.dateOfBirth,
      department: member.employee.customAttributes['attr-department'],
      attributes: member.employee.customAttributes,
    })
  }, [deal, member])

  const eligibleRecommendationId =
    recommendation?.planId &&
    eligibility?.plans[recommendation.planId]?.eligible !== false
      ? recommendation.planId
      : deal.plans.find((plan) => eligibility?.plans[plan.id]?.eligible)?.id ??
        ''
  const initialPlanId =
    member?.planId && eligibility?.plans[member.planId]?.eligible
      ? member.planId
      : eligibleRecommendationId
  const [phase, setPhase] = useState<'assigning' | 'review'>('assigning')
  const [reviewStep, setReviewStep] = useState<'plan' | 'dependants'>('plan')
  const [planId, setPlanId] = useState(initialPlanId)
  const [dependants, setDependants] = useState<DependantFormData[]>([])

  useEffect(() => {
    if (!open || !member) return
    const nextPlanId =
      member.planId && eligibility?.plans[member.planId]?.eligible
        ? member.planId
        : eligibleRecommendationId
    setPlanId(nextPlanId)
    setDependants(member.dependants.map((dependant) => ({ ...dependant })))
    setReviewStep('plan')
    setPhase('assigning')
    const timer = window.setTimeout(() => setPhase('review'), 1200)
    return () => window.clearTimeout(timer)
  }, [eligibility, eligibleRecommendationId, member, open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onCancel, open])

  const selectedPlan = deal.plans.find((plan) => plan.id === planId)
  const selectedBenefitIds = selectedPlan?.benefitIds ?? []
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

  const updateDependant = (
    dependantId: string,
    patch: Partial<DependantFormData>,
  ) => {
    setDependants((current) =>
      current.map((dependant) =>
        dependant.id === dependantId ? { ...dependant, ...patch } : dependant,
      ),
    )
  }

  const changePlan = (nextPlanId: string) => {
    const nextPlan = deal.plans.find((plan) => plan.id === nextPlanId)
    if (!nextPlan) return
    const emptySummary = computeFamilySlots({
      deal,
      selectedBenefitIds: nextPlan.benefitIds,
    })
    const remainingByRelationship = new Map(
      emptySummary.slots.map((slot) => [
        slot.relationship,
        slot.remainingSlots,
      ]),
    )
    setPlanId(nextPlanId)
    setDependants((current) =>
      current.flatMap((dependant) => {
        if (!dependant.relationship) return [dependant]
        const relationship = dependant.relationship
        if (relationship === 'Self') return []
        const remaining = remainingByRelationship.get(relationship) ?? 0
        if (remaining <= 0) return []
        remainingByRelationship.set(relationship, remaining - 1)
        return [
          {
            ...dependant,
            selectedBenefitIds: availableBenefitsForRelationship(
              emptySummary,
              relationship,
            ),
          },
        ]
      }),
    )
  }

  const dependantIsValid = (dependant: DependantFormData) => {
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
  }

  const canContinuePlan =
    Boolean(selectedPlan) && eligibility?.plans[planId]?.eligible !== false
  const canSave = canContinuePlan && dependants.every(dependantIsValid)

  if (!open || !member) return null

  const isPlanStep = reviewStep === 'plan'
  const title =
    phase === 'assigning'
      ? 'Finding the right plan'
      : isPlanStep
        ? `Plan assigned for ${member.employee.firstName}`
        : `Dependants for ${member.employee.firstName}`
  const subtitle =
    phase === 'assigning'
      ? 'Checking eligibility and company assignment rules…'
      : isPlanStep
        ? 'Review the recommendation and change it if needed.'
        : selectedPlan
          ? `Add eligible family members under ${selectedPlan.name}.`
          : 'Add eligible family members.'

  return (
    <Overlay role="presentation" onMouseDown={onCancel}>
      <Dialog
        role="dialog"
        aria-modal="true"
        aria-labelledby="assignment-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <Header>
          <div>
            <Title id="assignment-modal-title">{title}</Title>
            <Subtitle>{subtitle}</Subtitle>
          </div>
          <CloseButton type="button" aria-label="Close" onClick={onCancel}>
            <img src={assets.modalDismiss} alt="" width={16} height={16} />
          </CloseButton>
        </Header>

        {phase === 'assigning' ? (
          <Assigning role="status" aria-live="polite">
            <Orbit aria-hidden>
              <OrbitDot />
              <OrbitCenter>✓</OrbitCenter>
            </Orbit>
            <AssigningTitle>Auto-assigning benefits</AssigningTitle>
            <AssigningCopy>
              Matching employee attributes with {deal.name}
            </AssigningCopy>
            <ProgressTrack aria-hidden>
              <ProgressBar />
            </ProgressTrack>
          </Assigning>
        ) : (
          <>
            <Body>
              <Rail>
                {RAIL_STEPS.map((step, index) => {
                  const activeIndex = isPlanStep ? 0 : 1
                  const active = index === activeIndex
                  const done = index < activeIndex
                  return (
                    <RailStep key={step.label}>
                      <RailMarker $active={active} $done={done} aria-hidden>
                        {done ? '✓' : null}
                      </RailMarker>
                      <div>
                        <RailLabel $active={active || done}>
                          {step.label}
                        </RailLabel>
                        {active ? (
                          <RailDetail>
                            <RailIllustration
                              src={assets.illustrationFamily}
                              alt=""
                            />
                            <RailCopy>{step.copy}</RailCopy>
                          </RailDetail>
                        ) : null}
                      </div>
                    </RailStep>
                  )
                })}
              </Rail>

              <Panel>
              {isPlanStep ? (
              <Section>
                <SectionHeading>
                  <div>
                    <SectionTitle>Assigned plan</SectionTitle>
                    <SectionCopy>
                      {recommendation?.source === 'rule'
                        ? 'Recommended from the company assignment rule'
                        : 'Recommended from the company default'}
                    </SectionCopy>
                  </div>
                  <RecommendedBadge>Auto assigned</RecommendedBadge>
                </SectionHeading>

                <PlanList>
                  {deal.plans.map((plan) => {
                    const status = eligibility?.plans[plan.id]
                    const disabled = status?.eligible === false
                    const selected = plan.id === planId
                    return (
                      <PlanCard
                        key={plan.id}
                        type="button"
                        $selected={selected}
                        disabled={disabled}
                        onClick={() => changePlan(plan.id)}
                      >
                        <Radio $selected={selected} aria-hidden />
                        <PlanCopy>
                          <PlanName>{plan.name}</PlanName>
                          <PlanMeta>
                            {plan.benefitIds
                              .map(
                                (id) =>
                                  getBenefitConfig(deal, id)?.name ?? id,
                              )
                              .join(' · ')}
                          </PlanMeta>
                          {disabled ? (
                            <PlanError>{status?.reason}</PlanError>
                          ) : null}
                        </PlanCopy>
                        <PlanLimit>
                          Up to {plan.maxDependants} dependants
                        </PlanLimit>
                      </PlanCard>
                    )
                  })}
                </PlanList>
              </Section>
              ) : selectedPlan ? (
                <Section>
                  <SectionHeading>
                    <div>
                      <SectionTitle>Dependants</SectionTitle>
                      <SectionCopy>
                        Add eligible family members under {selectedPlan.name}.
                      </SectionCopy>
                    </div>
                    {!familySummary.allSlotsConsumed &&
                    familySummary.addableRelationships.length > 0 ? (
                      <AddDependantButton
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
                          setDependants((current) => [
                            ...current,
                            dependant,
                          ])
                        }}
                      >
                        + Add dependant
                      </AddDependantButton>
                    ) : null}
                  </SectionHeading>

                  <DependantSlotSelector
                    summary={familySummary}
                    benefitLabels={benefitLabels}
                  />

                  {dependants.length === 0 ? (
                    <EmptyFamily>
                      Adding dependants is optional. You can save this employee
                      with the assigned plan now.
                    </EmptyFamily>
                  ) : (
                    <DependantList>
                      {dependants.map((dependant, index) => {
                        const fields = resolveAttributeFields({
                          deal,
                          entity: 'dependant',
                          relationship: dependant.relationship,
                          selectedBenefitIds: dependant.selectedBenefitIds,
                          existingValues: dependant.customAttributes,
                        }).fields
                        const errors = validateAttributeValues(
                          fields,
                          dependant.customAttributes,
                        )
                        const eligibilityErrors = [
                          ...new Set(
                            dependant.selectedBenefitIds.flatMap(
                              (benefitId) => {
                                const status =
                                  evaluateDependantCoverEligibility(
                                    deal,
                                    dependant.relationship,
                                    dependant.dateOfBirth,
                                    benefitId,
                                  )
                                return !status.eligible && status.reason
                                  ? [status.reason]
                                  : []
                              },
                            ),
                          ),
                        ]
                        return (
                          <DependantCard key={dependant.id}>
                            <DependantHeader>
                              <strong>Dependant {index + 1}</strong>
                              <RemoveButton
                                type="button"
                                onClick={() =>
                                  setDependants((current) =>
                                    current.filter(
                                      (item) => item.id !== dependant.id,
                                    ),
                                  )
                                }
                              >
                                Remove
                              </RemoveButton>
                            </DependantHeader>
                            <FieldGrid>
                              <Field>
                                <Label>Relationship*</Label>
                                <Select
                                  value={dependant.relationship}
                                  onChange={(event) => {
                                    const relationship = event.target
                                      .value as Relationship
                                    const summaryWithoutCurrent =
                                      computeFamilySlots({
                                        deal,
                                        selectedBenefitIds,
                                        existingDependants: dependants
                                          .filter(
                                            (item) =>
                                              item.id !== dependant.id &&
                                              Boolean(item.relationship),
                                          )
                                          .map((item) => ({
                                            id: item.id,
                                            relationship: item.relationship,
                                            benefitIds:
                                              item.selectedBenefitIds,
                                          })),
                                      })
                                    updateDependant(dependant.id, {
                                      relationship,
                                      selectedBenefitIds:
                                        availableBenefitsForRelationship(
                                          summaryWithoutCurrent,
                                          relationship,
                                        ),
                                      customAttributes: {},
                                    })
                                  }}
                                >
                                  <option value="">Select</option>
                                  {computeFamilySlots({
                                    deal,
                                    selectedBenefitIds,
                                    existingDependants: dependants
                                      .filter(
                                        (item) =>
                                          item.id !== dependant.id &&
                                          Boolean(item.relationship),
                                      )
                                      .map((item) => ({
                                        id: item.id,
                                        relationship: item.relationship,
                                        benefitIds: item.selectedBenefitIds,
                                      })),
                                  }).addableRelationships.map(
                                    (relationship) => (
                                      <option
                                        key={relationship}
                                        value={relationship}
                                      >
                                        {relationship}
                                      </option>
                                    ),
                                  )}
                                </Select>
                              </Field>
                              <Field>
                                <Label>First name*</Label>
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
                                <Label>Last name</Label>
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
                                <Label>Date of birth*</Label>
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
                              <Field>
                                <Label>Gender*</Label>
                                <Select
                                  value={dependant.gender}
                                  onChange={(event) =>
                                    updateDependant(dependant.id, {
                                      gender: event.target.value as Gender,
                                    })
                                  }
                                >
                                  <option value="">Select</option>
                                  <option value="Male">Male</option>
                                  <option value="Female">Female</option>
                                  <option value="Other">Other</option>
                                </Select>
                              </Field>
                            </FieldGrid>
                            {eligibilityErrors.length > 0 ? (
                              <EligibilityError>
                                {eligibilityErrors.join(' ')}
                              </EligibilityError>
                            ) : null}
                            <DynamicAttributeForm
                              fields={fields}
                              values={dependant.customAttributes}
                              errors={errors}
                              title="Additional dependant details"
                              onChange={(id, value) =>
                                updateDependant(dependant.id, {
                                  customAttributes: {
                                    ...dependant.customAttributes,
                                    [id]: value,
                                  },
                                })
                              }
                            />
                          </DependantCard>
                        )
                      })}
                    </DependantList>
                  )}
                </Section>
              ) : null}
              </Panel>
            </Body>

            <Footer>
              {isPlanStep ? (
                <SecondaryButton type="button" onClick={onCancel}>
                  Cancel
                </SecondaryButton>
              ) : (
                <SecondaryButton
                  type="button"
                  onClick={() => setReviewStep('plan')}
                >
                  Back
                </SecondaryButton>
              )}
              {isPlanStep ? (
                <PrimaryButton
                  type="button"
                  disabled={!canContinuePlan}
                  onClick={() => setReviewStep('dependants')}
                >
                  Next
                </PrimaryButton>
              ) : (
                <PrimaryButton
                  type="button"
                  disabled={!canSave}
                  onClick={() => {
                    if (!selectedPlan || !canSave) return
                    onSave({
                      planId: selectedPlan.id,
                      assignmentSource:
                        selectedPlan.id === recommendation?.planId
                          ? recommendation.source
                          : 'manual',
                      selectedBenefitIds,
                      dependants,
                    })
                  }}
                >
                  Save
                </PrimaryButton>
              )}
            </Footer>
          </>
        )}
      </Dialog>
    </Overlay>
  )
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

const scaleIn = keyframes`
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`

const orbit = keyframes`
  to { transform: rotate(360deg); }
`

const progress = keyframes`
  from { width: 8%; }
  to { width: 100%; }
`

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 180;
  display: grid;
  place-items: center;
  padding: 24px 5vw;
  background: rgba(45, 55, 72, 0.48);
  animation: ${fadeIn} 160ms ease-out;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 0;
  }
`

const Dialog = styled.div`
  width: 90vw;
  max-height: min(90vh, 900px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface0};
  box-shadow: 0 20px 60px rgba(16, 24, 40, 0.2);
  animation: ${scaleIn} 200ms ease-out;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    width: 100%;
    max-height: 100dvh;
    height: 100dvh;
    border-radius: 0;
  }
`

const Header = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 24px;
  background: ${({ theme }) => theme.colors.surface1};
  border-bottom: 0.5px solid ${({ theme }) => theme.colors.defaultBorder};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    gap: 12px;
    padding: 16px;
  }
`

const Body = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 48px;
  flex: 1;
  min-height: 0;
  padding: 24px;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    overflow-y: auto;
  }
`

const Rail = styled.ol`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 246px;
  margin: 0;
  padding: 6px 0 0;
  list-style: none;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    width: 100%;
    flex-direction: row;
    gap: 12px;
    overflow-x: auto;
  }
`

const RailStep = styled.li`
  position: relative;
  display: grid;
  grid-template-columns: 24px 1fr;
  gap: 12px;

  &:not(:last-child) {
    padding-bottom: 28px;
  }

  &:not(:last-child)::before {
    content: '';
    position: absolute;
    top: 26px;
    bottom: 2px;
    left: 11px;
    width: 2px;
    background: ${({ theme }) => theme.colors.defaultBorder};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 24px max-content;
    flex-shrink: 0;
    padding-bottom: 0 !important;

    &::before {
      display: none;
    }
  }
`

const RailMarker = styled.span<{ $active: boolean; $done: boolean }>`
  z-index: 1;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border: 2px solid
    ${({ theme, $active, $done }) =>
      $active || $done ? theme.colors.emerald : theme.colors.defaultBorder};
  border-radius: 50%;
  background: ${({ theme, $active, $done }) =>
    $done
      ? theme.colors.emerald
      : $active
        ? theme.colors.planeGreenLight
        : theme.colors.surface1};
  box-shadow: ${({ theme, $active }) =>
    $active ? `inset 0 0 0 3px ${theme.colors.emerald}` : 'none'};
  color: ${({ theme }) => theme.colors.textTertiary};
  font-size: 12px;
  line-height: 1;
`

const RailLabel = styled.span<{ $active: boolean }>`
  display: block;
  padding-top: 2px;
  font-size: 16px;
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  line-height: 20px;
  color: ${({ theme, $active }) =>
    $active ? theme.colors.textPrimary : theme.colors.textSecondary};
`

const RailDetail = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: none;
  }
`

const RailIllustration = styled.img`
  width: 100%;
  height: 142px;
  border-radius: 6px;
  object-fit: cover;
`

const RailCopy = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Panel = styled.div`
  display: flex;
  flex: 1;
  min-width: 0;
  max-height: 100%;
  flex-direction: column;
  gap: 24px;
  padding: 30px;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface1};
  overflow-y: auto;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    width: 100%;
    max-height: none;
    padding: 20px;
    overflow: visible;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: 16px;
  }
`

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  line-height: 24px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Subtitle = styled.p`
  margin: 4px 0 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const CloseButton = styled.button`
  display: grid;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  place-items: center;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
`

const Assigning = styled.div`
  min-height: 360px;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 24px;
  padding: 40px;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface1};
  text-align: center;
`

const Orbit = styled.div`
  position: relative;
  width: 88px;
  height: 88px;
  margin-bottom: 24px;
  border: 2px solid ${({ theme }) => theme.colors.planeGreenLight};
  border-top-color: ${({ theme }) => theme.colors.fillGreen};
  border-radius: 50%;
  animation: ${orbit} 900ms linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const OrbitDot = styled.span`
  position: absolute;
  top: 4px;
  right: 10px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.fillGreen};
`

const OrbitCenter = styled.span`
  position: absolute;
  inset: 14px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.emerald};
  color: white;
  font-size: 28px;
  transform: rotate(-360deg);
`

const AssigningTitle = styled.strong`
  font-size: 18px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const AssigningCopy = styled.span`
  margin-top: 6px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const ProgressTrack = styled.div`
  width: min(360px, 100%);
  height: 6px;
  margin-top: 24px;
  overflow: hidden;
  border-radius: 99px;
  background: ${({ theme }) => theme.colors.disableFill};
`

const ProgressBar = styled.div`
  height: 100%;
  border-radius: inherit;
  background: ${({ theme }) => theme.colors.fillGreen};
  animation: ${progress} 1100ms ease-out forwards;

  @media (prefers-reduced-motion: reduce) {
    width: 100%;
    animation: none;
  }
`

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const SectionHeading = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
`

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const SectionCopy = styled.p`
  margin: 2px 0 0;
  font-size: 13px;
  line-height: 18px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const RecommendedBadge = styled.span`
  flex-shrink: 0;
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
    opacity: 0.55;
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
  box-shadow: ${({ theme, $selected }) =>
    $selected ? `inset 0 0 0 4px ${theme.colors.surface1}` : 'none'};
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.emerald : theme.colors.surface1};
`

const PlanCopy = styled.span`
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
`

const PlanName = styled.strong`
  font-size: 15px;
  line-height: 22px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const PlanMeta = styled.span`
  overflow: hidden;
  font-size: 12px;
  line-height: 18px;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-overflow: ellipsis;
  white-space: nowrap;
`

const PlanError = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textError};
`

const PlanLimit = styled.span`
  flex-shrink: 0;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const AddDependantButton = styled.button`
  flex-shrink: 0;
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.emerald};
  border-radius: 8px;
  background: transparent;
  color: ${({ theme }) => theme.colors.emerald};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
`

const EmptyFamily = styled.div`
  padding: 16px;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.surface0};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
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
  align-items: center;
  justify-content: space-between;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 14px;
`

const EligibilityError = styled.p`
  margin: 0;
  font-size: 12px;
  line-height: 18px;
  color: ${({ theme }) => theme.colors.textError};
`

const RemoveButton = styled.button`
  padding: 0;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.textError};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 12px;
  cursor: pointer;
`

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const Label = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Input = styled.input`
  width: 100%;
  height: 42px;
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface1};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: ${({ theme }) => theme.fontFamily};
  box-sizing: border-box;
`

const Select = styled.select`
  width: 100%;
  height: 42px;
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface1};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: ${({ theme }) => theme.fontFamily};
  box-sizing: border-box;
`

const Footer = styled.footer`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 24px;
  background: ${({ theme }) => theme.colors.surface1};
  border-top: 0.5px solid ${({ theme }) => theme.colors.defaultBorder};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    gap: 10px;
    padding: 12px 16px max(12px, env(safe-area-inset-bottom));
  }
`

const SecondaryButton = styled.button`
  width: 180px;
  height: 48px;
  padding: 0 24px;
  border: 1px solid ${({ theme }) => theme.colors.emerald};
  border-radius: 12px;
  background: transparent;
  box-shadow: 0 0 16px rgba(55, 65, 81, 0.03);
  color: ${({ theme }) => theme.colors.emerald};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.2px;
  cursor: pointer;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    width: auto;
    min-width: 0;
    flex: 1;
  }
`

const PrimaryButton = styled.button`
  width: 180px;
  height: 48px;
  padding: 0 24px;
  border: none;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.fillGreen};
  box-shadow: 0 0 8px rgba(55, 65, 81, 0.03);
  color: ${({ theme }) => theme.colors.emerald};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.2px;
  cursor: pointer;

  &:disabled {
    background: ${({ theme }) => theme.colors.disableFill};
    color: ${({ theme }) => theme.colors.textSecondary};
    cursor: not-allowed;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    width: auto;
    min-width: 0;
    flex: 1;
  }
`
