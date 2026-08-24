import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { sampleEmployees } from '@/data/employees'
import {
  getDependantCoverEligibility,
  getEligibleCoversForDependant,
} from '@/data/flexDeal'
import { FlowStepper, WizardChrome } from '@/pages/LivesWizard/WizardChrome'
import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'
import { SINGLE_ADD_STEPS } from '@/pages/LivesWizard/singleAddSteps'

function SingleAddDependantPlan() {
  const navigate = useNavigate()
  const {
    dependants,
    updateDependant,
    resolvedAssignment,
    setStep,
  } = useLivesWizard()

  const canProceed = dependants.every((d) => {
    const eligible = getEligibleCoversForDependant(
      d.relationship || '',
      resolvedAssignment,
    )
    const selectable = eligible.filter(
      (cover) =>
        getDependantCoverEligibility(
          d.relationship || '',
          d.dateOfBirth,
          cover.id,
        ).eligible,
    )
    if (selectable.length === 0) return true
    return (d.selectedBenefitIds ?? []).some((id) =>
      selectable.some((c) => c.id === id),
    )
  })

  return (
    <WizardChrome
      title="Choose benefits for dependants"
      onBack={() => setStep('dependant-details')}
      onExit={() => navigate('/endorsements')}
      secondaryLabel="Back"
      onSecondary={() => setStep('dependant-details')}
      primaryLabel="Proceed"
      primaryDisabled={!canProceed}
      onPrimary={() => setStep('verify')}
    >
      <FlowStepper steps={[...SINGLE_ADD_STEPS]} activeIndex={2} bare />

      <Lead>
        Based on each dependant’s details and the employee’s selected covers,
        pick the benefits to enroll. Greyed options don’t match age rules.
      </Lead>

      {dependants.map((dependant) => {
        const eligible = getEligibleCoversForDependant(
          dependant.relationship || '',
          resolvedAssignment,
        )

        const toggleBenefit = (coverId: string) => {
          const current = dependant.selectedBenefitIds ?? []
          const next = current.includes(coverId)
            ? current.filter((id) => id !== coverId)
            : [...current, coverId]
          updateDependant(dependant.id, { selectedBenefitIds: next })
        }

        return (
          <Card key={dependant.id}>
            <CardTitle>
              {`${dependant.firstName} ${dependant.lastName}`.trim() ||
                'Dependant'}{' '}
              <Meta>· {dependant.relationship}</Meta>
            </CardTitle>

            {eligible.length === 0 ? (
              <Empty>
                No covers available for this relationship from the current
                employee selection.
              </Empty>
            ) : (
              <List>
                {eligible.map((cover) => {
                  const status = getDependantCoverEligibility(
                    dependant.relationship || '',
                    dependant.dateOfBirth,
                    cover.id,
                  )
                  const checked = (dependant.selectedBenefitIds ?? []).includes(
                    cover.id,
                  )
                  const disabled = !status.eligible
                  return (
                    <Option
                      key={cover.id}
                      type="button"
                      $selected={checked}
                      $disabled={disabled}
                      disabled={disabled}
                      onClick={() => {
                        if (disabled) return
                        toggleBenefit(cover.id)
                      }}
                    >
                      <Check $selected={checked && !disabled}>
                        {checked && !disabled ? '✓' : null}
                      </Check>
                      <div>
                        <Name>{cover.label}</Name>
                        <OptionMeta>
                          {cover.kind === 'policy' ? 'Policy' : 'Benefit'} ·{' '}
                          {cover.meta}
                        </OptionMeta>
                        {disabled && status.reason ? (
                          <Reason>{status.reason}</Reason>
                        ) : null}
                      </div>
                    </Option>
                  )
                })}
              </List>
            )}
          </Card>
        )
      })}
    </WizardChrome>
  )
}

function SingleDependantPlanLegacy() {
  const navigate = useNavigate()
  const {
    selectedEmployeeId,
    selectedDependantPlanId,
    setSelectedDependantPlanId,
    setStep,
  } = useLivesWizard()

  const employee = sampleEmployees.find((e) => e.id === selectedEmployeeId)
  const gmcPlans =
    employee?.plans.filter((p) => p.category === 'gmc') ?? []

  useEffect(() => {
    if (gmcPlans.length === 1 && !selectedDependantPlanId) {
      setSelectedDependantPlanId(gmcPlans[0].id)
    }
  }, [gmcPlans, selectedDependantPlanId, setSelectedDependantPlanId])

  const grouped = new Map<string, typeof gmcPlans>()
  for (const plan of employee?.plans ?? []) {
    const list = grouped.get(plan.category) ?? []
    list.push(plan)
    grouped.set(plan.category, list)
  }

  return (
    <WizardChrome
      title="Choose plan for dependant"
      onBack={() => setStep('dependant-details')}
      onExit={() => navigate('/endorsements')}
      secondaryLabel="Back"
      onSecondary={() => setStep('dependant-details')}
      primaryLabel="Proceed"
      primaryDisabled={!selectedDependantPlanId}
      onPrimary={() => setStep('verify')}
    >
      <FlowStepper
        steps={['Search Employee', 'Dependant Details', 'Plan', 'Review Cost']}
        activeIndex={2}
        bare
      />

      <Lead>
        This employee holds more than one plan in the same primary benefit
        category. Pick which plan the dependant should join.
      </Lead>

      {[...grouped.entries()].map(([category, plans]) => (
        <Group key={category}>
          <GroupTitle>{category.toUpperCase()} category</GroupTitle>
          {plans.map((plan) => (
            <LegacyOption
              key={plan.id}
              type="button"
              $selected={selectedDependantPlanId === plan.id}
              onClick={() => setSelectedDependantPlanId(plan.id)}
            >
              {plan.name}
            </LegacyOption>
          ))}
        </Group>
      ))}
    </WizardChrome>
  )
}

export function DependantPlanStep() {
  const { method, action } = useLivesWizard()
  const isSingleDependant = method === 'single-dependant' && action === 'add'
  if (isSingleDependant) return <SingleDependantPlanLegacy />
  return <SingleAddDependantPlan />
}

const Lead = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface1};
  border: 1px solid ${({ theme }) => theme.colors.disableFill};
`

const CardTitle = styled.h3`
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.beyondGrey};
`

const Meta = styled.span`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Empty = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const Option = styled.button<{ $selected: boolean; $disabled: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1.5px solid
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
  opacity: ${({ $disabled }) => ($disabled ? 0.7 : 1)};
`

const Check = styled.span<{ $selected: boolean }>`
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  margin-top: 2px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.emerald : 'transparent'};
  border: 1.5px solid
    ${({ theme, $selected }) =>
      $selected ? theme.colors.emerald : theme.colors.defaultBorder};
`

const Name = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const OptionMeta = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Reason = styled.div`
  margin-top: 4px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textError};
`

const Group = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface1};
  border: 1px solid ${({ theme }) => theme.colors.disableFill};
`

const GroupTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.beyondGrey};
`

const LegacyOption = styled.button<{ $selected: boolean }>`
  text-align: left;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1.5px solid
    ${({ theme, $selected }) =>
      $selected ? theme.colors.emerald : theme.colors.defaultBorder};
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.planeGreenLight : theme.colors.surface1};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
`
