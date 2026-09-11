import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { sampleEmployees } from '@/data/employees'
import type { BulkMemberRow, PolicyCostBreakdown, RefundEstimate } from '@/data/flexDeal'
import { toDisplayDate } from '@/pages/LivesWizard/autofill/personas'
import { RefundSummary } from '@/pages/LivesWizard/components/RefundSummary'
import { WizardChrome } from '@/pages/LivesWizard/WizardChrome'
import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'
import { EndorsementCostPanel } from '@/pages/ManageLives/landings/EndorsementCostPanel'
import {
  employeeDetailsPath,
  wizardExitPath,
} from '@/pages/ManageLives/launchWizard'

export function DeleteSummaryStep() {
  const navigate = useNavigate()
  const {
    method,
    activeDeal,
    activeDealId,
    selectedEmployeeId,
    dateOfLeaving,
    refundEstimate,
    bulkDeleteRows,
    completeFlow,
    setStep,
  } = useLivesWizard()

  const employee = sampleEmployees.find((e) => e.id === selectedEmployeeId)
  const isBulk = method === 'bulk'
  const policies = useMemo(
    () => (refundEstimate ? policiesFromRefund(refundEstimate, activeDeal) : []),
    [activeDeal, refundEstimate],
  )
  const submittedRows = useMemo<BulkMemberRow[]>(() => {
    if (!employee || !refundEstimate) return []
    return [
      {
        id: employee.id,
        employeeId: employee.employeeId,
        name: `${employee.firstName} ${employee.lastName}`.trim(),
        email: employee.email,
        department: employee.department ?? '',
        relationship: 'Self',
        assignedPlanId: employee.plans[0]?.id ?? 'plan-standard',
        benefitIds: employee.coverages
          .filter((coverage) => coverage.kind === 'benefit')
          .map((coverage) => coverage.id),
        purchaseGroupSelections: {},
        assignmentSource: 'manual',
        needsManualAssignment: false,
        status: 'pass',
        dealId: activeDealId ?? 'deal-default',
        payrollDelta: 0,
        insurerRefund: refundEstimate.totalInsurerRefund,
        payrollRefund: refundEstimate.totalEmployeeRefund,
        dateOfLeaving: toDisplayDate(dateOfLeaving) || dateOfLeaving,
      },
    ]
  }, [activeDealId, dateOfLeaving, employee, refundEstimate])

  if (!refundEstimate) {
    return null
  }

  if (!isBulk) {
    return (
      <SubmittedStage>
        <EndorsementCostPanel
          rows={submittedRows}
          policies={policies}
          isDelete
          onDone={() =>
            navigate(employeeDetailsPath(selectedEmployeeId), { replace: true })
          }
        />
      </SubmittedStage>
    )
  }

  return (
    <WizardChrome
      title="Bulk delete refund estimate"
      onBack={() => setStep('bulk-validate')}
      onExit={() => navigate(wizardExitPath())}
      secondaryLabel="Back"
      onSecondary={() => setStep('bulk-validate')}
      primaryLabel="Confirm deletion"
      onPrimary={completeFlow}
    >
      <BulkList>
        {bulkDeleteRows
          .filter((r) => r.status === 'pass')
          .map((r) => (
            <BulkRow key={r.id}>
              <div>
                <strong>
                  {r.name} ({r.employeeId})
                </strong>
                <Meta>DOL {r.dateOfLeaving}</Meta>
                <Meta>{r.coverages.join(' · ')}</Meta>
              </div>
              {r.hasClaim ? <Tag>Claim → ₹0 on GMC</Tag> : null}
            </BulkRow>
          ))}
      </BulkList>

      <RefundSummary estimate={refundEstimate} />
    </WizardChrome>
  )
}

function policiesFromRefund(
  estimate: RefundEstimate,
  deal: ReturnType<typeof useLivesWizard>['activeDeal'],
): PolicyCostBreakdown[] {
  const fromCd = estimate.policiesByCd.flatMap((group) =>
    group.policies.map((policy, index) => {
      const benefit = deal?.benefits.find(
        (item) =>
          item.policyName === policy.policyName || item.name === policy.policyName,
      )
      return {
        policyId: `${group.cdAccountId}-${index}-${policy.policyName}`,
        policyName: policy.policyName,
        insurerName: benefit?.insurerName ?? 'Care Health Insurance',
        insurerLogo: benefit?.insurerLogo ?? 'care',
        policyNumber: benefit?.policyNumber ?? '',
        livesAdded: policy.lives,
        endorsementCost: policy.refund,
        cdAccountId: group.cdAccountId,
        cdAccountName: group.cdAccountName,
        cdBalance: group.cdBalance,
      } satisfies PolicyCostBreakdown
    }),
  )
  if (fromCd.length > 0) return fromCd

  return estimate.lines
    .filter((line) => !line.staysActive)
    .map((line) => {
      const benefit = deal?.benefits.find((item) => item.id === line.id)
      return {
        policyId: line.id,
        policyName: line.label,
        insurerName: benefit?.insurerName ?? 'Care Health Insurance',
        insurerLogo: benefit?.insurerLogo ?? 'care',
        policyNumber: benefit?.policyNumber ?? '',
        livesAdded: line.lives,
        endorsementCost: line.insurerRefund,
        cdAccountId: benefit?.cdAccountId ?? 'cd-main',
        cdAccountName: 'CD',
        cdBalance: 0,
      } satisfies PolicyCostBreakdown
    })
}

const SubmittedStage = styled.div`
  display: flex;
  flex: 1;
  width: 100%;
  min-height: 100vh;
`

const BulkList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const BulkRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.surface1};
  border: 1px solid ${({ theme }) => theme.colors.disableFill};
  font-size: 13px;
`

const Meta = styled.div`
  margin-top: 2px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Tag = styled.span`
  align-self: flex-start;
  padding: 4px 8px;
  border-radius: 6px;
  background: #fff6e5;
  color: #b45309;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
`
