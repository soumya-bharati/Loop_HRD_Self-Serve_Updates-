import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'

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
} from '@/domain/flex'
import { isDependantValid, nextDependantId } from '@/pages/LivesWizard/addEmployees'
import { DependantSlotSelector } from '@/pages/LivesWizard/components/DependantSlotSelector'
import { DynamicAttributeForm } from '@/pages/LivesWizard/components/DynamicAttributeForm'
import { FlowStepper, WizardChrome } from '@/pages/LivesWizard/WizardChrome'
import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'
import {
  FORM_ADD_STEPS,
  addEmployeesPageTitle,
} from '@/pages/LivesWizard/singleAddSteps'

export function EmployeeAssignmentStep() {
  const navigate = useNavigate()
  const {
    activeDeal,
    addEmployees,
    assignmentMemberId,
    setAssignmentMemberId,
    completeAddEmployeeAssignment,
    setAddEmployeeEditing,
    setStep,
  } = useLivesWizard()

  const member =
    addEmployees.find((item) => item.id === assignmentMemberId) ?? null
  const deal = activeDeal

  const recommendation = useMemo(() => {
    if (!member || !deal) return null
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
    if (!member || !deal) return null
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
      : deal?.plans.find((plan) => eligibility?.plans[plan.id]?.eligible)?.id ??
        ''

  const [phase, setPhase] = useState<'assigning' | 'review'>('assigning')
  const [planId, setPlanId] = useState(() =>
    member?.planId && eligibility?.plans[member.planId]?.eligible
      ? member.planId
      : eligibleRecommendationId,
  )
  const [dependants, setDependants] = useState<DependantFormData[]>(() =>
    (member?.dependants ?? []).map((dependant) => ({ ...dependant })),
  )

  useEffect(() => {
    const timer = window.setTimeout(() => setPhase('review'), 1200)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!member || !deal) setStep('user-details')
  }, [deal, member, setStep])

  const selectedPlan = deal?.plans.find((plan) => plan.id === planId)
  const selectedBenefitIds = selectedPlan?.benefitIds ?? []
  const familySummary = deal
    ? computeFamilySlots({
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
    : null
  const benefitLabels = Object.fromEntries(
    (deal?.benefits ?? []).map((benefit) => [benefit.id, benefit.name]),
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
    if (!deal) return
    const nextPlan = deal.plans.find((plan) => plan.id === nextPlanId)
    if (!nextPlan) return
    const emptySummary = computeFamilySlots({
      deal,
      selectedBenefitIds: nextPlan.benefitIds,
    })
    const remainingByRelationship = new Map(
      emptySummary.slots.map((slot) => [slot.relationship, slot.remainingSlots]),
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
    if (!deal) return false
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
      Object.keys(validateAttributeValues(fields, dependant.customAttributes))
        .length === 0
    )
  }

  const canSave =
    phase === 'review' &&
    Boolean(selectedPlan) &&
    eligibility?.plans[planId]?.eligible !== false &&
    dependants.every(dependantIsValid)

  const backToEmployees = () => {
    setAssignmentMemberId(null)
    setStep('user-details')
  }

  if (!member || !deal || !familySummary) return null

  return (
    <WizardChrome
      title={addEmployeesPageTitle(deal.name)}
      onExit={() => navigate('/endorsements')}
      secondaryLabel="Back"
      onSecondary={backToEmployees}
      primaryLabel="Save employee"
      primaryDisabled={!canSave}
      onPrimary={() => {
        if (!selectedPlan || !canSave) return
        completeAddEmployeeAssignment(member.id, {
          planId: selectedPlan.id,
          assignmentSource:
            selectedPlan.id === recommendation?.planId
              ? recommendation.source
              : 'manual',
          selectedBenefitIds,
          dependants,
        })
        setAddEmployeeEditing(member.id, false)
        backToEmployees()
      }}
    >
      <FlowStepper steps={[...FORM_ADD_STEPS]} activeIndex={0} bare />

      <PageHeading>
        <Title>
          {phase === 'assigning'
            ? 'Finding the right plan'
            : `Plan assigned for ${member.employee.firstName}`}
        </Title>
        <Subtitle>
          {phase === 'assigning'
            ? 'Checking eligibility and company assignment rules…'
            : 'Review the recommendation, change it if needed, and add dependants.'}
        </Subtitle>
      </PageHeading>

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
                          .map((id) => getBenefitConfig(deal, id)?.name ?? id)
                          .join(' · ')}
                      </PlanMeta>
                      {disabled ? <PlanError>{status?.reason}</PlanError> : null}
                    </PlanCopy>
                    <PlanLimit>Up to {plan.maxDependants} dependants</PlanLimit>
                  </PlanCard>
                )
              })}
            </PlanList>
          </Section>

          {selectedPlan ? (
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
                      const relationship = familySummary.addableRelationships[0]
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
                  </AddDependantButton>
                ) : null}
              </SectionHeading>

              <DependantSlotSelector
                summary={familySummary}
                benefitLabels={benefitLabels}
              />

              {dependants.length === 0 ? (
                <EmptyFamily>
                  Adding dependants is optional. You can save this employee with
                  the assigned plan now.
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
                        dependant.selectedBenefitIds.flatMap((benefitId) => {
                          const status = evaluateDependantCoverEligibility(
                            deal,
                            dependant.relationship,
                            dependant.dateOfBirth,
                            benefitId,
                          )
                          return !status.eligible && status.reason
                            ? [status.reason]
                            : []
                        }),
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
                                const summaryWithoutCurrent = computeFamilySlots(
                                  {
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
                                  },
                                )
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
                              }).addableRelationships.map((relationship) => (
                                <option key={relationship} value={relationship}>
                                  {relationship}
                                </option>
                              ))}
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
        </>
      )}
    </WizardChrome>
  )
}

const orbit = keyframes`
  to { transform: rotate(360deg); }
`

const progress = keyframes`
  from { width: 8%; }
  to { width: 100%; }
`

const PageHeading = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const Title = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  line-height: 28px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Subtitle = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Assigning = styled.div`
  min-height: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: 12px;
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
  padding: 20px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface1};
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
