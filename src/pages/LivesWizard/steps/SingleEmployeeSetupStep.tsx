import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { assets } from '@/assets/figma'
import type { DependantFormData } from '@/data/employees'
import {
  availableBenefitsForRelationship,
  computeFamilySlots,
  evaluateEmployeeEligibility,
  resolveAssignment,
  resolveAttributeFields,
  validateAttributeValues,
  type AssignmentSource,
  type FamilyRelationship,
  type FamilySlotSummary,
} from '@/domain/flex'
import {
  isEmployeeValid,
  nextDependantId,
} from '@/pages/LivesWizard/addEmployees'
import { AddDependantModal } from '@/pages/LivesWizard/components/AddDependantModal'
import { BulkAssignmentKnowMoreModal } from '@/pages/LivesWizard/components/BulkAssignmentKnowMoreModal'
import { DependantSlotSelector } from '@/pages/LivesWizard/components/DependantSlotSelector'
import { GuidedFlowChrome } from '@/pages/LivesWizard/components/GuidedFlowChrome'
import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'
import { wizardExitPath } from '@/pages/ManageLives/launchWizard'

const FLOW_STEPS = [
  {
    title: 'Provide Details',
    description: 'Choose an action, select companies, and upload the sheet.',
  },
  {
    title: 'View Benefits & Add Dependant',
    description: 'Review lives, plan distribution, and validation errors.',
  },
  {
    title: 'Review Cost',
    description: 'Check the Endo cost, CD balance, and any shortfall.',
  },
] as const

export function SingleEmployeeSetupStep() {
  const navigate = useNavigate()
  const {
    addEmployees,
    updateAddEmployeeFields,
    updateAddEmployeeCustomAttribute,
    completeAddEmployeeAssignment,
    activeDeal,
    setStep,
  } = useLivesWizard()
  const member = addEmployees[0] ?? null
  const [view, setView] = useState<'details' | 'benefits'>(() =>
    member?.assignmentCompleted ? 'benefits' : 'details',
  )
  const [knowMoreOpen, setKnowMoreOpen] = useState(false)
  const [dependantModal, setDependantModal] = useState<{
    relationship: FamilyRelationship
    dependant?: DependantFormData
  } | null>(null)
  const [selectedBenefitIds, setSelectedBenefitIds] = useState<string[]>(
    () => member?.selectedBenefitIds ?? [],
  )
  const [policySlabIds, setPolicySlabIds] = useState<Record<string, string>>(
    () => member?.policySlabIds ?? {},
  )
  const [planId, setPlanId] = useState(member?.planId ?? '')
  const [assignmentSource, setAssignmentSource] = useState<AssignmentSource>(
    member?.assignmentSource ?? 'rule',
  )
  const [dependants, setDependants] = useState<DependantFormData[]>(
    () => member?.dependants ?? [],
  )

  const additionalFields = useMemo(
    () =>
      activeDeal
        ? resolveAttributeFields({
            deal: activeDeal,
            entity: 'employee',
            existingValues: member?.employee.customAttributes,
          }).fields.filter((field) => field.visible)
        : [],
    [activeDeal, member?.employee.customAttributes],
  )

  const detailsValid =
    Boolean(member && isEmployeeValid(member.employee)) &&
    Object.keys(
      validateAttributeValues(
        additionalFields,
        member?.employee.customAttributes ?? {},
      ),
    ).length === 0

  const recommendation = useMemo(() => {
    if (!activeDeal || !member) return null
    return resolveAssignment({
      deal: activeDeal,
      employee: {
        dateOfBirth: member.employee.dateOfBirth,
        department: member.employee.customAttributes['attr-department'],
        attributes: member.employee.customAttributes,
      },
    })
  }, [activeDeal, member])

  const assignedCovers = useMemo(() => {
    if (!activeDeal) return []
    const ids = selectedBenefitIds.length
      ? selectedBenefitIds
      : (recommendation?.benefitIds ?? [])
    return activeDeal.benefits.filter(
      (benefit) => benefit.isInsurance && ids.includes(benefit.id),
    )
  }, [activeDeal, recommendation?.benefitIds, selectedBenefitIds])

  const selectedPlan = activeDeal?.plans.find((plan) => plan.id === planId)
  const benefitLabels = Object.fromEntries(
    (activeDeal?.benefits ?? []).map((benefit) => [benefit.id, benefit.name]),
  )
  const familySummary = useMemo((): FamilySlotSummary => {
    if (!activeDeal) {
      return {
        dealId: '',
        slots: [],
        addableRelationships: [],
        allSlotsConsumed: true,
      }
    }
    return computeFamilySlots({
      deal: activeDeal,
      selectedBenefitIds:
        selectedBenefitIds.length > 0
          ? selectedBenefitIds
          : (recommendation?.benefitIds ?? []),
      existingDependants: dependants
        .filter((dependant) => Boolean(dependant.relationship))
        .map((dependant) => ({
          id: dependant.id,
          relationship: dependant.relationship,
          dateOfBirth: dependant.dateOfBirth,
          benefitIds: dependant.selectedBenefitIds,
        })),
    })
  }, [activeDeal, dependants, recommendation?.benefitIds, selectedBenefitIds])

  const slotProgress = useMemo(() => {
    const used = familySummary.slots.reduce((sum, slot) => sum + slot.usedSlots, 0)
    const max = familySummary.slots.reduce((sum, slot) => sum + slot.maxSlots, 0)
    const total = max + 1
    const filled = used + 1
    return Math.round((filled / Math.max(total, 1)) * 100)
  }, [familySummary.slots])

  function openBenefitsView() {
    if (!activeDeal || !member || !recommendation) return
    const eligibility = evaluateEmployeeEligibility(activeDeal, {
      dateOfBirth: member.employee.dateOfBirth,
      department: member.employee.customAttributes['attr-department'],
      attributes: member.employee.customAttributes,
    })
    const nextBenefitIds = (
      member.selectedBenefitIds.length > 0
        ? member.selectedBenefitIds
        : recommendation.benefitIds
    ).filter(
      (benefitId) => eligibility.benefits[benefitId]?.eligible !== false,
    )
    const slabs: Record<string, string> = { ...member.policySlabIds }
    for (const benefitId of nextBenefitIds) {
      const cover = activeDeal.benefits.find((item) => item.id === benefitId)
      if (cover?.policySlabs?.length && !slabs[benefitId]) {
        slabs[benefitId] = cover.policySlabs[0].id
      }
    }
    setSelectedBenefitIds(nextBenefitIds)
    setPolicySlabIds(slabs)
    setPlanId(recommendation.planId ?? member.planId ?? '')
    setAssignmentSource(recommendation.source ?? member.assignmentSource ?? 'rule')
    if (member.dependants.length > 0) setDependants(member.dependants)
    setView('benefits')
  }

  function saveAndReviewCost() {
    if (!member) return
    completeAddEmployeeAssignment(member.id, {
      planId: planId || null,
      purchaseGroupSelections: {},
      policySlabIds,
      assignmentSource,
      selectedBenefitIds,
      dependants,
    })
    setStep('endo-costs')
  }

  if (!member || !activeDeal) {
    return (
      <GuidedFlowChrome
        steps={FLOW_STEPS}
        activeIndex={0}
        onExit={() => navigate(wizardExitPath())}
      >
        <EmptyMessage>
          Employee details are unavailable. Exit and select a Flex deal to
          continue.
        </EmptyMessage>
      </GuidedFlowChrome>
    )
  }

  const employee = member.employee
  const lifeCount = 1 + dependants.length

  return (
    <GuidedFlowChrome
      steps={FLOW_STEPS}
      activeIndex={view === 'benefits' ? 1 : 0}
      onExit={() => navigate(wizardExitPath())}
    >
      {view === 'details' ? (
        <Content>
          <PageTitle>Who would you like to add?</PageTitle>

          <FormGrid>
            <Field>
              <Label>
                Employee ID<Required>*</Required>
              </Label>
              <Input
                value={employee.employeeId}
                placeholder="Enter employee ID"
                onChange={(event) =>
                  updateAddEmployeeFields(member.id, {
                    employeeId: event.target.value,
                  })
                }
              />
            </Field>

            <Field>
              <Label>
                First Name<Required>*</Required>
              </Label>
              <Input
                value={employee.firstName}
                placeholder="Enter first name"
                onChange={(event) =>
                  updateAddEmployeeFields(member.id, {
                    firstName: event.target.value,
                  })
                }
              />
            </Field>

            <Field>
              <Label>Last Name</Label>
              <Input
                value={employee.lastName}
                placeholder="Enter last name"
                onChange={(event) =>
                  updateAddEmployeeFields(member.id, {
                    lastName: event.target.value,
                  })
                }
              />
            </Field>

            <Field>
              <Label>
                Gender<Required>*</Required>
              </Label>
              <ControlWrap>
                <Select
                  $placeholder={!employee.gender}
                  value={employee.gender}
                  onChange={(event) =>
                    updateAddEmployeeFields(member.id, {
                      gender: event.target.value as typeof employee.gender,
                    })
                  }
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </Select>
                <ControlIcon src={assets.chevronDown} alt="" aria-hidden />
              </ControlWrap>
            </Field>

            <Field>
              <Label>
                Date of Birth<Required>*</Required>
              </Label>
              <ControlWrap>
                <Input
                  inputMode="numeric"
                  value={employee.dateOfBirth}
                  placeholder="Enter Date (DD/MM/YYYY)"
                  onChange={(event) =>
                    updateAddEmployeeFields(member.id, {
                      dateOfBirth: event.target.value,
                    })
                  }
                />
                <ControlIcon src={assets.iconCalendar24} alt="" aria-hidden />
              </ControlWrap>
            </Field>

            <Field>
              <Label>
                Date of Joining<Required>*</Required>
              </Label>
              <ControlWrap>
                <Input
                  inputMode="numeric"
                  value={employee.dateOfJoining}
                  placeholder="Enter Date (DD/MM/YYYY)"
                  onChange={(event) =>
                    updateAddEmployeeFields(member.id, {
                      dateOfJoining: event.target.value,
                    })
                  }
                />
                <ControlIcon src={assets.iconCalendar24} alt="" aria-hidden />
              </ControlWrap>
            </Field>

            <Field>
              <Label>Work Email</Label>
              <Input
                type="email"
                value={employee.email}
                placeholder="Enter work email"
                onChange={(event) =>
                  updateAddEmployeeFields(member.id, {
                    email: event.target.value,
                  })
                }
              />
            </Field>

            <Field>
              <Label>Mobile Number</Label>
              <PhoneControl>
                <PhonePrefix>+91</PhonePrefix>
                <PhoneDivider aria-hidden />
                <PhoneInput
                  value={employee.mobile}
                  placeholder="Enter phone number"
                  onChange={(event) =>
                    updateAddEmployeeFields(member.id, {
                      mobile: event.target.value,
                    })
                  }
                />
              </PhoneControl>
            </Field>
          </FormGrid>

          {additionalFields.length > 0 ? (
            <AdditionalSection>
              <Divider />
              <AdditionalTitle>Additional Details</AdditionalTitle>
              <FormGrid>
                {additionalFields.map(({ definition }) => (
                  <Field key={definition.id}>
                    <Label>
                      {definition.label}
                      {definition.required ? <Required>*</Required> : null}
                    </Label>
                    {definition.allowedValues?.length ? (
                      <ControlWrap>
                        <Select
                          $placeholder={
                            !employee.customAttributes[definition.id]
                          }
                          value={
                            employee.customAttributes[definition.id] ?? ''
                          }
                          onChange={(event) =>
                            updateAddEmployeeCustomAttribute(
                              member.id,
                              definition.id,
                              event.target.value,
                            )
                          }
                        >
                          <option value="">Select</option>
                          {definition.allowedValues.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </Select>
                        <ControlIcon
                          src={assets.chevronDown}
                          alt=""
                          aria-hidden
                        />
                      </ControlWrap>
                    ) : (
                      <Input
                        type={
                          definition.id.includes('date') ||
                          definition.id.includes('marriage')
                            ? 'date'
                            : 'text'
                        }
                        value={
                          employee.customAttributes[definition.id] ?? ''
                        }
                        placeholder={`Enter ${definition.label.toLowerCase()}`}
                        onChange={(event) =>
                          updateAddEmployeeCustomAttribute(
                            member.id,
                            definition.id,
                            event.target.value,
                          )
                        }
                      />
                    )}
                  </Field>
                ))}
              </FormGrid>
            </AdditionalSection>
          ) : null}

          <AssignButton
            type="button"
            disabled={!detailsValid}
            onClick={openBenefitsView}
          >
            Assign Benefits to this Employee
          </AssignButton>
        </Content>
      ) : (
        <BenefitsContent>
          <SummaryBlock>
            <SummaryHeader>
              <SummaryTitle>Benefit Assignment Summary</SummaryTitle>
              <KnowMore
                type="button"
                onClick={() => setKnowMoreOpen(true)}
              >
                Want to know how they are assigned?
              </KnowMore>
            </SummaryHeader>
            {assignedCovers.length > 0 ? (
              <CoverGrid>
                {assignedCovers.map((cover) => (
                  <CoverCard key={cover.id}>
                    <CoverName>{cover.name}</CoverName>
                    <PlanChip>
                      <PlanLeft>
                        <PlanDot />
                        <PlanName>{selectedPlan?.name ?? 'Base'}</PlanName>
                      </PlanLeft>
                      <PlanCount>
                        <strong>{lifeCount}</strong>{' '}
                        {lifeCount === 1 ? 'employee' : 'employees'}{' '}
                        <PlanShare>(100%)</PlanShare>
                      </PlanCount>
                    </PlanChip>
                  </CoverCard>
                ))}
              </CoverGrid>
            ) : (
              <EmptyCovers>
                No cover could be auto assigned for this employee.
              </EmptyCovers>
            )}
            <Track aria-hidden>
              <TrackFill $percent={Math.min(100, Math.max(8, slotProgress))} />
            </Track>
          </SummaryBlock>

          <DependantSlotSelector
            summary={familySummary}
            benefitLabels={benefitLabels}
            employee={employee}
            employeeBenefitIds={selectedBenefitIds}
            dependants={dependants}
            showCovers={false}
            addSlotLabel="Add Details for"
            onAddSlot={(relationship) => setDependantModal({ relationship })}
            onEditDependant={(dependant) =>
              setDependantModal({
                relationship: dependant.relationship as FamilyRelationship,
                dependant,
              })
            }
            onEditSelf={() => setView('details')}
          />

          <Footer>
            <BackButton type="button" onClick={() => setView('details')}>
              Go Back
            </BackButton>
            <PrimaryButton
              type="button"
              disabled={assignedCovers.length === 0}
              onClick={saveAndReviewCost}
            >
              Review Cost of Adding
            </PrimaryButton>
          </Footer>
        </BenefitsContent>
      )}

      <AddDependantModal
        open={Boolean(dependantModal)}
        relationship={dependantModal?.relationship ?? 'Spouse'}
        initial={dependantModal?.dependant ?? null}
        onClose={() => setDependantModal(null)}
        onSave={(dependant) => {
          const relationship =
            dependantModal?.relationship ?? dependant.relationship
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
      <BulkAssignmentKnowMoreModal
        open={knowMoreOpen}
        onClose={() => setKnowMoreOpen(false)}
      />
    </GuidedFlowChrome>
  )
}

const Content = styled.div`
  display: flex;
  width: 100%;
  max-width: 1080px;
  flex-direction: column;
  align-items: flex-start;
  gap: 24px;
  padding: 72px 56px 40px;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    padding-right: 32px;
    padding-left: 32px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 72px 16px 32px;
  }
`

const PageTitle = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 18px;
  font-weight: 500;
  line-height: 24px;
`

const FormGrid = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px 24px;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`

const Field = styled.label`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
`

const Label = styled.span`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
`

const Required = styled.span`
  color: ${({ theme }) => theme.colors.textError};
`

const Input = styled.input`
  width: 100%;
  height: 48px;
  padding: 12px 20px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.surface1};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.2px;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.emerald};
    outline: none;
  }
`

const ControlWrap = styled.div`
  position: relative;

  ${Input} {
    padding-right: 48px;
  }
`

const Select = styled.select<{ $placeholder: boolean }>`
  width: 100%;
  height: 48px;
  padding: 12px 48px 12px 20px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.surface1};
  color: ${({ theme, $placeholder }) =>
    $placeholder ? theme.colors.textSecondary : theme.colors.textPrimary};
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.2px;
  appearance: none;
  cursor: pointer;

  &:focus {
    border-color: ${({ theme }) => theme.colors.emerald};
    outline: none;
  }
`

const ControlIcon = styled.img`
  position: absolute;
  top: 50%;
  right: 12px;
  width: 24px;
  height: 24px;
  transform: translateY(-50%);
  pointer-events: none;
`

const PhoneControl = styled.div`
  display: flex;
  height: 48px;
  align-items: center;
  padding: 0 20px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.surface1};

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.emerald};
  }
`

const PhonePrefix = styled.span`
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
  line-height: 20px;
`

const PhoneDivider = styled.span`
  width: 1px;
  height: 20px;
  flex-shrink: 0;
  margin: 0 8px;
  background: ${({ theme }) => theme.colors.defaultBorder};
`

const PhoneInput = styled.input`
  min-width: 0;
  height: 100%;
  flex: 1;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 14px;
  line-height: 20px;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`

const AdditionalSection = styled.section`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 16px;
`

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background: ${({ theme }) => theme.colors.defaultBorder};
`

const AdditionalTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
`

const AssignButton = styled.button`
  display: inline-flex;
  height: 48px;
  align-items: center;
  justify-content: center;
  padding: 14px 24px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.fillGreen};
  color: ${({ theme }) => theme.colors.emerald};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  cursor: pointer;

  &:disabled {
    background: ${({ theme }) => theme.colors.disableFill};
    color: ${({ theme }) => theme.colors.textSecondary};
    cursor: not-allowed;
  }
`

const EmptyMessage = styled.p`
  margin: 72px 56px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
`

const BenefitsContent = styled.div`
  display: flex;
  width: 100%;
  max-width: 1032px;
  flex-direction: column;
  gap: 36px;
  padding: 72px 24px 40px;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 72px 16px 32px;
    gap: 24px;
  }
`

const SummaryBlock = styled.section`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 16px;
`

const SummaryHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    align-items: flex-start;
    flex-direction: column;
  }
`

const SummaryTitle = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: 0.2px;
`

const KnowMore = styled.button`
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.emerald};
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0.2px;
  text-decoration: underline;
  cursor: pointer;
`

const CoverGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
  }
`

const CoverCard = styled.article`
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
  padding: 24px 16px;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface1};
`

const CoverName = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
`

const PlanChip = styled.div`
  display: flex;
  width: min(290px, 100%);
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 12px;
  border-radius: 43px;
  background: ${({ theme }) => theme.colors.surface0};
`

const PlanLeft = styled.span`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
`

const PlanDot = styled.span`
  width: 10px;
  height: 10px;
  flex-shrink: 0;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.turquoise};
`

const PlanName = styled.span`
  min-width: 0;
  flex: 1;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.2px;
`

const PlanCount = styled.span`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.2px;
  white-space: nowrap;

  strong {
    font-weight: 500;
  }
`

const PlanShare = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 400;
`

const EmptyCovers = styled.p`
  margin: 0;
  padding: 24px 16px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface1};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
`

const Track = styled.div`
  width: 100%;
  height: 6px;
  overflow: hidden;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.disableFill};
`

const TrackFill = styled.span<{ $percent: number }>`
  display: block;
  width: ${({ $percent }) => $percent}%;
  height: 100%;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.defaultBorder};
`

const Footer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  padding-top: 8px;
`

const BackButton = styled.button`
  display: inline-flex;
  height: 48px;
  align-items: center;
  justify-content: center;
  padding: 14px 24px;
  border: 1px solid ${({ theme }) => theme.colors.emerald};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface1};
  color: ${({ theme }) => theme.colors.emerald};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  cursor: pointer;
`

const PrimaryButton = styled.button`
  display: inline-flex;
  height: 48px;
  min-width: 220px;
  align-items: center;
  justify-content: center;
  padding: 14px 24px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.fillGreen};
  color: ${({ theme }) => theme.colors.emerald};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  cursor: pointer;

  &:disabled {
    background: ${({ theme }) => theme.colors.disableFill};
    color: ${({ theme }) => theme.colors.textSecondary};
    cursor: not-allowed;
  }
`
