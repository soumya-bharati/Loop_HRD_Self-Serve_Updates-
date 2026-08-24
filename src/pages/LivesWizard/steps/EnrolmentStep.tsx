import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { activeDeals, flexDeal, selectablePolicies } from '@/data/flexDeal'
import { EnrolmentSettings } from '@/pages/LivesWizard/components/EnrolmentSettings'
import { FlowStepper, WizardChrome } from '@/pages/LivesWizard/WizardChrome'
import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'
import { SINGLE_ADD_STEPS, SINGLE_DEPENDANT_STEPS } from '@/pages/LivesWizard/singleAddSteps'

export function EnrolmentStep() {
  const navigate = useNavigate()
  const {
    method,
    action,
    enrolment,
    setEnrolment,
    selectedPolicyIds,
    activeDealId,
    setStep,
    completeFlow,
    startProcessing,
  } = useLivesWizard()

  const isBulk = method === 'bulk' && action === 'add'
  const isAddEmployees = method === 'single' && action === 'add'
  const isSingleDependant = method === 'single-dependant' && action === 'add'
  const backStep = isBulk
    ? 'bulk-review'
    : isAddEmployees
      ? 'endo-costs'
      : 'verify'

  const launchTargets = isBulk
    ? [
        { id: flexDeal.id, label: flexDeal.name },
        ...selectablePolicies.map((p) => ({ id: p.id, label: p.name })),
      ]
    : [
        ...selectablePolicies
          .filter((p) => selectedPolicyIds.includes(p.id))
          .map((p) => ({ id: p.id, label: p.name })),
        ...activeDeals
          .filter((d) => !activeDealId || d.id === activeDealId)
          .map((d) => ({ id: d.id, label: d.name })),
      ]

  useEffect(() => {
    if (
      isBulk &&
      enrolment.launchTargetIds.length === 0 &&
      launchTargets.length > 0
    ) {
      setEnrolment({
        ...enrolment,
        launchTargetIds: launchTargets.map((t) => t.id),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBulk])

  const canProceed = isBulk
    ? enrolment.runEnrolment === false ||
      (enrolment.runEnrolment === true && Boolean(enrolment.dueDate))
    : Boolean(enrolment.dueDate)

  const stepperSteps = isBulk
    ? ['Upload', 'Validate', 'Review', 'Enrolment']
    : isAddEmployees
      ? [...SINGLE_ADD_STEPS, 'Enrolment']
      : isSingleDependant
        ? [...SINGLE_DEPENDANT_STEPS, 'Enrolment']
        : [...SINGLE_ADD_STEPS]

  const stepperIndex = isBulk
    ? 3
    : isAddEmployees || isSingleDependant
      ? stepperSteps.length - 1
      : SINGLE_ADD_STEPS.length - 1

  return (
    <WizardChrome
      title="Enrolment settings"
      onBack={() => setStep(backStep)}
      onExit={() => navigate('/endorsements')}
      secondaryLabel="Back"
      onSecondary={() => setStep(backStep)}
      primaryLabel={isBulk ? 'Confirm & process' : 'Confirm & add'}
      primaryDisabled={!canProceed}
      onPrimary={() => {
        if (isBulk) startProcessing()
        else completeFlow()
      }}
    >
      <FlowStepper steps={stepperSteps} activeIndex={stepperIndex} bare />

      <Card>
        <Lead>
          Optionally set an enrolment due date and choose whether invitations go
          out now or later.
        </Lead>
        <EnrolmentSettings
          value={enrolment}
          onChange={setEnrolment}
          requireRunChoice={isBulk}
          launchTargets={isBulk ? launchTargets : undefined}
        />
      </Card>
    </WizardChrome>
  )
}

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface1};
`

const Lead = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`
