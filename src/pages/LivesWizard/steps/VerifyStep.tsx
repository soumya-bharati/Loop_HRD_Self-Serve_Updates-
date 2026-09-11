import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { sampleEmployees } from '@/data/employees'
import {
  getBenefitById,
  getPlanById,
  selectablePolicies,
} from '@/data/flexDeal'
import { getBenefitConfig } from '@/domain/flex'
import {
  AssignmentSummary,
  type CoverageGroup,
  type CoverageMember,
} from '@/pages/LivesWizard/components/AssignmentSummary'
import { CostAndCdSummary } from '@/pages/LivesWizard/components/CostAndCdSummary'
import { GuidedStepLayout } from '@/pages/LivesWizard/components/GuidedStepLayout'
import { editGuidedSteps } from '@/pages/LivesWizard/guidedFlowSteps'
import { FlowStepper, WizardChrome } from '@/pages/LivesWizard/WizardChrome'
import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'
import { SINGLE_ADD_STEPS } from '@/pages/LivesWizard/singleAddSteps'
import {
  employeeDetailsPath,
  isWorkspaceReturn,
  wizardExitPath,
} from '@/pages/ManageLives/launchWizard'

function upsertMember(
  map: Map<string, CoverageGroup>,
  id: string,
  label: string,
  kind: CoverageGroup['kind'],
  member: CoverageMember,
) {
  const existing = map.get(id)
  if (!existing) {
    map.set(id, { id, label, kind, members: [member] })
    return
  }
  const already = existing.members.some(
    (m) => m.name === member.name && m.meta === member.meta,
  )
  if (!already) existing.members.push(member)
}

export function VerifyStep() {
  const navigate = useNavigate()
  const {
    action,
    method,
    activeDeal,
    employee,
    dependants,
    addDependants,
    selectedEmployeeId,
    selectedDependantPlanId,
    costEstimate,
    resolvedAssignment,
    editBlocked,
    pendingCorrection,
    correctionBatch,
    setStep,
    completeFlow,
  } = useLivesWizard()

  const isSingleDependant = method === 'single-dependant' && action === 'add'
  const isEdit = action === 'edit'
  const includeDependants = isSingleDependant || addDependants === true
  const selectedEmployee = sampleEmployees.find(
    (e) => e.id === selectedEmployeeId,
  )

  const guidedSteps = editGuidedSteps()

  const employeeName = isSingleDependant
    ? selectedEmployee
      ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}`
      : 'Selected employee'
    : `${employee.firstName} ${employee.lastName}`.trim() || 'Member'

  const employeeMember: CoverageMember = {
    name: employeeName,
    meta: isSingleDependant
      ? `${selectedEmployee?.employeeId ?? ''} · Self`
      : `${employee.employeeId || '—'} · Self`,
  }

  if (isEdit) {
    const correction =
      pendingCorrection ??
      correctionBatch.find(
        (item) =>
          item.memberId === (selectedEmployeeId ?? item.memberId),
      ) ??
      correctionBatch.at(-1)
    const proofReady =
      !correction?.requiresKyc || Boolean(correction.proofFileName)
    const verified = Boolean(correction?.accepted && proofReady && !editBlocked)

    return (
      <GuidedStepLayout
        steps={guidedSteps}
        activeIndex={1}
        onExit={() => navigate(employeeDetailsPath(selectedEmployeeId))}
        title={verified ? 'Details verified' : 'Verification required'}
        onBack={() => setStep('edit-form')}
        primaryLabel="Save edit"
        primaryDisabled={!verified}
        onPrimary={completeFlow}
      >
        <VerificationLead>
          We checked this correction against the member’s existing cover and
          payroll setup before saving.
        </VerificationLead>

        <VerificationCard>
          <CheckRow $passed={Boolean(correction?.accepted)}>
            <CheckIcon aria-hidden>
              {correction?.accepted ? '✓' : '!'}
            </CheckIcon>
            <CheckCopy>
              <strong>Details and benefit eligibility</strong>
              <span>
                {correction?.accepted
                  ? 'Verified. Existing plan and benefit assignments remain valid.'
                  : correction?.rejectionReason ??
                    'Return to the form and review the correction.'}
              </span>
            </CheckCopy>
          </CheckRow>
          <CheckRow $passed={Boolean(correction?.accepted)}>
            <CheckIcon aria-hidden>
              {correction?.accepted ? '✓' : '!'}
            </CheckIcon>
            <CheckCopy>
              <strong>Payroll deduction</strong>
              <span>
                {correction?.accepted
                  ? 'No change to the employee’s payroll deduction.'
                  : 'The edit cannot be saved if payroll deductions are affected.'}
              </span>
            </CheckCopy>
          </CheckRow>
          {correction?.requiresKyc ? (
            <CheckRow $passed={proofReady}>
              <CheckIcon aria-hidden>{proofReady ? '✓' : '!'}</CheckIcon>
              <CheckCopy>
                <strong>KYC document</strong>
                <span>
                  {proofReady
                    ? `${correction.proofFileName} is ready for verification.`
                    : 'Upload the required document on the previous step.'}
                </span>
              </CheckCopy>
            </CheckRow>
          ) : null}
        </VerificationCard>
      </GuidedStepLayout>
    )
  }

  const coverageGroups: CoverageGroup[] = (() => {
    const map = new Map<string, CoverageGroup>()

    if (isEdit) {
      for (const coverage of selectedEmployee?.coverages ?? []) {
        upsertMember(
          map,
          `${coverage.kind}-${coverage.label}`,
          coverage.label,
          coverage.kind === 'policy'
            ? 'policy'
            : coverage.kind === 'plan'
              ? 'plan'
              : 'benefit',
          employeeMember,
        )
      }
      for (const dep of dependants) {
        const member: CoverageMember = {
          name: `${dep.firstName} ${dep.lastName}`.trim() || 'Dependant',
          meta: dep.relationship || 'Dependant',
        }
        for (const benefitId of dep.selectedBenefitIds ?? []) {
          const policy = selectablePolicies.find((p) => p.id === benefitId)
          const benefit = getBenefitById(benefitId)
          if (policy) {
            upsertMember(map, policy.id, policy.name, 'policy', member)
          } else if (benefit) {
            upsertMember(map, benefit.id, benefit.name, 'benefit', member)
          }
        }
      }
      return [...map.values()]
    }

    for (const policyId of resolvedAssignment.policyIds) {
      const policy = selectablePolicies.find((p) => p.id === policyId)
      if (!policy) continue
      upsertMember(map, policy.id, policy.name, 'policy', employeeMember)
    }

    for (const planId of resolvedAssignment.planIds) {
      const plan = getPlanById(planId)
      if (!plan) continue
      upsertMember(map, plan.id, plan.name, 'plan', employeeMember)
    }

    for (const benefitId of resolvedAssignment.benefitIds) {
      const benefit = getBenefitById(benefitId)
      if (!benefit) continue
      upsertMember(map, benefit.id, benefit.name, 'benefit', employeeMember)
    }

    if (isSingleDependant && selectedDependantPlanId) {
      const plan = selectedEmployee?.plans.find(
        (p) => p.id === selectedDependantPlanId,
      )
      if (plan) {
        upsertMember(map, plan.id, plan.name, 'plan', employeeMember)
      }
    } else if (isSingleDependant && selectedEmployee?.plans[0]) {
      const plan = selectedEmployee.plans[0]
      upsertMember(map, plan.id, plan.name, 'plan', employeeMember)
    }

    if (includeDependants) {
      for (const dep of dependants) {
        const member: CoverageMember = {
          name: `${dep.firstName} ${dep.lastName}`.trim() || 'Dependant',
          meta: dep.relationship || 'Dependant',
        }
        for (const coverId of dep.selectedBenefitIds ?? []) {
          const policy = selectablePolicies.find((p) => p.id === coverId)
          const benefit = getBenefitById(coverId)
          const configuredBenefit = activeDeal
            ? getBenefitConfig(activeDeal, coverId)
            : undefined
          const plan = getPlanById(coverId)
          if (policy) {
            upsertMember(map, policy.id, policy.name, 'policy', member)
          } else if (benefit) {
            upsertMember(map, benefit.id, benefit.name, 'benefit', member)
          } else if (configuredBenefit) {
            upsertMember(
              map,
              configuredBenefit.id,
              configuredBenefit.name,
              'benefit',
              member,
            )
          } else if (plan) {
            upsertMember(map, plan.id, plan.name, 'plan', member)
          }
        }
      }
    }

    return [...map.values()]
  })()

  const backStep = 'dependant-details'

  const title = 'Review Addition Cost'
  const primaryLabel = isWorkspaceReturn()
      ? 'Add to Pending Changes'
      : 'Continue to enrolment'
  const onPrimary = () => {
    if (isSingleDependant || isWorkspaceReturn()) {
      completeFlow()
      return
    }
    setStep('enrolment')
  }

  const summary = (
    <Grid>
      <AssignmentSummary groups={coverageGroups} />
      <CostAndCdSummary
        estimate={costEstimate}
        currentPayrollDeduction={
          isSingleDependant
            ? selectedEmployee?.currentPayrollDeduction
            : undefined
        }
      />
    </Grid>
  )

  return (
    <WizardChrome
      title={title}
      onBack={() => setStep(backStep)}
      onExit={() => navigate(wizardExitPath())}
      secondaryLabel="Back"
      onSecondary={() => setStep(backStep)}
      primaryLabel={primaryLabel}
      onPrimary={onPrimary}
    >
      <FlowStepper
        steps={[...SINGLE_ADD_STEPS]}
        activeIndex={SINGLE_ADD_STEPS.length - 1}
        bare
      />

      {summary}
    </WizardChrome>
  )
}

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`

const VerificationLead = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 14px;
  line-height: 20px;
`

const VerificationCard = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: 12px;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surface1};
`

const CheckRow = styled.div<{ $passed: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 18px;
  background: ${({ theme, $passed }) =>
    $passed ? theme.colors.surface1 : theme.colors.fillRed};

  &:not(:first-child) {
    border-top: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  }
`

const CheckIcon = styled.span`
  display: grid;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.fillGreen};
  color: ${({ theme }) => theme.colors.emerald};
  font-size: 13px;
  font-weight: 700;
`

const CheckCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  strong {
    color: ${({ theme }) => theme.colors.textPrimary};
    font-size: 14px;
  }

  span {
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 13px;
    line-height: 19px;
  }
`
