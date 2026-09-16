import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { sampleEmployees } from '@/data/employees'
import type { BulkMemberRow, PolicyCostBreakdown, RefundEstimate } from '@/data/flexDeal'
import { bulkRowsFromAddEmployees } from '@/pages/LivesWizard/addEmployees'
import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'
import { EndorsementCostPanel } from '@/pages/ManageLives/landings/EndorsementCostPanel'

export function SuccessStep() {
  const navigate = useNavigate()
  const {
    action,
    method,
    costEstimate,
    refundEstimate,
    enrolment,
    dependants,
    addEmployees,
    activeDeal,
    activeDealId,
    rows,
    bulkDeleteRows,
    editProofFileName,
    selectedEmployeeId,
    dateOfLeaving,
    correctionBatch,
  } = useLivesWizard()
  const selectedEmployee = sampleEmployees.find(
    (item) => item.id === selectedEmployeeId,
  )

  const scheduled =
    enrolment.runEnrolment !== false && enrolment.mode === 'schedule'

  const submittedRows =
    action === 'add'
      ? method === 'bulk'
        ? rows
        : bulkRowsFromAddEmployees(addEmployees, activeDealId ?? 'deal-default')
      : action === 'delete' && method === 'bulk'
        ? bulkDeleteRows.map<BulkMemberRow>((row) => ({
            id: row.id,
            employeeId: row.employeeId,
            name: row.name,
            email: '',
            department: '',
            relationship: 'Self',
            assignedPlanId: 'plan-standard',
            benefitIds: [],
            purchaseGroupSelections: {},
            assignmentSource: 'sheet',
            needsManualAssignment: false,
            status: row.status,
            dealId: activeDealId ?? 'deal-default',
            payrollDelta: 0,
            insurerRefund: row.insurerRefund,
            payrollRefund: row.payrollRefund,
            dateOfLeaving: row.dateOfLeaving,
          }))
        : []

  const policies =
    action === 'delete' && refundEstimate
      ? policiesFromRefund(refundEstimate, activeDeal)
      : action === 'add'
        ? costEstimate.policies
        : []

  const summaryItems: Array<{ label: string; value: string }> = []
  let caption = 'Submission details'
  let notice =
    'Your request will be reviewed by Loop before it is sent to the insurer.'

  if (action === 'edit') {
    const updated = Math.max(correctionBatch.length, 1)
    caption = 'Here is the correction summary'
    summaryItems.push(
      { label: 'Members updated', value: `${updated}` },
      { label: 'Plan and benefit assignments', value: 'Unchanged' },
    )
    if (editProofFileName) {
      summaryItems.push({ label: 'Official ID proof', value: editProofFileName })
    }
  } else if (action === 'delete') {
    caption = 'Here is the deletion summary'
    summaryItems.push({
      label: 'Lives removed',
      value: `${refundEstimate?.totalLivesDeleted ?? 0}`,
    })
    if (method === 'single') {
      summaryItems.push(
        {
          label: 'Employee',
          value: selectedEmployee
            ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}`
            : 'Employee',
        },
        { label: 'Effective date', value: dateOfLeaving || 'Selected date' },
      )
    } else {
      summaryItems.push({
        label: 'Rows needing attention',
        value: `${bulkDeleteRows.filter((row) => row.status === 'fail').length}`,
      })
    }
    notice =
      'Refunds are estimates and may change after the insurer processes the deletion endorsement.'
  } else if (method === 'single-dependant') {
    caption = 'Here is the dependant addition summary'
    summaryItems.push({
      label: 'Dependants added',
      value: `${dependants.length || 1}`,
    })
  }

  if (action === 'add' && scheduled) {
    summaryItems.push({
      label: 'Invitations scheduled for',
      value: enrolment.dueDate,
    })
  } else if (
    action === 'add' &&
    enrolment.runEnrolment !== false &&
    enrolment.mode === 'now'
  ) {
    summaryItems.push({ label: 'Invitations', value: 'Send now' })
  }

  return (
    <SubmittedStage>
      <EndorsementCostPanel
        rows={submittedRows}
        policies={policies}
        isDelete={action === 'delete'}
        caption={caption}
        summaryItems={summaryItems}
        notice={notice}
        showAccess={action === 'add'}
        onDone={() => navigate('/endorsements')}
      />
    </SubmittedStage>
  )
}

function policiesFromRefund(
  estimate: RefundEstimate,
  deal: ReturnType<typeof useLivesWizard>['activeDeal'],
): PolicyCostBreakdown[] {
  return estimate.policiesByCd.flatMap((group) =>
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
      }
    }),
  )
}

const SubmittedStage = styled.div`
  display: flex;
  flex: 1;
  width: 100%;
  min-height: 100vh;
`
