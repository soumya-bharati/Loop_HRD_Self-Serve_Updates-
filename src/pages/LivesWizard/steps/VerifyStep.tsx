import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { sampleEmployees } from '@/data/employees'
import {
  getBenefitById,
  getPlanById,
  selectablePolicies,
} from '@/data/flexDeal'
import {
  AssignmentSummary,
  type CoverageGroup,
  type CoverageMember,
} from '@/pages/LivesWizard/components/AssignmentSummary'
import { CostAndCdSummary } from '@/pages/LivesWizard/components/CostAndCdSummary'
import { FlowStepper, WizardChrome } from '@/pages/LivesWizard/WizardChrome'
import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'
import { SINGLE_ADD_STEPS, SINGLE_DEPENDANT_STEPS } from '@/pages/LivesWizard/singleAddSteps'

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
    employee,
    dependants,
    addDependants,
    selectedEmployeeId,
    selectedDependantPlanId,
    costEstimate,
    resolvedAssignment,
    editBlocked,
    setStep,
    completeFlow,
  } = useLivesWizard()

  const isSingleDependant = method === 'single-dependant' && action === 'add'
  const isEdit = action === 'edit'
  const includeDependants = isSingleDependant || addDependants === true
  const selectedEmployee = sampleEmployees.find(
    (e) => e.id === selectedEmployeeId,
  )

  const steps = isEdit
    ? ['Search', 'Edit details', 'Review']
    : isSingleDependant
      ? [...SINGLE_DEPENDANT_STEPS]
      : [...SINGLE_ADD_STEPS]

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
          const plan = getPlanById(coverId)
          if (policy) {
            upsertMember(map, policy.id, policy.name, 'policy', member)
          } else if (benefit) {
            upsertMember(map, benefit.id, benefit.name, 'benefit', member)
          } else if (plan) {
            upsertMember(map, plan.id, plan.name, 'plan', member)
          }
        }
      }
    }

    return [...map.values()]
  })()

  if (isEdit && editBlocked) {
    return (
      <WizardChrome
        title="Correction blocked"
        onBack={() => setStep('edit-form')}
        onExit={() => navigate('/endorsements')}
        primaryLabel="Back to edit"
        onPrimary={() => setStep('edit-form')}
      >
        <Blocked>
          This correction would make the member ineligible for a benefit they
          currently hold. The edit is blocked with no override path.
        </Blocked>
      </WizardChrome>
    )
  }

  const backStep = isEdit
    ? selectedEmployee?.requiresProofOnEdit
      ? 'edit-proof'
      : 'edit-form'
    : isSingleDependant
      ? selectedEmployee &&
        selectedEmployee.plans.filter((p) => p.category === 'gmc').length > 1
        ? 'dependant-plan'
        : 'dependant-details'
      : 'dependant-details'

  return (
    <WizardChrome
      title={isEdit ? 'Review correction' : 'Review Addition Cost'}
      onBack={() => setStep(backStep)}
      onExit={() => navigate('/endorsements')}
      secondaryLabel="Back"
      onSecondary={() => setStep(backStep)}
      primaryLabel={isEdit ? 'Confirm correction' : 'Continue to enrolment'}
      onPrimary={() => {
        if (isEdit) {
          completeFlow()
          return
        }
        if (isSingleDependant) {
          completeFlow()
          return
        }
        setStep('enrolment')
      }}
    >
      <FlowStepper steps={steps} activeIndex={steps.length - 1} bare />

      <Grid>
        <AssignmentSummary groups={coverageGroups} />
        <CostAndCdSummary estimate={costEstimate} />
      </Grid>
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

const Blocked = styled.div`
  padding: 20px 24px;
  border-radius: 12px;
  background: #fdecec;
  border: 1px solid #f5b5b5;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 14px;
  line-height: 20px;
`
