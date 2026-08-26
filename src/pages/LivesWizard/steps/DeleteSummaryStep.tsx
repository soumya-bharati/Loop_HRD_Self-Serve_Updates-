import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { sampleEmployees } from '@/data/employees'
import { RefundSummary } from '@/pages/LivesWizard/components/RefundSummary'
import { FlowStepper, WizardChrome } from '@/pages/LivesWizard/WizardChrome'
import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'

export function DeleteSummaryStep() {
  const navigate = useNavigate()
  const {
    method,
    selectedEmployeeId,
    dateOfLeaving,
    refundEstimate,
    bulkDeleteRows,
    completeFlow,
    setStep,
  } = useLivesWizard()

  const employee = sampleEmployees.find((e) => e.id === selectedEmployeeId)
  const isBulk = method === 'bulk'

  if (!refundEstimate) {
    return null
  }

  return (
    <WizardChrome
      title={isBulk ? 'Bulk delete refund estimate' : 'Deletion & refund summary'}
      onBack={() => setStep(isBulk ? 'bulk-validate' : 'offboard-coverage')}
      onExit={() => navigate('/endorsements')}
      secondaryLabel="Back"
      onSecondary={() => setStep(isBulk ? 'bulk-validate' : 'offboard-coverage')}
      primaryLabel={isBulk ? 'Confirm deletion' : 'Off-board employee'}
      onPrimary={completeFlow}
    >
      <FlowStepper
        steps={
          isBulk
            ? ['Upload', 'Validate', 'Refund estimate']
            : ['Search', 'Leaving date', 'Coverage', 'Refund']
        }
        activeIndex={isBulk ? 2 : 3}
        bare
      />

      {!isBulk && employee ? (
        <Banner>
          Off-boarding as of <strong>{dateOfLeaving}</strong> —{' '}
          {employee.firstName} {employee.lastName} and{' '}
          {employee.dependants.length} dependant
          {employee.dependants.length === 1 ? '' : 's'}. This action removes
          the employee and all dependants together.
        </Banner>
      ) : null}

      {isBulk ? (
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
      ) : null}

      <RefundSummary estimate={refundEstimate} />
    </WizardChrome>
  )
}

const Banner = styled.div`
  padding: 12px 16px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.planeGreenLight};
  font-size: 14px;
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
